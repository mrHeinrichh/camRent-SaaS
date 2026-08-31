import dotenv from 'dotenv';

dotenv.config();

function normalizeEnvValue(value?: string) {
  const trimmed = value?.trim() || '';
  const hasMatchingQuotes =
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"));
  return hasMatchingQuotes ? trimmed.slice(1, -1).trim() : trimmed;
}

function normalizeCompactSecret(value?: string) {
  return normalizeEnvValue(value).replace(/\s/g, '');
}

const rawCloudinaryCloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
const normalizedCloudinaryCloudName = rawCloudinaryCloudName ? rawCloudinaryCloudName.toLowerCase() : undefined;
if (rawCloudinaryCloudName && rawCloudinaryCloudName !== normalizedCloudinaryCloudName) {
  console.warn('[env] CLOUDINARY_CLOUD_NAME contains uppercase characters. Using normalized lowercase value.', {
    raw: rawCloudinaryCloudName,
    normalized: normalizedCloudinaryCloudName,
  });
}

export const env = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'super-secret-key',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/camrent',
  cloudinaryCloudName: normalizedCloudinaryCloudName,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,
  corsOrigins: process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '',
  googleClientId: process.env.GOOGLE_CLIENT_ID || '',
  // All OAuth client ids whose ID tokens we accept. The web client id is the
  // audience for web + Android (serverClientId) tokens; iOS tokens carry the
  // iOS client id. Set GOOGLE_CLIENT_IDS as a comma-separated list to add
  // platform clients; GOOGLE_CLIENT_ID is always included.
  googleClientIds: [
    ...new Set(
      [process.env.GOOGLE_CLIENT_ID || '', ...(process.env.GOOGLE_CLIENT_IDS || '').split(',')]
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ],
  gmailClientId: normalizeEnvValue(process.env.GMAIL_CLIENT_ID) || normalizeEnvValue(process.env.GOOGLE_CLIENT_ID),
  gmailClientSecret:
    normalizeEnvValue(process.env.GMAIL_CLIENT_SECRET) || normalizeEnvValue(process.env.GOOGLE_CLIENT_SECRET),
  gmailRefreshToken:
    normalizeEnvValue(process.env.GMAIL_REFRESH_TOKEN) || normalizeEnvValue(process.env.GOOGLE_REFRESH_TOKEN),
  gmailUser:
    normalizeEnvValue(process.env.GMAIL_USER) ||
    normalizeEnvValue(process.env.GOOGLE_EMAIL) ||
    normalizeEnvValue(process.env.SMTP_USER),
  gmailFrom: normalizeEnvValue(process.env.GMAIL_FROM),
  adminNotificationEmail: process.env.ADMIN_NOTIFICATION_EMAIL?.trim() || 'mrheinrichhh@gmail.com',
  smtpHost: normalizeEnvValue(process.env.SMTP_HOST) || 'smtp.gmail.com',
  smtpPort: Number(process.env.SMTP_PORT || 465),
  smtpUser: normalizeEnvValue(process.env.SMTP_USER),
  smtpPass: normalizeCompactSecret(process.env.SMTP_PASS),
  smtpFrom: normalizeEnvValue(process.env.SMTP_FROM),
};
