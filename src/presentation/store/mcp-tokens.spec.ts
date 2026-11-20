import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './auth';
import { useMcpTokensStore } from './mcp-tokens';
import { ApiClient } from '../../infrastructure/api/api-client';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  resolveApiBaseUrl: vi.fn(() => 'https://api.dragon-azul.dev/api/v1'),
}));

const activeToken = {
  id: 'mt-1',
  name: 'Hermes laptop',
  createdAt: '2026-11-01T10:00:00.000Z',
  lastUsedAt: null,
  revokedAt: null,
};

const revokedToken = {
  id: 'mt-2',
  name: 'Prueba antigua',
  createdAt: '2026-10-01T10:00:00.000Z',
  lastUsedAt: '2026-10-05T10:00:00.000Z',
  revokedAt: '2026-10-06T10:00:00.000Z',
};

describe('useMcpTokensStore (S10-S12)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();

    const auth = useAuthStore();
    auth.accessToken = 'jwt-1';
    auth.user = {
      id: 'u-1',
      email: 'admin@lascar.dev',
      name: 'Admin',
      role: 'ADMIN',
      createdAt: '',
    };
  });

  it('lists the tokens of the user without a plaintext value (S12)', async () => {
    vi.mocked(ApiClient.get).mockResolvedValueOnce([activeToken, revokedToken]);

    const store = useMcpTokensStore();
    await store.fetchTokens();

    expect(ApiClient.get).toHaveBeenCalledWith('/mcp/tokens', 'jwt-1');
    expect(store.tokens).toHaveLength(2);
    expect(store.tokens[0].isRevoked).toBe(false);
    expect(store.tokens[1].isRevoked).toBe(true);
    expect(store.error).toBeNull();
    expect(JSON.stringify(store.tokens)).not.toContain('gmcp_');
  });

  it('keeps the plaintext token in state only until the panel is closed (S11)', async () => {
    vi.mocked(ApiClient.post).mockResolvedValueOnce({
      id: 'mt-1',
      name: 'Hermes laptop',
      createdAt: '2026-11-01T10:00:00.000Z',
      token: 'gmcp_secret_value',
    });
    vi.mocked(ApiClient.get).mockResolvedValueOnce([activeToken]);

    const store = useMcpTokensStore();
    const issued = await store.createToken('Hermes laptop');

    expect(issued?.token).toBe('gmcp_secret_value');
    expect(store.issuedToken?.token).toBe('gmcp_secret_value');
    // The list is refreshed so the new token shows up without its value.
    expect(ApiClient.get).toHaveBeenCalledTimes(1);

    store.clearIssuedToken();

    expect(store.issuedToken).toBeNull();
    expect(JSON.stringify(store.$state)).not.toContain('gmcp_secret_value');
  });

  it('refreshes the list after a successful revoke (S12)', async () => {
    const store = useMcpTokensStore();
    store.tokens = [
      {
        id: 'mt-1',
        name: 'Hermes laptop',
        createdAt: '2026-11-01T10:00:00.000Z',
        lastUsedAt: null,
        isRevoked: false,
      },
    ];

    vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });
    vi.mocked(ApiClient.get).mockResolvedValueOnce([
      { ...activeToken, revokedAt: '2026-11-20T12:00:00.000Z' },
    ]);

    const ok = await store.revokeToken('mt-1');

    expect(ok).toBe(true);
    expect(ApiClient.delete).toHaveBeenCalledWith('/mcp/tokens/mt-1', 'jwt-1');
    expect(ApiClient.get).toHaveBeenCalledWith('/mcp/tokens', 'jwt-1');
    expect(store.tokens[0].isRevoked).toBe(true);
    expect(store.error).toBeNull();
  });

  it('leaves the list untouched and reports the error when the revoke fails (S12)', async () => {
    const store = useMcpTokensStore();
    store.tokens = [
      {
        id: 'mt-1',
        name: 'Hermes laptop',
        createdAt: '2026-11-01T10:00:00.000Z',
        lastUsedAt: null,
        isRevoked: false,
      },
    ];

    vi.mocked(ApiClient.delete).mockRejectedValueOnce(
      new Error('No se pudo revocar el token'),
    );

    const ok = await store.revokeToken('mt-1');

    expect(ok).toBe(false);
    expect(store.error).toBe('No se pudo revocar el token');
    expect(store.tokens[0].isRevoked).toBe(false);
    expect(ApiClient.get).not.toHaveBeenCalled();
  });

  it('reports the API error when the list cannot be loaded (S12)', async () => {
    vi.mocked(ApiClient.get).mockRejectedValueOnce(
      new Error('Error en la solicitud (Código 401)'),
    );

    const store = useMcpTokensStore();
    await store.fetchTokens();

    expect(store.tokens).toEqual([]);
    expect(store.error).toBe('Error en la solicitud (Código 401)');
  });

  it('does not keep a plaintext token when the create fails (S11)', async () => {
    vi.mocked(ApiClient.post).mockRejectedValueOnce(
      new Error('El nombre es obligatorio'),
    );

    const store = useMcpTokensStore();
    const issued = await store.createToken('Hermes laptop');

    expect(issued).toBeNull();
    expect(store.issuedToken).toBeNull();
    expect(store.error).toBe('El nombre es obligatorio');
    expect(ApiClient.get).not.toHaveBeenCalled();
  });
});
