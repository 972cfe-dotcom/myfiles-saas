import jwt from 'jsonwebtoken'
import { DatabaseService } from '../../src/lib/neon.js'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'

export async function handler(event, context) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' }
  }

  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  try {
    // Verify JWT token
    const authHeader = event.headers.authorization
    if (!authHeader) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({ error: 'Authorization header required' })
      }
    }

    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    // Get user data
    const user = await DatabaseService.getUserById(decoded.userId)
    if (!user) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'User not found' })
      }
    }

    // Get documents count
    const documentsStats = await DatabaseService.getUserDocumentsStats(decoded.userId)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        storage_used: user.storage_used || 0,
        storage_limit: user.storage_limit || 1073741824, // 1GB
        documents_count: documentsStats.count || 0,
        categories_count: documentsStats.categories_count || 0,
        tags_count: documentsStats.tags_count || 0
      })
    }

  } catch (error) {
    console.error('User stats error:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message
      })
    }
  }
}