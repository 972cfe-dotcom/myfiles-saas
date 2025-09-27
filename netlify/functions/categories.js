import jwt from 'jsonwebtoken'
import { DatabaseService } from '../../src/lib/neon.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

// Helper function to verify JWT and get user
const verifyTokenAndGetUser = async (authHeader) => {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Authorization token required')
  }

  const token = authHeader.replace('Bearer ', '')
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET)
    const user = await DatabaseService.getUserById(decoded.userId)
    
    if (!user) {
      throw new Error('User not found')
    }
    
    return user
  } catch (error) {
    throw new Error('Invalid token')
  }
}

// Main handler
export const handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  try {
    // Get user from token
    const user = await verifyTokenAndGetUser(event.headers.authorization)
    
    const method = event.httpMethod

    // Route requests
    if (method === 'GET') {
      return await handleGetCategories(user, headers)
    } else if (method === 'POST') {
      return await handleCreateCategory(user, event, headers)
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Method not found' })
      }
    }

  } catch (error) {
    console.error('Categories function error:', error)
    
    if (error.message.includes('token') || error.message.includes('Authorization')) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Unauthorized' })
      }
    }
    
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

// Get user categories
async function handleGetCategories(user, headers) {
  try {
    const categories = await DatabaseService.getUserCategories(user.id)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ categories })
    }
  } catch (error) {
    console.error('Error fetching categories:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Create new category
async function handleCreateCategory(user, event, headers) {
  try {
    const categoryData = JSON.parse(event.body)
    
    const category = await DatabaseService.createCategory(user.id, categoryData)
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        message: 'Category created successfully',
        category 
      })
    }
  } catch (error) {
    console.error('Error creating category:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}