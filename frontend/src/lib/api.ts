import { useAppStore } from '@/src/store';
import { resolveApiPath } from '@/src/config/apiEndpoints';
import { resolveApiBase } from '@/src/config/runtime';

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const token = useAppStore.getState().token;
  const headers = new Headers(init?.headers);
  const envMeta = ((import.meta as any).env || {}) as Record<string, string | boolean | undefined>;
  const { apiBaseUrl } = resolveApiBase(envMeta);
  const resolvedPath = typeof input === 'string' && input.startsWith('/api') ? resolveApiPath(input, envMeta) : input;
  const resolvedInput = typeof resolvedPath === 'string' && resolvedPath.startsWith('/api') && apiBaseUrl ? `${apiBaseUrl}${resolvedPath}` : resolvedPath;

  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(resolvedInput, {
    ...init,
    headers,
  });

  const contentType = response.headers.get('content-type') || '';
  const rawText = await response.text();
  let data: any = null;

  if (rawText) {
    try {
      data = JSON.parse(rawText);
    } catch {
      console.error('[api] non-JSON response', {
        input,
        resolvedInput,
        method: init?.method || 'GET',
        status: response.status,
        contentType,
        bodyPreview: rawText.slice(0, 300),
      });
      throw new Error(`Server returned non-JSON response (${response.status}) for ${input}. Check backend/proxy logs.`);
    }
  }

  if (!response.ok) {
    console.error('[api] request failed', {
      input,
      resolvedInput,
      method: init?.method || 'GET',
      status: response.status,
      contentType,
      error: data?.error,
      bodyPreview: rawText.slice(0, 300),
    });
    throw new Error(data?.error || `Request failed (${response.status})`);
  }

  return data as T;
}

export const api = {
  get: <T>(input: string) => request<T>(input),
  post: <T>(input: string, body?: unknown, init?: RequestInit) =>
    request<T>(input, {
      ...init,
      method: 'POST',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(input: string, body?: unknown, init?: RequestInit) =>
    request<T>(input, {
      ...init,
      method: 'PUT',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(input: string, body?: unknown, init?: RequestInit) =>
    request<T>(input, {
      ...init,
      method: 'PATCH',
      body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(input: string) =>
    request<T>(input, {
      method: 'DELETE',
    }),
};
