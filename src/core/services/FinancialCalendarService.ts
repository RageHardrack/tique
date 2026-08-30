import type { Subscription } from '../entities/Subscription';
import type { Loan } from '../entities/Loan';
import type { Account } from '../entities/Account';

export type CalendarEventType =
  | 'SUBSCRIPTION'
  | 'LOAN_PAYMENT'
  | 'CREDIT_CARD_CUTOFF'
  | 'CREDIT_CARD_PAYMENT';

export interface CalendarEvent {
  id: string;
  type: CalendarEventType;
  title: string;
  subtitle?: string;
  amount?: number;
  currency?: string;
  date: string; // YYYY-MM-DD
  status: 'PENDING' | 'PAID' | 'OVERDUE' | 'INFO';
  isPayable: boolean;
  sourceId: string;
}

export interface CalendarDay {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEvent[];
  totalAmountDue: number;
}

export interface MonthCalendarData {
  year: number;
  month: number; // 1-12
  monthName: string;
  days: CalendarDay[];
  totalProjectedExpenses: number;
  totalPendingCount: number;
}

const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

export class FinancialCalendarService {
  /**
   * Generates calendar data for a given month and year incorporating all subscriptions,
   * loan due dates, and credit card cutoff/due dates.
   */
  static generateMonthData(params: {
    year: number;
    month: number; // 1-12
    subscriptions?: Subscription[];
    loans?: Loan[];
    accounts?: Account[];
    today?: Date;
  }): MonthCalendarData {
    const { year, month, subscriptions = [], loans = [], accounts = [], today = new Date() } = params;

    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    const lastDayOfMonth = new Date(year, month, 0);
    const daysInMonth = lastDayOfMonth.getDate();

    const eventsByDate: Record<string, CalendarEvent[]> = {};

    // 1. Process Subscriptions
    for (const sub of subscriptions) {
      if (!sub.nextDueDate) continue;
      const subDueDate = sub.nextDueDate.split('T')[0];
      const [sYear, sMonth] = subDueDate.split('-').map(Number);

      // If subscription matches this month/year or recurs into this month
      if (sYear === year && sMonth === month) {
        const event: CalendarEvent = {
          id: `sub-${sub.id}`,
          type: 'SUBSCRIPTION',
          title: sub.name,
          subtitle: 'Suscripción activa',
          amount: sub.amount,
          currency: sub.currency,
          date: subDueDate,
          status: subDueDate < todayStr ? 'OVERDUE' : 'PENDING',
          isPayable: true,
          sourceId: sub.id,
        };
        eventsByDate[subDueDate] = eventsByDate[subDueDate] || [];
        eventsByDate[subDueDate].push(event);
      }
    }

    // 2. Process Loans (Borrowed & Lent)
    for (const loan of loans) {
      if (loan.status === 'PAID' || !loan.dueDate) continue;
      const loanDate = loan.dueDate.split('T')[0];
      const [lYear, lMonth] = loanDate.split('-').map(Number);

      if (lYear === year && lMonth === month) {
        const isBorrowed = loan.type === 'BORROWED';
        const event: CalendarEvent = {
          id: `loan-${loan.id}`,
          type: 'LOAN_PAYMENT',
          title: `${isBorrowed ? 'Pagar a' : 'Cobrar a'} ${loan.personName}`,
          subtitle: loan.notes || (isBorrowed ? 'Deuda por pagar' : 'Préstamo por cobrar'),
          amount: loan.remainingAmount,
          currency: loan.currency,
          date: loanDate,
          status: loanDate < todayStr ? 'OVERDUE' : 'PENDING',
          isPayable: isBorrowed,
          sourceId: loan.id,
        };
        eventsByDate[loanDate] = eventsByDate[loanDate] || [];
        eventsByDate[loanDate].push(event);
      }
    }

    // 3. Process Credit Cards (Statement Closing & Payment Due Dates)
    for (const acc of accounts) {
      if (acc.type !== 'CREDIT_CARD') continue;

      // Cutoff Day
      if (acc.statementClosingDay && acc.statementClosingDay >= 1 && acc.statementClosingDay <= daysInMonth) {
        const cutoffDate = `${year}-${String(month).padStart(2, '0')}-${String(acc.statementClosingDay).padStart(2, '0')}`;
        eventsByDate[cutoffDate] = eventsByDate[cutoffDate] || [];
        eventsByDate[cutoffDate].push({
          id: `cc-cut-${acc.id}-${cutoffDate}`,
          type: 'CREDIT_CARD_CUTOFF',
          title: `Cierre: ${acc.name}`,
          subtitle: `Corte de estado de cuenta`,
          date: cutoffDate,
          status: 'INFO',
          isPayable: false,
          sourceId: acc.id,
        });
      }

      // Payment Due Day
      if (acc.paymentDueDay && acc.paymentDueDay >= 1 && acc.paymentDueDay <= daysInMonth) {
        const dueDate = `${year}-${String(month).padStart(2, '0')}-${String(acc.paymentDueDay).padStart(2, '0')}`;
        eventsByDate[dueDate] = eventsByDate[dueDate] || [];
        eventsByDate[dueDate].push({
          id: `cc-due-${acc.id}-${dueDate}`,
          type: 'CREDIT_CARD_PAYMENT',
          title: `Pago Tarjeta: ${acc.name}`,
          subtitle: `Límite de pago (Deuda: ${acc.balance || 0} ${acc.currency})`,
          amount: acc.balance > 0 ? acc.balance : undefined,
          currency: acc.currency,
          date: dueDate,
          status: dueDate < todayStr && (acc.balance || 0) > 0 ? 'OVERDUE' : 'PENDING',
          isPayable: true,
          sourceId: acc.id,
        });
      }
    }

    // Build day grid
    const days: CalendarDay[] = [];
    let totalProjectedExpenses = 0;
    let totalPendingCount = 0;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayEvents = eventsByDate[dateStr] || [];

      let dayTotal = 0;
      for (const ev of dayEvents) {
        if (ev.amount && (ev.type === 'SUBSCRIPTION' || (ev.type === 'LOAN_PAYMENT' && ev.isPayable) || ev.type === 'CREDIT_CARD_PAYMENT')) {
          dayTotal += ev.amount;
          totalProjectedExpenses += ev.amount;
        }
        if (ev.status === 'PENDING' || ev.status === 'OVERDUE') {
          totalPendingCount++;
        }
      }

      days.push({
        date: dateStr,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateStr === todayStr,
        events: dayEvents,
        totalAmountDue: Math.round(dayTotal * 100) / 100,
      });
    }

    return {
      year,
      month,
      monthName: MONTH_NAMES[month - 1] || '',
      days,
      totalProjectedExpenses: Math.round(totalProjectedExpenses * 100) / 100,
      totalPendingCount,
    };
  }
}
