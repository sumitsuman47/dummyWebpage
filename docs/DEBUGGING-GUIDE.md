# Debugging Guide for Lumitya Platform

## Quick Start Debugging

### Option 1: Browser DevTools (No Setup Required)

1. **Open the site** in your browser (Chrome/Firefox)
2. **Right-click** anywhere → "Inspect" or press `F12`
3. Go to **Console** tab to see logs and errors
4. Go to **Network** tab to see API calls
5. Go to **Sources** tab to set breakpoints in JavaScript

**Useful Console Commands:**
```javascript
// Check if functions are loaded
console.log(typeof window.submitMatch); // Should be "function"

// Test API connection
fetch('/api/health').then(r => r.json()).then(console.log);

// Check EmailJS config
console.log(window.EmailJSConfig);

// See all form data
document.getElementById('mnm').value; // Get specific field value
```

---

### Option 2: VS Code Debugger (Professional)

#### 🚀 Debug Server (Backend)

1. **Open VS Code** in project folder
2. Press `F5` or go to **Run and Debug** (sidebar)
3. Select: **🚀 Debug Server**
4. Server starts with debugger attached
5. Set breakpoints in `server/` files
6. Make API calls to trigger breakpoints

**Set breakpoints in:**
- `server/index.js` - Server startup
- `server/routes/api.js` - API endpoints
- `server/services/supabase.js` - Database operations

#### 🌐 Debug Frontend (Chrome)

1. **First start the server:**
   ```bash
   node server/index.js
   ```
2. In VS Code, press `F5`
3. Select: **🌐 Debug Frontend (Chrome)**
4. Chrome opens with debugger attached
5. Set breakpoints in `public/js/app.js`
6. Interact with the site to trigger breakpoints

#### 🔧 Full Stack Debug (Both at Once)

1. Press `F5` in VS Code
2. Select: **🔧 Full Stack Debug**
3. Debugs both backend and frontend simultaneously
4. Set breakpoints anywhere
5. Step through code from form submission to database

---

## Debugging Without Node.js

If Node.js isn't installed, you can still debug the frontend:

### Method 1: Python Server + Browser DevTools

```bash
# Start simple web server
cd /Users/v859832/Downloads/lumitya-optimized
python3 -m http.server 3000

# Open in browser
open http://localhost:3000
```

Then use browser DevTools (F12) to debug.

### Method 2: Open HTML Directly

```bash
# Open test pages directly
open public/index.html
open test-form.html
open test-buttons.html
```

Use browser DevTools to debug JavaScript.

---

## Common Debugging Scenarios

### 🐛 Button Not Working

**Steps:**
1. Open browser DevTools (F12)
2. Click the button
3. Check **Console** for errors
4. Check if onclick handler exists:
   ```javascript
   console.log(typeof window.openMatch); // Should be "function"
   ```
5. Set breakpoint in `app.js` at the button handler function
6. Click button again to trigger breakpoint

**Quick Fix:**
```javascript
// In browser console, test function directly:
window.openMatch();
```

---

### 🐛 Form Submission Failing

**Steps:**
1. Open **Network** tab in DevTools
2. Submit the form
3. Look for the API call (e.g., `/api/requests`)
4. Click on it to see:
   - Request payload (what you sent)
   - Response (what came back)
   - Status code (200 = success, 4xx/5xx = error)

**Check validation:**
```javascript
// In browser console, check form values:
console.log({
  name: document.getElementById('mnm').value,
  city: document.getElementById('mcity').value,
  phone: document.getElementById('mph').value
});
```

**Backend debugging:**
- Add breakpoint in `server/routes/api.js` at `router.post('/requests')`
- Submit form
- VS Code debugger will pause at breakpoint
- Inspect `req.body` to see received data

---

### 🐛 Supabase Not Saving Data

**Check backend:**
1. Set breakpoint in `server/services/supabase.js` at `createRequest()`
2. Submit form
3. When debugger pauses, inspect:
   - `data` parameter (what's being sent)
   - `SUPABASE_URL` variable (is it set?)
   - `SUPABASE_ANON_KEY` variable (is it set?)

**Check .env file:**
```bash
cat .env
# Should contain:
# SUPABASE_URL=https://...
# SUPABASE_ANON_KEY=...
```

**Test Supabase directly:**
```bash
# Test API connection
curl -X POST https://your-project.supabase.co/rest/v1/service_requests \
  -H "apikey: your_anon_key" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","city":"Guadalajara"}'
```

---

### 🐛 EmailJS Not Sending

**Check console for:**
- `✅ EmailJS initialized successfully` ← Should see this on page load
- `Email notification sent` ← Should see after form submit

**Common issues:**
1. **Not configured:** Edit `public/js/emailjs-config.js` with real credentials
2. **Script not loaded:** Check Network tab for `email.min.js` (should be 200 OK)
3. **Template ID wrong:** Verify template IDs in EmailJS dashboard

**Test directly in console:**
```javascript
// Check if EmailJS loaded
console.log(typeof emailjs); // Should be "object"

// Test send
window.EmailJSConfig.sendServiceRequest({
  name: "Test",
  phone: "123456789",
  city: "Guadalajara",
  service: "Test",
  description: "Test"
});
```

---

### 🐛 Mobile Menu Not Opening

**Steps:**
1. Open in mobile view (DevTools → Toggle device toolbar)
2. Click hamburger menu
3. Check console for errors
4. Verify DOM elements exist:
   ```javascript
   console.log(document.getElementById('mobNav')); // Should exist
   console.log(document.getElementById('hbgBtn')); // Should exist
   ```

**Test manually:**
```javascript
// In console, trigger manually:
window.toggleMobNav();
```

---

## VS Code Debug Configurations

### 🚀 Debug Server
- Debugs backend Node.js code
- Breakpoints work in `server/` folder
- Auto-restarts on file changes

### 🌐 Debug Frontend (Chrome)
- Debugs frontend JavaScript
- Breakpoints work in `public/js/` files
- Chrome DevTools + VS Code breakpoints both work

### 🧪 Debug API Tests
- Runs server on port 3001
- Good for testing without affecting main server

### 🔥 Debug Full Stack
- Starts server and automatically opens Chrome
- One-click debugging for everything

### 🔧 Full Stack Debug (Compound)
- Runs both server and frontend debuggers
- Best for tracing issues through entire stack

---

## Breakpoint Tips

### Where to Set Breakpoints

**Frontend validation issues:**
- `public/js/app.js` → `serviceRequest.submit()` line 256
- Check validation logic before API call

**API call issues:**
- `public/js/app.js` → `api.submitServiceRequest()` line 90
- See what's being sent to backend

**Backend validation:**
- `server/routes/api.js` → `router.post('/requests')` line 19
- Check if request reaches backend

**Database issues:**
- `server/services/supabase.js` → `createRequest()` line 37
- See what's being sent to Supabase

### Using Breakpoints in VS Code

1. Click in the **gutter** (left of line numbers) to set breakpoint (red dot appears)
2. Press `F5` to start debugging
3. Code pauses at breakpoint
4. Hover over variables to see values
5. Use **Debug toolbar**:
   - Continue (F5) - Resume
   - Step Over (F10) - Next line
   - Step Into (F11) - Go into function
   - Step Out (Shift+F11) - Exit function

---

## Logging Best Practices

### Add Temporary Debug Logs

```javascript
// Frontend (app.js)
console.log('🔍 Form data:', data);
console.log('📞 API calling:', CONFIG.API_BASE);
console.log('✅ Success:', result);
console.error('❌ Error:', error);

// Backend (api.js)
console.log('📥 Received request:', req.body);
console.log('📤 Sending response:', result);
console.error('💥 Error occurred:', error.message);
```

### View Logs

**Frontend logs:**
- Browser console (F12 → Console tab)

**Backend logs:**
- Terminal where you ran `node server/index.js`
- VS Code Debug Console

---

## Testing Workflow

1. **Test in isolation first:**
   - Use `test-form.html` to test form validation only
   - Use `test-buttons.html` to test button functions

2. **Test with API:**
   - Start server: `node server/index.js`
   - Open `http://localhost:3000`
   - Check Network tab for API calls

3. **Test with debugger:**
   - Set breakpoints
   - Step through code
   - Verify data at each step

4. **Test in production mode:**
   - Set `NODE_ENV=production` in `.env`
   - Check no debug info leaks to frontend

---

## Quick Debug Commands

### Check Server is Running
```bash
curl http://localhost:3000/health
# Should return: {"status":"ok"}
```

### Test API Endpoints
```bash
# Service request
curl -X POST http://localhost:3000/api/requests \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","city":"Guadalajara","neighbourhood":"Centro","service":"Plumbing","description":"Test","timeline":"Soon","phone":"123456789"}'

# Provider application
curl -X POST http://localhost:3000/api/providers \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","phone":"123456789","email":"test@test.com","city":"Guadalajara","neighbourhood":"Centro","services":["Plumbing"]}'
```

### Check Environment
```bash
# Verify Node.js
node --version

# Verify npm packages
npm list --depth=0

# Check .env file exists
ls -la .env

# Verify port is free
lsof -ti:3000
```

---

## Troubleshooting Debugger

### Issue: Breakpoints Not Hit (VS Code)
**Solutions:**
- Ensure debugger is actually running (green bar at bottom)
- Check file path is correct (breakpoint may be gray = not bound)
- Restart debugger (Ctrl+Shift+F5)
- Check source maps are enabled

### Issue: "Cannot find module" Error
**Solutions:**
```bash
# Install dependencies
npm install

# Verify node_modules exists
ls node_modules/
```

### Issue: Port Already in Use
**Solutions:**
```bash
# Find what's using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Or use different port in .env
echo "PORT=3001" >> .env
```

### Issue: VS Code Debugger Not Starting
**Solutions:**
- Install Node.js if missing
- Check `.vscode/launch.json` exists
- Try "JavaScript Debugger" extension

---

## Best Debugging Tools

### VS Code Extensions (Recommended)
- **JavaScript Debugger** (built-in) - Debug JS/Node
- **REST Client** - Test APIs in VS Code
- **Thunder Client** - API testing GUI
- **Error Lens** - Inline error messages

### Browser Extensions
- **React DevTools** (if using React later)
- **Redux DevTools** (if using Redux later)
- **JSON Formatter** - Pretty print JSON responses

### External Tools
- **Postman** - API testing
- **Insomnia** - Alternative API client
- **Supabase Studio** - Database GUI

---

## Pro Tips

1. **Use descriptive console.logs with emojis:**
   ```javascript
   console.log('🚀 Starting submission');
   console.log('📝 Form data:', data);
   console.log('✅ Success!');
   console.error('❌ Failed:', error);
   ```

2. **Group related logs:**
   ```javascript
   console.group('Service Request Submission');
   console.log('Data:', data);
   console.log('Validation:', isValid);
   console.groupEnd();
   ```

3. **Use debugger statement for quick breaks:**
   ```javascript
   if (someCondition) {
     debugger; // Pauses here when DevTools open
   }
   ```

4. **Network tab is your friend:**
   - See all API calls
   - Check request/response
   - See timing
   - Replay requests

5. **Preserve log in console:**
   - Check "Preserve log" in DevTools Console
   - Keeps logs across page reloads

---

## Need More Help?

1. **Check error messages** - They usually tell you what's wrong
2. **Check browser console** - Frontend errors appear here
3. **Check terminal** - Backend errors appear here
4. **Check Network tab** - API call issues show here
5. **Use breakpoints** - Step through code line by line
6. **Add console.logs** - See variable values at runtime

Good luck debugging! 🐛 → 🦋
