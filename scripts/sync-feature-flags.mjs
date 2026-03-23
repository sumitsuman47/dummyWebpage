import 'dotenv/config';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY in environment (.env).');
    process.exit(1);
}

const desiredFlags = [
    {
        feature_key: 'isBrowseByCategoryEnable',
        feature_name: 'Browse by Category (Home)',
        feature_description: 'Show/hide the Browse by Category section on the home page',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Gates the home screen Service Categories / Browse by Category section'
    },
    {
        feature_key: 'enablePriorityListing',
        feature_name: 'Priority Listings (Home)',
        feature_description: 'Show/hide the priority homeowner request cards on the home hero section',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Gates the home hero priority posting section'
    },
    {
        feature_key: 'poviderLeatureListing',
        feature_name: 'Featured Provider Listing (Home)',
        feature_description: 'Show/hide the featured provider list in the "List Your Services on Lumitya" section',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Gates the right-side scrollable provider promo list'
    },
    {
        feature_key: 'language_switcher',
        feature_name: 'Language Switcher',
        feature_description: 'Show language toggle buttons (EN/ES) in navigation',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls visibility of language switcher buttons'
    },
    {
        feature_key: 'join_modal',
        feature_name: 'Join Modal - Choose Role',
        feature_description: 'Show role selection modal with Contractor/Supplier choices',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls visibility of the main role selection modal'
    },
    {
        feature_key: 'contractor_joining',
        feature_name: 'Contractor Application Form',
        feature_description: 'Show contractor application form when selected from join modal',
        category: 'forms',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Disable to hide contractor signup option'
    },
    {
        feature_key: 'supplier_joining',
        feature_name: 'Supplier Application Form',
        feature_description: 'Show supplier application form when selected from join modal',
        category: 'forms',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Enable when supplier signup is ready'
    },
    {
        feature_key: 'provider_directory',
        feature_name: 'Provider Directory Page',
        feature_description: 'Show/hide the provider directory page and related navigation links',
        category: 'pages',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Gates the Find Providers / Directory page'
    },
    {
        feature_key: 'footer_platform_column',
        feature_name: 'Footer: Platform Column',
        feature_description: 'Show/hide the Platform column in the footer',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls visibility of the footer Platform section'
    },
    {
        feature_key: 'footer_link_home',
        feature_name: 'Footer: Home Link',
        feature_description: 'Show/hide the Home link in the footer Platform column',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Footer Platform → Home'
    },
    {
        feature_key: 'footer_link_directory',
        feature_name: 'Footer: Find Providers Link',
        feature_description: 'Show/hide the Find Providers link in the footer Platform column',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Footer Platform → Find Providers'
    },
    {
        feature_key: 'footer_link_pricing',
        feature_name: 'Footer: For Contractors Link',
        feature_description: 'Show/hide the For Contractors link in the footer Platform column',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Footer Platform → For Contractors'
    },
    {
        feature_key: 'home_safety_notice',
        feature_name: 'Home Safety Notice',
        feature_description: 'Show/hide the home page safety guidance banner',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the homepage safety tip banner in the hero section'
    },
    {
        feature_key: 'home_payment_risk_notice',
        feature_name: 'Home Payment Risk Notice',
        feature_description: 'Show/hide the home page payment risk warning banner',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the homepage payment risk warning in the hero section'
    },
    {
        feature_key: 'home_provider_signals',
        feature_name: 'Home Provider Signals',
        feature_description: 'Show/hide the home page live directory snapshot section',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the provider-count and verified-profile section on the homepage'
    },
    {
        feature_key: 'service_request_safety_notice',
        feature_name: 'Service Request Safety Notice',
        feature_description: 'Show/hide the safety banner in the service request modal',
        category: 'forms',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the safety tip shown above the main service request form'
    },
    {
        feature_key: 'service_request_payment_risk_notice',
        feature_name: 'Service Request Payment Risk Notice',
        feature_description: 'Show/hide the payment risk banner in the service request modal',
        category: 'forms',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the payment risk notice shown above the main service request form'
    },
    {
        feature_key: 'provider_contact_safety_notice',
        feature_name: 'Provider Contact Safety Notice',
        feature_description: 'Show/hide the safety banner in the contact provider modal',
        category: 'forms',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the safety tip shown above the provider contact form'
    },
    {
        feature_key: 'provider_contact_payment_risk_notice',
        feature_name: 'Provider Contact Payment Risk Notice',
        feature_description: 'Show/hide the payment risk banner in the contact provider modal',
        category: 'forms',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the payment risk notice shown above the provider contact form'
    },
    {
        feature_key: 'footer_dispute_guidance',
        feature_name: 'Footer Dispute Guidance',
        feature_description: 'Show/hide the dispute guidance block in site footers',
        category: 'ui',
        is_enabled: true,
        is_beta: false,
        updated_by: 'system',
        notes: 'Controls the footer help content for dispute resolution'
    }
];

async function upsertFeatureFlags(flags) {
    const url = `${SUPABASE_URL}/rest/v1/feature_flags?on_conflict=feature_key`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            Prefer: 'resolution=merge-duplicates,return=representation'
        },
        body: JSON.stringify(flags)
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Supabase upsert failed: ${response.status} ${text}`);
    }

    return response.json();
}

try {
    const result = await upsertFeatureFlags(desiredFlags);
    console.log(`✅ Upserted ${result.length} feature flag rows`);
    for (const row of result) {
        console.log(`- ${row.feature_key}: ${row.is_enabled ? 'enabled' : 'disabled'} (${row.category})`);
    }
} catch (err) {
    console.error('❌ Failed to upsert feature flags');
    console.error(err.message);
    process.exit(1);
}
