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
        const currentUser = await AuthService.getCurrentUser()
        setUser(currentUser)
        if (currentUser) {
          await loadUserProfile()
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
      } finally {
        setLoading(false)
      }
    }

    initAuth()

    // Listen for auth changes
    const { data: { subscription } } = AuthService.onAuthStateChange(
      async (event, session) => {
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
      const { user } = await AuthService.signIn(email, password)
      return { user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  const signUp = async (email, password, fullName) => {
    try {
      const { user } = await AuthService.signUp(email, password, fullName)
      return { user, error: null }
    } catch (error) {
      return { user: null, error }
    }
  }

  const signOut = async () => {
    try {
      await AuthService.signOut()
      setUser(null)
      setProfile(null)
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