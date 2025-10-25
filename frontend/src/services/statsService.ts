import { api } from './api';

export interface DashboardStats {
  totalShipments: number;
  approved: number;
  inProcess: number;
  draft: number;
  totalCompanies: number;
  totalUsers: number;
}

export const statsService = {
  async getStats(): Promise<DashboardStats> {
    const res = await api.get('/stats');
    return res.data?.data ?? res.data;
  }
};