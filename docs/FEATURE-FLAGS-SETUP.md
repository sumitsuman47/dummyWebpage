# Feature Flags System - Setup Guide

## 🎯 Overview

The feature flags system allows you to enable/disable features dynamically without deploying new code. Features are controlled from a central database and cached on the client for performance.

## 📋 Setup Steps

### 1. Create Database Tables

Run the SQL script in your Supabase SQL editor:

```bash
sql/feature_flags_setup.sql
```

This creates:
- `feature_flags` table - stores all features
- `feature_flag_audit` table - tracks changes
- Helper functions for querying features
- 50+ pre-configured features for Lumitya

### 2. Verify Database Setup

Check that tables were created:

```sql
SELECT * FROM feature_flags ORDER BY category, feature_name;
```

You should see ~50 features across categories:
- Core (4 features)
- Forms (10 features)
- Filters (4 features)
- Pages (5 features)
- Integrations (10 features)
- UI (8 features)
- And more...

### 3. Test API Endpoints

The following endpoints are now available:

#### Get Enabled Features (Public)
```bash
curl http://localhost:3000/api/features
```

Returns:
```json
{
  "success": true,
  "features": {
    "multilanguage": {
      "enabled": true,
      "name": "Multi-language Support",
      "category": "core"
    },
    "provider_directory": {
      "enabled": true,
      "name": "Provider Directory",
      "category": "pages"
    }
  },
  "count": 35,
  "timestamp": "2026-03-09T..."
}
```

#### Get All Features (Admin)
```bash
curl http://localhost:3000/api/features/all
```

#### Toggle Feature (Admin)
```bash
curl -X PATCH http://localhost:3000/api/features/supplier_directory \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": true, "updated_by": "admin"}'
```

#### Get Audit Log
```bash
curl http://localhost:3000/api/features/audit?limit=20
```

## 🖥️ Frontend Usage

### Automatic Integration

Feature flags are automatically loaded on page load:

```javascript
// Feature flags are available globally
FeatureFlags.isEnabled('supplier_directory') // returns true/false
```

### Conditional Rendering (HTML)

Use `data-feature` attribute to show/hide elements:

```html
<!-- Show only if feature is enabled -->
<button data-feature="supplier_application">
  Join as Supplier
</button>

<!-- Show only if feature is DISABLED (coming soon badge) -->
<span data-feature-disabled="premium_plans" class="badge">
  Coming Soon
</span>
```

### Conditional Execution (JavaScript)

```javascript
// Check if feature is enabled
if (FeatureFlags.isEnabled('email_notifications')) {
  sendEmail();
}

// Execute callback if enabled
FeatureFlags.executeIf('analytics_tracking', () => {
  trackEvent('page_view');
});

// Conditional rendering
const html = FeatureFlags.renderIf('premium_badge', 
  '<span class="premium">⭐ Premium</span>'
);
```

### Manual Refresh

```javascript
// Refresh feature flags from server
await FeatureFlags.refresh();

// Clear cache and reload
FeatureFlags.clearCache();
```

## 🎨 Admin Dashboard

Access the feature flags admin panel:

```
http://localhost:3000/admin-features.html
```

Features:
- ✅ View all features with status
- 🔄 Toggle features on/off
- 🔍 Search and filter features
- 📊 View feature statistics
- 📥 Export feature configuration
- 📜 View audit history

## 🔧 Common Use Cases

### 1. Launch New Feature Gradually

```sql
-- Start disabled
UPDATE feature_flags 
SET is_enabled = false 
WHERE feature_key = 'instant_messaging';

-- Enable when ready
UPDATE feature_flags 
SET is_enabled = true, updated_by = 'admin' 
WHERE feature_key = 'instant_messaging';
```

### 2. Emergency Kill Switch

If a feature has issues, disable it instantly:

```sql
UPDATE feature_flags 
SET is_enabled = false, 
    updated_by = 'emergency',
    notes = 'Disabled due to production issue'
WHERE feature_key = 'payment_integration';
```

### 3. Beta Features

Mark features as beta:

```sql
UPDATE feature_flags 
SET is_beta = true 
WHERE feature_key = 'advanced_search';
```

### 4. Coming Soon Features

Keep features disabled but visible:

```html
<!-- Feature exists but is disabled -->
<div data-feature="supplier_directory">
  <!-- This will be hidden -->
  <h2>Material Suppliers</h2>
</div>

<div data-feature-disabled="supplier_directory">
  <!-- This will be shown -->
  <div class="coming-soon">
    🔜 Coming Soon!
  </div>
</div>
```

## 📊 Feature Categories

| Category | Description | Example Features |
|----------|-------------|------------------|
| `core` | Essential platform features | Multi-language, caching, auth |
| `forms` | Form-related features | Service requests, applications |
| `filters` | Search and filter features | Category filter, city filter |
| `pages` | Page visibility | Home, pricing, directory |
| `integrations` | Third-party integrations | EmailJS, Supabase, payments |
| `ui` | UI/UX enhancements | Modals, animations, badges |

## 🔍 Debugging

### Check Feature Status

```javascript
// In browser console
FeatureFlags.debug();
```

Shows:
- All loaded features
- Enabled/disabled status
- Last fetch time
- Cache age

### View Specific Feature

```javascript
FeatureFlags.getFeature('provider_directory');
// Returns: { enabled: true, name: "Provider Directory", category: "pages" }
```

### Get Features by Category

```javascript
FeatureFlags.getFeaturesByCategory('forms');
// Returns all form-related features
```

## 🚀 Performance

- **Cache Duration**: 5 minutes (configurable)
- **Storage**: LocalStorage + in-memory
- **Load Time**: ~50-100ms (from cache)
- **API Call**: Only on first load or after cache expires

## 🔐 Security Notes

1. **Public Endpoint**: `/api/features` is public - only returns enabled features
2. **Admin Endpoint**: `/api/features/all` should be protected with authentication
3. **Toggle Endpoint**: `/api/features/:key` should require admin auth
4. **RLS**: Row Level Security is enabled on tables

## 📝 Best Practices

1. **Always use feature flags for**:
   - New features (launch gradually)
   - Beta features (test with subset)
   - Coming soon features (show teaser)
   - Seasonal features (enable/disable by date)

2. **Don't use feature flags for**:
   - Core security features (always on)
   - Critical error handling (always on)
   - Database structure changes (use migrations)

3. **Naming Convention**:
   - Use lowercase with underscores
   - Be descriptive: `supplier_application` not `sa`
   - Group related features: `email_*`, `provider_*`

## 🔄 Refresh Strategy

Features are automatically refreshed:
- On page load
- Every 5 minutes (if page stays open)
- After admin changes (in admin panel)

Manual refresh:
```javascript
await FeatureFlags.refresh();
```

## 📚 Files Added

1. `sql/feature_flags_setup.sql` - Database schema and initial data
2. `public/js/feature-flags.js` - Client-side feature flag manager
3. `server/admin-features.html` - Admin dashboard UI (served at `/admin-features.html`)
4. `server/routes/api.js` - Feature flag API endpoints (updated)
5. `server/services/supabase.js` - Feature flag data methods (updated)

## ✅ Verification Checklist

- [ ] SQL script executed successfully
- [ ] API endpoint `/api/features` returns enabled features
- [ ] Feature flags load on page refresh
- [ ] Admin dashboard accessible at `/admin-features.html`
- [ ] Toggle feature from admin dashboard
- [ ] Feature visibility changes on main site
- [ ] Console shows feature flag logs
- [ ] LocalStorage caching works

## 🎉 You're Done!

Your feature flags system is now fully integrated. You can now:
- Control features without deployments
- Roll out features gradually
- Kill switch problematic features instantly
- Track feature usage and changes

Access admin panel: **http://localhost:3000/admin-features.html**
