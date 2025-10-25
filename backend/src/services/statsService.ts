import { prisma } from '../utils/database';

export class StatsService {
  async getCounts() {
    // shipments by status
    const [totalShipments, approved, inProcess, draft, totalCompanies, totalUsers] = await Promise.all([
      prisma.shipment.count(),
      prisma.shipment.count({ where: { status: 'APPROVED' } }),
      prisma.shipment.count({ where: { status: 'IN_PROCESS' } }),
      prisma.shipment.count({ where: { status: 'DRAFT' } }),
      prisma.company.count(),
      prisma.user.count()
    ]);

    return {
      totalShipments,
      approved,
      inProcess,
      draft,
      totalCompanies,
      totalUsers
    };
  }
}

export const statsService = new StatsService();