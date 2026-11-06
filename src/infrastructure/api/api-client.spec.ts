import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api-client';

describe('ApiClient Header Contract & HTTP Methods', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    ApiClient.configureAuth(null);
  });

  it('DELETE does NOT send Content-Type: application/json to avoid Fastify 400 Bad Request', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const result = await ApiClient.delete('/transactions/tx-123', 'token-abc');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [url, options] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(url).toContain('/transactions/tx-123');
    expect(options?.method).toBe('DELETE');
    expect(options?.headers).toEqual({
      Authorization: 'Bearer token-abc',
    });
    expect((options?.headers as any)['Content-Type']).toBeUndefined();
    expect(result).toEqual({ success: true });
  });

  it('GET does NOT send Content-Type: application/json', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify([{ id: '1' }]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );

    const result = await ApiClient.get('/accounts', 'token-abc');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(options?.method).toBe('GET');
    expect((options?.headers as any)['Content-Type']).toBeUndefined();
    expect(result).toEqual([{ id: '1' }]);
  });

  it('POST includes Content-Type: application/json and request body', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ id: 'new-1' }), { status: 201, headers: { 'Content-Type': 'application/json' } }),
    );

    const result = await ApiClient.post('/transactions', { amount: 100 }, 'token-abc');

    expect(globalThis.fetch).toHaveBeenCalledTimes(1);
    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0];
    expect(options?.method).toBe('POST');
    expect(options?.headers).toEqual({
      'Content-Type': 'application/json',
      Authorization: 'Bearer token-abc',
    });
    expect(options?.body).toBe(JSON.stringify({ amount: 100 }));
    expect(result).toEqual({ id: 'new-1' });
  });

  it('throws extracted error message when response is not ok', async () => {
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ message: 'Transacción no encontrada' }), { status: 404 }),
    );

    await expect(ApiClient.delete('/transactions/unknown')).rejects.toThrow('Transacción no encontrada');
  });
});

describe('ApiClient session token', () => {
  const originalFetch = globalThis.fetch;

  const jsonResponse = (body: unknown, status = 200): Response =>
    new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

  const sentHeaders = (): Record<string, string> => {
    const [, options] = vi.mocked(globalThis.fetch).mock.calls[0];
    return (options?.headers ?? {}) as Record<string, string>;
  };

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    ApiClient.configureAuth(null);
  });

  it('sends the provider token when no explicit token is passed', async () => {
    ApiClient.configureAuth({ getToken: () => 'session-token' });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse([]));

    await ApiClient.get('/accounts?userId=u1');

    expect(sentHeaders()).toEqual({ Authorization: 'Bearer session-token' });
  });

  it('sends the provider token on POST, PUT, PATCH and DELETE too', async () => {
    ApiClient.configureAuth({ getToken: () => 'session-token' });
    vi.mocked(globalThis.fetch).mockImplementation(() => Promise.resolve(jsonResponse({})));

    await ApiClient.post('/transactions', { amount: 1 });
    await ApiClient.put('/transactions/t1', { amount: 2 });
    await ApiClient.patch('/loans/l1', { name: 'x' });
    await ApiClient.delete('/transactions/t1');

    const authHeaders = vi
      .mocked(globalThis.fetch)
      .mock.calls.map(([, options]) => (options?.headers as Record<string, string>).Authorization);
    expect(authHeaders).toEqual([
      'Bearer session-token',
      'Bearer session-token',
      'Bearer session-token',
      'Bearer session-token',
    ]);
  });

  it('lets an explicit token win over the provider', async () => {
    ApiClient.configureAuth({ getToken: () => 'session-token' });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({}));

    await ApiClient.get('/auth/me', 'explicit-token');

    expect(sentHeaders()).toEqual({ Authorization: 'Bearer explicit-token' });
  });

  it('sends no Authorization header when there is no token at all', async () => {
    ApiClient.configureAuth({ getToken: () => null });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ accessToken: 't' }));

    await ApiClient.post('/auth/login', { email: 'a@b.c', password: 'p' });

    expect(sentHeaders()).toEqual({ 'Content-Type': 'application/json' });
  });

  it('calls the unauthorized handler once and still throws on a 401 for a request that carried a token', async () => {
    const onUnauthorized = vi.fn();
    ApiClient.configureAuth({ getToken: () => 'expired-token', onUnauthorized });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ message: 'Unauthorized' }, 401));

    await expect(ApiClient.get('/accounts')).rejects.toThrow('Unauthorized');

    expect(onUnauthorized).toHaveBeenCalledTimes(1);
  });

  it('does not call the unauthorized handler when a request without a token gets a 401 (wrong password)', async () => {
    const onUnauthorized = vi.fn();
    ApiClient.configureAuth({ getToken: () => null, onUnauthorized });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ message: 'Credenciales inválidas' }, 401));

    await expect(ApiClient.post('/auth/login', { email: 'a@b.c', password: 'bad' })).rejects.toThrow(
      'Credenciales inválidas',
    );

    expect(onUnauthorized).not.toHaveBeenCalled();
  });

  it('does not call the unauthorized handler on other errors', async () => {
    const onUnauthorized = vi.fn();
    ApiClient.configureAuth({ getToken: () => 'session-token', onUnauthorized });
    vi.mocked(globalThis.fetch).mockResolvedValueOnce(jsonResponse({ message: 'Prohibido' }, 403));

    await expect(ApiClient.get('/tax/profile/other')).rejects.toThrow('Prohibido');

    expect(onUnauthorized).not.toHaveBeenCalled();
  });
});
