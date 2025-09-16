import express, { Request, Response } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { authenticateToken } from '../middleware/auth';
import { fileBasedMockDb } from '../services/fileBasedMockDb';

const router = express.Router();

// GET /api/departments - Get all departments
router.get('/', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const departments = await fileBasedMockDb.getCustomDepartments();

  res.json({
    success: true,
    data: departments
  });
}));

// POST /api/departments - Create a new department
router.post('/', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { name, description, headId } = req.body;

  if (!name || !name.trim()) {
    res.status(400).json({
      success: false,
      error: 'Department name is required'
    });
    return;
  }

  const department = await fileBasedMockDb.createCustomDepartment({
    name: name.trim(),
    description: description?.trim() || '',
    headId: headId || null
  });

  res.status(201).json({
    success: true,
    data: department,
    message: 'Department created successfully'
  });
}));


export default router;
