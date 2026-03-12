# Contact Provider Form - Fields Added

## Issue
The "Request Quote from Contractor" form (contact provider modal) was missing:
1. **Budget field** - to capture project budget range
2. **Preferred Timeline field** - to capture preferred start date/timeline

## Solution Implemented

### 1. HTML Changes (public/index.html)
Added two new field rows to the contact provider form:

```html
<div class="fr">
  <div class="fg"><label data-i18n="req_budget">Budget (approx.)</label>
    <select id="cpbg">
      <option value="" disabled selected data-i18n="req_select_budget">Select range</option>
      <option data-i18n="req_budget_under">Under MXN 10,000</option>
      <option data-i18n="req_budget_1">MXN 10,000–30,000</option>
      <option data-i18n="req_budget_2">MXN 30,000–80,000</option>
      <option data-i18n="req_budget_3">MXN 80,000–200,000</option>
      <option data-i18n="req_budget_over">Over MXN 200,000</option>
      <option data-i18n="req_budget_unsure">Not sure yet</option>
    </select>
  </div>
  <div class="fg"><label><span data-i18n="req_timeline">Timeline</span></label>
    <select id="cptimeline">
      <option value="" disabled selected data-i18n="req_select_timeline">Select timeline</option>
      <option data-i18n="req_timeline_urgent">Urgent – within 1 week</option>
      <option data-i18n="req_timeline_soon">Soon – within 1 month</option>
      <option data-i18n="req_timeline_flexible">Flexible – 1–3 months</option>
      <option data-i18n="req_timeline_planning">Planning – 3+ months</option>
    </select>
  </div>
</div>
```

**Field IDs:**
- Budget: `cpbg`
- Timeline: `cptimeline`

### 2. JavaScript Changes (public/js/app.js)
Updated `contactProvider.submit()` to capture and include the new fields:

```javascript
const data = {
  name: document.getElementById('cpnm')?.value.trim(),
  phone: document.getElementById('cpph')?.value.trim(),
  email: document.getElementById('cpem')?.value.trim(),
  city: document.getElementById('cpcity')?.value,
  neighbourhood: document.getElementById('cpcol')?.value,
  service: document.getElementById('cpsvc')?.value,
  description: document.getElementById('cpmg')?.value.trim(),
  budget: document.getElementById('cpbg')?.value || '',        // NEW
  timeline: document.getElementById('cptimeline')?.value || 'Soon – within 1 month',  // NEW
  provider_id: this.providerId,
  provider_name: this.providerName
};
```

**Behavior:**
- Budget: Optional field (defaults to empty string if not selected)
- Timeline: Optional field (defaults to "Soon – within 1 month" if not selected)

## Translation Support
✅ All labels and options use i18n keys:
- `req_budget` - Budget label
- `req_select_budget` - Select range placeholder
- `req_budget_under`, `req_budget_1`, `req_budget_2`, `req_budget_3`, `req_budget_over`, `req_budget_unsure` - Budget options
- `req_timeline` - Timeline label
- `req_select_timeline` - Select timeline placeholder
- `req_timeline_urgent`, `req_timeline_soon`, `req_timeline_flexible`, `req_timeline_planning` - Timeline options

All keys support EN/ES translations (existing in i18n.js)

## Form Layout
The new fields are positioned between the "Project Description" textarea and the "Phone/Email" row, matching the structure of the main service request form (Submit a Service Request).

## Data Submission
Both fields are now included in the service request submission:
- Sent to API endpoint: `POST /api/requests`
- Stored in database: `service_requests` table
- Included in EmailJS notifications

## Testing Checklist
- [ ] Open "Request Quote from Contractor" modal
- [ ] Verify Budget field appears and is optional
- [ ] Verify Timeline field appears with all options
- [ ] Submit form with both fields filled
- [ ] Verify form data includes budget and timeline values
- [ ] Check Supabase database for the new fields
- [ ] Test language switching (EN/ES) for field labels and options
- [ ] Submit form without selecting budget/timeline (should use defaults)
