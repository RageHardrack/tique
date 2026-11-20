import { toMcpTokenView } from '../entities/McpToken';
import {
  ApiClient,
  resolveApiBaseUrl,
} from '../../infrastructure/api/api-client';
import type {
  McpIssuedToken,
  McpTokenRecord,
  McpTokenView,
} from '../entities/McpToken';

/** Same limit the Guilliman `McpToken` entity enforces (S11). */
export const MCP_TOKEN_NAME_MAX_LENGTH = 60;

export class McpTokenService {
  /**
   * Creates a token for the session user (S11). The response carries the
   * plaintext once; nothing here persists it.
   */
  static async create(token: string, name: string): Promise<McpIssuedToken> {
    return ApiClient.post<McpIssuedToken>(
      '/mcp/tokens',
      { name: name.trim() },
      token,
    );
  }

  /** The session user's own tokens, without any secret material (S12). */
  static async list(token: string): Promise<McpTokenView[]> {
    const records = await ApiClient.get<McpTokenRecord[]>('/mcp/tokens', token);
    return records.map(toMcpTokenView);
  }

  /** Revokes one of the session user's tokens (S12). */
  static async revoke(token: string, id: string): Promise<boolean> {
    await ApiClient.delete<{ success: boolean }>(`/mcp/tokens/${id}`, token);
    return true;
  }
}

/**
 * Client-side mirror of the API rule, so a bad name never reaches Guilliman
 * (S11). Returns the Spanish message to show, or null when the name is valid.
 */
export function validateMcpTokenName(name: string): string | null {
  const trimmed = name.trim();
  if (trimmed === '') {
    return 'El nombre del token es obligatorio.';
  }
  if (trimmed.length > MCP_TOKEN_NAME_MAX_LENGTH) {
    return `El nombre del token no puede superar los ${MCP_TOKEN_NAME_MAX_LENGTH} caracteres.`;
  }
  return null;
}

/** The Streamable HTTP endpoint of Guilliman, derived from the API base (S11). */
export function mcpEndpointUrl(apiBaseUrl?: string): string {
  const base = apiBaseUrl ?? resolveApiBaseUrl();
  return `${base.endsWith('/') ? base.slice(0, -1) : base}/mcp`;
}

/**
 * The `mcp_servers` entry ready to paste into `~/.hermes/config.yaml` (S11).
 * The token is referenced by environment variable, never inlined.
 */
export function hermesConfigYaml(endpointUrl: string): string {
  return [
    'mcp_servers:',
    '  guilliman:',
    `    url: ${endpointUrl}`,
    '    headers:',
    '      Authorization: "Bearer ${GUILLIMAN_MCP_TOKEN}"',
  ].join('\n');
}

/** The line to paste into `~/.hermes/.env` with the plaintext token (S11). */
export function hermesEnvLine(plaintext: string): string {
  return `GUILLIMAN_MCP_TOKEN=${plaintext}`;
}
