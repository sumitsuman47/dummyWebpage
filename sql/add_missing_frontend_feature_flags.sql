-- =============================================
-- ADD MISSING FRONTEND FEATURE FLAGS
-- =============================================
-- Run this in your Supabase SQL Editor to add the frontend flags
-- that are referenced by the UI but may be missing in the live DB.

INSERT INTO feature_flags (
  feature_key,
  feature_name,
  feature_description,
  category,
  is_enabled,
  updated_by,
  notes
) VALUES
  ('password_gate', 'Password Gate', 'Entry password protection on landing', 'core', true, 'system', 'Frontend gate visibility control'),
  ('provider_directory', 'Provider Directory', 'Browse contractors and suppliers listing page', 'pages', true, 'system', 'Main directory page visibility'),
  ('provider_search', 'Provider Search', 'Directory search input visibility', 'filters', true, 'system', 'Directory search control'),
  ('provider_city_filter', 'Provider City Filter', 'Directory city filter visibility', 'filters', true, 'system', 'Directory location filter control'),
  ('provider_category_filter', 'Provider Category Filter', 'Directory category filter visibility', 'filters', true, 'system', 'Directory category filter control'),
  ('supplier_directory', 'Supplier Directory Tab', 'Show suppliers tab in the directory page', 'pages', false, 'system', 'Coming soon - supplier listing tab'),
  ('premium_notifications', 'Premium Launch Notifications', 'Waitlist signup for premium features', 'forms', true, 'system', 'Premium launch lead capture'),
  ('premium_plans', 'Premium Plans', 'Premium contractor subscription tier', 'pages', false, 'system', 'Premium pricing card visibility'),
  ('footer_platform_column', 'Footer Platform Column', 'Show the platform links column in site footers', 'ui', true, 'system', 'Footer layout control'),
  ('footer_link_home', 'Footer Home Link', 'Show the Home link in site footers', 'ui', true, 'system', 'Footer nav control'),
  ('footer_link_directory', 'Footer Directory Link', 'Show the Find Providers link in site footers', 'ui', true, 'system', 'Footer nav control'),
  ('footer_link_pricing', 'Footer Pricing Link', 'Show the For Contractors link in site footers', 'ui', true, 'system', 'Footer nav control')
ON CONFLICT (feature_key) DO UPDATE
SET
  feature_name = EXCLUDED.feature_name,
  feature_description = EXCLUDED.feature_description,
  category = EXCLUDED.category,
  notes = EXCLUDED.notes,
  updated_at = now(),
  updated_by = 'system';

-- Verification
-- SELECT feature_key, is_enabled, category
-- FROM feature_flags
-- WHERE feature_key IN (
--   'password_gate',
--   'provider_directory',
--   'provider_search',
--   'provider_city_filter',
--   'provider_category_filter',
--   'supplier_directory',
--   'premium_notifications',
--   'premium_plans',
--   'footer_platform_column',
--   'footer_link_home',
--   'footer_link_directory',
--   'footer_link_pricing'
-- )
-- ORDER BY feature_key;