const { SendMailClient } = require('zeptomail');

// ZeptoMail API Configuration
const API_URL = 'api.zeptomail.com/';
const API_TOKEN = `Zoho-enczapikey ${process.env.ZEPTOMAIL_PASS}`;

const client = new SendMailClient({ url: API_URL, token: API_TOKEN });

const TEMPLATE_IDS = {
  serviceRequest: {
    en: process.env.ZEPTOMAIL_TEMPLATE_REQUEST_EN || '',
    es: process.env.ZEPTOMAIL_TEMPLATE_REQUEST_ES || ''
  },
  application: {
    en: process.env.ZEPTOMAIL_TEMPLATE_APPLICATION_EN || '',
    es: process.env.ZEPTOMAIL_TEMPLATE_APPLICATION_ES || ''
  }
};

const normalizeLanguageCode = (lang) => {
  if (!lang || typeof lang !== 'string') return 'en';
  const normalized = lang.trim().toLowerCase();
  if (normalized.startsWith('es')) return 'es';
  if (normalized.startsWith('en')) return 'en';
  return 'en';
};

class EmailService {
  constructor() {
    // Test connection on initialization
    this.testConnection();
  }

  async testConnection() {
    try {
      // Simple test by verifying client exists
      if (client && API_TOKEN) {
        console.log('✅ ZeptoMail API client initialized successfully');
      }
    } catch (error) {
      console.error('❌ ZeptoMail API initialization failed:', error.message);
      console.log('📧 Email notifications will be disabled until API is configured');
    }
  }

  async sendServiceRequest(data) {
    try {
      const language = normalizeLanguageCode(data.language_code);
      const templateKey = TEMPLATE_IDS.serviceRequest[language];
      
      if (!templateKey) {
        throw new Error(`ZeptoMail template key not configured for language: ${language}`);
      }

      const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@lumitya.com';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@lumitya.com';

      const mailPayload = {
        template_key: templateKey,
        from: {
          address: fromEmail,
          name: 'Lumitya Support'
        },
        to: [
          {
            email_address: {
              address: adminEmail,
              name: 'Lumitya Admin'
            }
          }
        ],
        merge_info: {
          name: data.name || '',
          phone: data.phone || '',
          email_from: data.email || '',
          city: data.city || '',
          neighbourhood: data.neighbourhood || '',
          service: data.service || '',
          description: data.description || '',
          budget: data.budget || '',
          timeline: data.timeline || ''
        }
      };

      console.log(`📧 Sending service request with ZeptoMail template [${language}]: ${templateKey}`);
      const result = await client.sendMailWithTemplate(mailPayload);
      console.log('✅ Service request email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to send service request email:', error.message);
      throw error;
    }
  }

  async sendProviderApplication(data) {
    try {
      const language = normalizeLanguageCode(data.language_code);
      const templateKey = TEMPLATE_IDS.application[language];
      
      if (!templateKey) {
        throw new Error(`ZeptoMail template key not configured for language: ${language}`);
      }

      const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@lumitya.com';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@lumitya.com';

      const mailPayload = {
        template_key: templateKey,
        from: {
          address: fromEmail,
          name: 'Lumitya Support'
        },
        to: [
          {
            email_address: {
              address: adminEmail,
              name: 'Lumitya Admin'
            }
          }
        ],
        merge_info: {
          name: data.name || '',
          business: data.business || '',
          phone: data.phone || '',
          email_from: data.email || '',
          city: data.city || '',
          neighbourhood: data.neighbourhood || '',
          zone: data.zone || '',
          categories: data.categories || '',
          experience: data.experience || '',
          team: data.team || '',
          website: data.website || '',
          description: data.description || ''
        }
      };

      console.log(`📧 Sending provider application with ZeptoMail template [${language}]: ${templateKey}`);
      const result = await client.sendMailWithTemplate(mailPayload);
      console.log('✅ Provider application email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to send provider application email:', error.message);
      throw error;
    }
  }

  async sendSupplierApplication(data) {
    try {
      const language = normalizeLanguageCode(data.language_code);
      const templateKey = TEMPLATE_IDS.application[language];
      
      if (!templateKey) {
        throw new Error(`ZeptoMail template key not configured for language: ${language}`);
      }

      const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@lumitya.com';
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@lumitya.com';

      const mailPayload = {
        template_key: templateKey,
        from: {
          address: fromEmail,
          name: 'Lumitya Support'
        },
        to: [
          {
            email_address: {
              address: adminEmail,
              name: 'Lumitya Admin'
            }
          }
        ],
        merge_info: {
          name: data.name || '',
          business: data.business || '',
          phone: data.phone || '',
          email_from: data.email || '',
          city: data.city || '',
          neighbourhood: data.neighbourhood || '',
          zone: data.zone || '',
          categories: data.categories || '',
          experience: data.experience || '',
          team: data.team || '',
          website: data.website || '',
          description: data.description || ''
        }
      };

      console.log(`📧 Sending supplier application with ZeptoMail template [${language}]: ${templateKey}`);
      const result = await client.sendMailWithTemplate(mailPayload);
      console.log('✅ Supplier application email sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to send supplier application email:', error.message);
      throw error;
    }
  }
}

module.exports = new EmailService();