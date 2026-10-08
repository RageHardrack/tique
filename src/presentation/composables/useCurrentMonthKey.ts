import { readonly, shallowRef, watch, type Ref } from 'vue';

import { useDocumentVisibility, useIntervalFn } from '@vueuse/core';

export interface CurrentMonthKey {
  year: number;
  month: number;
  key: string;
}

export const MONTH_ROLLOVER_INTERVAL_MS = 60_000;

/**
 * Pure, UTC-based month projection used by monthly spending services.
 * UTC is deliberate: MonthlySpendingService and BudgetRule503020Service both
 * count by UTC month, so a UTC-4 user rolls over at 20:00 local on the last day
 * rather than local midnight.
 */
export function toMonthKey(date: Date): CurrentMonthKey {
  const year = date.getUTCFullYear();
  const month = date.getUTCMonth() + 1;

  return {
    year,
    month,
    key: `${year.toString().padStart(4, '0')}-${month.toString().padStart(2, '0')}`,
  };
}

export function useCurrentMonthKey(options?: {
  intervalMs?: number;
}): {
  month: Readonly<Ref<CurrentMonthKey>>;
  refresh: () => void;
} {
  const month = shallowRef(toMonthKey(new Date()));

  function refresh(): void {
    const currentMonth = toMonthKey(new Date());

    if (month.value.key !== currentMonth.key) {
      month.value = currentMonth;
    }
  }

  useIntervalFn(refresh, options?.intervalMs ?? MONTH_ROLLOVER_INTERVAL_MS);

  const visibility = useDocumentVisibility();
  watch(visibility, (state) => {
    if (state === 'visible') {
      refresh();
    }
  });

  return {
    month: readonly(month),
    refresh,
  };
}
