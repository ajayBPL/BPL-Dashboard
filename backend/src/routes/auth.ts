/**
 * Authentication Routes
 * 
 * This module handles all authentication-related endpoints including:
 * - User registration with validation
 * - User login with JWT token generation
 * - Password hashing and verification
 * - Role-based access validation
 * 
 * Security Features:
 * - Password hashing with bcrypt (12 salt rounds)
 * - JWT token generation with expiration
 * - Input validation and sanitization
 * - Duplicate email/employee ID prevention
 * - Manager validation for hierarchical structures
 */

import express, { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import { db } from '../services/database';
import { asyncHandler, ValidationError } from '../middleware/errorHandler';
import { authenticateToken, authorize } from '../middleware/auth';

const router = express.Router();

/**
 * POST /register - User Registration Endpoint
 * 
 * Creates a new user account with comprehensive validation:
 * - Email format validation and normalization
 * - Password strength requirements (minimum 6 characters)
 * - Name validation (minimum 2 characters)
 * - Employee ID uniqueness check
 * - Role validation against built-in and custom roles
 * - Designation requirement
 * - Manager validation if provided
 * 
 * @route POST /api/auth/register
 * @access Public
 * @returns {Object} Success response with user data and JWT token
 */
router.post('/register', [
  // Email validation: must be valid email format and will be normalized
  body('email').isEmail().normalizeEmail(),
  
  // Password validation: minimum 6 characters required
  body('password').isLength({ min: 6 }),
  
  // Name validation: minimum 2 characters required
  body('name').isLength({ min: 2 }),
  
  // Employee ID validation: required field
  body('employeeId').isLength({ min: 1 }).withMessage('Employee ID is required'),
  
  // Role validation: checks against built-in and custom roles
  body('role').custom(async (value) => {
    const builtInRoles = ['admin', 'program_manager', 'rd_manager', 'manager', 'employee', 'intern', 'lab in charge'];
    const customRoles = await db.getCustomRoles();
    const customRoleNames = customRoles.map((role: any) => role.name.toLowerCase());
    const allValidRoles = [...builtInRoles, ...customRoleNames];
    
    if (!allValidRoles.includes(value.toLowerCase())) {
      throw new Error('Invalid role. Must be one of: ' + allValidRoles.join(', '));
    }
    return true;
  }),
  
  // Designation validation: minimum 2 characters required
  body('designation').isLength({ min: 2 })
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate all input fields according to the validation rules above
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: errors.array()
    });
    return;
  }

  // Extract user data from request body
  const { email, password, name, employeeId, role, designation, managerId, department } = req.body;

  // Check for duplicate email addresses
  const existingUser = await db.findUserByEmail(email);
  if (existingUser) {
    res.status(409).json({
      success: false,
      error: 'User with this email already exists'
    });
    return;
  }

  // Check for duplicate employee IDs
  const existingEmployeeId = await db.findUserByEmployeeId(employeeId);
  if (existingEmployeeId) {
    res.status(409).json({
      success: false,
      error: 'Employee ID already exists. Please use a different Employee ID.'
    });
    return;
  }

  // Validate manager exists if managerId is provided
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

  // Hash password using bcrypt with 12 salt rounds for security
  const saltRounds = 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Create new user with default settings
  const user = await db.createUser({
    email,
    password: hashedPassword,
    name,
    employeeId,
    role: role.toUpperCase(), // Store role in uppercase for consistency
    designation,
    managerId,
    department,
    skills: [], // Initialize empty skills array
    workloadCap: 100, // Default workload capacity
    overBeyondCap: 20, // Default over-capacity allowance
    notificationSettings: {
      email: true,
      inApp: true,
      projectUpdates: true,
      deadlineReminders: true,
      weeklyReports: false
    }
  });

  // Generate JWT token for immediate authentication
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
    { expiresIn: '24h' } // Token expires in 24 hours
  );

  // Log user registration activity for audit trail
  await db.createActivityLog({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'USER',
    entityId: user.id,
    details: `User registered: ${user.name} (${user.email})`
  });

  // Create welcome notification for new user
  await db.createNotification({
    userId: user.id,
    type: 'SYSTEM',
    title: 'Welcome to BPL Commander!',
    message: 'Your account has been created successfully. Complete your profile to get started.',
    priority: 'MEDIUM',
    actionUrl: '/profile'
  });

  // Return success response with user data and JWT token
  res.status(201).json({
    success: true,
    data: {
      user: {
        ...user,
        role: user.role.toLowerCase(), // Return role in lowercase for frontend consistency
        managerId: user.managerId || undefined,
        department: user.department || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        notificationSettings: user.notificationSettings || {}
      },
      token,
      expiresIn: 24 * 60 * 60 // Token expiration in seconds
    },
    message: 'User registered successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * POST /login - User Login Endpoint
 * 
 * Authenticates users and returns JWT token for session management:
 * - Email format validation and normalization
 * - Password verification (supports both bcrypt hashed and plain text)
 * - Account status validation (active users only)
 * - JWT token generation with user information
 * - Login activity logging for audit trail
 * 
 * @route POST /api/auth/login
 * @access Public
 * @returns {Object} Success response with user data and JWT token
 */
router.post('/login', [
  // Email validation: must be valid email format and will be normalized
  body('email').isEmail().normalizeEmail(),
  
  // Password validation: minimum 6 characters required
  body('password').isLength({ min: 6 })
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Validate input fields according to validation rules
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      success: false,
      error: 'Invalid input',
      details: errors.array()
    });
    return;
  }

  // Extract credentials from request body
  const { email, password } = req.body;

  // Find user by email address
  const user = await db.findUserByEmail(email);

  // Check if user exists and is active
  if (!user || !user.isActive) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials or inactive account'
    });
    return;
  }

  // Verify password with support for both bcrypt hashed and plain text passwords
  let isPasswordValid = false;
  const storedPassword = (user as any).password;
  
  // Check if stored password is bcrypt hashed (starts with $2b$)
  if (storedPassword.startsWith('$2b$')) {
    // Password is bcrypt hashed, use bcrypt comparison for security
    isPasswordValid = await bcrypt.compare(password, storedPassword);
  } else {
    // Password is stored as plain text (legacy support), compare directly
    isPasswordValid = password === storedPassword;
  }
  
  // Return error if password doesn't match
  if (!isPasswordValid) {
    res.status(401).json({
      success: false,
      error: 'Invalid credentials'
    });
    return;
  }

  // Generate JWT token for authenticated session
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
    { expiresIn: '24h' } // Token expires in 24 hours
  );

  // Update user's last login timestamp for tracking
  await db.updateUser(user.id, { lastLoginAt: new Date() });

  // Remove password from response for security
  const { password: _, ...userWithoutPassword } = user as any;

  // Return success response with user data and JWT token
  res.json({
    success: true,
    data: {
      user: {
        ...userWithoutPassword,
        role: user.role.toLowerCase(), // Return role in lowercase for frontend consistency
        managerId: user.managerId || undefined,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
        lastLoginAt: new Date().toISOString(),
        notificationSettings: user.notificationSettings || {}
      },
      token,
      expiresIn: 24 * 60 * 60 // Token expiration in seconds (24 hours)
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * POST /logout - User Logout Endpoint
 * 
 * Handles user logout by invalidating the session:
 * - Requires valid JWT token for authentication
 * - Returns success message (token invalidation handled client-side)
 * - Can be extended to implement server-side token blacklisting
 * 
 * @route POST /api/auth/logout
 * @access Private (requires valid JWT token)
 * @returns {Object} Success response confirming logout
 */
router.post('/logout', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Return success response (token invalidation is handled client-side)
  res.json({
    success: true,
    message: 'Logged out successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * GET /me - Get Current User Profile
 * 
 * Returns the current authenticated user's profile information:
 * - Requires valid JWT token for authentication
 * - Returns user data from the JWT token payload
 * - Used for profile display and user context
 * 
 * @route GET /api/auth/me
 * @access Private (requires valid JWT token)
 * @returns {Object} Current user profile data
 */
router.get('/me', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Check if user data exists in request (set by authenticateToken middleware)
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Return current user profile data
  res.json({
    success: true,
    data: req.user,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * POST /refresh - Refresh JWT Token
 * 
 * Generates a new JWT token for the current authenticated user:
 * - Requires valid JWT token for authentication
 * - Extends session without requiring re-login
 * - Returns new token with updated expiration time
 * 
 * @route POST /api/auth/refresh
 * @access Private (requires valid JWT token)
 * @returns {Object} New JWT token with expiration info
 */
router.post('/refresh', authenticateToken, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  // Check if user data exists in request
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: 'User not found'
    });
    return;
  }

  // Get JWT secret from environment
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    throw new Error('JWT_SECRET not configured');
  }

  // Generate new JWT token with same user information
  const token = jwt.sign(
    {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role
    },
    jwtSecret,
    { expiresIn: '24h' } // New token expires in 24 hours
  );

  // Return new token with expiration information
  res.json({
    success: true,
    data: {
      token,
      expiresIn: 24 * 60 * 60 // Token expiration in seconds
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

/**
 * POST /change-password - Change User Password
 * 
 * Allows authenticated users to change their password:
 * - Requires valid JWT token for authentication
 * - Validates current password before allowing change
 * - Hashes new password with bcrypt for security
 * 
 * @route POST /api/auth/change-password
 * @access Private (requires valid JWT token)
 * @returns {Object} Success response confirming password change
 */
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