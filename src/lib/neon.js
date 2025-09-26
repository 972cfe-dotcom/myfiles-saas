import { neon } from '@neondatabase/serverless'

// Neon connection - Netlify integration
const DATABASE_URL = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL || import.meta.env.VITE_DATABASE_URL
const sql = neon(DATABASE_URL)

// Error handler for database operations
const handleDbError = (error, operation) => {
  console.error(`Database error in ${operation}:`, error)
  throw new Error(`Database operation failed: ${operation}`)
}

// Database service class
export class DatabaseService {
  // Test connection
  static async testConnection() {
    try {
      const result = await sql`SELECT NOW() as current_time`
      console.log('Database connected successfully:', result[0])
      return true
    } catch (error) {
      handleDbError(error, 'connection test')
      return false
    }
  }

  // Get current time from database
  static async getCurrentTime() {
    try {
      const result = await sql`SELECT NOW() as current_time`
      return result[0]
    } catch (error) {
      handleDbError(error, 'get current time')
    }
  }

  // User operations
  static async createUser(userData) {
    try {
      const { email, passwordHash, fullName } = userData
      const [user] = await sql`
        INSERT INTO users (email, password_hash, full_name)
        VALUES (${email}, ${passwordHash}, ${fullName})
        RETURNING id, email, full_name, created_at
      `
      
      // Create default data for new user
      await sql`SELECT create_default_user_data(${user.id})`
      
      return user
    } catch (error) {
      if (error.message.includes('duplicate')) {
        throw new Error('המשתמש כבר קיים במערכת')
      }
      handleDbError(error, 'create user')
    }
  }

  static async getUserByEmail(email) {
    try {
      const [user] = await sql`
        SELECT id, email, password_hash, full_name, is_verified, plan_type, 
               storage_used, storage_limit, last_login, created_at
        FROM users 
        WHERE email = ${email}
      `
      return user || null
    } catch (error) {
      handleDbError(error, 'get user by email')
    }
  }

  static async getUserById(userId) {
    try {
      const [user] = await sql`
        SELECT id, email, full_name, is_verified, plan_type, 
               storage_used, storage_limit, last_login, created_at
        FROM users 
        WHERE id = ${userId}
      `
      return user || null
    } catch (error) {
      handleDbError(error, 'get user by id')
    }
  }

  static async updateUser(userId, updates) {
    try {
      const setClause = Object.keys(updates)
        .map(key => `${key} = $${Object.keys(updates).indexOf(key) + 2}`)
        .join(', ')
      
      const values = [userId, ...Object.values(updates)]
      
      const [user] = await sql`
        UPDATE users 
        SET ${sql.unsafe(setClause)}
        WHERE id = $1
        RETURNING id, email, full_name, plan_type, storage_used, storage_limit
      `.values(values)
      
      return user
    } catch (error) {
      handleDbError(error, 'update user')
    }
  }

  // Set reset token for password reset
  static async setResetToken(userId, resetToken) {
    try {
      const expiresAt = new Date(Date.now() + 3600000) // 1 hour from now
      
      await sql`
        UPDATE users 
        SET reset_token = ${resetToken}, reset_token_expires = ${expiresAt.toISOString()}
        WHERE id = ${userId}
      `
      
      return true
    } catch (error) {
      handleDbError(error, 'set reset token')
    }
  }

  // Session operations
  static async createSession(userId, sessionToken, expiresAt, metadata = {}) {
    try {
      const [session] = await sql`
        INSERT INTO user_sessions (user_id, session_token, expires_at, ip_address, user_agent)
        VALUES (${userId}, ${sessionToken}, ${expiresAt}, ${metadata.ipAddress}, ${metadata.userAgent})
        RETURNING id, session_token, expires_at
      `
      return session
    } catch (error) {
      handleDbError(error, 'create session')
    }
  }

  static async getSessionByToken(sessionToken) {
    try {
      const [session] = await sql`
        SELECT s.id, s.user_id, s.expires_at, u.email, u.full_name
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken} AND s.expires_at > NOW()
      `
      return session || null
    } catch (error) {
      handleDbError(error, 'get session')
    }
  }

  static async deleteSession(sessionToken) {
    try {
      await sql`DELETE FROM user_sessions WHERE session_token = ${sessionToken}`
      return true
    } catch (error) {
      handleDbError(error, 'delete session')
    }
  }

  // Document operations
  static async createDocument(documentData) {
    try {
      const [document] = await sql`
        INSERT INTO documents (
          user_id, title, description, file_name, file_type, file_size,
          file_url, thumbnail_url, mime_type, content_extracted, category_id, file_hash
        )
        VALUES (
          ${documentData.userId}, ${documentData.title}, ${documentData.description},
          ${documentData.fileName}, ${documentData.fileType}, ${documentData.fileSize},
          ${documentData.fileUrl}, ${documentData.thumbnailUrl}, ${documentData.mimeType},
          ${documentData.contentExtracted}, ${documentData.categoryId}, ${documentData.fileHash}
        )
        RETURNING *
      `
      return document
    } catch (error) {
      handleDbError(error, 'create document')
    }
  }

  static async getUserDocuments(userId, options = {}) {
    try {
      let query = sql`
        SELECT d.*, c.name as category_name, c.color as category_color,
               array_agg(
                 json_build_object('id', t.id, 'name', t.name, 'color', t.color)
               ) FILTER (WHERE t.id IS NOT NULL) as tags
        FROM documents d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN document_tags dt ON d.id = dt.document_id
        LEFT JOIN tags t ON dt.tag_id = t.id
        WHERE d.user_id = ${userId}
      `

      if (options.categoryId) {
        query = sql`${query} AND d.category_id = ${options.categoryId}`
      }

      if (options.search) {
        query = sql`${query} AND (
          d.title ILIKE ${`%${options.search}%`} OR 
          d.content_extracted ILIKE ${`%${options.search}%`}
        )`
      }

      query = sql`${query} 
        GROUP BY d.id, c.name, c.color
        ORDER BY d.created_at DESC
      `

      if (options.limit) {
        query = sql`${query} LIMIT ${options.limit}`
      }

      const documents = await query
      return documents
    } catch (error) {
      handleDbError(error, 'get user documents')
    }
  }

  static async getDocumentById(documentId, userId) {
    try {
      const [document] = await sql`
        SELECT d.*, c.name as category_name, c.color as category_color,
               array_agg(
                 json_build_object('id', t.id, 'name', t.name, 'color', t.color)
               ) FILTER (WHERE t.id IS NOT NULL) as tags
        FROM documents d
        LEFT JOIN categories c ON d.category_id = c.id
        LEFT JOIN document_tags dt ON d.id = dt.document_id
        LEFT JOIN tags t ON dt.tag_id = t.id
        WHERE d.id = ${documentId} AND d.user_id = ${userId}
        GROUP BY d.id, c.name, c.color
      `

      if (document) {
        // Update last accessed
        await sql`
          UPDATE documents 
          SET last_accessed_at = NOW() 
          WHERE id = ${documentId}
        `
      }

      return document || null
    } catch (error) {
      handleDbError(error, 'get document by id')
    }
  }

  static async deleteDocument(documentId, userId) {
    try {
      const [deleted] = await sql`
        DELETE FROM documents 
        WHERE id = ${documentId} AND user_id = ${userId}
        RETURNING id
      `
      return !!deleted
    } catch (error) {
      handleDbError(error, 'delete document')
    }
  }

  // Categories operations
  static async getUserCategories(userId) {
    try {
      const categories = await sql`
        SELECT c.*, COUNT(d.id) as document_count
        FROM categories c
        LEFT JOIN documents d ON c.id = d.category_id
        WHERE c.user_id = ${userId}
        GROUP BY c.id
        ORDER BY c.name
      `
      return categories
    } catch (error) {
      handleDbError(error, 'get user categories')
    }
  }

  static async createCategory(userId, categoryData) {
    try {
      const [category] = await sql`
        INSERT INTO categories (name, description, color, user_id)
        VALUES (${categoryData.name}, ${categoryData.description}, ${categoryData.color}, ${userId})
        RETURNING *
      `
      return category
    } catch (error) {
      handleDbError(error, 'create category')
    }
  }

  // Search operations
  static async searchDocuments(userId, query, options = {}) {
    try {
      // Save search to history
      await sql`
        INSERT INTO search_history (user_id, query, filters)
        VALUES (${userId}, ${query}, ${JSON.stringify(options)})
      `

      const documents = await sql`
        SELECT d.*, c.name as category_name, c.color as category_color,
               ts_rank(to_tsvector('english', d.title || ' ' || COALESCE(d.content_extracted, '')), 
                       plainto_tsquery('english', ${query})) as rank
        FROM documents d
        LEFT JOIN categories c ON d.category_id = c.id
        WHERE d.user_id = ${userId}
        AND to_tsvector('english', d.title || ' ' || COALESCE(d.content_extracted, '')) 
            @@ plainto_tsquery('english', ${query})
        ORDER BY rank DESC, d.created_at DESC
        LIMIT ${options.limit || 50}
      `

      return documents
    } catch (error) {
      handleDbError(error, 'search documents')
    }
  }

  // Utility functions
  static async cleanExpiredSessions() {
    try {
      const result = await sql`SELECT clean_expired_sessions()`
      return result[0].clean_expired_sessions
    } catch (error) {
      handleDbError(error, 'clean expired sessions')
    }
  }

  static async logActivity(userId, action, resourceType, resourceId, metadata = {}) {
    try {
      await sql`
        INSERT INTO activity_logs (user_id, action, resource_type, resource_id, metadata, ip_address, user_agent)
        VALUES (${userId}, ${action}, ${resourceType}, ${resourceId}, 
                ${JSON.stringify(metadata)}, ${metadata.ipAddress}, ${metadata.userAgent})
      `
    } catch (error) {
      console.warn('Failed to log activity:', error)
      // Don't throw error for logging failures
    }
  }

  // Get user documents statistics
  static async getUserDocumentsStats(userId) {
    try {
      const [stats] = await sql`
        SELECT 
          (SELECT COUNT(*) FROM documents WHERE user_id = ${userId}) as count,
          (SELECT COUNT(*) FROM categories WHERE user_id = ${userId}) as categories_count,
          (SELECT COUNT(*) FROM tags WHERE user_id = ${userId}) as tags_count
      `
      
      return {
        count: parseInt(stats.count) || 0,
        categories_count: parseInt(stats.categories_count) || 0,
        tags_count: parseInt(stats.tags_count) || 0
      }
    } catch (error) {
      handleDbError(error, 'get user documents stats')
      return { count: 0, categories_count: 0, tags_count: 0 }
    }
  }
}

export default DatabaseService