import { describe, expect, it } from 'vitest';
import { DateFormatter } from './DateFormatter';

describe('DateFormatter Service (dayjs & Timezone Protection)', () => {
  it('formats YYYY-MM-DD date string without previous-day shift', () => {
    expect(DateFormatter.format('2026-09-06', 'DD/MM/YYYY')).toBe('06/09/2026');
    expect(DateFormatter.format('2026-09-06', 'DD MMM YYYY')).toBe('06 sep 2026');
  });

  it('formats ISO midnight string (T00:00:00.000Z) preserving the exact calendar day', () => {
    expect(DateFormatter.format('2026-09-06T00:00:00.000Z', 'DD/MM/YYYY')).toBe('06/09/2026');
    expect(DateFormatter.format('2026-09-06T00:00:00.000Z', 'DD MMM YYYY')).toBe('06 sep 2026');
  });

  it('formats ISO noon string (T12:00:00.000Z) correctly', () => {
    expect(DateFormatter.format('2026-09-06T12:00:00.000Z', 'DD/MM/YYYY')).toBe('06/09/2026');
    expect(DateFormatter.format('2026-09-06T12:00:00.000Z', 'DD MMM YYYY')).toBe('06 sep 2026');
  });

  it('converts ISO midnight to input date YYYY-MM-DD format without losing day', () => {
    expect(DateFormatter.toInputDate('2026-09-06T00:00:00.000Z')).toBe('2026-09-06');
    expect(DateFormatter.toInputDate('2026-09-06')).toBe('2026-09-06');
    expect(DateFormatter.toInputDate('2026-09-06T23:59:59.999Z')).toBe('2026-09-06');
  });

  it('converts date to safe noon ISO string for other days and local timestamp for today', () => {
    const todayStr = DateFormatter.toInputDate(new Date());
    const isoToday = DateFormatter.toIsoString(todayStr);
    expect(isoToday).toContain('T');

    const pastIso = DateFormatter.toIsoString('2026-09-06');
    expect(pastIso).toBe('2026-09-06T12:00:00.000Z');
  });

  it('formats date range cleanly preserving calendar dates', () => {
    const range = DateFormatter.formatRange('2026-09-01T00:00:00.000Z', '2026-09-30T00:00:00.000Z', 'DD/MM/YYYY');
    expect(range).toBe('01/09/2026 - 30/09/2026');
  });

  it('formats timestamps recorded at night in local timezone without jumping to next UTC day', () => {
    // E.g. Aug 29 at 21:00 UTC-5 is Aug 30 02:00 UTC
    const localAug29Night = new Date(2026, 7, 29, 21, 0, 0); // 29 Aug 21:00 in current environment
    const isoString = localAug29Night.toISOString();

    expect(DateFormatter.format(isoString, 'DD/MM/YYYY')).toBe('29/08/2026');
    expect(DateFormatter.format(isoString, 'DD MMM YYYY')).toBe('29 ago 2026');
    expect(DateFormatter.toInputDate(isoString)).toBe('2026-08-29');
  });
});
