// backend/src/controllers/userController.ts
import { Response } from 'express';
import { UserService } from '../services/userService';
import { createUserSchema } from '../utils/validation';
import { AuthRequest } from '../types';

const userService = new UserService();

export class UserController {
  async getAllUsers(req: AuthRequest, res: Response) {
    try {
      const result = await userService.getAllUsers();
      res.json(result);
    } catch (error) {
      console.error('UserController getAllUsers error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async createUser(req: AuthRequest, res: Response) {
    try {
      const userData = createUserSchema.parse(req.body);
      
      const result = await userService.createUser(userData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('UserController createUser error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid request data' 
      });
    }
  }

  async updateUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await userService.updateUser(id, updateData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('UserController updateUser error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Error updating user' 
      });
    }
  }

  async deleteUser(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const result = await userService.deleteUser(id);
      if (!result.success) {
        return res.status(result.status ?? 400).json({ success: false, message: result.message });
      }
      return res.json({ success: true, message: result.message });
    } catch (error) {
      console.error('UserController deleteUser error:', error);
      return res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }
}

// tambahkan default export agar `import userController from '../controllers/userController'` valid
export default new UserController();