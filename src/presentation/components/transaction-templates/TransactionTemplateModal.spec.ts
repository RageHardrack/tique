import { nextTick } from 'vue';

import { createPinia, setActivePinia } from 'pinia';

import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Account } from '../../../core/entities/Account';
import type { Category } from '../../../core/entities/Category';
import TransactionTemplateModal from './TransactionTemplateModal.vue';
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
    id: 'acc-bbva',
    userId: 'u1',
    name: 'BBVA',
    type: 'SAVINGS',
    balance: 500,
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
  {
    id: 'cat-salary',
    userId: 'u1',
    name: 'Sueldo',
    type: 'INCOME',
    createdAt: '',
    updatedAt: '',
  },
];

function byTestId(id: string) {
  return document.body.querySelector(
    `[data-testid="${id}"]`,
  ) as HTMLElement | null;
}

function click(el: Element | null | undefined) {
  (el as HTMLElement).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function setInput(id: string, value: string) {
  const el = document.body.querySelector(
    `[data-testid="${id}"]`,
  ) as HTMLInputElement | null;
  if (!el) throw new Error(`missing input ${id}`);
  el.value = value;
  el.dispatchEvent(new Event('input', { bubbles: true }));
}

function mountModal(template: TransactionTemplate | null = null) {
  const wrapper = mount(TransactionTemplateModal, {
    props: { open: true, template, accounts, categories },
    attachTo: document.body,
  });
  return wrapper;
}

async function settle() {
  for (let i = 0; i < 4; i += 1) await nextTick();
}

describe('TransactionTemplateModal.vue', () => {
  beforeEach(() => {
    localStorage.clear();
    document.body.innerHTML = '';
    setActivePinia(createPinia());
  });

  it('shows the S3 message and does not emit when a TRANSFER has no destination', async () => {
    const wrapper = mountModal();
    await settle();

    setInput('template-name', 'Mover a SIP');
    click(byTestId('template-type-TRANSFER'));
    click(byTestId('template-source-acc-interbank'));
    await settle();
    click(byTestId('template-submit'));
    await settle();

    expect(byTestId('template-errors')?.textContent).toContain(
      'Una transferencia necesita una cuenta destino.',
    );
    expect(wrapper.emitted('create')).toBeUndefined();
  });

  it('rejects a destination equal to the source before submitting (S3)', async () => {
    const wrapper = mountModal();
    await settle();

    setInput('template-name', 'Mover a SIP');
    click(byTestId('template-type-TRANSFER'));
    click(byTestId('template-source-acc-interbank'));
    await settle();

    // The source itself is never offered as a destination.
    expect(byTestId('template-destination-acc-interbank')).toBeNull();

    click(byTestId('template-destination-acc-sip'));
    await settle();
    click(byTestId('template-submit'));
    await settle();

    expect(wrapper.emitted('create')?.[0]?.[0]).toEqual({
      name: 'Mover a SIP',
      type: 'TRANSFER',
      accountId: 'acc-interbank',
      destinationAccountId: 'acc-sip',
      categoryId: null,
      defaultAmount: null,
      note: null,
    });
  });

  it('hides the category picker for TRANSFER and filters it by type', async () => {
    const wrapper = mountModal();
    await settle();

    expect(byTestId('template-category-cat-transport')).not.toBeNull();
    expect(byTestId('template-category-cat-salary')).toBeNull();

    click(byTestId('template-type-TRANSFER'));
    await settle();
    expect(byTestId('template-categories')).toBeNull();

    click(byTestId('template-type-INCOME'));
    await settle();
    expect(byTestId('template-category-cat-salary')).not.toBeNull();
    expect(byTestId('template-category-cat-transport')).toBeNull();
    expect(wrapper.emitted('create')).toBeUndefined();
  });

  it('treats the default amount as optional but rejects zero (S4)', async () => {
    const wrapper = mountModal();
    await settle();

    setInput('template-name', 'Reunión mensual');
    click(byTestId('template-source-acc-bbva'));
    await settle();
    click(byTestId('template-submit'));
    await settle();

    expect(wrapper.emitted('create')?.[0]?.[0]).toEqual(
      expect.objectContaining({ defaultAmount: null }),
    );

    setInput('template-amount', '0');
    await settle();
    click(byTestId('template-submit'));
    await settle();

    expect(byTestId('template-errors')?.textContent).toContain(
      'El monto por defecto debe ser mayor a 0.',
    );
    expect(wrapper.emitted('create')).toHaveLength(1);
  });

  it('prefills the edit form and emits update with the template id (S6)', async () => {
    const existing: TransactionTemplate = {
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
    };

    const wrapper = mountModal(existing);
    await settle();

    expect(
      (
        document.body.querySelector(
          '[data-testid="template-name"]',
        ) as HTMLInputElement
      ).value,
    ).toBe('Transporte público');

    click(byTestId('template-category-cat-transport'));
    setInput('template-amount', '4');
    await settle();
    click(byTestId('template-submit'));
    await settle();

    expect(wrapper.emitted('update')?.[0]).toEqual([
      'tpl-1',
      {
        name: 'Transporte público',
        type: 'EXPENSE',
        accountId: 'acc-interbank',
        destinationAccountId: null,
        categoryId: 'cat-transport',
        defaultAmount: 4,
        note: 'Transporte público',
      },
    ]);
  });
});
