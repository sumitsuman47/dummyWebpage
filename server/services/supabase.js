const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env file');
}

// Supabase REST API helper
const supabaseRequest = async (table, method = 'GET', body = null, query = '') => {
  const url = `${SUPABASE_URL}/rest/v1/${table}${query ? '?' + query : ''}`;

  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Prefer': 'return=representation'
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

  return response.json();
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

  return response.json();
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

    return supabaseRequest('service_requests', 'POST', {
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
    });
  },

  // Create provider application (using contractor_join_requests table)
  async createProvider(data) {
    return supabaseRequest('contractor_join_requests', 'POST', {
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

  // =============================================
  // FEATURE FLAGS METHODS
  // =============================================

  // Get all enabled feature flags
  async getEnabledFeatures() {
    try {
      const features = await supabaseRequest(
        'feature_flags',
        'GET',
        null,
        'is_enabled=eq.true&select=feature_key,feature_name,category,is_beta'
      );
      console.log(`✅ Fetched ${features.length} enabled features from Supabase`);
      return features;
    } catch (error) {
      console.error('❌ Error fetching enabled features:', error.message);
      throw error;
    }
  },

  // Get all feature flags (including disabled)
  async getAllFeatureFlags() {
    try {
      const features = await supabaseAdminRequest(
        'feature_flags',
        'GET',
        null,
        'select=*&order=category.asc,feature_name.asc'
      );
      console.log(`✅ Fetched ${features.length} total features from Supabase`);
      return features;
    } catch (error) {
      console.error('❌ Error fetching all features:', error.message);
      throw error;
    }
  },

  // Toggle feature flag
  async toggleFeatureFlag(featureKey, isEnabled, updatedBy = 'admin') {
    try {
      const result = await supabaseAdminRequest(
        'feature_flags',
        'PATCH',
        {
          is_enabled: isEnabled,
          updated_at: new Date().toISOString(),
          updated_by: updatedBy
        },
        `feature_key=eq.${featureKey}`
      );
      console.log(`✅ Toggled feature ${featureKey} to ${isEnabled}`);
      return result;
    } catch (error) {
      console.error(`❌ Error toggling feature ${featureKey}:`, error.message);
      throw error;
    }
  },

  // Get feature flag audit log
  async getFeatureAuditLog(limit = 50) {
    try {
      const audit = await supabaseAdminRequest(
        'feature_flag_audit',
        'GET',
        null,
        `select=*&order=changed_at.desc&limit=${limit}`
      );
      console.log(`✅ Fetched ${audit.length} audit log entries from Supabase`);
      return audit;
    } catch (error) {
      console.error('❌ Error fetching audit log:', error.message);
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
