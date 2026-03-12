const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false, // Allow inline scripts for now
  crossOriginEmbedderPolicy: false
}));

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
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
