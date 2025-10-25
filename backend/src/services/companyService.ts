// backend/src/services/companyService.ts
import { prisma } from '../utils/database';
import { ApiResponse, Company } from '../types';

export class CompanyService {
  async getAllCompanies(): Promise<ApiResponse> {
    try {
      const companies = await prisma.company.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      });

      return {
        success: true,
        message: 'Companies retrieved successfully',
        data: { companies }
      };
    } catch (error) {
      console.error('CompanyService getAllCompanies error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async createCompany(companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse> {
    try {
      const company = await prisma.company.create({
        data: companyData
      });

      return {
        success: true,
        message: 'Company created successfully',
        data: { company }
      };
    } catch (error) {
      console.error('CompanyService createCompany error:', error);
      return { success: false, message: 'Internal server error' };
    }
  }

  async updateCompany(
    companyId: string, 
    updateData: Partial<Company>
  ): Promise<ApiResponse> {
    try {
      const company = await prisma.company.update({
        where: { id: companyId },
        data: updateData
      });

      return {
        success: true,
        message: 'Company updated successfully',
        data: { company }
      };
    } catch (error) {
      console.error('CompanyService updateCompany error:', error);
      return { success: false, message: 'Error updating company' };
    }
  }

  async deleteCompany(companyId: string): Promise<ApiResponse> {
    try {
      await prisma.company.update({
        where: { id: companyId },
        data: { isActive: false }
      });

      return {
        success: true,
        message: 'Company deleted successfully'
      };
    } catch (error) {
      console.error('CompanyService deleteCompany error:', error);
      return { success: false, message: 'Error deleting company' };
    }
  }
}