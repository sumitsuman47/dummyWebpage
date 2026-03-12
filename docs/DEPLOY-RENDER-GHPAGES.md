# Deploy: Render (API) + GitHub Pages (Frontend)

This project is designed to run as:
- **GitHub Pages**: static frontend (everything in `public/`)
- **Render**: Node/Express backend API (`server/index.js`)

## 0) Prerequisites

- A Supabase project with the required tables + RLS policies applied (see `supabase-setup.sql`, `supabase-service-requests.sql`, `supabase-contractor-requests.sql`, `supabase-policies.sql`, and `sql/feature_flags_setup.sql`).
- A GitHub repo for this project.

## 1) Deploy the backend to Render

### Create the Render service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repo
3. Select the branch to deploy

### Build & start settings

- **Environment**: `Node`
- **Build Command**: `npm install --omit=dev`
- **Start Command**: `node server/index.js`

### Environment variables (Render → Environment)

Set these:
- `SUPABASE_URL` = your Supabase Project URL
- `SUPABASE_ANON_KEY` = your Supabase anon key
- `NODE_ENV` = `production`
- `PORT` = (Render provides `PORT` automatically; you can omit it)
- `ALLOWED_ORIGINS` = your GitHub Pages origin, for example:
  - `https://<your-github-user>.github.io`
  - If using a project page: `https://<your-github-user>.github.io/<repo-name>`
  - If using a custom domain: `https://yourdomain.com`
- `ADMIN_TOKEN` = a long random secret (protects admin endpoints + `admin-features.html`)

After deploy, note your Render URL, e.g.:
- `https://your-service.onrender.com`

Health check should work:
- `GET https://your-service.onrender.com/health`

## 2) Configure the frontend for GitHub Pages

The frontend needs to call Render instead of same-origin `/api`.

### Set runtime API base

Edit `public/js/runtime-config.js` to point at your Render API root:

```js
window.LUMITYA_API_BASE = 'https://your-service.onrender.com/api';
```

Notes:
- You can set either `https://your-service.onrender.com` **or** `https://your-service.onrender.com/api`.
- The code normalizes it to end in `/api`.

### Publish to GitHub Pages

Typical approach:
1. Push your repo to GitHub
2. GitHub repo → **Settings** → **Pages**
3. Choose your deploy source:
   - **Branch**: `main` (or `master`)
   - **Folder**: `/public`

If your GitHub Pages setup only allows `/ (root)` and not `/public`, you have two options:
- Move/copy the `public/` contents to the repository root for Pages, or
- Use a GitHub Action to publish `public/` to a dedicated `gh-pages` branch.

## 3) Secure the admin feature flags UI

These are protected by `ADMIN_TOKEN` on the backend:
- `GET /api/features/all`
- `GET /api/features/used`
- `PATCH /api/features/:key`
- `GET /api/features/audit`
- `GET /admin-features.html`

To access the admin page:
- Open `https://your-service.onrender.com/admin-features.html`
- When prompted, enter the admin token

Important:
- Do **not** host `admin-features.html` on GitHub Pages if you want it protected.

## 4) Verification checklist

### API checks

```bash
curl -s https://your-service.onrender.com/health
curl -s https://your-service.onrender.com/api/features | head
```

### CORS sanity

From your GitHub Pages site (browser), open DevTools → Console:

```js
fetch('https://your-service.onrender.com/api/features').then(r => r.json()).then(console.log)
```

If you see CORS errors, update `ALLOWED_ORIGINS` in Render to match the exact origin.

## 5) Maintenance basics

- Monitor `GET /health` uptime.
- Keep `ALLOWED_ORIGINS` updated when adding domains.
- Rotate `ADMIN_TOKEN` if it’s ever shared/leaked.
- Review feature flags periodically using `/api/features/used`.
