import { describe, expect, it } from 'vitest';

import type { Account } from '../entities/Account';
import type { Category } from '../entities/Category';
import { CsvExportService } from './CsvExportService';
import type { Transaction } from '../entities/Transaction';

describe('CsvExportService', () => {
  const accounts: Account[] = [
    {
      id: 'acc-1',
      userId: 'user-1',
      name: 'BCP Principal',
      type: 'CHECKING',
      balance: 1000,
      currency: 'PEN',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
    {
      id: 'acc-2',
      userId: 'user-1',
      name: 'Efectivo USD',
      type: 'CASH',
      balance: 500,
      currency: 'USD',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const categories: Category[] = [
    {
      id: 'cat-1',
      userId: 'user-1',
      name: 'Comida & Bebidas',
      type: 'EXPENSE',
      createdAt: '2026-01-01',
      updatedAt: '2026-01-01',
    },
  ];

  const transactions: Transaction[] = [
    {
      id: 'tx-1',
      userId: 'user-1',
      accountId: 'acc-1',
      categoryId: 'cat-1',
      amount: 150.5,
      type: 'EXPENSE',
      date: '2026-08-24T12:00:00Z',
      note: 'Almuerzo con café, postre y "propina"',
      createdAt: '2026-08-24',
      updatedAt: '2026-08-24',
    },
    {
      id: 'tx-2',
      userId: 'user-1',
      accountId: 'acc-2',
      destinationAccountId: 'acc-1',
      amount: 100,
      type: 'TRANSFER',
      date: '2026-08-20T10:00:00Z',
      note: 'Cambio de divisas',
      createdAt: '2026-08-20',
      updatedAt: '2026-08-20',
    },
  ];

  it('should generate valid RFC 4180 CSV with headers and escaped values', () => {
    const csv = CsvExportService.generateCsv({
      transactions,
      accounts,
      categories,
      baseCurrency: 'PEN',
      convertFn: (amount, curr) => (curr === 'USD' ? amount * 3.75 : amount),
    });

    const lines = csv.split('\n');
    expect(lines.length).toBe(3);
    expect(lines[0]).toContain('Fecha,Tipo,Categoría,Cuenta,Cuenta Destino');

    // Check tx-1 escaping
    expect(lines[1]).toContain('"Almuerzo con café, postre y ""propina"""');
    expect(lines[1]).toContain('150.50,PEN,150.50');

    // Check tx-2 transfer
    expect(lines[2]).toContain(
      'Transferencia,Sin categoría,Efectivo USD,BCP Principal,100.00,USD,375.00',
    );
  });

  it('should properly escape values with special characters', () => {
    expect(CsvExportService.escapeCsvValue('Simple')).toBe('Simple');
    expect(CsvExportService.escapeCsvValue('With, comma')).toBe(
      '"With, comma"',
    );
    expect(CsvExportService.escapeCsvValue('With "quote"')).toBe(
      '"With ""quote"""',
    );
    expect(CsvExportService.escapeCsvValue('Line 1\nLine 2')).toBe(
      '"Line 1\nLine 2"',
    );
  });
});
