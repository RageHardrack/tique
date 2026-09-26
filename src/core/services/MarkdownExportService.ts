import { DateFormatter } from './DateFormatter';
import type { Account } from '../entities/Account';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import type {
  CashflowMetrics,
  CategoryExpenseBreakdown,
} from './AnalyticsService';

export interface MarkdownReportData {
  rangeLabel: string;
  formattedRange: string;
  baseCurrency: string;
  metrics: CashflowMetrics;
  categoryBreakdown: CategoryExpenseBreakdown[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  convertFn?: (
    amount: number,
    fromCurrency: string,
    exchangeRate?: number | null,
  ) => number;
  formatFn?: (amount: number, currency: string) => string;
}

export class MarkdownExportService {
  /**
   * Sanitizes a string for safe embedding inside a Markdown table cell.
   * Replaces pipes and collapses newlines to avoid breaking table layout.
   */
  static sanitizeMarkdownCell(val: string | null | undefined): string {
    if (!val) return '';
    return val.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ').trim();
  }

  /**
   * Generates a structured Markdown context file optimized for LLM consumption (Gemini, Claude, ChatGPT).
   */
  static generateMarkdown(data: MarkdownReportData): string {
    const {
      rangeLabel,
      formattedRange,
      baseCurrency,
      metrics,
      categoryBreakdown,
      transactions,
      accounts,
      categories,
      convertFn,
      formatFn,
    } = data;

    const accountsMap = new Map<string, Account>(
      accounts.map((a) => [a.id, a]),
    );
    const categoriesMap = new Map<string, Category>(
      categories.map((c) => [c.id, c]),
    );

    const emissionDate = DateFormatter.format(
      new Date(),
      'DD [de] MMMM [de] YYYY, HH:mm',
    );

    const fmt = (amount: number, curr: string) =>
      formatFn ? formatFn(amount, curr) : `${amount.toFixed(2)} ${curr}`;

    const formattedIncome = fmt(metrics.totalIncome, baseCurrency);
    const formattedExpenses = fmt(metrics.totalExpenses, baseCurrency);
    const formattedNetSavings = fmt(metrics.netSavings, baseCurrency);
    const savingsStatus = metrics.isPositive
      ? 'Superávit / Ahorro positivo'
      : 'Déficit / Gastos mayores a ingresos';

    // 1. Header & AI instructions
    const lines: string[] = [
      '# Contexto Financiero Personal - Reporte Tique',
      '',
      '> **Instrucciones para el Asistente de IA (Gemini / Claude / ChatGPT):**',
      '> Actúa como un asesor financiero personal experto, empático, claro y pedagógico.',
      '> - Este documento contiene el reporte financiero real de un usuario para el período indicado.',
      '> - Explica las conclusiones con un lenguaje cotidiano, amigable y comprensible, sin tecnicismos innecesarios.',
      '> - Si el ahorro fue positivo, reconoce el buen hábito financiero; si el balance fue negativo o ajustado, ofrece recomendaciones prácticas y constructivas sin juzgar.',
      '> - Analiza la distribución de gastos, identifica posibles gastos hormiga o patrones relevantes y sugiere oportunidades realistas de ahorro.',
      '> - Responde a las dudas del usuario basándote con rigor en los datos que figuran a continuación.',
      '',
      '---',
      '',
      '## 1. Información General',
      `- **Periodo analizado:** ${formattedRange} (${rangeLabel})`,
      `- **Moneda base:** ${baseCurrency}`,
      `- **Fecha de emisión:** ${emissionDate}`,
      `- **Total de movimientos:** ${transactions.length}`,
      '',
      '---',
      '',
      '## 2. Resumen Ejecutivo de Flujo de Caja',
      `| Métrica | Monto (${baseCurrency}) | Detalle |`,
      '| :--- | :--- | :--- |',
      `| **Ingresos Totales** | ${formattedIncome} | Entradas efectivas registradas en el período |`,
      `| **Gastos Totales** | ${formattedExpenses} | Salidas y compras registradas en el período |`,
      `| **Balance Neto (Ahorro)** | ${formattedNetSavings} | ${savingsStatus} |`,
      `| **Tasa de Ahorro** | ${metrics.savingsRate}% | Porcentaje de ingresos ahorrados |`,
      '',
      '---',
      '',
      '## 3. Distribución de Gastos por Categoría',
    ];

    // 2. Category Breakdown
    if (categoryBreakdown.length > 0) {
      lines.push(
        `| Categoría | Monto Gastado (${baseCurrency}) | % del Total |`,
      );
      lines.push('| :--- | :--- | :--- |');

      categoryBreakdown.forEach((cat) => {
        const catName = this.sanitizeMarkdownCell(cat.categoryName);
        const amountStr = cat.formattedAmount || fmt(cat.amount, baseCurrency);
        lines.push(`| ${catName} | ${amountStr} | ${cat.percentage}% |`);
      });
    } else {
      lines.push('*No se registraron gastos en este período.*');
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 3. Transactions Detail
    lines.push('## 4. Detalle de Movimientos del Período');
    if (transactions.length > 0) {
      lines.push(
        `| Fecha | Tipo | Categoría | Cuenta | Monto Original | Monto (${baseCurrency}) | Nota / Detalle |`,
      );
      lines.push('| :--- | :--- | :--- | :--- | :--- | :--- | :--- |');

      transactions.forEach((tx) => {
        const dateStr = DateFormatter.format(tx.date, 'YYYY-MM-DD');
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
        const currency = account ? account.currency : baseCurrency;

        const originalAmountStr = fmt(tx.amount, currency);

        const convertedAmount = convertFn
          ? convertFn(tx.amount, currency, tx.exchangeRate)
          : tx.amount;
        const convertedAmountStr = fmt(convertedAmount, baseCurrency);

        const noteStr = this.sanitizeMarkdownCell(tx.note);

        lines.push(
          `| ${dateStr} | ${typeStr} | ${this.sanitizeMarkdownCell(category)} | ${this.sanitizeMarkdownCell(accountName)} | ${originalAmountStr} | ${convertedAmountStr} | ${noteStr} |`,
        );
      });
    } else {
      lines.push('*No se registraron movimientos en este período.*');
    }

    lines.push('');
    lines.push('---');
    lines.push('');

    // 4. Suggested Prompts
    lines.push('## 5. Preguntas Sugeridas para hacerle a la IA');
    lines.push(
      'Puedes copiar y pegar cualquiera de estas preguntas en tu chat con Gemini:',
    );
    lines.push(
      '1. *"¿Cómo resumirías mi salud financiera durante este período en 3 puntos clave?"*',
    );
    lines.push(
      '2. *"¿Cuáles fueron mis mayores gastos y qué oportunidades de ahorro detectas?"*',
    );
    lines.push(
      '3. *"¿Identificas algún gasto hormiga, recurrente o atípico en la lista de movimientos?"*',
    );
    lines.push(
      '4. *"Considerando mis ingresos y gastos, ¿qué meta de ahorro realista me recomiendas para el próximo mes?"*',
    );
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Triggers a browser download of the generated Markdown file.
   */
  static downloadMarkdown(markdownContent: string, filename?: string): void {
    if (typeof window === 'undefined' || typeof document === 'undefined')
      return;

    const actualFilename =
      filename ||
      `tique_contexto_ia_${new Date().toISOString().slice(0, 10)}.md`;

    const blob = new Blob([markdownContent], {
      type: 'text/markdown;charset=utf-8;',
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
