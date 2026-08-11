-- =============================================================================
-- Migration: 009_storage.sql
-- Description: Supabase Storage configuration and RLS Policies for 'rentra' bucket
-- Engine: PostgreSQL 16 (Supabase Compatible)
-- =============================================================================

-- Create Unified Public Bucket 'rentra'
INSERT INTO storage.buckets (id, name, public)
VALUES ('rentra', 'rentra', TRUE)
ON CONFLICT (id) DO UPDATE SET public = TRUE;

-- Storage RLS Policy: Public read access for all files in 'rentra' bucket
CREATE POLICY "Public Read Access on rentra Bucket"
ON storage.objects FOR SELECT
USING (bucket_id = 'rentra');

-- Storage RLS Policy: Authenticated tenant upload access
CREATE POLICY "Authenticated Upload Access on rentra Bucket"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'rentra'
    AND auth.role() = 'authenticated'
);

-- Storage RLS Policy: Authenticated tenant update/delete access
CREATE POLICY "Authenticated Modify Access on rentra Bucket"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'rentra'
    AND auth.role() = 'authenticated'
);

CREATE POLICY "Authenticated Delete Access on rentra Bucket"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'rentra'
    AND auth.role() = 'authenticated'
);
