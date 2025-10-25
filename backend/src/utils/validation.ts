// backend/src/utils/validation.ts
import { z } from 'zod';

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  nama: z.string().min(1, 'Full name is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['ADMIN', 'VIEWER'])
});

export const createCompanySchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),        // added
  email: z.string().email().optional(),
  contactPerson: z.string().optional(),
  country: z.string().optional(),    // added
  section: z.string().optional()     // added
});

export const createShipmentSchema = z.object({
  shippingMark: z.string().min(1, 'Shipping mark is required'),
  orderNo: z.string().min(1, 'Order number is required'),
  caseNo: z.string().min(1, 'Case number is required'),
  destination: z.string().min(1, 'Destination is required'),
  model: z.string().min(1, 'Model is required'),
  productionMonth: z.string().min(1, 'Production month is required'),
  caseSize: z.string().min(1, 'Case size is required'),
  grossWeight: z.number().min(0, 'Gross weight must be positive'),
  netWeight: z.number().min(0, 'Net weight must be positive'),
  // allow single string or array of strings (when Excel produces multiple rack numbers)
  rackNo: z.union([z.string(), z.array(z.string())]).optional(),
  items: z.array(z.object({
    no: z.number().min(1),
    boxNo: z.string().min(1),
    partNo: z.string().min(1),
    partName: z.string().min(1),
    quantity: z.number().min(1),
    remark: z.string().optional()
  })).min(1, 'At least one item is required')
});

export const partySchema = z.object({
  companyName: z.string().optional(),
  address: z.string().optional(),
  country: z.string().optional(),
  attention: z.string().optional(),
  section: z.string().optional(),
  phone: z.string().optional(),
  fax: z.string().optional(),
  email: z.string().optional()
});

export const memoItemSchema = z.object({
  no: z.number().optional(),
  partNo: z.string().optional().nullable(),
  partName: z.string().optional().nullable(),
  qty: z.number().optional(),
  pricePerPc: z.number().optional(),
  totalAmount: z.number().optional(),
  specialPacking: z.string().optional()
});

// Schema khusus untuk update memo (semua field optional untuk partial update)
export const memoUpdateSchema = z
  .object({
    memoNo: z.string().optional(),
    goodsType: z.string().optional(),
    shipmentType: z.string().optional(),
    dangerLevel: z.string().optional(),
    specialPermit: z.boolean().optional(),
    destination: z.string().optional(),
    invoiceType: z.string().optional(),
    sapInfo: z.string().optional(),
    tpNo: z.string().nullable().optional(),
    tpDate: z.string().nullable().optional(),
    packingDetails: z.string().optional(),
    portOfDischarge: z.string().optional(),
    shipmentMethod: z.string().optional(),
    paymentMethod: z.string().optional(),
    exportType: z.string().optional(),
    etdShipment: z.string().nullable().optional(),
    orderBy: partySchema.optional(),
    deliveryTo: partySchema.optional(),
    memoGoodsInfo: z.string().optional(),
    manualItems: z.array(memoItemSchema).optional()
  })
  .partial();