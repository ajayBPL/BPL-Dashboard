/**
 * Notifications Routes
 * 
 * Handles all notification-related operations including:
 * - Retrieving user notifications
 * - Marking notifications as read/unread
 * - Creating system notifications
 * - Managing notification preferences
 * - Real-time notification delivery
 * 
 * @module notifications
 */

import express, { Request, Response } from 'express';
import { body, query, param } from 'express-validator';
import { validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { parseQuery } from '../middleware/queryParser';
import { db } from '../services/database';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /notifications - Get user notifications
 * 
 * Retrieves notifications for the authenticated user:
 * - Supports pagination and filtering
 * - Filters by read/unread status
 * - Supports notification type filtering
 * - Returns notification details with metadata
 * 
 * @route GET /api/notifications
 * @access Private (requires valid JWT token)
 * @returns {Object} List of user notifications
 */
router.get('/', [
  parseQuery,
  query('status').optional().isIn(['read', 'unread', 'all']),
  query('type').optional().isIn(['info', 'warning', 'error', 'success', 'project', 'user', 'system']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid query parameters');
  }

  const { status = 'all', type, page = 1, limit = 20 } = req.query;

  // Get notifications from database service
  const notifications = await db.getUserNotifications(req.user!.id, {
    page: Number(page),
    limit: Number(limit),
    filters: {
      ...(status !== 'all' && { status }),
      ...(type && { type })
    }
  });

  res.json({
    success: true,
    data: notifications.data,
    meta: {
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: notifications.total,
        pages: Math.ceil(notifications.total / Number(limit))
      },
      unreadCount: notifications.unreadCount,
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;

