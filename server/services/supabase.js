
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function normalizeLumityaEnv(env) {
  return String(env || '').toLowerCase() === 'production' ? 'production' : 'development';
}

function getDefaultLumityaEnv() {
  return normalizeLumityaEnv(process.env.LUMITYA_ENV || process.env.NODE_ENV || 'development');
}

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
}

// Helper to get correct table name
function getTableName(base, envOverride) {
  const resolvedEnv = normalizeLumityaEnv(envOverride || getDefaultLumityaEnv());
  const tableSuffix = resolvedEnv === 'production' ? '_production' : '_development';
  return `${base}${tableSuffix}`;
}

// Supabase REST API helper
const supabaseRequest = async (table, method = 'GET', body = null, query = '') => {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const prefer = method === 'POST' ? 'return=minimal' : 'return=representation';

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': prefer
    }
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Supabase API error: ${response.status} - ${error}`);
  }

  const text = await response.text();
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
};

// Admin helper: prefers service-role key for admin-protected operations.
const supabaseAdminRequest = async (table, method = 'GET', body = null, query = '') => {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;
  const key = SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY in server environment. Add it in Render Environment Variables and redeploy.');
  }

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Prefer': 'return=representation'
    }
  };

  if (body && (method === 'POST' || method === 'PATCH')) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);

  if (!response.ok) {
    const error = await response.text();
    if (response.status === 401 || response.status === 403) {
      throw new Error(`Supabase admin auth failed (${response.status}). Verify SUPABASE_SERVICE_ROLE_KEY value and RLS policies for admin writes.`);
    }
    throw new Error(`Supabase API error: ${response.status} - ${error}`);
  }

  const text = await response.text();
  if (!text) return [];
  try {
    return JSON.parse(text);
  } catch (_) {
    return text;
  }
};

// Service methods
const supabaseService = {
  // Create service request (using service_requests table)
  async createRequest(data) {
    // Store the timeline text string and leave preferred_date as null for text timelines
    let preferredDate = null;
    let timelineText = '';

    if (data.timeline) {
      timelineText = data.timeline;
      // Only set preferred_date if timeline looks like a date (YYYY-MM-DD format)
      if (/^\d{4}-\d{2}-\d{2}$/.test(data.timeline)) {
        preferredDate = data.timeline;
      }
    }

    const payload = {
      customer_name: data.name,
      customer_email: data.email || '',
      customer_phone: data.phone,
      service_category: data.service,
      service_description: data.description,
      city: data.city || 'Guadalajara',
      neighbourhood: data.neighbourhood || '',
      provider_id: data.provider_id || null,
      provider_name: data.provider_name || null,
      budget: data.budget || '',
      preferred_date: preferredDate,
      timeline_text: timelineText,
      attachment_urls: data.attachment_urls || [],
      status: 'pending'
    };

    try {
      return await supabaseRequest(getTableName('service_requests'), 'POST', payload);
    } catch (error) {
      const msg = String(error && error.message ? error.message : error);

      // Backward compatibility: older deployments may not yet have timeline_text.
      if (msg.includes("'timeline_text' column") || msg.includes('timeline_text')) {
        const { timeline_text, ...legacyPayload } = payload;
        return supabaseRequest(getTableName('service_requests'), 'POST', legacyPayload);
      }

      throw error;
    }
  },

  // Create provider application (using contractor_join_requests table)
  async createProvider(data) {
    return supabaseRequest(getTableName('contractor_join_requests'), 'POST', {
      name: data.name,
      phone: data.phone,
      email: data.email,
      title_en: data.title_en || '',
      title_es: data.title_es || '',
      categories: data.services || data.categories || [], // Accept both 'services' and 'categories'
      city: data.city || 'Guadalajara',
      neighbourhood: data.neighbourhood || '',
      years_exp: data.years_experience || data.years_exp || '',
      color: data.color || '#2B4DB3',
      initials: data.initials || this.generateInitials(data.name),
      tags_en: data.tags_en || [],
      tags_es: data.tags_es || [],
      description: data.description || '',
      id_checked: false,
      move_to_provider_list: false,
      status: 'pending'
    });
  },

  // Generate initials from name
  generateInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  // Create supplier application
  async createSupplier(data) {
    return supabaseRequest(getTableName('suppliers'), 'POST', {
      name: data.name,
      business_name: data.business_name || null,
      phone: data.phone,
      email: data.email,
      city: data.city,
      neighbourhood: data.neighbourhood,
      website: data.website || null,
      materials: data.materials,
      description: data.description || null,
      delivery_available: data.delivery_available || false,
      delivery_cost: data.delivery_cost || null,
      delivery_max_km: data.delivery_max_km || null,
      min_order: data.min_order || null,
      coverage: data.coverage || null,
      status: 'pending'
    });
  },

  // Get providers (with filters)
  async getProviders({ city, category, page = 1, limit = 12 }) {
    let query = `select=*&limit=${limit}&offset=${(page - 1) * limit}&order=rating.desc,created_at.desc`;

    if (city) {
      query += `&city=eq.${encodeURIComponent(city)}`;
    }

    if (category) {
      query += `&categories=cs.[${encodeURIComponent(category)}]`;
    }

    return supabaseRequest(getTableName('providers'), 'GET', null, query);
  },

  // Create contact request
  async createContact(data) {
    return supabaseRequest(getTableName('contacts'), 'POST', {
      provider_id: data.provider_id,
      name: data.name,
      phone: data.phone,
      email: data.email || null,
      message: data.message
    });
  },

  // Create notification subscription
  async createNotification(data) {
    return supabaseRequest(getTableName('premium_notifications'), 'POST', {
      name: data.name || '',
      phone: data.phone || '',
      email: data.email,
      whatsapp: data.whatsapp || '',
      service_type: data.service || ''
    });
  },

  // Create provider fraud/issue report (using reported_provider table)
  async createProviderReport(data) {
    return supabaseAdminRequest(getTableName('reported_provider'), 'POST', {
      provider_id: data.provider_id || null,
      provider_name: data.provider_name,
      issue_type: data.issue_type,
      details: data.details,
      reporter_name: data.reporter_name || null,
      reporter_email: data.reporter_email || null,
      reporter_phone: data.reporter_phone || null,
      page_context: data.page_context || null,
      report_status: 'submitted',
      resolution_notes: null,
      reviewed_at: null,
      reviewed_by: null,
      submitted_at: new Date().toISOString()
    });
  },

  async getProviderReports(limit = 100) {
    const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return supabaseAdminRequest(
      getTableName('reported_provider'),
      'GET',
      null,
      `select=*&order=created_at.desc&limit=${safeLimit}`
    );
  },

  async updateProviderReport(reportId, { status, resolution_notes = '', reviewed_by = 'admin' }) {
    const existing = await supabaseAdminRequest(
      getTableName('reported_provider'),
      'GET',
      null,
      `select=*&id=eq.${encodeURIComponent(reportId)}&limit=1`
    );

    if (!Array.isArray(existing) || existing.length === 0) {
      throw new Error('Provider report not found');
    }

    const record = existing[0];
    const mergedData = {
      ...record,
      report_status: status,
      resolution_notes: resolution_notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by
    };

    return supabaseAdminRequest(
      getTableName('reported_provider'),
      'PATCH',
      mergedData,
      `id=eq.${encodeURIComponent(reportId)}`
    );
  },

  // =============================================
  // FEATURE FLAGS METHODS
  // =============================================

  // Get all public feature flags with explicit enabled/disabled state
  async getPublicFeatureFlags(envOverride) {
    try {
      const tableName = getTableName('feature_flags', envOverride);
      const features = await supabaseRequest(
        tableName,
        'GET',
        null,
        'select=feature_key,feature_name,category,is_beta,is_enabled'
      );
      console.log(`✅ Fetched ${features.length} public feature flags from ${tableName}`);
      return features;
    } catch (error) {
      console.error('❌ Error fetching public feature flags:', error.message);
      throw error;
    }
  },

  // Get all feature flags (including disabled)
  async getAllFeatureFlags(envOverride) {
    try {
      const tableName = getTableName('feature_flags', envOverride);
      const features = await supabaseAdminRequest(
        tableName,
        'GET',
        null,
        'select=*&order=category.asc,feature_name.asc'
      );
      console.log(`✅ Fetched ${features.length} total features from ${tableName}`);
      return features;
    } catch (error) {
      console.error('❌ Error fetching all features:', error.message);
      throw error;
    }
  },

  // Toggle feature flag
  async toggleFeatureFlag(featureKey, isEnabled, updatedBy = 'admin', envOverride) {
    try {
      const tableName = getTableName('feature_flags', envOverride);
      const result = await supabaseAdminRequest(
        tableName,
        'PATCH',
        {
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        },
        `feature_key=eq.${featureKey}`
      );
      console.log(`✅ Toggled feature ${featureKey} to ${isEnabled} in ${tableName}`);
      return result;
    } catch (error) {
      console.error(`❌ Error toggling feature ${featureKey}:`, error.message);
      throw error;
    }
  },

  // Get feature flag audit log
  async getFeatureAuditLog(limit = 50, envOverride) {
    try {
      const tableName = getTableName('feature_flag_audit', envOverride);
      const audit = await supabaseAdminRequest(
        tableName,
        'GET',
        null,
        `select=*&order=changed_at.desc&limit=${limit}`
      );
      console.log(`✅ Fetched ${audit.length} audit log entries from ${tableName}`);
      return audit;
    } catch (error) {
      console.error('❌ Error fetching audit log:', error.message);
      throw error;
    }
  },

  // Get active categories
  async getCategories() {
    const catQuery = 'select=id,name_en,name_es,slug,description_en,description_es,icon,parent_id&is_active=eq.true&order=name_en.asc';
    const tablesToTry = [
      getTableName('categories'),       // env-specific first (categories_production or categories_development)
      'categories_development',         // fallback: dev table (has seed data)
      'categories_production',          // fallback: prod table
      'categories'                      // fallback: un-suffixed table
    ];

    let lastError;
    for (const table of tablesToTry) {
      try {
        const cats = await supabaseRequest(table, 'GET', null, catQuery);
        if (Array.isArray(cats) && cats.length > 0) {
          console.log(`✅ Fetched ${cats.length} active categories from ${table}`);
          return cats;
        }
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ Categories not available from ${table}: ${error.message}`);
      }
    }

    console.error('❌ Error fetching categories from all tables');
    throw lastError || new Error('No categories available');
  },

  // Get provider counts by category
  async getProviderCountsByCategory() {
    try {
      // Fetch all providers (for counting)
      const providers = await supabaseRequest(
        getTableName('providers'),
        'GET',
        null,
        'select=id,categories&order=created_at.desc'
      );
      
      if (!Array.isArray(providers)) {
        console.log('⚠️ No providers found');
        return {};
      }

      // Count providers by category
      const counts = {};
      providers.forEach(provider => {
        if (provider.categories && Array.isArray(provider.categories)) {
          provider.categories.forEach(category => {
            const key = (category || '').toLowerCase().trim();
            if (key) {
              counts[key] = (counts[key] || 0) + 1;
            }
          });
        }
      });

      console.log(`✅ Fetched provider counts by category:`, counts);
      return counts;
    } catch (error) {
      console.error('❌ Error fetching provider counts:', error.message);
      throw error;
    }
  },

  // Check if a feature is enabled
  async isFeatureEnabled(featureKey, envOverride) {
    try {
      const tableName = getTableName('feature_flags', envOverride);
      const result = await supabaseRequest(
        tableName,
        'GET',
        null,
        `feature_key=eq.${featureKey}&select=is_enabled`
      );
      const enabled = result.length > 0 && result[0].is_enabled;
      console.log(`✅ Feature ${featureKey} is ${enabled ? 'enabled' : 'disabled'} in ${tableName}`);
      return enabled;
    } catch (error) {
      console.error(`❌ Error checking feature ${featureKey}:`, error.message);
      return false; // Fail-safe: return false if error
    }
  }
};

module.exports = supabaseService;
