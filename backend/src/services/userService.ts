// backend/src/services/userService.ts
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/database';
import { ApiResponse, User } from '../types';

export class UserService {
  async getAllUsers(): Promise<ApiResponse> {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          nama: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        message: 'Users retrieved successfully',
        data: { users }
      };
    } catch (error) {
      console.error('UserService getAllUsers error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async createUser(userData: {
    email: string;
    nama: string;
    username: string;
    password: string;
    role: 'ADMIN' | 'VIEWER';
  }): Promise<ApiResponse> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: userData.email }, { username: userData.username }]
        }
      });

      if (existingUser) {
        return { 
          success: false, 
          message: 'User with this email or username already exists' 
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      const user = await prisma.user.create({
        data: {
          ...userData,
          password: hashedPassword
        },
        select: {
          id: true,
          email: true,
          nama: true,
          username: true,
          role: true,
          createdAt: true
        }
      });

      return {
        success: true,
        message: 'User created successfully',
        data: { user }
      };
    } catch (error) {
      console.error('UserService createUser error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async updateUser(
    userId: string, 
    updateData: Partial<User>
  ): Promise<ApiResponse> {
    try {
      const user = await prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          nama: true,
          username: true,
          role: true,
          isActive: true,
          updatedAt: true
        }
      });

      return {
        success: true,
        message: 'User updated successfully',
        data: { user }
      };
    } catch (error) {
      console.error('UserService updateUser error:', error);
      return { success: false, message: 'Error updating user' };
    }
  }

  async deleteUser(userId: string): Promise<{ success: boolean; message: string; status?: number }> {
    try {
      const existing = await prisma.user.findUnique({ where: { id: userId } });
      if (!existing) {
        return { success: false, message: 'User not found', status: 404 };
      }
      await prisma.user.delete({ where: { id: userId } });
      return { success: true, message: 'User deleted successfully' };
    } catch (error) {
      console.error('UserService deleteUser error:', error);
      return { success: false, message: 'Failed to delete user', status: 500 };
    }
  }
}