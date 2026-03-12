/**
 * =============================================
 * LUMITYA FEATURE FLAGS CLIENT
 * =============================================
 * Manages feature flags on the client side
 * Fetches flags on page load and provides utilities
 * to check if features are enabled/disabled
 */

const FeatureFlags = {
    // Storage
    flags: {},
    loaded: false,
    loading: false,
    lastFetch: null,
    CACHE_DURATION: 5 * 60 * 1000, // 5 minutes
    pollIntervalId: null,

    shouldUseCache(forceRefresh = false) {
        if (forceRefresh) return false;

        const host = window.location.hostname;
        // Keep cache in local development for speed; always fetch fresh in production.
        return host === 'localhost' || host === '127.0.0.1';
    },

    getPollIntervalMs() {
        const host = window.location.hostname;
        const isLocal = host === 'localhost' || host === '127.0.0.1';

        // Allow runtime override for quick experiments.
        const override = Number(window.LUMITYA_FLAGS_POLL_MS);
        if (Number.isFinite(override) && override >= 15000) {
            return override;
        }

        // Default: 30s local, 60s production.
        return isLocal ? 30000 : 60000;
    },

    getApiBase() {
        const raw = (window.LUMITYA_API_BASE || '').trim();
        if (!raw) return window.location.origin + '/api';
        const withoutTrailingSlash = raw.replace(/\/+$/, '');
        return withoutTrailingSlash.endsWith('/api') ? withoutTrailingSlash : withoutTrailingSlash + '/api';
    },

    /**
     * Initialize feature flags
     * Fetches from API or localStorage cache
     */
    async init(forceRefresh = false) {
        const useCache = this.shouldUseCache(forceRefresh);

        // Prevent multiple simultaneous loads
        if (this.loading) {
            console.log('⏳ Feature flags already loading...');
            return;
        }

        // Check if we have valid cache
        if (useCache && this.loaded && this.lastFetch) {
            const age = Date.now() - this.lastFetch;
            if (age < this.CACHE_DURATION) {
                console.log('📦 Using cached feature flags');
                return;
            }
        }

        this.loading = true;
        console.log('🔄 Fetching feature flags...');

        try {
            // Try to load from localStorage first (instant)
            const cached = this.loadFromCache();
            if (cached && useCache) {
                this.flags = cached.flags;
                this.lastFetch = cached.timestamp;
                this.loaded = true;
                this.applyFeatureFlags();
                console.log('💾 Loaded feature flags from localStorage');
            }

            // Fetch fresh from API
            const response = await fetch(`${this.getApiBase()}/features`);
            const data = await response.json();

            if (data.success) {
                this.flags = data.features;
                this.lastFetch = Date.now();
                this.loaded = true;

                // Save to localStorage
                this.saveToCache();

                // Apply feature flags to DOM
                this.applyFeatureFlags();

                console.log(`✅ Feature flags loaded: ${data.count} features enabled`);
                console.log('Features:', Object.keys(this.flags));
            } else {
                throw new Error('Failed to load feature flags');
            }
        } catch (error) {
            console.error('❌ Error loading feature flags:', error);

            // Fallback to cached data if available
            if (this.flags && Object.keys(this.flags).length > 0) {
                console.log('⚠️ Using stale cache due to fetch error');
                this.loaded = true;
            } else {
                // Ultimate fallback - all features enabled (fail-open)
                console.warn('⚠️ No cached flags, defaulting to all enabled');
                this.loaded = true;
            }
        } finally {
            this.loading = false;
        }
    },

    /**
     * Check if a feature is enabled
     */
    isEnabled(featureKey) {
        if (!this.loaded) {
            console.warn(`⚠️ Feature flags not loaded yet, checking: ${featureKey}`);
            return true; // Fail-open: show features by default
        }

        if (!Object.prototype.hasOwnProperty.call(this.flags, featureKey)) {
            console.warn(`⚠️ Unknown feature flag: ${featureKey}. Defaulting to enabled.`);
            return true; // Fail-open for unknown keys to avoid hiding UI accidentally
        }

        const enabled = this.flags[featureKey]?.enabled === true;
        return enabled;
    },

    /**
     * Check if a feature is disabled
     */
    isDisabled(featureKey) {
        return !this.isEnabled(featureKey);
    },

    /**
     * Get feature info
     */
    getFeature(featureKey) {
        return this.flags[featureKey] || null;
    },

    /**
     * Conditional rendering helper
     */
    renderIf(featureKey, content) {
        return this.isEnabled(featureKey) ? content : '';
    },

    /**
     * Conditional execution helper
     */
    executeIf(featureKey, callback) {
        if (this.isEnabled(featureKey)) {
            callback();
        }
    },

    /**
     * Apply feature flags to DOM elements
     * Hides/shows elements based on data-feature attribute
     */
    applyFeatureFlags() {
        let hiddenCount = 0;
        let shownCount = 0;

        // Handle data-feature attribute (show if enabled)
        document.querySelectorAll('[data-feature]').forEach(el => {
            const featureKey = el.getAttribute('data-feature');
            const inverse = el.hasAttribute('data-feature-inverse');

            const enabled = this.isEnabled(featureKey);
            const shouldShow = inverse ? !enabled : enabled;

            if (shouldShow) {
                // If we previously hid this element, restore its prior *inline* display.
                // Otherwise, do not touch the current inline display (important for elements
                // that rely on an inline display like display:flex, e.g. #siteGate).
                if (el.hasAttribute('data-original-display')) {
                    el.style.display = el.getAttribute('data-original-display') || '';
                } else if (el.style.display === 'none') {
                    // Was hidden via inline style but not tracked; clear so CSS decides.
                    el.style.display = '';
                }
                el.removeAttribute('hidden');
                shownCount++;
            } else {
                // Store original *inline* display only (empty string means "no inline display")
                if (!el.hasAttribute('data-original-display')) {
                    el.setAttribute('data-original-display', el.style.display || '');
                }

                // Hide via inline style
                el.style.display = 'none';
                el.setAttribute('hidden', 'true');
                hiddenCount++;
                console.log(`🚫 Feature disabled: ${featureKey}`);
            }
        });

        // Handle data-feature-disabled attribute (show if disabled)
        document.querySelectorAll('[data-feature-disabled]').forEach(el => {
            const featureKey = el.getAttribute('data-feature-disabled');
            if (this.isDisabled(featureKey)) {
                if (el.hasAttribute('data-original-display')) {
                    el.style.display = el.getAttribute('data-original-display') || '';
                } else if (el.style.display === 'none') {
                    el.style.display = '';
                }
                el.removeAttribute('hidden');
                shownCount++;
            } else {
                if (!el.hasAttribute('data-original-display')) {
                    el.setAttribute('data-original-display', el.style.display || '');
                }
                el.style.display = 'none';
                el.setAttribute('hidden', 'true');
                hiddenCount++;
            }
        });

        console.log(`✨ Feature flags applied: ${shownCount} shown, ${hiddenCount} hidden`);

        try {
            window.dispatchEvent(new CustomEvent('lumitya:featureflags-applied'));
        } catch (e) {
            // no-op
        }
    },

    /**
     * Save flags to localStorage
     */
    saveToCache() {
        try {
            const cacheData = {
                flags: this.flags,
                timestamp: this.lastFetch
            };
            localStorage.setItem('lumitya_feature_flags', JSON.stringify(cacheData));
        } catch (e) {
            console.warn('Failed to save feature flags to localStorage:', e);
        }
    },

    /**
     * Load flags from localStorage
     */
    loadFromCache() {
        try {
            const cached = localStorage.getItem('lumitya_feature_flags');
            if (!cached) return null;

            const data = JSON.parse(cached);
            const age = Date.now() - data.timestamp;

            // Return cache if less than 5 minutes old
            if (age < this.CACHE_DURATION) {
                return data;
            }

            // Cache expired, clear it
            localStorage.removeItem('lumitya_feature_flags');
            return null;
        } catch (e) {
            console.warn('Failed to load feature flags from localStorage:', e);
            return null;
        }
    },

    /**
     * Clear cache (force refresh)
     */
    clearCache() {
        this.flags = {};
        this.loaded = false;
        this.lastFetch = null;
        localStorage.removeItem('lumitya_feature_flags');
        console.log('🗑️ Feature flags cache cleared');
    },

    /**
     * Refresh feature flags from server
     */
    async refresh() {
        this.clearCache();
        await this.init(true);
    },

    startAutoRefresh() {
        if (this.pollIntervalId) return;

        const intervalMs = this.getPollIntervalMs();
        this.pollIntervalId = setInterval(async () => {
            try {
                // Skip when tab is hidden to avoid unnecessary traffic.
                if (typeof document !== 'undefined' && document.hidden) return;
                await this.init(true);
            } catch (e) {
                console.warn('Feature flag auto-refresh failed:', e);
            }
        }, intervalMs);

        console.log(`⏱️ Feature flags auto-refresh started (${intervalMs / 1000}s)`);
    },

    /**
     * Get all enabled features
     */
    getEnabledFeatures() {
        return Object.keys(this.flags).filter(key => this.flags[key].enabled);
    },

    /**
     * Get features by category
     */
    getFeaturesByCategory(category) {
        return Object.keys(this.flags)
            .filter(key => this.flags[key].category === category)
            .reduce((acc, key) => {
                acc[key] = this.flags[key];
                return acc;
            }, {});
    },

    /**
     * Debug: Log all feature flags
     */
    debug() {
        console.group('🏁 Feature Flags Debug');
        console.log('Loaded:', this.loaded);
        console.log('Last Fetch:', this.lastFetch ? new Date(this.lastFetch).toLocaleString() : 'Never');
        console.log('Total Features:', Object.keys(this.flags).length);
        console.log('Enabled Features:', this.getEnabledFeatures().length);
        console.table(this.flags);
        console.groupEnd();
    },

    /**
     * Handle join modal card visibility and state
     * Called when apply choice modal opens
     */
    applyJoinModalLogic() {
        const contractorCard = document.querySelector('.apc-card[onclick*="openProv"]');
        const supplierCard = document.querySelector('.apc-card[onclick*="openSupplier"]');

        if (contractorCard) {
            const contractorEnabled = this.isEnabled('contractor_joining');
            contractorCard.style.display = contractorEnabled ? '' : 'none';
            contractorCard.style.opacity = contractorEnabled ? '1' : '0.5';
            contractorCard.style.pointerEvents = contractorEnabled ? 'auto' : 'none';
            if (!contractorEnabled) {
                contractorCard.title = 'Contractor applications are currently disabled';
            }
        }

        if (supplierCard) {
            const supplierEnabled = this.isEnabled('supplier_application');
            supplierCard.style.display = supplierEnabled ? '' : 'none';
            supplierCard.style.opacity = supplierEnabled ? '1' : '0.5';
            supplierCard.style.pointerEvents = supplierEnabled ? 'auto' : 'none';
            if (!supplierEnabled) {
                supplierCard.title = 'Supplier applications are coming soon';
            }
        }

        console.log(`📋 Join Modal: Contractor=${this.isEnabled('contractor_joining')} | Supplier=${this.isEnabled('supplier_application')}`);
    }
};

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
        await FeatureFlags.init();
        FeatureFlags.startAutoRefresh();
    });
} else {
    // DOM already loaded
    FeatureFlags.init().then(() => FeatureFlags.startAutoRefresh());
}

// Make available globally
window.FeatureFlags = FeatureFlags;

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FeatureFlags;
}
