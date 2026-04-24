-- Lumitya Supabase Security Policies
-- Run this in your Supabase SQL Editor after creating the providers and submissions tables

-- Enable Row Level Security on submissions if not already enabled
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public insert" ON submissions;
DROP POLICY IF EXISTS "Admin read" ON submissions;

-- Allow anyone to insert submissions (for public forms)
CREATE POLICY "Public insert" ON submissions 
  FOR INSERT 
  WITH CHECK (true);

-- Allow anyone to read submissions (optional, adjust based on your needs)
-- If you want only admins to read, you'll need to implement auth
CREATE POLICY "Public read" ON submissions 
  FOR SELECT 
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city);
CREATE INDEX IF NOT EXISTS idx_providers_categories ON providers USING GIN(categories);
CREATE INDEX IF NOT EXISTS idx_providers_top_rated ON providers(top_rated) WHERE top_rated = true;
CREATE INDEX IF NOT EXISTS idx_providers_rating ON providers(rating DESC);

-- Sample queries to view submissions by type:
-- SELECT * FROM submissions WHERE type = 'service_request' ORDER BY created_at DESC;
-- SELECT * FROM submissions WHERE type = 'provider_application' ORDER BY created_at DESC;
-- SELECT * FROM submissions WHERE type = 'supplier_application' ORDER BY created_at DESC;
-- SELECT * FROM submissions WHERE type = 'contact_request' ORDER BY created_at DESC;
-- SELECT * FROM submissions WHERE type = 'premium_notification' ORDER BY created_at DESC;
