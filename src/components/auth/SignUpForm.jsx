import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, User, Eye, EyeOff } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function SignUpForm({ onToggleMode, onSuccess }) {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signUp } = useAuth()

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const validateForm = () => {
    if (!formData.fullName.trim()) {
      setError('אנא הזן שם מלא')
      return false
    }
    
    if (!formData.email) {
      setError('אנא הזן כתובת אימייל')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים')
      return false
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('הסיסמאות לא תואמות')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!validateForm()) return
    
    setLoading(true)

    try {
      const { user, error: signUpError } = await signUp(
        formData.email,
        formData.password,
        formData.fullName
      )
      
      if (signUpError) {
        setError(getErrorMessage(signUpError.message))
      } else if (user) {
        onSuccess?.()
      }
    } catch (err) {
      setError('אירעה שגיאה ביצירת החשבון. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (message) => {
    if (message.includes('User already registered')) {
      return 'משתמש עם כתובת אימייל זו כבר רשום במערכת'
    }
    if (message.includes('Password should be at least')) {
      return 'הסיסמה חייבת להכיל לפחות 6 תווים'
    }
    if (message.includes('Invalid email')) {
      return 'כתובת האימייל לא תקינה'
    }
    return 'אירעה שגיאה ביצירת החשבון. אנא נסה שוב.'
  }

  const isFormValid = formData.fullName.trim() && 
                     formData.email && 
                     formData.password.length >= 6 && 
                     formData.password === formData.confirmPassword

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">יצירת חשבון חדש</CardTitle>
        <CardDescription>
          הצטרף לMyFiles SaaS ותתחיל לנהל את המסמכים שלך בצורה חכמה
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="fullName">שם מלא</Label>
            <div className="relative">
              <User className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                value={formData.fullName}
                onChange={(e) => handleInputChange('fullName', e.target.value)}
                placeholder="השם המלא שלך"
                className="pr-10"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">כתובת אימייל</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="your@email.com"
                className="pr-10"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="לפחות 6 תווים"
                className="pr-10 pl-10"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-3 text-muted-foreground hover:text-foreground"
                disabled={loading}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">אימות סיסמה</Label>
            <div className="relative">
              <Lock className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                placeholder="הזן את הסיסמה שוב"
                className="pr-10"
                required
                disabled={loading}
              />
            </div>
          </div>
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !isFormValid}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                יוצר חשבון...
              </>
            ) : (
              'צור חשבון'
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center">
          <div className="text-sm text-muted-foreground">
            יש לך כבר חשבון?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-primary hover:underline font-medium"
            >
              התחבר כאן
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}