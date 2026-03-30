/**
 * Lumitya Platform - Optimized Frontend JS
 * All API keys are hidden in backend
 * Clean error handling and modular code
 */

// Configuration
function getApiBase() {
  const raw = (window.LUMITYA_API_BASE || '').trim();
  if (!raw) return window.location.origin + '/api';

  const withoutTrailingSlash = raw.replace(/\/+$/, '');
  return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : withoutTrailingSlash + '/api';
}

const CONFIG = {
  API_BASE: getApiBase(),
  SITE_HASH: 'ce5fe72586b7b07039f6bf9aa17657414c8380ecb6d1efe6832ac706c8ec2d68'
};

// Utility functions
const utils = {
  async hash(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = message;
      el.style.display = 'block';
      setTimeout(() => el.style.display = 'none', 5000);
    }
  },

  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  },

  validatePhone(phone) {
    return /^\+?[\d\s\-()]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
  },

  getFormData(ids) {
    const data = {};
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (el) data[id] = el.value.trim();
    });
    return data;
  },

  clearFields(ids) {
    ids.forEach(id => {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.remove('er');
      if (el.tagName === 'SELECT') {
        el.selectedIndex = 0;
      } else {
        el.value = '';
      }
    });
  }
};

// API Service
const api = {
  async request(endpoint, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data && (method === 'POST' || method === 'PATCH')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${CONFIG.API_BASE}${endpoint}`, options);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Request failed');
      }

      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  submitServiceRequest(data) {
    return this.request('/requests', 'POST', data);
  },

  submitProviderApplication(data) {
    return this.request('/providers', 'POST', data);
  },

  submitSupplierApplication(data) {
    return this.request('/suppliers', 'POST', data);
  },

  getProviders({ city, category, page = 1, limit = 12 } = {}) {
    let query = `page=${page}&limit=${limit}`;
    if (city) query += `&city=${encodeURIComponent(city)}`;
    if (category) query += `&category=${encodeURIComponent(category)}`;
    return this.request(`/providers?${query}`, 'GET');
  },

  submitContact(data) {
    return this.request('/contact', 'POST', data);
  },

  submitProviderReport(data) {
    return this.request('/provider-reports', 'POST', data);
  },

  subscribeNotification(data) {
    return this.request('/notify', 'POST', data);
  },

  getCategories() {
    return this.request('/categories', 'GET');
  },

  getProviderCountsByCategory() {
    return this.request('/provider-counts', 'GET');
  }
};

// =============================================
// CATEGORIES
// =============================================
const categories = {
  data: [],
  providerCounts: {},
  loaded: false,

  // Fetch from backend and populate all category UIs
  async load() {
    try {
      const res = await api.getCategories();
      this.data = Array.isArray(res.data) ? res.data : [];
      this.loaded = true;
    } catch (e) {
      console.warn('Could not load categories from Supabase, using static fallback.', e);
      this.data = [];
      this.loaded = false;
    }

    // Fetch provider counts
    try {
      const countsRes = await api.getProviderCountsByCategory();
      this.providerCounts = countsRes.data || {};
      console.log('📊 Provider counts loaded:', this.providerCounts);
    } catch (e) {
      console.warn('Could not load provider counts:', e);
      this.providerCounts = {};
    }

    this.populateAllSelects();
    this.renderHomeSectionCards();
    this.renderDirChips();
    this.renderProviderCheckboxes();
  },

  _currentLang() {
    return (document.documentElement.lang || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
  },

  // Emoji fallbacks keyed by slug (used when icon field is blank in DB)
  _iconMap: {
    'air-conditioning': '&#10052;',
    'construction':     '&#127959;',
    'electrical':       '&#9889;',
    'floor-installation': '&#129510;',
    'garden-services':  '&#127807;',
    'home-cleaning':    '&#129529;',
    'painting':         '&#127912;',
    'roof-repair':      '&#127968;',
    'plumbing':         '&#128295;',
    'architecture':     '&#127963;',
    'carpentry':        '&#128296;',
    'renovation':       '&#128296;',
    'materials':        '&#129521;',
    'hvac':             '&#10052;',
  },

  _icon(cat) {
    if (cat.icon) return cat.icon;
    return this._iconMap[cat.slug] || '&#128296;';
  },

  _name(cat) {
    const lang = this._currentLang();
    return lang === 'es' ? (cat.name_es || cat.name_en) : (cat.name_en || cat.name_es);
  },

  _desc(cat) {
    const lang = this._currentLang();
    return lang === 'es' ? (cat.description_es || cat.description_en || '') : (cat.description_en || cat.description_es || '');
  },

  // Populate a <select> element with category options.
  // addOther=true appends an "Other" option at the end.
  populateSelect(selectId, addOther = true) {
    const sel = document.getElementById(selectId);
    if (!sel || this.data.length === 0) return;

    // Keep the first disabled placeholder option
    const placeholder = sel.querySelector('option[disabled]');
    sel.innerHTML = '';
    if (placeholder) sel.appendChild(placeholder);

    // Only top-level categories (parent_id is null)
    const top = this.data.filter(c => !c.parent_id);
    top.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat.name_en;
      opt.textContent = this._name(cat);
      sel.appendChild(opt);
    });

    if (addOther) {
      const other = document.createElement('option');
      other.value = 'Other';
      other.textContent = this._currentLang() === 'es' ? 'Otro' : 'Other';
      sel.appendChild(other);
    }
  },

  // Populate all service-type selects in every form
  populateAllSelects() {
    // matchMo (service request), contactMo (contact provider), notifyMo (notify me)
    ['msvc', 'cpsvc', 'nfsvc'].forEach(id => this.populateSelect(id, true));
  },

  // Render category cards in the home screen "Browse by Category" section
  renderHomeSectionCards() {
    const grid = document.getElementById('catCardGrid');
    if (!grid || this.data.length === 0) return;

    const top = this.data.filter(c => !c.parent_id);
    grid.innerHTML = top.map(cat => {
      const icon = this._icon(cat);
      const name = this._name(cat);
      const desc = this._desc(cat);
      const slug = cat.slug || cat.name_en.toLowerCase();
      const count = this.providerCounts[slug] || 0;
      return `<div class="sc" onclick="goToDirectoryWithCategory('${slug}')" role="button" style="cursor:pointer;transition:all 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='1'">
        <div class="sci">${icon}</div>
        <h3>${name}</h3>
        <div style="font-size:0.85rem;color:var(--bl);font-weight:600;margin:8px 0">${count} provider${count !== 1 ? 's' : ''} available</div>
        ${desc ? `<p>${desc}</p>` : ''}
      </div>`;
    }).join('');
  },

  // Render category filter chips in the directory
  renderDirChips() {
    const chips = document.getElementById('catChips');
    if (!chips || this.data.length === 0) return;

    const lang = this._currentLang();
    const allLabel = lang === 'es' ? 'Todo' : 'All';

    const top = this.data.filter(c => !c.parent_id);
    const chipsHtml = top.map(cat => {
      const name = this._name(cat);
      const val = cat.slug || cat.name_en.toLowerCase();
      return `<button class="dch" data-cat="${val}" onclick="setCat(this)">${name}</button>`;
    }).join('');

    chips.innerHTML = `<button class="dch on" data-cat="" onclick="setCat(this)">${allLabel}</button>${chipsHtml}`;
  },

  // Render checkboxes in the provider modal .cg grid
  renderProviderCheckboxes() {
    const grid = document.querySelector('#provMo .cg');
    if (!grid || this.data.length === 0) return;

    const checkSvg = `<svg width="9" height="7" viewBox="0 0 9 7" fill="none"><path d="M1 3.5l2.5 2.5 4.5-5" stroke="white" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

    const top = this.data.filter(c => !c.parent_id);
    grid.innerHTML = top.map(cat => {
      const icon = this._icon(cat);
      const name = this._name(cat);
      return `<label class="ck" onclick="tglCk(this)">
        <input type="checkbox" value="${cat.name_en}">
        <span class="ckb">${checkSvg}</span>
        <span style="font-size:.9rem">${icon}</span>
        <span class="ckl">${name}</span>
      </label>`;
    }).join('');
  }
};

// Re-render language-aware category UIs when language switches
document.addEventListener('lumitya:lang-changed', () => {
  if (categories.loaded && categories.data.length > 0) {
    categories.renderHomeSectionCards();
    categories.renderDirChips();
    categories.renderProviderCheckboxes();
    categories.populateAllSelects();
  }
});

const homeProviderSignals = {
  minimumVisibleCount: 25,
  providerCount: 0,

  renderCountLine() {
    const countLine = document.getElementById('homeProviderCountLine');
    if (!countLine) return;

    if (this.providerCount <= this.minimumVisibleCount) {
      const generic = (typeof i18n !== 'undefined')
        ? i18n.get('home_provider_count_generic')
        : 'Local providers available';
      countLine.textContent = generic;
      return;
    }

    const suffix = (typeof i18n !== 'undefined')
      ? i18n.get('home_provider_count_suffix')
      : 'local providers available';
    countLine.textContent = `${this.providerCount}+ ${suffix}`;
  },

  async init() {
    const section = document.getElementById('homeProviderSignals');
    if (!section) return;

    // Section is always visible; only the numeric count is conditional.
    section.style.display = '';

    try {
      // Count comes directly from the Supabase-backed provider list response.
      const providers = await directory.fetchProviders();
      const count = Array.isArray(providers) ? providers.length : 0;
      this.providerCount = count;
      this.renderCountLine();
    } catch (error) {
      console.warn('Unable to load home provider signals:', error.message || error);
      this.renderCountLine();
    }
  }
};

document.addEventListener('lumitya:lang-changed', () => {
  homeProviderSignals.renderCountLine();
});

// Site Gate (Password Protection)
const siteGate = {
  unlocked: false,
  pendingButton: null,
  bypassButton: null,
  clickHandlerBound: false,
  resolvingFlagState: false,

  init() {
    try {
      this.unlocked = false;

      const gate = document.getElementById('siteGate');
      if (gate) gate.style.display = 'none';

      if (!this.clickHandlerBound) {
        document.addEventListener('click', (event) => this.handleProtectedClick(event), true);
        this.clickHandlerBound = true;
      }

      window.addEventListener('lumitya:featureflags-applied', () => {
        if (!this.isEnabled()) {
          this.close();
        }
      });
    } catch (e) {
      console.error('Password gate init error:', e);
    }
  },

  isEnabled() {
    if (window.FeatureFlags && window.FeatureFlags.loaded) {
      return window.FeatureFlags.isEnabled('password_gate');
    }

    const preloaded = window.__LUMITYA_PRELOADED_FLAGS__?.flags?.password_gate;
    if (preloaded && typeof preloaded.enabled === 'boolean') {
      return preloaded.enabled === true;
    }

    return false;
  },

  async ensureFeatureStateReady() {
    if (window.FeatureFlags && window.FeatureFlags.loaded) return;

    const readyPromise = window.LUMITYA_FEATURE_FLAGS_READY;
    if (readyPromise && typeof readyPromise.then === 'function') {
      try {
        this.resolvingFlagState = true;
        await readyPromise;
      } catch (error) {
        console.warn('Password gate flag resolution failed:', error);
      } finally {
        this.resolvingFlagState = false;
      }
    }
  },

  requiresPassword() {
    return this.isEnabled() && !this.unlocked;
  },

  resetUi() {
    const btn = document.getElementById('gateBtn');
    const inp = document.getElementById('gateInput');
    const err = document.getElementById('gateErr');

    if (btn) {
      btn.textContent = 'Enter →';
      btn.disabled = false;
    }
    if (inp) {
      inp.value = '';
      inp.type = 'password';
      inp.style.borderColor = '#E2E8F0';
    }
    if (err) {
      err.style.display = 'none';
    }

    const icon = document.getElementById('eyeIcon');
    if (icon) icon.style.opacity = '1';
  },

  open(button = null) {
    const gate = document.getElementById('siteGate');
    if (!gate) return;

    this.pendingButton = button || null;
    this.resetUi();
    gate.style.opacity = '1';
    gate.style.display = 'flex';

    const inp = document.getElementById('gateInput');
    if (inp) {
      window.setTimeout(() => inp.focus(), 0);
    }
  },

  close(clearPending = true) {
    const gate = document.getElementById('siteGate');
    if (!gate) return;

    gate.style.display = 'none';
    this.resetUi();
    if (clearPending) {
      this.pendingButton = null;
    }
  },

  replayPendingAction() {
    const button = this.pendingButton;
    this.pendingButton = null;

    if (!button || !document.contains(button)) return;

    this.bypassButton = button;
    button.click();
    this.bypassButton = null;
  },

  async handleProtectedClick(event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (button.closest('#siteGate')) return;
    if (this.bypassButton === button) return;

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();

    await this.ensureFeatureStateReady();

    if (!this.requiresPassword()) {
      this.pendingButton = button;
      this.replayPendingAction();
      return;
    }

    this.open(button);
  },

  async check() {
    const btn = document.getElementById('gateBtn');
    const inp = document.getElementById('gateInput');
    const err = document.getElementById('gateErr');
    const pw = inp.value;

    if (!pw) return;

    btn.textContent = '⏳ Checking…';
    btn.disabled = true;

    const hash = await utils.hash(pw);

    if (hash === CONFIG.SITE_HASH) {
      this.unlocked = true;
      this.close(false);
      this.replayPendingAction();
    } else {
      err.style.display = 'block';
      inp.value = '';
      inp.style.borderColor = '#DC2626';
      inp.focus();
      setTimeout(() => {
        inp.style.borderColor = '#E5E9F5';
        err.style.display = 'none';
      }, 2000);
      btn.textContent = 'Enter →';
      btn.disabled = false;
    }
  },

  togglePassword() {
    const inp = document.getElementById('gateInput');
    const icon = document.getElementById('eyeIcon');
    if (!inp || !icon) return;

    if (inp.type === 'password') {
      inp.type = 'text';
      icon.style.opacity = '0.5';
    } else {
      inp.type = 'password';
      icon.style.opacity = '1';
    }
  }
};

// Modal Management
const modals = {
  show(id) {
    console.log('📦 modals.show called with id:', id);
    const m = document.getElementById(id);
    if (!m) {
      console.error('❌ Modal not found:', id);
      return;
    }
    
    console.log('✅ Modal found, adding on class');

    // Close mobile nav if open
    const mn = document.getElementById('mobNav');
    if (mn && mn.classList.contains('open')) {
      navigation.toggleMobile();
    }

    m.classList.add('on');
    console.log('✅ on class added, checking classes:', m.className);
    const d = m.querySelector('.md');
    if (d) d.scrollTop = 0;
    this.syncScrollLock();
  },

  hide(id) {
    const m = document.getElementById(id);
    if (!m) return;
    m.classList.remove('on');
    this.syncScrollLock();
  },

  syncScrollLock() {
    const anyOpen = document.querySelector('.mo.on, .mob-nav.open');
    document.body.style.overflow = anyOpen ? 'hidden' : '';
  },

  reset(bodyId, successId, errorId, buttonId) {
    const body = document.getElementById(bodyId);
    const success = document.getElementById(successId);
    const error = document.getElementById(errorId);
    const btn = document.getElementById(buttonId);

    if (body) body.style.display = 'block';
    if (success) success.style.display = 'none';
    if (error) error.style.display = 'none';
    if (btn) {
      btn.disabled = false;
      btn.classList.remove('ld');
    }
  }
};

// Navigation
const navigation = {
  toggleMobile() {
    const nav = document.getElementById('mobNav');
    const btn = document.getElementById('hbgBtn');
    if (!nav || !btn) return;

    nav.classList.toggle('open');
    btn.classList.toggle('open');
    modals.syncScrollLock();
  }
};

// Safety confirmation modal used before sending homeowner requests
const safetyConfirm = {
  pendingResolver: null,

  confirm() {
    const modal = document.getElementById('safetyConfirmMo');
    if (!modal) return Promise.resolve(true);

    if (this.pendingResolver) {
      this.pendingResolver(false);
      this.pendingResolver = null;
    }

    return new Promise(resolve => {
      const ack = document.getElementById('safetyAckChk');
      const ackErr = document.getElementById('safetyAckErr');
      if (ack) ack.checked = false;
      if (ackErr) ackErr.style.display = 'none';
      this.pendingResolver = resolve;
      modals.show('safetyConfirmMo');
    });
  },

  resolve(choice) {
    if (this.pendingResolver) {
      this.pendingResolver(choice);
      this.pendingResolver = null;
    }
    modals.hide('safetyConfirmMo');
  },

  agree() {
    const ack = document.getElementById('safetyAckChk');
    const ackErr = document.getElementById('safetyAckErr');
    if (ack && !ack.checked) {
      if (ackErr) ackErr.style.display = 'block';
      ack.focus();
      return;
    }
    if (ackErr) ackErr.style.display = 'none';
    this.resolve(true);
  },

  close() {
    this.resolve(false);
  }
};

// Service Request Form
const serviceRequest = {
  open(provName, provId) {
    console.log('📝 serviceRequest.open() called with:', { provName, provId });
    this.providerName = provName || '';
    this.providerId = provId || 0;
    console.log('✅ Opening matchMo modal');
    modals.show('matchMo');
  },

  close() {
    modals.hide('matchMo');
    setTimeout(() => {
      modals.reset('mmbody', 'mmsuc', 'merr', 'mbtn');
      utils.clearFields(['mnm', 'mcity', 'mcol', 'msvc', 'mds', 'mbg', 'mug', 'mph', 'mem']);
    }, 320);
  },

  async submit() {
    const btn = document.getElementById('mbtn');
    const errEl = document.getElementById('merr');

    if (!btn || !errEl) {
      console.error('Submit button or error element not found');
      return;
    }

    // Hide any previous errors
    errEl.style.display = 'none';
    errEl.textContent = '';

    // Get form elements
    const nameEl = document.getElementById('mnm');
    const cityEl = document.getElementById('mcity');
    const colEl = document.getElementById('mcol');
    const svcEl = document.getElementById('msvc');
    const dsEl = document.getElementById('mds');
    const bgEl = document.getElementById('mbg');
    const ugEl = document.getElementById('mug');
    const phEl = document.getElementById('mph');
    const emEl = document.getElementById('mem');

    if (!nameEl || !cityEl || !colEl || !svcEl || !dsEl || !ugEl || !phEl) {
      console.error('One or more form elements not found');
      utils.showError('merr', 'Form error. Please refresh the page.');
      return;
    }

    const data = {
      name: nameEl.value.trim(),
      city: cityEl.value,
      neighbourhood: colEl.value,
      service: svcEl.value,
      description: dsEl.value.trim(),
      budget: bgEl?.value || null,
      timeline: ugEl.value,
      phone: phEl.value.trim(),
      email: emEl?.value.trim() || null
    };

    // Validation
    if (!data.name) {
      utils.showError('merr', 'Please enter your name');
      nameEl.focus();
      return;
    }

    if (!data.city) {
      utils.showError('merr', 'Please select a city');
      cityEl.focus();
      return;
    }

    if (!data.neighbourhood) {
      utils.showError('merr', 'Please select a neighbourhood');
      colEl.focus();
      return;
    }

    if (!data.service) {
      utils.showError('merr', 'Please select a service');
      svcEl.focus();
      return;
    }

    if (!data.description) {
      utils.showError('merr', 'Please describe your project');
      dsEl.focus();
      return;
    }

    if (!data.timeline) {
      utils.showError('merr', 'Please select a timeline');
      ugEl.focus();
      return;
    }

    if (!data.phone) {
      utils.showError('merr', 'Please enter your phone number');
      phEl.focus();
      return;
    }

    if (!utils.validatePhone(data.phone)) {
      utils.showError('merr', 'Please enter a valid phone number (at least 10 digits)');
      phEl.focus();
      return;
    }

    if (data.email && !utils.validateEmail(data.email)) {
      utils.showError('merr', 'Please enter a valid email address');
      emEl.focus();
      return;
    }

    const isConfirmed = await safetyConfirm.confirm();
    if (!isConfirmed) return;

    // Submit
    btn.disabled = true;
    btn.classList.add('ld');

    console.log('Submitting service request:', data);

    try {
      const result = await api.submitServiceRequest(data);
      console.log('Service request submitted successfully:', result);

      // Also send email notification if EmailJS is configured
      try {
        if (window.EmailJSConfig) {
          await EmailJSConfig.sendServiceRequest(data);
          console.log('Email notification sent');
        }
      } catch (emailError) {
        console.warn('Email notification failed (non-critical):', emailError.message);
      }

      document.getElementById('mmbody').style.display = 'none';
      document.getElementById('mmsuc').style.display = 'block';
    } catch (error) {
      console.error('Service request submission error:', error);
      utils.showError('merr', error.message || 'Failed to submit request. Please try again.');
      btn.disabled = false;
      btn.classList.remove('ld');
    }
  }
};

// Form Helpers
const formHelpers = {
  cityNeighborhoodMap: {
    Guadalajara: [
      'Analco',
      'Americana',
      'Arcos Vallarta',
      'Atlas',
      'Autocinema',
      'Atemajac',
      'Balcones de Huentitan',
      'Barrio de Analco',
      'Belisario Dominguez',
      'Bosque de la Cantera',
      'Centro',
      'Chapalita',
      'Circunvalacion Country',
      'Colinas de la Normal',
      'Colonia Independencia',
      'Colomos Independencia',
      'Del Fresno',
      'El Retiro',
      'El Santuario',
      'Estadio Poniente',
      'Fabrica de Atemajac',
      'Fidel Velazquez',
      'Guadalupana Norte',
      'Guadalupana Sur',
      'Huentitan El Alto',
      'Independencia',
      'Independencia Norte',
      'Independencia Oriente',
      'Independencia Poniente',
      'Independencia Sur',
      'Jardines Alcalde',
      'Jardines de Atemajac',
      'Jardines del Bosque',
      'Jardines del Country',
      'La Coronilla',
      'La Normal',
      'La Perla',
      'Lomas de Independencia',
      'Mezquitan',
      'Mezquitan Country',
      'Mezquitan Oriente',
      'Miraflores',
      'Monumental',
      'Ninos Heroes',
      'Oblatos',
      'Panoramica de Huentitan',
      'Providencia',
      'Ramon Corona',
      'San Bernardo',
      'San Juan de Dios',
      'San Miguel de Mezquitan',
      'Santa Elena Alcalde',
      'Santa Monica',
      'Santa Teresita',
      'Sagrado Corazon',
      'Simon Bolivar',
      'Vallarta Country',
      'Vallarta Norte',
      'Vallarta Poniente',
      'Vallarta San Jorge',
      'Villas de Guadalupe',
      'Villas de San Juan',
      'Zona Centro'
    ],
    Zapopan: [
      '12 de Diciembre',
      '27 de Septiembre',
      '5 de Noviembre',
      'Abadia',
      'Acacias',
      'Agraria',
      'Agricola',
      'Agua Blanca',
      'Agua Blanca Industrial',
      'Agua Blanca Sur',
      'Agua Fria',
      'Alamedas de Tesistan',
      'Alianza de Cazadores Diana',
      'Altabrisa',
      'Altagracia',
      'Altamira',
      'Altaterra',
      'Altaterra II',
      'Altavista Residencial',
      'Altus Quintas',
      'Alviento Residencial',
      'Amaranto Residencial',
      'Ampliacion Santa Lucia',
      'Arauca',
      'Arauca II',
      'Arboledas 1a Seccion',
      'Arboledas 2a Seccion',
      'Arboledas Residencial',
      'Arboreto Residencial',
      'Arcos de Guadalupe',
      'Arcos de Zapopan',
      'Arenales Tapatios',
      'Argenta Mirador',
      'Armonia Habitat',
      'Arrayanes',
      'Arroyo Hondo',
      'Arroyo Hondo 2a Seccion',
      'Auditorio',
      'Balcones de la Cantera',
      'Balcones de Santa Maria',
      'Base Aerea',
      'Bosques de San Isidro',
      'Bosques Vallarta',
      'Bugambilias',
      'Campo Real',
      'Capital Norte',
      'Ciudad Bugambilias',
      'Ciudad Granja',
      'Ciudad del Sol',
      'Colinas de Atemajac',
      'Colinas de San Javier',
      'Colinas del Rey',
      'Constitucion',
      'El Batan',
      'El Briseno',
      'El Campanario',
      'El Colli Urbano',
      'El Fortin',
      'El Tigre',
      'Estancia Bosque',
      'Estancia Residencial',
      'Jardines Universidad',
      'Jardin Real',
      'La Calma',
      'La Cima',
      'La Estancia',
      'La Mojonera',
      'La Primavera',
      'La Tuzania',
      'Las Aguilas',
      'Las Canadas',
      'Las Fuentes',
      'Las Lomas',
      'Lomas de Zapopan',
      'Lomas del Colli',
      'Lomas del Valle',
      'Los Robles',
      'Los Girasoles',
      'Mariano Otero',
      'Mesa Colorada',
      'Miramar',
      'Nuevo Mexico',
      'Parques del Auditorio',
      'Parques Vallarta',
      'Paseos del Sol',
      'Puerta de Hierro',
      'Real de Valdepenas',
      'San Juan de Ocotan',
      'San Isidro',
      'San Nicolas',
      'Santa Margarita',
      'Santa Lucia',
      'Santa Ana Tepetitlan',
      'Tabachines',
      'Tesistan',
      'Valle Imperial',
      'Valle Real',
      'Valdepenas',
      'Villa Universitaria',
      'Villas de Guadalupe',
      'Villas del Ixtepete',
      'Villas Tepeyac',
      'Zapopan Centro'
    ]
  },

  // Update neighbourhood based on city
  updateNeighbourhood(colId, cityId) {
    const cityEl = document.getElementById(cityId);
    const colEl = document.getElementById(colId);

    if (!cityEl || !colEl) return;

    const cityRaw = (cityEl.value || '').trim();
    const city = Object.keys(this.cityNeighborhoodMap).find(key => key.toLowerCase() === cityRaw.toLowerCase());

    if (city && this.cityNeighborhoodMap[city]) {
      const previousValue = colEl.value;
      colEl.disabled = false;
      colEl.innerHTML = '<option value="" disabled selected>Select neighbourhood</option>';
      this.cityNeighborhoodMap[city].forEach(n => {
        colEl.innerHTML += `<option>${n}</option>`;
      });

      if (previousValue && this.cityNeighborhoodMap[city].includes(previousValue)) {
        colEl.value = previousValue;
      }
    } else {
      colEl.disabled = true;
      colEl.innerHTML = '<option value="" disabled selected>Select city first</option>';
    }
  },

  bindCityNeighbourhoodDropdowns() {
    const pairs = [
      { cityId: 'mcity', colId: 'mcol' },
      { cityId: 'pcity', colId: 'pcol' },
      { cityId: 'scity', colId: 'scol' },
      { cityId: 'cpcity', colId: 'cpcol' }
    ];

    pairs.forEach(({ cityId, colId }) => {
      const cityEl = document.getElementById(cityId);
      const colEl = document.getElementById(colId);
      if (!cityEl || !colEl) return;

      const refresh = () => this.updateNeighbourhood(colId, cityId);

      // Keep options synced whether city is typed/selected via mouse, keyboard, or mobile picker.
      cityEl.addEventListener('change', refresh);
      cityEl.addEventListener('input', refresh);

      // Populate options when user opens the neighbourhood field.
      colEl.addEventListener('focus', refresh);
      colEl.addEventListener('click', refresh);
      colEl.addEventListener('touchstart', refresh, { passive: true });
    });
  },

  // Toggle checkbox
  toggleCheckbox(labelEl) {
    const input = labelEl.querySelector('input[type="checkbox"]');
    if (input) {
      input.checked = !input.checked;
      labelEl.classList.toggle('sel', input.checked);
      labelEl.classList.toggle('on', input.checked); // Legacy compatibility
    }
  },

  // Pick year range
  pickYear(el) {
    document.querySelectorAll('.yc').forEach(y => {
      y.classList.remove('sel');
      y.classList.remove('on'); // Legacy compatibility
    });
    el.classList.add('sel');
    el.classList.add('on'); // Legacy compatibility
    el.dataset.selected = 'true';
  },

  // Toggle agreement checkbox
  toggleAgreement() {
    const chk = document.getElementById('agchk');
    if (chk) {
      chk.classList.toggle('on');
      chk.dataset.checked = chk.classList.contains('on') ? 'true' : 'false';
    }
  },

  // Toggle supplier agreement
  toggleSupplierAgreement() {
    const chk = document.getElementById('sagchk');
    if (chk) {
      chk.classList.toggle('on');
      chk.dataset.checked = chk.classList.contains('on') ? 'true' : 'false';
    }
  },

  // Add material row
  addMaterialRow(name = '', unit = '', price = '') {
    const container = document.getElementById('matRows');
    if (!container) return;

    const rowId = 'matRow' + Date.now();
    const row = document.createElement('div');
    row.className = 'mat-row';
    row.id = rowId;
    row.innerHTML = `
      <input type="text" placeholder="e.g. Cement" value="${name}">
      <select>
        <option value="unit" ${unit === 'unit' ? 'selected' : ''}>unit</option>
        <option value="bag" ${unit === 'bag' ? 'selected' : ''}>bag</option>
        <option value="ton" ${unit === 'ton' ? 'selected' : ''}>ton</option>
        <option value="m3" ${unit === 'm3' ? 'selected' : ''}>m³</option>
        <option value="m2" ${unit === 'm2' ? 'selected' : ''}>m²</option>
        <option value="kg" ${unit === 'kg' ? 'selected' : ''}>kg</option>
      </select>
      <input type="number" placeholder="0.00" value="${price}" step="0.01" min="0">
      <button class="mat-rm" onclick="removeMatRow('${rowId}')" type="button">✕</button>
    `;
    container.appendChild(row);
  },

  // Remove material row
  removeMaterialRow(rowId) {
    const row = document.getElementById(rowId);
    if (row) row.remove();
  },

  // Select delivery option
  selectDelivery(option) {
    document.querySelectorAll('.del-opt').forEach(opt => {
      opt.classList.remove('sel');
      delete opt.dataset.selected;
    });
    const selected = document.getElementById(`del-${option}`);
    if (selected) {
      selected.classList.add('sel');
      selected.dataset.selected = option;
    }

    const details = document.getElementById('delDetails');
    if (details) {
      details.style.display = option === 'yes' ? 'block' : 'none';
    }
  }
};

// Directory/Provider Listing
const directory = {
  currentTab: 'contractors',
  currentCategory: '',
  cachedProviders: null,
  cacheTimestamp: null,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutes

  getVerificationLevel(provider, reviewCount, jobs) {
    const identityChecked = provider.Identity_checked === true || provider.id_checked === true;

    if (identityChecked && jobs > 0 && reviewCount > 0) {
      return {
        badgeKey: 'trust_l3_label',
        titleKey: 'trust_l3_title',
        className: 'pv-badge--lvl3'
      };
    }

    if (identityChecked) {
      return {
        badgeKey: 'trust_l2_label',
        titleKey: 'trust_l2_title',
        className: 'pv-badge--lvl2'
      };
    }

    return {
      badgeKey: 'trust_l1_label',
      titleKey: 'trust_l1_title',
      className: 'pv-badge--lvl1'
    };
  },

  getResponseRate(provider, reviewCount, jobs) {
    if (typeof provider.response_rate === 'number' && Number.isFinite(provider.response_rate)) {
      return Math.max(0, Math.min(100, Math.round(provider.response_rate)));
    }

    const estimatedRate = 72 + Math.min(22, Math.round(jobs / 8) + Math.round(reviewCount * 1.5));
    return Math.max(72, Math.min(98, estimatedRate));
  },

  formatLastActive(provider) {
    const raw = provider.last_active_at || provider.updated_at || provider.created_at;
    if (!raw) return i18n.get('profile_recently_active');

    const timestamp = new Date(raw);
    if (Number.isNaN(timestamp.getTime())) return i18n.get('profile_recently_active');

    const diffMs = timestamp.getTime() - Date.now();
    const absSeconds = Math.abs(Math.round(diffMs / 1000));
    const lang = (document.documentElement.lang || 'en').toLowerCase().startsWith('es') ? 'es' : 'en';
    const rtf = new Intl.RelativeTimeFormat(lang, { numeric: 'auto' });

    if (absSeconds < 3600) {
      return rtf.format(Math.round(diffMs / 60000), 'minute');
    }
    if (absSeconds < 86400) {
      return rtf.format(Math.round(diffMs / 3600000), 'hour');
    }
    if (absSeconds < 604800) {
      return rtf.format(Math.round(diffMs / 86400000), 'day');
    }
    return rtf.format(Math.round(diffMs / 604800000), 'week');
  },

  formatMemberSince(provider) {
    const raw = provider.member_since || provider.created_at;
    if (!raw) return i18n.get('profile_since_unknown');

    const date = new Date(raw);
    if (Number.isNaN(date.getTime())) return i18n.get('profile_since_unknown');

    const lang = (document.documentElement.lang || 'en').toLowerCase().startsWith('es') ? 'es-MX' : 'en-US';
    return new Intl.DateTimeFormat(lang, {
      month: 'short',
      year: 'numeric'
    }).format(date);
  },

  // Fetch and cache providers
  async fetchProviders(forceRefresh = false) {
    const now = Date.now();

    // Return cached data if valid
    if (!forceRefresh && this.cachedProviders && this.cacheTimestamp) {
      const age = now - this.cacheTimestamp;
      if (age < this.CACHE_DURATION) {
        console.log('📦 Using cached providers');
        return this.cachedProviders;
      }
    }

    // Fetch from API
    console.log('🔄 Fetching providers from API...');
    try {
      const response = await api.getProviders({
        page: 1,
        limit: 100
      });

      if (response && response.success && Array.isArray(response.data)) {
        this.cachedProviders = response.data;
        this.cacheTimestamp = now;
        console.log(`✅ Cached ${this.cachedProviders.length} providers`);
        return this.cachedProviders;
      } else {
        throw new Error('Invalid API response');
      }
    } catch (error) {
      console.error('❌ Error fetching providers:', error);
      // Return stale cache if available
      if (this.cachedProviders) {
        console.log('⚠️ Using stale cache due to error');
        return this.cachedProviders;
      }
      throw error;
    }
  },

  setTab(tab) {
    this.currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.dtab').forEach(t => t.classList.remove('on'));
    const tabBtn = document.getElementById(tab === 'contractors' ? 'tabCon' : 'tabSup');
    if (tabBtn) tabBtn.classList.add('on');

    this.render();
  },

  setCategory(btnEl) {
    document.querySelectorAll('.dch').forEach(c => c.classList.remove('on'));
    btnEl.classList.add('on');
    this.currentCategory = btnEl.dataset.cat || '';
    this.render();
  },

  async render() {
    console.log('Rendering directory:', this.currentTab, this.currentCategory);
    const grid = document.getElementById('dgrid');
    const count = document.getElementById('dcount');
    const empty = document.getElementById('dempty');

    if (!grid) {
      console.error('Grid element not found');
      return;
    }

    // Update category button styles if category is selected
    if (this.currentCategory) {
      const categoryButtons = document.querySelectorAll('.dch');
      categoryButtons.forEach(btn => {
        if (btn.dataset.cat === this.currentCategory) {
          btn.classList.add('on');
        } else {
          btn.classList.remove('on');
        }
      });
    } else {
      // Remove 'on' class from all except the first one (All)
      const categoryButtons = document.querySelectorAll('.dch');
      categoryButtons.forEach((btn, idx) => {
        btn.classList.toggle('on', idx === 0);
      });
    }

    // Show loading state only if no cache
    if (!this.cachedProviders) {
      grid.innerHTML = '<p style="text-align:center;padding:40px;color:var(--gr)">Loading providers...</p>';
      if (count) count.textContent = '';
      if (empty) empty.style.display = 'none';
    }

    // Get filter values
    const searchInput = document.getElementById('dsearch');
    const citySelect = document.getElementById('dcity');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedCity = citySelect ? citySelect.value : '';

    try {
      // Get all providers from cache
      const allProviders = await this.fetchProviders();

      console.log(`Got ${allProviders.length} providers from cache`);

      if (!Array.isArray(allProviders) || allProviders.length === 0) {
        console.log('No providers in cache');
        grid.innerHTML = '';
        if (count) count.textContent = '0 providers found';
        if (empty) empty.style.display = 'block';
        return;
      }

      // Separate contractors and suppliers from ALL providers
      const contractors = allProviders.filter(p => {
        const isMaterialSupplier = p.categories && Array.isArray(p.categories) && p.categories.includes('Material Supply');
        return !isMaterialSupplier;
      });

      const suppliers = allProviders.filter(p => {
        const isMaterialSupplier = p.categories && Array.isArray(p.categories) && p.categories.includes('Material Supply');
        return isMaterialSupplier;
      });

      // Update tab counts (showing total counts)
      const tabConCnt = document.getElementById('tabConCnt');
      const tabSupCnt = document.getElementById('tabSupCnt');

      if (tabConCnt) {
        if (contractors.length === 0) {
          tabConCnt.innerHTML = `<span style="color:var(--gr);font-weight:500">Coming soon</span>`;
        } else {
          tabConCnt.innerHTML = `${contractors.length} <span data-i18n="dir_listed">${i18n.get('dir_listed')}</span>`;
        }
      }

      if (tabSupCnt) {
        tabSupCnt.innerHTML = `<span style="color:#FF9800;font-weight:600">Coming Soon</span>`;
      }

      // If supplier tab is selected, show coming soon message
      if (this.currentTab === 'suppliers') {
        grid.innerHTML = `
          <div style="text-align:center;padding:80px 40px;color:var(--gr)">
            <div style="font-size:4rem;margin-bottom:24px">🔜</div>
            <h2 style="font-family:var(--font-heading);font-size:1.8rem;font-weight:700;color:var(--dk);margin-bottom:12px">Coming Soon!</h2>
            <p style="font-size:1rem;margin-bottom:8px">Material Suppliers feature is launching soon.</p>
            <p style="font-size:0.9rem;color:var(--gr)">Check back later for access to material suppliers in your area.</p>
          </div>
        `;
        if (count) count.textContent = '';
        if (empty) empty.style.display = 'none';
        return;
      }

      // Get current tab's list
      let filtered = contractors;

      // Apply category filter
      if (this.currentCategory) {
        // Support multiple category mappings (comma-separated)
        const categoryMappings = this.currentCategory.split(',').map(c => c.trim());
        filtered = filtered.filter(p => {
          if (!p.categories || !Array.isArray(p.categories)) return false;
          // Check if provider has any of the mapped categories
          return p.categories.some(cat =>
            categoryMappings.some(mapping =>
              cat.toLowerCase() === mapping.toLowerCase()
            )
          );
        });
        console.log(`After category filter (${this.currentCategory}): ${filtered.length} providers`);
      }

      // Apply city filter
      if (selectedCity) {
        filtered = filtered.filter(p => p.city === selectedCity);
        console.log(`After city filter (${selectedCity}): ${filtered.length} providers`);
      }

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter(p => {
          const name = (p.name || '').toLowerCase();
          const titleEn = (p.title_en || '').toLowerCase();
          const titleEs = (p.title_es || '').toLowerCase();
          const categories = (p.categories || []).join(' ').toLowerCase();

          return name.includes(searchTerm) ||
            titleEn.includes(searchTerm) ||
            titleEs.includes(searchTerm) ||
            categories.includes(searchTerm);
        });
        console.log(`After search filter ("${searchTerm}"): ${filtered.length} providers`);
      }

      console.log(`Final filtered count: ${filtered.length} contractors`);

      if (filtered.length === 0) {
        grid.innerHTML = '';
        if (count) count.textContent = '0 providers found';
        if (empty) empty.style.display = 'block';
        return;
      }

      // Update count for filtered results
      if (count) count.textContent = `${filtered.length} ${i18n.get('dir_listed')}`;

      // Render provider cards
      grid.innerHTML = filtered.map(provider => {
        try {
          return this.renderProviderCard(provider);
        } catch (err) {
          console.error('Error rendering card for provider:', provider, err);
          return '';
        }
      }).join('');

      // Provider cards are rendered dynamically, so re-apply feature flags
      // to ensure controls like provider_contact_button are respected.
      if (window.FeatureFlags && typeof window.FeatureFlags.applyFeatureFlags === 'function') {
        window.FeatureFlags.applyFeatureFlags();
      }

      if (empty) empty.style.display = 'none';

    } catch (error) {
      console.error('Failed to load providers:', error);
      grid.innerHTML = '<p style="text-align:center;padding:40px;color:var(--gr)">Unable to load providers. Please try again later.</p>';
      if (count) count.textContent = '';
      if (empty) empty.style.display = 'none';
    }
  },

  renderProviderCard(provider) {
    const initial = provider.initials || provider.name?.substring(0, 2).toUpperCase() || '?';
    const color = provider.color || '#2B4DB3';
    const rating = Number(provider.rating) || 0;
    const reviewCount = Number(provider.reviews) || 0;
    const categories = Array.isArray(provider.categories) ? provider.categories : [];
    const displayName = provider.name || 'Unknown Provider';
    const title = provider.title_en || provider.title_es || '';
    const location = `${provider.neighbourhood || ''}, ${provider.city || 'Guadalajara'}`.trim().replace(/^,\s*/, '');
    const jobs = Number(provider.jobs) || 0;
    const experience = Number(provider.years_exp) || 0;
    const verification = this.getVerificationLevel(provider, reviewCount, jobs);
    const responseRate = this.getResponseRate(provider, reviewCount, jobs);
    const lastActive = this.formatLastActive(provider);
    const memberSince = this.formatMemberSince(provider);
    const safeName = displayName.replace(/'/g, "\\'");
    const verificationHelpText = i18n.get('verification_badge_note');
    const verificationHelpAttr = verification.titleKey === 'trust_l2_title'
      ? ` title="${verificationHelpText.replace(/"/g, '&quot;')}"`
      : '';
    const verificationHelpHtml = verification.titleKey === 'trust_l2_title'
      ? `<div class="pv-meta-note" data-i18n="verification_badge_note">${verificationHelpText}</div>`
      : '';

    // Generate dynamic stars based on rating
    const fullStars = Math.floor(rating);
    const halfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
    const starsHTML = '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars);

    return `
      <div class="pvc">
        <div class="pv-badge ${verification.className}"${verificationHelpAttr}>${i18n.get(verification.badgeKey)}</div>
        <div class="pv-av" style="background:${color}">${initial}</div>
        <div class="pv-nm">${displayName}</div>
        <div class="pv-title">${title || 'Service Provider'}</div>
        
        ${categories.length > 0 ? `
          <div class="pv-tags">
            ${categories.slice(0, 2).map(cat => `<span class="pv-tag">${cat}</span>`).join('')}
          </div>
        ` : ''}
        
        <div class="pv-location">
          <span class="pin-icon">📍</span>
          <span>${location}</span>
        </div>
        
        ${rating > 0 ? `
          <div class="pv-rt">
            <span class="rt-st">${starsHTML}</span>
            <span class="rt-sc">${rating.toFixed(1)}</span>
            <span class="rt-cn">(${reviewCount} ${i18n.get('reviews_text')})</span>
          </div>
        ` : `
          <div class="pv-rt pv-rt--muted">
            <span class="rt-cn">${i18n.get('profile_ratings_pending')}</span>
          </div>
        `}

        <div class="pv-meta">
          <div class="pv-meta-item">
            <span class="pv-meta-lbl">${i18n.get('profile_verification')}</span>
            <span class="pv-meta-val">${i18n.get(verification.titleKey)}</span>
          </div>
          ${verificationHelpHtml}
          <div class="pv-meta-item">
            <span class="pv-meta-lbl">${i18n.get('profile_last_active')}</span>
            <span class="pv-meta-val">${lastActive}</span>
          </div>
          <div class="pv-meta-item">
            <span class="pv-meta-lbl">${i18n.get('profile_member_since')}</span>
            <span class="pv-meta-val">${memberSince}</span>
          </div>
          <div class="pv-meta-item">
            <span class="pv-meta-lbl">${i18n.get('profile_response_rate')}</span>
            <span class="pv-meta-val">${responseRate}%</span>
          </div>
        </div>
        
        <div class="pv-stats">
          <div class="pv-stat">
            <div class="stat-val">${jobs}</div>
            <div class="stat-lbl">${i18n.get('profile_completed_jobs')}</div>
          </div>
          <div class="pv-stat">
            <div class="stat-val">${rating > 0 ? rating.toFixed(1) : '—'}</div>
            <div class="stat-lbl">${i18n.get('profile_user_ratings')}</div>
          </div>
          <div class="pv-stat">
            <div class="stat-val">${experience}yr</div>
            <div class="stat-lbl">${i18n.get('stat_exp')}</div>
          </div>
        </div>
        
        <div class="pv-divider"></div>

        <div class="pv-report">
          <div class="pv-report-title">${i18n.get('report_issue_title')}</div>
          <div class="pv-report-tags">
            <span class="pv-report-tag">${i18n.get('report_issue_fraud')}</span>
            <span class="pv-report-tag">${i18n.get('report_issue_noshow')}</span>
            <span class="pv-report-tag">${i18n.get('report_issue_misrep')}</span>
          </div>
          <button class="pv-btn pv-btn--ghost" onclick="event.stopPropagation(); openProviderReport('${provider.id || ''}', '${safeName}')">
            ${i18n.get('report_provider_btn')}
          </button>
        </div>
        
        <button class="pv-btn" data-feature="provider_contact_button" onclick="event.stopPropagation(); openContact('${provider.id}', '${displayName.replace(/'/g, "\\'")}')">
          ${i18n.get('contact_btn')}
        </button>
      </div>
    `;
  }
};

// Contact provider modal
const contactProvider = {
  providerId: null,
  providerName: null,

  open(providerId, providerName) {
    this.providerId = providerId;
    this.providerName = providerName;
    const title = document.getElementById('cpTitle');
    if (title) title.textContent = `Request Quote from ${providerName || 'Provider'}`;
    modals.show('contactMo');
  },

  close() {
    modals.hide('contactMo');
    setTimeout(() => {
      modals.reset('cpbody', 'cpsuc', 'cperr', 'cpbtn');
      // Reset form fields
      ['cpnm', 'cpcity', 'cpcol', 'cpsvc', 'cpmg', 'cpph', 'cpem', 'cpbg', 'cptimeline'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    }, 320);
    this.providerId = null;
    this.providerName = null;
  },

  async submit() {
    const btn = document.getElementById('cpbtn');
    const errEl = document.getElementById('cperr');
    if (!btn) return;

    const timelineValue = document.getElementById('cptimeline')?.value || 'Soon – within 1 month';

    const data = {
      name: document.getElementById('cpnm')?.value.trim(),
      phone: document.getElementById('cpph')?.value.trim(),
      email: document.getElementById('cpem')?.value.trim(),
      city: document.getElementById('cpcity')?.value,
      neighbourhood: document.getElementById('cpcol')?.value,
      service: document.getElementById('cpsvc')?.value,
      description: document.getElementById('cpmg')?.value.trim(),
      budget: document.getElementById('cpbg')?.value || '',
      timeline: timelineValue,
      preferred_date: null, // Will be parsed from timeline in Supabase service
      provider_id: this.providerId,
      provider_name: this.providerName
    };

    // Validation
    if (!data.name || !data.phone || !data.city || !data.neighbourhood || !data.service || !data.description) {
      if (errEl) {
        errEl.textContent = 'Please fill all required fields';
        errEl.style.display = 'block';
      }
      return;
    }

    const isConfirmed = await safetyConfirm.confirm();
    if (!isConfirmed) return;

    btn.disabled = true;
    btn.classList.add('ld');

    try {
      // Submit as service request with provider_id
      await api.submitServiceRequest(data);

      // Also send email notification if EmailJS is configured
      try {
        if (window.EmailJSConfig) {
          await EmailJSConfig.sendServiceRequest(data);
          console.log('Email notification sent');
        }
      } catch (emailError) {
        console.warn('Email notification failed (non-critical):', emailError.message);
      }

      document.getElementById('cpbody').style.display = 'none';
      document.getElementById('cpsuc').style.display = 'block';
    } catch (error) {
      if (errEl) {
        errEl.textContent = error.message || 'Failed to submit request';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.classList.remove('ld');
    }
  }
};

// Provider report modal
const providerReport = {
  providerId: null,
  providerName: null,

  open(providerId, providerName) {
    this.providerId = providerId || null;
    this.providerName = providerName || '';

    const providerLabel = document.getElementById('rpProviderName');
    if (providerLabel) providerLabel.textContent = this.providerName || 'Independent provider';

    modals.show('reportMo');
  },

  close() {
    modals.hide('reportMo');
    setTimeout(() => {
      modals.reset('rpbody', 'rpsuc', 'rperr', 'rpbtn');
      ['rptype', 'rpdetails', 'rpnm', 'rpem', 'rpph'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.tagName === 'SELECT') {
          el.selectedIndex = 0;
        } else {
          el.value = '';
        }
      });
    }, 320);

    this.providerId = null;
    this.providerName = null;
  },

  async submit() {
    const btn = document.getElementById('rpbtn');
    const errEl = document.getElementById('rperr');
    if (!btn) return;

    const activePageId = document.querySelector('.page.active')?.id || 'page-directory';

    const data = {
      provider_id: this.providerId,
      provider_name: this.providerName,
      issue_type: document.getElementById('rptype')?.value,
      details: document.getElementById('rpdetails')?.value.trim(),
      reporter_name: document.getElementById('rpnm')?.value.trim(),
      reporter_email: document.getElementById('rpem')?.value.trim(),
      reporter_phone: document.getElementById('rpph')?.value.trim(),
      page_context: `${window.location.pathname}#${activePageId}`
    };

    if (!data.provider_name || !data.issue_type || !data.details) {
      if (errEl) {
        errEl.textContent = i18n.get('report_err_required');
        errEl.style.display = 'block';
      }
      return;
    }

    if (data.reporter_email && !utils.validateEmail(data.reporter_email)) {
      if (errEl) {
        errEl.textContent = i18n.get('report_err_email');
        errEl.style.display = 'block';
      }
      return;
    }

    if (data.reporter_phone && !utils.validatePhone(data.reporter_phone)) {
      if (errEl) {
        errEl.textContent = i18n.get('report_err_phone');
        errEl.style.display = 'block';
      }
      return;
    }

    btn.disabled = true;
    btn.classList.add('ld');

    try {
      await api.submitProviderReport(data);
      document.getElementById('rpbody').style.display = 'none';
      document.getElementById('rpsuc').style.display = 'block';
    } catch (error) {
      if (errEl) {
        errEl.textContent = error.message || i18n.get('report_err_submit');
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.classList.remove('ld');
    }
  }
};

// Notify modal
const notifySubmit = {
  async submit() {
    const btn = document.getElementById('nfbtn');
    const errEl = document.getElementById('nferr');

    if (!btn) return;

    const data = {
      name: document.getElementById('nfnm')?.value.trim(),
      phone: document.getElementById('nfph')?.value.trim(),
      email: document.getElementById('nfem')?.value.trim(),
      whatsapp: document.getElementById('nfwa')?.value.trim(),
      service: document.getElementById('nfsvc')?.value
    };

    if (!data.name || !data.phone || !data.email || !data.whatsapp || !data.service) {
      if (errEl) {
        errEl.textContent = 'Please fill all required fields';
        errEl.style.display = 'block';
      }
      return;
    }

    btn.disabled = true;
    btn.classList.add('ld');

    try {
      await api.subscribeNotification(data);

      // Also send email notification if EmailJS is configured
      try {
        if (window.EmailJSConfig) {
          await EmailJSConfig.sendNotifyRequest(data);
          console.log('Email notification sent');
        }
      } catch (emailError) {
        console.warn('Email notification failed (non-critical):', emailError.message);
      }

      document.getElementById('nfbody').style.display = 'none';
      document.getElementById('nfsuc').style.display = 'block';
    } catch (error) {
      if (errEl) {
        errEl.textContent = error.message || 'Failed to submit';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.classList.remove('ld');
    }
  }
};

// Provider application submission
const providerSubmit = {
  async submit() {
    const btn = document.getElementById('pbtn');
    const errEl = document.getElementById('perr');

    if (!btn) return;

    // Get form data
    const data = {
      name: document.getElementById('pnm')?.value.trim(),
      business: document.getElementById('pbz')?.value.trim(),
      phone: document.getElementById('pph')?.value.trim(),
      email: document.getElementById('pem')?.value.trim(),
      city: document.getElementById('pcity')?.value,
      neighbourhood: document.getElementById('pcol')?.value,
      website: document.getElementById('pwb')?.value.trim(),
      teamSize: document.getElementById('ptm')?.value,
      categories: [],
      experience: '',
      description: document.getElementById('pdsc')?.value.trim(),
      coverage: document.getElementById('pzn')?.value,
      agreed: document.getElementById('agchk')?.classList.contains('on')
    };

    // Get selected categories
    document.querySelectorAll('.ck input:checked').forEach(cb => {
      data.categories.push(cb.value);
    });

    // Get experience
    const expEl = document.querySelector('.yc.sel, .yc.on');
    if (expEl) data.experience = expEl.dataset.v;

    // Basic validation
    if (!data.name || !data.phone || !data.email || !data.city || !data.neighbourhood) {
      if (errEl) {
        errEl.textContent = 'Please fill all required fields';
        errEl.style.display = 'block';
      }
      return;
    }

    if (data.categories.length === 0) {
      if (errEl) {
        errEl.textContent = 'Please select at least one service category';
        errEl.style.display = 'block';
      }
      return;
    }

    if (!data.agreed) {
      if (errEl) {
        errEl.textContent = 'You must agree to the terms before submitting';
        errEl.style.display = 'block';
      }
      return;
    }

    btn.disabled = true;
    btn.classList.add('ld');

    // Map to backend field names
    const payload = {
      name: data.name,
      business_name: data.business,
      phone: data.phone,
      email: data.email,
      city: data.city,
      neighbourhood: data.neighbourhood,
      website: data.website,
      team_size: data.teamSize,
      services: data.categories,
      years_experience: data.experience,
      description: data.description,
      coverage: data.coverage
    };

    try {
      await api.submitProviderApplication(payload);

      // Also send email notification if EmailJS is configured
      try {
        if (window.EmailJSConfig) {
          await EmailJSConfig.sendProviderApplication(data);
          console.log('Email notification sent');
        }
      } catch (emailError) {
        console.warn('Email notification failed (non-critical):', emailError.message);
      }

      document.getElementById('pmbody').style.display = 'none';
      document.getElementById('pmsuc').style.display = 'block';
    } catch (error) {
      if (errEl) {
        errEl.textContent = error.message || 'Failed to submit application';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.classList.remove('ld');
    }
  }
};

// Supplier application submission
const supplierSubmit = {
  async submit() {
    const btn = document.getElementById('sbtn');
    const errEl = document.getElementById('serr');

    if (!btn) return;

    // Get materials
    const materials = [];
    document.querySelectorAll('.mat-row').forEach(row => {
      const inputs = row.querySelectorAll('input, select');
      if (inputs.length >= 3) {
        materials.push({
          name: inputs[0].value.trim(),
          unit: inputs[1].value,
          price: inputs[2].value
        });
      }
    });

    const data = {
      name: document.getElementById('snm')?.value.trim(),
      business: document.getElementById('sbz')?.value.trim(),
      phone: document.getElementById('sph')?.value.trim(),
      email: document.getElementById('sem')?.value.trim(),
      city: document.getElementById('scity')?.value,
      neighbourhood: document.getElementById('scol')?.value,
      website: document.getElementById('swb')?.value.trim(),
      materials: materials,
      delivery: document.querySelector('.del-opt.sel')?.dataset.selected || 'no',
      coverage: document.getElementById('szn')?.value,
      description: document.getElementById('sdsc')?.value.trim(),
      agreed: document.getElementById('sagchk')?.classList.contains('on')
    };

    if (data.delivery === 'yes') {
      data.deliveryDetails = {
        type: document.getElementById('delCostType')?.value,
        cost: document.getElementById('delCostVal')?.value.trim(),
        maxKm: document.getElementById('delMaxKm')?.value,
        minOrder: document.getElementById('delMinOrd')?.value.trim()
      };
    }

    // Basic validation
    if (!data.name || !data.business || !data.phone || !data.email || !data.city) {
      if (errEl) {
        errEl.textContent = 'Please fill all required fields';
        errEl.style.display = 'block';
      }
      return;
    }

    if (materials.length === 0) {
      if (errEl) {
        errEl.textContent = 'Please add at least one material';
        errEl.style.display = 'block';
      }
      return;
    }

    if (!data.agreed) {
      if (errEl) {
        errEl.textContent = 'You must agree to the terms before submitting';
        errEl.style.display = 'block';
      }
      return;
    }

    btn.disabled = true;
    btn.classList.add('ld');

    // Map to backend field names
    const payload = {
      name: data.name,
      business_name: data.business,
      phone: data.phone,
      email: data.email,
      city: data.city,
      neighbourhood: data.neighbourhood,
      website: data.website,
      materials: data.materials,
      description: data.description,
      delivery_available: data.delivery === 'yes',
      delivery_cost: data.deliveryDetails?.cost || null,
      delivery_max_km: data.deliveryDetails?.maxKm || null,
      min_order: data.deliveryDetails?.minOrder || null,
      coverage: data.coverage
    };

    try {
      await api.submitSupplierApplication(payload);

      // Also send email notification if EmailJS is configured
      try {
        if (window.EmailJSConfig) {
          await EmailJSConfig.sendSupplierApplication(data);
          console.log('Email notification sent');
        }
      } catch (emailError) {
        console.warn('Email notification failed (non-critical):', emailError.message);
      }

      document.getElementById('smbody').style.display = 'none';
      document.getElementById('smsuc').style.display = 'block';
    } catch (error) {
      if (errEl) {
        errEl.textContent = error.message || 'Failed to submit application';
        errEl.style.display = 'block';
      }
      btn.disabled = false;
      btn.classList.remove('ld');
    }
  }
};

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  siteGate.init();
  formHelpers.bindCityNeighbourhoodDropdowns();
  categories.load();
  homeProviderSignals.init();
  pageNavigation.syncFromLocation({ updateHistory: false });
  shareMeta.update();

  // Sync featured provider list height to the left column
  let fpSyncTimer;
  const syncFeaturedProviderList = () => {
    const fpGrid = document.querySelector('section.fp .fpi');
    const leftCol = fpGrid.children[0];
    const list = fpGrid.querySelector('.pvlist');

    const listVisible = !!(list && getComputedStyle(list).display !== 'none');
    fpGrid.classList.toggle('fp-single', !listVisible);

    if (!listVisible) return;

    const leftHeight = leftCol.getBoundingClientRect().height;
    const target = Math.max(260, Math.floor(leftHeight));
    list.style.maxHeight = `${target}px`;
  };

  // Run after feature flags apply and layout settles
  setTimeout(syncFeaturedProviderList, 0);
  setTimeout(syncFeaturedProviderList, 250);
  window.addEventListener('lumitya:featureflags-applied', syncFeaturedProviderList);
  window.addEventListener('resize', () => {
    clearTimeout(fpSyncTimer);
    fpSyncTimer = setTimeout(syncFeaturedProviderList, 120);
  });

  // Initialize EmailJS
  // Initialize material rows for supplier form
  const matContainer = document.getElementById('matRows');
  if (matContainer) {
    // Add default material rows
    formHelpers.addMaterialRow('Cement 50kg', 'bag', '');
    formHelpers.addMaterialRow('Sand', 'm3', '');
    formHelpers.addMaterialRow('Gravel', 'm3', '');
  }

  // Escape key handler
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const mn = document.getElementById('mobNav');
      if (mn && mn.classList.contains('open')) {
        navigation.toggleMobile();
        return;
      }
      const openModal = document.querySelector('.mo.on');
      if (openModal) {
        modals.hide(openModal.id);
      }
    }
  });
});

// Page Navigation
const pageNavigation = {
  pageRoutes: {
    home: '/',
    directory: '/directory',
    pricing: '/pricing',
    terms: '/terms',
    privacy: '/privacy',
    pagree: '/provider-agreement',
    dispute: '/dispute-guidance'
  },

  routePages: {
    '/': 'home',
    '/index.html': 'home',
    '/directory': 'directory',
    '/pricing': 'pricing',
    '/terms': 'terms',
    '/privacy': 'privacy',
    '/provider-agreement': 'pagree',
    '/dispute-guidance': 'dispute'
  },
  currentPage: 'home',

  getCurrentLang() {
    return document.documentElement.lang === 'en' ? 'en' : 'es';
  },

  buildUrl(pageId, lang = this.getCurrentLang()) {
    const path = this.pageRoutes[pageId] || '/';
    const params = new URLSearchParams(window.location.search);

    if (lang === 'en') {
      params.set('lang', 'en');
    } else {
      params.delete('lang');
    }

    const query = params.toString();
    return `${path}${query ? `?${query}` : ''}`;
  },

  getPageFromLocation(pathname = window.location.pathname) {
    return this.routePages[pathname] || 'home';
  },

  syncHistory(pageId, replace = false) {
    const nextUrl = this.buildUrl(pageId);
    const currentUrl = `${window.location.pathname}${window.location.search}`;

    if (nextUrl === currentUrl) return;

    const method = replace ? 'replaceState' : 'pushState';
    window.history[method]({ pageId }, '', nextUrl);
  },

  syncFromLocation({ updateHistory = true, replace = true } = {}) {
    const pageId = this.getPageFromLocation();
    this.go(pageId, { updateHistory, replace });
  },

  go(pageId, { updateHistory = true, replace = false, category = null } = {}) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });

    // Show target page
    const targetPage = document.getElementById(`page-${pageId}`);
    if (targetPage) {
      targetPage.classList.add('active');
      this.currentPage = pageId;
      window.scrollTo(0, 0);

      if (updateHistory) {
        this.syncHistory(pageId, replace);
      }

      // Initialize directory when navigating to it
      if (pageId === 'directory') {
        // If category is provided, set it before rendering
        if (category) {
          directory.currentCategory = category;
        }
        directory.render();
      }

      shareMeta.update();
    }
  }
};

window.addEventListener('popstate', () => {
  pageNavigation.syncFromLocation({ updateHistory: false });
});

// Provider/Supplier Applications
const providerApp = {
  open() {
    console.log('🏗️ providerApp.open() called');
    // Check if contractor joining is enabled via feature flag
    const flags = window.FeatureFlags;
    console.log('window.FeatureFlags:', flags ? 'defined' : 'undefined');
    if (flags && !flags.isEnabled('contractor_joining')) {
      console.warn('🚫 Contractor application is disabled');
      return;
    }
    console.log('✅ contractor_joining is enabled or flags not loaded');
    modals.show('provMo');
  },

  close() {
    modals.hide('provMo');
    setTimeout(() => {
      modals.reset('pmbody', 'pmsuc', 'perr', 'pbtn');
    }, 320);
  }
};

const supplierApp = {
  open() {
    // Check if supplier joining is enabled via feature flag
    const flags = window.FeatureFlags;
    if (flags && !flags.isEnabled('supplier_application')) {
      console.warn('🚫 Supplier application is disabled');
      return;
    }
    modals.show('suppMo');
  },

  close() {
    modals.hide('suppMo');
    setTimeout(() => {
      modals.reset('smbody', 'smsuc', 'serr', 'sbtn');
    }, 320);
  }
};

const applyChoice = {
  open() {
    console.log('📋 applyChoice.open() called');
    // Check if join modal is enabled
    const flags = window.FeatureFlags;
    console.log('window.FeatureFlags:', flags ? 'defined' : 'undefined');
    if (flags && !flags.isEnabled('join_modal')) {
      console.warn('🚫 Join modal is disabled');
      return;
    }

    console.log('✅ join_modal is enabled or flags not loaded');
    // Show modal
    modals.show('applyChoiceMo');

    // Apply join modal logic (show/hide cards based on feature flags)
    if (flags && flags.applyJoinModalLogic) {
      flags.applyJoinModalLogic();
    }
  },

  close() {
    modals.hide('applyChoiceMo');
  }
};

const notifyModal = {
  open() {
    modals.show('notifyMo');
  },

  close() {
    modals.hide('notifyMo');
    setTimeout(() => {
      modals.reset('nfbody', 'nfsuc', 'nferr', 'nfbtn');
    }, 320);
  }
};

// Language switching
const language = {
  current: 'en',

  set(lang) {
    this.current = lang;

    // Update HTML lang attribute
    document.documentElement.lang = lang === 'es' ? 'es' : 'en';

    // Use i18n system
    if (typeof i18n !== 'undefined') {
      i18n.setLanguage(lang);
    }

    if (typeof pageNavigation !== 'undefined') {
      pageNavigation.syncHistory(pageNavigation.currentPage, true);
    }

    // Update button states
    document.querySelectorAll('.lb').forEach(btn => {
      btn.classList.remove('on');
    });

    // Activate selected language buttons
    document.querySelectorAll(`#ben, #bes, #mben, #mbes, #mben2, #mbes2`).forEach(btn => {
      if ((lang === 'en' && btn.id.includes('en')) || (lang === 'es' && btn.id.includes('es'))) {
        btn.classList.add('on');
      }
    });

    console.log('✓ Language switched to:', lang);
  },

  syncButtons(lang) {
    this.set(lang);
  }
};

// Social sharing
const sharing = {
  getSiteUrl() {
    const canonical = document.querySelector('link[rel="canonical"]');
    const baseUrl = canonical?.href || 'https://www.lumitya.com/';
    const lang = document.documentElement.lang === 'en' ? 'en' : 'es';
    const url = new URL(baseUrl, window.location.origin);
    url.searchParams.set('lang', lang);
    return url.toString();
  },

  getMessage() {
    if (typeof i18n !== 'undefined') {
      return i18n.get('share_message');
    }
    return 'Discover Lumitya: connect with independent contractors and material suppliers in Guadalajara and Zapopan.';
  },

  getTitle() {
    if (typeof i18n !== 'undefined') {
      return i18n.get('share_title_short');
    }
    return 'Lumitya';
  },

  setFeedback(message) {
    const el = document.getElementById('shareFeedback');
    if (!el) return;
    el.textContent = message;
    clearTimeout(this._feedbackTimer);
    this._feedbackTimer = setTimeout(() => {
      el.textContent = '';
    }, 3200);
  },

  async copyText(text) {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', 'readonly');
    input.style.position = 'absolute';
    input.style.left = '-9999px';
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
  },

  openPopup(url) {
    const popup = window.open(url, '_blank', 'noopener,noreferrer,width=720,height=760');
    if (!popup) {
      window.location.href = url;
    }
  },

  isMobileDevice() {
    return /Android|iPhone|iPad|iPod|IEMobile|Opera Mini/i.test(navigator.userAgent || '');
  },

  openShareTarget(url, sameTab = false) {
    if (sameTab) {
      window.location.href = url;
      return;
    }
    this.openPopup(url);
  },

  async share(network) {
    const url = this.getSiteUrl();
    const message = this.getMessage();
    const title = this.getTitle();
    const combined = `${message} ${url}`;

    try {
      switch (network) {
        case 'native':
          if (navigator.share) {
            await navigator.share({ title, text: message, url });
            this.setFeedback(i18n.get('share_done'));
          } else {
            await this.copyText(url);
            this.setFeedback(i18n.get('share_native_fallback'));
          }
          break;
        case 'copy':
          await this.copyText(url);
          this.setFeedback(i18n.get('share_copied'));
          break;
        case 'facebook':
          {
            const fbDesktop = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
            const fbMobile = `https://m.facebook.com/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(message)}`;
            this.openShareTarget(this.isMobileDevice() ? fbMobile : fbDesktop, this.isMobileDevice());
          }
          break;
        case 'whatsapp':
          this.openPopup(`https://wa.me/?text=${encodeURIComponent(combined)}`);
          break;
        case 'telegram':
          this.openPopup(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`);
          break;
        case 'x':
          this.openPopup(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(message)}`);
          break;
        default:
          await this.copyText(url);
          this.setFeedback(i18n.get('share_copied'));
      }
    } catch (error) {
      if (error?.name === 'AbortError') return;
      console.error('Share failed:', error);
      this.setFeedback(i18n.get('share_error'));
    }
  }
};

const shareMeta = {
  update() {
    if (typeof i18n === 'undefined') return;

    const pageId = (typeof pageNavigation !== 'undefined' && pageNavigation.currentPage) ? pageNavigation.currentPage : 'home';
    const titleKey = `seo_${pageId}_title`;
    const descriptionKey = `seo_${pageId}_description`;
    const resolvedTitle = i18n.get(titleKey);
    const resolvedDescription = i18n.get(descriptionKey);
    const title = resolvedTitle === titleKey ? i18n.get('seo_title') : resolvedTitle;
    const description = resolvedDescription === descriptionKey ? i18n.get('seo_description') : resolvedDescription;
    const lang = document.documentElement.lang === 'es' ? 'es' : 'en';

    document.title = title;

    const setMeta = (selector, value) => {
      const el = document.querySelector(selector);
      if (el) el.setAttribute('content', value);
    };

    setMeta('meta[name="description"]', description);
    setMeta('meta[property="og:title"]', title);
    setMeta('meta[property="og:description"]', description);
    setMeta('meta[property="og:locale"]', lang === 'es' ? 'es_MX' : 'en_US');
    setMeta('meta[name="twitter:title"]', title);
    setMeta('meta[name="twitter:description"]', description);

    const canonical = document.querySelector('link[rel="canonical"]');
    const ogUrl = document.querySelector('meta[property="og:url"]');
    if (canonical && typeof pageNavigation !== 'undefined') {
      const canonicalUrl = new URL(canonical.getAttribute('href') || window.location.href, window.location.origin);
      const routeUrl = new URL(pageNavigation.buildUrl(pageNavigation.currentPage, lang), canonicalUrl.origin);
      canonicalUrl.pathname = routeUrl.pathname;
      canonicalUrl.search = routeUrl.search;
      const href = canonicalUrl.toString();
      canonical.setAttribute('href', href);
      if (ogUrl) ogUrl.setAttribute('content', href);
    }
  }
};

document.addEventListener('lumitya:lang-changed', () => {
  shareMeta.update();
});

// Helper function to close mobile nav
const closeMobNav = () => {
  const nav = document.getElementById('mobNav');
  if (nav && nav.classList.contains('open')) {
    navigation.toggleMobile();
  }
};

// Global functions for onclick handlers
window.checkGate = () => siteGate.check();
window.closeGate = () => siteGate.close();
window.toggleGatePw = () => siteGate.togglePassword();
window.toggleMobNav = () => navigation.toggleMobile();
window.closeMobNav = () => closeMobNav();
window.openMatch = (name, id) => {
  console.log('🔔 openMatch called with:', name, id);
  serviceRequest.open(name, id);
};
window.closeMatch = () => serviceRequest.close();
window.submitMatch = () => serviceRequest.submit();
window.go = (page) => pageNavigation.go(page);
window.openSupplier = () => {
  console.log('🔔 openSupplier called');
  supplierApp.open();
};
window.closeSupp = () => supplierApp.close();
window.openProv = () => {
  console.log('🔔 openProv called');
  providerApp.open();
};
window.closeProv = () => providerApp.close();
window.openApplyChoice = () => {
  console.log('🔔 openApplyChoice called');
  applyChoice.open();
};
window.closeApplyChoice = () => applyChoice.close();
window.openNotify = () => notifyModal.open();
window.closeNotify = () => notifyModal.close();
window.setLang = (lang) => language.set(lang);
window.syncLangBtns = (lang) => language.syncButtons(lang);
window.shareSite = (network) => sharing.share(network);
window.hideModal = (id) => {
  console.log('🔔 hideModal called with:', id);
  modals.hide(id);
};
window.updCol = (colId, cityId) => formHelpers.updateNeighbourhood(colId, cityId);
window.tglCk = (el) => formHelpers.toggleCheckbox(el);
window.pickYr = (el) => formHelpers.pickYear(el);
window.tglAg = () => formHelpers.toggleAgreement();
window.tglSuppAg = () => formHelpers.toggleSupplierAgreement();
window.addMatRow = (name, unit, price) => formHelpers.addMaterialRow(name, unit, price);
window.removeMatRow = (id) => formHelpers.removeMaterialRow(id);
window.selDel = (option) => formHelpers.selectDelivery(option);
window.renderDir = () => directory.render();
window.setDirTab = (tab) => directory.setTab(tab);
window.setCat = (btn) => directory.setCategory(btn);
window.goToDirectoryWithCategory = (categorySlug) => {
  console.log('🎯 Navigating to directory with category:', categorySlug);
  pageNavigation.go('directory', { updateHistory: true, category: categorySlug });
};
window.openProviderReport = (providerId, providerName) => providerReport.open(providerId, providerName);
window.closeProviderReport = () => providerReport.close();
window.submitProviderReport = () => providerReport.submit();
window.openContact = (id, name) => contactProvider.open(id, name);
window.closeCont = () => contactProvider.close();
window.submitCont = () => contactProvider.submit();
window.agreeSafetyConfirm = () => safetyConfirm.agree();
window.closeSafetyConfirm = () => safetyConfirm.close();
window.submitNotify = () => notifySubmit.submit();
window.submitProv = () => providerSubmit.submit();
window.submitSupp = () => supplierSubmit.submit();
