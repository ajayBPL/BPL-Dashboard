import express, { Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { fileBasedMockDb } from '../services/fileBasedMockDb';

const router = express.Router();

// GET /sync/data - Get all data for synchronization
router.get('/data', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const data = await fileBasedMockDb.getAllDataForSync();
    
    res.json({
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        source: 'sync-endpoint'
      }
    });
  } catch (error) {
    console.error('Sync data error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get sync data',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// POST /sync/trigger - Manually trigger data synchronization
router.post('/trigger', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Trigger immediate sync
    const data = await fileBasedMockDb.getAllDataForSync();
    
    res.json({
      success: true,
      message: 'Data synchronization triggered',
      data: {
        usersCount: data.users.length,
        projectsCount: data.projects.length,
        initiativesCount: data.initiatives.length,
        notificationsCount: data.notifications.length,
        activityLogsCount: data.activityLogs.length
      },
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Sync trigger error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to trigger sync',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;
