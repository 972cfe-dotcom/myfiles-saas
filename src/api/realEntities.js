import { DocumentsService } from '../services/documentsService'
import { AuthService } from '../services/authService'

// Real entities that connect to Netlify Functions and Neon Database
export const Document = {
  async list() {
    return await DocumentsService.getUserDocuments()
  },
  
  async filter(criteria = {}) {
    const options = {}
    
    // Map criteria to API parameters
    if (criteria.created_by) {
      // For now, we'll assume this means "get current user's documents"
      // since we can't filter by other users due to security
    }
    
    if (criteria.text_search) {
      return await DocumentsService.searchDocuments(criteria.text_search, options)
    }
    
    if (criteria.categoryId) {
      options.categoryId = criteria.categoryId
    }
    
    return await DocumentsService.getUserDocuments(options)
  },
  
  async create(data) {
    return await DocumentsService.createDocument(data)
  },
  
  async update(id, data) {
    return await DocumentsService.updateDocument(id, data)
  },
  
  async delete(id) {
    return await DocumentsService.deleteDocument(id)
  },

  async get(id) {
    return await DocumentsService.getDocument(id)
  }
}

export const DocumentPermission = {
  // Permission management - for future implementation
  async list() {
    return []
  }
}

export const SavedSearch = {
  // Saved searches - stored in localStorage for now
  async list() {
    const saved = localStorage.getItem('savedSearches')
    return saved ? JSON.parse(saved) : []
  },
  
  async create(data) {
    const searches = await this.list()
    const newSearch = {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    }
    searches.push(newSearch)
    localStorage.setItem('savedSearches', JSON.stringify(searches))
    return newSearch
  },
  
  async delete(id) {
    const searches = await this.list()
    const filtered = searches.filter(search => search.id !== id)
    localStorage.setItem('savedSearches', JSON.stringify(filtered))
    return true
  }
}

export const DocumentActivity = {
  async list() {
    // Activity logs - for future implementation
    return []
  },
  
  async create(data) {
    // Log activity - just console log for now
    console.log('Document activity logged:', data)
    return {
      id: Date.now().toString(),
      ...data,
      created_at: new Date().toISOString()
    }
  }
}

export const SharedAccess = {
  async list() {
    // Shared access - for future implementation
    return []
  },
  
  async filter(criteria = {}) {
    // Shared access filtering - for future implementation
    return []
  }
}

// Real user management
export const User = {
  async getCurrentUser() {
    return await AuthService.getCurrentUser()
  },
  
  async me() {
    const user = await AuthService.getCurrentUser()
    return user
  },
  
  async updateProfile(data) {
    return await AuthService.updateProfile(data)
  },
  
  get isAuthenticated() {
    return !!localStorage.getItem('authToken')
  }
}

// Categories
export const Category = {
  async list() {
    return await DocumentsService.getUserCategories()
  },
  
  async create(data) {
    return await DocumentsService.createCategory(data)
  }
}

// Document statistics
export const DocumentStats = {
  async get() {
    return await DocumentsService.getDocumentStats()
  }
}