/**
 * Analytics Routes
 * 
 * Handles all analytics and reporting operations including:
 * - Dashboard metrics and KPIs
 * - Project performance analytics
 * - User workload and productivity metrics
 * - Initiative progress tracking
 * - Custom report generation
 * 
 * @module analytics
 */

import express, { Request, Response } from 'express';
import { query, param } from 'express-validator';
import { validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { parseQuery } from '../middleware/queryParser';
import { db } from '../services/database';

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /analytics - Get comprehensive dashboard analytics
 * 
 * Retrieves analytics data for dashboard display:
 * - Project status distribution
 * - User workload metrics
 * - Initiative progress overview
 * - Recent activity summary
 * - Performance indicators
 * 
 * @route GET /api/analytics
 * @access Private (requires valid JWT token)
 * @returns {Object} Comprehensive analytics data
 */
router.get('/', [
  parseQuery,
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('department').optional().isString(),
  query('userId').optional().isString()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid query parameters');
  }

  const { period = 'month', department, userId } = req.query;

  // Get analytics data from database service
  const [
    projectMetrics,
    userMetrics,
    initiativeMetrics,
    activityMetrics,
    workloadMetrics
  ] = await Promise.all([
    db.getProjectAnalytics({ period: period as string, department: department as string }),
    db.getUserAnalytics({ period: period as string, department: department as string, userId: userId as string }),
    db.getInitiativeAnalytics({ period: period as string }),
    db.getActivityAnalytics({ period: period as string }),
    db.getWorkloadAnalytics({ period: period as string, department: department as string })
  ]);

  res.json({
    success: true,
    data: {
      projects: projectMetrics,
      users: userMetrics,
      initiatives: initiativeMetrics,
      activity: activityMetrics,
      workload: workloadMetrics,
      period: period,
      generatedAt: new Date().toISOString()
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /analytics/projects - Get project-specific analytics
 * 
 * Retrieves detailed project analytics:
 * - Project completion rates
 * - Timeline performance
 * - Budget utilization
 * - Resource allocation
 * - Quality metrics
 * 
 * @route GET /api/analytics/projects
 * @access Private (requires valid JWT token)
 * @returns {Object} Project analytics data
 */
router.get('/projects', [
  parseQuery,
  query('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('category').optional().isString(),
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid query parameters');
  }

  const { status, priority, category, period = 'month' } = req.query;

  // Get project analytics from database service
  const projectAnalytics = await db.getProjectAnalytics({
    period: period as string,
    filters: {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category })
    }
  });

  res.json({
    success: true,
    data: projectAnalytics,
    meta: {
      period: period,
      filters: { status, priority, category },
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /analytics/users - Get user-specific analytics
 * 
 * Retrieves detailed user performance analytics:
 * - Workload distribution
 * - Productivity metrics
 * - Project contributions
 * - Skill utilization
 * - Performance trends
 * 
 * @route GET /api/analytics/users
 * @access Private (requires valid JWT token)
 * @returns {Object} User analytics data
 */
router.get('/users', [
  parseQuery,
  query('department').optional().isString(),
  query('role').optional().isIn(['admin', 'manager', 'employee', 'program_manager', 'rd_manager']),
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid query parameters');
  }

  const { department, role, period = 'month' } = req.query;

  // Get user analytics from database service
  const userAnalytics = await db.getUserAnalytics({
    period: period as string,
    filters: {
      ...(department && { department }),
      ...(role && { role })
    }
  });

  res.json({
    success: true,
    data: userAnalytics,
    meta: {
      period: period,
      filters: { department, role },
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /analytics/workload - Get workload analytics
 * 
 * Retrieves workload distribution and capacity analytics:
 * - Current workload vs capacity
 * - Overloaded users
 * - Available capacity
 * - Workload trends
 * - Resource optimization suggestions
 * 
 * @route GET /api/analytics/workload
 * @access Private (requires valid JWT token)
 * @returns {Object} Workload analytics data
 */
router.get('/workload', [
  parseQuery,
  query('department').optional().isString(),
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid query parameters');
  }

  const { department, period = 'month' } = req.query;

  // Get workload analytics from database service
  const workloadAnalytics = await db.getWorkloadAnalytics({
    period: period as string,
    department: department as string
  });

  res.json({
    success: true,
    data: workloadAnalytics,
    meta: {
      period: period,
      department: department,
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /analytics/initiatives - Get initiative analytics
 * 
 * Retrieves initiative progress and performance analytics:
 * - Initiative completion rates
 * - Progress tracking
 * - Budget utilization
 * - Timeline performance
 * - Resource allocation
 * 
 * @route GET /api/analytics/initiatives
 * @access Private (requires valid JWT token)
 * @returns {Object} Initiative analytics data
 */
router.get('/initiatives', [
  parseQuery,
  query('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('period').optional().isIn(['week', 'month', 'quarter', 'year'])
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid query parameters');
  }

  const { status, priority, period = 'month' } = req.query;

  // Get initiative analytics from database service
  const initiativeAnalytics = await db.getInitiativeAnalytics({
    period: period as string,
    filters: {
      ...(status && { status }),
      ...(priority && { priority })
    }
  });

  res.json({
    success: true,
    data: initiativeAnalytics,
    meta: {
      period: period,
      filters: { status, priority },
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /analytics/reports/:type - Generate custom reports
 * 
 * Generates custom reports based on type:
 * - Project status reports
 * - User performance reports
 * - Initiative progress reports
 * - Workload distribution reports
 * - Executive summary reports
 * 
 * @route GET /api/analytics/reports/:type
 * @access Private (requires valid JWT token)
 * @returns {Object} Custom report data
 */
router.get('/reports/:type', [
  param('type').isIn(['project-status', 'user-performance', 'initiative-progress', 'workload-distribution', 'executive-summary']),
  parseQuery,
  query('format').optional().isIn(['json', 'csv', 'pdf']),
  query('period').optional().isIn(['week', 'month', 'quarter', 'year']),
  query('department').optional().isString()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid parameters');
  }

  const { type } = req.params;
  const { format = 'json', period = 'month', department } = req.query;

  // Generate custom report from database service
  const report = await db.generateReport({
    type: type as string,
    format: format as string,
    period: period as string,
    department: department as string,
    userId: req.user!.id
  });

  res.json({
    success: true,
    data: report,
    meta: {
      type: type,
      format: format,
      period: period,
      department: department,
      generatedBy: req.user!.id,
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;

