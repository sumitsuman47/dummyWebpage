# 🚀 How to Launch Lumitya Platform

## Method 1: Quick Launch (Recommended - No Node.js Required)

### Option A: Using the Launch Script

```bash
# Navigate to the project folder
cd /Users/v859832/Downloads/lumitya-optimized

# Run the launch script
./launch.sh
```

The site will open at: **http://localhost:3000**

### Option B: Manual Python Server

```bash
# Navigate to the project folder
cd /Users/v859832/Downloads/lumitya-optimized/public

# Start Python server
python3 -m http.server 3000
```

Then open: **http://localhost:3000** in your browser

---

## Method 2: Open HTML Directly (Testing Only)

```bash
# Just open the file in browser
open /Users/v859832/Downloads/lumitya-optimized/public/index.html
```

⚠️ **Note:** This works for basic testing but API calls won't work without a server.

---

## Method 3: With Node.js Backend (Full Features)

If you install Node.js later, you can run the full backend:

```bash
# Install Node.js from: https://nodejs.org/

# Then run:
cd /Users/v859832/Downloads/lumitya-optimized
npm install
npm start
```

---

## Quick Launch Commands

### Start the site:
```bash
cd /Users/v859832/Downloads/lumitya-optimized
./launch.sh
```

### Start on different port:
```bash
./launch.sh 8080
```

### Stop the server:
Press `Ctrl+C` in the terminal

---

## What Works Without Backend

✅ **Works:**
- All page navigation
- All buttons and modals
- Form validation
- Mobile menu
- Language switching
- UI interactions

❌ **Doesn't Work:**
- Form submissions (no API)
- Supabase database saves
- Email notifications

To get full functionality, you need:
1. Node.js server running (`npm start`)
2. Supabase configured (`.env` file)
3. EmailJS configured (`emailjs-config.js`)

---

## Troubleshooting

### Port Already in Use
```bash
# Use different port
./launch.sh 8080

# Or kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Permission Denied
```bash
# Make script executable
chmod +x launch.sh
```

### Python Not Found
```bash
# Check Python installation
python3 --version

# Or use Python 2
python -m SimpleHTTPServer 3000
```

---

## VS Code Launch

You can also launch from VS Code:

1. Open project in VS Code
2. Press `F5`
3. Select "🌐 Debug Frontend (Chrome)"
4. But first start Python server in terminal

---

## Browser Options

Once server is running, open in any browser:

**Chrome:**
```bash
open -a "Google Chrome" http://localhost:3000
```

**Safari:**
```bash
open -a Safari http://localhost:3000
```

**Firefox:**
```bash
open -a Firefox http://localhost:3000
```

**Default browser:**
```bash
open http://localhost:3000
```

---

## Next Steps After Launch

1. ✅ **Test the site** - Click around, test buttons
2. ✅ **Check browser console** (F12) for any errors
3. ✅ **Test forms** - They'll validate but won't submit without backend
4. ⚙️ **Install Node.js** when ready for full features
5. ⚙️ **Configure Supabase** for database
6. ⚙️ **Configure EmailJS** for notifications

---

## Production Deployment

For production, use a proper web server:

- **Netlify** - Drag & drop `public` folder
- **Vercel** - Connect GitHub repo
- **AWS S3** - Upload static files
- **Your own server** - Copy `public` folder

Backend can be deployed to:
- **Railway** - Node.js hosting
- **Render** - Free tier available
- **Heroku** - Container deployment
- **DigitalOcean** - VPS hosting

---

**Need help?** Check `DEBUGGING-GUIDE.md` for detailed troubleshooting.
