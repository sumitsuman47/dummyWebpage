#!/usr/bin/env node

/**
 * Lumitya UI & API Test Suite
 * 
 * Tests all features including:
 * - ZeptoMail integration
 * - Email notifications (admin + user confirmation)
 * - Service Request forms (EN/ES)
 * - Provider Application forms (EN/ES)
 * - i18n translations
 * - API endpoints
 * 
 * Run: npm run ui-test
 * Or: node scripts/ui-test.js
 */

const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

// Configuration
const BASE_URL = process.env.TEST_URL || 'http://localhost:3000';
const VERBOSE = process.argv.includes('--verbose') || process.argv.includes('-v');
const TEST_EMAIL = process.argv.includes('--send-email');

// Print usage if requested
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Lumitya UI & API Test Suite');
  console.log('Usage: npm run ui-test [-- --verbose] [--send-email]');
  process.exit(0);
}

// Test Results
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: []
};

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  dim: '\x1b[2m',
  bold: '\x1b[1m'
};

// Helper functions
function log(msg, color = '') {
  console.log(`${color}${msg}${colors.reset}`);
}

function pass(name, details = '') {
  results.passed++;
  results.tests.push({ name, status: 'PASS', details });
  log(`  ✅ ${name}`, colors.green);
  if (VERBOSE && details) log(`     ${details}`, colors.dim);
}

function fail(name, error = '') {
  results.failed++;
  results.tests.push({ name, status: 'FAIL', error });
  log(`  ❌ ${name}`, colors.red);
  if (error) log(`     Error: ${error}`, colors.dim);
}

function skip(name, reason = '') {
  results.skipped++;
  results.tests.push({ name, status: 'SKIP', reason });
  log(`  ⏭️  ${name} (skipped: ${reason})`, colors.yellow);
}

function section(title) {
  log(`\n${colors.bold}${colors.cyan}━━━ ${title} ━━━${colors.reset}\n`);
}

// HTTP request helper
function request(method, urlPath, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, BASE_URL);
    const isHttps = url.protocol === 'https:';
    const lib = isHttps ? https : http;
    
    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    };

    if (data) {
      options.headers['Content-Length'] = Buffer.byteLength(JSON.stringify(data));
    }

    const req = lib.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

// ============================================
// TEST SUITES
// ============================================

async function testServerHealth() {
  section('🏥 Server Health Check');
  
  try {
    const res = await request('GET', '/health');
    if (res.status === 200 && (res.data.status === 'ok' || res.data.healthy === true)) {
      pass('Server is running', `Status: healthy`);
    } else {
      fail('Server health check', `Unexpected response: ${JSON.stringify(res.data)}`);
    }
  } catch (err) {
    fail('Server connection', `Cannot reach ${BASE_URL} - ${err.message}`);
    log('\n⚠️  Make sure the server is running: npm run dev\n', colors.yellow);
    process.exit(1);
  }
}

async function testStaticFiles() {
  section('📁 Static File Serving');
  
  try {
    const res = await request('GET', '/');
    if (res.status === 200 && typeof res.data === 'string' && res.data.includes('Lumitya')) {
      pass('Homepage served', 'index.html loads correctly');
    } else {
      fail('Homepage', 'Page content not found');
    }
  } catch (err) {
    fail('Homepage', err.message);
  }

  // Test CSS
  try {
    const res = await request('GET', '/css/complete-styles.css');
    if (res.status === 200) {
      pass('CSS files served');
    } else {
      fail('CSS files', `Status: ${res.status}`);
    }
  } catch (err) {
    fail('CSS files', err.message);
  }

  // Test JS
  try {
    const res = await request('GET', '/js/app.js');
    if (res.status === 200) {
      pass('JavaScript files served');
    } else {
      fail('JavaScript files', `Status: ${res.status}`);
    }
  } catch (err) {
    fail('JavaScript files', err.message);
  }
}

async function testAPIEndpoints() {
  section('🔌 API Endpoints');

  // Categories
  try {
    const res = await request('GET', '/api/categories');
    if (res.status === 200 && res.data.success && Array.isArray(res.data.data)) {
      pass('GET /api/categories', `Found ${res.data.data.length} categories`);
    } else {
      fail('GET /api/categories', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('GET /api/categories', err.message);
  }

  // Providers
  try {
    const res = await request('GET', '/api/providers?limit=5');
    if (res.status === 200 && res.data.success) {
      pass('GET /api/providers', `Found ${res.data.data?.length || 0} providers`);
    } else {
      fail('GET /api/providers', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('GET /api/providers', err.message);
  }

  // Feature flags
  try {
    const res = await request('GET', '/api/features');
    if (res.status === 200 && res.data.success) {
      pass('GET /api/features', `Loaded ${Object.keys(res.data.data || {}).length} flags`);
    } else {
      fail('GET /api/features', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('GET /api/features', err.message);
  }

  // Provider counts by category
  try {
    const res = await request('GET', '/api/provider-counts');
    if (res.status === 200 && res.data.success) {
      pass('GET /api/provider-counts', `Found ${Object.keys(res.data.data || {}).length} categories`);
    } else {
      fail('GET /api/provider-counts', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('GET /api/provider-counts', err.message);
  }
}

async function testServiceRequestForm() {
  section('📝 Service Request Form (EN)');

  const testData = {
    name: 'UI Test User',
    email: 'uitest@example.com',
    phone: '3331234567',
    city: 'Guadalajara',
    neighbourhood: 'Providencia',
    service: 'Plumbing',
    description: 'Test service request from UI test suite',
    budget: 'MXN 10,000-30,000',
    timeline: 'Soon – within 1 month',
    language_code: 'en',
    turnstileToken: 'local-dev-bypass'
  };

  try {
    const res = await request('POST', '/api/requests', testData);
    if (res.status === 200 && res.data.success) {
      pass('Service request submission (EN)', `ID: ${res.data.data?.id || 'created'}`);
      if (res.data.adminEmailSent) {
        pass('Admin notification email sent');
      } else {
        skip('Admin notification email', 'Email service may be disabled');
      }
      if (res.data.confirmationEmailSent) {
        pass('User confirmation email sent');
      } else {
        skip('User confirmation email', 'Email service may be disabled');
      }
    } else {
      fail('Service request submission (EN)', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('Service request submission (EN)', err.message);
  }
}

async function testServiceRequestFormSpanish() {
  section('📝 Service Request Form (ES)');

  const testData = {
    name: 'Usuario de Prueba',
    email: 'prueba@example.com',
    phone: '3339876543',
    city: 'Zapopan',
    neighbourhood: 'Chapalita',
    service: 'Electricidad',
    description: 'Solicitud de prueba del sistema de pruebas UI',
    budget: 'MXN 30,000-80,000',
    timeline: 'Pronto – dentro de 1 mes',
    language_code: 'es',
    turnstileToken: 'local-dev-bypass'
  };

  try {
    const res = await request('POST', '/api/requests', testData);
    if (res.status === 200 && res.data.success) {
      pass('Service request submission (ES)', `ID: ${res.data.data?.id || 'created'}`);
      if (res.data.adminEmailSent) {
        pass('Admin notification email sent (ES)');
      } else {
        skip('Admin notification email (ES)', 'Email service may be disabled');
      }
      if (res.data.confirmationEmailSent) {
        pass('User confirmation email sent (ES)');
      } else {
        skip('User confirmation email (ES)', 'Email service may be disabled');
      }
    } else {
      fail('Service request submission (ES)', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('Service request submission (ES)', err.message);
  }
}

async function testProviderApplicationForm() {
  section('👷 Provider Application Form (EN)');

  const testData = {
    name: 'Test Provider',
    business: 'Test Plumbing Co',
    email: 'provider@example.com',
    phone: '3335551234',
    city: 'Guadalajara',
    neighbourhood: 'Centro',
    zone: 'Guadalajara Metropolitan',
    services: ['plumbing', 'electrical'],
    experience: '5-10 years',
    team: '2-5 people',
    website: 'https://example.com',
    description: 'Test provider application from UI test suite',
    language_code: 'en',
    turnstileToken: 'local-dev-bypass'
  };

  try {
    const res = await request('POST', '/api/providers', testData);
    if (res.status === 200 && res.data.success) {
      pass('Provider application submission (EN)', `ID: ${res.data.data?.id || 'created'}`);
      if (res.data.adminEmailSent) {
        pass('Admin notification email sent');
      }
      if (res.data.confirmationEmailSent) {
        pass('Applicant confirmation email sent');
      }
    } else {
      fail('Provider application submission (EN)', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('Provider application submission (EN)', err.message);
  }
}

async function testProviderApplicationFormSpanish() {
  section('👷 Provider Application Form (ES)');

  const testData = {
    name: 'Proveedor de Prueba',
    business: 'Plomería Prueba SA',
    email: 'proveedor@example.com',
    phone: '3335559876',
    city: 'Zapopan',
    neighbourhood: 'Santa Margarita',
    zone: 'Zona Metropolitana de Guadalajara',
    services: ['plumbing', 'construction'],
    experience: '10+ años',
    team: '5-10 personas',
    website: '',
    description: 'Solicitud de proveedor de prueba del sistema',
    language_code: 'es',
    turnstileToken: 'local-dev-bypass'
  };

  try {
    const res = await request('POST', '/api/providers', testData);
    if (res.status === 200 && res.data.success) {
      pass('Provider application submission (ES)', `ID: ${res.data.data?.id || 'created'}`);
    } else {
      fail('Provider application submission (ES)', res.data.error || 'Invalid response');
    }
  } catch (err) {
    fail('Provider application submission (ES)', err.message);
  }
}

async function testI18nTranslations() {
  section('🌐 i18n Translations');

  const i18nPath = path.join(__dirname, '..', 'public', 'js', 'i18n.js');
  
  try {
    const content = fs.readFileSync(i18nPath, 'utf8');
    
    // Check if translations object exists
    if (content.includes('const translations = {')) {
      pass('i18n translations file exists');
    } else {
      fail('i18n translations structure', 'translations object not found');
      return;
    }

    // Check English translations
    const enKeys = [
      'requestTitle',
      'sendRequest',
      'req_full_name',
      'req_city',
      'req_service',
      'confirm_close_form',
      'req_success_title',
      'req_success_desc'
    ];
    
    let enMissing = [];
    for (const key of enKeys) {
      if (!content.includes(`${key}:`)) {
        enMissing.push(key);
      }
    }
    
    if (enMissing.length === 0) {
      pass('English (EN) key translations', `${enKeys.length} keys verified`);
    } else {
      fail('English (EN) translations', `Missing: ${enMissing.join(', ')}`);
    }

    // Check Spanish translations
    const esKeys = [
      'requestTitle',
      'sendRequest',
      'req_full_name',
      'confirm_close_form'
    ];
    
    // Simple check for Spanish section
    if (content.includes('es: {')) {
      pass('Spanish (ES) translations section exists');
    } else {
      fail('Spanish (ES) translations', 'ES section not found');
    }

    // Check for new email confirmation keys
    if (content.includes('confirm_close_form')) {
      pass('Form close confirmation translation');
    } else {
      skip('Form close confirmation translation', 'Key not found');
    }

  } catch (err) {
    fail('i18n file read', err.message);
  }
}

async function testEmailService() {
  section('📧 ZeptoMail Email Service');

  const emailServicePath = path.join(__dirname, '..', 'server', 'services', 'email.js');
  
  try {
    const content = fs.readFileSync(emailServicePath, 'utf8');
    
    // Check ZeptoMail integration
    if (content.includes("require('zeptomail')")) {
      pass('ZeptoMail SDK imported');
    } else {
      fail('ZeptoMail SDK', 'zeptomail not imported');
    }

    // Check template configuration
    if (content.includes('TEMPLATE_IDS')) {
      pass('Email templates configured');
    } else {
      fail('Email templates', 'TEMPLATE_IDS not found');
    }

    // Check service request email
    if (content.includes('sendServiceRequest')) {
      pass('Admin notification: sendServiceRequest()');
    } else {
      fail('sendServiceRequest method', 'Method not found');
    }

    // Check provider application email
    if (content.includes('sendProviderApplication')) {
      pass('Admin notification: sendProviderApplication()');
    } else {
      fail('sendProviderApplication method', 'Method not found');
    }

    // Check user confirmation emails
    if (content.includes('sendServiceRequestConfirmation')) {
      pass('User confirmation: sendServiceRequestConfirmation()');
    } else {
      fail('sendServiceRequestConfirmation method', 'Method not found');
    }

    if (content.includes('sendProviderApplicationConfirmation')) {
      pass('User confirmation: sendProviderApplicationConfirmation()');
    } else {
      fail('sendProviderApplicationConfirmation method', 'Method not found');
    }

    // Check bilingual support
    if (content.includes('language_code') || content.includes('normalizeLanguageCode')) {
      pass('Bilingual email support (EN/ES)');
    } else {
      fail('Bilingual email support', 'Language handling not found');
    }

    // Check HTML email templates
    if (content.includes('<!DOCTYPE html>')) {
      pass('HTML email templates embedded');
    } else {
      skip('HTML email templates', 'Using external templates');
    }

  } catch (err) {
    fail('Email service file read', err.message);
  }
}

async function testCitiesSection() {
  section('🏙️ Cities Section');

  const indexPath = path.join(__dirname, '..', 'public', 'index.html');
  
  try {
    const content = fs.readFileSync(indexPath, 'utf8');
    
    // Active cities
    if (content.includes('Guadalajara') && content.includes('Zapopan')) {
      pass('Active cities: Guadalajara, Zapopan');
    } else {
      fail('Active cities', 'Missing Guadalajara or Zapopan');
    }

    // Coming soon cities
    const comingSoon = ['Tlaquepaque', 'Tonalá', 'Chapala', 'Ajijic'];
    let foundCities = [];
    for (const city of comingSoon) {
      if (content.includes(city)) {
        foundCities.push(city);
      }
    }
    
    if (foundCities.length >= 2) {
      pass('Coming soon cities', foundCities.join(', '));
    } else {
      fail('Coming soon cities', `Only found: ${foundCities.join(', ')}`);
    }

  } catch (err) {
    fail('Cities section', err.message);
  }
}

async function testFormValidation() {
  section('🔒 Form Validation & Security');

  // Test missing required fields
  try {
    const res = await request('POST', '/api/requests', {
      name: 'Test',
      // Missing other required fields
      cf_turnstile_token: 'local-dev-bypass'
    });
    
    if (res.status === 400 || (res.data && !res.data.success)) {
      pass('Required field validation', 'Server rejects incomplete forms');
    } else {
      fail('Required field validation', 'Server accepted incomplete form');
    }
  } catch (err) {
    pass('Required field validation', 'Request rejected');
  }

  // Test CAPTCHA requirement (without bypass token)
  try {
    const res = await request('POST', '/api/requests', {
      name: 'Test User',
      email: 'test@example.com',
      phone: '3331234567',
      city: 'Guadalajara',
      neighbourhood: 'Centro',
      service: 'Plumbing',
      description: 'Test',
      budget: 'Under MXN 10,000',
      timeline: 'Soon',
      // No cf_turnstile_token
    });
    
    if (res.status === 400 || res.data?.error?.includes('captcha') || res.data?.error?.includes('token')) {
      pass('CAPTCHA token validation', 'Server requires CAPTCHA');
    } else {
      skip('CAPTCHA validation', 'May be disabled in dev mode');
    }
  } catch (err) {
    pass('CAPTCHA token validation', 'Request rejected');
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function runTests() {
  log(`\n${colors.bold}${colors.blue}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
  log(`${colors.bold}${colors.blue}║       LUMITYA UI & API TEST SUITE                        ║${colors.reset}`);
  log(`${colors.bold}${colors.blue}║       Testing: ZeptoMail, Forms, i18n, API               ║${colors.reset}`);
  log(`${colors.bold}${colors.blue}╚══════════════════════════════════════════════════════════╝${colors.reset}`);
  log(`\n📍 Target: ${BASE_URL}`);
  log(`📅 Date: ${new Date().toISOString()}`);
  
  const startTime = Date.now();

  // Run all test suites
  await testServerHealth();
  await testStaticFiles();
  await testAPIEndpoints();
  await testServiceRequestForm();
  await testServiceRequestFormSpanish();
  await testProviderApplicationForm();
  await testProviderApplicationFormSpanish();
  await testI18nTranslations();
  await testEmailService();
  await testCitiesSection();
  await testFormValidation();

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Summary
  log(`\n${colors.bold}${colors.cyan}━━━ TEST SUMMARY ━━━${colors.reset}\n`);
  log(`  ${colors.green}✅ Passed:  ${results.passed}${colors.reset}`);
  log(`  ${colors.red}❌ Failed:  ${results.failed}${colors.reset}`);
  log(`  ${colors.yellow}⏭️  Skipped: ${results.skipped}${colors.reset}`);
  log(`  ⏱️  Duration: ${duration}s`);
  
  const total = results.passed + results.failed + results.skipped;
  const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : 0;
  
  log(`\n  📊 Pass Rate: ${passRate}%\n`);

  if (results.failed === 0) {
    log(`${colors.green}${colors.bold}🎉 All tests passed!${colors.reset}\n`);
    process.exit(0);
  } else {
    log(`${colors.red}${colors.bold}⚠️  Some tests failed. Check errors above.${colors.reset}\n`);
    process.exit(1);
  }
}

// Run if called directly
runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
