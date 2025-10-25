// backend/src/routes/upload.ts
import express from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import { ExcelService } from '../services/excelService';
import { authenticate } from '../middleware/auth';
import { notificationService } from '../services/notificationService';

const router = express.Router();
const excelService = new ExcelService();

// Configure multer for file upload
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                file.mimetype === 'application/vnd.ms-excel') {
            cb(null, true);
        } else {
            cb(new Error('Hanya file Excel yang diizinkan (.xlsx, .xls)'));
        }
    }
});

router.post('/excel', authenticate, upload.single('file'), async (req, res) => {
  try {
        console.log('📨 Received file upload request');
        
        if (!req.file) {
            console.log('❌ No file uploaded');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded'
            });
        }

        console.log('📁 File details:', {
            name: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype
        });

        const result = excelService.parseShipmentExcel(req.file.buffer);

        console.log('📊 Parse result:', {
            success: result.success,
            parsedSheets: Array.isArray(result.errors) ? 'hasErrors' : 'ok',
            errorCount: result.errors?.length || 0,
            warningCount: result.warnings?.length || 0
        });

        if (!result.success) {
            return res.status(400).json({
                success: false,
                message: 'Failed to process Excel file',
                errors: result.errors || ['Unknown parsing error']
            });
        }

        // create notification
        try {
            const username = (req as any).user?.nama ?? (req as any).user?.email ?? 'Unknown';
            const title = `Upload: ${req.file.originalname}`;
            const content = `${username} uploaded file "${req.file.originalname}". Parsed ${result.data?.items?.length ?? 0} items.`;
            await notificationService.create({ title, content, userId: (req as any).user?.id });
        } catch (notifErr) {
            console.error('Failed create notification', notifErr);
        }

        res.json({
            success: true,
            message: 'Excel file processed and merged successfully',
            data: result.data,
            warnings: result.warnings
        });

    } catch (error) {
        console.error('💥 Upload route error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error while processing file',
            error: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined
        });
    }
});

// Added test route
router.post('/test', authenticate, upload.single('file'), async (req, res) => {
  try {
    console.log('🧪 Test endpoint called');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file provided'
      });
    }

    // Basic file info
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    
    res.json({
      success: true,
      message: 'File received successfully',
      fileInfo: {
        name: req.file.originalname,
        size: req.file.size,
        type: req.file.mimetype,
        sheetCount: workbook.SheetNames.length,
        sheetNames: workbook.SheetNames
      }
    });

  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing test file',
      error: (error as Error).message
    });
  }
});

export default router;