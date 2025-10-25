// frontend/src/services/authService.ts
import { api } from './api';
import type { ApiResponse, User } from '../types';

export interface LoginData {
  username: string;
  password: string;
}

export const authService = {
  async login(credentials: LoginData): Promise<{ token: string; user: User }> {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>(
      '/auth/login',
      credentials
    );
    return response.data.data!;
  },

  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me');
    return response.data.data!.user;
  },
};