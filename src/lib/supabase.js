import { createClient } from '@supabase/supabase-js'

// These will be environment variables in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

// Database table names
export const TABLES = {
  USERS: 'users',
  DOCUMENTS: 'documents', 
  DOCUMENT_CONTENT: 'document_content',
  CATEGORIES: 'categories',
  TAGS: 'tags',
  SEARCH_HISTORY: 'search_history',
  USER_SETTINGS: 'user_settings'
}

// Storage buckets
export const STORAGE_BUCKETS = {
  DOCUMENTS: 'documents',
  THUMBNAILS: 'thumbnails'
}