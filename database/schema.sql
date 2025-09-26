-- MyFiles SaaS Database Schema for Supabase
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE document_status AS ENUM ('processing', 'ready', 'error');
CREATE TYPE file_type AS ENUM ('pdf', 'docx', 'txt', 'xlsx', 'pptx', 'image');

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  plan_type TEXT DEFAULT 'free' CHECK (plan_type IN ('free', 'pro', 'enterprise')),
  storage_used BIGINT DEFAULT 0,
  storage_limit BIGINT DEFAULT 1073741824, -- 1GB in bytes
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
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
  file_path TEXT, -- Path in Supabase Storage
  thumbnail_path TEXT, -- Path to thumbnail in storage
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_category_id ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_documents_file_type ON documents(file_type);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_documents_content_search ON documents 
USING GIN (to_tsvector('hebrew', COALESCE(title, '') || ' ' || COALESCE(content_extracted, '')));

CREATE INDEX IF NOT EXISTS idx_search_history_user_id ON search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_search_history_created_at ON search_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_tags_user_id ON tags(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_settings_updated_at BEFORE UPDATE ON user_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- Categories policies
CREATE POLICY "Users can manage own categories" ON categories FOR ALL USING (auth.uid() = user_id);

-- Tags policies  
CREATE POLICY "Users can manage own tags" ON tags FOR ALL USING (auth.uid() = user_id);

-- Document-tags policies
CREATE POLICY "Users can manage own document tags" ON document_tags FOR ALL USING (
  EXISTS (SELECT 1 FROM documents WHERE documents.id = document_tags.document_id AND documents.user_id = auth.uid())
);

-- Search history policies
CREATE POLICY "Users can manage own search history" ON search_history FOR ALL USING (auth.uid() = user_id);

-- User settings policies
CREATE POLICY "Users can manage own settings" ON user_settings FOR ALL USING (auth.uid() = user_id);

-- Insert default categories for new users
CREATE OR REPLACE FUNCTION create_default_user_data()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert user profile
  INSERT INTO users (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  -- Insert default categories
  INSERT INTO categories (name, description, color, user_id) VALUES
    ('מסמכים כלליים', 'מסמכים כלליים וחשובים', '#4f46e5', NEW.id),
    ('חוזים', 'חוזים והסכמים', '#059669', NEW.id),
    ('חשבוניות', 'חשבוניות ומסמכים פיננסיים', '#dc2626', NEW.id),
    ('תעודות', 'תעודות והסמכות', '#7c3aed', NEW.id),
    ('עבודה', 'מסמכי עבודה ופרויקטים', '#ea580c', NEW.id);
  
  -- Insert default tags
  INSERT INTO tags (name, color, user_id) VALUES
    ('חשוב', '#dc2626', NEW.id),
    ('דחוף', '#f59e0b', NEW.id),
    ('לבדיקה', '#3b82f6', NEW.id),
    ('מאושר', '#059669', NEW.id),
    ('ארכיון', '#6b7280', NEW.id);
  
  -- Insert default settings
  INSERT INTO user_settings (user_id) VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Trigger to create default data for new users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION create_default_user_data();

-- Function to update tag usage count
CREATE OR REPLACE FUNCTION update_tag_usage_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tags SET usage_count = usage_count + 1 WHERE id = NEW.tag_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tags SET usage_count = usage_count - 1 WHERE id = OLD.tag_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tag_usage_on_document_tags
  AFTER INSERT OR DELETE ON document_tags
  FOR EACH ROW EXECUTE FUNCTION update_tag_usage_count();

-- Create storage buckets (run this separately after creating the schema)
-- INSERT INTO storage.buckets (id, name, public) VALUES 
--   ('documents', 'documents', false),
--   ('thumbnails', 'thumbnails', true);

COMMENT ON TABLE users IS 'Extended user profiles linked to Supabase auth';
COMMENT ON TABLE documents IS 'Main documents table with metadata and content';
COMMENT ON TABLE categories IS 'User-defined categories for organizing documents';
COMMENT ON TABLE tags IS 'Flexible tagging system for documents';
COMMENT ON TABLE search_history IS 'User search history for analytics and quick access';
COMMENT ON TABLE user_settings IS 'User preferences and application settings';