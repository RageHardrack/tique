import { ref } from 'vue';

import { defineStore } from 'pinia';

import { useAuthStore } from './auth';
import type {
  McpIssuedToken,
  McpTokenView,
} from '../../core/entities/McpToken';
import {
  McpTokenService,
  mcpEndpointUrl,
  validateMcpTokenName,
} from '../../core/services/McpTokenService';

/**
 * MCP tokens of the session user (S10-S12). The plaintext of a new token
 * lives only in `issuedToken`, and only until the panel that shows it is
 * closed: there is no way to read it back from here afterwards.
 */
export const useMcpTokensStore = defineStore('mcp-tokens', () => {
  const tokens = ref<McpTokenView[]>([]);
  const issuedToken = ref<McpIssuedToken | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  function accessToken(): string | null {
    return useAuthStore().accessToken;
  }

  async function fetchTokens(): Promise<void> {
    const session = accessToken();
    if (!session) return;

    isLoading.value = true;
    error.value = null;
    try {
      tokens.value = await McpTokenService.list(session);
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al cargar los tokens.';
    } finally {
      isLoading.value = false;
    }
  }

  /**
   * Creates a token. Invalid names never reach the API; an API rejection is
   * reported and leaves no plaintext behind.
   */
  async function createToken(name: string): Promise<McpIssuedToken | null> {
    const session = accessToken();
    if (!session) return null;

    const invalid = validateMcpTokenName(name);
    if (invalid) {
      error.value = invalid;
      return null;
    }

    isLoading.value = true;
    error.value = null;
    try {
      const issued = await McpTokenService.create(session, name);
      issuedToken.value = issued;
      await fetchTokens();
      return issued;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al crear el token.';
      return null;
    } finally {
      isLoading.value = false;
    }
  }

  /** Drops the plaintext for good once the panel is closed (S11). */
  function clearIssuedToken(): void {
    issuedToken.value = null;
  }

  /**
   * Revokes a token and reloads the list on success. A failure keeps the
   * list exactly as the API last reported it (S12).
   */
  async function revokeToken(id: string): Promise<boolean> {
    const session = accessToken();
    if (!session) return false;

    isLoading.value = true;
    error.value = null;
    try {
      await McpTokenService.revoke(session, id);
      await fetchTokens();
      return true;
    } catch (err: unknown) {
      error.value = (err as Error).message || 'Error al revocar el token.';
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  return {
    tokens,
    issuedToken,
    isLoading,
    error,
    endpointUrl: mcpEndpointUrl(),
    fetchTokens,
    createToken,
    clearIssuedToken,
    revokeToken,
  };
});
