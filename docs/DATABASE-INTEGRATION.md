# Supabase Database Integration - Data Flow

## Overview
All form submissions are saved to Supabase database via the backend API, with optional email notifications via EmailJS.

## Data Flow Architecture

```
User fills form → Frontend validates → API call → Backend validates → Supabase saves → Email sent (optional)
```

## Form Submissions and Database Tables

### 1. Service Request Form
**Frontend:** `/public/index.html` (#matchMo modal)  
**JS Handler:** `serviceRequest.submit()` in `app.js`  
**API Endpoint:** `POST /api/requests`  
**Supabase Table:** `service_requests`

**Frontend Fields → Backend Fields:**
```javascript
{
  name: string,              // Customer name
  city: string,              // Guadalajara or Zapopan
  neighbourhood: string,     // Neighbourhood name
  service: string,           // Service category
  description: string,       // Project description
  budget: string | null,     // Budget range
  timeline: string,          // Timeline option
  phone: string,             // Phone number
  email: string | null       // Email (optional)
}
```

**Supabase Schema:**
```sql
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  service TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. Provider Application Form
**Frontend:** `/public/index.html` (#provMo modal)  
**JS Handler:** `providerSubmit.submit()` in `app.js`  
**API Endpoint:** `POST /api/providers`  
**Supabase Table:** `providers`

**Frontend Fields → Backend Fields:**
```javascript
{
  name: string,              // → name
  business: string,          // → business_name
  phone: string,             // → phone
  email: string,             // → email
  city: string,              // → city
  neighbourhood: string,     // → neighbourhood
  website: string,           // → website
  teamSize: string,          // → team_size
  categories: array,         // → services (array)
  experience: string,        // → years_experience
  description: string,       // → description
  coverage: string           // → coverage
}
```

**Supabase Schema:**
```sql
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  team_size TEXT,
  services TEXT[] NOT NULL,          -- Array of service categories
  years_experience TEXT,
  description TEXT,
  coverage TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. Supplier Application Form
**Frontend:** `/public/index.html` (#suppMo modal)  
**JS Handler:** `supplierSubmit.submit()` in `app.js`  
**API Endpoint:** `POST /api/suppliers`  
**Supabase Table:** `suppliers`

**Frontend Fields → Backend Fields:**
```javascript
{
  name: string,              // → name
  business: string,          // → business_name
  phone: string,             // → phone
  email: string,             // → email
  city: string,              // → city
  neighbourhood: string,     // → neighbourhood
  website: string,           // → website
  materials: array,          // → materials (array of objects)
  description: string,       // → description
  delivery: 'yes'|'no',      // → delivery_available (boolean)
  deliveryDetails: {         // → delivery_cost, delivery_max_km, min_order
    cost: string,
    maxKm: number,
    minOrder: string
  },
  coverage: string           // → coverage
}
```

**Supabase Schema:**
```sql
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  materials JSONB NOT NULL,          -- Array of material objects
  description TEXT,
  delivery_available BOOLEAN DEFAULT FALSE,
  delivery_cost TEXT,
  delivery_max_km INTEGER,
  min_order TEXT,
  coverage TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 4. Contact Provider Form
**Frontend:** `/public/index.html` (#contactMo modal)  
**JS Handler:** `contactProvider.submit()` in `app.js`  
**API Endpoint:** `POST /api/contact`  
**Supabase Table:** `contacts`

**Frontend Fields → Backend Fields:**
```javascript
{
  providerId: number,        // → provider_id
  name: string,              // → name
  phone: string,             // → phone
  email: string | null,      // → email
  message: string            // → message
}
```

---

### 5. Premium Plan Notification
**Frontend:** `/public/index.html` (#notifyMo modal)  
**JS Handler:** `notifySubmit.submit()` in `app.js`  
**API Endpoint:** `POST /api/notify`  
**Supabase Table:** `premium_notifications`

**Frontend Fields → Backend Fields:**
```javascript
{
  name: string,              // → name
  phone: string,             // → phone
  email: string,             // → email
  whatsapp: string,          // → whatsapp
  service: string            // → service_type
}
```

---

## Database Setup

### Required Supabase Tables

Run these SQL commands in your Supabase SQL editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Service Requests Table
CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  service TEXT NOT NULL,
  description TEXT NOT NULL,
  budget TEXT,
  timeline TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Providers Table
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  team_size TEXT,
  services TEXT[] NOT NULL,
  years_experience TEXT,
  description TEXT,
  coverage TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
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

-- Contacts Table
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider_id UUID,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Premium Notifications Table
CREATE TABLE premium_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  service_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE premium_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies (allow insert for all, read/update for authenticated users only)
CREATE POLICY "Allow insert for all" ON service_requests FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON providers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON suppliers FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON contacts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow insert for all" ON premium_notifications FOR INSERT WITH CHECK (true);
```

---

## Environment Configuration

### Backend (.env file)
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key_here
PORT=3000
NODE_ENV=development
```

---

## Testing the Integration

### 1. Check Backend is Running
```bash
node server/index.js
```

### 2. Test API Endpoints

**Test Service Request:**
```bash
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "city": "Guadalajara",
    "neighbourhood": "Centro",
    "service": "Plumbing",
    "description": "Test request",
    "timeline": "Soon",
    "phone": "+52 33 1234 5678"
  }'
```

**Test Provider Application:**
```bash
curl -X POST http://localhost:3000/api/providers \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Provider",
    "phone": "+52 33 1234 5678",
    "email": "test@test.com",
    "city": "Guadalajara",
    "neighbourhood": "Centro",
    "services": ["Plumbing", "Electrical"]
  }'
```

### 3. Check Supabase Dashboard
- Go to https://app.supabase.com/
- Navigate to Table Editor
- Check data appears in respective tables

---

## Dual Notification System

When a form is submitted:
1. ✅ **Data is saved to Supabase** (always happens via backend API)
2. ✅ **Email notification sent via EmailJS** (optional, frontend-triggered)

Both systems work independently:
- If Supabase fails → User sees error
- If EmailJS fails → Data is still saved, warning in console

This ensures data is never lost even if email fails.

---

## Troubleshooting

### Issue: "Missing Supabase configuration"
**Solution:** Create `.env` file with SUPABASE_URL and SUPABASE_ANON_KEY

### Issue: "Failed to submit request"
**Solutions:**
- Check backend server is running
- Verify Supabase credentials in .env
- Check Supabase tables exist
- Check network tab in browser for error details

### Issue: Data not appearing in Supabase
**Solutions:**
- Check RLS policies allow inserts
- Verify table schema matches the payload
- Check Supabase logs for errors
- Ensure ANON key has correct permissions

### Issue: "Services must be a non-empty array"
**Solution:** Ensure at least one service category is selected in provider form
