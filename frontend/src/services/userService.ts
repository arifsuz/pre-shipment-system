// frontend/src/services/userService.ts
import { api } from './api';
import type { ApiResponse, User } from '../types';

export interface CreateUserData {
  email: string;
  nama: string;
  username: string;
  password: string;
  role: 'ADMIN' | 'VIEWER';
}

export const userService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<{ users: User[] }>>('/users');
    return response.data.data!.users;
  },

  async createUser(userData: CreateUserData): Promise<User> {
    const response = await api.post<ApiResponse<{ user: User }>>('/users', userData);
    return response.data.data!.user;
  },

  async updateUser(userId: string, updateData: Partial<User>): Promise<User> {
    const response = await api.put<ApiResponse<{ user: User }>>(`/users/${userId}`, updateData);
    return response.data.data!.user;
  },

  async removeUser(userId: string) {
    const response = await api.delete(`/users/${userId}`);
    return response.data;
  },
};