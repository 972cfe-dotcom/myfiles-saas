import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { DatabaseService } from '../../src/lib/neon.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const JWT_EXPIRES = '7d'

// Helper function to generate JWT
const generateToken = (user) => {
  return jwt.sign(
    { 
      userId: user.id, 
      email: user.email,
      fullName: user.full_name 
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES }
  )
}

// Helper function to verify JWT
const verifyToken = (token) => {
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Helper function to hash password
const hashPassword = async (password) => {
  return await bcrypt.hash(password, 12)
}

// Helper function to verify password
const verifyPassword = async (password, hash) => {
  return await bcrypt.compare(password, hash)
}

// Main handler
export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    const { action, ...data } = JSON.parse(event.body)

    switch (action) {
      case 'register':
        return await handleRegister(data, headers)
      
      case 'login':
        return await handleLogin(data, headers)
      
      case 'verify':
        return await handleVerifyToken(data, headers)
      
      case 'profile':
        return await handleGetProfile(data, headers, event)
      
      case 'update-profile':
        return await handleUpdateProfile(data, headers, event)
      
      case 'logout':
        return await handleLogout(data, headers, event)
      
      case 'reset-password':
        return await handleResetPassword(data, headers)
      
      default:
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: 'Invalid action' })
        }
    }
  } catch (error) {
    console.error('Auth function error:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      })
    }
  }
}

// Register new user
async function handleRegister(data, headers) {
  const { email, password, fullName } = data

  if (!email || !password || !fullName) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Missing required fields' })
    }
  }

  if (password.length < 6) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Password must be at least 6 characters' })
    }
  }

  try {
    // Check if user exists
    const existingUser = await DatabaseService.getUserByEmail(email)
    if (existingUser) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User already exists' })
      }
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password)
    const user = await DatabaseService.createUser({
      email,
      passwordHash,
      fullName
    })

    // Generate token
    const token = generateToken(user)

    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({
        message: 'User created successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name
        },
        token
      })
    }
  } catch (error) {
    console.error('Registration error:', error)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Login user
async function handleLogin(data, headers) {
  const { email, password } = data

  if (!email || !password) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email and password are required' })
    }
  }

  try {
    // Get user by email
    const user = await DatabaseService.getUserByEmail(email)
    if (!user) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password_hash)
    if (!isValidPassword) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Invalid credentials' })
      }
    }

    // Update last login
    await DatabaseService.updateUser(user.id, { 
      last_login: new Date().toISOString() 
    })

    // Generate token
    const token = generateToken(user)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          planType: user.plan_type,
          storageUsed: user.storage_used,
          storageLimit: user.storage_limit
        },
        token
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Handle logout
async function handleLogout(data, headers, event) {
  return {
    statusCode: 200,
    headers,
    body: JSON.stringify({ message: 'Logged out successfully' })
  }
}

// Handle password reset
async function handleResetPassword(data, headers) {
  const { email } = data

  if (!email) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Email is required' })
    }
  }

  try {
    // Check if user exists
    const user = await DatabaseService.getUserByEmail(email)
    
    if (!user) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          message: 'If this email exists, password reset instructions have been sent.' 
        })
      }
    }

    // Generate reset token
    const resetToken = generateToken({ email, type: 'reset' })
    
    // Store reset token in database
    await DatabaseService.setResetToken(user.id, resetToken)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'If this email exists, password reset instructions have been sent.',
        ...(process.env.NODE_ENV === 'development' && { resetToken })
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Verify token
async function handleVerifyToken(data, headers) {
  const { token } = data

  if (!token) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: 'Token is required' })
    }
  }

  try {
    const decoded = verifyToken(token)
    const user = await DatabaseService.getUserById(decoded.userId)

    if (!user) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          planType: user.plan_type,
          storageUsed: user.storage_used,
          storageLimit: user.storage_limit
        }
      })
    }
  } catch (error) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ 
        valid: false, 
        error: 'Invalid token' 
      })
    }
  }
}

// Get user profile
async function handleGetProfile(data, headers, event) {
  const token = event.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authorization required' })
    }
  }

  try {
    const decoded = verifyToken(token)
    const user = await DatabaseService.getUserById(decoded.userId)

    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          planType: user.plan_type,
          storageUsed: user.storage_used,
          storageLimit: user.storage_limit,
          createdAt: user.created_at
        }
      })
    }
  } catch (error) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Invalid token' })
    }
  }
}

// Update user profile
async function handleUpdateProfile(data, headers, event) {
  const token = event.headers.authorization?.replace('Bearer ', '')
  
  if (!token) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Authorization required' })
    }
  }

  try {
    const decoded = verifyToken(token)
    const { fullName, ...otherUpdates } = data

    const updates = { full_name: fullName, ...otherUpdates }
    const user = await DatabaseService.updateUser(decoded.userId, updates)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        message: 'Profile updated successfully',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          planType: user.plan_type,
          storageUsed: user.storage_used,
          storageLimit: user.storage_limit
        }
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}