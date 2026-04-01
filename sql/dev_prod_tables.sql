-- Contractor Join Requests Table (Development)
CREATE TABLE contractor_join_requests_development (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  categories TEXT[] NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT,
  years_exp TEXT,
  color TEXT,
  initials TEXT,
  tags_en TEXT[],
  tags_es TEXT[],
  description TEXT,
  id_checked BOOLEAN DEFAULT FALSE,
  move_to_provider_list BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contractor Join Requests Table (Production)
CREATE TABLE contractor_join_requests_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  title_en TEXT,
  title_es TEXT,
  categories TEXT[] NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT,
  years_exp TEXT,
  color TEXT,
  initials TEXT,
  tags_en TEXT[],
  tags_es TEXT[],
  description TEXT,
  id_checked BOOLEAN DEFAULT FALSE,
  move_to_provider_list BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
-- Reported Provider Table (Development)
CREATE TABLE reported_provider_development (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id TEXT,
  provider_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  details TEXT NOT NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  page_context TEXT,
  report_status TEXT DEFAULT 'submitted',
  resolution_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  constraint reported_provider_development_pkey primary key (id)
);

-- Reported Provider Table (Production)
CREATE TABLE reported_provider_production (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  provider_id TEXT,
  provider_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,
  details TEXT NOT NULL,
  reporter_name TEXT,
  reporter_email TEXT,
  reporter_phone TEXT,
  page_context TEXT,
  report_status TEXT DEFAULT 'submitted',
  resolution_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  constraint reported_provider_production_pkey primary key (id)
);
-- Categories Table (Development)
CREATE TABLE categories_development (
  id bigint generated always as identity not null,
  name_en text not null,
  name_es text not null,
  slug text not null,
  description_en text null default ''::text,
  description_es text null default ''::text,
  parent_id bigint null,
  icon text null default ''::text,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint categories_development_pkey primary key (id),
  constraint categories_development_slug_key unique (slug),
  constraint categories_development_parent_id_fkey foreign key (parent_id) references categories_development (id) on delete set null
);

create index IF not exists idx_category_slug_development on categories_development using btree (slug);
create index IF not exists idx_category_parent_development on categories_development using btree (parent_id);

-- Categories Table (Production)
CREATE TABLE categories_production (
  id bigint generated always as identity not null,
  name_en text not null,
  name_es text not null,
  slug text not null,
  description_en text null default ''::text,
  description_es text null default ''::text,
  parent_id bigint null,
  icon text null default ''::text,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  constraint categories_production_pkey primary key (id),
  constraint categories_production_slug_key unique (slug),
  constraint categories_production_parent_id_fkey foreign key (parent_id) references categories_production (id) on delete set null
);

create index IF not exists idx_category_slug_production on categories_production using btree (slug);
create index IF not exists idx_category_parent_production on categories_production using btree (parent_id);
-- Enable UUID extension (run only once)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service Requests Table (Development)
CREATE TABLE service_requests_development (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_category TEXT NOT NULL,
  service_description TEXT,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  provider_id UUID,
  provider_name TEXT,
  budget TEXT,
  preferred_date DATE,
  timeline_text TEXT DEFAULT '',
  attachment_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Service Requests Table (Production)
CREATE TABLE service_requests_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT,
  service_category TEXT NOT NULL,
  service_description TEXT,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  provider_id UUID,
  provider_name TEXT,
  budget TEXT,
  preferred_date DATE,
  timeline_text TEXT DEFAULT '',
  attachment_urls TEXT[] DEFAULT '{}',
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Providers Table (Development)
CREATE TABLE providers_development (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title_en TEXT DEFAULT '',
  title_es TEXT DEFAULT '',
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  team_size TEXT,
  categories TEXT[] DEFAULT '{}',
  services TEXT[] NOT NULL DEFAULT '{}',
  years_exp TEXT,
  years_experience TEXT,
  color TEXT DEFAULT '#2B4DB3',
  initials TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  jobs INTEGER DEFAULT 0,
  top_rated BOOLEAN DEFAULT FALSE,
  tags_en TEXT[] DEFAULT '{}',
  tags_es TEXT[] DEFAULT '{}',
  provider_reviews_en TEXT,
  provider_reviews_es TEXT,
  identity_checked BOOLEAN DEFAULT FALSE,
  "Identity_checked" BOOLEAN DEFAULT FALSE,
  review1_author TEXT,
  review1_stars NUMERIC(2,1),
  review1_date TEXT,
  review1_en TEXT,
  review1_es TEXT,
  review2_author TEXT,
  review2_stars NUMERIC(2,1),
  review2_date TEXT,
  review2_en TEXT,
  review2_es TEXT,
  description TEXT,
  coverage TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Providers Table (Production)
CREATE TABLE providers_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  title_en TEXT DEFAULT '',
  title_es TEXT DEFAULT '',
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  team_size TEXT,
  categories TEXT[] DEFAULT '{}',
  services TEXT[] NOT NULL DEFAULT '{}',
  years_exp TEXT,
  years_experience TEXT,
  color TEXT DEFAULT '#2B4DB3',
  initials TEXT,
  rating NUMERIC(3,2) DEFAULT 0,
  reviews INTEGER DEFAULT 0,
  jobs INTEGER DEFAULT 0,
  top_rated BOOLEAN DEFAULT FALSE,
  tags_en TEXT[] DEFAULT '{}',
  tags_es TEXT[] DEFAULT '{}',
  provider_reviews_en TEXT,
  provider_reviews_es TEXT,
  identity_checked BOOLEAN DEFAULT FALSE,
  "Identity_checked" BOOLEAN DEFAULT FALSE,
  review1_author TEXT,
  review1_stars NUMERIC(2,1),
  review1_date TEXT,
  review1_en TEXT,
  review1_es TEXT,
  review2_author TEXT,
  review2_stars NUMERIC(2,1),
  review2_date TEXT,
  review2_en TEXT,
  review2_es TEXT,
  description TEXT,
  coverage TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers Table (Development)
CREATE TABLE suppliers_development (
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

-- Suppliers Table (Production)
CREATE TABLE suppliers_production (
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

-- Contacts Table (Development)
CREATE TABLE contacts_development (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Contacts Table (Production)
CREATE TABLE contacts_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Premium Notifications Table (Development)
CREATE TABLE premium_notifications_development (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  service_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Premium Notifications Table (Production)
CREATE TABLE premium_notifications_production (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  service_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Feature Flags Table (Development)
CREATE TABLE feature_flags_development (
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

-- Feature Flags Table (Production)
CREATE TABLE feature_flags_production (
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

CREATE INDEX IF NOT EXISTS idx_feature_flags_production_enabled ON feature_flags_production(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_production_category ON feature_flags_production(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_production_key ON feature_flags_production(feature_key);

-- Enable RLS for all main tables (must be after all CREATE TABLE)
ALTER TABLE contractor_join_requests_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE contractor_join_requests_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_provider_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE reported_provider_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_requests_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_notifications_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_notifications_production ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags_development ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flags_production ENABLE ROW LEVEL SECURITY;

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
