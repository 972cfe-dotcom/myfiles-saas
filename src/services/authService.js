import { supabase, TABLES } from '../lib/supabase.js'

export class AuthService {
  // Sign up with email and password
  static async signUp(email, password, fullName) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    }
  }

  // Sign in with email and password
  static async signIn(email, password) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      return data
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    }
  }

  // Sign out
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // Get current user
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error) throw error
      return user
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Get user profile with extended data
  static async getUserProfile() {
    try {
      const user = await this.getCurrentUser()
      if (!user) return null

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error getting user profile:', error)
      return null
    }
  }

  // Update user profile
  static async updateProfile(updates) {
    try {
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data, error } = await supabase
        .from(TABLES.USERS)
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  // Reset password
  static async resetPassword(email) {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  // Listen to auth state changes
  static onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
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
      const user = await this.getCurrentUser()
      if (!user) throw new Error('User not authenticated')

      const { data: profile } = await supabase
        .from(TABLES.USERS)
        .select('storage_used, storage_limit')
        .eq('id', user.id)
        .single()

      const { count: documentsCount } = await supabase
        .from(TABLES.DOCUMENTS)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)

      return {
        storageUsed: profile?.storage_used || 0,
        storageLimit: profile?.storage_limit || 1073741824, // 1GB
        documentsCount: documentsCount || 0,
        storagePercentage: Math.round((profile?.storage_used || 0) / (profile?.storage_limit || 1073741824) * 100)
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
}