import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

// Validate required environment variables
const requiredEnvVars = [
  'PORT',
  'DB_HOST',
  'DB_PORT',
  'DB_NAME',
  'DB_USER',
  'DB_PASSWORD',
  'JWT_SECRET',
  'TWILIO_ACCOUNT_SID',
  'TWILIO_AUTH_TOKEN',
  'TWILIO_PHONE_NUMBER',
];

// Check if all required environment variables are defined
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error(`Environment variable ${envVar} is required but not defined`);
    } else {
      console.warn(`Warning: Environment variable ${envVar} is not defined`);
    }
  }
}

export default {
  // Server
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
  
  // Database
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'secondbrain',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'password',
  },
  
  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_key_for_development_only',
    expiresIn: process.env.JWT_EXPIRATION || '24h',
  },
  
  // Twilio
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID || '',
    authToken: process.env.TWILIO_AUTH_TOKEN || '',
    verifyServiceSid: process.env.TWILIO_VERIFY_SERVICE_SID || '',
    phoneNumber: process.env.TWILIO_PHONE_NUMBER || '',
    apiKey: process.env.TWILIO_API_KEY || '',
    apiSecret: process.env.TWILIO_API_SECRET || '',
    ttsVoice: process.env.TWILIO_TTS_VOICE || 'Polly.Joanna-Neural',
  },
  
  // OpenAI
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    assistantModel: process.env.OPENAI_ASSISTANT_MODEL || 'gpt-4',
  },
}; 