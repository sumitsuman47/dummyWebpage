const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
}

const getRuntimeEnv = () => {
  const explicit = String(process.env.LUMITYA_ENV || '').toLowerCase();
  if (explicit === 'development' || explicit === 'production') return explicit;
  return String(process.env.NODE_ENV || '').toLowerCase() === 'production' ? 'production' : 'development';
};

const envTable = (baseName) => `${baseName}_${getRuntimeEnv()}`;

const isMissingTableError = (error) => {
  const msg = String(error && error.message ? error.message : error || '');
  return msg.includes('PGRST205') || msg.includes('Could not find the table');
};

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
      attachment_urls: data.attachment_urls || [],
      status: 'pending'
    };

    try {
      return await supabaseRequest('service_requests', 'POST', payload);
    } catch (error) {
      const msg = String(error && error.message ? error.message : error);

      // Backward compatibility: older deployments may not yet have timeline_text.
      if (msg.includes("'timeline_text' column") || msg.includes('timeline_text')) {
        const { timeline_text, ...legacyPayload } = payload;
        return supabaseRequest('service_requests', 'POST', legacyPayload);
      }

      throw error;
    }
  },

  // Create provider application (using contractor_join_requests table)
  async createProvider(data) {
    const payload = {
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
    };

    const candidates = [
      envTable('contractor_join_requests'),
      'contractor_join_requests_production',
      'contractor_join_requests_development',
      'contractor_join_requests'
    ];

    let lastError;
    for (const table of candidates) {
      try {
        return await supabaseRequest(table, 'POST', payload);
      } catch (error) {
        lastError = error;
        if (!isMissingTableError(error)) throw error;
      }
    }

    throw lastError || new Error('No contractor join requests table available');
  },

  // Generate initials from name
  generateInitials(name) {
    if (!name) return '';
    const parts = name.trim().split(' ');
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  },

  // Create supplier application (using submissions table)
  async createSupplier(data) {
    return supabaseRequest('submissions', 'POST', {
      type: 'supplier_application',
      data: {
        name: data.name,
        business_name: data.business_name || null,
        phone: data.phone,
        email: data.email,
        city: data.city,
        neighbourhood: data.neighbourhood,
        website: data.website || null,
        materials: data.materials, // Array
        description: data.description || null,
        delivery_available: data.delivery_available || false,
        delivery_cost: data.delivery_cost || null,
        delivery_max_km: data.delivery_max_km || null,
        min_order: data.min_order || null,
        coverage: data.coverage || null
      }
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

    return supabaseRequest('providers', 'GET', null, query);
  },

  // Create contact request (using submissions table)
  async createContact(data) {
    return supabaseRequest('submissions', 'POST', {
      type: 'contact_request',
      data: {
        provider_id: data.provider_id,
        name: data.name,
        phone: data.phone,
        email: data.email || null,
        message: data.message
      }
    });
  },

  // Create notification subscription (using submissions table)
  async createNotification(data) {
    return supabaseRequest('submissions', 'POST', {
      type: 'premium_notification',
      data: {
        name: data.name || null,
        email: data.email,
        phone: data.phone || null,
        whatsapp: data.whatsapp || false,
        service_type: data.service || null,
        city: data.city || null
      }
    });
  },

  // Create provider fraud/issue report (using submissions table)
  async createProviderReport(data) {
    return supabaseAdminRequest('submissions', 'POST', {
      type: 'provider_report',
      data: {
        provider_id: data.provider_id || null,
        provider_name: data.provider_name,
        issue_type: data.issue_type,
        details: data.details,
        reporter_name: data.reporter_name || null,
        reporter_email: data.reporter_email || null,
        reporter_phone: data.reporter_phone || null,
        page_context: data.page_context || null,
        submitted_at: new Date().toISOString()
      }
    });
  },

  async getProviderReports(limit = 100) {
    const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 100;
    return supabaseAdminRequest(
      'submissions',
      'GET',
      null,
      `select=*&type=eq.provider_report&order=created_at.desc&limit=${safeLimit}`
    );
  },

  async updateProviderReport(reportId, { status, resolution_notes = '', reviewed_by = 'admin' }) {
    const existing = await supabaseAdminRequest(
      'submissions',
      'GET',
      null,
      `select=*&id=eq.${encodeURIComponent(reportId)}&limit=1`
    );

    if (!Array.isArray(existing) || existing.length === 0) {
      throw new Error('Provider report not found');
    }

    const record = existing[0];
    const mergedData = {
      ...(record.data || {}),
      report_status: status,
      resolution_notes: resolution_notes || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by
    };

    return supabaseAdminRequest(
      'submissions',
      'PATCH',
      { data: mergedData },
      `id=eq.${encodeURIComponent(reportId)}`
    );
  },

  // =============================================
  // FEATURE FLAGS METHODS
  // =============================================

  // Get all public feature flags with explicit enabled/disabled state
  async getPublicFeatureFlags() {
    const candidates = [envTable('feature_flags'), 'feature_flags'];
    try {
      let lastError;
      for (const table of candidates) {
        try {
          const features = await supabaseRequest(
            table,
            'GET',
            null,
            'select=feature_key,feature_name,category,is_beta,is_enabled'
          );
          console.log(`✅ Fetched ${features.length} public feature flags from Supabase (${table})`);
          return features;
        } catch (error) {
          lastError = error;
          if (!isMissingTableError(error)) throw error;
        }
      }
      throw lastError || new Error('No feature flags table available');
    } catch (error) {
      console.error('❌ Error fetching public feature flags:', error.message);
      throw error;
    }
  },

  // Get all feature flags (including disabled)
  async getAllFeatureFlags() {
    const candidates = [envTable('feature_flags'), 'feature_flags'];
    try {
      let lastError;
      for (const table of candidates) {
        try {
          const features = await supabaseAdminRequest(
            table,
            'GET',
            null,
            'select=*&order=category.asc,feature_name.asc'
          );
          console.log(`✅ Fetched ${features.length} total features from Supabase (${table})`);
          return features;
        } catch (error) {
          lastError = error;
          if (!isMissingTableError(error)) throw error;
        }
      }
      throw lastError || new Error('No feature flags table available');
    } catch (error) {
      console.error('❌ Error fetching all features:', error.message);
      throw error;
    }
  },

  // Toggle feature flag
  async toggleFeatureFlag(featureKey, isEnabled, updatedBy = 'admin') {
    const candidates = [envTable('feature_flags'), 'feature_flags'];
    try {
      let lastError;
      for (const table of candidates) {
        try {
          const result = await supabaseAdminRequest(
            table,
            'PATCH',
            {
              is_enabled: isEnabled,
              updated_at: new Date().toISOString(),
              updated_by: updatedBy
            },
            `feature_key=eq.${featureKey}`
          );
          console.log(`✅ Toggled feature ${featureKey} to ${isEnabled} (${table})`);
          return result;
        } catch (error) {
          lastError = error;
          if (!isMissingTableError(error)) throw error;
        }
      }
      throw lastError || new Error('No feature flags table available');
    } catch (error) {
      console.error(`❌ Error toggling feature ${featureKey}:`, error.message);
      throw error;
    }
  },

  // Get feature flag audit log
  async getFeatureAuditLog(limit = 50) {
    const candidates = [envTable('feature_flag_audit'), 'feature_flag_audit'];
    try {
      let lastError;
      for (const table of candidates) {
        try {
          const audit = await supabaseAdminRequest(
            table,
            'GET',
            null,
            `select=*&order=changed_at.desc&limit=${limit}`
          );
          console.log(`✅ Fetched ${audit.length} audit log entries from Supabase (${table})`);
          return audit;
        } catch (error) {
          lastError = error;
          if (!isMissingTableError(error)) throw error;
        }
      }
      throw lastError || new Error('No feature audit table available');
    } catch (error) {
      console.error('❌ Error fetching audit log:', error.message);
      throw error;
    }
  },

  // Get active categories
  async getCategories() {
    const query = 'select=id,name_en,name_es,slug,description_en,description_es,icon,parent_id&is_active=eq.true&order=name_en.asc';
    const candidates = [
      envTable('categories'),
      'categories_development',
      'categories_production',
      'categories'
    ];

    try {
      let lastError;
      for (const table of candidates) {
        try {
          const cats = await supabaseRequest(table, 'GET', null, query);
          console.log(`✅ Fetched ${cats.length} active categories from Supabase (${table})`);
          return cats;
        } catch (error) {
          lastError = error;
          if (!isMissingTableError(error)) throw error;
        }
      }
      const providerCandidates = [
        envTable('providers'),
        'providers_development',
        'providers_production',
        'providers'
      ];

      for (const table of providerCandidates) {
        try {
          const providers = await supabaseRequest(
            table,
            'GET',
            null,
            'select=categories&limit=1000'
          );

          const seen = new Set();
          const derived = [];
          (Array.isArray(providers) ? providers : []).forEach((provider) => {
            const list = Array.isArray(provider && provider.categories) ? provider.categories : [];
            list.forEach((raw) => {
              const name = String(raw || '').trim();
              if (!name) return;
              const key = name.toLowerCase();
              if (seen.has(key)) return;
              seen.add(key);
              derived.push({
                id: null,
                name_en: name,
                name_es: name,
                slug: key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
                description_en: '',
                description_es: '',
                icon: null,
                parent_id: null
              });
            });
          });

          if (derived.length > 0) {
            derived.sort((a, b) => a.name_en.localeCompare(b.name_en));
            console.log(`✅ Derived ${derived.length} categories from Supabase provider data (${table})`);
            return derived;
          }
        } catch (error) {
          if (!isMissingTableError(error)) throw error;
        }
      }

      throw lastError || new Error('No categories source available in Supabase');
    } catch (error) {
      console.error('❌ Error fetching categories:', error.message);
      throw error;
    }
  },

  // Get provider counts by category
  async getProviderCountsByCategory() {
    try {
      // Fetch all providers (for counting)
      const providers = await supabaseRequest(
        'providers',
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
  async isFeatureEnabled(featureKey) {
    try {
      const result = await supabaseRequest(
        'feature_flags',
        'GET',
        null,
        `feature_key=eq.${featureKey}&select=is_enabled`
      );
      const enabled = result.length > 0 && result[0].is_enabled;
      console.log(`✅ Feature ${featureKey} is ${enabled ? 'enabled' : 'disabled'}`);
      return enabled;
    } catch (error) {
      console.error(`❌ Error checking feature ${featureKey}:`, error.message);
      return false; // Fail-safe: return false if error
    }
  }
};

module.exports = supabaseService;
