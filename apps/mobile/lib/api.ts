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
  /** Retry once with refreshed access token on 401 (default: true when token is set) */
  retryOnUnauthorized?: boolean;
};

function getApiBaseUrl(): string {
  const baseUrl = process.env.EXPO_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('EXPO_PUBLIC_API_URL is not configured');
  }
  return baseUrl.replace(/\/$/, '');
}

async function parseResponse<T>(response: Response): Promise<T> {
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

export async function apiFetch<T>(path: string, options?: ApiFetchOptions): Promise<T> {
  const { token, headers: initHeaders, retryOnUnauthorized, ...fetchOptions } = options ?? {};
  const url = `${getApiBaseUrl()}${path.startsWith('/') ? path : `/${path}`}`;
  const shouldRetry = retryOnUnauthorized !== false && Boolean(token);

  const execute = async (authToken?: string | null): Promise<Response> => {
    const headers = new Headers(initHeaders);

    if (authToken) {
      headers.set('Authorization', `Bearer ${authToken}`);
    }

    return fetch(url, {
      ...fetchOptions,
      headers,
    });
  };

  let response = await execute(token);

  if (response.status === 401 && shouldRetry && token) {
    const { refreshSession } = await import('./auth-refresh');
    const session = await refreshSession();

    if (session?.accessToken) {
      response = await execute(session.accessToken);
    }
  }

  return parseResponse<T>(response);
}

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health', { retryOnUnauthorized: false });
}
