import type {
  TransactionTemplate,
  TransactionTemplateDraft,
  TransactionTemplateInput,
} from '../entities/TransactionTemplate';

/**
 * Pure rules for transaction templates: the S7 quick-add ordering, the S3/S4
 * validation messages the form shows before anything is submitted, and the S4
 * "prefill, never mutate" draft the quick-add sheet edits.
 */
export class TransactionTemplateService {
  /**
   * S7: most recently used first, never-used templates at the end, and a stable
   * name ordering inside each group so the quick-add list does not shuffle.
   */
  static sortByUsage(templates: TransactionTemplate[]): TransactionTemplate[] {
    return [...templates].sort((a, b) => {
      const byUsage =
        TransactionTemplateService.toTime(b.lastUsedAt) -
        TransactionTemplateService.toTime(a.lastUsedAt);
      if (byUsage !== 0) return byUsage;

      return a.name.localeCompare(b.name, 'es', { sensitivity: 'base' });
    });
  }

  /**
   * S3/S4 form rules, mirrored from the API so the user sees them before the
   * request is sent. An empty array means the input is acceptable.
   */
  static validate(input: TransactionTemplateInput): string[] {
    const issues: string[] = [];

    if (!input.name.trim()) {
      issues.push('El nombre de la plantilla es obligatorio.');
    }

    if (!input.accountId) {
      issues.push('Selecciona la cuenta origen.');
    }

    if (input.type === 'TRANSFER') {
      if (!input.destinationAccountId) {
        issues.push('Una transferencia necesita una cuenta destino.');
      } else if (input.destinationAccountId === input.accountId) {
        issues.push('La cuenta destino debe ser diferente a la cuenta origen.');
      }
    } else if (input.destinationAccountId) {
      issues.push('Solo las transferencias tienen cuenta destino.');
    }

    if (
      input.defaultAmount !== null &&
      input.defaultAmount !== undefined &&
      (!Number.isFinite(input.defaultAmount) || input.defaultAmount <= 0)
    ) {
      issues.push('El monto por defecto debe ser mayor a 0.');
    }

    return issues;
  }

  /**
   * S4/S5: an editable copy of the template for the quick-add sheet. The amount
   * override wins when it is a positive number; the template itself is never
   * touched, so using it does not change what it stores.
   */
  static buildDraft(
    template: TransactionTemplate,
    overrides: { amount?: number | null } = {},
  ): TransactionTemplateDraft {
    const override = overrides.amount;
    const stored = template.defaultAmount ?? null;
    const amount =
      override !== undefined &&
      override !== null &&
      Number.isFinite(override) &&
      override > 0
        ? override
        : stored;

    return {
      type: template.type,
      accountId: template.accountId,
      destinationAccountId:
        template.type === 'TRANSFER'
          ? (template.destinationAccountId ?? null)
          : null,
      categoryId: template.categoryId ?? null,
      note: template.note ?? null,
      amount,
    };
  }

  /** Missing or invalid timestamps rank last (never-used group). */
  private static toTime(value?: string | null): number {
    if (!value) return -1;
    const time = new Date(value).getTime();
    return Number.isNaN(time) ? -1 : time;
  }
}
