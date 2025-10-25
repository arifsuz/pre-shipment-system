import { Request, Response } from 'express';
import { statsService } from '../services/statsService';

export const getStats = async (req: Request, res: Response) => {
  try {
    const data = await statsService.getCounts();
    return res.json({
      success: true,
      message: 'Stats retrieved',
      data
    });
  } catch (error) {
    console.error('getStats error', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};