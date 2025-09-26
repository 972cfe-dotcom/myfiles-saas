-- Step 1: Extensions and Custom Types
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Create custom types
CREATE TYPE document_status AS ENUM ('processing', 'ready', 'error');
CREATE TYPE file_type AS ENUM ('pdf', 'docx', 'txt', 'xlsx', 'pptx', 'image');
CREATE TYPE user_plan AS ENUM ('free', 'pro', 'enterprise');