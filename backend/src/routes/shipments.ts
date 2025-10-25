// backend/src/routes/shipments.ts
import express from 'express';
import { ShipmentController } from '../controllers/shipmentController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const shipmentController = new ShipmentController();

router.get('/', authenticate, shipmentController.getAllShipments.bind(shipmentController));
router.get('/memos', authenticate, (req, res) => shipmentController.getMemos(req, res));
router.get('/:id', authenticate, shipmentController.getShipmentById.bind(shipmentController));
router.post('/', authenticate, shipmentController.createShipment.bind(shipmentController));
router.put('/:id', authenticate, shipmentController.updateShipment.bind(shipmentController));
router.patch('/:id/status', authenticate, shipmentController.updateShipmentStatus.bind(shipmentController));
router.delete('/:id', authenticate, shipmentController.deleteShipment.bind(shipmentController));
router.put('/:id/memo', authenticate, (req, res) => shipmentController.updateShipmentMemo(req, res));

export default router;