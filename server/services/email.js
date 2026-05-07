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

// Bounce address must be verified in ZeptoMail dashboard
const BOUNCE_ADDRESS = process.env.ZEPTOMAIL_BOUNCE_ADDRESS || process.env.ZEPTOMAIL_FROM_EMAIL || 'bounce@lumitya.com';

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

      const subjectText = language === 'es' 
        ? `Nueva Solicitud de Servicio: ${data.service || 'Servicio'} - ${data.name || 'Cliente'}`
        : `New Service Request: ${data.service || 'Service'} - ${data.name || 'Customer'}`;

      const mailPayload = {
        mail_template_key: templateKey,
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
          subject: subjectText,
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
      const errMsg = error.message || error.error || JSON.stringify(error);
      console.error('❌ Failed to send service request email:', errMsg);
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

      const subjectText = language === 'es'
        ? `Nueva Solicitud de Proveedor: ${data.name || 'Proveedor'} - ${data.city || 'Ciudad'}`
        : `New Provider Application: ${data.name || 'Provider'} - ${data.city || 'City'}`;

      const mailPayload = {
        mail_template_key: templateKey,
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
          subject: subjectText,
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
      const errMsg = error.message || error.error || JSON.stringify(error);
      console.error('❌ Failed to send provider application email:', errMsg);
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

      const subjectText = language === 'es'
        ? `Nueva Solicitud de Proveedor de Materiales: ${data.name || 'Proveedor'} - ${data.city || 'Ciudad'}`
        : `New Supplier Application: ${data.name || 'Supplier'} - ${data.city || 'City'}`;

      const mailPayload = {
        mail_template_key: templateKey,
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
          subject: subjectText,
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

  // Send confirmation email to the user who submitted a service request
  async sendServiceRequestConfirmation(data) {
    try {
      if (!data.email) {
        console.log('⚠️ No email provided for service request confirmation');
        return null;
      }

      const language = normalizeLanguageCode(data.language_code);
      const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@lumitya.com';

      const isSpanish = language === 'es';
      
      const subjectText = isSpanish
        ? '✅ Tu solicitud de servicio ha sido recibida - Lumitya'
        : '✅ Your service request has been received - Lumitya';

      const htmlContent = isSpanish ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B3A6B 0%,#2A4A7B 100%);padding:32px 24px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Lumitya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Plataforma de Servicios para el Hogar</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 24px">
              <div style="text-align:center;margin-bottom:24px">
                <div style="display:inline-block;background:#E8F5E9;border-radius:50%;padding:16px;margin-bottom:16px">
                  <span style="font-size:32px">✅</span>
                </div>
                <h2 style="margin:0;color:#1B3A6B;font-size:20px;font-weight:600">¡Solicitud Recibida!</h2>
              </div>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                Hola <strong>${data.name || 'Cliente'}</strong>,
              </p>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                Hemos recibido tu solicitud de servicio de <strong>${data.service || 'servicio'}</strong>. 
                Tu solicitud ha sido enviada a proveedores independientes verificados en tu área.
              </p>

              <!-- Request Summary -->
              <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #1B3A6B">
                <h3 style="margin:0 0 12px;color:#1B3A6B;font-size:14px;font-weight:600;text-transform:uppercase">Resumen de tu Solicitud</h3>
                <table style="width:100%;font-size:14px;color:#555">
                  <tr><td style="padding:4px 0;color:#777">Servicio:</td><td style="padding:4px 0;font-weight:500">${data.service || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Ciudad:</td><td style="padding:4px 0">${data.city || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Colonia:</td><td style="padding:4px 0">${data.neighbourhood || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Presupuesto:</td><td style="padding:4px 0">${data.budget || 'No especificado'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Cronograma:</td><td style="padding:4px 0">${data.timeline || '-'}</td></tr>
                </table>
              </div>

              <!-- What's Next -->
              <h3 style="color:#1B3A6B;font-size:16px;font-weight:600;margin:24px 0 12px">¿Qué sigue?</h3>
              <ul style="color:#333;font-size:14px;line-height:1.8;margin:0;padding-left:20px">
                <li>Los proveedores te contactarán directamente en las próximas <strong>24-48 horas</strong></li>
                <li>Recibirás contacto por teléfono o WhatsApp de los proveedores interesados</li>
                <li>Compara opciones y elige al proveedor que mejor se adapte a tus necesidades</li>
              </ul>

              <!-- Warning Box -->
              <div style="background:#FEF9C3;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:24px 0">
                <p style="margin:0;color:#78350F;font-size:13px;line-height:1.6">
                  <strong>⚠️ Importante:</strong> Nunca realices pagos anticipados sin verificar al proveedor. 
                  Siempre solicita un presupuesto por escrito y verifica las credenciales antes de contratar.
                </p>
              </div>

              <!-- Contact Us -->
              <div style="background:#F0F7FF;border-radius:8px;padding:16px;margin:24px 0">
                <h4 style="margin:0 0 8px;color:#1B3A6B;font-size:14px;font-weight:600">¿No recibiste contacto en 5 días hábiles?</h4>
                <p style="margin:0;color:#555;font-size:13px;line-height:1.6">
                  Contáctanos y te ayudaremos:<br>
                  📧 <a href="mailto:contact@lumitya.com" style="color:#1B3A6B">contact@lumitya.com</a><br>
                  📱 <a href="https://wa.me/523347880249" style="color:#25D366">WhatsApp: +52 33 4788 0249</a>
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px;text-align:center;border-top:1px solid #E5E7EB">
              <p style="margin:0 0 8px;color:#777;font-size:12px">
                © 2026 Lumitya. Todos los derechos reservados.
              </p>
              <p style="margin:0;color:#999;font-size:11px">
                Guadalajara, Jalisco, México
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      ` : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B3A6B 0%,#2A4A7B 100%);padding:32px 24px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Lumitya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Home Services Platform</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 24px">
              <div style="text-align:center;margin-bottom:24px">
                <div style="display:inline-block;background:#E8F5E9;border-radius:50%;padding:16px;margin-bottom:16px">
                  <span style="font-size:32px">✅</span>
                </div>
                <h2 style="margin:0;color:#1B3A6B;font-size:20px;font-weight:600">Request Received!</h2>
              </div>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                Hi <strong>${data.name || 'Customer'}</strong>,
              </p>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                We've received your service request for <strong>${data.service || 'service'}</strong>. 
                Your request has been shared with verified independent providers in your area.
              </p>

              <!-- Request Summary -->
              <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #1B3A6B">
                <h3 style="margin:0 0 12px;color:#1B3A6B;font-size:14px;font-weight:600;text-transform:uppercase">Your Request Summary</h3>
                <table style="width:100%;font-size:14px;color:#555">
                  <tr><td style="padding:4px 0;color:#777">Service:</td><td style="padding:4px 0;font-weight:500">${data.service || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">City:</td><td style="padding:4px 0">${data.city || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Neighbourhood:</td><td style="padding:4px 0">${data.neighbourhood || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Budget:</td><td style="padding:4px 0">${data.budget || 'Not specified'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Timeline:</td><td style="padding:4px 0">${data.timeline || '-'}</td></tr>
                </table>
              </div>

              <!-- What's Next -->
              <h3 style="color:#1B3A6B;font-size:16px;font-weight:600;margin:24px 0 12px">What's Next?</h3>
              <ul style="color:#333;font-size:14px;line-height:1.8;margin:0;padding-left:20px">
                <li>Providers will contact you directly within <strong>24-48 hours</strong></li>
                <li>You'll receive contact via phone or WhatsApp from interested providers</li>
                <li>Compare options and choose the provider that best fits your needs</li>
              </ul>

              <!-- Warning Box -->
              <div style="background:#FEF9C3;border:1px solid #F59E0B;border-radius:8px;padding:16px;margin:24px 0">
                <p style="margin:0;color:#78350F;font-size:13px;line-height:1.6">
                  <strong>⚠️ Important:</strong> Never make advance payments without verifying the provider. 
                  Always request a written quote and verify credentials before hiring.
                </p>
              </div>

              <!-- Contact Us -->
              <div style="background:#F0F7FF;border-radius:8px;padding:16px;margin:24px 0">
                <h4 style="margin:0 0 8px;color:#1B3A6B;font-size:14px;font-weight:600">No contact within 5 business days?</h4>
                <p style="margin:0;color:#555;font-size:13px;line-height:1.6">
                  Reach out to us and we'll help:<br>
                  📧 <a href="mailto:contact@lumitya.com" style="color:#1B3A6B">contact@lumitya.com</a><br>
                  📱 <a href="https://wa.me/523347880249" style="color:#25D366">WhatsApp: +52 33 4788 0249</a>
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px;text-align:center;border-top:1px solid #E5E7EB">
              <p style="margin:0 0 8px;color:#777;font-size:12px">
                © 2026 Lumitya. All rights reserved.
              </p>
              <p style="margin:0;color:#999;font-size:11px">
                Guadalajara, Jalisco, Mexico
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const mailPayload = {
        from: {
          address: fromEmail,
          name: 'Lumitya'
        },
        to: [
          {
            email_address: {
              address: data.email,
              name: data.name || 'Customer'
            }
          }
        ],
        subject: subjectText,
        htmlbody: htmlContent
      };

      console.log(`📧 Sending service request confirmation to user: ${data.email}`);
      const result = await client.sendMail(mailPayload);
      console.log('✅ Service request confirmation sent to user:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to send service request confirmation:', error.message);
      // Don't throw - user confirmation is not critical
      return null;
    }
  }

  // Send confirmation email to the provider who submitted an application
  async sendProviderApplicationConfirmation(data) {
    try {
      if (!data.email) {
        console.log('⚠️ No email provided for provider application confirmation');
        return null;
      }

      const language = normalizeLanguageCode(data.language_code);
      const fromEmail = process.env.ZEPTOMAIL_FROM_EMAIL || 'noreply@lumitya.com';

      const isSpanish = language === 'es';
      
      const subjectText = isSpanish
        ? '✅ Tu solicitud de proveedor ha sido recibida - Lumitya'
        : '✅ Your provider application has been received - Lumitya';

      const htmlContent = isSpanish ? `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B3A6B 0%,#2A4A7B 100%);padding:32px 24px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Lumitya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Plataforma de Servicios para el Hogar</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 24px">
              <div style="text-align:center;margin-bottom:24px">
                <div style="display:inline-block;background:#E8F5E9;border-radius:50%;padding:16px;margin-bottom:16px">
                  <span style="font-size:32px">✅</span>
                </div>
                <h2 style="margin:0;color:#1B3A6B;font-size:20px;font-weight:600">¡Solicitud Recibida!</h2>
              </div>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                Hola <strong>${data.name || 'Proveedor'}</strong>,
              </p>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                Hemos recibido tu solicitud para unirte a Lumitya como proveedor de servicios. 
                Nuestro equipo revisará tu información y te contactaremos pronto.
              </p>

              <!-- Application Summary -->
              <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #1B3A6B">
                <h3 style="margin:0 0 12px;color:#1B3A6B;font-size:14px;font-weight:600;text-transform:uppercase">Resumen de tu Solicitud</h3>
                <table style="width:100%;font-size:14px;color:#555">
                  <tr><td style="padding:4px 0;color:#777">Nombre:</td><td style="padding:4px 0;font-weight:500">${data.name || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Negocio:</td><td style="padding:4px 0">${data.business || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Ciudad:</td><td style="padding:4px 0">${data.city || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Servicios:</td><td style="padding:4px 0">${data.categories || '-'}</td></tr>
                </table>
              </div>

              <!-- What's Next -->
              <h3 style="color:#1B3A6B;font-size:16px;font-weight:600;margin:24px 0 12px">¿Qué sigue?</h3>
              <ul style="color:#333;font-size:14px;line-height:1.8;margin:0;padding-left:20px">
                <li>Nuestro equipo revisará tu solicitud en <strong>3-5 días hábiles</strong></li>
                <li>Te contactaremos por teléfono o WhatsApp para los siguientes pasos</li>
                <li>Una vez aprobado, tu perfil estará visible para propietarios en tu área</li>
              </ul>

              <!-- Contact Us -->
              <div style="background:#F0F7FF;border-radius:8px;padding:16px;margin:24px 0">
                <h4 style="margin:0 0 8px;color:#1B3A6B;font-size:14px;font-weight:600">¿Tienes preguntas?</h4>
                <p style="margin:0;color:#555;font-size:13px;line-height:1.6">
                  Contáctanos:<br>
                  📧 <a href="mailto:contact@lumitya.com" style="color:#1B3A6B">contact@lumitya.com</a><br>
                  📱 <a href="https://wa.me/523347880249" style="color:#25D366">WhatsApp: +52 33 4788 0249</a>
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px;text-align:center;border-top:1px solid #E5E7EB">
              <p style="margin:0 0 8px;color:#777;font-size:12px">
                © 2026 Lumitya. Todos los derechos reservados.
              </p>
              <p style="margin:0;color:#999;font-size:11px">
                Guadalajara, Jalisco, México
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      ` : `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background:#f5f5f5">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:32px 16px">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:560px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08)">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1B3A6B 0%,#2A4A7B 100%);padding:32px 24px;text-align:center">
              <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700">Lumitya</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px">Home Services Platform</p>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding:32px 24px">
              <div style="text-align:center;margin-bottom:24px">
                <div style="display:inline-block;background:#E8F5E9;border-radius:50%;padding:16px;margin-bottom:16px">
                  <span style="font-size:32px">✅</span>
                </div>
                <h2 style="margin:0;color:#1B3A6B;font-size:20px;font-weight:600">Application Received!</h2>
              </div>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                Hi <strong>${data.name || 'Provider'}</strong>,
              </p>
              
              <p style="color:#333;font-size:15px;line-height:1.6;margin:0 0 16px">
                We've received your application to join Lumitya as a service provider. 
                Our team will review your information and contact you soon.
              </p>

              <!-- Application Summary -->
              <div style="background:#F8FAFC;border-radius:8px;padding:16px;margin:24px 0;border-left:4px solid #1B3A6B">
                <h3 style="margin:0 0 12px;color:#1B3A6B;font-size:14px;font-weight:600;text-transform:uppercase">Your Application Summary</h3>
                <table style="width:100%;font-size:14px;color:#555">
                  <tr><td style="padding:4px 0;color:#777">Name:</td><td style="padding:4px 0;font-weight:500">${data.name || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Business:</td><td style="padding:4px 0">${data.business || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">City:</td><td style="padding:4px 0">${data.city || '-'}</td></tr>
                  <tr><td style="padding:4px 0;color:#777">Services:</td><td style="padding:4px 0">${data.categories || '-'}</td></tr>
                </table>
              </div>

              <!-- What's Next -->
              <h3 style="color:#1B3A6B;font-size:16px;font-weight:600;margin:24px 0 12px">What's Next?</h3>
              <ul style="color:#333;font-size:14px;line-height:1.8;margin:0;padding-left:20px">
                <li>Our team will review your application within <strong>3-5 business days</strong></li>
                <li>We'll contact you via phone or WhatsApp for next steps</li>
                <li>Once approved, your profile will be visible to homeowners in your area</li>
              </ul>

              <!-- Contact Us -->
              <div style="background:#F0F7FF;border-radius:8px;padding:16px;margin:24px 0">
                <h4 style="margin:0 0 8px;color:#1B3A6B;font-size:14px;font-weight:600">Have questions?</h4>
                <p style="margin:0;color:#555;font-size:13px;line-height:1.6">
                  Contact us:<br>
                  📧 <a href="mailto:contact@lumitya.com" style="color:#1B3A6B">contact@lumitya.com</a><br>
                  📱 <a href="https://wa.me/523347880249" style="color:#25D366">WhatsApp: +52 33 4788 0249</a>
                </p>
              </div>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;padding:24px;text-align:center;border-top:1px solid #E5E7EB">
              <p style="margin:0 0 8px;color:#777;font-size:12px">
                © 2026 Lumitya. All rights reserved.
              </p>
              <p style="margin:0;color:#999;font-size:11px">
                Guadalajara, Jalisco, Mexico
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `;

      const mailPayload = {
        from: {
          address: fromEmail,
          name: 'Lumitya'
        },
        to: [
          {
            email_address: {
              address: data.email,
              name: data.name || 'Provider'
            }
          }
        ],
        subject: subjectText,
        htmlbody: htmlContent
      };

      console.log(`📧 Sending provider application confirmation to: ${data.email}`);
      const result = await client.sendMail(mailPayload);
      console.log('✅ Provider application confirmation sent:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to send provider application confirmation:', error.message);
      // Don't throw - user confirmation is not critical
      return null;
    }
  }
}

module.exports = new EmailService();