import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { fileBasedMockDb } from '../services/fileBasedMockDb';

const router = express.Router();

// GET /api/roles - Get all custom roles
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const roles = await fileBasedMockDb.getCustomRoles();

  res.json({
    success: true,
    data: roles
  });
}));

// POST /api/roles - Create a new custom role
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, description, permissions } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({
      success: false,
      error: 'Role name is required'
    });
    return;
  }

  const role = await fileBasedMockDb.createCustomRole({
    name: name.trim(),
    description: description?.trim() || '',
    permissions: permissions || []
  });

  res.status(201).json({
    success: true,
    data: role,
    message: 'Role created successfully'
  });
}));


export default router;
