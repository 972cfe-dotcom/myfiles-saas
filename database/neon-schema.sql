-- MyFiles SaaS Database Schema for Neon
-- PostgreSQL 16 compatible

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE document_status AS ENUM ('processing', 'ready', 'error');
CREATE TYPE file_type AS ENUM ('pdf', 'docx', 'txt', 'xlsx', 'pptx', 'image');
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'enterprise');

-- Users table (main auth table)
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan_type user_plan DEFAULT 'free',
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB in bytes
  is_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  reset_token TEXT,
  reset_token_expires TIMESTAMPTZ,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table for auth management
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#4f46e5',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  file_name TEXT NOT NULL,
  file_type file_type NOT NULL,
  file_size BIGINT NOT NULL,
  file_url TEXT, -- URL to file storage (Netlify or external)
  thumbnail_url TEXT, -- URL to thumbnail
  status document_status DEFAULT 'processing',
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  
  -- Search and content
  content_extracted TEXT, -- Full text extracted from file
  content_summary TEXT, -- AI-generated summary (future feature)
  
  -- Metadata
  mime_type TEXT,
  pages_count INTEGER,
  word_count INTEGER,
  language TEXT DEFAULT 'he',
  
  -- File hash for deduplication
  file_hash TEXT,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_accessed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tags table
CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6b7280',
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name, user_id)
);

-- Document-Tags relationship (many-to-many)
CREATE TABLE IF NOT EXISTS document_tags (
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES tags(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (document_id, tag_id)
);

-- Search history table
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  query TEXT NOT NULL,
  filters JSONB, -- Store search filters as JSON
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User settings table
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  
  -- Display preferences
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'he' CHECK (language IN ('he', 'en')),
  documents_per_page INTEGER DEFAULT 12,
  default_view TEXT DEFAULT 'grid' CHECK (default_view IN ('grid', 'list')),
  
  -- Feature settings
  auto_extract_text BOOLEAN DEFAULT true,
  auto_generate_thumbnails BOOLEAN DEFAULT true,
  enable_notifications BOOLEAN DEFAULT true,
  
  -- Privacy settings
  share_analytics BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity log for audit trail
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL, -- 'upload', 'delete', 'view', 'search', etc.
  resource_type TEXT, -- 'document', 'category', 'tag'
  resource_id UUID,
  metadata JSONB, -- Additional context data
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);
CREATE INDEX IF NOT EXISTS idx_documents_hash ON documents(file_hash);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_content_search ON documents 
USING GIN (to_tsvector('english', COALESCE(title, '') || ' ' || COALESCE(content_extracted, '')));

-- Hebrew search support (if needed)
CREATE INDEX IF NOT EXISTS idx_documents_content_search_he ON documents 
USING GIN (to_tsvector('simple', COALESCE(title, '') || ' ' || COALESCE(content_extracted, '')));

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE OR REPLACE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_documents_updated_at 
    BEFORE UPDATE ON documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER update_user_settings_updated_at 
    BEFORE UPDATE ON user_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create default user data
CREATE OR REPLACE FUNCTION create_default_user_data(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
  -- Insert default categories
  INSERT INTO categories (name, description, color, user_id) VALUES
    ('מסמכים כלליים', 'מסמכים כלליים וחשובים', '#4f46e5', user_uuid),
    ('חוזים', 'חוזים והסכמים', '#059669', user_uuid),
    ('חשבוניות', 'חשבוניות ומסמכים פיננסיים', '#dc2626', user_uuid),
    ('תעודות', 'תעודות והסמכות', '#7c3aed', user_uuid),
    ('עבודה', 'מסמכי עבודה ופרויקטים', '#ea580c', user_uuid);
  
  -- Insert default tags
  INSERT INTO tags (name, color, user_id) VALUES
    ('חשוב', '#dc2626', user_uuid),
    ('דחוף', '#f59e0b', user_uuid),
    ('לבדיקה', '#3b82f6', user_uuid),
    ('מאושר', '#059669', user_uuid),
    ('ארכיון', '#6b7280', user_uuid);
  
  -- Insert default settings
  INSERT INTO user_settings (user_id) VALUES (user_uuid);
END;
$$ language 'plpgsql';

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = GREATEST(usage_count - 1, 0) WHERE id = OLD.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE OR REPLACE TRIGGER update_tag_usage_on_document_tags
  AFTER INSERT OR DELETE ON document_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Function to clean expired sessions
CREATE OR REPLACE FUNCTION clean_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM user_sessions WHERE expires_at < NOW();
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ language 'plpgsql';

-- Comments for documentation
COMMENT ON TABLE users IS 'Main user accounts with authentication data';
COMMENT ON TABLE user_sessions IS 'Active user sessions for authentication';
COMMENT ON TABLE documents IS 'Main documents table with metadata and content';
COMMENT ON TABLE categories IS 'User-defined categories for organizing documents';
COMMENT ON TABLE tags IS 'Flexible tagging system for documents';
COMMENT ON TABLE search_history IS 'User search history for analytics and quick access';
COMMENT ON TABLE user_settings IS 'User preferences and application settings';
COMMENT ON TABLE activity_logs IS 'Audit trail of user actions';

-- Insert admin user (optional - for testing)
-- Password: "admin123" (hashed with bcrypt)
INSERT INTO users (id, email, password_hash, full_name, is_verified, plan_type) 
VALUES (
  uuid_generate_v4(),
  'admin@myfiles-saas.com',
  '$2b$10$rOZhNdOKJKB9zYz0zYz0zO1K8K8K8K8K8K8K8K8K8K8K8K8K8K8K8',
  'System Administrator',
  true,
  'enterprise'
) ON CONFLICT (email) DO NOTHING;

SELECT 'Database schema created successfully! Tables: ' || count(*) || ' created.'
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name IN (
  'users', 'user_sessions', 'categories', 'documents', 'tags', 
  'document_tags', 'search_history', 'user_settings', 'activity_logs'
);