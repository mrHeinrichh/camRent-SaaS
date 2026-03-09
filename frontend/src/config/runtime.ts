type EnvMeta = Record<string, string | boolean | undefined>;

export type ApiTarget = 'local' | 'live';

function normalizeTarget(value: string): ApiTarget {
  return value === 'live' ? 'live' : 'local';
}

export function resolveApiBase(envMeta: EnvMeta): { apiTarget: ApiTarget; apiBaseUrl: string } {
  const target = normalizeTarget(String(envMeta.VITE_API_TARGET || 'local').trim().toLowerCase());
  const localBase = String(envMeta.VITE_API_URL_LOCAL || envMeta.VITE_API_URL || 'http://127.0.0.1:3000').trim();
  const liveBase = String(envMeta.VITE_API_URL_LIVE || '').trim();
  const apiBaseUrl = target === 'live' ? liveBase : localBase;
  return { apiTarget: target, apiBaseUrl };
}
