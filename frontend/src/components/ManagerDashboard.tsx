/**
 * ManagerDashboard Component
 * 
 * This is the main dashboard component for managers in the BPL Commander system.
 * It provides comprehensive project and team management capabilities including:
 * 
 * Key Features:
 * - Project management (create, edit, view, track progress)
 * - Initiative management (create and track initiatives)
 * - Team management (view subordinates, assign projects)
 * - Employee overview and workload tracking
 * - Export system for reports and data
 * - Real-time filtering and search capabilities
 * - Budget tracking and analytics
 * 
 * User Roles Supported:
 * - Manager: Full access to team management
 * - Program Manager: Cross-team project oversight
 * - RD Manager: Research & Development focus
 * 
 * Data Management:
 * - Integrates with centralized database service
 * - Real-time API synchronization
 * - Local state management with React hooks
 * - Error handling and user feedback via toast notifications
 */

import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CentralizedProject, CentralizedInitiative, BudgetInfo } from '../utils/centralizedDb'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { ExportSystem } from './ExportSystem'
import { ProjectDetails } from './ProjectDetails'
import { ProjectCard } from './project/ProjectCard'
import { ProjectCreateDialog } from './project/ProjectCreateDialog'
import { DashboardStats } from './project/DashboardStats'
import { InitiativeCreateDialog } from './initiatives/InitiativeCreateDialog'
import { InitiativesList } from './initiatives/InitiativesList'
import { EmployeeManagement } from './EmployeeManagement'
import { EmployeeOverview } from './EmployeeOverview'
import { Users } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Dialog, DialogTrigger } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Label } from './ui/label'
import { Plus, Download, Target, Lightbulb, Search, Filter, Activity } from 'lucide-react'
import { toast } from 'sonner'

/**
 * Main ManagerDashboard Component Function
 * 
 * @returns {JSX.Element} The complete manager dashboard interface
 */
export function ManagerDashboard() {
  // Authentication context - provides current user information
  const { user: currentUser } = useAuth()
  
  // Core data state management
  const [projects, setProjects] = useState<CentralizedProject[]>([])           // All projects data
  const [filteredProjects, setFilteredProjects] = useState<CentralizedProject[]>([]) // Filtered projects for display
  const [initiatives, setInitiatives] = useState<CentralizedInitiative[]>([])   // All initiatives data
  const [loading, setLoading] = useState(true)                                 // Loading state for API calls
  
  // UI state management for dialogs and modals
  const [showCreateProject, setShowCreateProject] = useState(false)            // Project creation dialog
  const [showCreateInitiative, setShowCreateInitiative] = useState(false)     // Initiative creation dialog
  const [showExportSystem, setShowExportSystem] = useState(false)             // Export system dialog
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null) // Selected project for details view
  
  // Filter and search state management
  const [searchQuery, setSearchQuery] = useState('')                           // Text search query
  const [statusFilter, setStatusFilter] = useState<string>('all')             // Project status filter
  const [priorityFilter, setPriorityFilter] = useState<string>('all')         // Project priority filter
  
  // Team hierarchy and user management state
  const [users, setUsers] = useState<any[]>([])                               // All users data
  const [subordinateEmployees, setSubordinateEmployees] = useState<any[]>([]) // Direct subordinates
  const [selectedManager, setSelectedManager] = useState<string>('all')       // Manager filter selection
  
  // Form state management for project and initiative creation
  // Available project categories for rotation (Engineering Change Request, Engineering Change Notice, New Product Development, Sustainability)
  const availableCategories: ('ECR' | 'ECN' | 'NPD' | 'SUST')[] = ['ECR', 'ECN', 'NPD', 'SUST']
  const [categoryIndex, setCategoryIndex] = useState(0) // Index for rotating through categories

  // Project creation form state
  const [projectForm, setProjectForm] = useState({
    title: '',                    // Project title
    description: '',              // Project description
    projectDetails: '',           // Detailed project information
    timelineDate: '',            // Project deadline/timeline
    priority: 'medium' as 'low' | 'medium' | 'high' | 'critical', // Project priority level
    tags: [] as string[],         // Project tags for categorization
    requiredSkills: [] as string[], // Skills required for the project
    category: availableCategories[0] as 'ECR' | 'ECN' | 'NPD' | 'SUST' // Project category
  })

  // Initiative creation form state
  const [initiativeForm, setInitiativeForm] = useState({
    title: '',                    // Initiative title
    description: '',              // Initiative description
    category: '',                 // Initiative category
    priority: 'medium' as 'low' | 'medium' | 'high', // Initiative priority
    estimatedHours: 10,           // Estimated hours to complete
    workloadPercentage: 5,        // Percentage of workload this initiative represents
    assignedTo: '',               // Employee assigned to the initiative
    dueDate: ''                   // Initiative due date
  })

  /**
   * Effect hook to fetch initial data when component mounts or user changes
   * Fetches projects, initiatives, and user data from the API
   */
  useEffect(() => {
    fetchData()
  }, [currentUser])

  useEffect(() => {
    filterProjects()
  }, [projects, searchQuery, statusFilter, priorityFilter])

  useEffect(() => {
    if (users.length > 0 && currentUser) {
      const subordinateEmployees = getAllSubordinateEmployees()
      setSubordinateEmployees(subordinateEmployees)
    }
  }, [users, currentUser])

  /**
   * fetchData - Main data fetching function
   * 
   * Fetches all necessary data for the manager dashboard including:
   * - Projects data from the backend API
   * - Users data for team management
   * - Initiatives data for initiative tracking
   * 
   * Handles API errors gracefully and provides user feedback via toast notifications.
   * Updates loading state throughout the process.
   * 
   * @async
   * @function fetchData
   * @returns {Promise<void>}
   */
  const fetchData = async () => {
    // Early return if no authenticated user
    if (!currentUser) return
    
    try {
      setLoading(true) // Set loading state to show loading indicators
      
      // Get authentication token from localStorage
      const token = localStorage.getItem('bpl-token')
      if (token) {
        try {
          // Fetch projects and users data in parallel for better performance
          const [projectsResponse, usersResponse] = await Promise.all([
            fetch(API_ENDPOINTS.PROJECTS, {
              headers: getDefaultHeaders(token)
            }),
            fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
              headers: getDefaultHeaders(token)
            })
          ])

          // Check if both API calls were successful
          if (projectsResponse.ok && usersResponse.ok) {
            const projectsData = await projectsResponse.json()
            const usersData = await usersResponse.json()
            
            // Process projects data if successful
            if (projectsData.success && projectsData.data) {
              // Convert backend project format to frontend CentralizedProject format
              const backendProjects = projectsData.data.map((project: any) => ({
                id: project.id,                                    // Unique project identifier
                title: project.title,                             // Project title
                description: project.description,                 // Project description
                projectDetails: project.description || '',        // Detailed project information
                managerId: project.managerId,                     // ID of project manager
                timeline: project.timeline,                       // Project timeline/deadline
                status: project.status?.toLowerCase() || 'pending', // Project status (normalized to lowercase)
                priority: project.priority?.toLowerCase() || 'medium', // Project priority (normalized to lowercase)
                category: project.category || 'standard',         // Project category
                assignedEmployees: project.assignments || [],     // List of assigned employees
                milestones: [],                                   // Project milestones (empty for now)
                tags: project.tags || [],                         // Project tags for categorization
                requiredSkills: [],                              // Required skills (empty for now)
                estimatedHours: project.estimatedHours,          // Estimated hours to complete
                // Budget information if available
                budget: project.budgetAmount ? {
                  amount: project.budgetAmount,                  // Budget amount
                  currency: project.budgetCurrency || 'USD',     // Budget currency
                  allocatedAt: project.createdAt,                // When budget was allocated
                  allocatedBy: project.managerId,                // Who allocated the budget
                  notes: 'Initial budget allocation'             // Budget notes
                } : undefined,
                createdAt: project.createdAt,                    // Project creation timestamp
                updatedAt: project.updatedAt,                    // Last update timestamp
                version: project.version || 1,                   // Project version number
                discussionCount: 0,
                lastActivity: project.updatedAt
              }))

              // Filter based on user role and permissions
              if (currentUser.role === 'admin') {
                setProjects(backendProjects)
              } else if (currentUser.role === 'program_manager') {
                setProjects(backendProjects)
              } else if (currentUser.role === 'rd_manager') {
                setProjects(backendProjects.filter(p => 
                  p.managerId === currentUser.id || 
                  p.assignedEmployees.some(emp => emp.employeeId === currentUser.id)
                ))
              } else if (currentUser.role === 'manager') {
                setProjects(backendProjects.filter(p => 
                  p.managerId === currentUser.id ||
                  p.assignedEmployees.some(emp => emp.employeeId === currentUser.id)
                ))
              }
            }
            
            // Set users data
            if (usersData.success && usersData.data) {
              setUsers(usersData.data)
            }
          }
        } catch (apiError) {
          console.error('Error fetching projects from API:', apiError)
          // Fallback to empty arrays if API fails
          const allProjects: any[] = []
          const allInitiatives: any[] = []
          const allUsers: any[] = []
          setUsers(allUsers)
          
          if (currentUser.role === 'admin') {
            setProjects(allProjects)
            setInitiatives(allInitiatives)
          } else if (currentUser.role === 'program_manager') {
            setProjects(allProjects)
            setInitiatives(allInitiatives)
          } else if (currentUser.role === 'rd_manager') {
            setProjects(allProjects.filter(p => 
              p.managerId === currentUser.id || 
              p.assignedEmployees.some(emp => emp.employeeId === currentUser.id)
            ))
            setInitiatives(allInitiatives)
          } else if (currentUser.role === 'manager') {
            setProjects(allProjects.filter(p => 
              p.managerId === currentUser.id ||
              p.assignedEmployees.some(emp => emp.employeeId === currentUser.id)
            ))
            setInitiatives(allInitiatives.filter(i => 
              i.createdBy === currentUser.id || i.assignedTo === currentUser.id
            ))
          }
        }
      } else {
        // No token, use empty arrays
        const allProjects: any[] = []
        const allInitiatives: any[] = []
        const allUsers: any[] = []
        setUsers(allUsers)
        
        if (currentUser.role === 'admin') {
          setProjects(allProjects)
          setInitiatives(allInitiatives)
        } else if (currentUser.role === 'program_manager') {
          setProjects(allProjects)
          setInitiatives(allInitiatives)
        } else if (currentUser.role === 'rd_manager') {
          setProjects(allProjects.filter(p => 
            p.managerId === currentUser.id || 
            p.assignedEmployees.some(emp => emp.employeeId === currentUser.id)
          ))
          setInitiatives(allInitiatives)
        } else if (currentUser.role === 'manager') {
          setProjects(allProjects.filter(p => 
            p.managerId === currentUser.id ||
            p.assignedEmployees.some(emp => emp.employeeId === currentUser.id)
          ))
          setInitiatives(allInitiatives.filter(i => 
            i.createdBy === currentUser.id || i.assignedTo === currentUser.id
          ))
        }
      }

      // Always fetch initiatives from backend API
      const allInitiatives: any[] = []
      if (currentUser.role === 'admin' || currentUser.role === 'program_manager' || currentUser.role === 'rd_manager') {
        setInitiatives(allInitiatives)
      } else if (currentUser.role === 'manager') {
        setInitiatives(allInitiatives.filter(i => 
          i.createdBy === currentUser.id || i.assignedTo === currentUser.id
        ))
      }
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Get subordinate managers (managers who report to current user)
  const getSubordinateManagers = () => {
    if (!currentUser) return []
    
    // For admins, program managers, and R&D managers, get all managers who report to them
    if (currentUser.role === 'admin' || currentUser.role === 'program_manager' || currentUser.role === 'rd_manager' || 
        currentUser.role === 'PROGRAM_MANAGER' || currentUser.role === 'RD_MANAGER') {
      return users.filter(user => 
        user.managerId === currentUser.id && 
        (user.role === 'manager' || user.role === 'rd_manager' || user.role === 'MANAGER' || user.role === 'RD_MANAGER')
      )
    }
    return []
  }

  // Get employees under a specific manager
  const getEmployeesUnderManager = (managerId: string) => {
    return users.filter(user => {
      const role = user.role?.toLowerCase()
      return user.managerId === managerId && 
             (role === 'employee' || role === 'EMPLOYEE' || role === 'intern' || role === 'INTERN' ||
              role === 'manager' || role === 'MANAGER' || role === 'rd_manager' || role === 'RD_MANAGER' ||
              role === 'lab in charge' || role === 'LAB IN CHARGE')
    })
  }

  // Get all employees under subordinate managers
  const getAllSubordinateEmployees = () => {
    const subordinateManagers = getSubordinateManagers()
    const allEmployees: any[] = []
    
    // For Program Managers, show ALL employees and interns in the organization
    if (currentUser && (currentUser.role === 'program_manager' || currentUser.role === 'PROGRAM_MANAGER')) {
      const allOrgEmployees = users.filter(user => {
        const role = user.role?.toLowerCase()
        return role === 'employee' || role === 'EMPLOYEE' || role === 'intern' || role === 'INTERN' ||
               role === 'manager' || role === 'MANAGER' || role === 'rd_manager' || role === 'RD_MANAGER' ||
               role === 'lab in charge' || role === 'LAB IN CHARGE'
      })
      
      allOrgEmployees.forEach(employee => {
        // Find the manager name for this employee
        const manager = users.find(u => u.id === employee.managerId)
        allEmployees.push({
          ...employee,
          managerName: manager ? manager.name : 'No Manager',
          managerRole: manager ? manager.role : 'Unknown'
        })
      })
      
      return allEmployees
    }
    
    // For other roles, use the original logic
    subordinateManagers.forEach(manager => {
      const employees = getEmployeesUnderManager(manager.id)
      employees.forEach(employee => {
        allEmployees.push({
          ...employee,
          managerName: manager.name,
          managerRole: manager.role
        })
      })
    })
    
    return allEmployees
  }

  // Get role display name
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'program_manager':
      case 'PROGRAM_MANAGER':
        return 'Program Manager'
      case 'rd_manager':
      case 'RD_MANAGER':
        return 'R&D Manager'
      case 'EMPLOYEE':
        return 'Employee'
      case 'MANAGER':
        return 'Manager'
      case 'INTERN':
        return 'Intern'
      case 'LAB IN CHARGE':
        return 'Lab In Charge'
      case 'admin':
        return 'Admin'
      default:
        return role.charAt(0).toUpperCase() + role.slice(1)
    }
  }

  const filterProjects = () => {
    let filtered = [...projects]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(query) ||
        project.description.toLowerCase().includes(query) ||
        project.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(project => project.status === statusFilter)
    }

    // Apply priority filter
    if (priorityFilter !== 'all') {
      filtered = filtered.filter(project => project.priority === priorityFilter)
    }

    setFilteredProjects(filtered)
  }

  const resetProjectForm = () => {
    setProjectForm({
      title: '',
      description: '',
      projectDetails: '',
      timelineDate: '',
      priority: 'medium',
      tags: [],
      requiredSkills: [],
      category: availableCategories[categoryIndex]
    })
  }

  const resetInitiativeForm = () => {
    setInitiativeForm({
      title: '',
      description: '',
      category: '',
      priority: 'medium',
      estimatedHours: 10,
      workloadPercentage: 5,
      assignedTo: '',
      dueDate: ''
    })
  }

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    // Check if user has permission to create projects
    if (!['admin', 'program_manager', 'rd_manager', 'manager'].includes(currentUser.role.toLowerCase())) {
      toast.error('You do not have permission to create projects')
      return
    }

    try {
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        toast.error('Authentication token not found')
        return
      }

      // Prepare project data for backend API
      const projectData = {
        title: projectForm.title,
        description: projectForm.description,
        timelineDate: projectForm.timelineDate,
        priority: projectForm.priority,
        category: projectForm.category,
        tags: projectForm.tags
      }

      // Create project via backend API
      const response = await fetch(API_ENDPOINTS.PROJECTS, {
        method: 'POST',
        headers: getDefaultHeaders(token),
        body: JSON.stringify({
          action: 'create',
          data: projectData
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Failed to create project')
      }

      // Refresh projects list from backend to get the correct project ID
      await fetchData()
      
      toast.success(`Project "${projectForm.title}" created successfully!`)
      
      // Cycle to next category for next project
      const nextIndex = (categoryIndex + 1) % availableCategories.length
      setCategoryIndex(nextIndex)
      
      resetProjectForm()
      setShowCreateProject(false)
    } catch (error) {
      console.error('Error creating project:', error)
      toast.error('Failed to create project')
    }
  }

  const handleCreateInitiative = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    // Check if user has permission to create initiatives
    if (!['admin', 'program_manager', 'rd_manager', 'manager'].includes(currentUser.role.toLowerCase())) {
      toast.error('You do not have permission to create Over & Beyond initiatives')
      return
    }

    try {
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        toast.error('Authentication token not found')
        return
      }

      // Prepare initiative data for backend API
      const initiativeData = {
        title: initiativeForm.title,
        description: initiativeForm.description,
        category: initiativeForm.category,
        priority: initiativeForm.priority,
        estimatedHours: initiativeForm.estimatedHours,
        workloadPercentage: initiativeForm.workloadPercentage,
        assignedTo: initiativeForm.assignedTo || undefined,
        dueDate: initiativeForm.dueDate || undefined
      }

      // Create initiative via backend API
      const response = await fetch(API_ENDPOINTS.INITIATIVES, {
        method: 'POST',
        headers: getDefaultHeaders(token),
        body: JSON.stringify({
          action: 'create',
          data: initiativeData
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      if (!result.success) {
        throw new Error(result.message || 'Failed to create initiative')
      }

      // Refresh initiatives list from backend
      await fetchData()
      
      toast.success(`Initiative "${initiativeForm.title}" created successfully!`)
      
      resetInitiativeForm()
      setShowCreateInitiative(false)
    } catch (error) {
      console.error('Error creating initiative:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to create initiative'
      toast.error(errorMessage)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setStatusFilter('all')
    setPriorityFilter('all')
  }

  const canCreateProjects = currentUser && ['admin', 'program_manager', 'rd_manager', 'manager'].includes(currentUser.role.toLowerCase())
  const canCreateInitiatives = currentUser && ['admin', 'program_manager', 'rd_manager', 'manager'].includes(currentUser.role.toLowerCase())
  const canViewEmployeeOverview = currentUser && (currentUser.role === 'program_manager' || currentUser.role === 'PROGRAM_MANAGER')

  // Debug logging
  console.log('ManagerDashboard Debug:', {
    currentUser,
    userRole: currentUser?.role,
    canCreateProjects,
    canCreateInitiatives,
    canViewEmployeeOverview,
    allUsers: users.map(u => ({ id: u.id, name: u.name, role: u.role }))
  })

  // Get total number of employees from users data
  const totalEmployees = users.filter(user => {
    const role = user.role?.toLowerCase()
    return role === 'employee' || role === 'manager' || role === 'program_manager' || role === 'rd_manager' ||
           role === 'EMPLOYEE' || role === 'MANAGER' || role === 'PROGRAM_MANAGER' || role === 'RD_MANAGER' ||
           role === 'intern' || role === 'INTERN' || role === 'lab in charge' || role === 'LAB IN CHARGE'
  }).length

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || priorityFilter !== 'all'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manager Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {currentUser?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowExportSystem(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          {canCreateProjects && (
            <Dialog open={showCreateProject} onOpenChange={setShowCreateProject}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Project
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
          {canCreateInitiatives && (
            <Dialog open={showCreateInitiative} onOpenChange={setShowCreateInitiative}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  Create Initiative
                </Button>
              </DialogTrigger>
            </Dialog>
          )}
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats
        totalProjects={projects.length}
        activeProjects={projects.filter(p => p.status === 'active').length}
        totalInitiatives={initiatives.length}
        uniqueTeamMembers={totalEmployees}
      />

      <Tabs defaultValue="projects" className="space-y-6">
        <TabsList className={`grid w-full ${canViewEmployeeOverview ? 'grid-cols-4' : 'grid-cols-3'}`}>
          <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
          <TabsTrigger value="initiatives">Over & Beyond ({initiatives.length})</TabsTrigger>
          <TabsTrigger value="employees">Team Management</TabsTrigger>
          {canViewEmployeeOverview && (
            <TabsTrigger value="employee-overview">Employee Overview</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="projects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Projects Overview
              </CardTitle>
              <CardDescription>Manage your projects and track progress</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search projects by title, description, or tags..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="on-hold">On Hold</SelectItem>
                        <SelectItem value="cancelled">Cancelled</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Showing {filteredProjects.length} of {projects.length} projects
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Projects List */}
              <div className="space-y-4">
                {filteredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onViewDetails={setSelectedProjectId}
                  />
                ))}

                {filteredProjects.length === 0 && projects.length > 0 && (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No projects match your filters</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}

                {projects.length === 0 && (
                  <div className="text-center py-12">
                    <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No Projects Yet</h3>
                    <p className="text-muted-foreground mb-4">
                      {canCreateProjects 
                        ? "Create your first project to get started" 
                        : "No projects have been assigned to you yet"}
                    </p>
                    {canCreateProjects && (
                      <Button onClick={() => setShowCreateProject(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Project
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="initiatives" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Over & Beyond Section
              </CardTitle>
              <CardDescription>
                Manage innovation projects and initiatives (20% workload cap enforced)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="initiatives" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="initiatives">Initiatives</TabsTrigger>
                  <TabsTrigger value="projects">Projects</TabsTrigger>
                </TabsList>
                
                <TabsContent value="initiatives" className="space-y-4">
                  <InitiativesList
                    initiatives={initiatives}
                    canCreateInitiatives={!!canCreateInitiatives}
                    onCreateInitiative={() => setShowCreateInitiative(true)}
                  />
                </TabsContent>
                
                <TabsContent value="projects" className="space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold">Over & Beyond Projects</h3>
                      <p className="text-sm text-muted-foreground">
                        Innovation and improvement projects that go above and beyond regular work
                      </p>
                    </div>
                    {!!canCreateProjects && (
                      <Button onClick={() => {
                        setProjectForm({
                          title: '',
                          description: '',
                          projectDetails: '',
                          timeline: '',
                          priority: 'medium',
                          estimatedHours: '',
                          budget: '',
                          currency: 'USD',
                          tags: [],
                          requiredSkills: [],
                          category: 'over_beyond'
                        })
                        setShowCreateProject(true)
                      }}>
                        <Plus className="h-4 w-4 mr-2" />
                        Create Over & Beyond Project
                      </Button>
                    )}
                  </div>
                  
                  <div className="grid gap-4">
                    {projects
                      .filter(project => project.category === 'over_beyond')
                      .map(project => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          onViewDetails={(id) => setSelectedProjectId(id)}
                        />
                      ))}
                      
                    {projects.filter(project => project.category === 'over_beyond').length === 0 && (
                      <div className="text-center py-12">
                        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3>No Over & Beyond Projects</h3>
                        <p className="text-muted-foreground">
                          Create innovation projects that go beyond regular work scope.
                        </p>
                      </div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="employees" className="space-y-6">
          {/* Show hierarchical view for R&D Managers and Program Managers */}
          {(currentUser?.role === 'PROGRAM_MANAGER' || currentUser?.role === 'RD_MANAGER' || 
            currentUser?.role === 'program_manager' || currentUser?.role === 'rd_manager') ? (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Hierarchy View
                  </CardTitle>
                  <CardDescription>
                    View all employees under managers who report to you
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {/* Manager Filter */}
                  <div className="mb-6">
                    <Label htmlFor="managerFilter" className="text-sm font-medium mb-2 block">
                      Filter by Manager
                    </Label>
                    <Select value={selectedManager} onValueChange={setSelectedManager}>
                      <SelectTrigger className="w-64">
                        <SelectValue placeholder="All managers" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Managers</SelectItem>
                        {getSubordinateManagers().map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name} ({getRoleDisplay(manager.role)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Subordinate Managers Overview */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Subordinate Managers</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {getSubordinateManagers().map((manager) => {
                        const employees = getEmployeesUnderManager(manager.id)
                        return (
                          <Card key={manager.id} className="p-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="font-medium">{manager.name}</h4>
                                <p className="text-sm text-muted-foreground">{getRoleDisplay(manager.role)}</p>
                                <p className="text-sm text-muted-foreground">{employees.length} employees</p>
                              </div>
                              <Badge variant="secondary">
                                {employees.length} employees
                              </Badge>
                            </div>
                          </Card>
                        )
                      })}
                    </div>
                  </div>

                  {/* Employees List */}
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Employees Under Subordinate Managers</h3>
                    {subordinateEmployees.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No employees found under subordinate managers</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {(selectedManager && selectedManager !== 'all'
                          ? subordinateEmployees.filter(emp => emp.managerId === selectedManager)
                          : subordinateEmployees
                        ).map((employee) => {
                          const workload = employee.workloadCap || 0
                          return (
                            <Card key={employee.id} className="p-4" style={{ backgroundColor: '#7FFFD4', border: '2px solid #40E0D0' }}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="font-medium">
            {employee.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
                                  <div>
                                    <h4 className="font-medium" style={{ color: '#006400' }}>{employee.name}</h4>
                                    <p className="text-sm" style={{ color: '#2E8B57' }}>{employee.email}</p>
                                    <p className="text-sm" style={{ color: '#2E8B57' }}>
                                      Reports to: {employee.managerName} ({getRoleDisplay(employee.managerRole)})
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                  <div className="text-right">
                                    <p className="text-sm" style={{ color: '#2E8B57' }}>Workload</p>
                                    <p className={`font-medium ${
                                      workload > 100 ? 'text-red-600' :
                                      workload > 80 ? 'text-yellow-600' : 'text-green-600'
                                    }`}>
                                      {workload}%
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm" style={{ color: '#2E8B57' }}>Department</p>
                                    <p className="font-medium" style={{ color: '#006400' }}>{employee.department || 'Not assigned'}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm" style={{ color: '#2E8B57' }}>Designation</p>
                                    <p className="font-medium" style={{ color: '#006400' }}>{employee.designation || 'Not assigned'}</p>
                                  </div>
                                  <Badge variant="outline" style={{ backgroundColor: '#40E0D0', color: '#006400', borderColor: '#2E8B57' }}>
                                    {getRoleDisplay(employee.role)}
                                  </Badge>
                                </div>
                              </div>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <EmployeeManagement />
          )}
        </TabsContent>

        {canViewEmployeeOverview && (
          <TabsContent value="employee-overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Employee Overview
                </CardTitle>
                <CardDescription>View all employees and their project assignments with workload capacity</CardDescription>
              </CardHeader>
              <CardContent>
                <EmployeeOverview />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Dialogs */}
      <ProjectCreateDialog
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        onSubmit={handleCreateProject}
        formData={projectForm}
        setFormData={setProjectForm}
      />

      <InitiativeCreateDialog
        isOpen={showCreateInitiative}
        onClose={() => setShowCreateInitiative(false)}
        onSubmit={handleCreateInitiative}
        formData={initiativeForm}
        setFormData={setInitiativeForm}
      />

      <ExportSystem 
        isOpen={showExportSystem} 
        onClose={() => setShowExportSystem(false)} 
      />

      <ProjectDetails
        projectId={selectedProjectId}
        isOpen={!!selectedProjectId}
        onClose={() => setSelectedProjectId(null)}
      />
    </div>
  )
}