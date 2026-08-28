import { describe, expect, it, vi, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useTaxStore } from './tax.store';
import { TaxApiClient } from '../../infrastructure/api/TaxApiClient';

vi.mock('../../infrastructure/api/TaxApiClient', () => ({
  TaxApiClient: {
    getProfile: vi.fn(),
    updateProfile: vi.fn(),
    getProjection: vi.fn(),
    getDeductibles: vi.fn(),
  },
}));

describe('Tax Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
  });

  it('permite actualizar el perfil tributario y consultar la proyección', async () => {
    const store = useTaxStore();

    (TaxApiClient.updateProfile as any).mockResolvedValueOnce({
      taxProfileEnabled: true,
      taxCountry: 'PE',
      taxRuc: '15548932014',
    });

    (TaxApiClient.getProjection as any).mockResolvedValueOnce({
      year: 2026,
      uitValue: 5350,
      grossFourthCategory: 60000,
      estimatedTaxDue: -3956,
      status: 'REFUND_DUE',
    });

    (TaxApiClient.getDeductibles as any).mockResolvedValueOnce([]);

    await store.updateProfile('user-1', {
      taxProfileEnabled: true,
      taxCountry: 'PE',
      taxRuc: '15548932014',
    });

    expect(store.profile.taxProfileEnabled).toBe(true);
    expect(store.profile.taxRuc).toBe('15548932014');
    expect(store.projection?.estimatedTaxDue).toBe(-3956);
  });
});
