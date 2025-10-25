// backend/src/routes/users.ts
import express from 'express';
import { authenticate, requireAdmin } from '../middleware/auth';
import userController from '../controllers/userController';

const router = express.Router();

router.get('/', authenticate, requireAdmin, userController.getAllUsers.bind(userController));
router.post('/', authenticate, requireAdmin, userController.createUser.bind(userController));
router.put('/:id', authenticate, requireAdmin, userController.updateUser.bind(userController));
router.delete('/:id', authenticate, requireAdmin, userController.deleteUser.bind(userController));

export default router;