import { createClient } from '@supabase/supabase-js'

// These will be environment variables in production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key-here'

// Add fallback for development
if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co') {
  console.warn('Supabase URL not configured. Please set VITE_SUPABASE_URL environment variable.')
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here') {
  console.warn('Supabase anon key not configured. Please set VITE_SUPABASE_ANON_KEY environment variable.')
}

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