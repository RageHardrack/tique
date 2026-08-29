import { describe, expect, it } from 'vitest';
import { DateFormatter } from './DateFormatter';

describe('DateFormatter Service (dayjs)', () => {
  it('formats YYYY-MM-DD date string without previous-day shift', () => {
    const formatted = DateFormatter.format('2026-08-29', 'DD/MM/YYYY');
    expect(formatted).toBe('29/08/2026');
  });

  it('formats full ISO date string correctly', () => {
    const formatted = DateFormatter.format('2026-08-29T15:00:00.000Z', 'DD MMM YYYY');
    expect(formatted).toContain('2026');
  });

  it('converts to input date YYYY-MM-DD format', () => {
    expect(DateFormatter.toInputDate('2026-08-29T10:00:00.000Z')).toBe('2026-08-29');
    expect(DateFormatter.toInputDate('2026-08-29')).toBe('2026-08-29');
  });

  it('converts date to safe ISO string without losing day', () => {
    const iso = DateFormatter.toIsoString('2026-08-29');
    expect(iso).toBe('2026-08-29T12:00:00.000Z');
  });

  it('formats date range cleanly', () => {
    const range = DateFormatter.formatRange('2026-08-01', '2026-08-31', 'DD/MM/YYYY');
    expect(range).toBe('01/08/2026 - 31/08/2026');
  });
});
