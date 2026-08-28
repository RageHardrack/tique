import { describe, expect, it } from 'vitest';
import { BankStatementParser, type StatementMappingConfig } from './BankStatementParser';
import type { Transaction } from '../entities/Transaction';

describe('BankStatementParser', () => {
  describe('detectDelimiter', () => {
    it('detects comma delimiter', () => {
      expect(BankStatementParser.detectDelimiter('2026-08-01,Supermercado,50.00')).toBe(',');
    });

    it('detects semicolon delimiter', () => {
      expect(BankStatementParser.detectDelimiter('2026-08-01;Supermercado;50,00')).toBe(';');
    });

    it('detects tab delimiter', () => {
      expect(BankStatementParser.detectDelimiter('2026-08-01\tSupermercado\t50.00')).toBe('\t');
    });
  });

  describe('parseCsvToMatrix', () => {
    it('parses CSV with quotes and commas properly', () => {
      const csv = `Fecha,Descripcion,Monto
2026-08-20,"Restaurante, Lima",45.50
2026-08-21,"Pago ""Servicios""",120.00`;

      const matrix = BankStatementParser.parseCsvToMatrix(csv);
      expect(matrix.length).toBe(3);
      expect(matrix[1]).toEqual(['2026-08-20', 'Restaurante, Lima', '45.50']);
      expect(matrix[2]).toEqual(['2026-08-21', 'Pago "Servicios"', '120.00']);
    });
  });

  describe('parseDate', () => {
    it('parses YYYY-MM-DD', () => {
      expect(BankStatementParser.parseDate('2026-08-26', 'YYYY-MM-DD')).toBe('2026-08-26');
    });

    it('parses DD/MM/YYYY', () => {
      expect(BankStatementParser.parseDate('26/08/2026', 'DD/MM/YYYY')).toBe('2026-08-26');
    });

    it('parses MM/DD/YYYY', () => {
      expect(BankStatementParser.parseDate('08/26/2026', 'MM/DD/YYYY')).toBe('2026-08-26');
    });

    it('returns null for invalid date', () => {
      expect(BankStatementParser.parseDate('invalid-date')).toBeNull();
      expect(BankStatementParser.parseDate('2026-15-50')).toBeNull();
    });
  });

  describe('parseAmount', () => {
    it('parses simple positive and negative numbers', () => {
      expect(BankStatementParser.parseAmount('150.50')).toEqual({ amount: 150.5, inferredType: 'INCOME' });
      expect(BankStatementParser.parseAmount('-45.00')).toEqual({ amount: 45, inferredType: 'EXPENSE' });
    });

    it('handles currency symbols and European format (1.250,50)', () => {
      expect(BankStatementParser.parseAmount('S/ 1.250,50')).toEqual({ amount: 1250.5, inferredType: 'INCOME' });
      expect(BankStatementParser.parseAmount('-$ 2,500.00')).toEqual({ amount: 2500, inferredType: 'EXPENSE' });
    });

    it('returns null for zero or invalid strings', () => {
      expect(BankStatementParser.parseAmount('abc')).toBeNull();
      expect(BankStatementParser.parseAmount('0.00')).toBeNull();
    });
  });

  describe('parseStatement & Duplicate Detection', () => {
    const existingTransactions: Transaction[] = [
      {
        id: 'tx-1',
        userId: 'usr-1',
        accountId: 'acc-1',
        type: 'EXPENSE',
        amount: 50,
        date: '2026-08-20T10:00:00.000Z',
        createdAt: '2026-08-20T10:00:00.000Z',
        updatedAt: '2026-08-20T10:00:00.000Z',
      },
    ];

    const matrix = [
      ['Fecha', 'Concepto', 'Importe'],
      ['20/08/2026', 'Compra Super', '-50.00'], // duplicate of tx-1
      ['21/08/2026', 'Honorarios', '1200.00'], // new income
      ['invalid', 'Error row', '10.00'], // invalid date
    ];

    const mapping: StatementMappingConfig = {
      dateColumnIndex: 0,
      descriptionColumnIndex: 1,
      amountColumnIndex: 2,
      dateFormat: 'DD/MM/YYYY',
      hasHeader: true,
    };

    it('parses valid rows, flags duplicates and invalid rows', () => {
      const results = BankStatementParser.parseStatement({
        matrix,
        mapping,
        existingTransactions,
        accountId: 'acc-1',
      });

      expect(results.length).toBe(3);

      // Row 1: Duplicate expense
      expect(results[0].date).toBe('2026-08-20');
      expect(results[0].amount).toBe(50);
      expect(results[0].type).toBe('EXPENSE');
      expect(results[0].isDuplicate).toBe(true);
      expect(results[0].isValid).toBe(true);

      // Row 2: New income
      expect(results[1].date).toBe('2026-08-21');
      expect(results[1].amount).toBe(1200);
      expect(results[1].type).toBe('INCOME');
      expect(results[1].isDuplicate).toBe(false);
      expect(results[1].isValid).toBe(true);

      // Row 3: Invalid date
      expect(results[2].isValid).toBe(false);
      expect(results[2].errorMessage).toBe('Formato de fecha inválido');
    });
  });
});
