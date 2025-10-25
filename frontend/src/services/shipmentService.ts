// frontend/src/services/shipmentService.ts
import { api } from './api';
import type { ApiResponse, Shipment } from '../types';

export interface CreateShipmentData {
  shippingMark: string;
  orderNo: string;
  caseNo: string;
  destination: string;
  model: string;
  productionMonth: string;
  caseSize: string;
  grossWeight: number;
  netWeight: number;
  rackNo?: string;
  items: Array<{
    no: number;
    boxNo: string;
    partNo: string;
    partName: string;
    quantity: number;
    remark?: string;
  }>;
}

export const getMemos = async () => {
  const { data } = await api.get('/shipments/memos');
  return data;
};

export const shipmentService = {
  async getAllShipments(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ shipments: Shipment[]; pagination: any }> {
    const response = await api.get<ApiResponse<{ shipments: Shipment[]; pagination: any }>>(
      '/shipments',
      { params }
    );
    return response.data.data!;
  },

  async getShipmentById(id: string): Promise<Shipment> {
    const response = await api.get<ApiResponse<{ shipment: Shipment }>>(`/shipments/${id}`);
    return response.data.data!.shipment;
  },

  async createShipment(shipmentData: CreateShipmentData): Promise<Shipment> {
    const response = await api.post<ApiResponse<{ shipment: Shipment }>>(
      '/shipments',
      shipmentData
    );
    return response.data.data!.shipment;
  },

  async updateShipment(id: string, eData: Partial<CreateShipmentData>): Promise<Shipment> {
    const response = await api.put<ApiResponse<{ shipment: Shipment }>>(
      `/shipments/${id}`,
      eData
    );
    return response.data.data!.shipment;
  },

  async updateShipmentStatus(id: string, status: string): Promise<Shipment> {
    const response = await api.patch<ApiResponse<{ shipment: Shipment }>>(
      `/shipments/${id}/status`,
      { status }
    );
    return response.data.data!.shipment;
  },

  async deleteShipment(id: string): Promise<void> {
    await api.delete(`/shipments/${id}`);
  },

  async updateShipmentMemo(id: string, payload: any) {
    const { data } = await api.put(`/shipments/${id}/memo`, payload);
    return data;
  },

  getMemos,
};