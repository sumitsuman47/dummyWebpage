# Lumitya Platform - Optimized & Secure Version

A redesigned, production-ready home services platform with proper API key management, backend proxy, and optimized frontend architecture.

## 🎯 Key Improvements

### Security
- ✅ **API Keys Hidden**: Supabase credentials stored only in backend `.env` file
- ✅ **Backend Proxy**: All database calls go through Express API
- ✅ **Rate Limiting**: Protection against abuse
- ✅ **CORS Protection**: Configured allowed origins
- ✅ **Helmet Security**: HTTP headers protection

### Performance
- ✅ **Modular Code**: Clean separation of concerns
- ✅ **Fixed Freezing**: Proper null checks and error handling
- ✅ **Optimized Bundle**: Reduced JS payload
- ✅ **Better Error Handling**: User-friendly error messages

### Architecture
- ✅ **Backend/Frontend Separation**: Clean API layer
- ✅ **Environment Variables**: Easy configuration
- ✅ **Scalable Structure**: Ready for growth
- ✅ **Git-Safe**: Secrets in `.gitignore`

## 📁 Project Structure

```
lumitya-optimized/
├── docs/                    # Project docs (migration, setup, guides)
├── scripts/                 # Helper scripts (tests, setup)
├── server/
│   ├── index.js              # Express server
│   ├── routes/
│   │   └── api.js            # API endpoints
│   └── services/
│       └── supabase.js       # Supabase service layer
├── public/
│   ├── index.html            # Main HTML file
│   ├── css/
│   │   └── complete-styles.css
│   └── js/
│       └── app.js            # Optimized frontend JS
├── tools/                   # Local HTML test pages
├── .env.example              # Environment template
├── .gitignore                # Git exclusions
├── package.json              # Dependencies
└── README.md                 # This file
```

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd lumitya-optimized
npm install
```

### 2. Configure Environment

Copy the example environment file:

```bash
cp .env.example .env
```

Edit `.env` with your actual credentials:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_actual_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Site Configuration  
SITE_PASSWORD_HASH=ce5fe72586b7b07039f6bf9aa17657414c8380ecb6d1efe6832ac706c8ec2d68

# Server Configuration
PORT=3000
NODE_ENV=development

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

### 3. Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Open your project dashboard
3. Navigate to **Settings** → **API**
4. Copy:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
  - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

Security note:
- `SUPABASE_SERVICE_ROLE_KEY` is backend-only and must never be exposed in the frontend.

### 4. Start the Server

#### Development Mode (with auto-reload):
```bash
npm run dev
```

#### Production Mode:
```bash
npm start
```

#### Simple Python Server (static files only, no API):
```bash
npm run serve
```

### 5. Access the Application

Open your browser: **http://localhost:3000**

## 🗄️ Database Setup

Run this SQL in your Supabase SQL Editor:

```sql
-- Service Requests Table
CREATE TABLE service_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Providers Table
CREATE TABLE providers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  team_size TEXT,
  services TEXT[] NOT NULL,
  years_experience INTEGER,
  description TEXT,
  status TEXT DEFAULT 'pending',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Suppliers Table
CREATE TABLE suppliers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  business_name TEXT,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  neighbourhood TEXT NOT NULL,
  website TEXT,
  materials TEXT[] NOT NULL,
  description TEXT,
  delivery_available BOOLEAN DEFAULT false,
  delivery_cost TEXT,
  delivery_max_km INTEGER,
  min_order TEXT,
  status TEXT DEFAULT 'pending',
  rating DECIMAL(2,1) DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contacts Table
CREATE TABLE contacts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID REFERENCES providers(id),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notifications Table
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  service TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow anon inserts, select approved only)
CREATE POLICY "Allow anon insert requests" ON service_requests FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert providers" ON providers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert suppliers" ON suppliers FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert contacts" ON contacts FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "Allow anon insert notifications" ON notifications FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Allow anon select approved providers" ON providers FOR SELECT TO anon USING (status = 'approved');
CREATE POLICY "Allow anon select approved suppliers" ON suppliers FOR SELECT TO anon USING (status = 'approved');
```

## 🔐 Security Best Practices

1. **Never commit `.env` file** - It's in `.gitignore`
2. **Use environment variables** for all sensitive data
3. **Rotate keys regularly** if exposed
4. **Enable RLS** in Supabase for data protection
5. **Configure CORS** properly for production

## 🚢 Deployment

### Option 1: Vercel/Netlify (Recommended)
1. Push code to GitHub (without `.env`)
2. Connect repository to Vercel/Netlify
3. Add environment variables in dashboard
4. Deploy!

### Option 2: VPS (DigitalOcean, AWS, etc.)
1. SSH into server
2. Clone repository
3. Create `.env` file with production values
4. Install Node.js and dependencies
5. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server/index.js --name lumitya
   pm2 save
   pm2 startup
   ```

### Option 3: Docker
```bash
docker build -t lumitya .
docker run -p 3000:3000 --env-file .env lumitya
```

## 📝 API Endpoints

### POST `/api/requests`
Submit a service request

### POST `/api/providers`
Submit provider application

### POST `/api/suppliers`
Submit supplier application

### GET `/api/providers`
Get approved providers (with optional filters)

### POST `/api/contact`
Contact a provider

### POST `/api/notify`
Subscribe to notifications

## 🐛 Troubleshooting

### "Modal not found" error
- Check that all modal IDs match between HTML and JS
- Ensure `app.js` is loaded after DOM content

### API connection errors
- Verify `.env` file exists and has correct values
- Check Supabase project is active
- Ensure RLS policies are set up

### CORS errors
- Update `ALLOWED_ORIGINS` in `.env`
- Check browser console for specific origin

## 📄 License

MIT License - Feel free to use for your projects

## 🤝 Support

For issues or questions, check:
- Browser console for errors
- Server logs for API issues
- Supabase dashboard for database problems

---

Built with ❤️ for Lumitya Platform
