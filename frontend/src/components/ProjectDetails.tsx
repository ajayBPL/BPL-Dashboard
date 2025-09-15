import React, { useState, useEffect, useMemo } from 'react'
import { centralizedDb, CentralizedProject } from '../utils/centralizedDb'
import { useAuth } from '../contexts/AuthContext'
import { ProgressEditor } from './ProgressEditor'
import { ProjectEditDialog } from './project/ProjectEditDialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Textarea } from './ui/textarea'
import { Alert, AlertDescription } from './ui/alert'
import { 
  Users, 
  Plus, 
  Minus, 
  Calendar, 
  Target, 
  TrendingUp, 
  MessageSquare, 
  Edit, 
  Save,
  X,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  Paperclip,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface ProjectDetailsProps {
  projectId: string | null
  isOpen: boolean
  onClose: () => void
}

export function ProjectDetails({ projectId, isOpen, onClose }: ProjectDetailsProps) {
  const { user: currentUser } = useAuth()
  const [project, setProject] = useState<CentralizedProject | null>(null)
  const [loading, setLoading] = useState(false)
  const [showAssignEmployee, setShowAssignEmployee] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState<string | null>(null)
  const [newComment, setNewComment] = useState('')
  const [showProgressEditor, setShowProgressEditor] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)

  // Assignment form state
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('')
  const [involvementPercentage, setInvolvementPercentage] = useState(20)
  const [employeeRole, setEmployeeRole] = useState('')
  const [allEmployees, setAllEmployees] = useState<CentralizedUser[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])

  // Fetch employees and projects from backend API
  const fetchEmployeesAndProjects = async () => {
    try {
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        console.error('No authentication token found')
        return
      }

      // Fetch employees
      const usersResponse = await fetch('http://192.168.10.205:3001/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        if (usersData.success && usersData.data) {
          // Convert API response to match the expected format
          const usersDataFormatted = usersData.data.map((user: any) => ({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            designation: user.designation,
            managerId: user.managerId,
            department: user.department,
            skills: user.skills || [],
            workloadCap: user.workloadCap,
            overBeyondCap: user.overBeyondCap,
            phoneNumber: user.phoneNumber,
            timezone: user.timezone,
            preferredCurrency: user.preferredCurrency,
            notificationSettings: user.notificationSettings,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastLoginAt: user.lastLoginAt
          }))
          
          // Filter to only employees and managers
          const employees = usersDataFormatted.filter((user: CentralizedUser) => 
            user.role === 'employee' || user.role === 'manager'
          )
          setAllEmployees(employees)
        }
      }

      // Fetch projects
      const projectsResponse = await fetch('http://192.168.10.205:3001/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        if (projectsData.success && projectsData.data) {
          setAllProjects(projectsData.data)
        }
      }
    } catch (error) {
      console.error('Error fetching employees and projects:', error)
      // Fallback to centralizedDb if API fails
      const fallbackEmployees = centralizedDb.getUsers().filter(user => 
        user.role === 'employee' || user.role === 'manager'
      )
      setAllEmployees(fallbackEmployees)
      setAllProjects(centralizedDb.getProjects())
    }
  }

  const availableEmployees = React.useMemo(() => {
    if (!project?.requiredSkills || project.requiredSkills.length === 0) {
      return allEmployees
    }

    // Separate employees with matching skills from those without
    const employeesWithMatchingSkills: typeof allEmployees = []
    const employeesWithoutMatchingSkills: typeof allEmployees = []

    allEmployees.forEach(employee => {
      const matchingSkills = employee.skills.filter(skill => 
        project.requiredSkills.includes(skill)
      )
      
      if (matchingSkills.length > 0) {
        employeesWithMatchingSkills.push({
          ...employee,
          matchingSkillsCount: matchingSkills.length,
          matchingSkills: matchingSkills
        })
      } else {
        employeesWithoutMatchingSkills.push(employee)
      }
    })

    // Sort employees with matching skills by number of matches (descending)
    employeesWithMatchingSkills.sort((a, b) => 
      (b.matchingSkillsCount || 0) - (a.matchingSkillsCount || 0)
    )

    // Return employees with matching skills first, then others
    return [...employeesWithMatchingSkills, ...employeesWithoutMatchingSkills]
  }, [allEmployees, project?.requiredSkills])

  const assignedEmployees = project ? project.assignedEmployees.map(assignment => {
    // First try to get employee from allEmployees (backend data)
    let employee = allEmployees.find(emp => emp.id === assignment.employeeId)
    
    // Fallback to centralizedDb if not found in allEmployees
    if (!employee) {
      employee = centralizedDb.getUserById(assignment.employeeId)
    }
    
    // Calculate workload based on backend data
    const calculateWorkloadFromBackend = (employeeId: string) => {
      // Use backend projects data if available, otherwise fallback to centralizedDb
      const projectsToUse = allProjects.length > 0 ? allProjects : centralizedDb.getProjects()
      const allInitiatives = centralizedDb.getInitiatives()
      
      // Calculate project workload from all active projects
      const projectWorkload = projectsToUse
        .filter((p: any) => p.status === 'ACTIVE' || p.status === 'active')
        .reduce((total: number, project: any) => {
          // Handle both backend format (assignments) and frontend format (assignedEmployees)
          const assignments = project.assignments || project.assignedEmployees || []
          const assignment = assignments.find((emp: any) => emp.employeeId === employeeId)
          return total + (assignment?.involvementPercentage || 0)
        }, 0)
      
      // Calculate over & beyond workload from initiatives
      const overBeyondWorkload = allInitiatives
        .filter(i => i.assignedTo === employeeId && i.status === 'active')
        .reduce((total, initiative) => total + initiative.workloadPercentage, 0)
      
      const totalWorkload = projectWorkload + overBeyondWorkload
      const workloadCap = employee?.workloadCap || 100
      const overBeyondCap = employee?.overBeyondCap || 20
      
      return {
        projectWorkload,
        overBeyondWorkload,
        totalWorkload,
        availableCapacity: Math.max(0, workloadCap - projectWorkload),
        overBeyondAvailable: Math.max(0, overBeyondCap - overBeyondWorkload)
      }
    }
    
    const workload = calculateWorkloadFromBackend(assignment.employeeId)
    return {
      ...assignment,
      employee,
      workload
    }
  }) : []

  const comments = project ? centralizedDb.getCommentsByProject(project.id) : []

  useEffect(() => {
    if (projectId && isOpen) {
      fetchProjectDetails()
      fetchEmployeesAndProjects() // Fetch employees and projects when opening project details
    }
  }, [projectId, isOpen])

  const fetchProjectDetails = async () => {
    if (!projectId) return
    
    setLoading(true)
    try {
      // First try to fetch from backend API
      const token = localStorage.getItem('bpl-token')
      if (token) {
        try {
          const response = await fetch(`http://192.168.10.205:3001/api/projects/${projectId}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          })

          if (response.ok) {
            const projectData = await response.json()
            if (projectData.success && projectData.data) {
              // Convert backend project to frontend format
              const backendProject = {
                id: projectData.data.id,
                title: projectData.data.title,
                description: projectData.data.description,
                projectDetails: projectData.data.description || '',
                managerId: projectData.data.managerId,
                timeline: projectData.data.timeline,
                status: projectData.data.status?.toLowerCase() || 'pending',
                priority: projectData.data.priority?.toLowerCase() || 'medium',
                category: 'standard',
                assignedEmployees: projectData.data.assignments || [],
                milestones: projectData.data.milestones || [],
                tags: projectData.data.tags || [],
                requiredSkills: [],
                estimatedHours: projectData.data.estimatedHours,
                budget: projectData.data.budgetAmount ? {
                  amount: projectData.data.budgetAmount,
                  currency: projectData.data.budgetCurrency || 'USD',
                  allocatedAt: projectData.data.createdAt,
                  allocatedBy: projectData.data.managerId,
                  notes: 'Initial budget allocation'
                } : undefined,
                createdAt: projectData.data.createdAt,
                updatedAt: projectData.data.updatedAt,
                version: projectData.data.version || 1,
                discussionCount: projectData.data.comments?.length || 0,
                lastActivity: projectData.data.updatedAt
              }
              setProject(backendProject)
              return
            }
          }
        } catch (apiError) {
          console.error('Error fetching project from API:', apiError)
          // Fallback to centralizedDb
        }
      }
      
      // Fallback to centralizedDb if API fails
      const projectData = centralizedDb.getProjectById(projectId)
      setProject(projectData || null)
    } catch (error) {
      console.error('Error fetching project details:', error)
      toast.error('Failed to load project details')
    } finally {
      setLoading(false)
    }
  }

  const handleAssignEmployee = async () => {
    if (!project || !selectedEmployeeId || !employeeRole) {
      toast.error('Please fill in all required fields')
      return
    }

    // Check if employee is already assigned
    const isAlreadyAssigned = project.assignedEmployees.some(
      assignment => assignment.employeeId === selectedEmployeeId
    )

    if (isAlreadyAssigned) {
      toast.error('This employee is already assigned to the project')
      return
    }

    // Check employee workload capacity
    const employeeWorkload = centralizedDb.getEmployeeWorkload(selectedEmployeeId)
    if (employeeWorkload.availableCapacity < involvementPercentage) {
      toast.error(`Employee only has ${employeeWorkload.availableCapacity.toFixed(1)}% available capacity`)
      return
    }

    const success = centralizedDb.assignEmployeeToProject(project.id, {
      employeeId: selectedEmployeeId,
      involvementPercentage,
      role: employeeRole
    })

    if (success) {
      toast.success('Employee assigned successfully!')
      fetchProjectDetails()
      setShowAssignEmployee(false)
      setSelectedEmployeeId('')
      setInvolvementPercentage(20)
      setEmployeeRole('')
    } else {
      toast.error('Failed to assign employee')
    }
  }

  const handleRemoveEmployee = async (employeeId: string) => {
    if (!project) return

    const success = centralizedDb.removeEmployeeFromProject(project.id, employeeId)
    if (success) {
      toast.success('Employee removed from project')
      fetchProjectDetails()
    } else {
      toast.error('Failed to remove employee')
    }
  }

  const handleUpdateAssignment = async (employeeId: string, updates: { involvementPercentage?: number, role?: string }) => {
    if (!project) return

    const assignment = project.assignedEmployees.find(a => a.employeeId === employeeId)
    if (!assignment) return

    // Check workload if updating percentage
    if (updates.involvementPercentage && updates.involvementPercentage !== assignment.involvementPercentage) {
      const employeeWorkload = centralizedDb.getEmployeeWorkload(employeeId)
      const currentProjectWorkload = assignment.involvementPercentage
      const availableCapacity = employeeWorkload.availableCapacity + currentProjectWorkload
      
      if (updates.involvementPercentage > availableCapacity) {
        toast.error(`Cannot increase involvement. Available capacity: ${availableCapacity.toFixed(1)}%`)
        return
      }
    }

    const success = centralizedDb.assignEmployeeToProject(project.id, {
      employeeId,
      involvementPercentage: updates.involvementPercentage || assignment.involvementPercentage,
      role: updates.role || assignment.role
    })

    if (success) {
      toast.success('Assignment updated successfully!')
      fetchProjectDetails()
      setEditingAssignment(null)
    } else {
      toast.error('Failed to update assignment')
    }
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      const fileArray = Array.from(files)
      const validFiles = fileArray.filter(file => {
        const validTypes = [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'image/jpeg',
          'image/jpg', 
          'image/png',
          'image/gif',
          'text/plain',
          'text/javascript',
          'text/css',
          'text/html',
          'application/json',
          'text/xml'
        ]
        const isValidType = validTypes.includes(file.type) || 
          file.name.match(/\.(py|js|jsx|ts|tsx|java|cpp|c|php|rb|go|rs|swift)$/)
        
        const isValidSize = file.size <= 10 * 1024 * 1024 // 10MB limit
        
        if (!isValidType) {
          toast.error(`File ${file.name} is not a supported type`)
          return false
        }
        if (!isValidSize) {
          toast.error(`File ${file.name} is too large (max 10MB)`)
          return false
        }
        return true
      })
      
      setAttachedFiles(prev => [...prev, ...validFiles])
      event.target.value = '' // Clear input
    }
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (file: File) => {
    if (file.type.includes('pdf')) return '📄'
    if (file.type.includes('word') || file.name.endsWith('.docx') || file.name.endsWith('.doc')) return '📝'
    if (file.type.includes('image')) return '🖼️'
    if (file.type.includes('text') || file.name.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|php|rb|go|rs|swift|html|css|xml|json)$/)) return '💻'
    return '📎'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const handleAddComment = async () => {
    if ((!newComment.trim() && attachedFiles.length === 0) || !project || !currentUser) return

    try {
      setUploading(true)
      
      // Simulate file uploads (in real app, upload to storage service)
      const fileAttachments = attachedFiles.map(file => ({
        name: file.name,
        size: file.size,
        type: file.type,
        url: `#demo-file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        uploadedAt: new Date().toISOString()
      }))

      centralizedDb.addComment({
        projectId: project.id,
        userId: currentUser.id,
        comment: newComment.trim() || (fileAttachments.length > 0 ? `Shared ${fileAttachments.length} file(s)` : ''),
        attachments: fileAttachments
      })

      setNewComment('')
      setAttachedFiles([])
      toast.success(`Comment ${fileAttachments.length > 0 ? 'with attachments' : ''} added successfully!`)
      fetchProjectDetails()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setUploading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'on-hold': return 'bg-yellow-100 text-yellow-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const completedMilestones = project?.milestones.filter(m => m.completed).length || 0
  const totalMilestones = project?.milestones.length || 0
  const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

  const totalInvolvement = assignedEmployees.reduce((sum, emp) => sum + emp.involvementPercentage, 0)
  const canManageProject = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'program_manager' || 
    currentUser.id === project?.managerId
  )

  const canEditProgress = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'program_manager'
  )

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Loading Project Details</DialogTitle>
            <DialogDescription>Please wait while we load the project information.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!project) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Project Not Found</DialogTitle>
            <DialogDescription>The requested project could not be loaded. Please try again or contact support.</DialogDescription>
          </DialogHeader>
          <div className="text-center py-12">
            <h3>Project Not Found</h3>
            <p className="text-muted-foreground">The requested project could not be loaded.</p>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  {project.title}
                </DialogTitle>
                <DialogDescription className="flex items-center gap-2">
                  <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
                  <Badge className={getPriorityColor(project.priority)}>{project.priority}</Badge>
                  <span>•</span>
                  <span>{project.timeline}</span>
                </DialogDescription>
              </div>
              {canManageProject && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditDialog(true)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Project
                </Button>
              )}
            </div>
          </DialogHeader>

          <Tabs defaultValue="overview" className="mt-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="employees">Team ({assignedEmployees.length})</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
              <TabsTrigger value="discussion">Discussion</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Team Size</p>
                        <p className="text-2xl font-bold">{assignedEmployees.length}</p>
                      </div>
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Progress</p>
                        <p className="text-2xl font-bold">{progressPercentage.toFixed(1)}%</p>
                        {canEditProgress && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setShowProgressEditor(true)}
                            className="mt-2"
                          >
                            <Edit className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        )}
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Involvement</p>
                        <p className="text-2xl font-bold">{totalInvolvement}%</p>
                      </div>
                      <Target className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Description</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{project.description}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {project.tags.map((tag) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Project Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Created:</span>
                      <span>{new Date(project.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Last Updated:</span>
                      <span>{new Date(project.updatedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version:</span>
                      <span>v{project.version}</span>
                    </div>
                    {project.budget && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Budget:</span>
                        <span>${project.budget.toLocaleString()}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Time Tracking</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {project.estimatedHours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estimated Hours:</span>
                        <span>{project.estimatedHours}h</span>
                      </div>
                    )}
                    {project.actualHours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Actual Hours:</span>
                        <span>{project.actualHours}h</span>
                      </div>
                    )}
                    {project.estimatedHours && project.actualHours && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time Efficiency:</span>
                        <span className={project.actualHours <= project.estimatedHours ? 'text-green-600' : 'text-red-600'}>
                          {((project.estimatedHours / project.actualHours) * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="employees" className="space-y-6">
              <div className="flex justify-between items-center">
                <h3>Assigned Team Members</h3>
                {canManageProject && (
                  <Button onClick={() => setShowAssignEmployee(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Assign Employee
                  </Button>
                )}
              </div>

              <div className="space-y-4">
                {assignedEmployees.map((assignment) => (
                  <Card key={assignment.employeeId}>
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar>
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {assignment.employee?.name.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <h4 className="font-medium">{assignment.employee?.name || 'Unknown'}</h4>
                            <p className="text-sm text-muted-foreground">{assignment.employee?.designation}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="outline">{assignment.role}</Badge>
                              <Badge variant="secondary">{assignment.involvementPercentage}% involvement</Badge>
                            </div>
                            <div className="mt-3 text-sm text-muted-foreground">
                              <p>Total Workload: {assignment.workload.totalWorkload.toFixed(1)}%</p>
                              <p>Available: {assignment.workload.availableCapacity.toFixed(1)}%</p>
                            </div>
                          </div>
                        </div>
                        
                        {canManageProject && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingAssignment(assignment.employeeId)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveEmployee(assignment.employeeId)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>

                      {editingAssignment === assignment.employeeId && (
                        <div className="mt-4 p-4 border rounded-lg bg-muted/50">
                          <div className="space-y-3">
                            <div>
                              <Label>Role</Label>
                              <Input
                                defaultValue={assignment.role}
                                id={`role-${assignment.employeeId}`}
                              />
                            </div>
                            <div>
                              <Label>Involvement Percentage</Label>
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                defaultValue={assignment.involvementPercentage}
                                id={`involvement-${assignment.employeeId}`}
                              />
                            </div>
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingAssignment(null)}
                              >
                                Cancel
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => {
                                  const roleInput = document.getElementById(`role-${assignment.employeeId}`) as HTMLInputElement
                                  const involvementInput = document.getElementById(`involvement-${assignment.employeeId}`) as HTMLInputElement
                                  handleUpdateAssignment(assignment.employeeId, {
                                    role: roleInput.value,
                                    involvementPercentage: parseInt(involvementInput.value)
                                  })
                                }}
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Save
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}

                {assignedEmployees.length === 0 && (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3>No Team Members Assigned</h3>
                      <p className="text-muted-foreground mb-4">
                        This project doesn't have any team members assigned yet.
                      </p>
                      {canManageProject && (
                        <Button onClick={() => setShowAssignEmployee(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Assign First Employee
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>

            <TabsContent value="progress" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle className="text-base">Project Milestones</CardTitle>
                      <CardDescription>
                        {completedMilestones} of {totalMilestones} milestones completed
                      </CardDescription>
                    </div>
                    {canEditProgress && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => setShowProgressEditor(true)}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Progress
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Overall Progress:</span>
                    <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
                  </div>
                  <Progress value={progressPercentage} className="mb-6" />
                  
                  <div className="space-y-4">
                    {project.milestones.map((milestone) => (
                      <div key={milestone.id} className="flex items-start space-x-3">
                        <div className="mt-1">
                          {milestone.completed ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-muted-foreground" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className={`font-medium ${milestone.completed ? 'text-muted-foreground line-through' : ''}`}>
                              {milestone.title}
                            </h4>
                            <div className="text-sm text-muted-foreground">
                              Due: {new Date(milestone.dueDate).toLocaleDateString()}
                            </div>
                          </div>
                          <p className={`text-sm mt-1 ${milestone.completed ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
                            {milestone.description}
                          </p>
                          {milestone.completed && milestone.completedAt && (
                            <p className="text-xs text-green-600 mt-1">
                              Completed: {new Date(milestone.completedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}

                    {project.milestones.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3>No Milestones Defined</h3>
                        <p className="text-muted-foreground">
                          This project doesn't have any milestones set up yet.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="discussion" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Project Discussion</CardTitle>
                  <CardDescription>
                    Collaborate with your team members on this project
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-4">
                    {comments.map((comment) => {
                      const commenter = centralizedDb.getUserById(comment.userId)
                      return (
                        <div key={comment.id} className="flex space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {commenter?.name.charAt(0) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium">{commenter?.name || 'Unknown'}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-sm">{comment.comment}</p>
                            
                            {/* File Attachments */}
                            {comment.attachments && comment.attachments.length > 0 && (
                              <div className="mt-2 space-y-2">
                                <Label className="text-xs text-muted-foreground">Attachments:</Label>
                                <div className="space-y-1">
                                  {comment.attachments.map((attachment, index) => (
                                    <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                                      <span className="text-sm">
                                        {attachment.type?.includes('pdf') ? '📄' :
                                         attachment.type?.includes('word') || attachment.name?.endsWith('.docx') ? '📝' :
                                         attachment.type?.includes('image') ? '🖼️' :
                                         attachment.name?.match(/\.(js|jsx|ts|tsx|py|java|cpp|c|php|rb|go|rs|swift|html|css|xml|json)$/) ? '💻' :
                                         '📎'}
                                      </span>
                                      <span className="text-sm font-medium">{attachment.name}</span>
                                      <span className="text-xs text-muted-foreground">
                                        {attachment.size ? formatFileSize(attachment.size) : ''}
                                      </span>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => {
                                          // In a real app, this would download the file
                                          toast.info(`Would download: ${attachment.name}`)
                                        }}
                                      >
                                        Download
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {comments.length === 0 && (
                      <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3>No Comments Yet</h3>
                        <p className="text-muted-foreground">
                          Start the conversation about this project.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="border-t pt-4">
                    <div className="space-y-3">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={3}
                      />
                      
                      {/* File Attachments */}
                      {attachedFiles.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Attached Files:</Label>
                          <div className="space-y-2">
                            {attachedFiles.map((file, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-md">
                                <div className="flex items-center space-x-2">
                                  <span className="text-lg">{getFileIcon(file)}</span>
                                  <div>
                                    <p className="text-sm font-medium">{file.name}</p>
                                    <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                                  </div>
                                </div>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFile(index)}
                                  className="h-6 w-6 p-0"
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <input
                            type="file"
                            id="file-upload"
                            multiple
                            onChange={handleFileSelect}
                            className="hidden"
                            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.txt,.js,.jsx,.ts,.tsx,.py,.java,.cpp,.c,.php,.rb,.go,.rs,.swift,.html,.css,.xml,.json"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('file-upload')?.click()}
                          >
                            <Paperclip className="h-4 w-4 mr-2" />
                            Attach Files
                          </Button>
                          <span className="text-xs text-muted-foreground">
                            PDF, Word, Images, Code files (max 10MB each)
                          </span>
                        </div>
                        
                        <Button 
                          onClick={handleAddComment} 
                          disabled={(!newComment.trim() && attachedFiles.length === 0) || uploading}
                          size="sm"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              {attachedFiles.length > 0 ? `Add Comment (${attachedFiles.length} files)` : 'Add Comment'}
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Assign Employee Dialog */}
      <Dialog open={showAssignEmployee} onOpenChange={setShowAssignEmployee}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Employee to Project</DialogTitle>
            <DialogDescription>
              Select an employee and define their role and involvement in this project
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {project?.requiredSkills && project.requiredSkills.length > 0 && (
              <div className="p-3 bg-muted rounded-lg">
                <Label className="text-sm font-medium">Required Skills for this Project:</Label>
                <div className="flex flex-wrap gap-1 mt-2">
                  {project.requiredSkills.map((skill, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            <div>
              <Label htmlFor="employee-select">Employee</Label>
              <Select value={selectedEmployeeId} onValueChange={setSelectedEmployeeId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an employee" />
                </SelectTrigger>
                <SelectContent>
                  {availableEmployees
                    .filter(emp => !project?.assignedEmployees.some(a => a.employeeId === emp.id))
                    .map((employee: any) => {
                      const workload = centralizedDb.getEmployeeWorkload(employee.id)
                      const hasMatchingSkills = employee.matchingSkills && employee.matchingSkills.length > 0
                      
                      return (
                        <SelectItem key={employee.id} value={employee.id}>
                          <div className="flex flex-col w-full">
                            <div className="flex items-center justify-between">
                              <span className={hasMatchingSkills ? 'font-medium' : ''}>{employee.name}</span>
                              {hasMatchingSkills && (
                                <Badge variant="secondary" className="ml-2 text-xs">
                                  ✓ {employee.matchingSkills.length} skill{employee.matchingSkills.length > 1 ? 's' : ''} match
                                </Badge>
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Available: {workload.availableCapacity.toFixed(1)}%
                            </span>
                            {hasMatchingSkills && (
                              <span className="text-xs text-green-600">
                                Skills: {employee.matchingSkills.join(', ')}
                              </span>
                            )}
                          </div>
                        </SelectItem>
                      )
                    })}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="employee-role">Role in Project</Label>
              <Input
                id="employee-role"
                value={employeeRole}
                onChange={(e) => setEmployeeRole(e.target.value)}
                placeholder="e.g., Frontend Developer, Designer, QA Engineer"
              />
            </div>

            <div>
              <Label htmlFor="involvement">Involvement Percentage ({involvementPercentage}%)</Label>
              <input
                id="involvement"
                type="range"
                min="5"
                max="100"
                step="5"
                value={involvementPercentage}
                onChange={(e) => setInvolvementPercentage(parseInt(e.target.value))}
                className="w-full mt-2"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>5%</span>
                <span>50%</span>
                <span>100%</span>
              </div>
            </div>

            {selectedEmployeeId && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  This employee currently has {centralizedDb.getEmployeeWorkload(selectedEmployeeId).availableCapacity.toFixed(1)}% available capacity.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setShowAssignEmployee(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignEmployee}
                disabled={!selectedEmployeeId || !employeeRole}
              >
                Assign Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Editor Dialog */}
      {showProgressEditor && project && (
        <ProgressEditor 
          project={project}
          isOpen={showProgressEditor}
          onClose={() => setShowProgressEditor(false)}
          onProjectUpdate={(updatedProject) => {
            setProject(updatedProject)
            fetchProjectDetails()
          }}
        />
      )}

      <ProjectEditDialog
        project={project}
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        onProjectUpdated={() => {
          fetchProjectDetails() // Refresh the project data
        }}
      />
    </>
  )
}