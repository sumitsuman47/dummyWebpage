-- Migration: Align dev/prod contractor + provider tables with current app payloads
-- Safe to run multiple times.
-- Date: 2026-03-31

BEGIN;

-- ============================================================
-- 0) FEATURE FLAGS TABLES FOR DEV / PROD
-- ============================================================
CREATE TABLE IF NOT EXISTS feature_flags_development (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  category TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  is_beta BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  depends_on JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS feature_flags_production (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  category TEXT NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,
  is_beta BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  depends_on JSONB DEFAULT '[]'::jsonb,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_development_enabled ON feature_flags_development(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_development_category ON feature_flags_development(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_development_key ON feature_flags_development(feature_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_production_enabled ON feature_flags_production(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_production_category ON feature_flags_production(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_production_key ON feature_flags_production(feature_key);

ALTER TABLE feature_flags_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags_production ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view feature flags" ON feature_flags_development;
DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags_development;
DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags_development;
CREATE POLICY "Anyone can view feature flags" ON feature_flags_development FOR SELECT USING (true);
CREATE POLICY "Admins can update feature flags" ON feature_flags_development FOR UPDATE USING (true);
CREATE POLICY "Admins can insert feature flags" ON feature_flags_development FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view feature flags" ON feature_flags_production;
DROP POLICY IF EXISTS "Admins can update feature flags" ON feature_flags_production;
DROP POLICY IF EXISTS "Admins can insert feature flags" ON feature_flags_production;
CREATE POLICY "Anyone can view feature flags" ON feature_flags_production FOR SELECT USING (true);
CREATE POLICY "Admins can update feature flags" ON feature_flags_production FOR UPDATE USING (true);
CREATE POLICY "Admins can insert feature flags" ON feature_flags_production FOR INSERT WITH CHECK (true);

-- Seed from canonical feature_flags table if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'feature_flags'
  ) THEN
    INSERT INTO feature_flags_development (
      feature_key, feature_name, feature_description, category, is_enabled, is_beta, created_at, updated_at, updated_by, depends_on, notes
    )
    SELECT
      feature_key, feature_name, feature_description, category, is_enabled, is_beta, created_at, updated_at, updated_by, depends_on, notes
    FROM feature_flags
    ON CONFLICT (feature_key) DO NOTHING;

    INSERT INTO feature_flags_production (
      feature_key, feature_name, feature_description, category, is_enabled, is_beta, created_at, updated_at, updated_by, depends_on, notes
    )
    SELECT
      feature_key, feature_name, feature_description, category, is_enabled, is_beta, created_at, updated_at, updated_by, depends_on, notes
    FROM feature_flags
    ON CONFLICT (feature_key) DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- 1) SERVICE REQUESTS: align with current backend payload
-- ============================================================
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT '';
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS service_category TEXT;
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS service_description TEXT;
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS provider_id UUID;
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS provider_name TEXT;
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS timeline_text TEXT DEFAULT '';
ALTER TABLE service_requests_development ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT '{}';

UPDATE service_requests_development
SET customer_name = COALESCE(customer_name, name),
   customer_email = COALESCE(customer_email, email, ''),
   customer_phone = COALESCE(customer_phone, phone),
   service_category = COALESCE(service_category, service),
   service_description = COALESCE(service_description, description),
   timeline_text = COALESCE(NULLIF(timeline_text, ''), timeline)
WHERE customer_name IS NULL
  OR customer_phone IS NULL
  OR service_category IS NULL
  OR service_description IS NULL
  OR timeline_text IS NULL
  OR timeline_text = '';

ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS customer_name TEXT;
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS customer_email TEXT DEFAULT '';
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS customer_phone TEXT;
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS service_category TEXT;
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS service_description TEXT;
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS provider_id UUID;
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS provider_name TEXT;
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS preferred_date DATE;
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS timeline_text TEXT DEFAULT '';
ALTER TABLE service_requests_production ADD COLUMN IF NOT EXISTS attachment_urls TEXT[] DEFAULT '{}';

UPDATE service_requests_production
SET customer_name = COALESCE(customer_name, name),
   customer_email = COALESCE(customer_email, email, ''),
   customer_phone = COALESCE(customer_phone, phone),
   service_category = COALESCE(service_category, service),
   service_description = COALESCE(service_description, description),
   timeline_text = COALESCE(NULLIF(timeline_text, ''), timeline)
WHERE customer_name IS NULL
  OR customer_phone IS NULL
  OR service_category IS NULL
  OR service_description IS NULL
  OR timeline_text IS NULL
  OR timeline_text = '';

-- ============================================================
-- 2) REPORTED PROVIDER: flatten legacy data JSON into current columns
-- ============================================================
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS provider_name TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS reporter_name TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS reporter_email TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS reporter_phone TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS page_context TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS report_status TEXT DEFAULT 'submitted';
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE reported_provider_development ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

UPDATE reported_provider_development
SET provider_id = COALESCE(provider_id, data->>'provider_id'),
   provider_name = COALESCE(provider_name, data->>'provider_name'),
   issue_type = COALESCE(issue_type, data->>'issue_type'),
   details = COALESCE(details, data->>'details'),
   reporter_name = COALESCE(reporter_name, data->>'reporter_name'),
   reporter_email = COALESCE(reporter_email, data->>'reporter_email'),
   reporter_phone = COALESCE(reporter_phone, data->>'reporter_phone'),
   page_context = COALESCE(page_context, data->>'page_context'),
   report_status = COALESCE(report_status, data->>'report_status', 'submitted'),
   resolution_notes = COALESCE(resolution_notes, data->>'resolution_notes'),
   reviewed_by = COALESCE(reviewed_by, data->>'reviewed_by')
WHERE provider_name IS NULL
  OR issue_type IS NULL
  OR details IS NULL;

ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS provider_id TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS provider_name TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS issue_type TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS details TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS reporter_name TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS reporter_email TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS reporter_phone TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS page_context TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS report_status TEXT DEFAULT 'submitted';
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS resolution_notes TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS reviewed_by TEXT;
ALTER TABLE reported_provider_production ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT now();

UPDATE reported_provider_production
SET provider_id = COALESCE(provider_id, data->>'provider_id'),
   provider_name = COALESCE(provider_name, data->>'provider_name'),
   issue_type = COALESCE(issue_type, data->>'issue_type'),
   details = COALESCE(details, data->>'details'),
   reporter_name = COALESCE(reporter_name, data->>'reporter_name'),
   reporter_email = COALESCE(reporter_email, data->>'reporter_email'),
   reporter_phone = COALESCE(reporter_phone, data->>'reporter_phone'),
   page_context = COALESCE(page_context, data->>'page_context'),
   report_status = COALESCE(report_status, data->>'report_status', 'submitted'),
   resolution_notes = COALESCE(resolution_notes, data->>'resolution_notes'),
   reviewed_by = COALESCE(reviewed_by, data->>'reviewed_by')
WHERE provider_name IS NULL
  OR issue_type IS NULL
  OR details IS NULL;

-- ============================================================
-- 3) CONTRACTOR JOIN REQUESTS: years_experience -> years_exp
-- ============================================================
DO $$
BEGIN
  -- Development table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contractor_join_requests_development'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contractor_join_requests_development' AND column_name = 'years_exp'
    ) THEN
      ALTER TABLE contractor_join_requests_development
      ADD COLUMN years_exp TEXT;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contractor_join_requests_development' AND column_name = 'years_experience'
    ) THEN
      EXECUTE 'UPDATE contractor_join_requests_development
               SET years_exp = COALESCE(years_exp, years_experience)
               WHERE years_exp IS NULL';
    END IF;
  END IF;

  -- Production table
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'contractor_join_requests_production'
  ) THEN
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contractor_join_requests_production' AND column_name = 'years_exp'
    ) THEN
      ALTER TABLE contractor_join_requests_production
      ADD COLUMN years_exp TEXT;
    END IF;

    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'contractor_join_requests_production' AND column_name = 'years_experience'
    ) THEN
      EXECUTE 'UPDATE contractor_join_requests_production
               SET years_exp = COALESCE(years_exp, years_experience)
               WHERE years_exp IS NULL';
    END IF;
  END IF;
END $$;

-- ============================================================
-- 4) PROVIDERS: add fields used by directory + payload
-- ============================================================
-- ---------------------------
-- providers_development
-- ---------------------------
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS title_en TEXT DEFAULT '';
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS title_es TEXT DEFAULT '';
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS years_exp TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#2B4DB3';
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS jobs INTEGER DEFAULT 0;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS top_rated BOOLEAN DEFAULT FALSE;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS tags_en TEXT[] DEFAULT '{}';
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS tags_es TEXT[] DEFAULT '{}';
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS provider_reviews_en TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS provider_reviews_es TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS identity_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS "Identity_checked" BOOLEAN DEFAULT FALSE;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review1_author TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review1_stars NUMERIC(2,1);
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review1_date TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review1_en TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review1_es TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review2_author TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review2_stars NUMERIC(2,1);
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review2_date TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review2_en TEXT;
ALTER TABLE providers_development ADD COLUMN IF NOT EXISTS review2_es TEXT;

-- Ensure services default exists for contractor->provider workflow compatibility
ALTER TABLE providers_development ALTER COLUMN services SET DEFAULT '{}';

-- Backfill categories from services when missing
UPDATE providers_development
SET categories = services
WHERE (categories IS NULL OR array_length(categories, 1) IS NULL)
  AND services IS NOT NULL;

-- Backfill years_exp from years_experience when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_development' AND column_name = 'years_experience'
  ) THEN
    EXECUTE 'UPDATE providers_development
             SET years_exp = COALESCE(years_exp, years_experience)
             WHERE years_exp IS NULL';
  END IF;
END $$;

-- Backfill lowercase identity_checked from quoted legacy column when present
UPDATE providers_development
SET identity_checked = COALESCE("Identity_checked", identity_checked);

-- ---------------------------
-- providers_production
-- ---------------------------
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS title_en TEXT DEFAULT '';
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS title_es TEXT DEFAULT '';
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS categories TEXT[] DEFAULT '{}';
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS years_exp TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#2B4DB3';
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS initials TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS reviews INTEGER DEFAULT 0;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS jobs INTEGER DEFAULT 0;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS top_rated BOOLEAN DEFAULT FALSE;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS tags_en TEXT[] DEFAULT '{}';
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS tags_es TEXT[] DEFAULT '{}';
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS provider_reviews_en TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS provider_reviews_es TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS identity_checked BOOLEAN DEFAULT FALSE;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS "Identity_checked" BOOLEAN DEFAULT FALSE;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review1_author TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review1_stars NUMERIC(2,1);
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review1_date TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review1_en TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review1_es TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review2_author TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review2_stars NUMERIC(2,1);
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review2_date TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review2_en TEXT;
ALTER TABLE providers_production ADD COLUMN IF NOT EXISTS review2_es TEXT;

-- Ensure services default exists for contractor->provider workflow compatibility
ALTER TABLE providers_production ALTER COLUMN services SET DEFAULT '{}';

-- Backfill categories from services when missing
UPDATE providers_production
SET categories = services
WHERE (categories IS NULL OR array_length(categories, 1) IS NULL)
  AND services IS NOT NULL;

-- Backfill years_exp from years_experience when available
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'providers_production' AND column_name = 'years_experience'
  ) THEN
    EXECUTE 'UPDATE providers_production
             SET years_exp = COALESCE(years_exp, years_experience)
             WHERE years_exp IS NULL';
  END IF;
END $$;

-- Backfill lowercase identity_checked from quoted legacy column when present
UPDATE providers_production
SET identity_checked = COALESCE("Identity_checked", identity_checked);

-- ============================================================
-- 5) RLS POLICIES REQUIRED BY THE APP
-- ============================================================
DROP POLICY IF EXISTS "Public insert contractor join requests development" ON contractor_join_requests_development;
DROP POLICY IF EXISTS "Public insert contractor join requests production" ON contractor_join_requests_production;
DROP POLICY IF EXISTS "Public select categories development" ON categories_development;
DROP POLICY IF EXISTS "Public select categories production" ON categories_production;
DROP POLICY IF EXISTS "Public insert service requests development" ON service_requests_development;
DROP POLICY IF EXISTS "Public insert service requests production" ON service_requests_production;
DROP POLICY IF EXISTS "Public select providers development" ON providers_development;
DROP POLICY IF EXISTS "Public select providers production" ON providers_production;
DROP POLICY IF EXISTS "Public insert suppliers development" ON suppliers_development;
DROP POLICY IF EXISTS "Public insert suppliers production" ON suppliers_production;
DROP POLICY IF EXISTS "Public insert contacts development" ON contacts_development;
DROP POLICY IF EXISTS "Public insert contacts production" ON contacts_production;
DROP POLICY IF EXISTS "Public insert notifications development" ON premium_notifications_development;
DROP POLICY IF EXISTS "Public insert notifications production" ON premium_notifications_production;

CREATE POLICY "Public insert contractor join requests development" ON contractor_join_requests_development FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert contractor join requests production" ON contractor_join_requests_production FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select categories development" ON categories_development FOR SELECT USING (true);
CREATE POLICY "Public select categories production" ON categories_production FOR SELECT USING (true);
CREATE POLICY "Public insert service requests development" ON service_requests_development FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert service requests production" ON service_requests_production FOR INSERT WITH CHECK (true);
CREATE POLICY "Public select providers development" ON providers_development FOR SELECT USING (true);
CREATE POLICY "Public select providers production" ON providers_production FOR SELECT USING (true);
CREATE POLICY "Public insert suppliers development" ON suppliers_development FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert suppliers production" ON suppliers_production FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert contacts development" ON contacts_development FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert contacts production" ON contacts_production FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert notifications development" ON premium_notifications_development FOR INSERT WITH CHECK (true);
CREATE POLICY "Public insert notifications production" ON premium_notifications_production FOR INSERT WITH CHECK (true);

COMMIT;
