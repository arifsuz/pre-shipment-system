// backend/src/routes/auth.ts
import express from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const authController = new AuthController();

router.post('/login', authController.login.bind(authController));
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));

export default router;