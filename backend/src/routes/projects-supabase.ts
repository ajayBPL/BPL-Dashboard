import express, { Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { asyncHandler, ValidationError, NotFoundError } from '../middleware/errorHandler';
import { db } from '../services/database';

const router = express.Router();

router.use(authenticateToken);

// GET /projects - List projects with role-based filtering
router.get('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await db.getAllProjects();
    
    // Apply role-based filtering
    let filteredProjects = projects;
    if (req.user!.role === 'manager') {
      // Managers can only see their own projects and projects they're assigned to
      filteredProjects = projects.filter((project: any) => 
        project.managerId === req.user!.id || 
        (project.assignments && project.assignments.some((assignment: any) => assignment.employeeId === req.user!.id))
      );
    } else if (req.user!.role === 'employee') {
      // Employees can only see projects they're assigned to
      filteredProjects = projects.filter((project: any) => 
        project.assignments && project.assignments.some((assignment: any) => assignment.employeeId === req.user!.id)
      );
    }

    res.json({
      success: true,
      data: filteredProjects,
      meta: {
        total: filteredProjects.length,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch projects',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}));

// GET /projects/:id - Get specific project
router.get('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  const project = await db.getProjectById(id);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Check access permissions
  const hasAccess = req.user!.role === 'admin' || 
                   project.managerId === req.user!.id ||
                   (project.assignments && project.assignments.some((a: any) => a.employeeId === req.user!.id));

  if (!hasAccess) {
    throw new NotFoundError('Project not found'); // Don't reveal existence
  }

  res.json({
    success: true,
    data: project,
    meta: {
      timestamp: new Date().toISOString()
    }
  });
}));

// PUT /projects/:id - Update project
router.put('/:id', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await handleUpdateProject(req, res, id, req.body);
}));

// POST /projects - Handle project actions
router.post('/', asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { action, id, data } = req.body;

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
    default:
      res.status(400).json({
        success: false,
        error: 'Invalid action',
        message: 'Supported actions: create, update, delete, assign, unassign, milestone, comment'
      });
  }
}));

// Helper functions
async function handleCreateProject(req: Request, res: Response, data: any): Promise<void> {
  // Validate required fields
  if (!data.title || !data.managerId) {
    res.status(400).json({
      success: false,
      error: 'Missing required fields',
      message: 'Title and managerId are required'
    });
    return;
  }

  // Check permissions
  const allowedRoles = ['admin', 'program_manager', 'rd_manager', 'manager'];
  if (!allowedRoles.includes(req.user!.role)) {
    res.status(403).json({
      success: false,
      error: 'Insufficient permissions',
      message: 'Only admins, program managers, R&D managers, and team managers can create projects'
    });
    return;
  }

  try {
    const project = await db.createProject({
      title: data.title,
      description: data.description || '',
      managerId: data.managerId,
      status: data.status || 'pending',
      priority: data.priority || 'medium',
      estimatedHours: data.estimatedHours || 0,
      budgetAmount: data.budgetAmount || null,
      budgetCurrency: data.budgetCurrency || 'USD',
      timeline: data.timeline || null,
      tags: data.tags || [],
      progress: 0
    });

    res.status(201).json({
      success: true,
      data: project,
      message: 'Project created successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleUpdateProject(req: Request, res: Response, id: string, data: any): Promise<void> {
  try {
    // Check if project exists and user has access
    const existingProject = await db.getProjectById(id);
    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions - allow admin, program_manager, or the project manager
    const userRole = req.user!.role.toLowerCase();
    const hasAccess = userRole === 'admin' || 
                      userRole === 'program_manager' ||
                      existingProject.managerId === req.user!.id;
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins, program managers, and project managers can update projects'
      });
      return;
    }

    const updatedProject = await db.updateProject(id, data);

    res.json({
      success: true,
      data: updatedProject,
      message: 'Project updated successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleDeleteProject(req: Request, res: Response, id: string): Promise<void> {
  try {
    // Check if project exists and user has access
    const existingProject = await db.getProjectById(id);
    if (!existingProject) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions - allow admin, program_manager, or the project manager
    const userRole = req.user!.role.toLowerCase();
    const hasAccess = userRole === 'admin' || 
                      userRole === 'program_manager' ||
                      existingProject.managerId === req.user!.id;
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins and project managers can delete projects'
      });
      return;
    }

    await db.deleteProject(id);

    res.json({
      success: true,
      message: 'Project deleted successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete project',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleAssignEmployee(req: Request, res: Response, projectId: string, data: any): Promise<void> {
  try {
    // Check if project exists and user has access
    const project = await db.getProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions
    const hasAccess = req.user!.role === 'admin' || project.managerId === req.user!.id;
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins and project managers can assign employees'
      });
      return;
    }

    const assignment = await db.assignEmployeeToProject(
      projectId,
      {
        employeeId: data.employeeId,
        involvementPercentage: data.involvementPercentage || 100
      },
      req.user!.id
    );

    res.json({
      success: true,
      data: assignment,
      message: 'Employee assigned to project successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error assigning employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign employee',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleUnassignEmployee(req: Request, res: Response, projectId: string, data: any): Promise<void> {
  try {
    // Check if project exists and user has access
    const project = await db.getProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions
    const hasAccess = req.user!.role === 'admin' || project.managerId === req.user!.id;
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins and project managers can unassign employees'
      });
      return;
    }

    await db.unassignEmployeeFromProject(projectId, data.employeeId);

    res.json({
      success: true,
      message: 'Employee unassigned from project successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error unassigning employee:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to unassign employee',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleMilestoneAction(req: Request, res: Response, projectId: string, data: any): Promise<void> {
  try {
    // Check if project exists and user has access
    const project = await db.getProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions
    const hasAccess = req.user!.role === 'admin' || project.managerId === req.user!.id;
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only admins and project managers can manage milestones'
      });
      return;
    }

    const milestone = await db.createMilestone({
      projectId,
      title: data.title,
      description: data.description || '',
      dueDate: data.dueDate,
      status: data.status || 'pending'
    });

    res.json({
      success: true,
      data: milestone,
      message: 'Milestone created successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error creating milestone:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create milestone',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleAddComment(req: Request, res: Response, projectId: string, data: any): Promise<void> {
  try {
    // Check if project exists and user has access
    const project = await db.getProjectById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Check permissions
    const hasAccess = req.user!.role === 'admin' || 
                     project.managerId === req.user!.id ||
                     (project.assignments && project.assignments.some((a: any) => a.employeeId === req.user!.id));
    if (!hasAccess) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        message: 'Only project members can add comments'
      });
      return;
    }

    const comment = await db.createComment({
      content: data.content,
      userId: req.user!.id,
      projectId: projectId
    });

    res.json({
      success: true,
      data: comment,
      message: 'Comment added successfully',
      meta: {
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add comment',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export default router;
