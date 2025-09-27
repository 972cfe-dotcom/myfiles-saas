import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, Eye, EyeOff } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function LoginForm({ onToggleMode, onSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { signIn } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      console.log('LoginForm: Starting login attempt...')
      const { user, error: signInError } = await signIn(email, password)
      
      if (signInError) {
        console.log('LoginForm: Login error:', signInError)
        setError(getErrorMessage(signInError.message))
      } else if (user) {
        console.log('LoginForm: Login successful, calling onSuccess')
        // Small delay to ensure state updates are processed
        setTimeout(() => {
          onSuccess?.()
        }, 100)
      }
    } catch (err) {
      console.error('LoginForm: Login exception:', err)
      setError('אירעה שגיאה בהתחברות. אנא נסה שוב.')
    } finally {
      setLoading(false)
    }
  }

  const getErrorMessage = (message) => {
    if (message.includes('Invalid login credentials')) {
      return 'כתובת האימייל או הסיסמה שגויים'
    }
    if (message.includes('Email not confirmed')) {
      return 'אנא אמת את כתובת האימייל שלך לפני ההתחברות'
    }
    if (message.includes('Too many requests')) {
      return 'יותר מדי ניסיונות התחברות. אנא חכה מספר דקות ונסה שוב'
    }
    return 'אירעה שגיאה בהתחברות. אנא נסה שוב.'
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">התחברות למערכת</CardTitle>
        <CardDescription>
          הזן את פרטי ההתחברות שלך כדי לגשת למסמכים שלך
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
            <Label htmlFor="email">כתובת אימייל</Label>
            <div className="relative">
              <Mail className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
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
          
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !email || !password}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                מתחבר...
              </>
            ) : (
              'התחבר'
            )}
          </Button>
        </form>
        
        <div className="mt-6 text-center space-y-2">
          <button
            type="button"
            onClick={() => {/* TODO: Implement forgot password */}}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            שכחת סיסמה?
          </button>
          
          <div className="text-sm text-muted-foreground">
            אין לך חשבון?{' '}
            <button
              type="button"
              onClick={onToggleMode}
              className="text-primary hover:underline font-medium"
            >
              הרשם עכשיו
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}