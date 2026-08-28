const BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? 'http://guilliman.localhost:1355/api/v1';

export class ApiClient {
  private static readonly baseUrl = BASE_URL.endsWith('/')
    ? BASE_URL.slice(0, -1)
    : BASE_URL;

  private static getHeaders(token?: string | null): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private static async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
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

  static async get<T>(endpoint: string, token?: string | null): Promise<T> {
    const formattedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const response = await fetch(`${this.baseUrl}${formattedEndpoint}`, {
      method: 'GET',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<T>(response);
  }

  static async post<T>(
    endpoint: string,
    data: unknown,
    token?: string | null,
  ): Promise<T> {
    const formattedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const response = await fetch(`${this.baseUrl}${formattedEndpoint}`, {
      method: 'POST',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  static async put<T>(
    endpoint: string,
    data: unknown,
    token?: string | null,
  ): Promise<T> {
    const formattedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const response = await fetch(`${this.baseUrl}${formattedEndpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  static async patch<T>(
    endpoint: string,
    data: unknown,
    token?: string | null,
  ): Promise<T> {
    const formattedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const response = await fetch(`${this.baseUrl}${formattedEndpoint}`, {
      method: 'PATCH',
      headers: this.getHeaders(token),
      body: JSON.stringify(data),
    });

    return this.handleResponse<T>(response);
  }

  static async delete<T>(endpoint: string, token?: string | null): Promise<T> {
    const formattedEndpoint = endpoint.startsWith('/')
      ? endpoint
      : `/${endpoint}`;

    const response = await fetch(`${this.baseUrl}${formattedEndpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(token),
    });

    return this.handleResponse<T>(response);
  }
}
