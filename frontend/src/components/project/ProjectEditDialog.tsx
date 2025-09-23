import React, { useState, useEffect } from 'react'
import { centralizedDb, CentralizedProject, ProjectChange } from '../../utils/centralizedDb'
import { useAuth } from '../../contexts/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback } from '../ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { Alert, AlertDescription } from '../ui/alert'
import { 
  Edit, 
  Save, 
  X, 
  History, 
  Calendar, 
  FileText, 
  AlertTriangle,
  Clock,
  User,
  Info,
  CheckCircle
} from 'lucide-react'
import { toast } from 'sonner'

interface ProjectEditDialogProps {
  project: CentralizedProject | null
  isOpen: boolean
  onClose: () => void
  onProjectUpdated: () => void
}

interface EditForm {
  title: string
  description: string
  projectDetails: string
  timeline: string
  status: 'pending' | 'active' | 'completed' | 'on-hold' | 'cancelled'
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedHours: string
  reason: string
}

export function ProjectEditDialog({ project, isOpen, onClose, onProjectUpdated }: ProjectEditDialogProps) {
  const { user: currentUser } = useAuth()
  const [formData, setFormData] = useState<EditForm>({
    title: '',
    description: '',
    projectDetails: '',
    timeline: '',
    status: 'pending',
    priority: 'medium',
    estimatedHours: '',
    reason: ''
  })
  const [changeHistory, setChangeHistory] = useState<ProjectChange[]>([])
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Check permissions
  const canEditProject = currentUser && project && (
    currentUser.role === 'admin' ||
    currentUser.role === 'program_manager' ||
    currentUser.id === project.managerId
  )

  useEffect(() => {
    if (project) {
      setFormData({
        title: project.title,
        description: project.description,
        projectDetails: project.projectDetails || '',
        timeline: project.timeline,
        status: project.status,
        priority: project.priority,
        estimatedHours: project.estimatedHours?.toString() || '',
        reason: ''
      })
      
      // Load change history
      const history = centralizedDb.getProjectChangeHistory(project.id)
      setChangeHistory(history.reverse()) // Show most recent first
      setErrors({})
    }
  }, [project])

  const updateField = (field: keyof EditForm, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required'
    }

    if (!formData.projectDetails.trim()) {
      newErrors.projectDetails = 'Project details are required'
    }

    if (!formData.timeline.trim()) {
      newErrors.timeline = 'Project timeline is required'
    }

    if (formData.estimatedHours && isNaN(Number(formData.estimatedHours))) {
      newErrors.estimatedHours = 'Estimated hours must be a valid number'
    }

    // Check if any changes were made
    if (project) {
      const hasChanges = 
        formData.title !== project.title ||
        formData.description !== project.description ||
        formData.projectDetails !== (project.projectDetails || '') ||
        formData.timeline !== project.timeline ||
        formData.status !== project.status ||
        formData.priority !== project.priority ||
        formData.estimatedHours !== (project.estimatedHours?.toString() || '')

      if (hasChanges && !formData.reason.trim()) {
        newErrors.reason = 'Please provide a reason for the changes'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project || !currentUser || !canEditProject) return

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting')
      return
    }

    try {
      setLoading(true)

      const updates: Partial<CentralizedProject> = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        projectDetails: formData.projectDetails.trim(),
        timeline: formData.timeline.trim(),
        status: formData.status,
        priority: formData.priority,
        estimatedHours: formData.estimatedHours ? parseInt(formData.estimatedHours) : undefined,
        updatedAt: new Date().toISOString()
      }

      const updatedProject = centralizedDb.updateProjectWithTracking(
        project.id,
        updates,
        currentUser.id,
        formData.reason.trim()
      )

      if (updatedProject) {
        toast.success('Project updated successfully!')
        onProjectUpdated()
        onClose()
      } else {
        toast.error('Failed to update project')
      }
    } catch (error) {
      console.error('Error updating project:', error)
      toast.error('Failed to update project')
    } finally {
      setLoading(false)
    }
  }

  const getChangeTypeIcon = (changeType: ProjectChange['changeType']) => {
    switch (changeType) {
      case 'timeline':
        return <Calendar className="h-4 w-4 text-blue-600" />
      case 'details':
      case 'description':
        return <FileText className="h-4 w-4 text-green-600" />
      case 'status':
        return <CheckCircle className="h-4 w-4 text-purple-600" />
      case 'priority':
        return <AlertTriangle className="h-4 w-4 text-orange-600" />
      default:
        return <Edit className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeTypeColor = (changeType: ProjectChange['changeType']) => {
    switch (changeType) {
      case 'timeline':
        return 'bg-blue-100 text-blue-800'
      case 'details':
      case 'description':
        return 'bg-green-100 text-green-800'
      case 'status':
        return 'bg-purple-100 text-purple-800'
      case 'priority':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatFieldName = (fieldName: string) => {
    switch (fieldName) {
      case 'projectDetails':
        return 'Project Details'
      case 'estimatedHours':
        return 'Estimated Hours'
      default:
        return fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
    }
  }

  if (!project) return null

  if (!canEditProject) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Access Denied
            </DialogTitle>
          </DialogHeader>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              You don't have permission to edit this project. Only the project manager, program managers, and administrators can make changes.
            </AlertDescription>
          </Alert>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Project: {project.title}
          </DialogTitle>
          <DialogDescription>
            Make changes to project details. All changes will be tracked and logged.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="edit" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="edit">Edit Project</TabsTrigger>
            <TabsTrigger value="history">Change History ({changeHistory.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Basic Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Basic Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="title">Project Title *</Label>
                      <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => updateField('title', e.target.value)}
                        placeholder="Enter project title"
                        className={errors.title ? 'border-red-500' : ''}
                      />
                      {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="timeline">Timeline *</Label>
                      <Input
                        id="timeline"
                        value={formData.timeline}
                        onChange={(e) => updateField('timeline', e.target.value)}
                        placeholder="e.g., Q1 2024, 3 months, etc."
                        className={errors.timeline ? 'border-red-500' : ''}
                      />
                      {errors.timeline && <p className="text-sm text-red-500">{errors.timeline}</p>}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Textarea
                      id="description"
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      placeholder="Brief project description"
                      rows={3}
                      className={errors.description ? 'border-red-500' : ''}
                    />
                    {errors.description && <p className="text-sm text-red-500">{errors.description}</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-details">Project Details *</Label>
                    <Textarea
                      id="project-details"
                      value={formData.projectDetails}
                      onChange={(e) => updateField('projectDetails', e.target.value)}
                      placeholder="Comprehensive project details including technical requirements"
                      rows={4}
                      className={errors.projectDetails ? 'border-red-500' : ''}
                    />
                    {errors.projectDetails && <p className="text-sm text-red-500">{errors.projectDetails}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Status and Priority */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Status & Priority</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => updateField('status', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="on-hold">On Hold</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority">Priority</Label>
                      <Select value={formData.priority} onValueChange={(value: any) => updateField('priority', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="estimated-hours">Estimated Hours</Label>
                      <Input
                        id="estimated-hours"
                        type="number"
                        value={formData.estimatedHours}
                        onChange={(e) => updateField('estimatedHours', e.target.value)}
                        placeholder="Hours"
                        className={errors.estimatedHours ? 'border-red-500' : ''}
                      />
                      {errors.estimatedHours && <p className="text-sm text-red-500">{errors.estimatedHours}</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Change Reason */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Change Reason</CardTitle>
                  <CardDescription>
                    Please provide a reason for these changes. This will be logged for transparency.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="reason">Reason for Changes *</Label>
                    <Textarea
                      id="reason"
                      value={formData.reason}
                      onChange={(e) => updateField('reason', e.target.value)}
                      placeholder="Explain why these changes are being made..."
                      rows={3}
                      className={errors.reason ? 'border-red-500' : ''}
                    />
                    {errors.reason && <p className="text-sm text-red-500">{errors.reason}</p>}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex justify-end space-x-2 pt-4 border-t">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Project Change History
                </CardTitle>
                <CardDescription>
                  Complete history of all changes made to this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                {changeHistory.length > 0 ? (
                  <div className="space-y-4">
                    {changeHistory.map((change, index) => {
                      const changer = centralizedDb.getUserById(change.changedBy)
                      return (
                        <Card key={change.id} className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="mt-1">
                              {getChangeTypeIcon(change.changeType)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge className={getChangeTypeColor(change.changeType)}>
                                  {change.changeType}
                                </Badge>
                                <span className="font-medium">{formatFieldName(change.fieldName)}</span>
                                <span className="text-sm text-muted-foreground">
                                  {new Date(change.changedAt).toLocaleString()}
                                </span>
                              </div>
                              
                              <div className="space-y-1 text-sm">
                                <div>
                                  <span className="text-muted-foreground">From: </span>
                                  <span className="bg-red-50 text-red-800 px-1 rounded">
                                    {change.oldValue || '(empty)'}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-muted-foreground">To: </span>
                                  <span className="bg-green-50 text-green-800 px-1 rounded">
                                    {change.newValue || '(empty)'}
                                  </span>
                                </div>
                                {change.reason && (
                                  <div>
                                    <span className="text-muted-foreground">Reason: </span>
                                    <span className="italic">{change.reason}</span>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex items-center gap-2 mt-2">
                                <Avatar className="h-6 w-6">
                                  <AvatarFallback className="text-xs">
                                    {changer?.name.charAt(0) || '?'}
                                  </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-muted-foreground">
                                  {changer?.name || 'Unknown User'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3>No Changes Yet</h3>
                    <p className="text-muted-foreground">
                      No changes have been made to this project since it was created.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
