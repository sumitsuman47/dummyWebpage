-- =============================================
-- LUMITYA FEATURE FLAGS SYSTEM
-- =============================================
-- This script sets up a complete feature flag system
-- for enabling/disabling features dynamically

-- =============================================
-- 1. MAIN FEATURE FLAGS TABLE
-- =============================================
CREATE TABLE IF NOT EXISTS feature_flags (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  
  -- Feature identification
  feature_key TEXT NOT NULL UNIQUE,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  category TEXT NOT NULL, -- 'core', 'forms', 'filters', 'pages', 'integrations', 'ui'
  
  -- Feature state
  is_enabled BOOLEAN DEFAULT false,
  is_beta BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by TEXT,
  
  -- Dependencies (JSON array of feature keys this depends on)
  depends_on JSONB DEFAULT '[]'::jsonb,
  
  -- Notes for admins
  notes TEXT
);

-- =============================================
-- 2. FEATURE FLAG AUDIT LOG
-- =============================================
CREATE TABLE IF NOT EXISTS feature_flag_audit (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  feature_key TEXT NOT NULL,
  action TEXT NOT NULL, -- 'enabled', 'disabled', 'created', 'updated'
  previous_state JSONB,
  new_state JSONB,
  changed_by TEXT,
  changed_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT
);

-- =============================================
-- 3. INDEXES FOR PERFORMANCE
-- =============================================
CREATE INDEX IF NOT EXISTS idx_feature_flags_enabled ON feature_flags(is_enabled);
CREATE INDEX IF NOT EXISTS idx_feature_flags_category ON feature_flags(category);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);
CREATE INDEX IF NOT EXISTS idx_audit_feature ON feature_flag_audit(feature_key);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON feature_flag_audit(changed_at DESC);

-- =============================================
-- 4. AUDIT TRIGGER FUNCTION
-- =============================================
CREATE OR REPLACE FUNCTION log_feature_flag_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log if is_enabled changed
  IF (TG_OP = 'UPDATE' AND OLD.is_enabled IS DISTINCT FROM NEW.is_enabled) THEN
    INSERT INTO feature_flag_audit (
      feature_key,
      action,
      previous_state,
      new_state,
      changed_by,
      reason
    ) VALUES (
      NEW.feature_key,
      CASE WHEN NEW.is_enabled THEN 'enabled' ELSE 'disabled' END,
      jsonb_build_object('is_enabled', OLD.is_enabled, 'updated_at', OLD.updated_at),
      jsonb_build_object('is_enabled', NEW.is_enabled, 'updated_at', NEW.updated_at),
      NEW.updated_by,
      'Feature flag toggled'
    );
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO feature_flag_audit (
      feature_key,
      action,
      new_state,
      changed_by,
      reason
    ) VALUES (
      NEW.feature_key,
      'created',
      jsonb_build_object('is_enabled', NEW.is_enabled, 'created_at', NEW.created_at),
      NEW.updated_by,
      'Feature flag created'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 5. ATTACH AUDIT TRIGGER
-- =============================================
DROP TRIGGER IF EXISTS feature_flag_audit_trigger ON feature_flags;
CREATE TRIGGER feature_flag_audit_trigger
AFTER INSERT OR UPDATE ON feature_flags
FOR EACH ROW
EXECUTE FUNCTION log_feature_flag_change();

-- =============================================
-- 6. RLS POLICIES (Row Level Security)
-- =============================================
-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_flag_audit ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to read enabled features
CREATE POLICY "Anyone can view feature flags" 
  ON feature_flags FOR SELECT 
  USING (true);

-- Only authenticated users can update (add your admin auth check here)
CREATE POLICY "Admins can update feature flags" 
  ON feature_flags FOR UPDATE 
  USING (true); -- Replace with: auth.role() = 'admin' when you have auth

CREATE POLICY "Admins can insert feature flags" 
  ON feature_flags FOR INSERT 
  WITH CHECK (true); -- Replace with: auth.role() = 'admin' when you have auth

-- Allow anyone to view audit log (or restrict to admins)
CREATE POLICY "Anyone can view audit log" 
  ON feature_flag_audit FOR SELECT 
  USING (true);

-- =============================================
-- 7. INSERT LUMITYA FEATURES
-- =============================================

-- Clear existing data (optional, comment out if you want to keep existing)
-- TRUNCATE feature_flags CASCADE;

-- Core Features
INSERT INTO feature_flags (feature_key, feature_name, feature_description, category, is_enabled, updated_by, notes) VALUES
('multilanguage', 'Multi-language Support', 'EN/ES language switching functionality', 'core', true, 'system', 'Core feature - always enabled'),
('password_gate', 'Password Gate', 'Entry password protection on landing', 'core', true, 'system', 'Security feature'),
('provider_cache', 'Provider Data Caching', '5-minute cache for provider list with localStorage', 'core', true, 'system', 'Performance optimization'),
('mobile_responsive', 'Mobile Responsive Design', 'Mobile-optimized layout and hamburger menu', 'ui', true, 'system', 'Essential for mobile users'),
('social_share_section', 'Social Share Section', 'Show social sharing section on homepage', 'ui', true, 'system', 'Controls visibility of social sharing buttons block'),
('home_join_provider_button', 'Home Join Provider Button', 'Show "Join as Provider" hero button on homepage', 'ui', true, 'system', 'Controls visibility of homepage join provider CTA'),
('home_safety_notice', 'Home Safety Notice', 'Show the home page safety guidance banner', 'ui', true, 'system', 'Controls visibility of the homepage safety tip banner'),
('home_payment_risk_notice', 'Home Payment Risk Notice', 'Show the home page payment risk warning banner', 'ui', true, 'system', 'Controls visibility of the homepage payment risk warning banner'),
('home_provider_signals', 'Home Provider Signals', 'Show the home page live directory snapshot section', 'ui', true, 'system', 'Controls visibility of the homepage provider count and verification signals'),
('footer_dispute_guidance', 'Footer Dispute Guidance', 'Show the dispute guidance block in site footers', 'ui', true, 'system', 'Controls visibility of the footer dispute guidance block'),

-- Provider Directory Features
('provider_directory', 'Provider Directory', 'Browse contractors and suppliers listing page', 'pages', true, 'system', 'Main feature - contractor marketplace'),
('provider_search', 'Provider Search', 'Real-time search providers by name/service with debouncing', 'filters', true, 'system', 'Core search functionality'),
('provider_category_filter', 'Category Filter', 'Filter providers by service category (8 categories)', 'filters', true, 'system', 'Essential filtering'),
('provider_city_filter', 'City Filter', 'Filter providers by city (Guadalajara, Zapopan)', 'filters', true, 'system', 'Location-based filtering'),
('provider_contact_button', 'Contact Provider Button', 'Direct contact/quote request button on provider cards', 'forms', true, 'system', 'Lead generation feature'),
('id_verification_badge', 'ID Verification Badge', 'Show ID verification status badge on provider cards', 'ui', true, 'system', 'Trust indicator'),
('provider_rating_display', 'Provider Rating Display', 'Star rating and review count on provider cards', 'ui', true, 'system', 'Social proof element'),
('provider_tabs', 'Contractor/Supplier Tabs', 'Tab navigation between contractors and suppliers', 'ui', true, 'system', 'Category separation'),

-- Service Request Features
('service_request_form', 'Service Request Form', 'Main "Get Matched" service request form', 'forms', true, 'system', 'Primary lead capture form'),
('service_request_safety_notice', 'Service Request Safety Notice', 'Show the safety banner in the service request modal', 'forms', true, 'system', 'Controls the service request modal safety notice'),
('service_request_payment_risk_notice', 'Service Request Payment Risk Notice', 'Show the payment risk banner in the service request modal', 'forms', true, 'system', 'Controls the service request modal payment warning'),
('service_request_budget', 'Budget Field', 'Budget selection dropdown in service request forms', 'forms', true, 'system', 'Added for better matching'),
('service_request_timeline', 'Timeline Field', 'Preferred timeline/start date in service request', 'forms', true, 'system', 'Urgency indicator'),
('timeline_urgent_option', 'Timeline – Urgent Option', 'Show "Urgent – within 1 week" option in timeline dropdowns', 'forms', false, 'system', 'Controls visibility of urgent timeline option'),
('timeline_soon_option', 'Timeline – Soon Option', 'Show "Soon – within 1 month" option in timeline dropdowns', 'forms', false, 'system', 'Controls visibility of soon timeline option'),
('service_request_neighbourhood', 'Dynamic Neighbourhood Dropdown', 'City-based neighbourhood selection', 'forms', true, 'system', 'Location precision'),
('service_request_validation', 'Form Validation', 'Client-side validation for service request forms', 'forms', true, 'system', 'Data quality'),
('provider_contact_safety_notice', 'Provider Contact Safety Notice', 'Show the safety banner in the contact provider modal', 'forms', true, 'system', 'Controls the provider contact modal safety notice'),
('provider_contact_payment_risk_notice', 'Provider Contact Payment Risk Notice', 'Show the payment risk banner in the contact provider modal', 'forms', true, 'system', 'Controls the provider contact modal payment warning'),

-- Provider Application Features  
('contractor_application', 'Contractor Application', 'Join as service provider form', 'forms', true, 'system', 'Provider onboarding'),
('contractor_approval_workflow', 'Contractor Approval Workflow', 'Admin review and ID verification process', 'integrations', true, 'system', 'Quality control'),
('contractor_auto_publish', 'Auto-publish Contractors', 'Trigger to move approved contractors to provider list', 'integrations', true, 'system', 'Automated workflow'),
('contractor_service_categories', 'Multi-select Service Categories', 'Select multiple service categories in application', 'forms', true, 'system', 'Flexible categorization'),

-- Supplier Features (Coming Soon)
('supplier_application', 'Supplier Application', 'Material supplier registration form', 'forms', false, 'system', 'Coming soon - phase 2'),
('supplier_directory', 'Supplier Directory Tab', 'Show suppliers in directory page', 'pages', false, 'system', 'Coming soon - phase 2'),
('supplier_materials_catalog', 'Materials Catalog', 'Add/manage materials with pricing in supplier form', 'forms', false, 'system', 'Coming soon - phase 2'),
('supplier_delivery_options', 'Delivery Options', 'Delivery pricing and zone selection', 'forms', false, 'system', 'Coming soon - phase 2'),

-- Pages
('home_page', 'Home Page', 'Landing page with hero, how it works, categories', 'pages', true, 'system', 'Main landing page'),
('pricing_page', 'Pricing Page', 'Contractor pricing and plans information', 'pages', true, 'system', 'Transparent pricing'),
('terms_page', 'Terms & Conditions Page', 'Legal terms and conditions', 'pages', true, 'system', 'Legal requirement'),
('privacy_page', 'Privacy Notice Page', 'Privacy policy and data handling', 'pages', true, 'system', 'Legal requirement'),
('provider_agreement_page', 'Provider Agreement Page', 'Service provider agreement terms', 'pages', true, 'system', 'Legal requirement'),

-- Premium Features (Coming Soon)
('premium_plans', 'Premium Plans', 'Premium contractor subscription tier', 'pages', false, 'system', 'Phase 2 - monetization'),
('premium_notifications', 'Premium Launch Notifications', 'Waitlist signup for premium features', 'forms', true, 'system', 'Lead generation for premium'),
('premium_badge', 'Premium Provider Badge', 'Special badge for premium subscribers', 'ui', false, 'system', 'Premium differentiation'),
('premium_featured_listing', 'Featured Listings', 'Premium providers appear first in results', 'filters', false, 'system', 'Premium benefit'),

-- Email Integration (EmailJS)
('emailjs_integration', 'EmailJS Integration', 'Email notifications via EmailJS service', 'integrations', true, 'system', 'Core notification system'),
('email_service_requests', 'Service Request Emails', 'Send service request notifications to providers', 'integrations', true, 'system', 'Lead notification'),
('email_applications', 'Application Confirmation Emails', 'Send contractor/supplier application confirmations', 'integrations', true, 'system', 'Application acknowledgment'),
('email_contact_provider', 'Contact Provider Emails', 'Email notifications when customer contacts provider', 'integrations', true, 'system', 'Direct lead notification'),

-- Database Features (Supabase)
('supabase_integration', 'Supabase Integration', 'PostgreSQL database and REST API integration', 'integrations', true, 'system', 'Core backend'),
('service_requests_db', 'Service Requests Database', 'Save service requests to database', 'integrations', true, 'system', 'Data persistence'),
('contractor_requests_db', 'Contractor Applications Database', 'Save contractor applications with approval workflow', 'integrations', true, 'system', 'Application management'),
('providers_db', 'Providers Database', 'Store and retrieve provider profiles', 'integrations', true, 'system', 'Core data'),

-- UI/UX Features
('modal_system', 'Modal System', 'Reusable modal dialogs for forms', 'ui', true, 'system', 'UI pattern'),
('success_messages', 'Success Messages', 'Show success feedback after form submissions', 'ui', true, 'system', 'User feedback'),
('loading_states', 'Loading States', 'Loading indicators for async operations', 'ui', true, 'system', 'User feedback'),
('error_handling', 'Error Messages', 'User-friendly error messages', 'ui', true, 'system', 'Error handling'),
('smooth_scroll', 'Smooth Page Transitions', 'Smooth scrolling and page transitions', 'ui', true, 'system', 'UX enhancement'),
('category_chips', 'Category Filter Chips', 'Visual chip buttons for category filtering', 'ui', true, 'system', 'Visual filtering'),

-- Advanced Features (Future/Beta)
('advanced_search', 'Advanced Search', 'Multi-criteria search with AND/OR logic', 'filters', false, 'system', 'Future enhancement'),
('price_range_filter', 'Price Range Filter', 'Filter by provider pricing range', 'filters', false, 'system', 'Future enhancement'),
('rating_filter', 'Rating Filter', 'Filter by minimum rating (e.g., 4+ stars)', 'filters', false, 'system', 'Future enhancement'),
('availability_filter', 'Availability Filter', 'Filter by provider availability status', 'filters', false, 'system', 'Future enhancement'),
('save_favorites', 'Save Favorite Providers', 'Bookmark providers for later', 'ui', false, 'system', 'User accounts required'),
('provider_reviews', 'Provider Reviews System', 'Customer reviews and ratings submission', 'forms', false, 'system', 'Phase 2 - trust building'),
('provider_portfolio', 'Provider Portfolio', 'Photo gallery of completed projects', 'ui', false, 'system', 'Phase 2 - visual proof'),
('instant_messaging', 'Instant Messaging', 'Real-time chat between customer and provider', 'integrations', false, 'system', 'Phase 3 - requires WebSocket'),
('booking_calendar', 'Booking Calendar', 'Schedule appointments with providers', 'forms', false, 'system', 'Phase 3 - booking system'),
('payment_integration', 'Payment Processing', 'Integrated payment for deposits/services', 'integrations', false, 'system', 'Phase 3 - monetization');

-- =============================================
-- 8. HELPER FUNCTIONS
-- =============================================

-- Function to get all enabled features (for API endpoint)
CREATE OR REPLACE FUNCTION get_enabled_features()
RETURNS TABLE (
  feature_key TEXT,
  feature_name TEXT,
  category TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ff.feature_key,
    ff.feature_name,
    ff.category
  FROM feature_flags ff
  WHERE ff.is_enabled = true
  ORDER BY ff.category, ff.feature_name;
END;
$$ LANGUAGE plpgsql;

-- Function to toggle a feature
CREATE OR REPLACE FUNCTION toggle_feature(
  p_feature_key TEXT,
  p_enabled BOOLEAN,
  p_updated_by TEXT DEFAULT 'admin'
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE feature_flags
  SET 
    is_enabled = p_enabled,
    updated_at = now(),
    updated_by = p_updated_by
  WHERE feature_key = p_feature_key;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to get feature status
CREATE OR REPLACE FUNCTION is_feature_enabled(p_feature_key TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_enabled BOOLEAN;
BEGIN
  SELECT is_enabled INTO v_enabled
  FROM feature_flags
  WHERE feature_key = p_feature_key;
  
  RETURN COALESCE(v_enabled, false);
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 9. VERIFICATION QUERIES
-- =============================================

-- View all features by category
-- SELECT category, feature_key, feature_name, is_enabled
-- FROM feature_flags
-- ORDER BY category, feature_name;

-- View enabled features only
-- SELECT feature_key, feature_name, category
-- FROM feature_flags
-- WHERE is_enabled = true
-- ORDER BY category;

-- View feature flag change history
-- SELECT feature_key, action, changed_by, changed_at, reason
-- FROM feature_flag_audit
-- ORDER BY changed_at DESC
-- LIMIT 20;

-- Count features by category
-- SELECT category, 
--        COUNT(*) as total_features,
--        SUM(CASE WHEN is_enabled THEN 1 ELSE 0 END) as enabled_features
-- FROM feature_flags
-- GROUP BY category
-- ORDER BY category;

-- =============================================
-- SETUP COMPLETE
-- =============================================
-- Run this script in your Supabase SQL editor
-- Then use the API endpoints to fetch feature flags
-- =============================================
