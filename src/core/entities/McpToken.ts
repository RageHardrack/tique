/**
 * An MCP access token as returned by the Guilliman management endpoints
 * (S3, S12): never the plaintext and never the hash.
 */
export interface McpTokenRecord {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

/**
 * The create response (S11). The plaintext exists only here, in the moment
 * the panel shows it, and is dropped as soon as that panel is closed.
 */
export interface McpIssuedToken {
  id: string;
  name: string;
  createdAt: string;
  token: string;
}

/** The list row the view renders: the record plus its derived status. */
export interface McpTokenView {
  id: string;
  name: string;
  createdAt: string;
  lastUsedAt: string | null;
  isRevoked: boolean;
}

/**
 * The one derived status of a token: a non-null `revokedAt` is revoked. The
 * API never sends a status field, so this is the only place that decides it.
 */
export function toMcpTokenView(record: McpTokenRecord): McpTokenView {
  return {
    id: record.id,
    name: record.name,
    createdAt: record.createdAt,
    lastUsedAt: record.lastUsedAt,
    isRevoked: record.revokedAt !== null && record.revokedAt !== undefined,
  };
}
