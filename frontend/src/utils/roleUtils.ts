/**
 * Role Utility Functions
 * 
 * Centralized role checking and management utilities to ensure
 * consistent role handling across all components.
 */

export type UserRole = 'admin' | 'program_manager' | 'rd_manager' | 'manager' | 'employee';

export interface User {
  id: string;
  role: string;
  name: string;
  email: string;
}

/**
 * Normalize role string to standard format
 */
export function normalizeRole(role: string): UserRole {
  const normalized = role.toLowerCase().trim();
  
  switch (normalized) {
    case 'admin':
      return 'admin';
    case 'program_manager':
    case 'programmanager':
    case 'program manager':
      return 'program_manager';
    case 'rd_manager':
    case 'rdmanager':
    case 'rd manager':
    case 'r&d_manager':
    case 'r&d manager':
      return 'rd_manager';
    case 'manager':
    case 'team_manager':
    case 'team manager':
      return 'manager';
    case 'employee':
    case 'staff':
    case 'member':
      return 'employee';
    default:
      return 'employee'; // Default fallback
  }
}

/**
 * Check if user has admin privileges
 */
export function isAdmin(user: User | null): boolean {
  if (!user) return false;
  return normalizeRole(user.role) === 'admin';
}

/**
 * Check if user has manager privileges (any type of manager)
 */
export function isManager(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager', 'rd_manager', 'manager'].includes(role);
}

/**
 * Check if user has program manager privileges
 */
export function isProgramManager(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager'].includes(role);
}

/**
 * Check if user has R&D manager privileges
 */
export function isRdManager(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager', 'rd_manager'].includes(role);
}

/**
 * Check if user can create projects
 */
export function canCreateProjects(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager', 'rd_manager', 'manager'].includes(role);
}

/**
 * Check if user can create initiatives
 */
export function canCreateInitiatives(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager', 'rd_manager', 'manager'].includes(role);
}

/**
 * Check if user can manage users
 */
export function canManageUsers(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager', 'rd_manager'].includes(role);
}

/**
 * Check if user can view employee overview
 */
export function canViewEmployeeOverview(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager', 'rd_manager', 'manager'].includes(role);
}

/**
 * Check if user can access analytics
 */
export function canAccessAnalytics(user: User | null): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  return ['admin', 'program_manager', 'rd_manager'].includes(role);
}

/**
 * Get role display name
 */
export function getRoleDisplayName(role: string): string {
  const normalized = normalizeRole(role);
  
  switch (normalized) {
    case 'admin':
      return 'Admin';
    case 'program_manager':
      return 'Program Manager';
    case 'rd_manager':
      return 'R&D Manager';
    case 'manager':
      return 'Manager';
    case 'employee':
      return 'Employee';
    default:
      return role.charAt(0).toUpperCase() + role.slice(1);
  }
}

/**
 * Get role color classes for badges
 */
export function getRoleColorClasses(role: string): string {
  const normalized = normalizeRole(role);
  
  switch (normalized) {
    case 'admin':
      return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    case 'program_manager':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'rd_manager':
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    case 'manager':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'employee':
      return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

/**
 * Check if user can access specific feature
 */
export function hasPermission(user: User | null, permission: string): boolean {
  if (!user) return false;
  const role = normalizeRole(user.role);
  
  const permissions: Record<UserRole, string[]> = {
    admin: ['*'], // Admin has all permissions
    program_manager: [
      'user_management',
      'project_management',
      'department_management',
      'analytics_access',
      'export_data',
      'notification_management'
    ],
    rd_manager: [
      'project_management',
      'analytics_access',
      'notification_management'
    ],
    manager: [
      'project_management',
      'notification_management'
    ],
    employee: [
      'notification_management'
    ]
  };
  
  const userPermissions = permissions[role] || [];
  return userPermissions.includes('*') || userPermissions.includes(permission);
}
