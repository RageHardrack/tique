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

  it('converts date to safe noon ISO string', () => {
    expect(DateFormatter.toIsoString('2026-09-06')).toBe('2026-09-06T12:00:00.000Z');
  });

  it('formats date range cleanly preserving calendar dates', () => {
    const range = DateFormatter.formatRange('2026-09-01T00:00:00.000Z', '2026-09-30T00:00:00.000Z', 'DD/MM/YYYY');
    expect(range).toBe('01/09/2026 - 30/09/2026');
  });
});
