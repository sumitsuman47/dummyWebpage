# EmailJS Setup Guide for Lumitya

## Overview
EmailJS has been integrated to send email notifications when users submit forms. This allows you to receive notifications without needing a backend email server.

## Setup Steps

### 1. Create EmailJS Account
1. Go to https://www.emailjs.com/
2. Sign up for a free account (allows 200 emails/month)
3. Verify your email address

### 2. Connect Your Email Service
1. In the EmailJS dashboard, go to **Email Services**
2. Click **Add New Service**
3. Choose your email provider (Gmail, Outlook, etc.)
4. Follow the connection instructions
5. Note down your **Service ID** (e.g., `service_abc123`)

### 3. Create Email Templates

Create templates for each form type:

#### Template 1: Service Request
**Template Name:** `Service Request Notification`
**Template ID:** Save this for config

**Subject:** `New Service Request from {{from_name}}`

**Body:**
```
New service request submitted on Lumitya:

Customer Information:
- Name: {{from_name}}
- Phone: {{phone}}
- Email: {{email}}

Project Details:
- City: {{city}}
- Neighbourhood: {{neighbourhood}}
- Service Type: {{service}}
- Timeline: {{timeline}}
- Budget: {{budget}}

Description:
{{description}}

---
Reply to this customer directly at their phone number or email.
```

#### Template 2: Provider Application
**Template Name:** `Provider Application`

**Subject:** `New Provider Application: {{from_name}}`

**Body:**
```
New contractor application submitted:

Provider Information:
- Name: {{from_name}}
- Business: {{business}}
- Phone: {{phone}}
- Email: {{email}}

Service Details:
- Location: {{city}}, {{neighbourhood}}
- Categories: {{categories}}
- Experience: {{experience}}
- Coverage: {{coverage}}

Description:
{{description}}

---
Review and contact the provider to proceed with listing.
```

#### Template 3: Supplier Application
**Template Name:** `Supplier Application`

**Subject:** `New Supplier Application: {{business}}`

**Body:**
```
New material supplier application:

Supplier Information:
- Contact Name: {{from_name}}
- Business: {{business}}
- Phone: {{phone}}
- Email: {{email}}

Business Details:
- Location: {{city}}, {{neighbourhood}}
- Delivery: {{delivery}}
- Coverage: {{coverage}}

Materials:
{{materials}}

Additional Notes:
{{description}}

---
Review and contact the supplier to proceed with listing.
```

#### Template 4: Contact Provider
**Template Name:** `Provider Contact Message`

**Subject:** `New Lead: {{from_name}} wants to contact you`

**Body:**
```
You have a new lead from Lumitya!

Customer Information:
- Name: {{from_name}}
- Phone: {{phone}}
- Email: {{email}}

Message:
{{message}}

---
Contact this potential customer as soon as possible.
```

#### Template 5: Premium Plan Notification
**Template Name:** `Premium Plan Interest`

**Subject:** `Premium Plan Interest: {{from_name}}`

**Body:**
```
Provider interested in Premium Plan:

Provider Information:
- Name: {{from_name}}
- Phone: {{phone}}
- Email: {{email}}
- WhatsApp: {{whatsapp}}
- Service Type: {{service}}

---
Follow up when Premium Plan is available.
```

### 4. Get Your Public Key
1. In EmailJS dashboard, go to **Account** > **General**
2. Find your **Public Key** (e.g., `your_public_key_123`)

### 5. Configure the Application

**Option A: Direct File Edit (Connect)**

Edit `/public/js/emailjs-config.js`:

```javascript
const EmailJSConfig = {
  serviceId: 'service_abc123',        // Your Service ID
  publicKey: 'your_public_key_123',   // Your Public Key
  
  templates: {
    serviceRequest: 'template_req_123',     // Service Request Template ID
    providerApp: 'template_prov_123',       // Provider Template ID
    supplierApp: 'template_supp_123',       // Supplier Template ID
    contactProvider: 'template_cont_123',   // Contact Template ID
    notifyPremium: 'template_notify_123'    // Notify Template ID
  },
  // ... rest of config
};
```

**Option B: Environment Variables (Backend)**

If you want to keep credentials server-side, add to `.env`:

```
EMAILJS_SERVICE_ID=service_abc123
EMAILJS_PUBLIC_KEY=your_public_key_123
EMAILJS_TEMPLATE_ID_REQUEST=template_req_123
EMAILJS_TEMPLATE_ID_PROVIDER=template_prov_123
EMAILJS_TEMPLATE_ID_SUPPLIER=template_supp_123
EMAILJS_TEMPLATE_ID_CONTACT=template_cont_123
EMAILJS_TEMPLATE_ID_NOTIFY=template_notify_123
```

### 6. Test Your Setup

1. Open the website in your browser
2. Check the console for: `✅ EmailJS initialized successfully`
3. Fill out a form and submit
4. Check your email for the notification
5. Check browser console for any errors

## Email Addresses

Update the recipient emails in `emailjs-config.js`:

```javascript
to_email: 'info@lumitya.com'           // For service requests
to_email: 'applications@lumitya.com'    // For applications
to_email: 'premium@lumitya.com'         // For premium interest
```

Or use your actual business email address.

## Troubleshooting

### Issue: "EmailJS not configured" error
**Solution:** Make sure you've replaced all `YOUR_SERVICE_ID` placeholders with actual values

### Issue: Emails not arriving
**Solutions:**
- Check spam folder
- Verify email service is connected in EmailJS dashboard
- Check EmailJS dashboard logs for errors
- Verify template IDs are correct

### Issue: "Failed to send notification"
**Solutions:**
- Check browser console for detailed error
- Verify Public Key is correct
- Check EmailJS account hasn't exceeded free tier limit (200/month)
- Ensure internet connection is working

### Issue: Template variables not showing
**Solutions:**
- Make sure variable names match exactly (case-sensitive)
- Check template syntax uses `{{variable_name}}`
- Test template in EmailJS dashboard

## Free Tier Limits

EmailJS Free Plan:
- ✅ 200 emails per month
- ✅ 2 email services
- ✅ Unlimited templates
- ✅ Email history (30 days)

For production with high volume, consider upgrading to a paid plan.

## Security Notes

- ✅ Public Key can be safely exposed in frontend code
- ✅ No sensitive credentials are exposed
- ✅ EmailJS handles email authentication
- ⚠️ Consider adding CAPTCHA for production to prevent spam

## Alternative: Backend Email

If you prefer sending emails from the backend (connect for production):

1. Use Nodemailer with the Node.js server
2. Keep all credentials in `.env` server-side
3. Add email sending to `/server/services/email.js`
4. Update API routes to trigger emails

Backend approach is more secure and gives you more control, but requires a mail server or SMTP credentials.
