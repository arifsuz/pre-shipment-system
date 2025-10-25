// frontend/src/types/index.ts
export interface User {
  id: string;
  email: string;
  nama: string;
  username: string;
  role: 'ADMIN' | 'VIEWER';
  createdAt: string;
}

export interface Company {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  fax?: string;        // added
  email?: string;
  contactPerson?: string;
  country?: string;    // added
  section?: string;    // added
  isActive: boolean;
  createdAt: string;
}

export interface ShipmentItem {
  id: string;
  no: number;
  boxNo: string;
  partNo: string;
  partName: string;
  quantity: number;
  remark?: string;
  pricePerPcs?: number;
  totalAmount?: number;
  specialPacking?: boolean;
}

export interface Shipment {
  id: string;
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
  tpDate?: string;
  portOfDischarge?: string;
  shipmentMethod?: string;
  paymentMethod?: string;
  exportType?: string;
  etdShipment?: string;
  
  userId: string;
  orderById?: string;
  deliverToId?: string;
  
  // Relations
  user?: User;
  orderBy?: Company;
  deliverTo?: Company;
  items?: ShipmentItem[];
  
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// CreateShipmentData used by forms / Excel import
export interface CreateShipmentData {
  shippingMark: string;
  orderNo?: string;
  caseNo: string;
  destination?: string;
  model?: string;
  productionMonth?: string;
  caseSize?: string;
  grossWeight?: number;
  netWeight?: number;
  // allow multiple rack numbers when merged from many sheets
  rackNo?: string | string[];
  items: {
    no: number;
    boxNo: string;
    partNo: string;
    partName: string;
    quantity: number;
    remark?: string;
  }[];
}

// Response shape for Excel upload
export interface ExcelUploadResponse {
  success: boolean;
  message: string;
  data?: CreateShipmentData;
  warnings?: string[];
  errors?: string[];
}

export type Notification = {
  id: string;
  title: string;
  content: string;
  isRead: boolean;
  userId?: string;
  createdAt: string;
  updatedAt?: string;
};