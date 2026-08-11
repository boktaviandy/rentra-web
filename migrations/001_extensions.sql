-- =============================================================================
-- Migration: 001_extensions.sql
-- Description: Enable required PostgreSQL extensions & utility functions
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- Enable UUID extension for uuid_generate_v4()
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cryptographic hashing functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable btree_gist for advanced indexing / exclusion constraints
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- Function: Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION update_updated_at_column() IS 'Trigger function to automatically set updated_at column to CURRENT_TIMESTAMP on UPDATE';
