import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken, canManageProjects } from '../middleware/auth';
import { parseQuery, buildWhereClause, buildIncludeClause, getPaginationMeta } from '../middleware/queryParser';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { prisma } from '../index';
import { db } from '../services/database';
import { Project, CreateProjectRequest, UpdateProjectRequest, ActionRequest, AssignEmployeeRequest } from '../../../shared/types';
import { notificationService } from '../services/notificationService';

const router = express.Router();

router.use(authenticateToken);
router.use(parseQuery);

// GET /projects - List projects with filtering, pagination, and includes
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    // Use the database service to get all projects
    const projects = await db.getAllProjects();
    
    // Apply role-based filtering
    let filteredProjects = projects;
    if (req.user!.role === 'manager') {
      // Managers can only see their own projects and projects they're assigned to
      filteredProjects = projects.filter(project => 
        project.managerId === req.user!.id || 
        (project.assignments && project.assignments.some((assignment: any) => assignment.employeeId === req.user!.id))
      );
    } else if (req.user!.role === 'employee') {
      // Employees can only see projects they're assigned to
      filteredProjects = projects.filter(project => 
        project.assignments && project.assignments.some((assignment: any) => assignment.employeeId === req.user!.id)
      );
    }

    const total = filteredProjects.length;

    // Convert to shared Project type format
    const convertedProjects = filteredProjects.map(project => ({
      ...project,
      status: project.status?.toLowerCase() || 'pending',
      priority: project.priority?.toLowerCase() || 'medium',
      budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
      timeline: project.timeline || undefined,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
      lastActivity: project.updatedAt,
      assignments: project.assignments || [],
      milestones: project.milestones || [],
      comments: project.comments || []
    }));

    res.json({
      success: true,
      data: convertedProjects,
      meta: {
        total: convertedProjects.length,
        page: 1,
        limit: convertedProjects.length,
        totalPages: 1,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error occurred:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch projects',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GET /projects/:id - Get specific project
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { include, flags } = req;

  const project = await db.getProjectById(id);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Check access permissions
  const hasAccess = req.user!.role === 'admin' || 
                   req.user!.role === 'program_manager' ||
                   req.user!.role === 'rd_manager' ||
                   project.managerId === req.user!.id ||
                   (project.assignments && project.assignments.some((a: any) => a.employeeId === req.user!.id));

  if (!hasAccess) {
    throw new NotFoundError('Project not found'); // Don't reveal existence
  }

  // Convert to shared Project type format
  const convertedProject = {
    ...project,
    status: project.status?.toLowerCase() || 'pending',
    priority: project.priority?.toLowerCase() || 'medium',
    budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
    timeline: project.timeline || undefined,
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
    lastActivity: project.updatedAt,
    assignments: project.assignments || [],
    milestones: project.milestones || [],
    comments: project.comments || [],
    versions: project.versions || []
  };

  res.json({
    success: true,
    data: convertedProject,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// POST /projects - Handle project actions
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { action, id, data }: ActionRequest = req.body;

  switch (action) {
    case 'create':
      await handleCreateProject(req, res, data);
      break;
    case 'update':
      await handleUpdateProject(req, res, id!, data);
      break;
    case 'delete':
      await handleDeleteProject(req, res, id!);
      break;
    case 'assign':
      await handleAssignEmployee(req, res, id!, data);
      break;
    case 'unassign':
      await handleUnassignEmployee(req, res, id!, data);
      break;
    case 'milestone':
      await handleMilestoneAction(req, res, id!, data);
      break;
    case 'comment':
      await handleAddComment(req, res, id!, data);
      break;
    case 'complete':
      await handleCompleteProject(req, res, id!);
      break;
    case 'activate':
      await handleActivateProject(req, res, id!);
      break;
    default:
      throw new ValidationError('Invalid action specified');
  }
}));

// Helper functions for project actions
async function handleCreateProject(req: Request, res: Response, projectData: CreateProjectRequest): Promise<void> {
  // Validate user can create projects
  if (!['admin', 'program_manager', 'rd_manager', 'manager'].includes(req.user!.role)) {
    throw new ValidationError('Insufficient permissions to create projects');
  }

  const project = await db.createProject({
    title: projectData.title,
    description: projectData.description,
    managerId: req.user!.id, // Creator becomes manager
    priority: (projectData.priority?.toUpperCase() as any) || 'MEDIUM',
    estimatedHours: projectData.estimatedHours,
    budgetAmount: projectData.budgetAmount,
    budgetCurrency: projectData.budgetCurrency || 'USD',
    timeline: projectData.timeline,
    timelineDate: projectData.timelineDate,
    tags: projectData.tags || [],
    status: 'PENDING'
  });

  // Log activity
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'PROJECT_CREATED',
    entityType: 'PROJECT',
    entityId: project.id,
    projectId: project.id,
    details: `Created project: ${project.title}`
  });

  res.status(201).json({
    success: true,
    data: {
      ...project,
      status: project.status?.toLowerCase() || 'pending',
      priority: project.priority?.toLowerCase() || 'medium',
      budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
      timeline: project.timeline || undefined,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    },
    message: 'Project created successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

async function handleUpdateProject(req: Request, res: Response, projectId: string, projectData: UpdateProjectRequest): Promise<void> {
  const existingProject = await db.getProjectById(projectId);

  if (!existingProject) {
    throw new NotFoundError('Project not found');
  }

  // Check permissions
  const canUpdate = req.user!.role === 'admin' || 
                   req.user!.role === 'program_manager' ||
                   req.user!.role === 'rd_manager' ||
                   existingProject.managerId === req.user!.id;

  if (!canUpdate) {
    throw new ValidationError('Insufficient permissions to update this project');
  }

  // Create version snapshot before update
  if (!db.isUsingMock()) {
    await prisma.projectVersion.create({
      data: {
        projectId: projectId,
        version: existingProject.version,
        snapshot: existingProject as any,
        changedBy: req.user!.id,
        changeType: 'UPDATE'
      }
    });
  }

  const project = await db.updateProject(projectId, {
    ...(projectData.title && { title: projectData.title }),
    ...(projectData.description !== undefined && { description: projectData.description }),
    ...(projectData.status && { status: projectData.status.toUpperCase() }),
    ...(projectData.priority && { priority: projectData.priority.toUpperCase() }),
    ...(projectData.progress !== undefined && { progress: projectData.progress }),
    ...(projectData.estimatedHours !== undefined && { estimatedHours: projectData.estimatedHours }),
    ...(projectData.budgetAmount !== undefined && { budgetAmount: projectData.budgetAmount }),
    ...(projectData.budgetCurrency && { budgetCurrency: projectData.budgetCurrency }),
    ...(projectData.timeline !== undefined && { timeline: projectData.timeline }),
    ...(projectData.tags && { tags: projectData.tags }),
    version: existingProject.version + 1
  });

  // Log activity
  await db.createActivityLog({
    userId: req.user!.id,
    action: 'PROJECT_UPDATED',
    entityType: 'PROJECT',
    entityId: project.id,
    projectId: project.id,
    details: `Updated project: ${project.title}`
  });

  res.json({
    success: true,
    data: {
      ...project,
      status: project.status?.toLowerCase() || 'pending',
      priority: project.priority?.toLowerCase() || 'medium',
      budgetAmount: project.budgetAmount ? Number(project.budgetAmount) : undefined,
      timeline: project.timeline || undefined,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    },
    message: 'Project updated successfully',
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}

async function handleAssignEmployee(req: Request, res: Response, projectId: string, assignmentData: AssignEmployeeRequest): Promise<void> {
  try {
    // Use database service for assignment
    const assignment = await db.assignEmployeeToProject(projectId, assignmentData, req.user!.id);

    res.json({
      success: true,
      data: assignment,
      message: 'Employee assigned successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error assigning employee:', error);
    
    // Provide more specific error messages
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('already assigned')) {
      throw new ValidationError('Employee is already assigned to this project. Use update to modify assignment.');
    } else if (errorMessage.includes('workload capacity')) {
      throw new ValidationError(errorMessage);
    } else if (errorMessage.includes('not found')) {
      throw new NotFoundError(errorMessage);
    } else {
      throw new Error(`Failed to assign employee: ${errorMessage}`);
    }
  }
}

async function handleUnassignEmployee(req: Request, res: Response, projectId: string, data: { employeeId: string }): Promise<void> {
  try {
    // Use database service for unassignment
    await db.unassignEmployeeFromProject(projectId, data.employeeId, req.user!.id);

    res.json({
      success: true,
      message: 'Employee unassigned successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error unassigning employee:', error);
    throw error;
  }
}

async function handleMilestoneAction(req: Request, res: Response, projectId: string, milestoneData: any): Promise<void> {
  if (milestoneData.action === 'create') {
    const milestone = await prisma.milestone.create({
      data: {
        projectId: projectId,
        title: milestoneData.title,
        description: milestoneData.description,
        dueDate: new Date(milestoneData.dueDate)
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'MILESTONE_CREATED',
        entityType: 'MILESTONE',
        entityId: milestone.id,
        projectId: projectId,
        details: `Created milestone: ${milestone.title}`
      }
    });

    res.json({
      success: true,
      data: {
        ...milestone,
        dueDate: milestone.dueDate.toISOString(),
        createdAt: milestone.createdAt.toISOString(),
        updatedAt: milestone.updatedAt.toISOString()
      },
      message: 'Milestone created successfully'
    });
  } else if (milestoneData.action === 'complete') {
    const milestone = await prisma.milestone.update({
      where: { id: milestoneData.milestoneId },
      data: {
        completed: true,
        completedAt: new Date()
      }
    });

    await prisma.activityLog.create({
      data: {
        userId: req.user!.id,
        action: 'MILESTONE_COMPLETED',
        entityType: 'MILESTONE',
        entityId: milestone.id,
        projectId: projectId,
        details: `Completed milestone: ${milestone.title}`
      }
    });

    res.json({
      success: true,
      message: 'Milestone completed successfully'
    });
  }
}

async function handleAddComment(req: Request, res: Response, projectId: string, commentData: { content: string }): Promise<void> {
  const comment = await prisma.comment.create({
    data: {
      content: commentData.content,
      userId: req.user!.id,
      projectId: projectId
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          avatar: true
        }
      }
    }
  });

  res.json({
    success: true,
    data: {
      ...comment,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString()
    },
    message: 'Comment added successfully'
  });
}

async function handleCompleteProject(req: Request, res: Response, projectId: string): Promise<void> {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status: 'COMPLETED' }
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user!.id,
      action: 'PROJECT_COMPLETED',
      entityType: 'PROJECT',
      entityId: projectId,
      projectId: projectId,
      details: `Completed project: ${project.title}`
    }
  });

  res.json({
    success: true,
    message: 'Project completed successfully'
  });
}

async function handleActivateProject(req: Request, res: Response, projectId: string): Promise<void> {
  const project = await prisma.project.update({
    where: { id: projectId },
    data: { status: 'ACTIVE' }
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user!.id,
      action: 'PROJECT_ACTIVATED',
      entityType: 'PROJECT',
      entityId: projectId,
      projectId: projectId,
      details: `Activated project: ${project.title}`
    }
  });

  res.json({
    success: true,
    message: 'Project activated successfully'
  });
}

async function handleDeleteProject(req: Request, res: Response, projectId: string): Promise<void> {
  const project = await prisma.project.findUnique({
    where: { id: projectId }
  });

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Check permissions
  const canDelete = req.user!.role === 'admin' || 
                   req.user!.role === 'program_manager' ||
                   project.managerId === req.user!.id;

  if (!canDelete) {
    throw new ValidationError('Insufficient permissions to delete this project');
  }

  // Soft delete - change status to cancelled
  await prisma.project.update({
    where: { id: projectId },
    data: { status: 'CANCELLED' }
  });

  await prisma.activityLog.create({
    data: {
      userId: req.user!.id,
      action: 'PROJECT_DELETED',
      entityType: 'PROJECT',
      entityId: projectId,
      projectId: projectId,
      details: `Deleted project: ${project.title}`
    }
  });

  res.json({
    success: true,
    message: 'Project deleted successfully'
  });
}

async function calculateProjectAnalytics(where: any) {
  const [statusCounts, priorityCounts, totalProjects] = await Promise.all([
    prisma.project.groupBy({
      by: ['status'],
      where,
      _count: { status: true }
    }),
    prisma.project.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true }
    }),
    prisma.project.count({ where })
  ]);

  return {
    projectsByStatus: statusCounts.reduce((acc, item) => {
      acc[item.status.toLowerCase()] = item._count.status;
      return acc;
    }, {} as Record<string, number>),
    projectsByPriority: priorityCounts.reduce((acc, item) => {
      acc[item.priority.toLowerCase()] = item._count.priority;
      return acc;
    }, {} as Record<string, number>),
    totalProjects
  };
}

export default router;