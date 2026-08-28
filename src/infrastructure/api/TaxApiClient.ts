import { ApiClient } from './api-client';
import type { TaxDeductibleItem, TaxProfile, TaxProjectionResult } from '../../core/entities/Tax';

export class TaxApiClient {
  static async getProfile(userId: string, token?: string | null): Promise<TaxProfile> {
    return ApiClient.get<TaxProfile>(`/tax/profile/${userId}`, token);
  }

  static async updateProfile(
    userId: string,
    payload: { taxProfileEnabled: boolean; taxCountry?: string; taxRuc?: string },
    token?: string | null,
  ): Promise<TaxProfile> {
    return ApiClient.patch<TaxProfile>(`/tax/profile/${userId}`, payload, token);
  }

  static async getProjection(
    userId: string,
    year?: number,
    token?: string | null,
  ): Promise<TaxProjectionResult> {
    const query = year ? `?year=${year}` : '';
    return ApiClient.get<TaxProjectionResult>(`/tax/projection/${userId}${query}`, token);
  }

  static async getDeductibles(
    userId: string,
    year?: number,
    token?: string | null,
  ): Promise<TaxDeductibleItem[]> {
    const query = year ? `?year=${year}` : '';
    return ApiClient.get<TaxDeductibleItem[]>(`/tax/deductibles/${userId}${query}`, token);
  }
}
