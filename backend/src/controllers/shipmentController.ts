// backend/src/controllers/shipmentController.ts
import { Response } from 'express';
import { ShipmentService } from '../services/shipmentService';
import { createShipmentSchema, memoUpdateSchema } from '../utils/validation';
import { AuthRequest } from '../types';
import { ZodError } from 'zod';

const shipmentService = new ShipmentService();

export class ShipmentController {
  async getAllShipments(req: AuthRequest, res: Response) {
    try {
      const { status, page = 1, limit = 10 } = req.query;
      
      const result = await shipmentService.getAllShipments(
        { status: status as string },
        Number(page),
        Number(limit)
      );
      
      res.json(result);
    } catch (error) {
      console.error('ShipmentController getAllShipments error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async getShipmentById(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      
      const result = await shipmentService.getShipmentById(id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('ShipmentController getShipmentById error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async createShipment(req: AuthRequest, res: Response) {
    try {
      // parse/validate request
      const parsed = createShipmentSchema.parse(req.body);
      // normalize rackNo to string for DB storage (if frontend sent array)
      const normalized = {
        ...parsed,
        rackNo: Array.isArray((parsed as any).rackNo) ? (parsed as any).rackNo.join(', ') : (parsed as any).rackNo
      };

      const result = await shipmentService.createShipment(normalized, req.user!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('ShipmentController createShipment error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      res.status(400).json({
        success: false,
        message: (error as Error).message || 'Invalid request data'
      });
    }
  }

  async updateShipment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      // Terima partial update dan biarkan keys tambahan (memo fields) lolos
      const updateData = createShipmentSchema.partial().passthrough().parse(req.body);

      const result = await shipmentService.updateShipment(id, updateData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('ShipmentController updateShipment error:', error);
      // Tampilkan error validasi Zod bila ada untuk debugging di client
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: error.errors
        });
      }
      res.status(400).json({ 
        success: false, 
        message: 'Error updating shipment' 
      });
    }
  }

  async updateShipmentStatus(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { status } = req.body;

      if (!['DRAFT', 'IN_PROCESS', 'APPROVED'].includes(status)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid status' 
        });
      }

      const result = await shipmentService.updateShipmentStatus(id, status);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('ShipmentController updateShipmentStatus error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Error updating shipment status' 
      });
    }
  }

  async deleteShipment(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const result = await shipmentService.deleteShipment(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('ShipmentController deleteShipment error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Error deleting shipment' 
      });
    }
  }

  // new: update only memo-related fields via dedicated endpoint
  async updateShipmentMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const memoData = memoUpdateSchema.parse(req.body);

      // Prevent manualItems from replacing shipment.items in DB.
      // Keep memo-related scalars and, if frontend sent manualItems and there's
      // no memoGoodsInfo text, persist a JSON snapshot into memoGoodsInfo (non-destructive).
      const { manualItems, ...memoOnly } = memoData as any;

      if (Array.isArray(manualItems) && manualItems.length && !memoOnly.memoGoodsInfo) {
        // store as fallback text so memo content is not lost (optional)
        memoOnly.memoGoodsInfo = JSON.stringify(manualItems);
      }

      const result = await shipmentService.updateShipment(id, memoOnly);

      if (!result.success) {
        return res.status(400).json(result);
      }

      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('ShipmentController.updateShipmentMemo error:', error);
      if (error instanceof ZodError) {
        return res.status(400).json({ success: false, message: 'Validation failed', errors: error.errors });
      }
      return res.status(500).json({ success: false, message: 'Error updating memo' });
    }
  }

  async getMemos(req: AuthRequest, res: Response) {
    try {
      const result = await shipmentService.getMemos();
      if (!result.success) return res.status(500).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('ShipmentController.getMemos error:', error);
      return res.status(500).json({ success: false, message: 'Error loading memos' });
    }
  }

  // GET /shipments/:id/memo - get memo (draft or published) for shipment
  async getMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await shipmentService.getMemoByShipmentId(id);
      if (!result.success) return res.status(404).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('ShipmentController.getMemo error:', error);
      return res.status(500).json({ success: false, message: 'Error loading memo' });
    }
  }

  // PUT /shipments/:id/memo - upsert draft memo (autosave / Save Draft In-Process)
  async upsertMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const result = await shipmentService.upsertMemoDraft(id, payload);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('ShipmentController.upsertMemo error:', error);
      return res.status(500).json({ success: false, message: 'Error saving memo draft' });
    }
  }

  // DELETE /shipments/:id/memo - delete draft (Cancel)
  async deleteMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await shipmentService.deleteMemoDraft(id);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true });
    } catch (error) {
      console.error('ShipmentController.deleteMemo error:', error);
      return res.status(500).json({ success: false, message: 'Error deleting memo draft' });
    }
  }

  // POST /shipments/:id/memo/publish - publish memo (and optionally update shipment status)
  async publishMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const result = await shipmentService.publishMemo(id, payload);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('ShipmentController.publishMemo error:', error);
      return res.status(500).json({ success: false, message: 'Error publishing memo' });
    }
  }

  // POST /shipments/:id/memo/save - final save memo (Draft/In Process) with company creation
  async saveMemoFinal(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const { statusAfterSave, ...payload } = req.body;
      
      if (!['DRAFT', 'IN_PROCESS'].includes(statusAfterSave)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }
      
      const result = await shipmentService.finalSaveMemo(id, payload, statusAfterSave);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('ShipmentController.saveMemoFinal error:', error);
      return res.status(500).json({ success: false, message: 'Error saving memo' });
    }
  }
}