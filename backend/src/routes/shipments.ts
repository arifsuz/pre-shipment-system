// backend/src/routes/shipments.ts
import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// lazy loader helper to avoid circular import / TDZ
async function getShipmentControllerInstance() {
    const mod = await import('../controllers/shipmentController');
    const Controller = mod.ShipmentController;
    return new Controller();
}

function withController(handler: (ctrl: any, req: any, res: any, next?: any) => any) {
    return async (req: any, res: any, next: any) => {
        try {
            const ctrl = await getShipmentControllerInstance();
            await handler(ctrl, req, res, next);
        } catch (err) {
            next(err);
        }
    };
}

router.get('/', authenticate, withController((ctrl, req, res) => ctrl.getAllShipments(req, res)));
router.get('/memos', authenticate, withController((ctrl, req, res) => ctrl.getMemos(req, res)));
router.get('/:id', authenticate, withController((ctrl, req, res) => ctrl.getShipmentById(req, res)));
router.post('/', authenticate, withController((ctrl, req, res) => ctrl.createShipment(req, res)));
router.put('/:id', authenticate, withController((ctrl, req, res) => ctrl.updateShipment(req, res)));
router.patch('/:id/status', authenticate, withController((ctrl, req, res) => ctrl.updateShipmentStatus(req, res)));
router.delete('/:id', authenticate, withController((ctrl, req, res) => ctrl.deleteShipment(req, res)));
router.get('/:id/memo', authenticate, withController((ctrl, req, res) => ctrl.getMemo(req, res)));
router.put('/:id/memo', authenticate, withController((ctrl, req, res) => ctrl.upsertMemo(req, res)));
router.delete('/:id/memo', authenticate, withController((ctrl, req, res) => ctrl.deleteMemo(req, res)));
router.post('/:id/memo/publish', authenticate, withController((ctrl, req, res) => ctrl.publishMemo(req, res)));

export default router;

// backend/src/controllers/shipmentController.ts
import { Request, Response } from 'express';
import { shipmentService } from '../services/shipmentService';

export class ShipmentController {
  // ...existing methods...

  // GET /shipments/:id/memo - get memo (draft or published) for shipment
  async getMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await shipmentService.getMemoByShipmentId(id);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('getMemo error', error);
      return res.status(500).json({ success: false, message: 'Error loading memo' });
    }
  }

  // PUT /shipments/:id/memo - upsert draft memo (autosave)
  async upsertMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const result = await shipmentService.upsertMemoDraft(id, payload);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('upsertMemo error', error);
      return res.status(500).json({ success: false, message: 'Error saving memo' });
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
      console.error('deleteMemo error', error);
      return res.status(500).json({ success: false, message: 'Error deleting memo' });
    }
  }

  // POST /shipments/:id/memo/publish - publish memo and optionally update shipment status
  async publishMemo(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const payload = req.body;
      const result = await shipmentService.publishMemo(id, payload);
      if (!result.success) return res.status(400).json(result);
      return res.json({ success: true, data: result.data });
    } catch (error) {
      console.error('publishMemo error', error);
      return res.status(500).json({ success: false, message: 'Error publishing memo' });
    }
  }
}