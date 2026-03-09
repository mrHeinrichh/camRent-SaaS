type EnvMeta = Record<string, string | boolean | undefined>;

export const EXACT_ENDPOINT_ENV: Record<string, string> = {
  '/api/stores': 'VITE_API_ENDPOINT_STORES',
  '/api/announcements': 'VITE_API_ENDPOINT_ANNOUNCEMENTS',
  '/api/donation-settings': 'VITE_API_ENDPOINT_DONATION_SETTINGS',
  '/api/account/orders': 'VITE_API_ENDPOINT_ACCOUNT_ORDERS',
  '/api/account/orders/cancel': 'VITE_API_ENDPOINT_ACCOUNT_ORDERS_CANCEL',
  '/api/dashboard/owner': 'VITE_API_ENDPOINT_DASHBOARD_OWNER',
  '/api/owner/applications': 'VITE_API_ENDPOINT_OWNER_APPLICATIONS',
  '/api/items': 'VITE_API_ENDPOINT_ITEMS',
  '/api/owner/fraud-list': 'VITE_API_ENDPOINT_OWNER_FRAUD_LIST',
  '/api/owner/rental-form': 'VITE_API_ENDPOINT_OWNER_RENTAL_FORM',
  '/api/owner/support-tickets': 'VITE_API_ENDPOINT_OWNER_SUPPORT_TICKETS',
  '/api/owner/vouchers': 'VITE_API_ENDPOINT_OWNER_VOUCHERS',
  '/api/upload': 'VITE_API_ENDPOINT_UPLOAD',
  '/api/upload/public': 'VITE_API_ENDPOINT_UPLOAD_PUBLIC',
  '/api/upload/public/strict-cloudinary': 'VITE_API_ENDPOINT_UPLOAD_PUBLIC_STRICT_CLOUDINARY',
  '/api/owner/store-profile': 'VITE_API_ENDPOINT_OWNER_STORE_PROFILE',
  '/api/manual-blocks': 'VITE_API_ENDPOINT_MANUAL_BLOCKS',
  '/api/owner/customers/report-fraud': 'VITE_API_ENDPOINT_OWNER_CUSTOMERS_REPORT_FRAUD',
  '/api/dashboard/admin': 'VITE_API_ENDPOINT_DASHBOARD_ADMIN',
  '/api/admin/fraud-list': 'VITE_API_ENDPOINT_ADMIN_FRAUD_LIST',
  '/api/admin/fraud-analytics': 'VITE_API_ENDPOINT_ADMIN_FRAUD_ANALYTICS',
  '/api/admin/support-tickets': 'VITE_API_ENDPOINT_ADMIN_SUPPORT_TICKETS',
  '/api/admin/announcements': 'VITE_API_ENDPOINT_ADMIN_ANNOUNCEMENTS',
  '/api/admin/donation-settings': 'VITE_API_ENDPOINT_ADMIN_DONATION_SETTINGS',
  '/api/auth/login': 'VITE_API_ENDPOINT_AUTH_LOGIN',
  '/api/auth/register': 'VITE_API_ENDPOINT_AUTH_REGISTER',
  '/api/auth/profile': 'VITE_API_ENDPOINT_AUTH_PROFILE',
  '/api/orders': 'VITE_API_ENDPOINT_ORDERS',
  '/api/orders/voucher/validate': 'VITE_API_ENDPOINT_ORDERS_VOUCHER_VALIDATE',
  '/api/items/feed': 'VITE_API_ENDPOINT_ITEMS_FEED',
};

export const PREFIX_ENDPOINT_ENV: Array<{ prefix: string; envKey: string }> = [
  { prefix: '/api/stores/', envKey: 'VITE_API_ENDPOINT_STORES_PREFIX' },
  { prefix: '/api/items/', envKey: 'VITE_API_ENDPOINT_ITEMS_PREFIX' },
  { prefix: '/api/orders/', envKey: 'VITE_API_ENDPOINT_ORDERS_PREFIX' },
  { prefix: '/api/account/orders/', envKey: 'VITE_API_ENDPOINT_ACCOUNT_ORDERS_PREFIX' },
  { prefix: '/api/owner/support-tickets/', envKey: 'VITE_API_ENDPOINT_OWNER_SUPPORT_TICKETS_PREFIX' },
  { prefix: '/api/owner/vouchers/', envKey: 'VITE_API_ENDPOINT_OWNER_VOUCHERS_PREFIX' },
  { prefix: '/api/admin/stores/', envKey: 'VITE_API_ENDPOINT_ADMIN_STORES_PREFIX' },
  { prefix: '/api/admin/customers/', envKey: 'VITE_API_ENDPOINT_ADMIN_CUSTOMERS_PREFIX' },
  { prefix: '/api/admin/fraud-list/', envKey: 'VITE_API_ENDPOINT_ADMIN_FRAUD_LIST_PREFIX' },
  { prefix: '/api/admin/support-tickets/', envKey: 'VITE_API_ENDPOINT_ADMIN_SUPPORT_TICKETS_PREFIX' },
  { prefix: '/api/admin/announcements/', envKey: 'VITE_API_ENDPOINT_ADMIN_ANNOUNCEMENTS_PREFIX' },
  { prefix: '/api/upload/public/access', envKey: 'VITE_API_ENDPOINT_UPLOAD_PUBLIC_ACCESS' },
];

export function resolveApiPath(input: string, envMeta: EnvMeta): string {
  const exactEnvKey = EXACT_ENDPOINT_ENV[input];
  if (exactEnvKey) {
    const fromEnv = String(envMeta[exactEnvKey] || '').trim();
    return fromEnv || input;
  }

  for (const { prefix, envKey } of PREFIX_ENDPOINT_ENV) {
    if (!input.startsWith(prefix)) continue;
    const fromEnv = String(envMeta[envKey] || '').trim();
    if (!fromEnv) return input;
    const suffix = input.slice(prefix.length);
    return `${fromEnv}${suffix}`;
  }

  return input;
}
