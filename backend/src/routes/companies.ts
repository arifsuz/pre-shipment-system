// backend/src/routes/companies.ts
import express from 'express';
import { CompanyController } from '../controllers/companyController';
import { authenticate } from '../middleware/auth';

const router = express.Router();
const companyController = new CompanyController();

router.get('/', authenticate, companyController.getAllCompanies.bind(companyController));
router.post('/', authenticate, companyController.createCompany.bind(companyController));
router.put('/:id', authenticate, companyController.updateCompany.bind(companyController));
router.delete('/:id', authenticate, companyController.deleteCompany.bind(companyController));

export default router;