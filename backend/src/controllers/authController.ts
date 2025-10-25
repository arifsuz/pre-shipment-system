// backend/src/controllers/authController.ts
import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { loginSchema } from '../utils/validation';
import { AuthRequest } from '../types';

const authService = new AuthService();

export class AuthController {
  async login(req: Request, res: Response) {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const result = await authService.login(username, password);
      
      if (!result.success) {
        return res.status(401).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('AuthController login error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid request data' 
      });
    }
  }

  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      const result = await authService.getCurrentUser(req.user!.id);
      
      if (!result.success) {
        return res.status(404).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('AuthController getCurrentUser error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }
}