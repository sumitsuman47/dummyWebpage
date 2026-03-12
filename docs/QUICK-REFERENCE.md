# Feature Flags Quick Reference Card

## 🎯 Three New Flags

```
┌─────────────────────────────────────────────────────────────┐
│                     FEATURE FLAGS                            │
├──────────────┬───────────────┬──────────────┬──────────────┤
│ Flag Key     │ Category      │ Default      │ Purpose      │
├──────────────┼───────────────┼──────────────┼──────────────┤
│ join_modal   │ UI            │ ✅ ENABLED   │ Modal visible│
├──────────────┼───────────────┼──────────────┼──────────────┤
│ contractor   │ Forms         │ ✅ ENABLED   │ Allow apply  │
│ _joining     │               │              │              │
├──────────────┼───────────────┼──────────────┼──────────────┤
│ supplier     │ Forms         │ ❌ DISABLED  │ Phase 2      │
│ _joining     │               │              │              │
└──────────────┴───────────────┴──────────────┴──────────────┘
```

---

## 🔄 User Journey Map

```
START: User clicks "Get Listed"
      ↓
  ┌───────────────────────────────────┐
  │ join_modal == enabled?            │
  └───────────────────────────────────┘
      YES ↓                  ↓ NO
        ↓              (nothing happens)
        ↓                    ↓
  ┌───────────────────────────────────┐
  │  SHOW MODAL                       │
  │  "How would you like to join?"    │
  │                                   │
  │  [CONTRACTOR]  [SUPPLIER]        │
  │                                   │
  └───────────────────────────────────┘
        ↓ User clicks card
  
  CONTRACTOR CLICKED              SUPPLIER CLICKED
      ↓                                ↓
  Check:                          Check:
  contractor_joining              supplier_joining
  == enabled?                     == enabled?
      ↓                                ↓
  YES: Open form              YES: Open form
  NO: Do nothing              NO: Do nothing
      ↓                                ↓
  User fills & submits        User fills & submits
      ↓                                ↓
  Application sent            Application sent
```

---

## ⚡ Quick Commands

### Browser Console
```javascript
// Check status
FeatureFlags.isEnabled('join_modal')
FeatureFlags.isEnabled('contractor_joining')
FeatureFlags.isEnabled('supplier_joining')

// View all
FeatureFlags.debug()

// Apply modal logic
FeatureFlags.applyJoinModalLogic()
```

### API Calls
```bash
# Disable contractor
curl -X PATCH http://localhost:3000/api/features/contractor_joining \
  -d '{"is_enabled": false}'

# Enable supplier
curl -X PATCH http://localhost:3000/api/features/supplier_joining \
  -d '{"is_enabled": true}'

# Check all
curl http://localhost:3000/api/features/all
```

### Admin Dashboard
```
1. http://localhost:3000/admin-features.html
2. Search: "contractor" or "supplier" or "join"
3. Toggle switches
4. Changes apply on refresh
```

---

## 📍 Where Code Is

```
HTML Elements (index.html)
├─ Line 1493: <div id="applyChoiceMo" data-feature="join_modal">
├─ Line 1502: Contractor card - data-feature="contractor_joining"
├─ Line 1508: Supplier card - data-feature="supplier_joining"
├─ Line 1094: <div id="provMo" data-feature="contractor_joining">
└─ Line 1255: <div id="suppMo" data-feature="supplier_joining">

JavaScript Logic (app.js)
├─ Lines 1213-1224: providerApp.open() check
├─ Lines 1226-1243: supplierApp.open() check
└─ Lines 1245-1265: applyChoice.open() check + logic

Feature Flags (feature-flags.js)
└─ Lines 269-305: applyJoinModalLogic() method

Database (Supabase)
└─ sql/add_join_modal_features.sql - INSERT 3 flags
```

---

## 🎬 Live Demo

### Current State (Phase 1)
```
✅ join_modal         = ENABLED
✅ contractor_joining = ENABLED  
❌ supplier_joining   = DISABLED

User behavior:
→ Clicks "Get Listed"
→ Modal opens
→ Sees Contractor card (normal)
→ Sees Supplier card (grayed out)
→ Can apply as Contractor
→ Cannot apply as Supplier
```

### After Phase 2 Launch
```
✅ join_modal         = ENABLED
✅ contractor_joining = ENABLED  
✅ supplier_joining   = ENABLED

User behavior:
→ Clicks "Get Listed"
→ Modal opens
→ Sees Contractor card (normal)
→ Sees Supplier card (normal)
→ Can apply as either
```

### Emergency Shutdown
```
❌ join_modal         = DISABLED
✅ contractor_joining = ENABLED  
❌ supplier_joining   = DISABLED

User behavior:
→ Clicks "Get Listed"
→ Nothing happens
→ No signups possible
```

---

## 🧪 Test Cases

| # | Action | Expected | Verify |
|---|--------|----------|--------|
| 1 | Click "Get Listed" | Modal opens | Check modal visibility |
| 2 | Both cards visible | Both cards show | Check CSS display |
| 3 | Click Contractor | Form opens | Check modal #provMo |
| 4 | Click Supplier | Modal closed | Check card disabled |
| 5 | Disable contractor_joining | Card hidden | Refresh & check |
| 6 | Enable supplier_joining | Card visible | Refresh & check |
| 7 | Disable join_modal | Nothing happens | Click button |
| 8 | Toggle from admin | Changes reflect | Refresh main site |

---

## 📊 State Combinations

```
┌────────────┬──────────────┬────────────────┬─────────────────────┐
│ join_modal │ contractor   │ supplier       │ User Can            │
├────────────┼──────────────┼────────────────┼─────────────────────┤
│ ✅ ON      │ ✅ ON        │ ✅ ON          │ Apply as both       │
│ ✅ ON      │ ✅ ON        │ ❌ OFF         │ Apply as contractor │
│ ✅ ON      │ ❌ OFF       │ ✅ ON          │ Apply as supplier   │
│ ✅ ON      │ ❌ OFF       │ ❌ OFF         │ See modal (no opts) │
│ ❌ OFF     │ ✅ ON        │ ✅ ON          │ Nothing (modal off) │
│ ❌ OFF     │ ❌ OFF       │ ❌ OFF         │ Nothing             │
└────────────┴──────────────┴────────────────┴─────────────────────┘
```

---

## 🎯 Setup Checklist

- [ ] Run `sql/add_join_modal_features.sql` in Supabase
- [ ] Start server: `./start.sh`
- [ ] Test in browser: http://localhost:3000
- [ ] Open admin: http://localhost:3000/admin-features.html
- [ ] Verify 3 new flags appear in list
- [ ] Test toggling contractor_joining
- [ ] Test toggling supplier_joining
- [ ] Test toggling join_modal
- [ ] Verify console logs appear

---

## 🔐 Security Notes

```
FEATURE FLAGS:
✅ Public information (not secrets)
✅ Cached for 5 minutes
✅ Read-only for users
✅ Admin dashboard controls access

DATABASE:
✅ Stored in Supabase feature_flags table
✅ RLS policies protect write access
✅ Audit logs track changes

API:
✅ GET /api/features - Read only
✅ PATCH /api/features/:key - Admin only (via RLS)
```

---

## 📖 Documentation Map

```
START HERE:
├─ This file (Quick Reference)

QUICK START:
├─ FEATURE-FLAGS-SETUP-GUIDE.md (3 steps)

DETAILED GUIDE:
├─ JOIN-MODAL-FEATURE-FLAGS.md (complete reference)

ARCHITECTURE:
├─ IMPLEMENTATION-SUMMARY.md (system design)

SYSTEM OVERVIEW:
├─ FEATURE-FLAGS-USAGE.md (all 13 UI features)
└─ FEATURE-FLAGS-SETUP.md (full system setup)
```

---

## 🚀 Go Live Checklist

### Before Launch
- [x] Code implemented
- [x] HTML updated
- [x] JavaScript logic added
- [x] Feature-flags.js enhanced
- [x] SQL script ready
- [x] Documentation complete

### Launch Day
- [ ] Run SQL in Supabase
- [ ] Test in staging
- [ ] Verify admin dashboard
- [ ] Test all 3 combinations
- [ ] Deploy to production
- [ ] Monitor logs
- [ ] Be ready to toggle if needed

### Phase 2 Prep
- [ ] Prepare supplier form UI
- [ ] Write supplier validation
- [ ] Test supplier submission
- [ ] Schedule Phase 2 launch
- [ ] Toggle supplier_joining ON
- [ ] Monitor conversions

---

## 💡 Pro Tips

1. **Cache Issues?**
   ```javascript
   localStorage.clear()
   location.reload()
   ```

2. **Want Immediate Test?**
   ```javascript
   // In console on admin dashboard
   FeatureFlags.flags = {
     ...FeatureFlags.flags,
     supplier_joining: { is_enabled: true }
   }
   location.reload()
   ```

3. **Monitor Changes?**
   ```bash
   # Watch API for changes
   watch -n 5 'curl http://localhost:3000/api/features/all'
   ```

4. **Debug in Production?**
   ```javascript
   // Check what's enabled
   window.FeatureFlags.debug()
   
   // See in console table
   console.table(FeatureFlags.flags)
   ```

---

## 🎉 You're Ready!

**Next step:** Run the SQL file in Supabase and start controlling your signup flow!

```bash
cat sql/add_join_modal_features.sql | pbcopy
# Paste into Supabase SQL Editor and Execute
```

**Questions?** See the full documentation in `JOIN-MODAL-FEATURE-FLAGS.md`

---

Generated: 2026-03-09  
Status: ✅ Complete & Ready to Deploy
