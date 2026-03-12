-- Contractor Join Requests Table Schema
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS contractor_join_requests (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

  name TEXT NOT NULL,
  phone TEXT,
  email TEXT,

  title_en TEXT DEFAULT '',
  title_es TEXT DEFAULT '',

  categories TEXT[] DEFAULT '{}',

  city TEXT DEFAULT 'Guadalajara',
  neighbourhood TEXT DEFAULT '',

  years_exp TEXT DEFAULT '',

  color TEXT DEFAULT '#2B4DB3',
  initials TEXT DEFAULT '',

  tags_en TEXT[] DEFAULT '{}',
  tags_es TEXT[] DEFAULT '{}',

  description TEXT,

  -- admin verification
  id_checked BOOLEAN DEFAULT false,

  -- admin action
  move_to_provider_list BOOLEAN DEFAULT false,

  status TEXT DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE contractor_join_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (for contractor applications)
DROP POLICY IF EXISTS "Public insert" ON contractor_join_requests;
CREATE POLICY "Public insert" ON contractor_join_requests 
  FOR INSERT 
  WITH CHECK (true);

-- Allow public reads (optional - adjust based on your needs)
DROP POLICY IF EXISTS "Public read" ON contractor_join_requests;
CREATE POLICY "Public read" ON contractor_join_requests 
  FOR SELECT 
  USING (true);

-- Function to automatically move verified contractors to providers table
CREATE OR REPLACE FUNCTION move_to_providers()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.move_to_provider_list = TRUE AND NEW.id_checked = TRUE THEN
    INSERT INTO providers (
      name,
      title_en,
      title_es,
      categories,
      city,
      neighbourhood,
      years_exp,
      color,
      initials,
      tags_en,
      tags_es
    )
    VALUES (
      NEW.name,
      NEW.title_en,
      NEW.title_es,
      NEW.categories,
      NEW.city,
      NEW.neighbourhood,
      NEW.years_exp,
      NEW.color,
      NEW.initials,
      NEW.tags_en,
      NEW.tags_es
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to execute the function after update
DROP TRIGGER IF EXISTS trigger_move_to_providers ON contractor_join_requests;
CREATE TRIGGER trigger_move_to_providers
AFTER UPDATE ON contractor_join_requests
FOR EACH ROW
WHEN (NEW.move_to_provider_list = TRUE)
EXECUTE FUNCTION move_to_providers();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_contractor_requests_status ON contractor_join_requests(status);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_city ON contractor_join_requests(city);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_id_checked ON contractor_join_requests(id_checked);
CREATE INDEX IF NOT EXISTS idx_contractor_requests_created_at ON contractor_join_requests(created_at DESC);
