export type TimeWindowPreset =
  | 'MONTHLY'
  | 'BI_MONTHLY'
  | 'QUARTERLY'
  | 'SEMI_ANNUAL'
  | 'FULL_YEAR'
  | 'CUSTOM';

export interface DateRangeResult {
  preset: TimeWindowPreset;
  startDate: Date;
  endDate: Date;
  formattedRange: string;
  label: string;
}

export class DateRangeService {
  /**
   * Calculates the exact start and end Date for a given preset relative to a reference date.
   */
  static calculateRange(
    preset: TimeWindowPreset,
    customStart?: string | Date,
    customEnd?: string | Date,
    referenceDate: Date = new Date(),
  ): DateRangeResult {
    const ref = new Date(referenceDate);
    let start: Date;
    let end: Date;
    let label = '';

    switch (preset) {
      case 'MONTHLY': {
        // First day to last day of current month
        start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
        end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
        label = 'Mensual (Este Mes)';
        break;
      }
      case 'BI_MONTHLY': {
        // Current month and the previous 1 month (2 months total)
        start = new Date(ref.getFullYear(), ref.getMonth() - 1, 1, 0, 0, 0, 0);
        end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
        label = 'Bimestral (2 Meses)';
        break;
      }
      case 'QUARTERLY': {
        // Current quarter or last 3 months
        start = new Date(ref.getFullYear(), ref.getMonth() - 2, 1, 0, 0, 0, 0);
        end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
        label = 'Trimestral (Cuarto de Año)';
        break;
      }
      case 'SEMI_ANNUAL': {
        // Last 6 months
        start = new Date(ref.getFullYear(), ref.getMonth() - 5, 1, 0, 0, 0, 0);
        end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
        label = 'Semestral (6 Meses)';
        break;
      }
      case 'FULL_YEAR': {
        // Jan 1st to Dec 31st of current year
        start = new Date(ref.getFullYear(), 0, 1, 0, 0, 0, 0);
        end = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);
        label = `Año Completo (${ref.getFullYear()})`;
        break;
      }
      case 'CUSTOM': {
        if (typeof customStart === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(customStart)) {
          const [y, m, d] = customStart.split('-').map(Number);
          start = new Date(y, m - 1, d, 0, 0, 0, 0);
        } else if (customStart) {
          start = new Date(customStart);
          start.setHours(0, 0, 0, 0);
        } else {
          start = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
        }

        if (typeof customEnd === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(customEnd)) {
          const [y, m, d] = customEnd.split('-').map(Number);
          end = new Date(y, m - 1, d, 23, 59, 59, 999);
        } else if (customEnd) {
          end = new Date(customEnd);
          end.setHours(23, 59, 59, 999);
        } else {
          end = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
        }
        label = 'Rango Personalizado';
        break;
      }
    }

    const formattedRange = this.formatDateRange(start, end);

    return {
      preset,
      startDate: start,
      endDate: end,
      formattedRange,
      label,
    };
  }

  /**
   * Formats start and end dates in a clean, human-readable Spanish locale string.
   */
  static formatDateRange(start: Date, end: Date): string {
    const formatOpts: Intl.DateTimeFormatOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    };

    const startStr = start.toLocaleDateString('es-ES', formatOpts);
    const endStr = end.toLocaleDateString('es-ES', formatOpts);

    return `${startStr} - ${endStr}`;
  }

  /**
   * Formats a date to YYYY-MM-DD for standard date input elements.
   */
  static toInputDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
