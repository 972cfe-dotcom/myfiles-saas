import { supabase, TABLES, STORAGE_BUCKETS } from '../lib/supabase.js'

export class DocumentService {
  // Upload document with file and metadata
  static async uploadDocument(file, metadata = {}) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // 1. Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .upload(filePath, file)

      if (uploadError) throw uploadError

      // 2. Extract text content (if PDF)
      let extractedText = ''
      if (file.type === 'application/pdf') {
        extractedText = await this.extractTextFromFile(file)
      }

      // 3. Create document record in database
      const documentData = {
        user_id: user.id,
        title: metadata.title || file.name.replace(/\.[^/.]+$/, ""),
        description: metadata.description || '',
        file_name: file.name,
        file_type: this.getFileType(file.type),
        file_size: file.size,
        file_path: filePath,
        mime_type: file.type,
        content_extracted: extractedText,
        category_id: metadata.categoryId || null,
        status: 'ready'
      }

      const { data: document, error: dbError } = await supabase
        .from(TABLES.DOCUMENTS)
        .insert(documentData)
        .select()
        .single()

      if (dbError) throw dbError

      // 4. Add tags if provided
      if (metadata.tags && metadata.tags.length > 0) {
        await this.addTagsToDocument(document.id, metadata.tags)
      }

      return document
    } catch (error) {
      console.error('Error uploading document:', error)
      throw error
    }
  }

  // Get all documents for current user
  static async getUserDocuments(options = {}) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      let query = supabase
        .from(TABLES.DOCUMENTS)
        .select(`
          *,
          category:categories(id, name, color),
          document_tags(
            tag:tags(id, name, color)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      // Apply filters
      if (options.categoryId) {
        query = query.eq('category_id', options.categoryId)
      }
      
      if (options.fileType) {
        query = query.eq('file_type', options.fileType)
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,content_extracted.ilike.%${options.search}%`)
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      
      if (options.offset) {
        query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
      }

      const { data, error } = await query

      if (error) throw error

      // Process tags (flatten the nested structure)
      return data.map(doc => ({
        ...doc,
        tags: doc.document_tags?.map(dt => dt.tag) || []
      }))
    } catch (error) {
      console.error('Error fetching documents:', error)
      throw error
    }
  }

  // Get single document with content
  static async getDocument(documentId) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.DOCUMENTS)
        .select(`
          *,
          category:categories(id, name, color),
          document_tags(
            tag:tags(id, name, color)
          )
        `)
        .eq('id', documentId)
        .eq('user_id', user.id)
        .single()

      if (error) throw error

      // Update last accessed time
      await supabase
        .from(TABLES.DOCUMENTS)
        .update({ last_accessed_at: new Date().toISOString() })
        .eq('id', documentId)

      return {
        ...data,
        tags: data.document_tags?.map(dt => dt.tag) || []
      }
    } catch (error) {
      console.error('Error fetching document:', error)
      throw error
    }
  }

  // Download document file
  static async downloadDocument(documentId) {
    try {
      const document = await this.getDocument(documentId)
      
      const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .download(document.file_path)

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error downloading document:', error)
      throw error
    }
  }

  // Update document metadata
  static async updateDocument(documentId, updates) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.DOCUMENTS)
        .update(updates)
        .eq('id', documentId)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  }

  // Delete document
  static async deleteDocument(documentId) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Get document to get file path
      const document = await this.getDocument(documentId)

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(STORAGE_BUCKETS.DOCUMENTS)
        .remove([document.file_path])

      if (storageError) console.warn('Error deleting file from storage:', storageError)

      // Delete from database (this will cascade delete document_tags)
      const { error } = await supabase
        .from(TABLES.DOCUMENTS)
        .delete()
        .eq('id', documentId)
        .eq('user_id', user.id)

      if (error) throw error
      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  // Search documents
  static async searchDocuments(query, options = {}) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      // Save search to history
      await supabase
        .from(TABLES.SEARCH_HISTORY)
        .insert({
          user_id: user.id,
          query,
          filters: options
        })

      // Perform search using PostgreSQL full-text search
      const { data, error } = await supabase
        .from(TABLES.DOCUMENTS)
        .select(`
          *,
          category:categories(id, name, color),
          document_tags(
            tag:tags(id, name, color)
          )
        `)
        .eq('user_id', user.id)
        .textSearch('content_extracted', query, {
          type: 'websearch',
          config: 'hebrew'
        })
        .order('created_at', { ascending: false })
        .limit(options.limit || 50)

      if (error) throw error

      return data.map(doc => ({
        ...doc,
        tags: doc.document_tags?.map(dt => dt.tag) || []
      }))
    } catch (error) {
      console.error('Error searching documents:', error)
      throw error
    }
  }

  // Helper methods
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  static getFileType(mimeType) {
    const typeMap = {
      'application/pdf': 'pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
      'application/msword': 'docx',
      'text/plain': 'txt',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
      'application/vnd.ms-excel': 'xlsx',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'pptx',
      'application/vnd.ms-powerpoint': 'pptx'
    }

    if (mimeType.startsWith('image/')) return 'image'
    return typeMap[mimeType] || 'pdf'
  }

  static async extractTextFromFile(file) {
    // This will use the same PDF.js logic we already have
    // For now, return empty string and implement later
    return ''
  }

  static async addTagsToDocument(documentId, tagNames) {
    try {
      const user = await this.getCurrentUser()
      if (!user) return

      for (const tagName of tagNames) {
        // Create tag if it doesn't exist
        const { data: existingTag } = await supabase
          .from(TABLES.TAGS)
          .select('id')
          .eq('name', tagName)
          .eq('user_id', user.id)
          .single()

        let tagId = existingTag?.id

        if (!tagId) {
          const { data: newTag } = await supabase
            .from(TABLES.TAGS)
            .insert({ name: tagName, user_id: user.id })
            .select('id')
            .single()
          tagId = newTag?.id
        }

        if (tagId) {
          // Link tag to document
          await supabase
            .from('document_tags')
            .insert({ document_id: documentId, tag_id: tagId })
        }
      }
    } catch (error) {
      console.error('Error adding tags to document:', error)
    }
  }
}