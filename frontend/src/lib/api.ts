const BASE: string = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api';
const TOKEN_KEY = 'skillbharat.token';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

let onUnauthorized: (() => void) | null = null;
/** The auth context registers a callback so an expired or revoked token signs the user out everywhere. */
export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

export class ApiError extends Error {
  status: number;
  fieldErrors?: Record<string, string>;
  constructor(status: number, message: string, fieldErrors?: Record<string, string>) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

type Params = Record<string, string | number | boolean | null | undefined>;

function withQuery(path: string, params?: Params): string {
  if (!params) return BASE + path;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return BASE + path + (qs ? `?${qs}` : '');
}

function authHeaders(): Record<string, string> {
  const token = tokenStore.get();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(
  method: string,
  path: string,
  options: { body?: unknown; form?: FormData; params?: Params } = {},
): Promise<T> {
  const headers: Record<string, string> = { Accept: 'application/json', ...authHeaders() };
  let body: BodyInit | undefined;
  if (options.form) {
    body = options.form; // the browser sets the multipart boundary
  } else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(options.body);
  }

  let res: Response;
  try {
    res = await fetch(withQuery(path, options.params), { method, headers, body });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Check your connection and try again.');
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = undefined;
  }

  if (!res.ok) {
    const err = (data ?? {}) as { message?: string; fieldErrors?: Record<string, string> };
    if (res.status === 401 && tokenStore.get() && !path.startsWith('/auth/login')) onUnauthorized?.();
    throw new ApiError(res.status, err.message ?? 'Something went wrong. Please try again.', err.fieldErrors);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, params?: Params) => request<T>('GET', path, { params }),
  post: <T>(path: string, body?: unknown) => request<T>('POST', path, { body }),
  put: <T>(path: string, body?: unknown) => request<T>('PUT', path, { body }),
  patch: <T>(path: string, body?: unknown) => request<T>('PATCH', path, { body }),
  del: <T>(path: string) => request<T>('DELETE', path),
  upload: <T>(path: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<T>('POST', path, { form });
  },
};

/** Resumes are protected, so they are fetched with the bearer token and then shown/downloaded from a blob. */
export async function openResume(id: number, filename: string): Promise<void> {
  const isPdf = filename.toLowerCase().endsWith('.pdf');
  // Open the tab synchronously (inside the click) so popup blockers allow it, then point it at the blob.
  const tab = isPdf ? window.open('', '_blank') : null;
  try {
    const res = await fetch(`${BASE}/resumes/${id}/download`, { headers: authHeaders() });
    if (!res.ok) throw new ApiError(res.status, 'This resume is not available.');
    const url = URL.createObjectURL(await res.blob());
    if (tab) {
      tab.location.href = url;
    } else {
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (e) {
    tab?.close();
    throw e instanceof ApiError ? e : new ApiError(0, 'Could not open the resume. Please try again.');
  }
}
