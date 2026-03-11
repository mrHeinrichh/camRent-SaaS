import dotenv from 'dotenv';

dotenv.config();

const rawCloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const normalizedCloudinaryCloudName = rawCloudinaryCloudName ? rawCloudinaryCloudName.toLowerCase() : undefined;
if (rawCloudinaryCloudName && rawCloudinaryCloudName !== normalizedCloudinaryCloudName) {
  console.warn('[env] CLOUDINARY_CLOUD_NAME contains uppercase characters. Using normalized lowercase value.', {
    raw: rawCloudinaryCloudName,
    normalized: normalizedCloudinaryCloudName,
  });
}

export const env = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/camrent',
  cloudinaryCloudName: normalizedCloudinaryCloudName,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  corsOrigins: process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpUser: process.env.SMTP_USER || '',
  smtpPass: process.env.SMTP_PASS || '',
  smtpFrom: process.env.SMTP_FROM || '',
};
