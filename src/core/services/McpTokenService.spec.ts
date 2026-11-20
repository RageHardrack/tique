import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ApiClient } from '../../infrastructure/api/api-client';
import {
  MCP_TOKEN_NAME_MAX_LENGTH,
  McpTokenService,
  hermesConfigYaml,
  hermesEnvLine,
  mcpEndpointUrl,
  validateMcpTokenName,
} from './McpTokenService';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  resolveApiBaseUrl: vi.fn(() => 'https://api.dragon-azul.dev/api/v1'),
}));

describe('McpTokenService (API layer for /integraciones)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('POSTs the trimmed name to /mcp/tokens with the session JWT (S11)', async () => {
    const issued = {
      id: 'mt-1',
      name: 'Hermes laptop',
      createdAt: '2026-11-20T18:00:00.000Z',
      token: 'gmcp_abcdefghijklmnopqrstuvwxyz0123456789AB',
    };
    vi.mocked(ApiClient.post).mockResolvedValueOnce(issued);

    const result = await McpTokenService.create('jwt-1', '  Hermes laptop  ');

    expect(ApiClient.post).toHaveBeenCalledWith(
      '/mcp/tokens',
      { name: 'Hermes laptop' },
      'jwt-1',
    );
    expect(result.token).toBe(issued.token);
  });

  it('GETs the token list and maps it to the view rows, with no secret (S12)', async () => {
    const listed = [
      {
        id: 'mt-1',
        name: 'Hermes laptop',
        createdAt: '2026-11-20T18:00:00.000Z',
        lastUsedAt: null,
        revokedAt: null,
      },
      {
        id: 'mt-2',
        name: 'Prueba antigua',
        createdAt: '2026-10-20T18:00:00.000Z',
        lastUsedAt: '2026-10-21T18:00:00.000Z',
        revokedAt: '2026-10-22T18:00:00.000Z',
      },
    ];
    vi.mocked(ApiClient.get).mockResolvedValueOnce(listed);

    const result = await McpTokenService.list('jwt-1');

    expect(ApiClient.get).toHaveBeenCalledWith('/mcp/tokens', 'jwt-1');
    expect(result).toEqual([
      {
        id: 'mt-1',
        name: 'Hermes laptop',
        createdAt: '2026-11-20T18:00:00.000Z',
        lastUsedAt: null,
        isRevoked: false,
      },
      {
        id: 'mt-2',
        name: 'Prueba antigua',
        createdAt: '2026-10-20T18:00:00.000Z',
        lastUsedAt: '2026-10-21T18:00:00.000Z',
        isRevoked: true,
      },
    ]);
    expect(JSON.stringify(result)).not.toContain('tokenHash');
    expect(JSON.stringify(result)).not.toContain('token');
  });

  it('DELETEs one token by id (S12)', async () => {
    vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

    const result = await McpTokenService.revoke('jwt-1', 'mt-9');

    expect(ApiClient.delete).toHaveBeenCalledWith('/mcp/tokens/mt-9', 'jwt-1');
    expect(result).toBe(true);
  });

  it('requires a non-empty trimmed name (S11)', () => {
    expect(validateMcpTokenName('')).toBe(
      'El nombre del token es obligatorio.',
    );
    expect(validateMcpTokenName('   ')).toBe(
      'El nombre del token es obligatorio.',
    );
  });

  it('rejects names longer than 60 characters after trimming (S11)', () => {
    const tooLong = `${'a'.repeat(MCP_TOKEN_NAME_MAX_LENGTH)} b`;
    expect(validateMcpTokenName(tooLong)).toBe(
      `El nombre del token no puede superar los ${MCP_TOKEN_NAME_MAX_LENGTH} caracteres.`,
    );
    expect(
      validateMcpTokenName(`${'a'.repeat(MCP_TOKEN_NAME_MAX_LENGTH)}   `),
    ).toBeNull();
  });

  it('derives the MCP endpoint from the configured API base (S11)', () => {
    expect(mcpEndpointUrl('https://api.dragon-azul.dev/api/v1/')).toBe(
      'https://api.dragon-azul.dev/api/v1/mcp',
    );
    expect(mcpEndpointUrl()).toBe('https://api.dragon-azul.dev/api/v1/mcp');
  });

  it('builds the Hermes mcp_servers block with the derived url (S11)', () => {
    const yaml = hermesConfigYaml('https://api.dragon-azul.dev/api/v1/mcp');

    expect(yaml).toBe(
      [
        'mcp_servers:',
        '  guilliman:',
        '    url: https://api.dragon-azul.dev/api/v1/mcp',
        '    headers:',
        '      Authorization: "Bearer ${GUILLIMAN_MCP_TOKEN}"',
      ].join('\n'),
    );
  });

  it('builds the .env line with the plaintext token (S11)', () => {
    expect(hermesEnvLine('gmcp_abc')).toBe('GUILLIMAN_MCP_TOKEN=gmcp_abc');
  });
});
