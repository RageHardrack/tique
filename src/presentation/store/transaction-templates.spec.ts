import { createPinia, setActivePinia } from 'pinia';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from './auth';
import { ApiClient } from '../../infrastructure/api/api-client';
import { useTransactionTemplateStore } from './transaction-templates';
import type { TransactionTemplate } from '../../core/entities/TransactionTemplate';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

function makeTemplate(
  overrides: Partial<TransactionTemplate> = {},
): TransactionTemplate {
  return {
    id: 'tpl-1',
    userId: 'user-1',
    name: 'Transporte público',
    type: 'EXPENSE',
    accountId: 'acc-interbank',
    destinationAccountId: null,
    categoryId: 'cat-1',
    defaultAmount: 3,
    note: 'Transporte público',
    lastUsedAt: null,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-01',
    ...overrides,
  };
}

describe('useTransactionTemplateStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
    vi.clearAllMocks();
    useAuthStore().accessToken = 'token-1';
  });

  it('should fetch templates with the auth token and no userId', async () => {
    const mockTemplates = [makeTemplate()];
    vi.mocked(ApiClient.get).mockResolvedValueOnce(mockTemplates);

    const store = useTransactionTemplateStore();
    await store.fetchTemplates();

    expect(ApiClient.get).toHaveBeenCalledWith(
      '/transaction-templates',
      'token-1',
    );
    expect(store.templates).toEqual(mockTemplates);
  });

  it('should create a template hitting POST /transaction-templates', async () => {
    const created = makeTemplate({ id: 'tpl-2', name: 'Mover a SIP' });
    vi.mocked(ApiClient.post).mockResolvedValueOnce(created);

    const store = useTransactionTemplateStore();
    const payload = {
      name: 'Mover a SIP',
      type: 'TRANSFER' as const,
      accountId: 'acc-bbva',
      destinationAccountId: 'acc-sip',
      defaultAmount: 200,
    };

    await expect(store.createTemplate(payload)).resolves.toEqual(created);

    expect(ApiClient.post).toHaveBeenCalledWith(
      '/transaction-templates',
      payload,
      'token-1',
    );
    expect(store.templates).toContainEqual(created);
  });

  it('should update a template hitting PUT /transaction-templates/:id', async () => {
    const updated = makeTemplate({ name: 'Transporte público ajustado' });
    vi.mocked(ApiClient.put).mockResolvedValueOnce(updated);

    const store = useTransactionTemplateStore();
    store.templates = [makeTemplate()];

    const payload = {
      name: 'Transporte público ajustado',
      type: 'EXPENSE' as const,
      accountId: 'acc-interbank',
      defaultAmount: 4,
    };

    await store.updateTemplate('tpl-1', payload);

    expect(ApiClient.put).toHaveBeenCalledWith(
      '/transaction-templates/tpl-1',
      payload,
      'token-1',
    );
    expect(store.templates[0].name).toBe('Transporte público ajustado');
  });

  it('should delete a template hitting DELETE /transaction-templates/:id', async () => {
    vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true });

    const store = useTransactionTemplateStore();
    store.templates = [makeTemplate()];

    await store.deleteTemplate('tpl-1');

    expect(ApiClient.delete).toHaveBeenCalledWith(
      '/transaction-templates/tpl-1',
      'token-1',
    );
    expect(store.templates).toHaveLength(0);
  });

  it('should mark a template as used through POST /transaction-templates/:id/use', async () => {
    const used = makeTemplate({ lastUsedAt: '2026-06-01T10:00:00.000Z' });
    vi.mocked(ApiClient.post).mockResolvedValueOnce(used);

    const store = useTransactionTemplateStore();
    store.templates = [makeTemplate()];

    await store.markUsed('tpl-1');

    expect(ApiClient.post).toHaveBeenCalledWith(
      '/transaction-templates/tpl-1/use',
      {},
      'token-1',
    );
    expect(store.templates[0].lastUsedAt).toBe('2026-06-01T10:00:00.000Z');
  });

  it('should expose templates ordered by recent use (S7)', () => {
    const store = useTransactionTemplateStore();
    store.templates = [
      makeTemplate({ id: 'never', name: 'Zapatos', lastUsedAt: null }),
      makeTemplate({
        id: 'old',
        name: 'Internet',
        lastUsedAt: '2026-01-01T00:00:00.000Z',
      }),
      makeTemplate({
        id: 'recent',
        name: 'Café',
        lastUsedAt: '2026-06-01T00:00:00.000Z',
      }),
      makeTemplate({ id: 'alpha', name: 'Alquiler', lastUsedAt: null }),
    ];

    expect(store.sortedTemplates.map((t) => t.id)).toEqual([
      'recent',
      'old',
      'alpha',
      'never',
    ]);
  });

  it('should set error and rethrow when the create call fails', async () => {
    vi.mocked(ApiClient.post).mockRejectedValueOnce(
      new Error('La cuenta destino no pertenece al usuario'),
    );

    const store = useTransactionTemplateStore();

    await expect(
      store.createTemplate({
        name: 'Rara',
        type: 'TRANSFER',
        accountId: 'acc-bbva',
        destinationAccountId: 'acc-other',
      }),
    ).rejects.toThrow('La cuenta destino no pertenece al usuario');

    expect(store.error).toBe('La cuenta destino no pertenece al usuario');
    expect(store.templates).toHaveLength(0);
  });
});
