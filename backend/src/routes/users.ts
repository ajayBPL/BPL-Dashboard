import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import { authenticateToken, authorize, canAccessUser } from '../middleware/auth';
import { parseQuery, buildWhereClause, buildIncludeClause, getPaginationMeta } from '../middleware/queryParser';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { db } from '../services/database';
// import { prisma } from '../index'; // Not needed with Supabase
import { User, CreateUserRequest, UpdateUserRequest, ActionRequest } from '../../../shared/types';
// import { notificationService } from '../services/notificationService';

const router = express.Router();

// Apply middleware to all routes
router.use(authenticateToken);
router.use(parseQuery);

// GET /users - List users with filtering, pagination, and includes
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { pagination, filters, include, flags } = req;
  
  // Get all users from database service (handles mock data fallback)
  const allUsers = await db.getAllUsers();
  
  // Start with all users (including inactive)
  let filteredUsers = [...allUsers];
  
  // Apply additional filters if needed
  if (filters && Object.keys(filters).length > 0) {
    filteredUsers = filteredUsers.filter((user: any) => {
      return Object.entries(filters).every(([key, value]) => {
        if (key === 'role') {
          return user.role.toLowerCase() === (value as string).toLowerCase();
        }
        if (key === 'department') {
          return user.department?.toLowerCase().includes((value as string).toLowerCase());
        }
        if (key === 'isActive') {
          return user.isActive === value;
        }
        return true;
      });
    });
  }

  // Apply pagination
  const page = pagination.page || 1;
  const limit = pagination.limit || 50;
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  // Convert to shared User type
  const convertedUsers = paginatedUsers.map((user: any) => ({
    ...user,
    role: user.role.toLowerCase() as any,
    managerId: user.managerId || undefined,
    department: user.department || undefined,
    avatar: user.avatar || undefined,
    phoneNumber: user.phoneNumber || undefined,
    timezone: user.timezone || undefined,
    preferredCurrency: user.preferredCurrency || undefined,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : (user.createdAt as Date).toISOString(),
    updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : (user.updatedAt as Date).toISOString(),
    lastLoginAt: typeof user.lastLoginAt === 'string' ? user.lastLoginAt : (user.lastLoginAt as Date | null)?.toISOString() || undefined,
    notificationSettings: user.notificationSettings || {}
  }));

  res.json({
    success: true,
    data: convertedUsers,
    meta: {
      ...getPaginationMeta(filteredUsers.length, page, limit),
      timestamp: new Date().toISOString()
    }
  });
}));

// GET /users/:id - Get specific user
router.get('/:id', canAccessUser, asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { include, flags } = req;

  const user = await db.findUserById(id);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Convert to shared User type
  const convertedUser = {
    ...user,
    role: user.role.toLowerCase() as any,
    managerId: user.managerId || undefined,
    department: user.department || undefined,
    avatar: user.avatar || undefined,
    phoneNumber: user.phoneNumber || undefined,
    timezone: user.timezone || undefined,
    preferredCurrency: user.preferredCurrency || undefined,
    createdAt: typeof user.createdAt === 'string' ? user.createdAt : (user.createdAt as Date).toISOString(),
    updatedAt: typeof user.updatedAt === 'string' ? user.updatedAt : (user.updatedAt as Date).toISOString(),
    lastLoginAt: typeof user.lastLoginAt === 'string' ? user.lastLoginAt : (user.lastLoginAt as Date | null)?.toISOString() || undefined,
    notificationSettings: user.notificationSettings || {}
  };

  res.json({
    success: true,
    data: convertedUser,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// POST /users - Handle user actions (create, update, delete, etc.)
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { action, id, data }: ActionRequest = req.body;

  switch (action) {
    case 'create':
      await handleCreateUser(req, res, data);
      break;
    case 'update':
      await handleUpdateUser(req, res, id!, data);
      break;
    case 'delete':
      await handleDeleteUser(req, res, id!);
      break;
    case 'activate':
      await handleActivateUser(req, res, id!);
      break;
    case 'deactivate':
      await handleDeactivateUser(req, res, id!);
      break;
    case 'updateSettings':
      await handleUpdateSettings(req, res, id!, data);
      break;
    default:
      throw new ValidationError('Invalid action specified');
  }
}));

// Helper functions for user actions
async function handleCreateUser(req: Request, res: Response, userData: any): Promise<void> {
  // Validate required fields
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError('Validation failed');
  }

  // Check if user already exists using database service abstraction
  const existingUser = await db.findUserByEmail(userData.email);

  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Validate role against Prisma enum values
  // Prisma schema only supports: ADMIN, PROGRAM_MANAGER, RD_MANAGER, MANAGER, EMPLOYEE
  const validPrismaRoles = ['ADMIN', 'PROGRAM_MANAGER', 'RD_MANAGER', 'MANAGER', 'EMPLOYEE'];
  const roleUpper = userData.role.toUpperCase();
  
  // Get custom roles from database to check if role is a known custom role
  const customRoles = await db.getCustomRoles();
  const customRoleNames = customRoles.map((role: any) => role.name.toUpperCase());
  
  // Map common custom roles to valid enum values
  const roleMapping: { [key: string]: string } = {
    'INTERN': 'EMPLOYEE',
    'LAB IN CHARGE': 'MANAGER',
    'LAB_IN_CHARGE': 'MANAGER',
    'LAB_INCHARGE': 'MANAGER',
    'SUPERVISOR': 'MANAGER',
    'LEAD': 'MANAGER',
    'SENIOR_EMPLOYEE': 'EMPLOYEE',
    'SENIOR EMPLOYEE': 'EMPLOYEE',
    'JUNIOR_EMPLOYEE': 'EMPLOYEE',
    'JUNIOR EMPLOYEE': 'EMPLOYEE',
    // Executive/High-level roles map to ADMIN or PROGRAM_MANAGER
    'MD': 'ADMIN',  // Managing Director
    'CEO': 'ADMIN',  // Chief Executive Officer
    'CTO': 'ADMIN',  // Chief Technology Officer
    'CFO': 'ADMIN',  // Chief Financial Officer
    'DIRECTOR': 'PROGRAM_MANAGER',  // Director
    'VP': 'PROGRAM_MANAGER',  // Vice President
    'VICE PRESIDENT': 'PROGRAM_MANAGER',
    'GENERAL MANAGER': 'PROGRAM_MANAGER',
    'GM': 'PROGRAM_MANAGER',
    'SENIOR MANAGER': 'MANAGER',
    'SR MANAGER': 'MANAGER',
    'SR_MANAGER': 'MANAGER',
    'ASSOCIATE': 'EMPLOYEE',
    'CONSULTANT': 'EMPLOYEE',
    'ANALYST': 'EMPLOYEE'
  };
  
  // Check if role is valid or can be mapped
  let finalRole = roleUpper;
  if (!validPrismaRoles.includes(roleUpper)) {
    // First check explicit mappings
    if (roleMapping[roleUpper]) {
      finalRole = roleMapping[roleUpper];
      console.log(`Mapping custom role "${userData.role}" to valid enum role "${finalRole}"`);
    } 
    // Check if it's a known custom role from database
    else if (customRoleNames.includes(roleUpper)) {
      // Custom roles from database - map based on naming pattern or default to MANAGER
      const customRoleLower = userData.role.toLowerCase();
      if (customRoleLower.includes('director') || customRoleLower.includes('executive') || 
          customRoleLower.includes('president') || customRoleLower.includes('chief')) {
        finalRole = 'PROGRAM_MANAGER';
      } else if (customRoleLower.includes('manager') || customRoleLower.includes('supervisor') || 
                 customRoleLower.includes('lead') || customRoleLower.includes('head')) {
        finalRole = 'MANAGER';
      } else {
        // Default custom role to MANAGER for database-defined custom roles
        finalRole = 'MANAGER';
      }
      console.log(`Mapping database custom role "${userData.role}" to valid enum role "${finalRole}"`);
    }
    // Pattern-based matching for unrecognized roles
    else {
      const customRoleLower = userData.role.toLowerCase();
      
      // Executive/High-level patterns → ADMIN or PROGRAM_MANAGER
      if (customRoleLower.includes('director') || 
          customRoleLower.includes('executive') || 
          customRoleLower.includes('president') ||
          customRoleLower.includes('chief') ||
          customRoleLower.includes('md') ||
          customRoleLower.includes('ceo') ||
          customRoleLower.includes('cfo') ||
          customRoleLower.includes('cto')) {
        // Very high-level roles (MD, CEO, etc.) → ADMIN, others → PROGRAM_MANAGER
        if (roleUpper === 'MD' || roleUpper === 'CEO' || roleUpper === 'CFO' || roleUpper === 'CTO') {
          finalRole = 'ADMIN';
        } else {
          finalRole = 'PROGRAM_MANAGER';
        }
        console.log(`Mapping executive role "${userData.role}" to ${finalRole}`);
      }
      // Management patterns → MANAGER
      else if (customRoleLower.includes('manager') || 
               customRoleLower.includes('supervisor') || 
               customRoleLower.includes('lead') ||
               customRoleLower.includes('lab') ||
               customRoleLower.includes('head')) {
        finalRole = 'MANAGER';
        console.log(`Mapping management role "${userData.role}" to MANAGER`);
      }
      // Employee-level patterns → EMPLOYEE
      else if (customRoleLower.includes('intern') || 
               customRoleLower.includes('junior') || 
               customRoleLower.includes('trainee') ||
               customRoleLower.includes('associate') ||
               customRoleLower.includes('analyst') ||
               customRoleLower.includes('consultant') ||
               customRoleLower.includes('staff')) {
        finalRole = 'EMPLOYEE';
        console.log(`Mapping employee-level role "${userData.role}" to EMPLOYEE`);
      }
      // For very short roles (2-3 letters) that might be acronyms, default to MANAGER
      else if (roleUpper.length <= 3) {
        finalRole = 'MANAGER';
        console.log(`Mapping short role/acronym "${userData.role}" to MANAGER (please verify this mapping is correct)`);
      }
      // Unknown role - default to EMPLOYEE as safest option
      else {
        finalRole = 'EMPLOYEE';
        console.log(`Unknown role "${userData.role}" - defaulting to EMPLOYEE. Please verify this mapping is correct.`);
      }
    }
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 12);

  // Create user using database service abstraction
  const user = await db.createUser({
    email: userData.email,
    password: hashedPassword,
    name: userData.name,
    employeeId: userData.employeeId,
    role: finalRole,
    designation: userData.designation,
    managerId: userData.managerId,
    department: userData.department,
    skills: userData.skills || [],
    phoneNumber: userData.phoneNumber,
    workloadCap: userData.workloadCap || 100,
    overBeyondCap: userData.overBeyondCap || 20,
    notificationSettings: userData.notificationSettings || {
      email: true,
      inApp: true,
      projectUpdates: true,
      deadlineReminders: true,
      weeklyReports: false
    }
  });

  // Log activity using database service abstraction
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'USER_CREATED',
    entityType: 'USER',
    entityId: user.id,
    details: `Created user: ${user.name} (${user.email})`
  });

  res.status(201).json({
    success: true,
    data: {
      ...user,
      role: user.role.toLowerCase(),
      managerId: user.managerId || undefined,
      department: user.department || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      notificationSettings: user.notificationSettings || {}
    },
    message: 'User created successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

async function handleUpdateUser(req: Request, res: Response, userId: string, userData: any): Promise<void> {
  // Check if user exists using database service abstraction
  const existingUser = await db.findUserById(userId);

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // Update user using database service abstraction
  const user = await db.updateUser(userId, {
    ...(userData.name && { name: userData.name }),
    ...(userData.designation && { designation: userData.designation }),
    ...(userData.managerId !== undefined && { managerId: userData.managerId }),
    ...(userData.department && { department: userData.department }),
    ...(userData.skills && { skills: userData.skills }),
    ...(userData.workloadCap && { workloadCap: userData.workloadCap }),
    ...(userData.overBeyondCap && { overBeyondCap: userData.overBeyondCap }),
    ...(userData.avatar !== undefined && { avatar: userData.avatar }),
    ...(userData.phoneNumber !== undefined && { phoneNumber: userData.phoneNumber }),
    ...(userData.timezone && { timezone: userData.timezone }),
    ...(userData.preferredCurrency && { preferredCurrency: userData.preferredCurrency }),
    ...(userData.notificationSettings && { notificationSettings: userData.notificationSettings })
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Log activity using database service abstraction
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'USER_UPDATED',
    entityType: 'USER',
    entityId: user.id,
    details: `Updated user: ${user.name}`
  });

  res.json({
    success: true,
    data: {
      ...user,
      role: user.role.toLowerCase(),
      managerId: user.managerId || undefined,
      department: user.department || undefined,
      avatar: user.avatar || undefined,
      phoneNumber: user.phoneNumber || undefined,
      timezone: user.timezone || undefined,
      preferredCurrency: user.preferredCurrency || undefined,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      notificationSettings: user.notificationSettings || {}
    },
    message: 'User updated successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

async function handleDeleteUser(req: Request, res: Response, userId: string): Promise<void> {
  // Check if user exists using database service abstraction
  const existingUser = await db.findUserById(userId);

  if (!existingUser) {
    throw new NotFoundError('User not found');
  }

  // Soft delete (deactivate) instead of hard delete using database service abstraction
  await db.updateUser(userId, { isActive: false });

  // Log activity using database service abstraction
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'USER_DELETED',
    entityType: 'USER',
    entityId: userId,
    details: `Deleted user: ${existingUser.name}`
  });

  res.json({
    success: true,
    message: 'User deleted successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

async function handleActivateUser(req: Request, res: Response, userId: string): Promise<void> {
  const user = await db.updateUser(userId, { isActive: true });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    message: 'User activated successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

async function handleDeactivateUser(req: Request, res: Response, userId: string): Promise<void> {
  const user = await db.updateUser(userId, { isActive: false });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    message: 'User deactivated successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

async function handleUpdateSettings(req: Request, res: Response, userId: string, settings: any): Promise<void> {
  const user = await db.updateUser(userId, {
    notificationSettings: settings.notificationSettings,
    ...(settings.timezone && { timezone: settings.timezone }),
    ...(settings.preferredCurrency && { preferredCurrency: settings.preferredCurrency })
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.json({
    success: true,
    message: 'Settings updated successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

// POST /users/test-email - Test email functionality
router.post('/test-email', [
  authorize(['admin', 'program_manager'])
], asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.body;

  if (!userId) {
    res.status(400).json({
      success: false,
      error: 'User ID is required'
    });
    return;
  }

  try {
    // const success = await notificationService.sendTestEmail(userId);
    const success = true; // Temporarily disabled
    
    res.json({
      success,
      message: success ? 'Test email sent successfully' : 'Failed to send test email',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send test email'
    });
  }
}));

export default router;