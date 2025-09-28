// Real Documents Service using Netlify Functions and Neon Database
const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://symphonious-cuchufli-e6125a.netlify.app/.netlify/functions'
const IS_DEVELOPMENT = import.meta.env.DEV

export class DocumentsService {
  // Helper method to make API calls with auth - PRODUCTION ONLY
  static async apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const token = localStorage.getItem('authToken')
    
    console.log('🔍 API Call to PRODUCTION:', {
      endpoint,
      url,
      hasToken: !!token,
      method: options.method || 'GET'
    })
    
    if (!token) {
      throw new Error('No authentication token found. Please log in first.')
    }
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers
      }
    }
    
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    console.log('📡 PRODUCTION API Response:', {
      status: response.status,
      ok: response.ok,
      url: response.url
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      console.error('❌ PRODUCTION API Error:', errorData)
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  // Get user documents - PRODUCTION ONLY
  static async getUserDocuments(options = {}) {
    const params = new URLSearchParams()
    if (options.categoryId) params.append('categoryId', options.categoryId)
    if (options.search) params.append('search', options.search)
    if (options.limit) params.append('limit', options.limit)
    
    const queryString = params.toString()
    const endpoint = `/documents${queryString ? `?${queryString}` : ''}`
    
    const data = await this.apiCall(endpoint, {
      method: 'GET'
    })

    console.log('📄 Documents fetched from NEON DB:', data.documents?.length || 0, 'documents')
    return data.documents || []
  }



  // Get single document
  static async getDocument(documentId) {
    try {
      const data = await this.apiCall(`/documents/${documentId}`, {
        method: 'GET'
      })

      return data.document
    } catch (error) {
      console.error('Error fetching document:', error)
      return null
    }
  }

  // Create new document - PRODUCTION ONLY
  static async createDocument(documentData) {
    console.log('💾 Creating document with data:', documentData)
    
    // Send data with both camelCase and snake_case field names for compatibility
    const dbDocumentData = {
      title: documentData.title,
      description: documentData.description || '',
      // Send both formats
      fileName: documentData.original_filename || documentData.file_name,
      file_name: documentData.original_filename || documentData.file_name,
      fileType: documentData.file_type,
      file_type: documentData.file_type,
      fileSize: documentData.file_size,
      file_size: documentData.file_size,
      fileUrl: documentData.file_url,
      file_url: documentData.file_url,
      thumbnailUrl: documentData.thumbnail_url || null,
      thumbnail_url: documentData.thumbnail_url || null,
      mimeType: documentData.mime_type || null,
      mime_type: documentData.mime_type || null,
      contentExtracted: documentData.extracted_text || documentData.content_extracted,
      content_extracted: documentData.extracted_text || documentData.content_extracted,
      extracted_text: documentData.extracted_text,
      categoryId: documentData.category_id || null,
      category_id: documentData.category_id || null,
      fileHash: documentData.file_hash || null,
      file_hash: documentData.file_hash || null
    }

    console.log('🗃️ Mapped DB data with both formats:', dbDocumentData)

    const data = await this.apiCall('/documents', {
      method: 'POST',
      body: JSON.stringify(dbDocumentData)
    })

    console.log('✅ Document created successfully in NEON DB:', data.document)
    return data.document
  }



  // Update document
  static async updateDocument(documentId, updates) {
    try {
      const data = await this.apiCall(`/documents/${documentId}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      })

      return data.document
    } catch (error) {
      console.error('Error updating document:', error)
      throw error
    }
  }

  // Delete document
  static async deleteDocument(documentId) {
    try {
      await this.apiCall(`/documents/${documentId}`, {
        method: 'DELETE'
      })

      return true
    } catch (error) {
      console.error('Error deleting document:', error)
      throw error
    }
  }

  // Search documents
  static async searchDocuments(query, options = {}) {
    try {
      const params = new URLSearchParams()
      params.append('q', query)
      if (options.limit) params.append('limit', options.limit)
      
      const data = await this.apiCall(`/documents/search?${params.toString()}`, {
        method: 'GET'
      })

      return data.documents || []
    } catch (error) {
      console.error('Error searching documents:', error)
      return []
    }
  }

  // Get user categories
  static async getUserCategories() {
    try {
      const data = await this.apiCall('/categories', {
        method: 'GET'
      })

      return data.categories || []
    } catch (error) {
      console.error('Error fetching categories:', error)
      return []
    }
  }

  // Create category
  static async createCategory(categoryData) {
    try {
      const data = await this.apiCall('/categories', {
        method: 'POST',
        body: JSON.stringify(categoryData)
      })

      return data.category
    } catch (error) {
      console.error('Error creating category:', error)
      throw error
    }
  }

  // Get document statistics
  static async getDocumentStats() {
    try {
      const data = await this.apiCall('/documents/stats', {
        method: 'GET'
      })

      return data.stats || {
        count: 0,
        categories_count: 0,
        tags_count: 0
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
      return {
        count: 0,
        categories_count: 0,
        tags_count: 0
      }
    }
  }
}