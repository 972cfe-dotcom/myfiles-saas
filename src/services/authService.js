// Real Auth Service using Netlify Functions and Neon Database
const API_BASE = import.meta.env.VITE_API_BASE_URL || '/.netlify/functions'

export class AuthService {
  // Helper method to make API calls
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
    
    try {
      const response = await fetch(url, { ...defaultOptions, ...options })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }
      
      return response.json()
    } catch (error) {
      // Log network errors but don't crash the app
      console.error('Network error in AuthService:', error.message)
      throw error
    }
  }

  // Sign up with email and password
  static async signUp(email, password, fullName) {
    try {
      const data = await this.apiCall('/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'register',
          email,
          password,
          fullName
        })
      })

      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      return { user: data.user, session: { access_token: data.token } }
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  // Sign in with email and password
  static async signIn(email, password) {
    try {
      const data = await this.apiCall('/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'login',
          email,
          password
        })
      })

      if (data.token) {
        localStorage.setItem('authToken', data.token)
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      return { user: data.user, session: { access_token: data.token } }
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  // Sign out
  static async signOut() {
    try {
      // Call logout API to invalidate server session
      try {
        await this.apiCall('/auth', {
          method: 'POST',
          body: JSON.stringify({ action: 'logout' })
        })
      } catch (error) {
        // Even if logout API fails, clear local storage
        console.warn('Logout API call failed, clearing local storage anyway:', error)
      }
      
      // Clear local storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      
      // Trigger auth state change
      this._triggerAuthChange(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) return null

      // First try to get from local storage
      const cachedUser = localStorage.getItem('user')
      if (cachedUser) {
        try {
          return JSON.parse(cachedUser)
        } catch {
          // If cached data is corrupted, continue to API call
        }
      }

      // Verify token with server and get fresh user data
      const data = await this.apiCall('/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'verify' })
      })

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
        return data.user
      }

      return null
    } catch (error) {
      console.error('Error getting current user:', error)
      // If token is invalid, clear storage
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      return null
    }
  }

  // Get user profile with extended data
  static async getUserProfile() {
    try {
      const data = await this.apiCall('/auth', {
        method: 'POST',
        body: JSON.stringify({ action: 'profile' })
      })

      return data.user
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  // Update user profile
  static async updateProfile(updates) {
    try {
      const data = await this.apiCall('/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'update-profile',
          ...updates
        })
      })

      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user))
      }

      return data.user
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      await this.apiCall('/auth', {
        method: 'POST',
        body: JSON.stringify({
          action: 'reset-password',
          email
        })
      })
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  // Auth state change listeners
  static _listeners = []
  
  static onAuthStateChange(callback) {
    this._listeners.push(callback)
    
    // Return unsubscribe function
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            this._listeners = this._listeners.filter(listener => listener !== callback)
          }
        }
      }
    }
  }

  static _triggerAuthChange(user) {
    const session = user ? { user, access_token: localStorage.getItem('authToken') } : null
    const event = user ? 'SIGNED_IN' : 'SIGNED_OUT'
    
    this._listeners.forEach(callback => {
      try {
        callback(event, session)
      } catch (error) {
        console.error('Error in auth state change listener:', error)
      }
    })
  }

  // Check if user is authenticated
  static async isAuthenticated() {
    try {
      const user = await this.getCurrentUser()
      return !!user
    } catch {
      return false
    }
  }

  // Get user storage stats
  static async getUserStorageStats() {
    try {
      const data = await this.apiCall('/user-stats')
      return {
        storageUsed: data.storage_used || 0,
        storageLimit: data.storage_limit || 1073741824, // 1GB
        documentsCount: data.documents_count || 0,
        storagePercentage: Math.round((data.storage_used || 0) / (data.storage_limit || 1073741824) * 100)
      }
    } catch (error) {
      console.error('Error getting storage stats:', error)
      return {
        storageUsed: 0,
        storageLimit: 1073741824,
        documentsCount: 0,
        storagePercentage: 0
      }
    }
  }

  // Initialize auth state on app start
  static async initialize() {
    try {
      const user = await this.getCurrentUser()
      if (user) {
        this._triggerAuthChange(user)
      }
    } catch (error) {
      console.error('Error initializing auth:', error)
    }
  }
}