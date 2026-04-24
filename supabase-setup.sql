-- Lumitya Platform - Supabase Database Setup
-- Run these SQL commands in your Supabase SQL Editor
-- URL: https://qylfvajhihlxrpmztpou.supabase.co

-- ============================================
-- IMPORTANT: Run this in Supabase Dashboard
-- ============================================
-- 1. Go to: https://supabase.com/dashboard
-- 2. Select your project
-- 3. Click on "SQL Editor" in left sidebar
-- 4. Click "New Query"
-- 5. Copy and paste this entire file
-- 6. Click "Run" button

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. SERVICE REQUESTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  service TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 2. PROVIDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  team_size TEXT,
  services TEXT[] NOT NULL,
  years_experience TEXT,
  description TEXT,
  coverage TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 3. SUPPLIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  materials JSONB NOT NULL,
  description TEXT,
  delivery_available BOOLEAN DEFAULT FALSE,
  delivery_cost TEXT,
  delivery_max_km INTEGER,
  min_order TEXT,
  coverage TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 4. CONTACTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- 5. PREMIUM NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS premium_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  service_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE POLICIES (Allow public insert)
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public insert" ON service_requests;
DROP POLICY IF EXISTS "Allow public insert" ON providers;
DROP POLICY IF EXISTS "Allow public insert" ON suppliers;
DROP POLICY IF EXISTS "Allow public insert" ON contacts;
DROP POLICY IF EXISTS "Allow public insert" ON premium_notifications;

-- Create new policies
CREATE POLICY "Allow public insert" ON service_requests
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert" ON providers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert" ON suppliers
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert" ON contacts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public insert" ON premium_notifications
  FOR INSERT WITH CHECK (true);

-- ============================================
-- OPTIONAL: Add indexes for better performance
-- ============================================
CREATE INDEX IF NOT EXISTS idx_service_requests_city ON service_requests(city);
CREATE INDEX IF NOT EXISTS idx_service_requests_status ON service_requests(status);
CREATE INDEX IF NOT EXISTS idx_providers_city ON providers(city);
CREATE INDEX IF NOT EXISTS idx_providers_status ON providers(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_city ON suppliers(city);

-- ============================================
-- VERIFY TABLES CREATED
-- ============================================
-- Run this to check:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';

-- ============================================
-- DONE! 
-- ============================================
-- Your tables are now ready!
-- Test by submitting a form on: http://localhost:3000
