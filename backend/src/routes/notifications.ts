import { Router } from 'express';
import { listNotifications, markRead, markAllRead } from '../controllers/notificationController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, listNotifications);
router.put('/:id/read', authenticate, markRead);
router.put('/mark-all-read', authenticate, markAllRead);

export default router;