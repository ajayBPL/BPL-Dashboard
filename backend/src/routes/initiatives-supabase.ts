import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { db } from '../services/database';

const router = express.Router();

router.use(authenticateToken);

// GET /initiatives - List initiatives with role-based filtering
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const initiatives = await db.getAllInitiatives();
    
    console.log('🔍 Initiatives GET request:');
    console.log('  User ID:', req.user!.id);
    console.log('  User Role:', req.user!.role);
    console.log('  Total initiatives:', initiatives.length);
    
    // Apply role-based filtering
    let filteredInitiatives = initiatives;
    if (req.user!.role === 'admin' || req.user!.role === 'program_manager') {
      // Admins and Program Managers can see all initiatives
      filteredInitiatives = initiatives;
      console.log('  ✅ Admin/Program Manager - showing all initiatives');
    } else if (req.user!.role === 'manager' || req.user!.role === 'rd_manager') {
      // Managers and R&D Managers can see initiatives they created or are assigned to
      filteredInitiatives = initiatives.filter((initiative: any) => 
        initiative.createdBy === req.user!.id || 
        initiative.assignedTo === req.user!.id
      );
      console.log('  ✅ Manager/RD Manager - filtering by created/assigned');
      console.log('  Filtered initiatives:', filteredInitiatives.length);
      filteredInitiatives.forEach((i: any) => {
        console.log(`    - ${i.title} (created: ${i.createdBy === req.user!.id}, assigned: ${i.assignedTo === req.user!.id})`);
      });
    } else if (req.user!.role === 'employee') {
      // Employees can only see initiatives they're assigned to
      filteredInitiatives = initiatives.filter((initiative: any) => 
        initiative.assignedTo === req.user!.id
      );
      console.log('  ✅ Employee - filtering by assigned only');
    }

    res.json({
      success: true,
      data: filteredInitiatives,
      meta: {
        total: filteredInitiatives.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching initiatives:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch initiatives',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GET /initiatives/:id - Get specific initiative
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const initiative = await db.getInitiativeById(id);

  if (!initiative) {
    throw new NotFoundError('Initiative not found');
  }

  // Check access permissions
  const hasAccess = req.user!.role === 'admin' || 
                   initiative.createdBy === req.user!.id ||
                   initiative.assignedTo === req.user!.id;

  if (!hasAccess) {
    throw new NotFoundError('Initiative not found'); // Don't reveal existence
  }

  res.json({
    success: true,
    data: initiative,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// POST /initiatives - Handle initiative actions
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { action, data } = req.body;

  // If action/data wrapper is used (frontend sends {action: 'create', data: {...}})
  const initiativeData = data || req.body;

  // Validate required fields
  if (!initiativeData.title) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: [
        {
          type: 'field',
          msg: 'Title is required',
          path: 'title',
          location: 'body'
        }
      ]
    });
    return;
  }

  // Check permissions
  const allowedRoles = ['admin', 'program_manager', 'rd_manager', 'manager'];
  if (!allowedRoles.includes(req.user!.role)) {
    res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Only admins, program managers, R&D managers, and team managers can create initiatives'
    });
    return;
  }

  try {
    const initiative = await db.createInitiative({
      title: initiativeData.title,
      description: initiativeData.description || '',
      category: initiativeData.category || '',
      priority: initiativeData.priority || 'medium',
      status: 'pending',
      estimatedHours: initiativeData.estimatedHours || 10,
      workloadPercentage: initiativeData.workloadPercentage || 0,
      assignedTo: initiativeData.assignedTo || null,
      createdBy: req.user!.id,
      dueDate: initiativeData.dueDate || null
    });

    res.status(201).json({
      success: true,
      data: initiative,
      message: 'Initiative created successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating initiative:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create initiative',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// PUT /initiatives/:id - Update initiative
router.put('/:id', [
  body('title').optional().isLength({ min: 1 }),
  body('description').optional().isString(),
  body('category').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high', 'critical']),
  body('status').optional().isIn(['pending', 'active', 'completed', 'cancelled']),
  body('estimatedHours').optional().isInt({ min: 0 }),
  body('actualHours').optional().isInt({ min: 0 }),
  body('workloadPercentage').optional().isInt({ min: 0, max: 100 }),
  body('assignedTo').optional().isString(),
  body('dueDate').optional().isISO8601()
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: errors.array()
    });
    return;
  }

  const { id } = req.params;

  try {
    // Check if initiative exists and user has access
    const existingInitiative = await db.getInitiativeById(id);
    if (!existingInitiative) {
      throw new NotFoundError('Initiative not found');
    }

    // Check permissions
    const hasAccess = req.user!.role === 'admin' || 
                     existingInitiative.createdBy === req.user!.id ||
                     existingInitiative.assignedTo === req.user!.id;
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins, creators, or assignees can update initiatives'
      });
      return;
    }

    const updatedInitiative = await db.updateInitiative(id, req.body);

    res.json({
      success: true,
      data: updatedInitiative,
      message: 'Initiative updated successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating initiative:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update initiative',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// DELETE /initiatives/:id - Delete initiative
router.delete('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    // Check if initiative exists and user has access
    const existingInitiative = await db.getInitiativeById(id);
    if (!existingInitiative) {
      throw new NotFoundError('Initiative not found');
    }

    // Check permissions
    const hasAccess = req.user!.role === 'admin' || existingInitiative.createdBy === req.user!.id;
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins and creators can delete initiatives'
      });
      return;
    }

    await db.deleteInitiative(id);

    res.json({
      success: true,
      message: 'Initiative deleted successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deleting initiative:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete initiative',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

export default router;
