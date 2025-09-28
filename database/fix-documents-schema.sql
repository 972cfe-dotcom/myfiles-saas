-- Fix Documents table to support Upload functionality
-- Add missing columns for document processing

-- Add new columns if they don't exist
DO $$ 
BEGIN
  -- document_number column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='document_number') THEN
    ALTER TABLE documents ADD COLUMN document_number TEXT;
  END IF;
  
  -- stored_file_id column 
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='stored_file_id') THEN
    ALTER TABLE documents ADD COLUMN stored_file_id TEXT;
  END IF;
  
  -- document_type column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='document_type') THEN
    ALTER TABLE documents ADD COLUMN document_type TEXT;
  END IF;
  
  -- organization column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='organization') THEN
    ALTER TABLE documents ADD COLUMN organization TEXT;
  END IF;
  
  -- processing_status column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='processing_status') THEN
    ALTER TABLE documents ADD COLUMN processing_status TEXT DEFAULT 'processed';
  END IF;
  
  -- ai_suggested_tags column (JSON array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='ai_suggested_tags') THEN
    ALTER TABLE documents ADD COLUMN ai_suggested_tags JSONB DEFAULT '[]';
  END IF;
  
  -- amounts column (JSON array)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='documents' AND column_name='amounts') THEN
    ALTER TABLE documents ADD COLUMN amounts JSONB DEFAULT '[]';
  END IF;
  
END $$;

-- Create index on document_number for faster lookups
CREATE INDEX IF NOT EXISTS idx_documents_document_number ON documents(document_number);

-- Create index on organization for faster filtering
CREATE INDEX IF NOT EXISTS idx_documents_organization ON documents(organization);

-- Create index on document_type for faster filtering  
CREATE INDEX IF NOT EXISTS idx_documents_document_type ON documents(document_type);

-- Create GIN index on ai_suggested_tags for JSON operations
CREATE INDEX IF NOT EXISTS idx_documents_ai_suggested_tags ON documents USING GIN (ai_suggested_tags);

-- Create GIN index on amounts for JSON operations
CREATE INDEX IF NOT EXISTS idx_documents_amounts ON documents USING GIN (amounts);