-- =============================================
-- ADD JOIN MODAL FEATURE FLAGS
-- =============================================
-- Run this in your Supabase SQL Editor to add
-- the three new feature flags for the join modal:
-- 1. join_modal - Main "How would you like to join" modal
-- 2. contractor_joining - Contractor application form
-- 3. supplier_joining - Supplier application form

-- =============================================
-- Add new feature flags
-- =============================================

-- Feature 1: Join Modal (main choice modal)
INSERT INTO feature_flags (
  feature_key,
  feature_name,
  feature_description,
  category,
  is_enabled,
  updated_by,
  notes
) VALUES (
  'join_modal',
  'Join Modal - Choose Role',
  'Show "How would you like to join Lumitya?" modal with Contractor/Supplier choices',
  'ui',
  true,
  'system',
  'Controls visibility of the main role selection modal'
)
ON CONFLICT (feature_key) DO UPDATE 
SET 
  is_enabled = true,
  updated_at = now(),
  updated_by = 'system';

-- Feature 2: Contractor Joining Form
INSERT INTO feature_flags (
  feature_key,
  feature_name,
  feature_description,
  category,
  is_enabled,
  updated_by,
  notes
) VALUES (
  'contractor_joining',
  'Contractor Application Form',
  'Show contractor application form when selected from join modal',
  'forms',
  true,
  'system',
  'Disable to hide contractor signup option'
)
ON CONFLICT (feature_key) DO UPDATE 
SET 
  is_enabled = true,
  updated_at = now(),
  updated_by = 'system';

-- Feature 3: Supplier Joining Form
INSERT INTO feature_flags (
  feature_key,
  feature_name,
  feature_description,
  category,
  is_enabled,
  updated_by,
  notes
) VALUES (
  'supplier_joining',
  'Supplier Application Form',
  'Show supplier application form when selected from join modal',
  'forms',
  false,
  'system',
  'Currently disabled (coming soon - Phase 2). Enable when ready.'
)
ON CONFLICT (feature_key) DO UPDATE 
SET 
  is_enabled = false,
  updated_at = now(),
  updated_by = 'system';

-- =============================================
-- VERIFICATION
-- =============================================
-- Run this query to verify the new flags were added:
-- SELECT feature_key, feature_name, is_enabled, category 
-- FROM feature_flags 
-- WHERE feature_key IN ('join_modal', 'contractor_joining', 'supplier_joining')
-- ORDER BY feature_key;

-- =============================================
-- EXPECTED RESULT:
-- join_modal              | Join Modal - Choose Role           | true  | ui
-- contractor_joining     | Contractor Application Form         | true  | forms
-- supplier_joining       | Supplier Application Form           | false | forms
-- =============================================
