import { createPinia, setActivePinia } from 'pinia';

import type { VueWrapper } from '@vue/test-utils';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../store/auth';
import IntegrationsView from './IntegrationsView.vue';
import { useConfirm } from '../composables/useConfirm';
import { useMcpTokensStore } from '../store/mcp-tokens';
import { ApiClient } from '../../infrastructure/api/api-client';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
  resolveApiBaseUrl: vi.fn(() => 'https://api.dragon-azul.dev/api/v1'),
}));

const layoutStub = { template: '<div><slot /></div>' };

const uiStubs = {
  AppLayout: layoutStub,
  UIcon: true,
  UCard: { template: '<div><slot /></div>' },
  UButton: {
    props: ['label', 'loading', 'disabled', 'color', 'variant', 'size', 'icon'],
    emits: ['click'],
    template:
      '<button type="button" :disabled="disabled" @click="$emit(\'click\', $event)"><slot /></button>',
  },
  UInput: {
    props: ['modelValue'],
    emits: ['update:modelValue'],
    template:
      '<input :value="modelValue" @input="$emit(\'update:modelValue\', $event.target.value)" />',
  },
};

let pinia: ReturnType<typeof createPinia>;

function activeRow() {
  return {
    id: 'mt-1',
    name: 'Hermes laptop',
    createdAt: '2026-11-01T10:00:00.000Z',
    lastUsedAt: null,
    revokedAt: null,
    isRevoked: false,
  };
}

function revokedRow() {
  return {
    id: 'mt-2',
    name: 'Prueba antigua',
    createdAt: '2026-10-01T10:00:00.000Z',
    lastUsedAt: '2026-10-05T10:00:00.000Z',
    revokedAt: '2026-10-06T10:00:00.000Z',
    isRevoked: true,
  };
}

function mountView(): VueWrapper {
  return mount(IntegrationsView, {
    global: { plugins: [pinia], stubs: uiStubs },
  });
}

describe('IntegrationsView.vue (S10-S12)', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    pinia = createPinia();
    setActivePinia(pinia);
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

    vi.mocked(ApiClient.get).mockResolvedValue([] as never);
  });

  it('loads the tokens of the user on mount (S12)', async () => {
    vi.mocked(ApiClient.get).mockResolvedValueOnce([activeRow()] as never);

    const wrapper = mountView();
    await flushPromises();

    expect(ApiClient.get).toHaveBeenCalledWith('/mcp/tokens', 'jwt-1');
    expect(wrapper.text()).toContain('Hermes laptop');
    expect(wrapper.findAll('[data-testid="mcp-token-row"]')).toHaveLength(1);
  });

  it('renders Nunca for an unused token, the status, and no secret in the list (S12)', async () => {
    vi.mocked(ApiClient.get).mockResolvedValueOnce([
      activeRow(),
      revokedRow(),
    ] as never);

    const wrapper = mountView();
    await flushPromises();

    const rows = wrapper.findAll('[data-testid="mcp-token-row"]');
    expect(rows).toHaveLength(2);
    expect(rows[0].text()).toContain('Nunca');
    expect(rows[0].text()).toContain('Activo');
    expect(rows[1].text()).toContain('Revocado');
    expect(rows[1].find('[data-testid="revoke-token-btn"]').exists()).toBe(
      false,
    );
    expect(wrapper.text()).not.toContain('gmcp_');
  });

  it('validates the name client-side before calling the API (S11)', async () => {
    const wrapper = mountView();
    await flushPromises();

    await wrapper.find('[data-testid="token-name-input"]').setValue('   ');
    await wrapper.find('[data-testid="create-token-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="token-name-error"]').text()).toBe(
      'El nombre del token es obligatorio.',
    );
    expect(ApiClient.post).not.toHaveBeenCalled();

    await wrapper
      .find('[data-testid="token-name-input"]')
      .setValue('a'.repeat(61));
    await wrapper.find('[data-testid="create-token-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="token-name-error"]').text()).toBe(
      'El nombre del token no puede superar los 60 caracteres.',
    );
    expect(ApiClient.post).not.toHaveBeenCalled();
  });

  it('creates a token and shows it once with the Hermes block ready to paste (S11)', async () => {
    vi.mocked(ApiClient.post).mockResolvedValueOnce({
      id: 'mt-1',
      name: 'Hermes laptop',
      createdAt: '2026-11-20T10:00:00.000Z',
      token: 'gmcp_secret_value',
    } as never);

    const wrapper = mountView();
    await flushPromises();

    await wrapper
      .find('[data-testid="token-name-input"]')
      .setValue('Hermes laptop');
    await wrapper.find('[data-testid="create-token-btn"]').trigger('click');
    await flushPromises();

    expect(ApiClient.post).toHaveBeenCalledWith(
      '/mcp/tokens',
      { name: 'Hermes laptop' },
      'jwt-1',
    );

    const panel = wrapper.find('[data-testid="issued-token-panel"]');
    expect(panel.exists()).toBe(true);
    expect(panel.text()).toContain('gmcp_secret_value');
    expect(panel.text()).toContain('solo se muestra una vez');
    expect(panel.text()).toContain(
      'url: https://api.dragon-azul.dev/api/v1/mcp',
    );
    expect(panel.text()).toContain(
      'Authorization: "Bearer ${GUILLIMAN_MCP_TOKEN}"',
    );
    expect(panel.text()).toContain('GUILLIMAN_MCP_TOKEN=gmcp_secret_value');
    expect(wrapper.findAll('[data-testid="copy-btn"]')).toHaveLength(3);
  });

  it('drops the plaintext from the view when the panel is closed (S11)', async () => {
    vi.mocked(ApiClient.post).mockResolvedValueOnce({
      id: 'mt-1',
      name: 'Hermes laptop',
      createdAt: '2026-11-20T10:00:00.000Z',
      token: 'gmcp_secret_value',
    } as never);

    const wrapper = mountView();
    await flushPromises();

    await wrapper
      .find('[data-testid="token-name-input"]')
      .setValue('Hermes laptop');
    await wrapper.find('[data-testid="create-token-btn"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="issued-token-panel"]').exists()).toBe(
      true,
    );

    await wrapper.find('[data-testid="close-issued-panel"]').trigger('click');
    await flushPromises();

    expect(wrapper.find('[data-testid="issued-token-panel"]').exists()).toBe(
      false,
    );
    expect(wrapper.text()).not.toContain('gmcp_secret_value');
    expect(wrapper.find('[data-testid="reopen-issued-panel"]').exists()).toBe(
      false,
    );
  });

  it('asks for confirmation before revoking and refreshes the list (S12)', async () => {
    vi.mocked(ApiClient.get)
      .mockResolvedValueOnce([activeRow()] as never)
      .mockResolvedValueOnce([
        {
          ...activeRow(),
          revokedAt: '2026-11-20T12:00:00.000Z',
          isRevoked: true,
        },
      ] as never);
    vi.mocked(ApiClient.delete).mockResolvedValueOnce({
      success: true,
    } as never);

    const wrapper = mountView();
    await flushPromises();

    await wrapper.find('[data-testid="revoke-token-btn"]').trigger('click');
    await flushPromises();

    const { state } = useConfirm();
    expect(state.isOpen).toBe(true);
    expect(state.title).toBe('Revocar token');
    expect(ApiClient.delete).not.toHaveBeenCalled();

    state.onConfirm();
    await flushPromises();

    expect(ApiClient.delete).toHaveBeenCalledWith('/mcp/tokens/mt-1', 'jwt-1');
    expect(ApiClient.get).toHaveBeenCalledTimes(2);
    expect(
      wrapper.findAll('[data-testid="mcp-token-row"]')[0].text(),
    ).toContain('Revocado');
  });

  it('keeps the token active when the revoke is cancelled (S12)', async () => {
    vi.mocked(ApiClient.get).mockResolvedValueOnce([activeRow()] as never);

    const wrapper = mountView();
    await flushPromises();

    await wrapper.find('[data-testid="revoke-token-btn"]').trigger('click');
    await flushPromises();

    useConfirm().state.onCancel();
    await flushPromises();

    expect(ApiClient.delete).not.toHaveBeenCalled();
    expect(
      wrapper.findAll('[data-testid="mcp-token-row"]')[0].text(),
    ).toContain('Activo');
  });

  it('drops the plaintext when the user leaves the view (S11)', async () => {
    vi.mocked(ApiClient.post).mockResolvedValueOnce({
      id: 'mt-1',
      name: 'Hermes laptop',
      createdAt: '2026-11-20T10:00:00.000Z',
      token: 'gmcp_secret_value',
    } as never);

    const wrapper = mountView();
    await flushPromises();

    await wrapper
      .find('[data-testid="token-name-input"]')
      .setValue('Hermes laptop');
    await wrapper.find('[data-testid="create-token-btn"]').trigger('click');
    await flushPromises();

    wrapper.unmount();

    expect(JSON.stringify(useMcpTokensStore().$state)).not.toContain(
      'gmcp_secret_value',
    );
  });

  it('shows the API error when the list cannot be loaded (S12)', async () => {
    vi.mocked(ApiClient.get).mockRejectedValueOnce(
      new Error('Error en la solicitud (Código 403)') as never,
    );

    const wrapper = mountView();
    await flushPromises();

    expect(wrapper.find('[data-testid="integrations-error"]').text()).toContain(
      'Error en la solicitud (Código 403)',
    );
  });
});
