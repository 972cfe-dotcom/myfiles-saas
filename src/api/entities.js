import { mockStorage } from './mockData';

// Mock entities for standalone app
export const Document = {
  async list() {
    return await mockStorage.getDocuments();
  },
  
  async filter(criteria = {}) {
    const documents = await mockStorage.getDocuments();
    
    // Simple filtering based on criteria
    if (!criteria || Object.keys(criteria).length === 0) {
      return documents;
    }
    
    return documents.filter(doc => {
      for (const [key, value] of Object.entries(criteria)) {
        if (key === 'created_by' && doc.created_by !== value) {
          return false;
        }
        // Add more filtering logic as needed
      }
      return true;
    });
  },
  
  async create(data) {
    return await mockStorage.addDocument(data);
  },
  
  async update(id, data) {
    return await mockStorage.updateDocument(id, data);
  },
  
  async delete(id) {
    return await mockStorage.deleteDocument(id);
  }
};

export const DocumentPermission = {
  // Mock permission management
  async list() {
    return [];
  }
};

export const SavedSearch = {
  async list() {
    return await mockStorage.getSavedSearches();
  },
  
  async create(data) {
    return await mockStorage.addSavedSearch(data);
  },
  
  async delete(id) {
    return await mockStorage.deleteSavedSearch(id);
  }
};

export const DocumentActivity = {
  async list() {
    return [];
  }
};

export const SharedAccess = {
  async list() {
    return [];
  },
  
  async filter(criteria = {}) {
    // Mock shared access - return empty for now
    return [];
  }
};

// Mock user authentication
export const User = {
  async getCurrentUser() {
    return await mockStorage.getUser();
  },
  
  async me() {
    return await mockStorage.getUser();
  },
  
  async updateProfile(data) {
    return await mockStorage.updateUser(data);
  },
  
  isAuthenticated: true
};