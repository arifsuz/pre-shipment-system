import { api } from './api';
import type { Company } from '../types';

export const companyService = {
  async getAll(): Promise<Company[]> {
    const res = await api.get('/companies');
    return res.data?.data?.companies ?? res.data;
  },

  async create(data: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) {
    const res = await api.post('/companies', data);
    return res.data;
  },

  async update(id: string, data: Partial<Company>) {
    const res = await api.put(`/companies/${id}`, data);
    return res.data;
  },

  async remove(id: string) {
    const res = await api.delete(`/companies/${id}`);
    return res.data;
  }
};