/**
 * BPL Commander Shared Types
 * 
 * This file contains all TypeScript interfaces and types shared between
 * the frontend and backend applications. These types ensure type safety
 * and consistency across the entire application stack.
 * 
 * Core Features:
 * - User management and authentication types
 * - Project and initiative management types
 * - Notification and activity logging types
 * - API request/response types
 * - Analytics and reporting types
 * - Export and file upload types
 * 
 * Usage:
 * - Import specific types in frontend components
 * - Use as type definitions in backend API routes
 * - Ensures consistent data structures across the application
 */

// ============================================================================
// CORE ENTITY TYPES
// ============================================================================

/**
 * User Entity Interface
 * 
 * Represents a user in the BPL Commander system with comprehensive
 * profile information, role-based access control, and notification settings.
 * 
 * @interface User
 */
export interface User {
  id: string;                                                    // Unique user identifier
  email: string;                                                 // User's email address (used for login)
  name: string;                                                  // User's full name
  employeeId?: string;                                           // Company employee ID
  password?: string;                                             // Password (optional for frontend, required for backend auth)
  role: 'admin' | 'program_manager' | 'rd_manager' | 'manager' | 'employee'; // User role determining access level
  designation: string;                                           // Job title/designation
  managerId?: string;                                            // ID of direct manager (for hierarchy)
  department?: string;                                           // Department/team name
  skills: string[];                                              // List of user's skills
  workloadCap: number;                                           // Maximum workload capacity (percentage)
  overBeyondCap: number;                                         // Over-capacity allowance (percentage)
  avatar?: string;                                               // Profile picture URL
  phoneNumber?: string;                                          // Contact phone number
  timezone?: string;                                             // User's timezone
  preferredCurrency?: string;                                    // Preferred currency for display
  notificationSettings: NotificationSettings;                    // User's notification preferences
  isActive: boolean;                                             // Whether user account is active
  createdAt: string;                                             // Account creation timestamp
  updatedAt: string;                                             // Last update timestamp
  lastLoginAt?: string;                                          // Last login timestamp
}

/**
 * Project Entity Interface
 * 
 * Represents a project in the BPL Commander system with comprehensive
 * project management features including assignments, milestones, and budget tracking.
 * 
 * @interface Project
 */
export interface Project {
  id: string;                                                    // Unique project identifier
  title: string;                                                 // Project title
  description?: string;                                          // Project description
  managerId: string;                                             // ID of project manager
  status: 'pending' | 'active' | 'completed' | 'on-hold' | 'cancelled'; // Current project status
  priority: 'low' | 'medium' | 'high' | 'critical';             // Project priority level
  category?: 'ECR' | 'ECN' | 'NPD' | 'SUST' | string;           // Project category
  estimatedHours?: number;                                      // Estimated hours to complete
  actualHours?: number;                                          // Actual hours spent
  budgetAmount?: number;                                         // Project budget amount
  budgetCurrency?: string;                                        // Budget currency
  timeline?: string;                                             // Project timeline/deadline
  tags: string[];                                                // Project tags for categorization
  version: number;                                               // Project version number
  createdAt: string;                                             // Project creation timestamp
  updatedAt: string;                                             // Last update timestamp
  lastActivity?: string;                                         // Last activity timestamp
  
  // Relations (populated when included)
  manager?: User;                                                // Project manager details
  assignments?: ProjectAssignment[];                             // Project team assignments
  milestones?: Milestone[];                                     // Project milestones
  comments?: Comment[];                                          // Project comments
}

/**
 * Project Assignment Interface
 * 
 * Represents the assignment of an employee to a project with
 * specific involvement percentage and role information.
 * 
 * @interface ProjectAssignment
 */
export interface ProjectAssignment {
  id: string;                                                    // Unique assignment identifier
  projectId: string;                                             // ID of the assigned project
  employeeId: string;                                             // ID of the assigned employee
  involvementPercentage: number;                                 // Percentage of employee's time allocated to this project
  role?: string;                                                  // Specific role in the project
  startDate?: string;                                             // Assignment start date
  endDate?: string;                                               // Assignment end date
  assignedAt: string;                                             // Assignment creation timestamp
  updatedAt: string;                                              // Last update timestamp
  
  // Relations (populated when included)
  project?: Project;                                              // Project details
  employee?: User;                                                // Employee details
}

/**
 * Milestone Interface
 * 
 * Represents a project milestone with completion tracking
 * and deadline management.
 * 
 * @interface Milestone
 */
export interface Milestone {
  id: string;                                                    // Unique milestone identifier
  projectId: string;                                             // ID of the parent project
  title: string;                                                 // Milestone title
  description?: string;                                          // Milestone description
  dueDate: string;                                               // Milestone deadline
  completed: boolean;                                            // Completion status
  completedAt?: string;                                          // Completion timestamp
  createdAt: string;                                             // Creation timestamp
  updatedAt: string;                                             // Last update timestamp
}

/**
 * Initiative Interface
 * 
 * Represents a business initiative or task that can be assigned
 * to employees for tracking and completion.
 * 
 * @interface Initiative
 */
export interface Initiative {
  id: string;                                                    // Unique initiative identifier
  title: string;                                                 // Initiative title
  description?: string;                                           // Initiative description
  category?: string;                                              // Initiative category
  priority: 'low' | 'medium' | 'high';                          // Initiative priority level
  status: 'pending' | 'active' | 'completed' | 'cancelled';     // Current status
  estimatedHours: number;                                        // Estimated hours to complete
  actualHours?: number;                                           // Actual hours spent
  workloadPercentage: number;                                    // Percentage of workload this represents
  assignedTo?: string;                                            // ID of assigned employee
  createdBy: string;                                              // ID of creator
  dueDate?: string;                                              // Initiative deadline
  completedAt?: string;                                           // Completion timestamp
  createdAt: string;                                              // Creation timestamp
  updatedAt: string;                                              // Last update timestamp
  
  // Relations (populated when included)
  assignee?: User;                                                // Assigned employee details
  creator?: User;                                                 // Creator details
  comments?: Comment[];                                           // Initiative comments
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  projectId?: string;
  initiativeId?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations
  user?: User;
  project?: Project;
  initiative?: Initiative;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'deadline' | 'workload' | 'assignment' | 'milestone' | 'budget' | 'comment' | 'status' | 'system';
  title: string;
  message: string;
  entityType?: 'user' | 'project' | 'initiative' | 'milestone' | 'comment';
  entityId?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  read: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  action: string;
  entityType: 'user' | 'project' | 'initiative' | 'milestone' | 'comment';
  entityId: string;
  projectId?: string;
  initiativeId?: string;
  details?: string;
  metadata?: Record<string, any>;
  timestamp: string;
  
  // Relations
  user?: User;
}

export interface NotificationSettings {
  email: boolean;
  inApp: boolean;
  projectUpdates: boolean;
  deadlineReminders: boolean;
  weeklyReports: boolean;
}

export interface WorkloadData {
  projectWorkload: number;
  overBeyondWorkload: number;
  totalWorkload: number;
  availableCapacity: number;
  overBeyondAvailable: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Standard API Response Interface
 * 
 * Provides a consistent response format for all API endpoints
 * with success/error handling and metadata.
 * 
 * @interface ApiResponse
 * @template T - Type of data being returned
 */
export interface ApiResponse<T = any> {
  success: boolean;                                              // Whether the request was successful
  data?: T;                                                      // Response data (if successful)
  error?: string;                                                // Error message (if failed)
  message?: string;                                              // Additional message
  meta?: {                                                       // Response metadata
    total?: number;                                              // Total number of records
    page?: number;                                               // Current page number
    limit?: number;                                              // Records per page
    timestamp: string;                                            // Response timestamp
  };
}

/**
 * Pagination Parameters Interface
 * 
 * Standard pagination parameters for API requests.
 * 
 * @interface PaginationParams
 */
export interface PaginationParams {
  page?: number;                                                 // Page number (1-based)
  limit?: number;                                                // Records per page
}

/**
 * Filter Parameters Interface
 * 
 * Common filtering parameters for API requests.
 * 
 * @interface FilterParams
 */
export interface FilterParams {
  status?: string;                                               // Filter by status
  priority?: string;                                             // Filter by priority
  role?: string;                                                  // Filter by user role
  department?: string;                                            // Filter by department
  search?: string;                                               // Text search query
}

/**
 * Query Parameters Interface
 * 
 * Comprehensive query parameters combining pagination, filtering,
 * and additional query options.
 * 
 * @interface QueryParams
 */
export interface QueryParams extends PaginationParams, FilterParams {
  id?: string;                                                   // Specific record ID
  include?: string;                                              // Comma-separated relations to include
  analytics?: boolean;                                           // Include analytics data
  workload?: boolean;                                            // Include workload data
  count?: boolean;                                               // Return count only
  manager?: string;                                              // Filter by manager ID
  assignee?: string;                                             // Filter by assignee ID
  creator?: string;                                              // Filter by creator ID
  unread?: boolean;                                              // Filter unread items
  type?: string;                                                 // Filter by type
}

// Authentication types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  user: User;
  token: string;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  role: User['role'];
  designation: string;
  managerId?: string;
  department?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  name: string;
  employeeId: string;
  role: User['role'];
  designation: string;
  managerId?: string;
  department?: string;
  skills?: string[];
  workloadCap?: number;
  overBeyondCap?: number;
  notificationSettings?: NotificationSettings;
}

export interface UpdateUserRequest {
  name?: string;
  designation?: string;
  managerId?: string;
  department?: string;
  skills?: string[];
  workloadCap?: number;
  overBeyondCap?: number;
  avatar?: string;
  phoneNumber?: string;
  timezone?: string;
  preferredCurrency?: string;
  notificationSettings?: NotificationSettings;
}

// Project management types
export interface CreateProjectRequest {
  title: string;
  description?: string;
  timeline?: string;
  timelineDate?: string;
  priority?: Project['priority'];
  category?: Project['category'];
  estimatedHours?: number;
  budgetAmount?: number;
  budgetCurrency?: string;
  tags?: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
  status?: Project['status'];
}

export interface AssignEmployeeRequest {
  projectId: string;
  employeeId: string;
  involvementPercentage: number;
  role?: string;
  startDate?: string;
  endDate?: string;
}

// Initiative types
export interface CreateInitiativeRequest {
  title: string;
  description?: string;
  category?: string;
  priority?: Initiative['priority'];
  estimatedHours?: number;
  workloadPercentage: number;
  assignedTo?: string;
  dueDate?: string;
}

export interface UpdateInitiativeRequest extends Partial<CreateInitiativeRequest> {
  id: string;
  status?: Initiative['status'];
}

// Analytics types
export interface DashboardMetrics {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  totalUsers: number;
  activeUsers: number;
  overloadedUsers: number;
  totalInitiatives: number;
  completedInitiatives: number;
  averageProjectProgress: number;
  totalWorkloadUtilization: number;
}

export interface ProjectAnalytics {
  projectsByStatus: Record<string, number>;
  projectsByPriority: Record<string, number>;
  projectsOverTime: Array<{ date: string; count: number }>;
  averageCompletionTime: number;
  budgetUtilization: number;
}

export interface WorkloadAnalytics {
  departmentWorkload: Record<string, number>;
  roleWorkload: Record<string, number>;
  overloadedEmployees: Array<{ userId: string; workload: number }>;
  capacityTrends: Array<{ date: string; capacity: number; utilization: number }>;
}

// Export types
export interface ExportRequest {
  type: 'projects' | 'users' | 'workload' | 'analytics';
  format: 'excel' | 'pdf' | 'csv' | 'json';
  filters?: FilterParams;
  dateRange?: {
    start: string;
    end: string;
  };
  includeRelations?: string[];
}

// File upload types
export interface FileUpload {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  path: string;
  userId?: string;
  entityType?: 'user' | 'project' | 'initiative';
  entityId?: string;
  createdAt: string;
}

// Settings types
export interface UserSettings {
  theme: 'light' | 'dark' | 'custom';
  language: string;
  timezone: string;
  currency: string;
  notificationSettings: NotificationSettings;
}

export interface SystemSettings {
  defaultCurrency: string;
  maxWorkloadPercentage: number;
  maxOverBeyondPercentage: number;
  defaultProjectStatus: Project['status'];
  allowSelfAssignment: boolean;
  requireApprovalForProjects: boolean;
}

// Action types for unified endpoints
export type ActionType = 
  | 'create' 
  | 'update' 
  | 'delete' 
  | 'assign' 
  | 'unassign' 
  | 'complete' 
  | 'activate' 
  | 'deactivate'
  | 'milestone'
  | 'comment'
  | 'markRead'
  | 'updateSettings';

export interface ActionRequest<T = any> {
  action: ActionType;
  id?: string;
  data?: T;
}

