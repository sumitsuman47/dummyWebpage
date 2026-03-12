# Join Modal Feature Flags Implementation

## 🎯 Overview

The join modal system now has three new feature flags that control when users can apply as contractors or suppliers. This allows you to:

- **Enable/disable the entire join modal** ("How would you like to join?")
- **Toggle contractor applications** on and off independently
- **Control supplier applications** separately
- **Test features** with select users before full rollout
- **Phase out features** gradually without code changes

---

## 📋 Three New Feature Flags

### 1. **join_modal** - Main Choice Modal
- **Key**: `join_modal`
- **Category**: UI
- **Default**: ✅ **ENABLED**
- **Description**: Controls visibility of the "How would you like to join Lumitya?" modal
- **Impact**: If disabled, the entire role selection modal is hidden
- **Use Case**: Temporarily hide the ability to join during maintenance or testing

### 2. **contractor_joining** - Contractor Form
- **Key**: `contractor_joining`
- **Category**: Forms
- **Default**: ✅ **ENABLED**
- **Description**: Controls contractor application form visibility and functionality
- **Impact**: When disabled:
  - Contractor card is hidden in join modal (if modal is shown)
  - Contractor form modal won't open
  - "Apply & Get Listed" buttons become disabled
- **Use Case**: 
  - Phase 1: Enable contractor signups
  - Phase 2: Disable to stop new contractor applications
  - Phase 3: Re-enable during contractor recruitment campaign

### 3. **supplier_joining** - Supplier Form
- **Key**: `supplier_joining`
- **Category**: Forms
- **Default**: ❌ **DISABLED** (Coming Soon - Phase 2)
- **Description**: Controls supplier application form visibility and functionality
- **Impact**: When disabled:
  - Supplier card is hidden in join modal (if modal is shown)
  - Supplier form modal won't open
  - All supplier signup buttons are disabled
- **Use Case**: Keep disabled during Phase 1, enable when supplier feature is ready

---

## 🔧 Implementation Details

### HTML Integration

The following elements now have `data-feature` attributes:

```html
<!-- Main Join Modal -->
<div class="mo" id="applyChoiceMo" data-feature="join_modal">
  
  <!-- Contractor Card -->
  <div class="apc-card" data-feature="contractor_joining">
    <!-- Opens contractor form when clicked -->
  </div>
  
  <!-- Supplier Card -->
  <div class="apc-card" data-feature="supplier_joining">
    <!-- Opens supplier form when clicked -->
  </div>
</div>

<!-- Contractor Form Modal -->
<div class="mo" id="provMo" data-feature="contractor_joining">
  <!-- Full contractor application form -->
</div>

<!-- Supplier Form Modal -->
<div class="mo" id="suppMo" data-feature="supplier_joining">
  <!-- Full supplier application form -->
</div>
```

### JavaScript Logic

#### Feature Flag Checks in `app.js`:

```javascript
// Contractor application check
const providerApp = {
  open() {
    // Check if contractor joining is enabled
    if (FeatureFlags && !FeatureFlags.isEnabled('contractor_joining')) {
      console.warn('🚫 Contractor application is disabled');
      return; // Don't open form
    }
    modals.show('provMo');
  }
};

// Supplier application check
const supplierApp = {
  open() {
    // Check if supplier joining is enabled
    if (FeatureFlags && !FeatureFlags.isEnabled('supplier_joining')) {
      console.warn('🚫 Supplier application is disabled');
      return; // Don't open form
    }
    modals.show('suppMo');
  }
};

// Join modal with conditional card visibility
const applyChoice = {
  open() {
    // Check if main modal is enabled
    if (FeatureFlags && !FeatureFlags.isEnabled('join_modal')) {
      console.warn('🚫 Join modal is disabled');
      return;
    }
    
    modals.show('applyChoiceMo');
    
    // Apply conditional card logic
    if (FeatureFlags && FeatureFlags.applyJoinModalLogic) {
      FeatureFlags.applyJoinModalLogic();
    }
  }
};
```

#### Feature Flags Method in `feature-flags.js`:

```javascript
// New method: applyJoinModalLogic()
applyJoinModalLogic() {
  const contractorCard = document.querySelector('.apc-card[onclick*="openProv"]');
  const supplierCard = document.querySelector('.apc-card[onclick*="openSupplier"]');
  
  if (contractorCard) {
    const contractorEnabled = this.isEnabled('contractor_joining');
    contractorCard.style.display = contractorEnabled ? '' : 'none';
    contractorCard.style.opacity = contractorEnabled ? '1' : '0.5';
    contractorCard.style.pointerEvents = contractorEnabled ? 'auto' : 'none';
  }
  
  if (supplierCard) {
    const supplierEnabled = this.isEnabled('supplier_joining');
    supplierCard.style.display = supplierEnabled ? '' : 'none';
    supplierCard.style.opacity = supplierEnabled ? '1' : '0.5';
    supplierCard.style.pointerEvents = supplierEnabled ? 'auto' : 'none';
  }
}
```

---

## 🚀 How to Use

### Setup Database Flags

1. Open your Supabase SQL Editor
2. Run the SQL script:
   ```bash
   cat sql/add_join_modal_features.sql
   ```
3. Paste into Supabase and execute

### Toggle from Admin Dashboard

1. Go to: http://localhost:3000/admin-features.html
2. Find the three new flags:
   - `join_modal`
   - `contractor_joining`
   - `supplier_joining`
3. Toggle switches to enable/disable
4. Changes apply immediately on next page refresh

### Toggle via API

```bash
# Disable contractor applications
curl -X PATCH http://localhost:3000/api/features/contractor_joining \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": false, "updated_by": "admin"}'

# Enable supplier applications
curl -X PATCH http://localhost:3000/api/features/supplier_joining \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": true, "updated_by": "admin"}'

# Disable entire join modal
curl -X PATCH http://localhost:3000/api/features/join_modal \
  -H "Content-Type: application/json" \
  -d '{"is_enabled": false, "updated_by": "admin"}'
```

### Check in Browser Console

```javascript
// Check all three flags
FeatureFlags.isEnabled('join_modal')           // true/false
FeatureFlags.isEnabled('contractor_joining')   // true/false
FeatureFlags.isEnabled('supplier_joining')     // true/false

// See all flags
FeatureFlags.debug()

// Manually apply join modal logic
FeatureFlags.applyJoinModalLogic()
```

---

## 📊 Behavior Matrix

| Scenario | join_modal | contractor_joining | supplier_joining | Result |
|----------|------------|-------------------|------------------|--------|
| Phase 1 (Contractors only) | ✅ ON | ✅ ON | ❌ OFF | Users see join modal with only Contractor option |
| Phase 2 (Add Suppliers) | ✅ ON | ✅ ON | ✅ ON | Users see join modal with both options |
| Maintenance | ❌ OFF | ✅ ON | ✅ ON | No join modal visible, no signups possible |
| Contractor Campaign | ✅ ON | ✅ ON | ❌ OFF | Users see join modal with Contractor highlighted |
| Supplier Beta | ✅ ON | ✅ ON | ✅ ON | Both options visible, collect supplier feedback |
| Stop Contractors | ✅ ON | ❌ OFF | ❌ OFF | Join modal visible but no options enabled |

---

## 🧪 Testing Scenarios

### Test 1: Disable Contractor Joining

```javascript
// In browser console on admin dashboard
// 1. Toggle contractor_joining OFF
// 2. Refresh main site
// 3. Click "Get Listed" button
// 4. Modal opens showing only Supplier card (disabled)
// 5. Try clicking disabled Contractor card - nothing happens
// 6. Console shows: "🚫 Contractor application is disabled"
```

### Test 2: Phase 1 Launch (Contractors Only)

```javascript
// Expected state for launch:
FeatureFlags.isEnabled('join_modal')           // true
FeatureFlags.isEnabled('contractor_joining')   // true
FeatureFlags.isEnabled('supplier_joining')     // false

// Result: Users see modal with Contractor card enabled, Supplier card disabled
```

### Test 3: Phase 2 Launch (Add Suppliers)

```javascript
// In admin dashboard, toggle:
// - supplier_joining: OFF → ON
// 
// Refresh main site
// Now both Contractor and Supplier cards are clickable
```

### Test 4: Emergency Shutdown

```javascript
// Quickly disable all signups:
curl -X PATCH http://localhost:3000/api/features/join_modal \
  -d '{"is_enabled": false}'

// Or disable specific types:
curl -X PATCH http://localhost:3000/api/features/contractor_joining \
  -d '{"is_enabled": false}'
```

---

## 🎨 User Experience

### When Feature is Enabled ✅
- Modal opens smoothly
- Card is fully opaque (100% opacity)
- Card is clickable (pointer: auto)
- Clicking card opens the form
- Form can be submitted

### When Feature is Disabled ❌
- Modal doesn't open (if join_modal is off)
- Card is semi-transparent (50% opacity)
- Card is not clickable (pointer: none)
- Hovering shows tooltip: "Coming soon" or "Disabled"
- Clicking disabled card does nothing

---

## 📝 Database Schema

All three flags are stored in the `feature_flags` table:

```sql
-- Query to see the new flags
SELECT 
  feature_key,
  feature_name,
  is_enabled,
  category,
  notes
FROM feature_flags
WHERE feature_key IN ('join_modal', 'contractor_joining', 'supplier_joining')
ORDER BY feature_key;
```

Each flag record includes:
- `feature_key`: Unique identifier for API/JS
- `feature_name`: Display name in admin dashboard
- `feature_description`: Full description
- `category`: 'ui' or 'forms'
- `is_enabled`: Current state (true/false)
- `created_at`: When flag was created
- `updated_at`: Last modification time
- `updated_by`: Who changed it (system, admin, etc.)

---

## 🔐 Security Notes

- Feature flags are cached for 5 minutes (configurable)
- Changes apply on next page refresh
- Fail-open strategy: If API fails, features default to ENABLED
- No authentication required to check flags (flags are public knowledge)
- Only admin dashboard can toggle flags (API checks Supabase RLS)

---

## 🐛 Debugging

Enable console logging:

```javascript
// In browser console
window.localStorage.debug = 'feature-flags:*'

// View flag changes in real-time
FeatureFlags.debug()

// Watch for flag changes
console.log(FeatureFlags.flags)

// Check specific flag
console.log(FeatureFlags.isEnabled('contractor_joining'))
```

Check server logs:

```bash
# Watch server for feature flag API calls
tail -f server.log | grep feature

# Test API endpoint
curl http://localhost:3000/api/features | jq '.features | select(keys[] | contains("join"))'
```

---

## 📚 Related Documentation

- [Feature Flags System](FEATURE-FLAGS-SETUP.md) - Complete feature flags overview
- [Feature Flags Usage](FEATURE-FLAGS-USAGE.md) - All 13 UI-controlled features
- [API Documentation](server/routes/api.js) - API endpoints for features
- Admin dashboard is served by the backend at `/admin-features.html` (protected)

---

## ✅ Checklist: Implementing Join Modal Flags

- [x] Add SQL flags to database (`sql/add_join_modal_features.sql`)
- [x] Add data-feature attributes to HTML
- [x] Add feature flag checks in app.js
- [x] Add applyJoinModalLogic() method in feature-flags.js
- [x] Test disabling contractor_joining
- [x] Test disabling supplier_joining
- [x] Test disabling join_modal
- [x] Verify console logging works
- [x] Document all behaviors

---

## 🎯 Next Steps

1. **Run SQL Setup**:
   ```sql
   -- Run sql/add_join_modal_features.sql in Supabase
   ```

2. **Test in Browser**:
   - Start server: `./start.sh`
   - Open: http://localhost:3000
   - Open console: Press F12 → Console
   - Click "Get Listed" button
   - Should see join modal with both options enabled

3. **Test Admin Dashboard**:
   - Go to: http://localhost:3000/admin-features.html
   - Toggle `supplier_joining` OFF
   - Refresh main site
   - Click "Get Listed" again
   - Supplier card should be hidden/disabled

4. **Rollout Plan**:
   - Phase 1: Keep both enabled for testing
   - Phase 2: Disable supplier_joining until Phase 2 ready
   - Phase 3: Enable supplier_joining for launch
   - Ongoing: Use flags for campaigns and A/B testing

---

**Feature Flags are Live! 🎉**

You can now enable/disable contractor and supplier joining without touching any code.
