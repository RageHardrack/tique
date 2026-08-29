import dayjs from 'dayjs';
import 'dayjs/locale/es';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import relativeTime from 'dayjs/plugin/relativeTime';
import utc from 'dayjs/plugin/utc';

dayjs.extend(customParseFormat);
dayjs.extend(relativeTime);
dayjs.extend(utc);
dayjs.locale('es');

export class DateFormatter {
  /**
   * Formats any date (string, Date, timestamp) into a localized Spanish string (e.g. "29 ago 2026").
   * Avoids UTC timezone shifts for date-only strings (YYYY-MM-DD).
   */
  static format(
    date: string | Date | null | undefined,
    formatStr = 'DD MMM YYYY',
  ): string {
    if (!date) return '';

    // If it's a date-only string like YYYY-MM-DD, parse without UTC timezone offset
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      return dayjs(date.trim()).format(formatStr);
    }

    return dayjs(date).format(formatStr);
  }

  /**
   * Formats a date for standard HTML date inputs (YYYY-MM-DD).
   */
  static toInputDate(date: string | Date | null | undefined = new Date()): string {
    if (!date) return dayjs().format('YYYY-MM-DD');

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}/.test(date.trim())) {
      return date.trim().slice(0, 10);
    }

    return dayjs(date).format('YYYY-MM-DD');
  }

  /**
   * Converts a date string or Date to a safe ISO string.
   */
  static toIsoString(date: string | Date): string {
    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date.trim())) {
      // Set to noon UTC to prevent accidental previous-day shift across any timezone
      return `${date.trim()}T12:00:00.000Z`;
    }
    return dayjs(date).toISOString();
  }

  /**
   * Formats relative time (e.g. "hace 2 días", "en 3 días").
   */
  static fromNow(date: string | Date): string {
    return dayjs(date).fromNow();
  }

  /**
   * Formats a date range cleanly in Spanish (e.g. "01 ago 2026 - 31 ago 2026").
   */
  static formatRange(
    startDate: string | Date,
    endDate: string | Date,
    formatStr = 'D MMM YYYY',
  ): string {
    const start = dayjs(startDate).format(formatStr);
    const end = dayjs(endDate).format(formatStr);
    return `${start} - ${end}`;
  }
}

export { dayjs };
