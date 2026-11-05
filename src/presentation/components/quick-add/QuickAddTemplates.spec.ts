import { nextTick } from 'vue';

import { createPinia, setActivePinia } from 'pinia';

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../../store/auth';
import { useAccountStore } from '../../store/accounts';
import { useCategoryStore } from '../../store/categories';
import QuickAddBottomSheet from './QuickAddBottomSheet.vue';
import type { Account } from '../../../core/entities/Account';
import type { Category } from '../../../core/entities/Category';
import { useExchangeRateStore } from '../../store/exchange-rates';
import { ApiClient } from '../../../infrastructure/api/api-client';
import type { TransactionTemplate } from '../../../core/entities/TransactionTemplate';

vi.mock('../../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const accounts: Account[] = [
  {
    id: 'acc-interbank',
    userId: 'u1',
    name: 'Interbank',
    type: 'CHECKING',
    balance: 200,
    currency: 'PEN',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'acc-bbva',
    userId: 'u1',
    name: 'BBVA',
    type: 'SAVINGS',
    balance: 800,
    currency: 'PEN',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'acc-sip',
    userId: 'u1',
    name: 'SIP',
    type: 'SAVINGS',
    balance: 0,
    currency: 'PEN',
    createdAt: '',
    updatedAt: '',
  },
  {
    id: 'acc-usd',
    userId: 'u1',
    name: 'Ahorro USD',
    type: 'SAVINGS',
    balance: 0,
    currency: 'USD',
    createdAt: '',
    updatedAt: '',
  },
];

const categories: Category[] = [
  {
    id: 'cat-transport',
    userId: 'u1',
    name: 'Transporte',
    type: 'EXPENSE',
    createdAt: '',
    updatedAt: '',
  },
];

/** The two examples of S5, straight from the feature document. */
const transportTemplate: TransactionTemplate = {
  id: 'tpl-transport',
  userId: 'u1',
  name: 'Transporte público',
  type: 'EXPENSE',
  accountId: 'acc-interbank',
  destinationAccountId: null,
  categoryId: 'cat-transport',
  defaultAmount: 3,
  note: 'Transporte público',
  lastUsedAt: null,
  createdAt: '',
  updatedAt: '',
};

const transferTemplate: TransactionTemplate = {
  id: 'tpl-transfer',
  userId: 'u1',
  name: 'Mover a SIP',
  type: 'TRANSFER',
  accountId: 'acc-bbva',
  destinationAccountId: 'acc-sip',
  categoryId: null,
  defaultAmount: 200,
  note: null,
  lastUsedAt: '2026-06-01T00:00:00.000Z',
  createdAt: '',
  updatedAt: '',
};

function byTestId(id: string) {
  return document.body.querySelector(
    `[data-testid="${id}"]`,
  ) as HTMLElement | null;
}

function click(id: string) {
  const el = byTestId(id);
  if (!el) throw new Error(`missing element ${id}`);
  el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function setInput(id: string, value: string) {
  const el = byTestId(id) as HTMLInputElement | null;
  if (!el) throw new Error(`missing input ${id}`);
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function input(id: string) {
  return byTestId(id) as HTMLInputElement;
}

async function settle(times = 4) {
  for (let i = 0; i < times; i += 1) await nextTick();
}

async function openSheet() {
  const wrapper = mount(QuickAddBottomSheet, {
    props: { open: true },
    attachTo: document.body,
  });
  await settle();
  return wrapper;
}

function postCalls(endpoint: string) {
  return vi
    .mocked(ApiClient.post)
    .mock.calls.filter(([called]) => called === endpoint);
}

describe('QuickAddBottomSheet.vue — templates and transfers (S5, S7)', () => {
  beforeEach(async () => {
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

    useAccountStore().accounts = accounts;
    useCategoryStore().categories = categories;
    useExchangeRateStore().rates = { USD: 1, PEN: 3.75, VES: 39.5 };

    vi.mocked(ApiClient.get).mockImplementation(async (endpoint: string) => {
      if (endpoint === '/transaction-templates') {
        return [transportTemplate, transferTemplate];
      }
      return [] as never;
    });
    vi.mocked(ApiClient.post).mockImplementation(async (endpoint: string) => {
      if (endpoint === '/transactions') return { id: 'tx-new' } as never;

      // POST /transaction-templates/:id/use answers with the used template.
      const id = endpoint.split('/')[2];
      const stored = [transportTemplate, transferTemplate].find(
        (t) => t.id === id,
      );
      return {
        ...transportTemplate,
        ...stored,
        lastUsedAt: '2026-06-15T00:00:00.000Z',
      } as never;
    });
  });

  it('lists the templates through the store, most recently used first', async () => {
    await openSheet();

    const chips = document.body.querySelectorAll(
      '[data-testid^="quick-add-template-"]',
    );
    expect(chips).toHaveLength(2);
    expect(chips[0].getAttribute('data-testid')).toBe(
      'quick-add-template-tpl-transfer',
    );
  });

  it('prefills the expense example without submitting anything (S5)', async () => {
    await openSheet();

    click('quick-add-template-tpl-transport');
    await settle();

    expect(
      byTestId('quick-add-type-EXPENSE')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      byTestId('quick-add-account-acc-interbank')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(input('quick-add-amount').value).toBe('3');
    expect(input('quick-add-note').value).toBe('Transporte público');
    expect(
      byTestId('quick-add-category-cat-transport')?.getAttribute(
        'aria-pressed',
      ),
    ).toBe('true');
    expect(postCalls('/transactions')).toHaveLength(0);
  });

  it('prefills the transfer example BBVA to SIP with 200 (S5)', async () => {
    await openSheet();

    click('quick-add-template-tpl-transfer');
    await settle();

    expect(
      byTestId('quick-add-type-TRANSFER')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      byTestId('quick-add-account-acc-bbva')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(
      byTestId('quick-add-destination-acc-sip')?.getAttribute('aria-pressed'),
    ).toBe('true');
    expect(input('quick-add-amount').value).toBe('200');

    // Same currency: the destination mirrors the source instead of editing a rate.
    expect(byTestId('quick-add-destination-amount')).toBeNull();

    expect(postCalls('/transactions')).toHaveLength(0);
  });

  it('never offers the source account as a destination and blocks a transfer without one (S3)', async () => {
    await openSheet();

    click('quick-add-type-TRANSFER');
    await settle();
    click('quick-add-account-acc-bbva');
    await settle();

    expect(byTestId('quick-add-destination-acc-bbva')).toBeNull();

    setInput('quick-add-amount', '50');
    await settle();
    click('quick-add-submit');
    await settle();

    expect(byTestId('quick-add-error')?.textContent).toContain(
      'cuenta destino',
    );
    expect(postCalls('/transactions')).toHaveLength(0);
  });

  it('edits the destination amount when the currencies differ (S7)', async () => {
    await openSheet();

    click('quick-add-type-TRANSFER');
    await settle();
    click('quick-add-account-acc-bbva');
    click('quick-add-destination-acc-usd');
    await settle();
    setInput('quick-add-amount', '200');
    await settle();

    // 200 PEN at 3.75 lands as 53.33 USD, and the user can overwrite it.
    expect(input('quick-add-destination-amount').value).toBe('53.33');
    setInput('quick-add-destination-amount', '55');
    await settle();

    click('quick-add-submit');
    await settle(6);

    expect(postCalls('/transactions')).toHaveLength(1);
    expect(vi.mocked(ApiClient.post).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        type: 'TRANSFER',
        accountId: 'acc-bbva',
        destinationAccountId: 'acc-usd',
        amount: 200,
        destinationAmount: 55,
        exchangeRate: 0.275,
      }),
    );
  });

  it('marks the chosen template as used only after the movement was created', async () => {
    await openSheet();

    click('quick-add-template-tpl-transport');
    await settle();
    click('quick-add-submit');
    await settle(6);

    expect(postCalls('/transaction-templates/tpl-transport/use')).toHaveLength(
      1,
    );
  });

  it('does not mark a template as used when the movement fails', async () => {
    vi.mocked(ApiClient.post).mockImplementation(async (endpoint: string) => {
      if (endpoint === '/transactions') throw new Error('Sin conexión');
      return {} as never;
    });

    await openSheet();

    click('quick-add-template-tpl-transport');
    await settle();
    click('quick-add-submit');
    await settle(6);

    expect(byTestId('quick-add-error')?.textContent).toContain('Sin conexión');
    expect(postCalls('/transaction-templates/tpl-transport/use')).toHaveLength(
      0,
    );
  });

  it('keeps the plain expense flow untouched for movements without a template', async () => {
    await openSheet();

    click('quick-add-type-INCOME');
    await settle();
    click('quick-add-account-acc-interbank');
    await settle();
    setInput('quick-add-amount', '850');
    await settle();
    click('quick-add-submit');
    await settle(6);

    expect(postCalls('/transactions')).toHaveLength(1);
    expect(vi.mocked(ApiClient.post).mock.calls[0]?.[1]).toEqual(
      expect.objectContaining({
        type: 'INCOME',
        accountId: 'acc-interbank',
        amount: 850,
      }),
    );
    expect(
      (vi.mocked(ApiClient.post).mock.calls[0]?.[1] as Record<string, unknown>)
        .destinationAccountId,
    ).toBeUndefined();
  });
});
