import type { Transaction, TransactionType } from '../entities/Transaction';

export interface ParsedStatementRow {
  date: string;
  amount: number;
  type: TransactionType;
  description: string;
  raw: string[];
  isDuplicate: boolean;
  isValid: boolean;
  errorMessage?: string;
}

export interface StatementMappingConfig {
  dateColumnIndex: number;
  amountColumnIndex: number;
  descriptionColumnIndex: number;
  typeColumnIndex?: number;
  incomeIndicator?: string;
  expenseIndicator?: string;
  dateFormat?: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY';
  hasHeader: boolean;
  delimiter?: string;
}

export class BankStatementParser {
  /**
   * Detects delimiter automatically (comma, semicolon, tab).
   */
  static detectDelimiter(sampleLine: string): string {
    const counts = {
      ',': (sampleLine.match(/,/g) || []).length,
      ';': (sampleLine.match(/;/g) || []).length,
      '\t': (sampleLine.match(/\t/g) || []).length,
    };

    if (counts[';'] > counts[','] && counts[';'] > counts['\t']) return ';';
    if (counts['\t'] > counts[','] && counts['\t'] > counts[';']) return '\t';
    return ',';
  }

  /**
   * Parses raw CSV content into array of row cell arrays handling quotes.
   */
  static parseCsvToMatrix(csvText: string, delimiter?: string): string[][] {
    const lines = csvText.trim().split(/\r?\n/);
    if (lines.length === 0 || (lines.length === 1 && !lines[0].trim())) {
      return [];
    }

    const actualDelimiter = delimiter || this.detectDelimiter(lines[0]);
    const matrix: string[][] = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      
      const row: string[] = [];
      let inQuotes = false;
      let currentValue = '';

      for (let i = 0; i < line.length; i++) {
        const char = line[i];

        if (char === '"') {
          if (inQuotes && line[i + 1] === '"') {
            currentValue += '"';
            i++;
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === actualDelimiter && !inQuotes) {
          row.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      row.push(currentValue.trim());
      matrix.push(row);
    }

    return matrix;
  }

  /**
   * Parses date string into ISO YYYY-MM-DD format.
   */
  static parseDate(dateStr: string, format: 'YYYY-MM-DD' | 'DD/MM/YYYY' | 'MM/DD/YYYY' = 'YYYY-MM-DD'): string | null {
    if (!dateStr) return null;
    const clean = dateStr.trim().replace(/[./]/g, '-');
    const parts = clean.split('-');

    if (parts.length !== 3) return null;

    let year = 0;
    let month = 0;
    let day = 0;

    if (format === 'DD/MM/YYYY') {
      day = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else if (format === 'MM/DD/YYYY') {
      month = parseInt(parts[0], 10);
      day = parseInt(parts[1], 10);
      year = parseInt(parts[2], 10);
    } else {
      // YYYY-MM-DD
      year = parseInt(parts[0], 10);
      month = parseInt(parts[1], 10);
      day = parseInt(parts[2], 10);
    }

    if (isNaN(year) || isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
      return null;
    }

    const yStr = year.toString().padStart(4, '0');
    const mStr = month.toString().padStart(2, '0');
    const dStr = day.toString().padStart(2, '0');

    return `${yStr}-${mStr}-${dStr}`;
  }

  /**
   * Parses amount numeric value handling negative values, currency symbols and formats ($ 1,234.56 or S/ 1.234,56).
   */
  static parseAmount(amountStr: string): { amount: number; inferredType?: TransactionType } | null {
    if (!amountStr) return null;

    let clean = amountStr.trim().replace(/[^0-9.,+-]/g, '');
    if (!clean) return null;

    let isNegative = clean.includes('-');
    clean = clean.replace(/[+-]/g, '');

    // Handle European format: 1.234,56 -> 1234.56
    if (clean.includes(',') && clean.includes('.')) {
      if (clean.indexOf('.') < clean.indexOf(',')) {
        clean = clean.replace(/\./g, '').replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    } else if (clean.includes(',')) {
      // If only comma, check if it looks like decimal: e.g. 12,50
      const commaIndex = clean.lastIndexOf(',');
      if (clean.length - commaIndex - 1 <= 2) {
        clean = clean.replace(',', '.');
      } else {
        clean = clean.replace(/,/g, '');
      }
    }

    const num = parseFloat(clean);
    if (isNaN(num) || num === 0) return null;

    const rounded = Math.round(num * 100) / 100;
    return {
      amount: rounded,
      inferredType: isNegative ? 'EXPENSE' : 'INCOME',
    };
  }

  /**
   * Checks if a parsed row is a duplicate against existing transactions for the selected account.
   */
  static isDuplicateTransaction(row: { date: string; amount: number; type: TransactionType }, existingTransactions: Transaction[], accountId: string): boolean {
    const rowDate = row.date.slice(0, 10);

    return existingTransactions.some((tx) => {
      if (tx.accountId !== accountId) return false;
      const txDate = new Date(tx.date).toISOString().slice(0, 10);
      const isSameDate = txDate === rowDate;
      const isSameAmount = Math.abs(tx.amount - row.amount) < 0.01;
      const isSameType = tx.type === row.type;

      return isSameDate && isSameAmount && isSameType;
    });
  }

  /**
   * Parses complete matrix into structured parsed rows with validation and duplicate checks.
   */
  static parseStatement(params: {
    matrix: string[][];
    mapping: StatementMappingConfig;
    existingTransactions: Transaction[];
    accountId: string;
  }): ParsedStatementRow[] {
    const { matrix, mapping, existingTransactions, accountId } = params;
    const startIndex = mapping.hasHeader ? 1 : 0;
    const results: ParsedStatementRow[] = [];

    for (let i = startIndex; i < matrix.length; i++) {
      const row = matrix[i];
      if (!row || row.length === 0 || row.every((c) => !c.trim())) continue;

      const rawDate = row[mapping.dateColumnIndex] || '';
      const rawAmount = row[mapping.amountColumnIndex] || '';
      const rawDescription = row[mapping.descriptionColumnIndex] || '';

      const parsedDate = this.parseDate(rawDate, mapping.dateFormat);
      const parsedAmt = this.parseAmount(rawAmount);

      if (!parsedDate || !parsedAmt) {
        results.push({
          date: parsedDate || rawDate,
          amount: parsedAmt?.amount || 0,
          type: 'EXPENSE',
          description: rawDescription || 'Movimiento importado',
          raw: row,
          isDuplicate: false,
          isValid: false,
          errorMessage: !parsedDate ? 'Formato de fecha inválido' : 'Monto inválido',
        });
        continue;
      }

      let type: TransactionType = parsedAmt.inferredType || 'EXPENSE';

      // Override type if type column is configured
      if (mapping.typeColumnIndex !== undefined && row[mapping.typeColumnIndex]) {
        const typeVal = row[mapping.typeColumnIndex].toLowerCase();
        if (mapping.incomeIndicator && typeVal.includes(mapping.incomeIndicator.toLowerCase())) {
          type = 'INCOME';
        } else if (mapping.expenseIndicator && typeVal.includes(mapping.expenseIndicator.toLowerCase())) {
          type = 'EXPENSE';
        }
      }

      const isDuplicate = this.isDuplicateTransaction({ date: parsedDate, amount: parsedAmt.amount, type }, existingTransactions, accountId);

      results.push({
        date: parsedDate,
        amount: parsedAmt.amount,
        type,
        description: rawDescription || 'Movimiento importado',
        raw: row,
        isDuplicate,
        isValid: true,
      });
    }

    return results;
  }
}
