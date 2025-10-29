// backend/src/services/shipmentService.ts
import { prisma } from '../utils/database';
import { ApiResponse, Shipment, ShipmentItem, PaginationParams } from '../types';

export class ShipmentService {
  async getAllShipments(
    filters: { status?: string } = {},
    page: number = 1,
    limit: number = 10
  ): Promise<ApiResponse> {
    try {
      const where: any = {};
      if (filters.status && filters.status !== 'ALL') {
        where.status = filters.status;
      }

      const [shipments, total] = await Promise.all([
        prisma.shipment.findMany({
          where,
          include: {
            user: {
              select: { nama: true, email: true }
            },
            orderBy: true,
            deliverTo: true,
            items: {
              orderBy: { no: 'asc' }
            }
          },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit
        }),
        prisma.shipment.count({ where })
      ]);

      const pagination: PaginationParams = {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      };

      // normalize company relations before returning
      const mapped = shipments.map(s => ({
        ...s,
        orderBy: mapCompanyForShipment(s.orderBy),
        deliverTo: mapCompanyForShipment(s.deliverTo)
      }));

      return {
        success: true,
        message: 'Shipments retrieved successfully',
        data: { shipments: mapped },
        pagination
      };
    } catch (error) {
      console.error('ShipmentService getAllShipments error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getShipmentById(shipmentId: string): Promise<ApiResponse> {
    try {
      const shipment = await prisma.shipment.findUnique({
        where: { id: shipmentId },
        include: {
          user: {
            select: { nama: true, email: true }
          },
          orderBy: true,
          deliverTo: true,
          items: {
            orderBy: { no: 'asc' }
          }
        }
      });

      if (!shipment) {
        return { success: false, message: 'Shipment not found' };
      }

      // normalize company relations
      const mapped = {
        ...shipment,
        orderBy: mapCompanyForShipment(shipment.orderBy),
        deliverTo: mapCompanyForShipment(shipment.deliverTo)
      };

      return {
        success: true,
        message: 'Shipment retrieved successfully',
        data: { shipment: mapped }
      };
    } catch (error) {
      console.error('ShipmentService getShipmentById error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async createShipment(
    shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt' | 'user' | 'orderBy' | 'deliverTo' | 'items'> & {
      items: Omit<ShipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'shipmentId'>[];
    },
    userId: string
  ): Promise<ApiResponse> {
    try {
      // Ensure rackNo stored as string (Prisma schema uses String)
      const dataToSave = {
        ...shipmentData,
        rackNo: Array.isArray(shipmentData.rackNo) ? shipmentData.rackNo.join(', ') : shipmentData.rackNo
      };

      const shipment = await prisma.shipment.create({
        data: {
          shippingMark: dataToSave.shippingMark,
          orderNo: dataToSave.orderNo,
          caseNo: dataToSave.caseNo,
          destination: dataToSave.destination,
          model: dataToSave.model,
          productionMonth: new Date(dataToSave.productionMonth),
          caseSize: dataToSave.caseSize,
          grossWeight: Number(dataToSave.grossWeight) || 0,
          netWeight: Number(dataToSave.netWeight) || 0,
          rackNo: dataToSave.rackNo ?? undefined,
          userId,
          items: {
            create: (dataToSave.items || []).map((it: any) => ({
              no: it.no,
              boxNo: it.boxNo,
              partNo: it.partNo,
              partName: it.partName,
              quantity: Number(it.quantity) || 0,
              remark: it.remark || null
            }))
          }
        },
        include: { items: true }
      });

      return {
        success: true,
        message: 'Shipment created successfully',
        data: { shipment }
      };
    } catch (error) {
      console.error('ShipmentService createShipment error:', error);
      return { success: false, message: (error as Error).message || 'Error creating shipment' };
    }
  }

  async updateShipment(
    shipmentId: string,
    updateData: Partial<Shipment> & {
      items?: Omit<ShipmentItem, 'id' | 'createdAt' | 'updatedAt' | 'shipmentId'>[];
      manualItems?: any[]; // allow memo frontend payload
      orderBy?: any;
      deliveryTo?: any;
    }
  ): Promise<ApiResponse> {
    try {
      // Check if shipment exists and is not approved
      const existingShipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
      });

      if (!existingShipment) {
        return { success: false, message: 'Shipment not found' };
      }

      if (existingShipment.status === 'APPROVED') {
        return { success: false, message: 'Cannot modify approved shipment' };
      }

      // Destructure helper fields that need special handling
      const { items, manualItems, orderBy, deliveryTo, productionMonth, tpDate, etdShipment, ...rest } = updateData as any;

      // List of allowed scalar fields in Shipment model
      const allowedScalars = [
        'shippingMark','orderNo','caseNo','destination','model','productionMonth','caseSize',
        'grossWeight','netWeight','rackNo','status','memoNo','goodsType','shipmentType',
        'dangerLevel','specialPermit','invoiceType','purpose','sapInfo','tpNo','tpDate',
        'packingDetails','memoGoodsInfo','portOfDischarge','shipmentMethod','paymentMethod',
        'exportType','etdShipment'
      ];

      const updatePayload: any = {};

      // copy allowed scalar fields (and convert dates)
      for (const k of allowedScalars) {
        if (rest[k] !== undefined) {
          if (k === 'productionMonth' && rest[k]) {
            updatePayload.productionMonth = new Date(rest[k]);
          } else if ((k === 'tpDate' || k === 'etdShipment') && rest[k] != null) {
            // accept null to unset
            updatePayload[k] = rest[k] ? new Date(rest[k]) : null;
          } else {
            updatePayload[k] = rest[k];
          }
        }
      }

      // HANDLE orderBy: create or connect
      if (orderBy) {
        const { id: obId, companyName, address, phone, email, attention } = orderBy;
        if (obId) {
          updatePayload.orderBy = { connect: { id: obId } };
        } else {
          updatePayload.orderBy = {
            create: {
              name: companyName || 'Unknown',
              address: address || undefined,
              phone: phone || undefined,
              email: email || undefined,
              contactPerson: attention || undefined
            }
          };
        }
      }

      // HANDLE deliveryTo -> deliverTo relation
      if (deliveryTo) {
        const { id: dtId, companyName, address, phone, email, attention } = deliveryTo;
        if (dtId) {
          updatePayload.deliverTo = { connect: { id: dtId } };
        } else {
          updatePayload.deliverTo = {
            create: {
              name: companyName || 'Unknown',
              address: address || undefined,
              phone: phone || undefined,
              email: email || undefined,
              contactPerson: attention || undefined
            }
          };
        }
      }

      // HANDLE manualItems (from memo): replace shipment items with manualItems entries
      if (Array.isArray(manualItems)) {
        updatePayload.items = {
          deleteMany: {},
          create: manualItems.map((it: any, i: number) => ({
            no: it.no ?? i + 1,
            boxNo: it.boxNo ?? '',
            partNo: it.partNo ?? '',
            partName: it.partName ?? '',
            quantity: Number(it.qty || 0),
            remark: it.remark ?? null,
            pricePerPcs: it.pricePerPc ? Number(it.pricePerPc) : undefined,
            totalAmount: it.totalAmount ? Number(it.totalAmount) : undefined,
            specialPacking: it.specialPacking ?? undefined
          }))
        };
      } else if (items) {
        // existing items update behaviour (if frontend passes items)
        updatePayload.items = {
          deleteMany: {},
          create: items.map((it: any) => ({
            no: it.no,
            boxNo: it.boxNo ?? '',
            partNo: it.partNo ?? '',
            partName: it.partName ?? '',
            quantity: Number(it.quantity || 0),
            remark: it.remark || null
          }))
        };
      }

      const shipment = await prisma.shipment.update({
        where: { id: shipmentId },
        data: updatePayload,
        include: {
          items: true
        }
      });

      return {
        success: true,
        message: 'Shipment updated successfully',
        data: { shipment }
      };
    } catch (error) {
      console.error('ShipmentService updateShipment error:', error);
      return { success: false, message: 'Error updating shipment' };
    }
  }

  async updateShipmentStatus(
    shipmentId: string,
    status: 'DRAFT' | 'IN_PROCESS' | 'APPROVED'
  ): Promise<ApiResponse> {
    try {
      const shipment = await prisma.shipment.update({
        where: { id: shipmentId },
        data: { status }
      });

      return {
        success: true,
        message: 'Shipment status updated successfully',
        data: { shipment }
      };
    } catch (error) {
      console.error('ShipmentService updateShipmentStatus error:', error);
      return { success: false, message: 'Error updating shipment status' };
    }
  }

  async deleteShipment(shipmentId: string): Promise<ApiResponse> {
    try {
      // Check if shipment exists and is not approved
      const existingShipment = await prisma.shipment.findUnique({
        where: { id: shipmentId }
      });

      if (!existingShipment) {
        return { success: false, message: 'Shipment not found' };
      }

      if (existingShipment.status === 'APPROVED') {
        return { success: false, message: 'Cannot delete approved shipment' };
      }

      await prisma.shipment.delete({
        where: { id: shipmentId }
      });

      return {
        success: true,
        message: 'Shipment deleted successfully'
      };
    } catch (error) {
      console.error('ShipmentService deleteShipment error:', error);
      return { success: false, message: 'Error deleting shipment' };
    }
  }

  async getMemos() {
    try {
      const memos = await prisma.shipment.findMany({
        where: {
          OR: [
            { memoNo: { not: null } },
            { memoGoodsInfo: { not: null } },
            { goodsType: { not: null } }
          ]
        },
        include: {
          items: true,
          user: true,
          orderBy: true,
          deliverTo: true
        },
        orderBy: { updatedAt: 'desc' }
      });

      // normalize company relations for memos
      const mapped = memos.map(m => ({
        ...m,
        orderBy: mapCompanyForShipment(m.orderBy),
        deliverTo: mapCompanyForShipment(m.deliverTo)
      }));

      return { success: true, data: mapped };
    } catch (error) {
      console.error('ShipmentService getMemos error:', error);
      return { success: false, message: 'Error loading memos' };
    }
  }

  // Memo helpers (store memo separately so shipment.items remain unchanged)
  async getMemoByShipmentId(shipmentId: string) {
    try {
      const memo = await prisma.memo.findUnique({ where: { shipmentId } });
      return { success: true, data: memo };
    } catch (error) {
      console.error('getMemoByShipmentId error', error);
      return { success: false, message: 'Error loading memo' };
    }
  }

  async upsertMemoDraft(shipmentId: string, payload: any) {
    try {
      const data: any = {
        shipmentId,
        memoNo: payload.memoNo ?? null,
        goodsType: payload.goodsType ?? null,
        shipmentType: payload.shipmentType ?? null,
        dangerLevel: payload.dangerLevel ?? null,
        specialPermit: payload.specialPermit ?? false,
        invoiceType: payload.invoiceType ?? null,
        purpose: payload.purpose ?? null,
        sapInfo: payload.sapInfo ?? null,
        tpNo: payload.tpNo ?? null,
        tpDate: payload.tpDate ?? null,
        packingDetails: payload.packingDetails ?? null,
        memoGoodsInfo: payload.memoGoodsInfo ?? null,
        manualItems: payload.manualItems ?? null,
        portOfDischarge: payload.portOfDischarge ?? null,
        shipmentMethod: payload.shipmentMethod ?? null,
        paymentMethod: payload.paymentMethod ?? null,
        exportType: payload.exportType ?? null,
        etdShipment: payload.etdShipment ?? null,
        status: 'DRAFT'
      };

      const memo = await prisma.memo.upsert({
        where: { shipmentId },
        update: data,
        create: data
      });
      return { success: true, data: memo };
    } catch (error) {
      console.error('upsertMemoDraft error', error);
      return { success: false, message: 'Error saving memo draft' };
    }
  }

  async deleteMemoDraft(shipmentId: string) {
    try {
      await prisma.memo.deleteMany({ where: { shipmentId } });
      return { success: true };
    } catch (error) {
      console.error('deleteMemoDraft error', error);
      return { success: false, message: 'Error deleting memo draft' };
    }
  }

  // publish: mark memo as published and (optionally) update shipment status
  async publishMemo(shipmentId: string, publishPayload: any) {
    try {
      const memo = await prisma.memo.update({
        where: { shipmentId },
        data: { ...publishPayload, status: 'PUBLISHED' }
      });
      // optionally update shipment.status if desired:
      if (publishPayload.setShipmentStatus) {
        await prisma.shipment.update({
          where: { id: shipmentId },
          data: { status: publishPayload.setShipmentStatus }
        });
      }
      return { success: true, data: memo };
    } catch (error) {
      console.error('publishMemo error', error);
      return { success: false, message: 'Error publishing memo' };
    }
  }
}

export const shipmentService = new ShipmentService();

function mapCompanyForShipment(c: any) {
  if (!c) return null;
  return {
    id: c.id ?? c._id ?? c.companyId ?? c.company_id ?? null,
    companyName: c.companyName ?? c.name ?? c.company ?? c.company_name ?? null,
    address: c.address ?? c.addr ?? c.alamat ?? c.location?.address ?? null,
    country:
      c.country ??
      c.negara ??
      c.countryName ??
      c.country_code ??
      c.location?.country ??
      (c.contactPerson && (c.contactPerson.country || c.contactPerson.negara)) ??
      null,
    attention:
      c.attention ??
      c.contactPerson ??
      c.contact_person ??
      (c.contactPerson && (c.contactPerson.name || c.contactPerson.contactName)) ??
      null,
    section: c.section ?? c.division ?? c.department ?? c.sectionName ?? (c.contactPerson && c.contactPerson.section) ?? null,
    phone: c.phone ?? c.telephone ?? c.telp ?? (c.contactPerson && (c.contactPerson.phone || c.contactPerson.tel)) ?? null,
    fax: c.fax ?? c.faxNumber ?? c.fax_no ?? (c.contactPerson && c.contactPerson.fax) ?? null,
    email: c.email ?? c.emailAddress ?? c.contactEmail ?? (c.contactPerson && c.contactPerson.email) ?? null,
    ...c
  };
}