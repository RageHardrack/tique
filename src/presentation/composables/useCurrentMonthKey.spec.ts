import { effectScope, nextTick, type EffectScope } from 'vue';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  MONTH_ROLLOVER_INTERVAL_MS,
  toMonthKey,
  useCurrentMonthKey,
} from './useCurrentMonthKey';

const scopes: EffectScope[] = [];
let originalVisibilityStateDescriptor: PropertyDescriptor | undefined;
let visibilityStateWasOverridden = false;

afterEach(() => {
  scopes.forEach((scope) => scope.stop());
  scopes.length = 0;

  if (visibilityStateWasOverridden) {
    if (originalVisibilityStateDescriptor) {
      Object.defineProperty(
        document,
        'visibilityState',
        originalVisibilityStateDescriptor,
      );
    } else {
      Reflect.deleteProperty(document, 'visibilityState');
    }
    originalVisibilityStateDescriptor = undefined;
    visibilityStateWasOverridden = false;
  }

  vi.useRealTimers();
});

function createMonthKeyScope(options?: { intervalMs?: number }) {
  const scope = effectScope();
  scopes.push(scope);
  const result = scope.run(() => useCurrentMonthKey(options));

  if (!result) {
    throw new Error('Could not create a current month key scope');
  }

  return result;
}

describe('useCurrentMonthKey', () => {
  it('converts UTC month boundaries consistently', () => {
    expect(toMonthKey(new Date('2026-10-31T23:59:59Z'))).toEqual({
      year: 2026,
      month: 10,
      key: '2026-10',
    });
    expect(toMonthKey(new Date('2026-11-01T00:00:00Z'))).toEqual({
      year: 2026,
      month: 11,
      key: '2026-11',
    });
    // This is October 31 at 23:30 in UTC-4, but November in UTC.
    expect(toMonthKey(new Date('2026-11-01T03:30:00Z'))).toEqual({
      year: 2026,
      month: 11,
      key: '2026-11',
    });
  });

  it('preserves month identity within a month and replaces it on rollover', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T23:00:00Z'));

    const { month } = createMonthKeyScope({ intervalMs: 1_000 });
    const october = month.value;

    vi.advanceTimersByTime(1_000);
    expect(month.value).toBe(october);

    vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));
    vi.advanceTimersByTime(1_000);
    expect(month.value).not.toBe(october);
    expect(month.value.key).toBe('2026-11');
  });

  it('refreshes on an interval after the system time advances', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-31T23:59:59Z'));

    const { month } = createMonthKeyScope({ intervalMs: 1_000 });

    vi.setSystemTime(new Date('2026-11-01T00:00:00Z'));
    vi.advanceTimersByTime(1_000);

    expect(month.value.key).toBe('2026-11');
  });

  it('refreshes when the document becomes visible without relying on its interval', async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T12:00:00Z'));

    const { month, refresh } = createMonthKeyScope({
      intervalMs: MONTH_ROLLOVER_INTERVAL_MS,
    });
    expect(typeof refresh).toBe('function');
    expect(month.value.key).toBe('2026-10');

    originalVisibilityStateDescriptor = Object.getOwnPropertyDescriptor(
      document,
      'visibilityState',
    );
    visibilityStateWasOverridden = true;
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await nextTick();

    vi.setSystemTime(new Date('2026-11-01T00:30:00Z'));
    expect(month.value.key).toBe('2026-10');

    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
    await nextTick();

    expect(month.value.key).toBe('2026-11');

    vi.setSystemTime(new Date('2026-12-01T00:30:00Z'));
    refresh();
    expect(month.value.key).toBe('2026-12');
  });
});
