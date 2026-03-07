import { useAppStore } from '@/src/store';

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const token = useAppStore.getState().token;
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type') && init?.body && !(init.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
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
  delete: <T>(input: string) =>
    request<T>(input, {
      method: 'DELETE',
    }),
};
