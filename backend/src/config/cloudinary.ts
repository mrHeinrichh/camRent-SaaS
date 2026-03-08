import { v2 as cloudinary } from 'cloudinary';
import { env } from './env';

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

console.log('[cloudinary] configured', {
  cloudName: env.cloudinaryCloudName || null,
  hasApiKey: Boolean(env.cloudinaryApiKey),
  hasApiSecret: Boolean(env.cloudinaryApiSecret),
});

export { cloudinary };
