-- Service Requests Table Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.service_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  -- customer info
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,

  -- project info
  service_category TEXT NOT NULL,
  service_description TEXT,

  city TEXT DEFAULT 'Guadalajara',
  neighbourhood TEXT DEFAULT '',

  -- optional provider targeting
  provider_id BIGINT NULL,
  provider_name TEXT NULL,

  -- project details
  budget TEXT DEFAULT '',
  preferred_date DATE,
  timeline_text TEXT DEFAULT '', -- Store original timeline text like "Soon – within 1 month"

  -- attachments
  attachment_urls TEXT[] DEFAULT '{}',

  -- request tracking
  status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add foreign key constraint to providers table
ALTER TABLE service_requests
ADD CONSTRAINT fk_provider
FOREIGN KEY (provider_id)
REFERENCES providers(id)
ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for service request forms)
DROP POLICY IF EXISTS "Public insert" ON service_requests;
CREATE POLICY "Public insert" ON service_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Allow public reads (optional - adjust based on your needs)
DROP POLICY IF EXISTS "Public read" ON service_requests;
CREATE POLICY "Public read" ON service_requests 
  FOR SELECT 
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_service_requests_city ON service_requests(city);
CREATE INDEX IF NOT EXISTS idx_service_requests_provider_id ON service_requests(provider_id);
CREATE INDEX IF NOT EXISTS idx_service_requests_created_at ON service_requests(created_at DESC);
