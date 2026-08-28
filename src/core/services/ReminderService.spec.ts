import { describe, expect, it } from 'vitest';
import { ReminderService, type SubscriptionReminder } from './ReminderService';
import type { Subscription } from '../entities/Subscription';

describe('ReminderService', () => {
  const baseDate = new Date('2026-08-26T12:00:00.000Z');

  const mockSub = (overrides: Partial<Subscription> = {}): Subscription => ({
    id: 'sub-1',
    userId: 'usr-1',
    accountId: 'acc-1',
    categoryId: 'cat-1',
    name: 'Netflix 4K',
    amount: 45,
    currency: 'PEN',
    frequency: 'MONTHLY',
    nextDueDate: '2026-08-26T00:00:00.000Z',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  });

  describe('calculateDaysRemaining', () => {
    it('returns 0 when due date matches today', () => {
      const days = ReminderService.calculateDaysRemaining('2026-08-26', baseDate);
      expect(days).toBe(0);
    });

    it('returns positive integer for future dates', () => {
      const days = ReminderService.calculateDaysRemaining('2026-08-29', baseDate);
      expect(days).toBe(3);
    });

    it('returns negative integer for past dates', () => {
      const days = ReminderService.calculateDaysRemaining('2026-08-24', baseDate);
      expect(days).toBe(-2);
    });
  });

  describe('evaluateUrgency', () => {
    it('classifies days < 0 as OVERDUE', () => {
      expect(ReminderService.evaluateUrgency(-1)).toBe('OVERDUE');
      expect(ReminderService.evaluateUrgency(-5)).toBe('OVERDUE');
    });

    it('classifies days = 0 as DUE_TODAY', () => {
      expect(ReminderService.evaluateUrgency(0)).toBe('DUE_TODAY');
    });

    it('classifies 1 <= days <= 3 as DUE_SOON', () => {
      expect(ReminderService.evaluateUrgency(1)).toBe('DUE_SOON');
      expect(ReminderService.evaluateUrgency(3)).toBe('DUE_SOON');
    });

    it('classifies days > 3 as NORMAL', () => {
      expect(ReminderService.evaluateUrgency(4)).toBe('NORMAL');
      expect(ReminderService.evaluateUrgency(15)).toBe('NORMAL');
    });
  });

  describe('getUrgencyBadgeText', () => {
    it('formats DUE_TODAY correctly', () => {
      expect(ReminderService.getUrgencyBadgeText(0, 'DUE_TODAY')).toBe('Vence hoy');
    });

    it('formats DUE_SOON for 1 day as Vence mañana', () => {
      expect(ReminderService.getUrgencyBadgeText(1, 'DUE_SOON')).toBe('Vence mañana');
    });

    it('formats DUE_SOON for multiple days', () => {
      expect(ReminderService.getUrgencyBadgeText(2, 'DUE_SOON')).toBe('Vence en 2 días');
    });

    it('formats OVERDUE for 1 day as Venció ayer', () => {
      expect(ReminderService.getUrgencyBadgeText(-1, 'OVERDUE')).toBe('Venció ayer');
    });

    it('formats OVERDUE for multiple days', () => {
      expect(ReminderService.getUrgencyBadgeText(-3, 'OVERDUE')).toBe('Venció hace 3 días');
    });
  });

  describe('getUrgentReminders', () => {
    const subscriptions: Subscription[] = [
      mockSub({ id: 's1', name: 'Spotify', nextDueDate: '2026-08-26', amount: 29.9 }), // today (0)
      mockSub({ id: 's2', name: 'iCloud', nextDueDate: '2026-08-25', amount: 9.9 }), // overdue (-1)
      mockSub({ id: 's3', name: 'GSuite', nextDueDate: '2026-08-28', amount: 20 }), // due soon (2)
      mockSub({ id: 's4', name: 'Hosting', nextDueDate: '2026-09-15', amount: 100 }), // normal (20)
      mockSub({ id: 's5', name: 'Gym Inactive', nextDueDate: '2026-08-26', isActive: false }), // inactive
    ];

    const accountsMap = { 'acc-1': 'Cuenta BCP' };
    const categoriesMap = { 'cat-1': { name: 'Entretenimiento', icon: 'i-heroicons-film', color: '#EF4444' } };
    const formatFn = (amt: number, curr: string) => `${curr} ${amt.toFixed(2)}`;

    it('filters only active subscriptions due within threshold or overdue, sorted by urgency', () => {
      const reminders = ReminderService.getUrgentReminders({
        subscriptions,
        accountsMap,
        categoriesMap,
        formatFn,
        thresholdDays: 3,
        currentDate: baseDate,
      });

      expect(reminders.length).toBe(3);
      // Order should be overdue first (-1) -> today (0) -> soon (2)
      expect(reminders[0].subscription.id).toBe('s2'); // iCloud (-1)
      expect(reminders[0].urgency).toBe('OVERDUE');
      expect(reminders[0].urgencyBadgeText).toBe('Venció ayer');

      expect(reminders[1].subscription.id).toBe('s1'); // Spotify (0)
      expect(reminders[1].urgency).toBe('DUE_TODAY');
      expect(reminders[1].urgencyBadgeText).toBe('Vence hoy');

      expect(reminders[2].subscription.id).toBe('s3'); // GSuite (2)
      expect(reminders[2].urgency).toBe('DUE_SOON');
      expect(reminders[2].urgencyBadgeText).toBe('Vence en 2 días');
    });

    it('excludes subscriptions beyond threshold and inactive ones', () => {
      const reminders = ReminderService.getUrgentReminders({
        subscriptions,
        accountsMap,
        categoriesMap,
        formatFn,
        thresholdDays: 1, // Only -1, 0, 1
        currentDate: baseDate,
      });

      expect(reminders.length).toBe(2);
      expect(reminders.map((r) => r.subscription.id)).toEqual(['s2', 's1']);
    });
  });

  describe('buildNotificationPayload', () => {
    it('creates well-formatted browser notification payload', () => {
      const reminder: SubscriptionReminder = {
        subscription: mockSub({ id: 's1', name: 'Netflix 4K' }),
        accountName: 'BBVA Sueldo',
        categoryName: 'Streaming',
        formattedAmount: 'PEN 45.00',
        formattedDueDate: '26 ago',
        daysRemaining: 0,
        urgency: 'DUE_TODAY',
        urgencyBadgeText: 'Vence hoy',
        isActionable: true,
      };

      const payload = ReminderService.buildNotificationPayload(reminder);
      expect(payload.title).toBe('¡Vence hoy! Netflix 4K');
      expect(payload.body).toContain('PEN 45.00');
      expect(payload.body).toContain('BBVA Sueldo');
      expect(payload.tag).toBe('sub-reminder-s1');
    });
  });
});
