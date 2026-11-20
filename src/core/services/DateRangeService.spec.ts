import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { DateRangeService } from './DateRangeService';

describe('DateRangeService - Time Window Calculations', () => {
  // Reference date: 2026-08-25
  const refDate = new Date(2026, 7, 25); // Month 7 is August

  it('should calculate monthly range for current month', () => {
    const range = DateRangeService.calculateRange('MONTHLY', undefined, undefined, refDate);
    expect(range.startDate.getFullYear()).toBe(2026);
    expect(range.startDate.getMonth()).toBe(7); // August
    expect(range.startDate.getDate()).toBe(1);

    expect(range.endDate.getFullYear()).toBe(2026);
    expect(range.endDate.getMonth()).toBe(7);
    expect(range.endDate.getDate()).toBe(31);
    expect(range.label).toBe('Mensual (Este Mes)');
  });

  it('should calculate bi-monthly range (2 months)', () => {
    const range = DateRangeService.calculateRange('BI_MONTHLY', undefined, undefined, refDate);
    expect(range.startDate.getMonth()).toBe(6); // July
    expect(range.startDate.getDate()).toBe(1);

    expect(range.endDate.getMonth()).toBe(7); // August
    expect(range.endDate.getDate()).toBe(31);
    expect(range.label).toBe('Bimestral (2 Meses)');
  });

  it('should calculate quarterly range (3 months / quarter)', () => {
    const range = DateRangeService.calculateRange('QUARTERLY', undefined, undefined, refDate);
    expect(range.startDate.getMonth()).toBe(5); // June
    expect(range.startDate.getDate()).toBe(1);

    expect(range.endDate.getMonth()).toBe(7); // August
    expect(range.endDate.getDate()).toBe(31);
    expect(range.label).toBe('Trimestral (Cuarto de Año)');
  });

  it('should calculate semi-annual range (6 months)', () => {
    const range = DateRangeService.calculateRange('SEMI_ANNUAL', undefined, undefined, refDate);
    expect(range.startDate.getMonth()).toBe(2); // March
    expect(range.startDate.getDate()).toBe(1);

    expect(range.endDate.getMonth()).toBe(7); // August
    expect(range.endDate.getDate()).toBe(31);
    expect(range.label).toBe('Semestral (6 Meses)');
  });

  it('should calculate full year range', () => {
    const range = DateRangeService.calculateRange('FULL_YEAR', undefined, undefined, refDate);
    expect(range.startDate.getFullYear()).toBe(2026);
    expect(range.startDate.getMonth()).toBe(0); // Jan
    expect(range.startDate.getDate()).toBe(1);

    expect(range.endDate.getFullYear()).toBe(2026);
    expect(range.endDate.getMonth()).toBe(11); // Dec
    expect(range.endDate.getDate()).toBe(31);
    expect(range.label).toBe('Año Completo (2026)');
  });

  it('should format custom date range correctly', () => {
    const range = DateRangeService.calculateRange(
      'CUSTOM',
      '2026-05-10',
      '2026-06-20',
      refDate,
    );
    expect(range.startDate.getMonth()).toBe(4); // May
    expect(range.startDate.getDate()).toBe(10);
    expect(range.endDate.getMonth()).toBe(5); // June
    expect(range.endDate.getDate()).toBe(20);
    expect(range.label).toBe('Rango Personalizado');
  });

  it('should format toInputDateString as YYYY-MM-DD', () => {
    const d = new Date(2026, 7, 5);
    expect(DateRangeService.toInputDateString(d)).toBe('2026-08-05');
  });

  describe('containsDate in a negative UTC offset timezone', () => {
    const originalTz = process.env.TZ;
    const october = () =>
      DateRangeService.calculateRange('MONTHLY', undefined, undefined, new Date(2026, 9, 15));

    beforeAll(() => {
      process.env.TZ = 'America/Lima';
    });

    afterAll(() => {
      process.env.TZ = originalTz;
    });

    it('keeps UTC-midnight dates on their calendar day at the range edges', () => {
      expect(DateRangeService.containsDate(october(), '2026-10-01T00:00:00.000Z')).toBe(true);
      expect(DateRangeService.containsDate(october(), '2026-10-31T00:00:00.000Z')).toBe(true);
      expect(DateRangeService.containsDate(october(), '2026-11-01T00:00:00.000Z')).toBe(false);
      expect(DateRangeService.containsDate(october(), '2026-09-30T00:00:00.000Z')).toBe(false);
    });

    it('reads timestamps with a time in local time', () => {
      // 2026-11-01T03:00Z is 2026-10-31 22:00 in Lima.
      expect(DateRangeService.containsDate(october(), '2026-11-01T03:00:00.000Z')).toBe(true);
      // 2026-10-01T03:00Z is 2026-09-30 22:00 in Lima.
      expect(DateRangeService.containsDate(october(), '2026-10-01T03:00:00.000Z')).toBe(false);
    });
  });
});
