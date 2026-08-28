import type { Account } from '../entities/Account';
import type { Category } from '../entities/Category';
import type { Transaction } from '../entities/Transaction';
import type { CategoryExpenseBreakdown, CashflowMetrics } from './AnalyticsService';

export interface PdfReportData {
  rangeLabel: string;
  formattedRange: string;
  baseCurrency: string;
  metrics: CashflowMetrics;
  categoryBreakdown: CategoryExpenseBreakdown[];
  transactions: Transaction[];
  accounts: Account[];
  categories: Category[];
  formatFn: (amount: number, currency: string) => string;
}

export class PdfExportService {
  /**
   * Generates a clean, standalone, printable HTML document representing the financial report.
   */
  static generateReportHtml(data: PdfReportData): string {
    const {
      rangeLabel,
      formattedRange,
      baseCurrency,
      metrics,
      categoryBreakdown,
      transactions,
      accounts,
      categories,
      formatFn,
    } = data;

    const accountsMap = new Map<string, Account>(accounts.map((a) => [a.id, a]));
    const categoriesMap = new Map<string, Category>(categories.map((c) => [c.id, c]));

    const emissionDate = new Date().toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const categoryRows =
      categoryBreakdown.length > 0
        ? categoryBreakdown
            .map(
              (cat) => `
          <tr>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0;">
              <span style="display: inline-block; width: 10px; height: 10px; border-radius: 50%; background-color: ${cat.color}; margin-right: 6px;"></span>
              ${cat.categoryName}
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">
              ${cat.formattedAmount}
            </td>
            <td style="padding: 8px 12px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #64748b;">
              ${cat.percentage}%
            </td>
          </tr>
        `,
            )
            .join('')
        : `<tr><td colspan="3" style="padding: 12px; text-align: center; color: #94a3b8;">No se registraron gastos en este periodo</td></tr>`;

    const txRows =
      transactions.length > 0
        ? transactions
            .map((tx) => {
              const d = new Date(tx.date).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
              });
              const typeLabel =
                tx.type === 'INCOME'
                  ? '<span style="color: #059669; font-weight: bold;">Ingreso</span>'
                  : tx.type === 'EXPENSE'
                    ? '<span style="color: #dc2626; font-weight: bold;">Gasto</span>'
                    : '<span style="color: #2563eb; font-weight: bold;">Transferencia</span>';
              const catName = tx.categoryId
                ? categoriesMap.get(tx.categoryId)?.name || 'General'
                : 'General';
              const accName = accountsMap.get(tx.accountId)?.name || 'Cuenta';
              const formattedAmt = formatFn(
                tx.amount,
                accountsMap.get(tx.accountId)?.currency || baseCurrency,
              );

              return `
            <tr>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px;">${d}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px;">${typeLabel}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px;">${catName}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px;">${accName}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; color: #475569;">${tx.note || '-'}</td>
              <td style="padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; text-align: right; font-weight: bold;">${formattedAmt}</td>
            </tr>
          `;
            })
            .join('')
        : `<tr><td colspan="6" style="padding: 12px; text-align: center; color: #94a3b8;">Sin movimientos en el periodo</td></tr>`;

    return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Reporte Financiero — Tique</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      line-height: 1.5;
      margin: 0;
      padding: 24px;
      background: #ffffff;
    }
    @media print {
      body {
        padding: 0;
      }
      @page {
        margin: 1.5cm;
      }
    }
  </style>
</head>
<body>
  <!-- Header / Letterhead -->
  <div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #1e293b; padding-bottom: 16px; margin-bottom: 24px;">
    <div>
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 24px; font-weight: 900; color: #1e3a8a; letter-spacing: -0.5px;">TIQUE</span>
        <span style="background: #f1f5f9; color: #475569; font-size: 10px; font-weight: bold; padding: 2px 8px; border-radius: 9999px; text-transform: uppercase;">Informe Oficial</span>
      </div>
      <p style="margin: 4px 0 0 0; font-size: 12px; color: #64748b;">Gestión Patrimonial & Finanzas Personales</p>
    </div>
    <div style="text-align: right; font-size: 11px; color: #64748b;">
      <p style="margin: 0;"><strong>Periodo:</strong> ${rangeLabel}</p>
      <p style="margin: 2px 0 0 0;"><strong>Fechas:</strong> ${formattedRange}</p>
      <p style="margin: 2px 0 0 0;"><strong>Moneda Base:</strong> ${baseCurrency}</p>
      <p style="margin: 2px 0 0 0;"><strong>Emisión:</strong> ${emissionDate}</p>
    </div>
  </div>

  <!-- Executive Summary Cards -->
  <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px;">
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
      <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Ingresos Totales</div>
      <div style="font-size: 18px; font-weight: 800; color: #059669; margin-top: 4px;">${formatFn(metrics.totalIncome, baseCurrency)}</div>
    </div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
      <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Gastos Totales</div>
      <div style="font-size: 18px; font-weight: 800; color: #dc2626; margin-top: 4px;">${formatFn(metrics.totalExpenses, baseCurrency)}</div>
    </div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
      <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Balance Neto</div>
      <div style="font-size: 18px; font-weight: 800; color: ${metrics.isPositive ? '#2563eb' : '#d97706'}; margin-top: 4px;">${formatFn(metrics.netSavings, baseCurrency)}</div>
    </div>
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
      <div style="font-size: 10px; font-weight: bold; text-transform: uppercase; color: #64748b;">Tasa de Ahorro</div>
      <div style="font-size: 18px; font-weight: 800; color: #1e3a8a; margin-top: 4px;">${metrics.savingsRate}%</div>
    </div>
  </div>

  <!-- Category Breakdown Section -->
  <div style="margin-bottom: 24px;">
    <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 0 0 10px 0; text-transform: uppercase; letter-spacing: 0.5px;">
      Distribución de Gastos por Categoría
    </h3>
    <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
      <thead>
        <tr style="background: #f1f5f9; text-align: left; color: #475569;">
          <th style="padding: 8px 12px; border-bottom: 2px solid #cbd5e1;">Categoría</th>
          <th style="padding: 8px 12px; border-bottom: 2px solid #cbd5e1; text-align: right;">Total Gastado</th>
          <th style="padding: 8px 12px; border-bottom: 2px solid #cbd5e1; text-align: right;">% del Total</th>
        </tr>
      </thead>
      <tbody>
        ${categoryRows}
      </tbody>
    </table>
  </div>

  <!-- Transactions Detail Section -->
  <div>
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
      <h3 style="font-size: 14px; font-weight: bold; color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">
        Detalle de Movimientos (${transactions.length})
      </h3>
    </div>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f1f5f9; text-align: left; color: #475569; font-size: 11px;">
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Fecha</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Tipo</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Categoría</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Cuenta</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1;">Nota</th>
          <th style="padding: 8px 10px; border-bottom: 2px solid #cbd5e1; text-align: right;">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${txRows}
      </tbody>
    </table>
  </div>

  <!-- Footer Notice -->
  <div style="margin-top: 32px; border-top: 1px solid #e2e8f0; padding-top: 12px; text-align: center; font-size: 10px; color: #94a3b8;">
    Generado automáticamente por Tique — Plataforma de Gestión Patrimonial & Finanzas Personales.
  </div>
</body>
</html>
    `.trim();
  }

  /**
   * Opens a hidden printable iframe or window to trigger browser's print to PDF dialog.
   */
  static exportToPdf(data: PdfReportData): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;

    const htmlContent = this.generateReportHtml(data);

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const iframeDoc = iframe.contentWindow?.document || iframe.contentDocument;
    if (!iframeDoc) {
      document.body.removeChild(iframe);
      return;
    }

    iframeDoc.open();
    iframeDoc.write(htmlContent);
    iframeDoc.close();

    // Wait for assets/fonts to load before printing
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 250);
  }
}
