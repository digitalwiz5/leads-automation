import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000'),
  nodeEnv: process.env.NODE_ENV || 'development',

  webhookSecret: process.env.WEBHOOK_SECRET || 'change-this-secret',

  db: {
    connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/leads_db',
  },

  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER || '',
    pass: process.env.EMAIL_PASS || '',
    from: process.env.EMAIL_FROM || '',
  },

  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
  },

  hubspot: {
    apiKey: process.env.HUBSPOT_API_KEY || '',
  },

  admin: {
    email: process.env.ADMIN_EMAIL || '',
    phone: process.env.ADMIN_PHONE || '',
  },
};
