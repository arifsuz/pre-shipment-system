import { Request, Response } from 'express';
import { notificationService } from '../services/notificationService';

export const listNotifications = async (_req: Request, res: Response) => {
  try {
    const data = await notificationService.list(50);
    return res.json({ success: true, data });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const notif = await notificationService.markRead(id);
    return res.json({ success: true, data: notif });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

export const markAllRead = async (_req: Request, res: Response) => {
  try {
    await notificationService.markAllRead();
    return res.json({ success: true });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};