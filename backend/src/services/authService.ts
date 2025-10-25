// backend/src/services/authService.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/database';
import { ApiResponse } from '../types';

export class AuthService {
  async login(username: string, password: string): Promise<ApiResponse> {
    try {
      // Find user by username or email
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ username }, { email: username }],
          isActive: true
        }
      });

      if (!user) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return { success: false, message: 'Invalid credentials' };
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          role: user.role
        },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      return {
        success: true,
        message: 'Login successful',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            nama: user.nama,
            username: user.username,
            role: user.role
          }
        }
      };
    } catch (error) {
      console.error('AuthService login error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async getCurrentUser(userId: string): Promise<ApiResponse> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          nama: true,
          username: true,
          role: true,
          createdAt: true
        }
      });

      if (!user) {
        return { success: false, message: 'User not found' };
      }

      return {
        success: true,
        message: 'User data retrieved',
        data: { user }
      };
    } catch (error) {
      console.error('AuthService getCurrentUser error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }
}