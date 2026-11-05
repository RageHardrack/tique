import { createPinia, setActivePinia } from 'pinia';

import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../store/auth';
import { useConfirm } from '../composables/useConfirm';
import { ApiClient } from '../../infrastructure/api/api-client';
import TransactionTemplatesView from './TransactionTemplatesView.vue';
import type { TransactionTemplate } from '../../core/entities/TransactionTemplate';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const layoutStub = {
  template: '<div><slot /></div>',
};

const templateOne: TransactionTemplate = {
  id: 'tpl-1',
  userId: 'u1',
  name: 'Transporte público',
  type: 'EXPENSE',
  accountId: 'acc-interbank',
  destinationAccountId: null,
  categoryId: null,
  defaultAmount: 3,
  note: null,
  lastUsedAt: null,
  createdAt: '',
  updatedAt: '',
};

describe('TransactionTemplatesView.vue', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setActivePinia(createPinia());
    vi.clearAllMocks();

    const auth = useAuthStore();
    auth.user = {
      id: 'u1',
      email: 'd@l.dev',
      name: 'Daniel',
      role: 'USER',
      createdAt: '',
    };
    auth.accessToken = 'token-1';

    vi.mocked(ApiClient.get).mockResolvedValue([] as never);
  });

  function mountView() {
    return mount(TransactionTemplatesView, {
      props: {},
      global: {
        stubs: {
          AppLayout: layoutStub,
          TransactionTemplatesSection: {
            name: 'TransactionTemplatesSection',
            template: '<div />',
          },
        },
      },
    });
  }

  it('loads the templates, accounts and categories of the user on mount (S6)', async () => {
    vi.mocked(ApiClient.get).mockImplementation(async (endpoint: string) => {
      if (endpoint === '/transaction-templates') return [templateOne];
      return [];
    });

    mountView();
    await flushPromises();

    expect(ApiClient.get).toHaveBeenCalledWith(
      '/transaction-templates',
      'token-1',
    );
    expect(ApiClient.get).toHaveBeenCalledWith('/accounts?userId=u1');
    expect(ApiClient.get).toHaveBeenCalledWith('/categories?userId=u1');
  });

  it('creates a template through the store when the section emits create', async () => {
    vi.mocked(ApiClient.post).mockResolvedValueOnce(templateOne as never);

    const wrapper = mountView();
    await flushPromises();

    const section = wrapper.getComponent({
      name: 'TransactionTemplatesSection',
    });
    section.vm.$emit('create', {
      name: 'Transporte público',
      type: 'EXPENSE',
      accountId: 'acc-interbank',
      destinationAccountId: null,
      categoryId: null,
      defaultAmount: 3,
      note: null,
    });
    await flushPromises();

    expect(ApiClient.post).toHaveBeenCalledWith(
      '/transaction-templates',
      {
        name: 'Transporte público',
        type: 'EXPENSE',
        accountId: 'acc-interbank',
        destinationAccountId: null,
        categoryId: null,
        defaultAmount: 3,
        note: null,
      },
      'token-1',
    );
  });

  it('asks for confirmation before deleting a template (S6)', async () => {
    vi.mocked(ApiClient.delete).mockResolvedValueOnce({
      success: true,
    } as never);

    const wrapper = mountView();
    await flushPromises();

    const { state } = useConfirm();
    const section = wrapper.getComponent({
      name: 'TransactionTemplatesSection',
    });
    section.vm.$emit('delete', 'tpl-1');
    await flushPromises();

    expect(state.isOpen).toBe(true);
    expect(state.title).toBe('Eliminar plantilla');
    expect(ApiClient.delete).not.toHaveBeenCalled();

    state.onConfirm();
    await flushPromises();

    expect(ApiClient.delete).toHaveBeenCalledWith(
      '/transaction-templates/tpl-1',
      'token-1',
    );
  });

  it('keeps the template when the delete is cancelled', async () => {
    const wrapper = mountView();
    await flushPromises();

    const { state } = useConfirm();
    const section = wrapper.getComponent({
      name: 'TransactionTemplatesSection',
    });
    section.vm.$emit('delete', 'tpl-1');
    await flushPromises();

    state.onCancel();
    await flushPromises();

    expect(ApiClient.delete).not.toHaveBeenCalled();
  });
});
