const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabase');
const featureUsage = require('../services/feature-usage');

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

  return res.status(401).json({
    success: false,
    error: 'Unauthorized'
  });
}

// Validate request body
const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const missing = requiredFields.filter(field => !req.body[field]);
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing
      });
    }
    next();
  };
};

// Submit service request
router.post('/requests', async (req, res) => {
  try {
    // Required fields
    const requiredFields = ['name', 'city', 'neighbourhood', 'service', 'description', 'phone'];
    const missing = requiredFields.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing
      });
    }

    const result = await supabaseService.createRequest(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Request submission error:', error);
    res.status(500).json({
      error: 'Failed to submit request',
      message: error.message
    });
  }
});

// Provider application
router.post('/providers', validateRequest([
  'name', 'phone', 'email', 'city', 'neighbourhood', 'services'
]), async (req, res) => {
  try {
    // Validate services is an array
    if (!Array.isArray(req.body.services) || req.body.services.length === 0) {
      return res.status(400).json({
        error: 'Services must be a non-empty array'
      });
    }

    const result = await supabaseService.createProvider(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Provider application error:', error);
    res.status(500).json({
      error: 'Failed to submit application',
      message: error.message
    });
  }
});

// Supplier application
router.post('/suppliers', validateRequest([
  'name', 'phone', 'email', 'city', 'neighbourhood', 'materials'
]), async (req, res) => {
  try {
    // Validate materials is an array
    if (!Array.isArray(req.body.materials) || req.body.materials.length === 0) {
      return res.status(400).json({
        error: 'Materials must be a non-empty array'
      });
    }

    const result = await supabaseService.createSupplier(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Supplier application error:', error);
    res.status(500).json({
      error: 'Failed to submit application',
      message: error.message
    });
  }
});

// Get providers (public directory)
router.get('/providers', async (req, res) => {
  try {
    const { city, category, page = 1, limit = 12 } = req.query;
    console.log('Fetching providers:', { city, category, page, limit });

    const result = await supabaseService.getProviders({ city, category, page, limit });

    console.log(`Found ${Array.isArray(result) ? result.length : 0} providers`);
    res.json({ success: true, data: result || [] });
  } catch (error) {
    console.error('Get providers error:', error);
    res.status(500).json({
      error: 'Failed to fetch providers',
      message: error.message
    });
  }
});

// Contact provider
router.post('/contact', validateRequest([
  'provider_id', 'name', 'phone', 'message'
]), async (req, res) => {
  try {
    const result = await supabaseService.createContact(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Contact submission error:', error);
    res.status(500).json({
      error: 'Failed to send contact request',
      message: error.message
    });
  }
});

// Provider report / fraud reporting
router.post('/provider-reports', async (req, res) => {
  try {
    const requiredFields = ['provider_name', 'issue_type', 'details'];
    const missing = requiredFields.filter(field => !req.body[field]);

    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing
      });
    }

    const allowedIssueTypes = ['suspected_fraud', 'no_show', 'misrepresentation'];
    if (!allowedIssueTypes.includes(req.body.issue_type)) {
      return res.status(400).json({
        error: 'Invalid issue type'
      });
    }

    const result = await supabaseService.createProviderReport(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Provider report submission error:', error);
    res.status(500).json({
      error: 'Failed to submit provider report',
      message: error.message
    });
  }
});

// Get provider reports (admin)
router.get('/provider-reports', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const reports = await supabaseService.getProviderReports(limit);

    res.json({
      success: true,
      reports,
      count: Array.isArray(reports) ? reports.length : 0
    });
  } catch (error) {
    console.error('Error fetching provider reports:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider reports',
      message: error.message
    });
  }
});

// Update provider report action/status (admin)
router.patch('/provider-reports/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes = '', reviewed_by = 'admin' } = req.body;
    const allowedStatuses = ['submitted', 'under_review', 'resolved', 'dismissed'];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid status'
      });
    }

    const result = await supabaseService.updateProviderReport(id, {
      status,
      resolution_notes,
      reviewed_by
    });

    res.json({
      success: true,
      data: result,
      message: `Provider report updated to ${status}`
    });
  } catch (error) {
    console.error('Error updating provider report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update provider report',
      message: error.message
    });
  }
});

// Notify when available
router.post('/notify', validateRequest([
  'email', 'city'
]), async (req, res) => {
  try {
    const result = await supabaseService.createNotification(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Notification subscription error:', error);
    res.status(500).json({
      error: 'Failed to subscribe',
      message: error.message
    });
  }
});

// =============================================
// CATEGORIES ENDPOINT
// =============================================

// Get active categories (public)
router.get('/categories', async (req, res) => {
  try {
    const categories = await supabaseService.getCategories();
    res.json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
      message: error.message
    });
  }
});

// Get provider counts by category
router.get('/provider-counts', async (req, res) => {
  try {
    const counts = await supabaseService.getProviderCountsByCategory();
    res.json({ success: true, data: counts });
  } catch (error) {
    console.error('Error fetching provider counts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch provider counts',
      message: error.message
    });
  }
});

// =============================================
// FEATURE FLAGS ENDPOINTS
// =============================================

// Get all public feature flags with explicit enabled/disabled state
router.get('/features', async (req, res) => {
  try {
    const features = await supabaseService.getPublicFeatureFlags();

    // Return as object map for easy checking
    const featureMap = {};
    features.forEach(feature => {
      featureMap[feature.feature_key] = {
        enabled: feature.is_enabled === true,
        name: feature.feature_name,
        category: feature.category
      };
    });

    // Safe default: language toggle is a basic UX control.
    // If it's not present in the feature flags table, keep it enabled.
    if (!featureMap.language_switcher) {
      featureMap.language_switcher = {
        enabled: true,
        name: 'Language Switcher',
        category: 'ui'
      };
    }

    res.json({
      success: true,
      features: featureMap,
      count: Object.keys(featureMap).length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags',
      message: error.message
    });
  }
});

// Get all feature flags (admin - includes disabled)
router.get('/features/all', requireAdmin, async (req, res) => {
  try {
    const features = await supabaseService.getAllFeatureFlags();
    res.json({
      success: true,
      features: features,
      count: features.length
    });
  } catch (error) {
    console.error('Error fetching all feature flags:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch feature flags',
      message: error.message
    });
  }
});

// Get feature keys that are referenced in the codebase (used flags)
router.get('/features/used', requireAdmin, async (req, res) => {
  try {
    const usedKeys = await featureUsage.getUsedFeatureKeys();
    const used = Array.from(usedKeys).sort();

    res.json({
      success: true,
      used,
      count: used.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error computing used feature keys:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compute used feature keys',
      message: error.message
    });
  }
});

// Toggle feature flag (admin)
router.patch('/features/:key', requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { is_enabled, updated_by = 'admin' } = req.body;

    if (typeof is_enabled !== 'boolean') {
      return res.status(400).json({
        success: false,
        error: 'is_enabled must be a boolean'
      });
    }

    const result = await supabaseService.toggleFeatureFlag(key, is_enabled, updated_by);

    res.json({
      success: true,
      data: result,
      message: `Feature ${key} ${is_enabled ? 'enabled' : 'disabled'}`
    });
  } catch (error) {
    console.error('Error toggling feature flag:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to toggle feature flag',
      message: error.message
    });
  }
});

// Get feature flag audit log
router.get('/features/audit', requireAdmin, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const audit = await supabaseService.getFeatureAuditLog(limit);

    res.json({
      success: true,
      audit: audit,
      count: audit.length
    });
  } catch (error) {
    console.error('Error fetching audit log:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch audit log',
      message: error.message
    });
  }
});

module.exports = router;
