const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const SITE_URL = (process.env.SITE_URL || 'https://www.lumitya.com').replace(/\/$/, '');
const INDEX_FILE = path.join(process.cwd(), 'public', 'index.html');
const INDEX_TEMPLATE = fs.readFileSync(INDEX_FILE, 'utf8');
const PUBLIC_PAGE_ROUTES = ['/', '/index.html', '/directory', '/pricing', '/terms', '/privacy', '/provider-agreement'];

app.set('trust proxy', 1);

const SEO_BY_LANG = {
  en: {
    htmlLang: 'en',
    locale: 'en_US',
    title: 'Lumitya — Home Service & Materials Platform',
    description: 'Lumitya connects homeowners with independent contractors and material suppliers in Guadalajara and Zapopan.',
    byPath: {
      '/': {
        title: 'Lumitya — Home Service & Materials Platform',
        description: 'Lumitya connects homeowners with independent contractors and material suppliers in Guadalajara and Zapopan.'
      },
      '/directory': {
        title: 'Find Home Service Providers in Guadalajara | Lumitya',
        description: 'Browse independent contractors and compare services, profile details, and trust signals across Guadalajara and Zapopan.'
      },
      '/pricing': {
        title: 'Plans for Contractors and Suppliers | Lumitya',
        description: 'Review Lumitya plans for independent contractors and suppliers who want visibility with local homeowners.'
      },
      '/terms': {
        title: 'Terms of Service | Lumitya',
        description: 'Read Lumitya terms for platform usage, responsibilities, and legal conditions for homeowners and providers.'
      },
      '/privacy': {
        title: 'Privacy Notice | Lumitya',
        description: 'Read how Lumitya collects, uses, and protects personal information under applicable privacy requirements.'
      },
      '/provider-agreement': {
        title: 'Provider Agreement | Lumitya',
        description: 'Review the Lumitya Provider Agreement for independent contractors and suppliers using the platform.'
      }
    }
  },
  es: {
    htmlLang: 'es',
    locale: 'es_MX',
    title: 'Lumitya — Plataforma de Servicios para el Hogar y Materiales',
    description: 'Lumitya conecta propietarios con contratistas independientes y proveedores de materiales en Guadalajara y Zapopan.',
    byPath: {
      '/': {
        title: 'Lumitya — Plataforma de Servicios para el Hogar y Materiales',
        description: 'Lumitya conecta propietarios con contratistas independientes y proveedores de materiales en Guadalajara y Zapopan.'
      },
      '/directory': {
        title: 'Encuentra Proveedores para el Hogar en Guadalajara | Lumitya',
        description: 'Explora contratistas independientes y compara servicios, perfiles y señales de confianza en Guadalajara y Zapopan.'
      },
      '/pricing': {
        title: 'Planes para Contratistas y Proveedores | Lumitya',
        description: 'Conoce los planes de Lumitya para contratistas independientes y proveedores que buscan visibilidad local.'
      },
      '/terms': {
        title: 'Terminos de Servicio | Lumitya',
        description: 'Consulta los terminos de Lumitya sobre uso de la plataforma, responsabilidades y condiciones legales.'
      },
      '/privacy': {
        title: 'Aviso de Privacidad | Lumitya',
        description: 'Conoce como Lumitya recopila, usa y protege informacion personal conforme a requisitos de privacidad aplicables.'
      },
      '/provider-agreement': {
        title: 'Acuerdo de Proveedor | Lumitya',
        description: 'Revisa el Acuerdo de Proveedor de Lumitya para contratistas independientes y proveedores en la plataforma.'
      }
    }
  }
};

function getRequestedLang(req) {
  const queryLang = String(req.query.lang || '').toLowerCase();
  if (queryLang === 'en' || queryLang === 'es') return queryLang;

  const acceptLanguage = String(req.get('accept-language') || '').toLowerCase();
  return acceptLanguage.includes('en') && !acceptLanguage.includes('es') ? 'en' : 'es';
}

function renderLocalizedIndex(req, res) {
  const lang = getRequestedLang(req);
  const seo = SEO_BY_LANG[lang] || SEO_BY_LANG.es;
  const normalizedPath = req.path === '/index.html' ? '/' : req.path;
  const routeSeo = (seo.byPath && seo.byPath[normalizedPath]) || seo.byPath['/'] || seo;
  const sharedUrl = `${SITE_URL}${normalizedPath}?lang=${lang}`;

  let html = INDEX_TEMPLATE;
  html = html.replace('<html lang="es" id="htmlLang">', `<html lang="${seo.htmlLang}" id="htmlLang">`);
  html = html.replace(/<title>.*?<\/title>/, `<title>${routeSeo.title}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${routeSeo.description}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${sharedUrl}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${sharedUrl}">`);
  html = html.replace(/<meta property="og:locale" content="[^"]*">/, `<meta property="og:locale" content="${seo.locale}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${routeSeo.title}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${routeSeo.description}">`);
  html = html.replace(/<meta name="twitter:title" content="[^"]*">/, `<meta name="twitter:title" content="${routeSeo.title}">`);
  html = html.replace(/<meta name="twitter:description" content="[^"]*">/, `<meta name="twitter:description" content="${routeSeo.description}">`);

  res.type('html').send(html);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for now
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const envOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const renderExternalUrl = (process.env.RENDER_EXTERNAL_URL || '').trim();
const allowedOrigins = Array.from(new Set([
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  ...envOrigins,
  ...(renderExternalUrl ? [renderExternalUrl] : [])
]));

console.log('🌐 Allowed CORS origins:', allowedOrigins);
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn('❌ CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use('/api/', limiter);

// Body parser
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function requireAdmin(req, res, next) {
  const required = process.env.ADMIN_TOKEN;
  if (!required) return next();

  const header = req.get('authorization') || '';
  const lower = header.toLowerCase();

  const bearer = lower.startsWith('bearer ') ? header.slice(7).trim() : '';
  const basic = lower.startsWith('basic ') ? header.slice(6).trim() : '';

  let basicUser = '';
  let basicPass = '';
  if (basic) {
    try {
      const decoded = Buffer.from(basic, 'base64').toString('utf8');
      const idx = decoded.indexOf(':');
      if (idx >= 0) {
        basicUser = decoded.slice(0, idx);
        basicPass = decoded.slice(idx + 1);
      } else {
        basicUser = decoded;
      }
    } catch (e) {
      // ignore
    }
  }

  const token = bearer || req.get('x-admin-token') || basicPass || basicUser || '';

  if (token && token === required) return next();
  res.set('WWW-Authenticate', 'Basic realm="Lumitya Admin"');
  return res.status(401).send('Unauthorized');
}

// Protect admin UI page
app.get('/admin-features.html', requireAdmin, (req, res) => {
  res.sendFile(path.join(__dirname, './admin-features.html'));
});

app.get(PUBLIC_PAGE_ROUTES, renderLocalizedIndex);

// Serve static files
app.use(express.static('public'));

// API Routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Lumitya API Server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: public/`);
  console.log(`🔒 Environment: ${process.env.NODE_ENV || 'development'}`);
});
