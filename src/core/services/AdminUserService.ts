import { ApiClient } from '../../infrastructure/api/api-client';
import type { UserRole } from '../entities/User';

export interface AdminUserSummary {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  isActive: boolean;
  taxProfileEnabled?: boolean;
  taxCountry?: string;
  taxRuc?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    accounts: number;
    transactions: number;
    subscriptions: number;
    loans: number;
    savingsGoals: number;
  };
}

export interface CreateAdminUserPayload {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  taxProfileEnabled?: boolean;
  taxCountry?: string;
  taxRuc?: string;
}

export interface UpdateAdminUserPayload {
  name?: string;
  role?: UserRole;
  isActive?: boolean;
  taxProfileEnabled?: boolean;
  taxCountry?: string;
  taxRuc?: string;
}

export interface ResetPasswordPayload {
  password: string;
}

export class AdminUserService {
  static async getUsers(token: string): Promise<AdminUserSummary[]> {
    return ApiClient.get<AdminUserSummary[]>('/admin/users', token);
  }

  static async createUser(
    token: string,
    payload: CreateAdminUserPayload,
  ): Promise<AdminUserSummary> {
    return ApiClient.post<AdminUserSummary>('/admin/users', payload, token);
  }

  static async updateUser(
    token: string,
    id: string,
    payload: UpdateAdminUserPayload,
  ): Promise<AdminUserSummary> {
    return ApiClient.patch<AdminUserSummary>(`/admin/users/${id}`, payload, token);
  }

  static async resetPassword(
    token: string,
    id: string,
    payload: ResetPasswordPayload,
  ): Promise<{ success: boolean; message: string }> {
    return ApiClient.patch<{ success: boolean; message: string }>(
      `/admin/users/${id}/password`,
      payload,
      token,
    );
  }

  static async deleteUser(
    token: string,
    id: string,
  ): Promise<{ success: boolean; message: string }> {
    return ApiClient.delete<{ success: boolean; message: string }>(
      `/admin/users/${id}`,
      token,
    );
  }
}
