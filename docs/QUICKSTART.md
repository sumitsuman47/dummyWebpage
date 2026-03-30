# 🚀 Lumitya Platform - Quick Start Guide

## Running the Project

### Option 1: Quick Start (Connect)
```bash
./run.sh
```
This script will:
- Install dependencies if needed
- Check your .env file
- Start the backend server
- Open your browser automatically

### Option 2: Manual Start
```bash
# 1. Install dependencies (first time only)
npm install

# 2. Start the backend server
node server/index.js

# 3. Open browser
open http://localhost:3000
```

### Option 3: Development Mode (with auto-restart)
```bash
npm run dev
```

## 📋 Prerequisites

✅ **Already Installed:**
- Node.js v25.8.0
- npm v11.11.0
- All dependencies (103 packages)

✅ **Already Configured:**
- Supabase connection
- EmailJS integration
- Environment variables

## 🗄️ Database Setup

**Important:** Run these SQL scripts in your Supabase dashboard first:

1. Go to https://supabase.com/dashboard
2. Select project: `qylfvajhihlxrpmztpou`
3. Click "SQL Editor"
4. Run each script:

```sql
-- 1. Service Requests table
-- File: supabase-service-requests.sql

-- 2. Contractor Join Requests table
-- File: supabase-contractor-requests.sql

-- 3. Submissions table (optional)
-- File: supabase-policies.sql
```

## 🌐 Access Your Site

Once running, access at:
- **Local:** http://localhost:3000
- **Production:** Configure your hosting platform

## 📡 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Server health check |
| `/api/requests` | POST | Submit service request |
| `/api/providers` | POST | Contractor application |
| `/api/providers` | GET | Get provider list |
| `/api/suppliers` | POST | Supplier application |
| `/api/contact` | POST | Contact provider |
| `/api/notify` | POST | Premium notifications |

## 🧪 Testing

Test your setup:
```bash
# Test service requests
./test-service-requests.sh

# Test contractor applications
./test-contractor-requests.sh

# Test full API
./test-full-api.sh
```

## 🛑 Stopping the Server

```bash
# Find the process
lsof -ti:3000

# Kill it
pkill -f "node server/index.js"
```

## 🐛 Debugging

Use VS Code debugger:
1. Press F5 or go to Run > Start Debugging
2. Select "Debug Server" or "Full Stack Debug"
3. Set breakpoints in your code

## 📁 Project Structure

```
lumitya-optimized/
├── public/              # Frontend files
│   ├── index.html       # Main page
│   ├── css/            # Stylesheets
│   └── js/             # JavaScript (app.js, emailjs-config.js)
├── server/              # Backend
│   ├── index.js        # Express server
│   ├── routes/         # API routes
│   └── services/       # Supabase integration
├── .env                # Environment variables
├── package.json        # Dependencies
└── run.sh             # Quick start script
```

## 🔑 Environment Variables

Your `.env` file is configured with:
- Supabase URL and API key
- EmailJS credentials
- Server port (3000)

## 🚢 Deployment

To deploy to production:

### Vercel (Connect)
```bash
npm install -g vercel
vercel
```

### Railway
```bash
# Connect your GitHub repo or use CLI
railway up
```

### Manual Deployment
1. Push code to GitHub
2. Connect to your hosting platform
3. Set environment variables
4. Deploy!

## 📞 Support

If you encounter issues:
1. Check server logs: `node server/index.js`
2. Test API: `./test-full-api.sh`
3. Verify database tables exist in Supabase
4. Check `.env` file has correct credentials

---

**Status:** ✅ All systems configured and tested
**Last Updated:** March 8, 2026
