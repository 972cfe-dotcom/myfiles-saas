// Real Documents Service using Netlify Functions and Neon Database
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions'

export class DocumentsService {
  // Helper method to make API calls with auth
  static async apiCall(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`
    const token = localStorage.getItem('authToken')
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers
      }
    }
    
    const response = await fetch(url, { ...defaultOptions, ...options })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }
    
    return response.json()
  }

  // Get user documents
  static async getUserDocuments(options = {}) {
    try {
      const params = new URLSearchParams()
      if (options.categoryId) params.append('categoryId', options.categoryId)
      if (options.search) params.append('search', options.search)
      if (options.limit) params.append('limit', options.limit)
      
      const queryString = params.toString()
      const endpoint = `/documents${queryString ? `?${queryString}` : ''}`
      
      const data = await this.apiCall(endpoint, {
        method: 'GET'
      })

      return data.documents || []
    } catch (error) {
      console.error('Error fetching documents:', error)
      // Fallback: get from localStorage
      return this.getUserDocumentsLocal(options)
    }
  }

  // Local fallback for getting documents
  static getUserDocumentsLocal(options = {}) {
    try {
      const documents = JSON.parse(localStorage.getItem('documents') || '[]')
      
      let filtered = [...documents]
      
      // Apply search filter
      if (options.search) {
        const searchLower = options.search.toLowerCase()
        filtered = filtered.filter(doc => 
          doc.title?.toLowerCase().includes(searchLower) ||
          doc.description?.toLowerCase().includes(searchLower) ||
          doc.file_name?.toLowerCase().includes(searchLower)
        )
      }
      
      // Apply limit
      if (options.limit) {
        filtered = filtered.slice(0, options.limit)
      }
      
      return filtered
    } catch (error) {
      console.error('Error getting local documents:', error)
      return []
    }
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

  // Create new document
  static async createDocument(documentData) {
    try {
      const data = await this.apiCall('/documents', {
        method: 'POST',
        body: JSON.stringify(documentData)
      })

      return data.document
    } catch (error) {
      console.error('Error creating document:', error)
      // Fallback: save to localStorage when server is not available
      return this.createDocumentLocal(documentData)
    }
  }

  // Local fallback for creating documents
  static createDocumentLocal(documentData) {
    try {
      // Get existing documents from localStorage
      const existingDocs = JSON.parse(localStorage.getItem('documents') || '[]')
      
      // Create new document with ID
      const newDocument = {
        ...documentData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      // Add to list and save
      existingDocs.push(newDocument)
      localStorage.setItem('documents', JSON.stringify(existingDocs))
      
      console.log('Document saved locally:', newDocument.title)
      return newDocument
    } catch (error) {
      console.error('Error saving document locally:', error)
      throw new Error('Failed to save document')
    }
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