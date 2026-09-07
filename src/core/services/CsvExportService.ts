import type { Account } from '../entities/Account';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';

export interface CsvExportOptions {
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  baseCurrency: string;
  convertFn?: (
    amount: number,
    fromCurrency: string,
    exchangeRate?: number | null,
  ) => number;
}

export class CsvExportService {
  /**
   * Generates a CSV string following RFC 4180 rules.
   */
  static generateCsv(options: CsvExportOptions): string {
    const { transactions, accounts, categories, baseCurrency, convertFn } =
      options;

    const accountsMap = new Map<string, Account>(
      accounts.map((a) => [a.id, a]),
    );
    const categoriesMap = new Map<string, Category>(
      categories.map((c) => [c.id, c]),
    );

    const headers = [
      'Fecha',
      'Tipo',
      'Categoría',
      'Cuenta',
      'Cuenta Destino',
      'Monto Original',
      'Moneda',
      `Monto (${baseCurrency})`,
      'Descripción / Nota',
    ];

    const rows = transactions.map((tx) => {
      const dateStr = new Date(tx.date).toISOString().slice(0, 10);
      const typeStr =
        tx.type === 'INCOME'
          ? 'Ingreso'
          : tx.type === 'EXPENSE'
            ? 'Gasto'
            : 'Transferencia';

      const category = tx.categoryId
        ? categoriesMap.get(tx.categoryId)?.name || 'Sin categoría'
        : 'Sin categoría';

      const account = accountsMap.get(tx.accountId);
      const accountName = account ? account.name : 'Cuenta';
      const currency = account ? account.currency : 'USD';

      const destAccount = tx.destinationAccountId
        ? accountsMap.get(tx.destinationAccountId)?.name || ''
        : '';

      const convertedAmount = convertFn
        ? convertFn(tx.amount, currency, tx.exchangeRate).toFixed(2)
        : tx.amount.toFixed(2);

      return [
        this.escapeCsvValue(dateStr),
        this.escapeCsvValue(typeStr),
        this.escapeCsvValue(category),
        this.escapeCsvValue(accountName),
        this.escapeCsvValue(destAccount),
        this.escapeCsvValue(tx.amount.toFixed(2)),
        this.escapeCsvValue(currency),
        this.escapeCsvValue(convertedAmount),
        this.escapeCsvValue(tx.note || ''),
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  /**
   * Escapes values that contain commas, quotes or newlines.
   */
  static escapeCsvValue(val: string): string {
    if (
      val.includes(',') ||
      val.includes('"') ||
      val.includes('\n') ||
      val.includes('\r')
    ) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  }

  /**
   * Triggers a browser download of the CSV content.
   */
  static downloadCsv(csvContent: string, filename?: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined')
      return;

    const actualFilename =
      filename ||
      `tique_movimientos_${new Date().toISOString().slice(0, 10)}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', actualFilename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }
}
