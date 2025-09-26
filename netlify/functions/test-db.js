import { DatabaseService } from '../../src/lib/neon.js'

export async function handler(event, context) {
  // CORS headers
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

  try {
    console.log('Testing database connection...')
    
    // Test basic connection
    const connectionTest = await DatabaseService.testConnection()
    
    // Test environment variables
    const envCheck = {
      hasNetlifyDbUrl: !!process.env.NETLIFY_DATABASE_URL,
      hasDbUrl: !!process.env.DATABASE_URL,
      hasJwtSecret: !!process.env.JWT_SECRET,
      nodeEnv: process.env.NODE_ENV || 'development'
    }

    // Get current timestamp from database
    const timeQuery = await DatabaseService.getCurrentTime()
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Database connection successful!',
        connection: connectionTest,
        environment: envCheck,
        timestamp: timeQuery,
        netlifyContext: {
          functionName: context.functionName,
          functionVersion: context.functionVersion,
          region: context.region || 'unknown'
        }
      })
    }

  } catch (error) {
    console.error('Database test failed:', error)
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      })
    }
  }
}