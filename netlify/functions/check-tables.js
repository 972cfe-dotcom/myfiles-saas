import jwt from 'jsonwebtoken'
import { neon } from '@neondatabase/serverless'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key'
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL
const sql = neon(DATABASE_URL)

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

    // Check tables in database
    const tablesQuery = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    const tables = await sql(tablesQuery)
    const tableNames = tables.map(row => row.table_name)

    // Check specific tables we created
    const expectedTables = [
      'users', 'user_sessions', 'categories', 'documents', 
      'tags', 'document_tags', 'search_history', 
      'user_settings', 'activity_logs'
    ]

    const missingTables = expectedTables.filter(table => !tableNames.includes(table))
    const extraTables = tableNames.filter(table => !expectedTables.includes(table))

    // Get user's categories count (as a test)
    const userCategoriesCount = await sql`
      SELECT COUNT(*) as count 
      FROM categories 
      WHERE user_id = ${decoded.userId}
    `

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        user: {
          id: decoded.userId,
          email: decoded.email
        },
        tables: tableNames,
        expected_tables: expectedTables,
        missing_tables: missingTables,
        extra_tables: extraTables,
        user_categories_count: parseInt(userCategoriesCount[0].count),
        all_tables_present: missingTables.length === 0
      })
    }

  } catch (error) {
    console.error('Check tables failed:', error)
    
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