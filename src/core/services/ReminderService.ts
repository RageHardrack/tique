import { DateFormatter } from './DateFormatter';
import type { Subscription } from '../entities/Subscription';

export type ReminderUrgency = 'OVERDUE' | 'DUE_TODAY' | 'DUE_SOON' | 'NORMAL';

export interface SubscriptionReminder {
  subscription: Subscription;
  accountName: string;
  categoryName?: string;
  categoryIcon?: string;
  categoryColor?: string;
  formattedAmount: string;
  formattedDueDate: string;
  daysRemaining: number;
  urgency: ReminderUrgency;
  urgencyBadgeText: string;
  isActionable: boolean;
}

export interface ReminderNotificationPayload {
  title: string;
  body: string;
  tag: string;
  icon?: string;
}

export class ReminderService {
  /**
   * Parses a date string safely into year, month (0-indexed), date in local calendar.
   */
  static parseLocalDate(dateString: string): Date {
    const raw = dateString.split('T')[0];
    const parts = raw.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      return new Date(year, month, day, 0, 0, 0, 0);
    }
    const d = new Date(dateString);
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
  }

  /**
   * Calculates the difference in full calendar days between today and a target due date string.
   */
  static calculateDaysRemaining(dueDateString: string, currentDate: Date = new Date()): number {
    const now = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), 0, 0, 0, 0);
    const due = this.parseLocalDate(dueDateString);

    const diffTime = due.getTime() - now.getTime();
    return Math.round(diffTime / (1000 * 60 * 60 * 24));
  }

  /**
   * Evaluates urgency level based on days remaining:
   * - OVERDUE: < 0 days (already expired)
   * - DUE_TODAY: 0 days (due right today)
   * - DUE_SOON: 1 to 3 days (approaching within threshold)
   * - NORMAL: > 3 days
   */
  static evaluateUrgency(daysRemaining: number): ReminderUrgency {
    if (daysRemaining < 0) return 'OVERDUE';
    if (daysRemaining === 0) return 'DUE_TODAY';
    if (daysRemaining <= 3) return 'DUE_SOON';
    return 'NORMAL';
  }

  /**
   * Generates localized neutral Spanish badge text for the urgency status.
   */
  static getUrgencyBadgeText(daysRemaining: number, urgency: ReminderUrgency): string {
    switch (urgency) {
      case 'OVERDUE': {
        const abs = Math.abs(daysRemaining);
        return abs === 1 ? 'Venció ayer' : `Venció hace ${abs} días`;
      }
      case 'DUE_TODAY':
        return 'Vence hoy';
      case 'DUE_SOON':
        return daysRemaining === 1 ? 'Vence mañana' : `Vence en ${daysRemaining} días`;
      case 'NORMAL':
      default:
        return `Vence en ${daysRemaining} días`;
    }
  }

  /**
   * Filters and sorts subscriptions to find all urgent reminders (due within `thresholdDays` or overdue).
   */
  static getUrgentReminders(params: {
    subscriptions: Subscription[];
    accountsMap: Record<string, string>;
    categoriesMap?: Record<string, { name: string; icon?: string; color?: string }>;
    formatFn: (amount: number, currency: string) => string;
    thresholdDays?: number;
    currentDate?: Date;
  }): SubscriptionReminder[] {
    const {
      subscriptions,
      accountsMap,
      categoriesMap = {},
      formatFn,
      thresholdDays = 3,
      currentDate = new Date(),
    } = params;

    const reminders: SubscriptionReminder[] = [];

    for (const sub of subscriptions) {
      if (!sub.isActive) continue;

      const daysRemaining = this.calculateDaysRemaining(sub.nextDueDate, currentDate);
      const urgency = this.evaluateUrgency(daysRemaining);

      // Only include overdue or due within the threshold window
      if (daysRemaining <= thresholdDays) {
        const category = sub.categoryId ? categoriesMap[sub.categoryId] : undefined;
        const formattedDueDate = DateFormatter.format(sub.nextDueDate, 'D MMM');

        reminders.push({
          subscription: sub,
          accountName: accountsMap[sub.accountId] || 'Cuenta',
          categoryName: category?.name,
          categoryIcon: category?.icon || 'i-heroicons-arrow-path',
          categoryColor: category?.color || '#3B82F6',
          formattedAmount: formatFn(sub.amount, sub.currency),
          formattedDueDate,
          daysRemaining,
          urgency,
          urgencyBadgeText: this.getUrgencyBadgeText(daysRemaining, urgency),
          isActionable: true,
        });
      }
    }

    // Sort by most critical first: OVERDUE (< 0 ascending) -> DUE_TODAY (0) -> DUE_SOON (1..3 ascending)
    return reminders.sort((a, b) => a.daysRemaining - b.daysRemaining);
  }

  /**
   * Builds browser Notification payload for high-priority reminders.
   */
  static buildNotificationPayload(reminder: SubscriptionReminder): ReminderNotificationPayload {
    let title = `Recordatorio: ${reminder.subscription.name}`;
    if (reminder.urgency === 'DUE_TODAY') {
      title = `¡Vence hoy! ${reminder.subscription.name}`;
    } else if (reminder.urgency === 'OVERDUE') {
      title = `Pago vencido: ${reminder.subscription.name}`;
    }

    return {
      title,
      body: `Monto: ${reminder.formattedAmount} con débito en ${reminder.accountName}. ${reminder.urgencyBadgeText}.`,
      tag: `sub-reminder-${reminder.subscription.id}`,
    };
  }

  /**
   * Requests web notification permission if supported.
   */
  static async requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return await Notification.requestPermission();
  }

  /**
   * Dispatches web notification if permission is granted.
   */
  static sendWebNotification(payload: ReminderNotificationPayload): boolean {
    if (typeof window === 'undefined' || !('Notification' in window)) return false;
    if (Notification.permission !== 'granted') return false;

    try {
      new Notification(payload.title, {
        body: payload.body,
        tag: payload.tag,
        icon: '/pwa-192x192.png',
      });
      return true;
    } catch {
      return false;
    }
  }
}
