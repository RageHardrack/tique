import { nextTick } from 'vue';

import { createPinia, setActivePinia } from 'pinia';

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Account } from '../../../core/entities/Account';
import type { Category } from '../../../core/entities/Category';
import TransactionTemplatesSection from './TransactionTemplatesSection.vue';
import type { TransactionTemplate } from '../../../core/entities/TransactionTemplate';

const accounts: Account[] = [
  {
    id: 'acc-interbank',
    userId: 'u1',
    name: 'Interbank',
    type: 'CHECKING',
    balance: 100,
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

function template(
  overrides: Partial<TransactionTemplate> = {},
): TransactionTemplate {
  return {
    id: 'tpl-1',
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
    ...overrides,
  };
}

function byTestId(id: string) {
  return document.body.querySelector(
    `[data-testid="${id}"]`,
  ) as HTMLElement | null;
}

function click(el: Element | null | undefined) {
  (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

async function settle() {
  for (let i = 0; i < 4; i += 1) await nextTick();
}

function mountSection(templates: TransactionTemplate[]) {
  return mount(TransactionTemplatesSection, {
    props: { templates, accounts, categories, isLoading: false },
    attachTo: document.body,
  });
}

describe('TransactionTemplatesSection.vue', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setActivePinia(createPinia());
  });

  it('renders each template with its accounts, amount and category', async () => {
    const wrapper = mountSection([
      template(),
      template({
        id: 'tpl-2',
        name: 'Mover a SIP',
        type: 'TRANSFER',
        accountId: 'acc-interbank',
        destinationAccountId: 'acc-sip',
        categoryId: null,
        defaultAmount: null,
        note: null,
      }),
    ]);
    await settle();

    expect(byTestId('template-card-tpl-1')?.textContent).toContain(
      'Transporte público',
    );
    expect(byTestId('template-card-tpl-1')?.textContent).toContain('Interbank');
    expect(byTestId('template-card-tpl-1')?.textContent).toContain(
      'Transporte',
    );
    expect(byTestId('template-card-tpl-1')?.textContent).toContain('3.00');

    const transfer = byTestId('template-card-tpl-2');
    expect(transfer?.textContent).toContain('Interbank');
    expect(transfer?.textContent).toContain('SIP');
    expect(transfer?.textContent).toContain('Sin monto fijo');

    expect(wrapper.text()).toContain('Transferencia');
  });

  it('asks the parent to delete a template and to open the editor', async () => {
    const wrapper = mountSection([template()]);
    await settle();

    click(byTestId('template-edit-tpl-1'));
    await settle();
    expect(byTestId('template-form')).not.toBeNull();

    click(byTestId('template-close'));
    await settle();

    click(byTestId('template-delete-tpl-1'));
    await settle();
    expect(wrapper.emitted('delete')?.[0]).toEqual(['tpl-1']);
  });

  it('forwards the created payload and blocks an invalid submit', async () => {
    const wrapper = mountSection([
      template({
        id: 'recent',
        name: 'Café',
        lastUsedAt: '2026-06-01T00:00:00.000Z',
      }),
      template({ id: 'never', name: 'Alquiler', lastUsedAt: null }),
    ]);
    await settle();

    click(byTestId('template-create'));
    await settle();
    click(byTestId('template-type-TRANSFER'));
    click(byTestId('template-source-acc-interbank'));
    await settle();
    click(byTestId('template-destination-acc-sip'));
    await settle();
    click(byTestId('template-submit'));
    await settle();

    expect(wrapper.emitted('create')).toBeUndefined();
    expect(byTestId('template-errors')?.textContent).toContain(
      'El nombre de la plantilla es obligatorio.',
    );

    const nameInput = byTestId('template-name') as HTMLInputElement;
    nameInput.value = 'Mover quincenal';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));
    await settle();
    click(byTestId('template-submit'));
    await settle();

    expect(wrapper.emitted('create')?.[0]?.[0]).toEqual({
      name: 'Mover quincenal',
      type: 'TRANSFER',
      accountId: 'acc-interbank',
      destinationAccountId: 'acc-sip',
      categoryId: null,
      defaultAmount: null,
      note: null,
    });
  });
});
