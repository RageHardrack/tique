export type UserRole = 'ADMIN' | 'USER';

export interface User {
  id: string;
  email: string;
  name?: string | null;
  role: UserRole;
  isActive?: boolean;
  taxProfileEnabled?: boolean;
  taxCountry?: string;
  taxRuc?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

