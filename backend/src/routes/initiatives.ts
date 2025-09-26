/**
 * Initiatives Routes
 * 
 * Handles all initiative-related operations including:
 * - Creating new initiatives
 * - Retrieving initiatives with filtering and pagination
 * - Updating initiative details
 * - Managing initiative assignments
 * - Tracking initiative progress and milestones
 * 
 * @module initiatives
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
 * GET /initiatives - Get all initiatives with filtering and pagination
 * 
 * Retrieves initiatives based on query parameters:
 * - Supports pagination (page, limit)
 * - Supports filtering by status, priority, category
 * - Supports sorting by various fields
 * - Returns initiative details with assigned users and progress
 * 
 * @route GET /api/initiatives
 * @access Private (requires valid JWT token)
 * @returns {Object} List of initiatives with metadata
 */
router.get('/', [
  parseQuery,
  query('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  query('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  query('category').optional().isString(),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid query parameters');
  }

  const { page = 1, limit = 20, status, priority, category, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;

  // Get initiatives from database service
  const initiatives = await db.getInitiatives({
    page: Number(page),
    limit: Number(limit),
    filters: {
      ...(status && { status }),
      ...(priority && { priority }),
      ...(category && { category })
    },
    sort: {
      field: sortBy as string,
      order: sortOrder as 'asc' | 'desc'
    }
  });

  res.json({
    success: true,
    data: initiatives.data,
    meta: {
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: initiatives.total,
        pages: Math.ceil(initiatives.total / Number(limit))
      },
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * POST /initiatives - Create a new initiative
 * 
 * Creates a new initiative with validation:
 * - Validates required fields (title, description, priority)
 * - Sets creator as initiative owner
 * - Initializes progress tracking
 * - Logs activity for audit trail
 * 
 * @route POST /api/initiatives
 * @access Private (requires valid JWT token)
 * @returns {Object} Created initiative details
 */
router.post('/', [
  body('title').isLength({ min: 3, max: 200 }).trim(),
  body('description').isLength({ min: 10, max: 2000 }).trim(),
  body('priority').isIn(['low', 'medium', 'high', 'critical']),
  body('category').optional().isString().trim(),
  body('targetDate').optional().isISO8601(),
  body('budget').optional().isNumeric(),
  body('assignedUsers').optional().isArray()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed');
  }

  const initiativeData = req.body;

  // Create initiative using database service
  const initiative = await db.createInitiative({
    title: initiativeData.title,
    description: initiativeData.description,
    priority: initiativeData.priority,
    category: initiativeData.category || 'General',
    ownerId: req.user!.id,
    targetDate: initiativeData.targetDate,
    budget: initiativeData.budget,
    status: 'active',
    progress: 0
  });

  // Assign users if provided
  if (initiativeData.assignedUsers && initiativeData.assignedUsers.length > 0) {
    await db.assignUsersToInitiative(initiative.id, initiativeData.assignedUsers);
  }

  // Log activity
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'INITIATIVE_CREATED',
    entityType: 'INITIATIVE',
    entityId: initiative.id,
    details: `Created initiative: ${initiative.title}`
  });

  res.status(201).json({
    success: true,
    data: initiative,
    message: 'Initiative created successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /initiatives/:id - Get specific initiative details
 * 
 * Retrieves detailed information about a specific initiative:
 * - Initiative details and progress
 * - Assigned users and their roles
 * - Related projects and milestones
 * - Activity history and updates
 * 
 * @route GET /api/initiatives/:id
 * @access Private (requires valid JWT token)
 * @returns {Object} Initiative details with related data
 */
router.get('/:id', [
  param('id').isString().notEmpty()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid initiative ID');
  }

  const { id } = req.params;

  // Get initiative details from database service
  const initiative = await db.getInitiativeById(id);

  if (!initiative) {
    throw new NotFoundError('Initiative not found');
  }

  // Get related data
  const [assignedUsers, relatedProjects, activityLogs] = await Promise.all([
    db.getInitiativeAssignments(id),
    db.getInitiativeProjects(id),
    db.getInitiativeActivityLogs(id)
  ]);

  res.json({
    success: true,
    data: {
      initiative: initiative || {},
      assignedUsers,
      relatedProjects,
      activityLogs
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * PUT /initiatives/:id - Update initiative details
 * 
 * Updates initiative information with validation:
 * - Validates user permissions (owner or admin)
 * - Updates allowed fields
 * - Tracks changes for audit trail
 * - Notifies assigned users of updates
 * 
 * @route PUT /api/initiatives/:id
 * @access Private (requires valid JWT token)
 * @returns {Object} Updated initiative details
 */
router.put('/:id', [
  param('id').isString().notEmpty(),
  body('title').optional().isLength({ min: 3, max: 200 }).trim(),
  body('description').optional().isLength({ min: 10, max: 2000 }).trim(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['active', 'completed', 'on_hold', 'cancelled']),
  body('progress').optional().isInt({ min: 0, max: 100 }),
  body('targetDate').optional().isISO8601(),
  body('budget').optional().isNumeric()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed');
  }

  const { id } = req.params;
  const updateData = req.body;

  // Check if initiative exists
  const existingInitiative = await db.getInitiativeById(id);
  if (!existingInitiative) {
    throw new NotFoundError('Initiative not found');
  }

  // Check permissions (owner or admin)
  if ((existingInitiative as any)?.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    throw new ValidationError('Insufficient permissions to update this initiative');
  }

  // Update initiative using database service
  const updatedInitiative = await db.updateInitiative(id, updateData);

  // Log activity
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'INITIATIVE_UPDATED',
    entityType: 'INITIATIVE',
    entityId: id,
    details: `Updated initiative: ${updatedInitiative.title}`
  });

  res.json({
    success: true,
    data: updatedInitiative,
    message: 'Initiative updated successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * DELETE /initiatives/:id - Delete initiative
 * 
 * Soft deletes an initiative with validation:
 * - Validates user permissions (owner or admin)
 * - Checks for related projects and dependencies
 * - Performs soft delete to maintain data integrity
 * - Logs deletion for audit trail
 * 
 * @route DELETE /api/initiatives/:id
 * @access Private (requires valid JWT token)
 * @returns {Object} Success confirmation
 */
router.delete('/:id', [
  param('id').isString().notEmpty()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Invalid initiative ID');
  }

  const { id } = req.params;

  // Check if initiative exists
  const existingInitiative = await db.getInitiativeById(id);
  if (!existingInitiative) {
    throw new NotFoundError('Initiative not found');
  }

  // Check permissions (owner or admin)
  if ((existingInitiative as any)?.ownerId !== req.user!.id && req.user!.role !== 'admin') {
    throw new ValidationError('Insufficient permissions to delete this initiative');
  }

  // Check for related projects
  const relatedProjects = await db.getInitiativeProjects(id);
  if (relatedProjects.length > 0) {
    throw new ValidationError('Cannot delete initiative with active projects. Please reassign or complete projects first.');
  }

  // Soft delete initiative using database service
  await db.deleteInitiative(id);

  // Log activity
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'INITIATIVE_DELETED',
    entityType: 'INITIATIVE',
    entityId: id,
    details: `Deleted initiative: ${(existingInitiative as any)?.title || 'Unknown'}`
  });

  res.json({
    success: true,
    message: 'Initiative deleted successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;

