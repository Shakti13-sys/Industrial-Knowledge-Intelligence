import type {
  ApiErrorBody,
  DocumentListResponse,
  EntityListResponse,
  HealthResponse,
  QueryResponse,
  UploadResponse,
} from './types';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined) || 'http://localhost:8000';
const TOKEN_KEY = 'ikip_token';
const USER_KEY = 'ikip_user';

export class ApiError extends Error {
  status: number;
  code: string;
  constructor(status: number, body: ApiErrorBody) {
    super(body.detail);
    this.status = status;
    this.code = body.error_code;
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
export function setSession(token: string, username: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, username);
}
export function getSavedUsername(): string | null {
  return localStorage.getItem(USER_KEY);
}
export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set('Authorization', `Bearer ${token}`);
  if (!(options.body instanceof FormData) && options.body) {
    headers.set('Content-Type', 'application/json');
  }

  let response: Response;
  try {
    // Ensured /api prefix is passed in request calls
    response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, {
      detail: 'Could not reach the IKIP API. Is the backend running?',
      error_code: 'NETWORK_ERROR',
    });
  }

  if (response.status === 204) return undefined as T;

  const isJson = response.headers.get('content-type')?.includes('application/json');
  const body = isJson ? await response.json() : null;

  if (!response.ok) {
    if (response.status === 401) clearSession();
    throw new ApiError(response.status, body ?? { detail: response.statusText, error_code: 'UNKNOWN' });
  }

  return body as T;
}

/** Real upload progress via XHR's upload.onprogress -- not simulated. */
function uploadWithProgress(file: File, onProgress?: (pct: number) => void): Promise<UploadResponse> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // FIXED: Added /api prefix to match main.py settings.api_prefix
    xhr.open('POST', `${API_BASE_URL}/api/documents/upload`);
    const token = getToken();
    if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) onProgress(Math.round((e.loaded / e.total) * 100));
    };
    xhr.onload = () => {
      let body: any = null;
      try {
        body = JSON.parse(xhr.responseText);
      } catch {
        /* non-JSON error body */
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100);
        resolve(body as UploadResponse);
      } else {
        if (xhr.status === 401) clearSession();
        reject(new ApiError(xhr.status, body ?? { detail: 'Upload failed', error_code: 'UNKNOWN' }));
      }
    };
    xhr.onerror = () =>
      reject(new ApiError(0, { detail: 'Network error during upload', error_code: 'NETWORK_ERROR' }));

    const form = new FormData();
    form.append('file', file);
    xhr.send(form);
  });
}

export const api = {
  login: (username: string, password: string) =>
    request<{ access_token: string; username: string; expires_in_minutes: number }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  register: (username: string, password: string) =>
    request<{ access_token: string; username: string; expires_in_minutes: number }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  listDocuments: () => request<DocumentListResponse>('/api/documents'),

  uploadDocument: (file: File, onProgress?: (pct: number) => void) => uploadWithProgress(file, onProgress),

  deleteDocument: (id: string) => request<void>(`/api/documents/${id}`, { method: 'DELETE' }),

  reindex: () => request<{ message: string; documents_ingested: number; chunks_loaded: number }>(
    '/api/documents/reindex',
    { method: 'POST' }
  ),

  query: (question: string) =>
    request<QueryResponse>('/api/query', { method: 'POST', body: JSON.stringify({ question }) }),

  listEntities: () => request<EntityListResponse>('/api/entities'),

  health: () => request<HealthResponse>('/api/health'),
};