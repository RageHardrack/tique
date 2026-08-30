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
   * Formats any date (ISO string, timestamp, YYYY-MM-DD, Date object) into a localized Spanish string.
   * - If date is an ISO timestamp with time (e.g. 9:00 PM local stored in UTC), it renders in the user's local timezone.
   * - If date is a pure YYYY-MM-DD string or legacy UTC midnight, it preserves the exact calendar day.
   */
  static format(
    date: string | Date | null | undefined,
    formatStr = 'DD MMM YYYY',
  ): string {
    if (!date) return '';

    if (typeof date === 'string') {
      const trimmed = date.trim();
      // Pure calendar date string: YYYY-MM-DD
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split('-').map(Number);
        return dayjs(new Date(year, month - 1, day)).format(formatStr);
      }

      // Legacy UTC midnight timestamp (T00:00:00.000Z without hours)
      if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z?$/.test(trimmed)) {
        return dayjs.utc(trimmed).format(formatStr);
      }

      // Full timestamp with time: format in user's local browser timezone
      return dayjs(trimmed).format(formatStr);
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
   * Formats a date for standard HTML date inputs (YYYY-MM-DD) in local timezone.
   */
  static toInputDate(
    date: string | Date | null | undefined = new Date(),
  ): string {
    if (!date) return dayjs().format('YYYY-MM-DD');

    if (typeof date === 'string') {
      const trimmed = date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return trimmed;
      }
      if (/^\d{4}-\d{2}-\d{2}T00:00:00(\.000)?Z?$/.test(trimmed)) {
        return dayjs.utc(trimmed).format('YYYY-MM-DD');
      }
      return dayjs(trimmed).format('YYYY-MM-DD');
    }

    if (date instanceof Date) {
      return dayjs(date).format('YYYY-MM-DD');
    }

    return dayjs(date).format('YYYY-MM-DD');
  }

  /**
   * Converts a date string or Date to a safe ISO string.
   * If given a YYYY-MM-DD string:
   * - If it matches today's local date, attaches current local time (hours, minutes, seconds).
   * - Otherwise, uses midday (12:00:00) local time to safely remain on that calendar date in all timezones.
   */
  static toIsoString(date: string | Date): string {
    if (typeof date === 'string') {
      const trimmed = date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        const [year, month, day] = trimmed.split('-').map(Number);
        const now = new Date();
        const isToday =
          now.getFullYear() === year &&
          now.getMonth() === month - 1 &&
          now.getDate() === day;

        if (isToday) {
          return new Date(
            year,
            month - 1,
            day,
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds(),
          ).toISOString();
        }

        return new Date(Date.UTC(year, month - 1, day, 12, 0, 0)).toISOString();
      }
      return dayjs(trimmed).toISOString();
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
