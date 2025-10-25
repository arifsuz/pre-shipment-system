import { prisma } from '../utils/database';

export class NotificationService {
  async create(data: { title: string; content: string; userId?: string }) {
    return prisma.notification.create({ data });
  }

  async list(limit = 20) {
    return prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async markRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  async markAllRead() {
    return prisma.notification.updateMany({
      where: { isRead: false },
      data: { isRead: true },
    });
  }
}

export const notificationService = new NotificationService();