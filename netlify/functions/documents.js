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
    
    const path = event.path.replace('/.netlify/functions/documents', '') || '/'
    const method = event.httpMethod

    // Route requests
    if (path === '/' && method === 'GET') {
      return await handleGetDocuments(user, event, headers)
    } else if (path === '/stats' && method === 'GET') {
      return await handleGetStats(user, headers)
    } else if (path === '/search' && method === 'GET') {
      return await handleSearchDocuments(user, event, headers)
    } else if (path === '/' && method === 'POST') {
      return await handleCreateDocument(user, event, headers)
    } else if (path.match(/^\/[\w-]+$/) && method === 'GET') {
      const documentId = path.substring(1)
      return await handleGetDocument(user, documentId, headers)
    } else if (path.match(/^\/[\w-]+$/) && method === 'PUT') {
      const documentId = path.substring(1)
      return await handleUpdateDocument(user, documentId, event, headers)
    } else if (path.match(/^\/[\w-]+$/) && method === 'DELETE') {
      const documentId = path.substring(1)
      return await handleDeleteDocument(user, documentId, headers)
    } else {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Not found' })
      }
    }

  } catch (error) {
    console.error('Documents function error:', error)
    
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

// Get user documents
async function handleGetDocuments(user, event, headers) {
  try {
    const params = new URL(`http://localhost${event.rawUrl || event.url || '?'}`).searchParams
    const options = {
      categoryId: params.get('categoryId'),
      search: params.get('search'),
      limit: params.get('limit') ? parseInt(params.get('limit')) : undefined
    }
    
    const documents = await DatabaseService.getUserDocuments(user.id, options)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ documents })
    }
  } catch (error) {
    console.error('Error fetching documents:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Get document statistics
async function handleGetStats(user, headers) {
  try {
    const stats = await DatabaseService.getUserDocumentsStats(user.id)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ stats })
    }
  } catch (error) {
    console.error('Error fetching stats:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Search documents
async function handleSearchDocuments(user, event, headers) {
  try {
    const params = new URL(`http://localhost${event.rawUrl || event.url || '?'}`).searchParams
    const query = params.get('q')
    const options = {
      limit: params.get('limit') ? parseInt(params.get('limit')) : 50
    }
    
    if (!query) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Search query is required' })
      }
    }
    
    const documents = await DatabaseService.searchDocuments(user.id, query, options)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ documents })
    }
  } catch (error) {
    console.error('Error searching documents:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Get single document
async function handleGetDocument(user, documentId, headers) {
  try {
    const document = await DatabaseService.getDocumentById(documentId, user.id)
    
    if (!document) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Document not found' })
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ document })
    }
  } catch (error) {
    console.error('Error fetching document:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Create new document
async function handleCreateDocument(user, event, headers) {
  try {
    console.log('Creating document for user:', user)
    const documentData = JSON.parse(event.body)
    console.log('Received document data:', documentData)
    
    // Add user ID to document data
    documentData.userId = user.id
    documentData.user_id = user.id
    
    console.log('Document data with user ID:', documentData)
    
    const document = await DatabaseService.createDocument(documentData)
    console.log('Document created in database:', document)
    
    return {
      statusCode: 201,
      headers,
      body: JSON.stringify({ 
        message: 'Document created successfully',
        document 
      })
    }
  } catch (error) {
    console.error('Error creating document in function:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        details: error.stack 
      })
    }
  }
}

// Update document
async function handleUpdateDocument(user, documentId, event, headers) {
  try {
    const updates = JSON.parse(event.body)
    
    // First verify the document belongs to the user
    const existingDoc = await DatabaseService.getDocumentById(documentId, user.id)
    if (!existingDoc) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Document not found' })
      }
    }
    
    const document = await DatabaseService.updateDocument(documentId, updates)
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Document updated successfully',
        document 
      })
    }
  } catch (error) {
    console.error('Error updating document:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}

// Delete document
async function handleDeleteDocument(user, documentId, headers) {
  try {
    const success = await DatabaseService.deleteDocument(documentId, user.id)
    
    if (!success) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: 'Document not found' })
      }
    }
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: 'Document deleted successfully' })
    }
  } catch (error) {
    console.error('Error deleting document:', error)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}