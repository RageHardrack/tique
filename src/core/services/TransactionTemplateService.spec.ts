import { describe, expect, it } from 'vitest';

import { TransactionTemplateService } from './TransactionTemplateService';
import type { TransactionTemplate } from '../entities/TransactionTemplate';

function template(
  overrides: Partial<TransactionTemplate> = {},
): TransactionTemplate {
  return {
    id: 'tpl-1',
    userId: 'u-1',
    name: 'Transporte público',
    type: 'EXPENSE',
    accountId: 'acc-interbank',
    destinationAccountId: null,
    categoryId: 'cat-transport',
    defaultAmount: 3,
    note: 'Transporte público',
    lastUsedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('TransactionTemplateService.sortByUsage (S7)', () => {
  it('orders by most recent use first, never-used last, then by name', () => {
    const sorted = TransactionTemplateService.sortByUsage([
      template({ id: 'never-b', name: 'Zapatos', lastUsedAt: null }),
      template({
        id: 'never-a',
        name: 'Alquiler',
        lastUsedAt: null,
      }),
      template({
        id: 'old',
        name: 'Internet',
        lastUsedAt: '2026-01-01T00:00:00.000Z',
      }),
      template({
        id: 'recent',
        name: 'Café',
        lastUsedAt: '2026-06-01T00:00:00.000Z',
      }),
    ]);

    expect(sorted.map((t) => t.id)).toEqual([
      'recent',
      'old',
      'never-a',
      'never-b',
    ]);
  });

  it('does not mutate the received list', () => {
    const input = [
      template({ id: 'a', name: 'A', lastUsedAt: null }),
      template({
        id: 'b',
        name: 'B',
        lastUsedAt: '2026-06-01T00:00:00.000Z',
      }),
    ];

    TransactionTemplateService.sortByUsage(input);

    expect(input.map((t) => t.id)).toEqual(['a', 'b']);
  });
});

describe('TransactionTemplateService.validate (S3, S4)', () => {
  it('requires a destination account different from the source for TRANSFER', () => {
    expect(
      TransactionTemplateService.validate({
        name: 'Mover a ahorro',
        type: 'TRANSFER',
        accountId: 'acc-bbva',
      }),
    ).toContain('Una transferencia necesita una cuenta destino.');

    expect(
      TransactionTemplateService.validate({
        name: 'Mover a ahorro',
        type: 'TRANSFER',
        accountId: 'acc-bbva',
        destinationAccountId: 'acc-bbva',
      }),
    ).toContain('La cuenta destino debe ser diferente a la cuenta origen.');

    expect(
      TransactionTemplateService.validate({
        name: 'Mover a ahorro',
        type: 'TRANSFER',
        accountId: 'acc-bbva',
        destinationAccountId: 'acc-sip',
      }),
    ).toEqual([]);
  });

  it('rejects a destination account on EXPENSE and INCOME templates', () => {
    for (const type of ['EXPENSE', 'INCOME'] as const) {
      expect(
        TransactionTemplateService.validate({
          name: 'Almuerzo',
          type,
          accountId: 'acc-bbva',
          destinationAccountId: 'acc-sip',
        }),
      ).toContain('Solo las transferencias tienen cuenta destino.');
    }

    expect(
      TransactionTemplateService.validate({
        name: 'Almuerzo',
        type: 'EXPENSE',
        accountId: 'acc-bbva',
      }),
    ).toEqual([]);
  });

  it('treats the default amount as optional but requires it to be positive', () => {
    expect(
      TransactionTemplateService.validate({
        name: 'Sin monto fijo',
        type: 'EXPENSE',
        accountId: 'acc-bbva',
        defaultAmount: null,
      }),
    ).toEqual([]);

    expect(
      TransactionTemplateService.validate({
        name: 'Con monto inválido',
        type: 'EXPENSE',
        accountId: 'acc-bbva',
        defaultAmount: 0,
      }),
    ).toContain('El monto por defecto debe ser mayor a 0.');

    expect(
      TransactionTemplateService.validate({
        name: 'Con monto válido',
        type: 'EXPENSE',
        accountId: 'acc-bbva',
        defaultAmount: 3,
      }),
    ).toEqual([]);
  });

  it('requires a non-empty name and a source account', () => {
    const issues = TransactionTemplateService.validate({
      name: '   ',
      type: 'EXPENSE',
      accountId: '',
    });

    expect(issues).toContain('El nombre de la plantilla es obligatorio.');
    expect(issues).toContain('Selecciona la cuenta origen.');
  });
});

describe('TransactionTemplateService.buildDraft (S4, S5)', () => {
  it('prefills the expense example: transporte público, 3 soles, Interbank', () => {
    const draft = TransactionTemplateService.buildDraft(
      template({ accountId: 'acc-interbank', defaultAmount: 3 }),
    );

    expect(draft).toEqual({
      type: 'EXPENSE',
      accountId: 'acc-interbank',
      destinationAccountId: null,
      categoryId: 'cat-transport',
      note: 'Transporte público',
      amount: 3,
    });
  });

  it('prefills the transfer example: 200 soles de BBVA a SIP', () => {
    const draft = TransactionTemplateService.buildDraft(
      template({
        name: 'Mover a SIP',
        type: 'TRANSFER',
        accountId: 'acc-bbva',
        destinationAccountId: 'acc-sip',
        categoryId: null,
        defaultAmount: 200,
        note: null,
      }),
    );

    expect(draft).toEqual({
      type: 'TRANSFER',
      accountId: 'acc-bbva',
      destinationAccountId: 'acc-sip',
      categoryId: null,
      note: null,
      amount: 200,
    });
  });

  it('overrides the amount at use time without mutating the template', () => {
    const original = template({ defaultAmount: 3 });

    const draft = TransactionTemplateService.buildDraft(original, {
      amount: 6.5,
    });

    expect(draft.amount).toBe(6.5);
    expect(original.defaultAmount).toBe(3);
    expect(original).toEqual(expect.objectContaining({ defaultAmount: 3 }));
  });

  it('ignores an override that is not a positive number', () => {
    const original = template({ defaultAmount: 3 });

    expect(
      TransactionTemplateService.buildDraft(original, { amount: 0 }).amount,
    ).toBe(3);
    expect(
      TransactionTemplateService.buildDraft(original, { amount: null }).amount,
    ).toBe(3);
  });

  it('keeps the draft amount empty when the template has no default amount', () => {
    const draft = TransactionTemplateService.buildDraft(
      template({ defaultAmount: null }),
    );

    expect(draft.amount).toBeNull();
  });

  it('never carries a destination account on non-transfer drafts', () => {
    const draft = TransactionTemplateService.buildDraft(
      template({
        type: 'EXPENSE',
        destinationAccountId: 'acc-stale',
      }),
    );

    expect(draft.destinationAccountId).toBeNull();
  });
});
