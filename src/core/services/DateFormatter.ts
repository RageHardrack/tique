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
   * Formats any date (ISO string, YYYY-MM-DD, Date object) into a localized Spanish string.
   * Guaranteed to preserve the intended calendar day across all timezones.
   */
  static format(
    date: string | Date | null | undefined,
    formatStr = 'DD MMM YYYY',
  ): string {
    if (!date) return '';

    if (typeof date === 'string') {
      const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const [, year, month, day] = match;
        return dayjs(
          new Date(Number(year), Number(month) - 1, Number(day)),
        ).format(formatStr);
      }
      return dayjs(date).format(formatStr);
    }

    if (date instanceof Date) {
      if (
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0
      ) {
        return dayjs.utc(date).format(formatStr);
      }
      return dayjs(date).format(formatStr);
    }

    return dayjs(date).format(formatStr);
  }

  /**
   * Formats a date for standard HTML date inputs (YYYY-MM-DD).
   */
  static toInputDate(
    date: string | Date | null | undefined = new Date(),
  ): string {
    if (!date) return dayjs().format('YYYY-MM-DD');

    if (typeof date === 'string') {
      const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}`;
      }
      return dayjs(date).format('YYYY-MM-DD');
    }

    if (date instanceof Date) {
      if (
        date.getUTCHours() === 0 &&
        date.getUTCMinutes() === 0 &&
        date.getUTCSeconds() === 0
      ) {
        return dayjs.utc(date).format('YYYY-MM-DD');
      }
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    return dayjs(date).format('YYYY-MM-DD');
  }

  /**
   * Converts a date string or Date to a safe ISO string.
   */
  static toIsoString(date: string | Date): string {
    if (typeof date === 'string') {
      const match = date.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        return `${match[1]}-${match[2]}-${match[3]}T12:00:00.000Z`;
      }
      return dayjs(date).toISOString();
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
    const start = this.format(startDate, formatStr);
    const end = this.format(endDate, formatStr);
    return `${start} - ${end}`;
  }
}

export { dayjs };
