import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../services/database';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { authenticateToken, authorize } from '../middleware/auth';

const router = express.Router();

// Register endpoint
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('name').isLength({ min: 2 }),
  body('employeeId').isLength({ min: 1 }).withMessage('Employee ID is required'),
  body('role').custom(async (value) => {
    const builtInRoles = ['admin', 'program_manager', 'rd_manager', 'manager', 'employee'];
    const customRoles = await db.getCustomRoles();
    const customRoleNames = customRoles.map((role: any) => role.name.toLowerCase());
    const allValidRoles = [...builtInRoles, ...customRoleNames];
    
    if (!allValidRoles.includes(value.toLowerCase())) {
      throw new Error('Invalid role. Must be one of: ' + allValidRoles.join(', '));
    }
    return true;
  }),
  body('designation').isLength({ min: 2 })
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: errors.array()
    });
    return;
  }

  const { email, password, name, employeeId, role, designation, managerId, department } = req.body;

  // Check if user already exists by email
  const existingUser = await db.findUserByEmail(email);

  if (existingUser) {
    res.status(409).json({
      success: false,
      error: 'User with this email already exists'
    });
    return;
  }

  // Check if employee ID already exists
  const existingEmployeeId = await db.findUserByEmployeeId(employeeId);

  if (existingEmployeeId) {
    res.status(409).json({
      success: false,
      error: 'Employee ID already exists. Please use a different Employee ID.'
    });
    return;
  }

  // Validate manager exists if managerId provided
  if (managerId) {
    const manager = await db.findUserById(managerId);

    if (!manager) {
      res.status(400).json({
        success: false,
        error: 'Invalid manager ID'
      });
      return;
    }
  }

  // Hash password
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await db.createUser({
    email,
    password: hashedPassword,
    name,
    employeeId,
    role: role.toUpperCase(),
    designation,
    managerId,
    department,
    skills: [],
    workloadCap: 100,
    overBeyondCap: 20,
    notificationSettings: {
      email: true,
      inApp: true,
      projectUpdates: true,
      deadlineReminders: true,
      weeklyReports: false
    }
  });

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: '24h' }
  );

  // Log activity
  await db.createActivityLog({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'USER',
    entityId: user.id,
    details: `User registered: ${user.name} (${user.email})`
  });

  // Create welcome notification
  await db.createNotification({
    userId: user.id,
    type: 'SYSTEM',
    title: 'Welcome to BPL Commander!',
    message: 'Your account has been created successfully. Complete your profile to get started.',
    priority: 'MEDIUM',
    actionUrl: '/profile'
  });

  res.status(201).json({
    success: true,
    data: {
      user: {
        ...user,
        role: user.role.toLowerCase(),
        managerId: user.managerId || undefined,
        department: user.department || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        notificationSettings: user.notificationSettings || {}
      },
      token,
      expiresIn: 24 * 60 * 60
    },
    message: 'User registered successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// Login endpoint
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: errors.array()
    });
    return;
  }

  const { email, password } = req.body;

  // Find user by email
  const user = await db.findUserByEmail(email);

  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials or inactive account'
    });
    return;
  }

  // Verify password
  // Handle both plain text and bcrypt hashed passwords
  let isPasswordValid = false;
  const storedPassword = (user as any).password;
  
  // Check if the stored password is bcrypt hashed (starts with $2b$)
  if (storedPassword.startsWith('$2b$')) {
    // Password is bcrypt hashed, use bcrypt comparison
    isPasswordValid = await bcrypt.compare(password, storedPassword);
  } else {
    // Password is plain text, compare directly
    isPasswordValid = password === storedPassword;
  }
  
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
    return;
  }

  // Generate JWT token
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role
    },
    jwtSecret,
    { expiresIn: '24h' }
  );

  // Update last login time
  await db.updateUser(user.id, { lastLoginAt: new Date() });

  // Remove password from response
  const { password: _, ...userWithoutPassword } = user as any;

  res.json({
    success: true,
    data: {
      user: {
        ...userWithoutPassword,
        role: user.role.toLowerCase(),
        managerId: user.managerId || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: new Date().toISOString(),
        notificationSettings: user.notificationSettings || {}
      },
      token,
      expiresIn: 24 * 60 * 60 // 24 hours in seconds
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// Logout endpoint
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  res.json({
    success: true,
    message: 'Logged out successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// Get current user profile
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  res.json({
    success: true,
    data: req.user,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// Refresh token endpoint
router.post('/refresh', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  // Generate new token
  const token = jwt.sign(
    {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    jwtSecret,
    { expiresIn: '24h' }
  );

  res.json({
    success: true,
    data: {
      token,
      expiresIn: 24 * 60 * 60
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// Change password endpoint
router.post('/change-password', [
  authenticateToken,
  body('currentPassword').isLength({ min: 6 }),
  body('newPassword').isLength({ min: 6 })
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: errors.array()
    });
    return;
  }

  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await db.findUserById(req.user.id);

  if (!user) {
    res.status(404).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Verify current password
  const storedPassword = (user as any).password;
  let isCurrentPasswordValid = false;
  
  // Check if the stored password is bcrypt hashed (starts with $2b$)
  if (storedPassword.startsWith('$2b$')) {
    // Password is bcrypt hashed, use bcrypt comparison
    isCurrentPasswordValid = await bcrypt.compare(currentPassword, storedPassword);
  } else {
    // Password is plain text, compare directly
    isCurrentPasswordValid = currentPassword === storedPassword;
  }
  
  if (!isCurrentPasswordValid) {
    res.status(400).json({
      success: false,
      error: 'Current password is incorrect'
    });
    return;
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await db.updateUser(req.user.id, { password: hashedNewPassword });

  res.json({
    success: true,
    message: 'Password changed successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

export default router;