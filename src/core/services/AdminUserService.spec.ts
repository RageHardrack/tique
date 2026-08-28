import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AdminUserService } from './AdminUserService';
import { ApiClient } from '../../infrastructure/api/api-client';

vi.mock('../../infrastructure/api/api-client', () => ({
  ApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('AdminUserService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch all users', async () => {
    const mockUsers = [
      { id: 'u1', email: 'admin@lascar.dev', role: 'ADMIN' as const, isActive: true, createdAt: '', updatedAt: '' },
    ];
    vi.mocked(ApiClient.get).mockResolvedValueOnce(mockUsers);

    const result = await AdminUserService.getUsers('token-123');
    expect(ApiClient.get).toHaveBeenCalledWith('/admin/users', 'token-123');
    expect(result).toEqual(mockUsers);
  });

  it('should create a user', async () => {
    const payload = { email: 'fam@lascar.dev', password: 'pass', name: 'Fam', role: 'USER' as const, isActive: true, taxProfileEnabled: true, taxRuc: '10123456789' };
    const mockCreated = { id: 'u2', ...payload, createdAt: '', updatedAt: '' };
    vi.mocked(ApiClient.post).mockResolvedValueOnce(mockCreated);

    const result = await AdminUserService.createUser('token-123', payload);
    expect(ApiClient.post).toHaveBeenCalledWith('/admin/users', payload, 'token-123');
    expect(result).toEqual(mockCreated);
  });

  it('should update a user', async () => {
    const payload = { name: 'Updated Name', role: 'ADMIN' as const, isActive: false };
    const mockUpdated = { id: 'u2', email: 'fam@lascar.dev', ...payload, createdAt: '', updatedAt: '' };
    vi.mocked(ApiClient.patch).mockResolvedValueOnce(mockUpdated);

    const result = await AdminUserService.updateUser('token-123', 'u2', payload);
    expect(ApiClient.patch).toHaveBeenCalledWith('/admin/users/u2', payload, 'token-123');
    expect(result).toEqual(mockUpdated);
  });

  it('should reset password', async () => {
    vi.mocked(ApiClient.patch).mockResolvedValueOnce({ success: true, message: 'ok' });

    const result = await AdminUserService.resetPassword('token-123', 'u2', { password: 'newpass' });
    expect(ApiClient.patch).toHaveBeenCalledWith('/admin/users/u2/password', { password: 'newpass' }, 'token-123');
    expect(result.success).toBe(true);
  });

  it('should delete user', async () => {
    vi.mocked(ApiClient.delete).mockResolvedValueOnce({ success: true, message: 'ok' });

    const result = await AdminUserService.deleteUser('token-123', 'u2');
    expect(ApiClient.delete).toHaveBeenCalledWith('/admin/users/u2', 'token-123');
    expect(result.success).toBe(true);
  });
});
