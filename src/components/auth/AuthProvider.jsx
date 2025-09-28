import React, { createContext, useContext, useEffect, useState } from 'react'
import { AuthService } from '../../services/authService'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState(null)

  useEffect(() => {
    // Initialize auth and get initial user
    const initAuth = async () => {
      try {
        console.log('AuthProvider: Initializing auth...')
        const currentUser = await AuthService.getCurrentUser()
        console.log('AuthProvider: Current user:', !!currentUser)
        setUser(currentUser)
        if (currentUser) {
          await loadUserProfile()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
        console.log('AuthProvider: Initialization complete')
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
        console.log('AuthProvider: Auth state change:', event, !!session?.user)
        const sessionUser = session?.user ?? null
        setUser(sessionUser)
        
        if (sessionUser) {
          await loadUserProfile()
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async () => {
    try {
      const userProfile = await AuthService.getUserProfile()
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user profile:', error)
    }
  }

  const signIn = async (email, password) => {
    try {
      console.log('AuthProvider: Starting sign in...')
      const { user } = await AuthService.signIn(email, password)
      console.log('AuthProvider: Sign in successful, user:', user)
      
      // Update local state immediately
      setUser(user)
      setLoading(false)
      console.log('AuthProvider: User state updated')
      
      // Trigger auth state change event for consistency
      AuthService._triggerAuthChange(user)
      console.log('AuthProvider: Auth state change triggered')
      
      // Load full profile
      await loadUserProfile()
      console.log('AuthProvider: Profile loaded')
      
      return { user, error: null }
    } catch (error) {
      console.error('AuthProvider: Sign in error:', error)
      setLoading(false)
      return { user: null, error }
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      const { user } = await AuthService.signUp(email, password, fullName)
      
      // Update local state immediately
      setUser(user)
      setLoading(false)
      
      // Trigger auth state change event for consistency
      AuthService._triggerAuthChange(user)
      
      // Load full profile
      await loadUserProfile()
      
      return { user, error: null }
    } catch (error) {
      setLoading(false)
      return { user: null, error }
    }
  }

  const signOut = async () => {
    try {
      console.log('AuthProvider: Starting sign out...')
      await AuthService.signOut()
      console.log('AuthProvider: Sign out API call completed')
      setUser(null)
      setProfile(null)
      console.log('AuthProvider: User state cleared')
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const updateProfile = async (updates) => {
    try {
      const updatedProfile = await AuthService.updateProfile(updates)
      setProfile(updatedProfile)
      return { data: updatedProfile, error: null }
    } catch (error) {
      return { data: null, error }
    }
  }

  const resetPassword = async (email) => {
    try {
      await AuthService.resetPassword(email)
      return { error: null }
    } catch (error) {
      return { error }
    }
  }

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    updateProfile,
    resetPassword,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}