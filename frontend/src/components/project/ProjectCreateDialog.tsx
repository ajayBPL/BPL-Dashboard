import React, { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Badge } from '../ui/badge'
import { CalendarIcon } from 'lucide-react'
import { Alert, AlertDescription } from '../ui/alert'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '../ui/utils'
import { format } from 'date-fns'

interface ProjectForm {
  title: string
  description: string
  projectDetails: string
  timelineDate: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  tags: string[]
  requiredSkills: string[]
  category?: 'ECR' | 'ECN' | 'NPD' | 'SUST' | string
}

interface ProjectCreateDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (e: React.FormEvent) => void
  formData: ProjectForm
  setFormData: (data: ProjectForm) => void
  loading?: boolean
}

export function ProjectCreateDialog({
  isOpen,
  onClose,
  onSubmit,
  formData,
  setFormData,
  loading = false
}: ProjectCreateDialogProps) {
  const [newTag, setNewTag] = useState('')
  const [newSkill, setNewSkill] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [customCategory, setCustomCategory] = useState('')
  const [showCustomInput, setShowCustomInput] = useState(false)
  const [customCategories, setCustomCategories] = useState<string[]>([])

  const updateField = (field: keyof ProjectForm, value: string | string[]) => {
    setFormData({ ...formData, [field]: value })
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  const handleAddCustomCategory = () => {
    if (customCategory.trim() && !customCategories.includes(customCategory.trim())) {
      const newCategory = customCategory.trim()
      setCustomCategories([...customCategories, newCategory])
      setFormData({ ...formData, category: newCategory })
      setCustomCategory('')
      setShowCustomInput(false)
    }
  }

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required'
    } else if (formData.title.length > 100) {
      newErrors.title = 'Project title must be less than 100 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Project description is required'
    } else if (formData.description.length < 20) {
      newErrors.description = 'Please provide a more detailed description (minimum 20 characters)'
    }

    if (!formData.projectDetails.trim()) {
      newErrors.projectDetails = 'Project details are required'
    } else if (formData.projectDetails.length < 50) {
      newErrors.projectDetails = 'Please provide comprehensive project details (minimum 50 characters)'
    }



    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(e)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim()) && formData.tags.length < 10) {
      updateField('tags', [...formData.tags, newTag.trim()])
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    updateField('tags', formData.tags.filter(tag => tag !== tagToRemove))
  }

  const addSkill = () => {
    if (newSkill.trim() && !formData.requiredSkills.includes(newSkill.trim()) && formData.requiredSkills.length < 15) {
      updateField('requiredSkills', [...formData.requiredSkills, newSkill.trim()])
      setNewSkill('')
    }
  }

  const removeSkill = (skillToRemove: string) => {
    updateField('requiredSkills', formData.requiredSkills.filter(skill => skill !== skillToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag()
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
      case 'high': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
      default: return 'bg-muted text-muted-foreground'
    }
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Create New Project
          </DialogTitle>
          <DialogDescription>
            Set up a new project with timeline, budget, and requirements. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-title" className="flex items-center gap-1">
                  Project Title *
                </Label>
                <Input
                  id="project-title"
                  value={formData.title}
                  onChange={(e) => updateField('title', e.target.value)}
                  placeholder="Enter project title"
                  className={errors.title ? 'border-destructive' : ''}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-sm text-destructive">{errors.title}</p>
                )}
                <p className="text-xs text-muted-foreground">
                  {formData.title.length}/100 characters
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-timeline-date" className="flex items-center gap-1">
                  <CalendarIcon className="h-4 w-4" />
                  Project Deadline
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !formData.timelineDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {formData.timelineDate ? format(new Date(formData.timelineDate), "PPP") : "Select deadline"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.timelineDate ? new Date(formData.timelineDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          updateField('timelineDate', date.toISOString())
                        }
                      }}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <p className="text-xs text-muted-foreground">
                  Select the project deadline date
                </p>
              </div>
            </div>
            
            {/* Priority and Category Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="project-priority">Priority</Label>
                <Select 
                  value={formData.priority} 
                  onValueChange={(value: any) => updateField('priority', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <Badge className={getPriorityColor('low')} variant="secondary">
                        Low
                      </Badge>
                    </SelectItem>
                    <SelectItem value="medium">
                      <Badge className={getPriorityColor('medium')} variant="secondary">
                        Medium
                      </Badge>
                    </SelectItem>
                    <SelectItem value="high">
                      <Badge className={getPriorityColor('high')} variant="secondary">
                        High
                      </Badge>
                    </SelectItem>
                    <SelectItem value="critical">
                      <Badge className={getPriorityColor('critical')} variant="secondary">
                        Critical
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="project-category">Project Category</Label>
                <Select 
                  value={formData.category || ''} 
                  onValueChange={(value: any) => updateField('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ECR">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                        ECR
                      </Badge>
                    </SelectItem>
                    <SelectItem value="ECN">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                        ECN
                      </Badge>
                    </SelectItem>
                    <SelectItem value="NPD">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                        NPD
                      </Badge>
                    </SelectItem>
                    <SelectItem value="SUST">
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                        SUST
                      </Badge>
                    </SelectItem>
                    {/* Custom Categories */}
                    {customCategories.map((category) => (
                      <SelectItem key={category} value={category}>
                        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400" variant="secondary">
                          {category}
                        </Badge>
                      </SelectItem>
                    ))}
                    <SelectItem value="custom" onSelect={() => setShowCustomInput(true)}>
                      <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400" variant="secondary">
                        + Add Custom Category
                      </Badge>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Custom Category Input */}
              {showCustomInput && (
                <div className="space-y-2">
                  <Label htmlFor="custom-category">Custom Category Name</Label>
                  <div className="flex gap-2">
                    <Input
                      id="custom-category"
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      placeholder="Enter custom category name"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault()
                          handleAddCustomCategory()
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAddCustomCategory}
                      disabled={!customCategory.trim()}
                    >
                      Add
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowCustomInput(false)
                        setCustomCategory('')
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-description" className="flex items-center gap-1">
                Description *
              </Label>
              <Textarea
                id="project-description"
                value={formData.description}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Provide a detailed project description, objectives, and key deliverables..."
                rows={4}
                className={errors.description ? 'border-destructive' : ''}
                maxLength={1000}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.description.length}/1000 characters
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="project-details" className="flex items-center gap-1">
                Comprehensive Project Details *
              </Label>
              <Textarea
                id="project-details"
                value={formData.projectDetails}
                onChange={(e) => updateField('projectDetails', e.target.value)}
                placeholder="Provide comprehensive project details including technical requirements, scope, resources needed, deliverables, milestones, and any specific constraints or considerations..."
                rows={5}
                className={errors.projectDetails ? 'border-destructive' : ''}
                maxLength={2000}
              />
              {errors.projectDetails && (
                <p className="text-sm text-destructive">{errors.projectDetails}</p>
              )}
              <p className="text-xs text-muted-foreground">
                {formData.projectDetails.length}/2000 characters • Minimum 50 characters required
              </p>
            </div>
          </div>


          {/* Tags Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Tags</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Add tag (press Enter)"
                  className="flex-1"
                  maxLength={20}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addTag}
                  disabled={!newTag.trim() || formData.tags.length >= 10}
                >
                  Add Tag
                </Button>
              </div>
              
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {formData.tags.length}/10 tags. Click on tags to remove them.
              </p>
            </div>
          </div>
          
          {/* Required Skills Section */}
          <div className="space-y-4">
            <h3 className="font-medium">Required Skills</h3>
            <div className="space-y-2">
              <div className="flex gap-2">
                <Input
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                  placeholder="Add required skill (press Enter)"
                  className="flex-1"
                  maxLength={30}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={addSkill}
                  disabled={!newSkill.trim() || formData.requiredSkills.length >= 15}
                >
                  Add Skill
                </Button>
              </div>
              
              {formData.requiredSkills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.requiredSkills.map((skill, index) => (
                    <Badge 
                      key={index} 
                      variant="outline" 
                      className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                      onClick={() => removeSkill(skill)}
                    >
                      {skill} ×
                    </Badge>
                  ))}
                </div>
              )}
              
              <p className="text-xs text-muted-foreground">
                {formData.requiredSkills.length}/15 skills. Click on skills to remove them.
              </p>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Project'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}