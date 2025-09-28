import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import LoginForm from '@/components/auth/LoginForm'
import SignUpForm from '@/components/auth/SignUpForm'
import { useAuth } from '@/components/auth/AuthProvider'
import { FileText } from 'lucide-react'

export default function Auth() {
  const [mode, setMode] = useState('login') // 'login' or 'signup'
  const { user, loading } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    console.log('Auth: useEffect - user:', !!user, 'loading:', loading)
    if (user && !loading) {
      console.log('Auth: User found, navigating to dashboard...')
      // Use replace to prevent back button issues and ensure clean navigation
      navigate('/dashboard', { replace: true })
    }
  }, [user, loading, navigate])

  const handleSuccess = () => {
    console.log('Auth: handleSuccess called, navigating to dashboard...')
    // Force navigation with replace to prevent back button issues
    navigate('/dashboard', { replace: true })
  }

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo and Title */}
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-indigo-600 p-3 rounded-full">
              <FileText className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">MyFiles SaaS</h1>
          <p className="text-gray-600 mt-2">ניהול מסמכים חכם ומתקדם</p>
        </div>

        {/* Auth Form */}
        {mode === 'login' ? (
          <LoginForm 
            onToggleMode={toggleMode}
            onSuccess={handleSuccess}
          />
        ) : (
          <SignUpForm 
            onToggleMode={toggleMode}
            onSuccess={handleSuccess}
          />
        )}

        {/* Features Preview */}
        <div className="mt-8 text-center">
          <div className="bg-white/50 backdrop-blur-sm rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">מה תקבל במערכת?</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>העלאה וארגון מסמכים</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>חיפוש מתקדם בתוכן</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>צפייה ועריכת PDF</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>גיבוי אוטומטי ובטוח</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}