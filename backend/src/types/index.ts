// backend/src/types/index.ts
export interface User {
  id: string;
  email: string;
  nama: string;
  username: string;
  role: 'ADMIN' | 'VIEWER';
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  fax?: string;       // added
  email?: string;
  contactPerson?: string;
  country?: string;   // added
  section?: string;   // added
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  shippingMark: string;
  orderNo: string;
  caseNo: string;
  destination: string;
  model: string;
  productionMonth: Date;
  caseSize: string;
  grossWeight: number;
  netWeight: number;
  rackNo?: string;
  status: 'DRAFT' | 'IN_PROCESS' | 'APPROVED';
  
  // PDF Commercial Data
  memoNo?: string;
  shipmentType?: string;
  dangerLevel?: string;
  specialPermit?: boolean;
  invoiceType?: string;
  purpose?: string;
  sapInfo?: string;
  tpNo?: string;
  tpDate?: Date;
  portOfDischarge?: string;
  shipmentMethod?: string;
  paymentMethod?: string;
  exportType?: string;
  etdShipment?: Date;
  
  userId: string;
  orderById?: string;
  deliverToId?: string;
  
  // Relations
  user?: User;
  orderBy?: Company;
  deliverTo?: Company;
  items?: ShipmentItem[];
  
  createdAt: Date;
  updatedAt: Date;
}

export interface ShipmentItem {
  id: string;
  no: number;
  boxNo: string;
  partNo: string;
  partName: string;
  quantity: number;
  remark?: string;
  
  // PDF Commercial Data
  pricePerPcs?: number;
  totalAmount?: number;
  specialPacking?: boolean;
  
  shipmentId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
    role: string;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: PaginationParams;
  error?: string;
}