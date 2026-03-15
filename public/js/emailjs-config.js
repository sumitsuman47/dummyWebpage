/**
 * EmailJS Configuration for Lumitya Platform
 * 
 * Setup Instructions:
 * 1. Go to https://www.emailjs.com/ and create a free account
 * 2. Add an email service (Gmail, Outlook, etc.)
 * 3. Create email templates for each form type
 * 4. Update the credentials below with your actual values
 * 
 * Template Variables to use in EmailJS templates:
 * 
 * Service Request Template:
 * - {{from_name}} - Customer name
 * - {{phone}} - Customer phone
 * - {{email}} - Customer email
 * - {{city}} - City
 * - {{neighbourhood}} - Neighbourhood
 * - {{service}} - Service type
 * - {{description}} - Project description
 * - {{budget}} - Budget range
 * - {{timeline}} - Timeline
 * 
 * Provider Application Template:
 * - {{from_name}} - Provider name
 * - {{business}} - Business name
 * - {{phone}} - Phone
 * - {{email}} - Email
 * - {{city}} - City
 * - {{categories}} - Service categories
 * - {{experience}} - Years of experience
 * - {{description}} - Description
 * 
 * Supplier Application Template:
 * - {{from_name}} - Contact name
 * - {{business}} - Business name
 * - {{phone}} - Phone
 * - {{email}} - Email
 * - {{city}} - City
 * - {{materials}} - Materials list
 * - {{delivery}} - Delivery options
 */

const EmailJSConfig = {
  // EmailJS credentials - configured
  serviceId: 'service_Lumitya',
  publicKey: 'XTskJo1Oeud-CiX-p',

  // Template IDs for different forms
  templates: {
    serviceRequest: 'template_vhj4i4m',
    providerApp: 'template_eytkw0n',
    supplierApp: 'template_eytkw0n',
    contactProvider: 'template_vhj4i4m',
    notifyPremium: 'template_vhj4i4m'
  },

  // Initialize EmailJS
  init() {
    if (typeof emailjs === 'undefined') {
      console.error('EmailJS library not loaded');
      return false;
    }

    if (this.serviceId === 'YOUR_SERVICE_ID' || this.publicKey === 'YOUR_PUBLIC_KEY') {
      console.warn('EmailJS not configured. Update credentials in emailjs-config.js');
      return false;
    }

    try {
      emailjs.init(this.publicKey);
      console.log('✅ EmailJS initialized successfully');
      return true;
    } catch (error) {
      console.error('EmailJS initialization error:', error);
      return false;
    }
  },

  // Build consistent email subjects so inbox messages are never blank.
  buildSubject(prefix, value) {
    const clean = String(value || '').trim();
    return clean ? `${prefix}: ${clean}` : prefix;
  },

  // Send service request notification
  async sendServiceRequest(data) {
    const templateParams = {
      from_name: data.name,
      name: data.name,
      phone: data.phone,
      email: data.email || 'Not provided',
      email_from: data.email || 'Not provided',
      city: data.city,
      neighbourhood: data.neighbourhood,
      service: data.service,
      description: data.description,
      budget: data.budget || 'Not specified',
      timeline: data.timeline,
      subject: this.buildSubject('New Service Request', data.name),
      to_email: 'info@lumitya.com' // Change to your email
    };

    return this.send(this.templates.serviceRequest, templateParams);
  },

  // Send provider application notification
  async sendProviderApplication(data) {
    // Format categories as HTML badges for email template
    const categoriesHTML = (data.services || data.categories || [])
      .map(cat => `<span class="badge">${cat}</span>`)
      .join(' ');

    const templateParams = {
      from_name: data.name,
      name: data.name,
      business: data.business_name || data.business || 'N/A',
      phone: data.phone,
      email: data.email,
      email_from: data.email,
      city: data.city,
      neighbourhood: data.neighbourhood,
      zone: data.coverage || 'Not specified',
      categories: categoriesHTML || '<span class="badge">Not specified</span>',
      experience: data.years_experience || data.experience || 'Not specified',
      team: data.team_size || 'Not specified',
      website: data.website || 'Not provided',
      description: data.description || 'No description provided',
      subject: this.buildSubject('New Provider Application', data.name),
      to_email: 'applications@lumitya.com' // Change to your email
    };

    return this.send(this.templates.providerApp, templateParams);
  },

  // Send supplier application notification
  async sendSupplierApplication(data) {
    const materialsText = data.materials?.map(m =>
      `${m.name} - ${m.price} MXN/${m.unit}`
    ).join('\n') || 'No materials listed';

    const templateParams = {
      from_name: data.name,
      name: data.name,
      business: data.business,
      phone: data.phone,
      email: data.email,
      email_from: data.email,
      city: data.city,
      neighbourhood: data.neighbourhood,
      materials: materialsText,
      delivery: data.delivery === 'yes' ? 'Yes - ' + (data.deliveryDetails?.type || '') : 'No',
      coverage: data.coverage || 'Not specified',
      description: data.description || 'N/A',
      subject: this.buildSubject('New Supplier Application', data.business || data.name),
      to_email: 'applications@lumitya.com' // Change to your email
    };

    return this.send(this.templates.supplierApp, templateParams);
  },

  // Send contact provider message
  async sendContactMessage(data, providerEmail) {
    const templateParams = {
      from_name: data.name,
      name: data.name,
      phone: data.phone,
      email: data.email || 'Not provided',
      email_from: data.email || 'Not provided',
      message: data.message,
      subject: this.buildSubject('New Contact Request', data.name),
      provider_email: providerEmail,
      to_email: providerEmail
    };

    return this.send(this.templates.contactProvider, templateParams);
  },

  // Send premium plan notification request
  async sendNotifyRequest(data) {
    const templateParams = {
      from_name: data.name,
      name: data.name,
      phone: data.phone,
      email: data.email,
      email_from: data.email,
      whatsapp: data.whatsapp,
      service: data.service,
      subject: this.buildSubject('Premium Plan Interest', data.name),
      to_email: 'premium@lumitya.com' // Change to your email
    };

    return this.send(this.templates.notifyPremium, templateParams);
  },

  // Generic send method
  async send(templateId, params) {
    if (!this.init()) {
      throw new Error('EmailJS not configured');
    }

    if (templateId === 'YOUR_REQUEST_TEMPLATE_ID' || templateId.includes('YOUR_')) {
      console.warn('EmailJS template not configured');
      throw new Error('Email notifications not configured. Contact admin.');
    }

    try {
      const safeParams = {
        ...params,
        subject: params.subject || 'Lumitya Notification'
      };
      console.log('Sending email via EmailJS...');
      const response = await emailjs.send(this.serviceId, templateId, safeParams);
      console.log('✅ Email sent successfully:', response);
      return response;
    } catch (error) {
      console.error('❌ Email send error:', error);
      throw new Error('Failed to send notification: ' + error.text || error.message);
    }
  }
};

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => EmailJSConfig.init());
} else {
  EmailJSConfig.init();
}

// Export for use in other scripts
window.EmailJSConfig = EmailJSConfig;
