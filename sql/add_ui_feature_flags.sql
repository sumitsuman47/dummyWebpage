-- =============================================
-- ADD MISSING UI FEATURE FLAGS
-- =============================================
-- Run this in your Supabase SQL Editor to add
-- the additional UI feature flags for:
-- 1. language_switcher - EN/ES language toggle buttons
-- These flags control visibility of UI elements

-- =============================================
-- Add language_switcher flag
-- =============================================

INSERT INTO feature_flags (
  feature_key,
  feature_name,
  feature_description,
  category,
  is_enabled,
  updated_by,
  notes
) VALUES (
  'language_switcher',
  'Language Switcher',
  'Show language toggle buttons (EN/ES) in navigation',
  'ui',
  true,
  'system',
  'Controls visibility of language switcher buttons'
)
ON CONFLICT (feature_key) DO UPDATE 
SET 
  is_enabled = true,
  updated_at = now(),
  updated_by = 'system';

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this query to verify the new flag was added:
-- SELECT feature_key, feature_name, is_enabled, category 
-- FROM feature_flags 
-- WHERE feature_key = 'language_switcher'
-- ORDER BY feature_key;

-- =============================================
-- EXPECTED RESULT:
-- language_switcher | Language Switcher | true | ui
-- =============================================
