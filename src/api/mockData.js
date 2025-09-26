// Mock data for standalone app
export const mockDocuments = [
  {
    id: '1',
    name: 'דוחות רבעוניים 2024',
    file_name: 'quarterly-report-2024.pdf',
    created_at: '2024-09-20T10:30:00Z',
    created_date: '2024-09-20T10:30:00Z',
    updated_at: '2024-09-20T10:30:00Z',
    created_by: 'demo@example.com',
    size: '2.5 MB',
    file_type: 'pdf',
    document_type: 'other',
    tags: ['דוחות', 'כספים', '2024'],
    content: 'תוכן של דוחות רבעוניים לשנת 2024',
    description: 'דוחות מפורטים על ביצועי החברה ברבעון השני של 2024',
    organization: 'החברה שלי בע"מ'
  },
  {
    id: '2', 
    name: 'מצגת לקוחות חדשה',
    file_name: 'client-presentation.pptx',
    created_at: '2024-09-19T14:15:00Z',
    created_date: '2024-09-19T14:15:00Z',
    updated_at: '2024-09-19T14:15:00Z',
    created_by: 'demo@example.com',
    size: '8.1 MB',
    file_type: 'pptx',
    document_type: 'other',
    tags: ['מצגות', 'לקוחות', 'שיווק'],
    content: 'מצגת לקוחות עם נתונים עדכניים',
    description: 'מצגת מקצועית להצגה בפני לקוחות פוטנציאליים',
    organization: 'מחלקת שיווק'
  },
  {
    id: '3',
    name: 'מדריך משתמש מערכת',
    file_name: 'user-manual.docx', 
    created_at: '2024-09-18T09:45:00Z',
    created_date: '2024-09-18T09:45:00Z',
    updated_at: '2024-09-21T16:20:00Z',
    created_by: 'demo@example.com',
    size: '1.2 MB',
    file_type: 'docx',
    document_type: 'other',
    tags: ['מדריכים', 'מערכת', 'תיעוד'],
    content: 'מדריך מפורט לשימוש במערכת',
    description: 'הוראות מפורטות לשימוש במערכת לניהול מסמכים',
    organization: 'מחלקת IT'
  },
  {
    id: '4',
    name: 'תמונות אירוע החברה',
    file_name: 'company-event-2024.zip',
    created_at: '2024-09-15T18:30:00Z',
    created_date: '2024-09-15T18:30:00Z',
    updated_at: '2024-09-15T18:30:00Z',
    created_by: 'demo@example.com',
    size: '45.7 MB',
    file_type: 'zip',
    document_type: 'other',
    tags: ['תמונות', 'אירועים', 'חברה'],
    content: 'אוסף תמונות מאירוע השנה של החברה',
    description: 'תמונות מהאירוע השנתי של החברה שהתקיים בספטמבר 2024',
    organization: 'משאבי אנוש'
  }
];

export const mockUser = {
  id: '1',
  name: 'משתמש דמו',
  email: 'demo@example.com',
  role: 'admin',
  avatar: null
};

export const mockSavedSearches = [
  {
    id: '1',
    name: 'דוחות 2024',
    query: 'דוחות',
    tags: ['2024', 'דוחות'],
    created_at: '2024-09-10T12:00:00Z'
  },
  {
    id: '2', 
    name: 'מסמכי שיווק',
    query: 'שיווק',
    tags: ['שיווק', 'לקוחות'],
    created_at: '2024-09-08T15:30:00Z'
  }
];

// Simple in-memory storage with localStorage persistence
class MockStorage {
  constructor() {
    this.documents = this.loadFromStorage('documents', mockDocuments);
    this.savedSearches = this.loadFromStorage('savedSearches', mockSavedSearches);
    this.user = this.loadFromStorage('user', mockUser);
  }

  loadFromStorage(key, defaultValue) {
    try {
      const stored = localStorage.getItem(`myfiles_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  }

  saveToStorage(key, data) {
    try {
      localStorage.setItem(`myfiles_${key}`, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
    }
  }

  // Documents
  async getDocuments() {
    return [...this.documents];
  }

  async addDocument(doc) {
    const newDoc = {
      ...doc,
      id: Date.now().toString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    this.documents.push(newDoc);
    this.saveToStorage('documents', this.documents);
    return newDoc;
  }

  async updateDocument(id, updates) {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index !== -1) {
      this.documents[index] = {
        ...this.documents[index],
        ...updates,
        updated_at: new Date().toISOString()
      };
      this.saveToStorage('documents', this.documents);
      return this.documents[index];
    }
    throw new Error('Document not found');
  }

  async deleteDocument(id) {
    const index = this.documents.findIndex(doc => doc.id === id);
    if (index !== -1) {
      this.documents.splice(index, 1);
      this.saveToStorage('documents', this.documents);
      return true;
    }
    return false;
  }

  // Saved Searches
  async getSavedSearches() {
    return [...this.savedSearches];
  }

  async addSavedSearch(search) {
    const newSearch = {
      ...search,
      id: Date.now().toString(),
      created_at: new Date().toISOString()
    };
    this.savedSearches.push(newSearch);
    this.saveToStorage('savedSearches', this.savedSearches);
    return newSearch;
  }

  async deleteSavedSearch(id) {
    const index = this.savedSearches.findIndex(search => search.id === id);
    if (index !== -1) {
      this.savedSearches.splice(index, 1);
      this.saveToStorage('savedSearches', this.savedSearches);
      return true;
    }
    return false;
  }

  // User
  async getUser() {
    return { ...this.user };
  }

  async updateUser(updates) {
    this.user = { ...this.user, ...updates };
    this.saveToStorage('user', this.user);
    return this.user;
  }
}

export const mockStorage = new MockStorage();