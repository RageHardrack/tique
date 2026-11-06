const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://guilliman.localhost:1355/api/v1';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Session hooks registered by the app at bootstrap, so this client never
 * depends on the presentation layer (Pinia, router).
 */
export interface ApiAuthOptions {
  /** Returns the current session token, or null when signed out. */
  getToken?: () => string | null;
  /** Called when a request that carried a token is rejected with 401. */
  onUnauthorized?: () => void;
}

export class ApiClient {
  private static readonly baseUrl = BASE_URL.endsWith('/')
    ? BASE_URL.slice(0, -1)
    : BASE_URL;

  private static auth: ApiAuthOptions = {};

  static configureAuth(options: ApiAuthOptions | null): void {
    this.auth = options ?? {};
  }

  private static getHeaders(
    token: string | null,
    includeContentType: boolean,
  ): Record<string, string> {
    const headers: Record<string, string> = {};
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private static async handleResponse<T>(
    response: Response,
    sentToken: boolean,
  ): Promise<T> {
    if (!response.ok) {
      // Only a rejected token means the session expired. A 401 on a request
      // without a token (a wrong password on login) is a normal error.
      if (response.status === 401 && sentToken) {
        this.auth.onUnauthorized?.();
      }

      let errorMessage = `Error en la solicitud (Código ${response.status})`;
      try {
        const errorData = await response.json();
        if (errorData && typeof errorData === 'object') {
          errorMessage =
            (errorData as { message?: string | string[] }).message &&
            Array.isArray((errorData as { message: string[] }).message)
              ? (errorData as { message: string[] }).message.join(', ')
              : (errorData as { message?: string }).message || errorMessage;
        }
      } catch {
        // Fallback to default message
      }
      throw new Error(errorMessage);
    }

    return response.json() as Promise<T>;
  }

  private static async request<T>(
    method: HttpMethod,
    endpoint: string,
    token: string | null | undefined,
    data?: unknown,
  ): Promise<T> {
    const formattedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;
    // An explicit token wins; otherwise use the current session token.
    const resolvedToken = token ?? this.auth.getToken?.() ?? null;
    const hasBody = method !== 'GET' && method !== 'DELETE';

    const response = await fetch(`${this.baseUrl}${formattedEndpoint}`, {
      method,
      headers: this.getHeaders(resolvedToken, hasBody),
      ...(hasBody ? { body: JSON.stringify(data) } : {}),
    });

    return this.handleResponse<T>(response, resolvedToken !== null);
  }

  static get<T>(endpoint: string, token?: string | null): Promise<T> {
    return this.request<T>('GET', endpoint, token);
  }

  static post<T>(
    endpoint: string,
    data: unknown,
    token?: string | null,
  ): Promise<T> {
    return this.request<T>('POST', endpoint, token, data);
  }

  static put<T>(
    endpoint: string,
    data: unknown,
    token?: string | null,
  ): Promise<T> {
    return this.request<T>('PUT', endpoint, token, data);
  }

  static patch<T>(
    endpoint: string,
    data: unknown,
    token?: string | null,
  ): Promise<T> {
    return this.request<T>('PATCH', endpoint, token, data);
  }

  static delete<T>(endpoint: string, token?: string | null): Promise<T> {
    return this.request<T>('DELETE', endpoint, token);
  }
}
