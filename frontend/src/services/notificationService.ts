import { api } from './api';
import type { Notification } from '../types';

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const res = await api.get('/notifications');
    return res.data?.data ?? res.data;
  },

  async markRead(id: string) {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  async markAllRead() {
    const res = await api.put('/notifications/mark-all-read');
    return res.data;
  }
};