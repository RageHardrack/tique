import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ApiClient } from './api-client';

describe('ApiClient Header Contract & HTTP Methods', () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
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
