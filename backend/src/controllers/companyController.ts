// backend/src/controllers/companyController.ts
import { Response } from 'express';
import { CompanyService } from '../services/companyService';
import { createCompanySchema } from '../utils/validation';
import { AuthRequest } from '../types';

const companyService = new CompanyService();

export class CompanyController {
  async getAllCompanies(req: AuthRequest, res: Response) {
    try {
      const result = await companyService.getAllCompanies();
      res.json(result);
    } catch (error) {
      console.error('CompanyController getAllCompanies error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Internal server error' 
      });
    }
  }

  async createCompany(req: AuthRequest, res: Response) {
    try {
      const companyData = createCompanySchema.parse(req.body);
      
      const result = await companyService.createCompany(companyData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);
    } catch (error) {
      console.error('CompanyController createCompany error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Invalid request data' 
      });
    }
  }

  async updateCompany(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      const result = await companyService.updateCompany(id, updateData);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('CompanyController updateCompany error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Error updating company' 
      });
    }
  }

  async deleteCompany(req: AuthRequest, res: Response) {
    try {
      const { id } = req.params;

      const result = await companyService.deleteCompany(id);
      
      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('CompanyController deleteCompany error:', error);
      res.status(400).json({ 
        success: false, 
        message: 'Error deleting company' 
      });
    }
  }
}