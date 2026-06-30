export interface HealthResponse {
  status: 'ok' | 'degraded';
  timestamp: string;
  database: 'connected' | 'disconnected';
}

export interface ApiErrorBody {
  statusCode: number;
  message: string;
  timestamp?: string;
}

export class ApiError extends Error {
  readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
  }
}

export type ApiFetchOptions = RequestInit & {
  token?: string | null;
};

function getApiBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }
  return baseUrl.replace(/\/$/, '');
}

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { token, headers: initHeaders, ...fetchOptions } = options ?? {};
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const headers = new Headers(initHeaders);

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let statusCode = response.status;
    let message = `API request failed: ${response.status}`;

    try {
      const body = (await response.json()) as Partial<ApiErrorBody>;
      if (typeof body.statusCode === 'number') {
        statusCode = body.statusCode;
      }
      if (typeof body.message === 'string') {
        message = body.message;
      }
    } catch {
      // Non-JSON error body — keep default message
    }

    throw new ApiError(statusCode, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}
