import React, { useState } from 'react'
import { centralizedDb } from '../utils/centralizedDb'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Checkbox } from './ui/checkbox'
import { Label } from './ui/label'
import { Badge } from './ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { Progress } from './ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Download, FileText, Table, Users, Calendar, TrendingUp, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'

interface ExportSystemProps {
  isOpen: boolean
  onClose: () => void
}

interface ExportOptions {
  format: 'excel' | 'pdf' | 'csv' | 'json' | 'word'
  includeProjects: boolean
  includeEmployees: boolean
  includeInitiatives: boolean
  includeProgress: boolean
  includeComments: boolean
  includeMetrics: boolean
  dateRange: {
    start: string
    end: string
  }
  projectStatus: string[]
  employeeRoles: string[]
  selectedProjects: string[]
}

export function ExportSystem({ isOpen, onClose }: ExportSystemProps) {
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'excel',
    includeProjects: true,
    includeEmployees: true,
    includeInitiatives: true,
    includeProgress: true,
    includeComments: false,
    includeMetrics: true,
    dateRange: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date().toISOString().split('T')[0]
    },
    projectStatus: ['active', 'completed'],
    employeeRoles: ['all'],
    selectedProjects: []
  })

  const [isExporting, setIsExporting] = useState(false)
  const [exportProgress, setExportProgress] = useState(0)

  const generateProjectReport = () => {
    const projects = centralizedDb.getProjects()
    const users = centralizedDb.getUsers()
    const initiatives = centralizedDb.getInitiatives()

    const filteredProjects = projects.filter(project => {
      const isInDateRange = new Date(project.createdAt) >= new Date(exportOptions.dateRange.start) &&
                           new Date(project.createdAt) <= new Date(exportOptions.dateRange.end)
      const hasCorrectStatus = exportOptions.projectStatus.includes(project.status)
      const isSelectedProject = exportOptions.selectedProjects.length === 0 || 
        exportOptions.selectedProjects.includes(project.id)
      return isInDateRange && hasCorrectStatus && isSelectedProject
    })

    return filteredProjects.map(project => {
      const manager = users.find(u => u.id === project.managerId)
      const assignedEmployees = project.assignedEmployees.map(assignment => {
        const employee = users.find(u => u.id === assignment.employeeId)
        return {
          name: employee?.name || 'Unknown',
          email: employee?.email || '',
          role: assignment.role,
          involvement: assignment.involvementPercentage,
          assignedAt: assignment.assignedAt,
          department: employee?.department || '',
          skills: employee?.skills || []
        }
      })

      const completedMilestones = project.milestones.filter(m => m.completed).length
      const totalMilestones = project.milestones.length
      const progressPercentage = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0

      return {
        projectId: project.id,
        title: project.title,
        description: project.description,
        status: project.status,
        priority: project.priority,
        manager: manager?.name || 'Unknown',
        managerEmail: manager?.email || '',
        timeline: project.timeline,
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
        version: project.version,
        assignedEmployees,
        totalEmployees: assignedEmployees.length,
        totalInvolvement: assignedEmployees.reduce((sum, emp) => sum + emp.involvement, 0),
        averageInvolvement: assignedEmployees.length > 0 ? 
          assignedEmployees.reduce((sum, emp) => sum + emp.involvement, 0) / assignedEmployees.length : 0,
        milestones: project.milestones,
        completedMilestones,
        totalMilestones,
        progressPercentage,
        tags: project.tags,
        budget: project.budget,
        estimatedHours: project.estimatedHours,
        actualHours: project.actualHours,
        budgetUtilization: project.budget && project.actualHours && project.estimatedHours ? 
          (project.actualHours / project.estimatedHours) * 100 : 0
      }
    })
  }

  const generateEmployeeReport = () => {
    const users = centralizedDb.getUsers()
    
    return users.map(user => {
      const workload = centralizedDb.getEmployeeWorkload(user.id)
      const assignedProjects = centralizedDb.getProjects().filter(p => 
        p.assignedEmployees.some(emp => emp.employeeId === user.id)
      )
      const assignedInitiatives = centralizedDb.getInitiatives().filter(i => i.assignedTo === user.id)

      return {
        employeeId: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        skills: user.skills,
        isActive: user.isActive,
        workloadCap: user.workloadCap,
        overBeyondCap: user.overBeyondCap,
        currentProjectWorkload: workload.projectWorkload,
        currentOverBeyondWorkload: workload.overBeyondWorkload,
        totalWorkload: workload.totalWorkload,
        availableCapacity: workload.availableCapacity,
        overBeyondAvailable: workload.overBeyondAvailable,
        assignedProjects: assignedProjects.map(p => ({
          projectId: p.id,
          title: p.title,
          status: p.status,
          involvement: p.assignedEmployees.find(emp => emp.employeeId === user.id)?.involvementPercentage || 0
        })),
        assignedInitiatives: assignedInitiatives.map(i => ({
          initiativeId: i.id,
          title: i.title,
          status: i.status,
          workloadPercentage: i.workloadPercentage
        })),
        totalProjects: assignedProjects.length,
        totalInitiatives: assignedInitiatives.length,
        utilizationRate: (workload.totalWorkload / user.workloadCap) * 100
      }
    })
  }

  const generateExportData = () => {
    const exportData: any = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        format: exportOptions.format,
        dateRange: exportOptions.dateRange,
        filters: {
          projectStatus: exportOptions.projectStatus,
          employeeRoles: exportOptions.employeeRoles
        }
      }
    }

    if (exportOptions.includeProjects) {
      exportData.projects = generateProjectReport()
    }

    if (exportOptions.includeEmployees) {
      exportData.employees = generateEmployeeReport()
    }

    if (exportOptions.includeInitiatives) {
      exportData.initiatives = centralizedDb.getInitiatives().map(initiative => {
        const creator = centralizedDb.getUserById(initiative.createdBy)
        const assignee = initiative.assignedTo ? centralizedDb.getUserById(initiative.assignedTo) : null
        
        return {
          ...initiative,
          creatorName: creator?.name || 'Unknown',
          assigneeName: assignee?.name || 'Unassigned',
          completionRate: initiative.actualHours && initiative.estimatedHours ? 
            (initiative.actualHours / initiative.estimatedHours) * 100 : 0
        }
      })
    }

    if (exportOptions.includeMetrics) {
      exportData.metrics = centralizedDb.getMetrics()
      exportData.summary = {
        totalActiveProjects: centralizedDb.getProjects().filter(p => p.status === 'active').length,
        totalCompletedProjects: centralizedDb.getProjects().filter(p => p.status === 'completed').length,
        totalActiveEmployees: centralizedDb.getUsers().filter(u => u.isActive).length,
        averageProjectProgress: exportData.projects ? 
          exportData.projects.reduce((sum: number, p: any) => sum + p.progressPercentage, 0) / exportData.projects.length : 0,
        overloadedEmployees: exportData.employees ? 
          exportData.employees.filter((emp: any) => emp.totalWorkload > 100).length : 0
      }
    }

    return exportData
  }

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const convertToCSV = (data: any): string => {
    if (!data || typeof data !== 'object') return ''
    
    let csv = ''
    
    // Add projects CSV
    if (data.projects && data.projects.length > 0) {
      csv += 'PROJECTS\n'
      csv += 'ID,Title,Status,Priority,Manager,Total Employees,Progress %,Budget,Estimated Hours,Actual Hours\n'
      data.projects.forEach((project: any) => {
        csv += `${project.projectId},"${project.title}",${project.status},${project.priority},"${project.manager}",${project.totalEmployees},${project.progressPercentage.toFixed(2)},${project.budget || 0},${project.estimatedHours || 0},${project.actualHours || 0}\n`
      })
      csv += '\n'
    }

    // Add employees CSV
    if (data.employees && data.employees.length > 0) {
      csv += 'EMPLOYEES\n'
      csv += 'ID,Name,Email,Role,Department,Current Workload %,Available Capacity %,Total Projects,Total Initiatives\n'
      data.employees.forEach((employee: any) => {
        csv += `${employee.employeeId},"${employee.name}","${employee.email}",${employee.role},"${employee.department}",${employee.totalWorkload.toFixed(2)},${employee.availableCapacity.toFixed(2)},${employee.totalProjects},${employee.totalInitiatives}\n`
      })
    }

    return csv
  }

  const convertToExcel = (data: any): string => {
    // For now, create a structured Excel-like format as text
    // In production, you would use a library like xlsx or exceljs
    let excel = ''
    excel += `BPL Commander Export Report\n`
    excel += `Generated: ${new Date().toLocaleString()}\n\n`
    
    if (data.projects && data.projects.length > 0) {
      excel += `=== PROJECTS REPORT ===\n`
      excel += `Total Projects: ${data.projects.length}\n\n`
      data.projects.forEach((project: any) => {
        excel += `Project: ${project.title}\n`
        excel += `  Status: ${project.status}\n`
        excel += `  Priority: ${project.priority}\n`
        excel += `  Manager: ${project.manager}\n`
        excel += `  Progress: ${project.progressPercentage.toFixed(2)}%\n`
        excel += `  Budget: ${project.budget || 'Not set'}\n`
        excel += `  Timeline: ${project.timeline || 'Not specified'}\n`
        if (project.assignedEmployees && project.assignedEmployees.length > 0) {
          excel += `  Team Members:\n`
          project.assignedEmployees.forEach((emp: any) => {
            excel += `    - ${emp.name} (${emp.role}): ${emp.involvement}%\n`
          })
        }
        excel += `\n`
      })
    }

    if (data.summary) {
      excel += `=== SUMMARY METRICS ===\n`
      excel += `Active Projects: ${data.summary.totalActiveProjects}\n`
      excel += `Completed Projects: ${data.summary.totalCompletedProjects}\n`
      excel += `Active Employees: ${data.summary.totalActiveEmployees}\n`
      excel += `Average Progress: ${data.summary.averageProjectProgress.toFixed(2)}%\n`
      excel += `Overloaded Employees: ${data.summary.overloadedEmployees}\n`
    }

    return excel
  }

  const convertToPDF = (data: any): string => {
    // For now, create a structured PDF-like format as text
    // In production, you would use a library like jsPDF or PDFKit
    let pdf = ''
    pdf += `BPL COMMANDER - PROJECT EXPORT REPORT\n`
    pdf += `${'='.repeat(50)}\n`
    pdf += `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n\n`
    
    if (data.projects && data.projects.length > 0) {
      pdf += `PROJECTS OVERVIEW\n`
      pdf += `${'-'.repeat(30)}\n`
      data.projects.forEach((project: any, index: number) => {
        pdf += `${index + 1}. ${project.title.toUpperCase()}\n`
        pdf += `   Status: ${project.status} | Priority: ${project.priority}\n`
        pdf += `   Manager: ${project.manager}\n`
        pdf += `   Progress: ${project.progressPercentage.toFixed(1)}% Complete\n`
        if (project.budget) pdf += `   Budget: ${project.budget}\n`
        if (project.estimatedHours) pdf += `   Estimated Hours: ${project.estimatedHours}h\n`
        if (project.assignedEmployees && project.assignedEmployees.length > 0) {
          pdf += `   Team: ${project.assignedEmployees.map((emp: any) => emp.name).join(', ')}\n`
        }
        pdf += `\n`
      })
    }

    if (data.summary) {
      pdf += `EXECUTIVE SUMMARY\n`
      pdf += `${'-'.repeat(30)}\n`
      pdf += `• Total Active Projects: ${data.summary.totalActiveProjects}\n`
      pdf += `• Total Completed Projects: ${data.summary.totalCompletedProjects}\n`
      pdf += `• Active Team Members: ${data.summary.totalActiveEmployees}\n`
      pdf += `• Average Project Progress: ${data.summary.averageProjectProgress.toFixed(1)}%\n`
      pdf += `• Resource Utilization: ${100 - (data.summary.overloadedEmployees || 0)}% Optimal\n`
    }

    return pdf
  }

  const convertToWord = (data: any): string => {
    // For now, create a structured Word-like format as text
    // In production, you would use a library like docx or officegen
    let word = ''
    word += `BPL COMMANDER\nPROJECT MANAGEMENT REPORT\n\n`
    word += `Report Generated: ${new Date().toLocaleDateString()}\n`
    word += `Export Format: Microsoft Word Document\n\n`
    
    word += `EXECUTIVE SUMMARY\n`
    word += `================\n\n`
    if (data.summary) {
      word += `This report provides a comprehensive overview of all projects and resources managed through the BPL Commander system.\n\n`
      word += `Key Metrics:\n`
      word += `• Active Projects: ${data.summary.totalActiveProjects}\n`
      word += `• Completed Projects: ${data.summary.totalCompletedProjects}\n`
      word += `• Team Members: ${data.summary.totalActiveEmployees}\n`
      word += `• Average Progress: ${data.summary.averageProjectProgress.toFixed(1)}%\n\n`
    }

    if (data.projects && data.projects.length > 0) {
      word += `PROJECT DETAILS\n`
      word += `===============\n\n`
      data.projects.forEach((project: any, index: number) => {
        word += `${index + 1}. ${project.title}\n`
        word += `   Project Status: ${project.status.charAt(0).toUpperCase() + project.status.slice(1)}\n`
        word += `   Priority Level: ${project.priority.charAt(0).toUpperCase() + project.priority.slice(1)}\n`
        word += `   Project Manager: ${project.manager}\n`
        word += `   Completion: ${project.progressPercentage.toFixed(1)}%\n`
        
        if (project.description) {
          word += `   Description: ${project.description}\n`
        }
        
        if (project.assignedEmployees && project.assignedEmployees.length > 0) {
          word += `   Team Members:\n`
          project.assignedEmployees.forEach((emp: any) => {
            word += `     • ${emp.name} - ${emp.role} (${emp.involvement}% involvement)\n`
          })
        }
        
        if (project.milestones && project.milestones.length > 0) {
          const completedMilestones = project.milestones.filter((m: any) => m.completed).length
          word += `   Milestones: ${completedMilestones}/${project.milestones.length} completed\n`
        }
        
        word += `\n`
      })
    }

    word += `\nReport End\n`
    word += `Generated by BPL Commander Project Management System\n`
    
    return word
  }

  const handleExport = async () => {
    setIsExporting(true)
    setExportProgress(0)

    try {
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setExportProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const exportData = generateExportData()
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
      
      let content: string
      let filename: string
      let mimeType: string

      switch (exportOptions.format) {
        case 'json':
          content = JSON.stringify(exportData, null, 2)
          filename = `bpl-commander-export-${timestamp}.json`
          mimeType = 'application/json'
          break
        case 'csv':
          content = convertToCSV(exportData)
          filename = `bpl-commander-export-${timestamp}.csv`
          mimeType = 'text/csv'
          break
        case 'excel':
          content = convertToExcel(exportData)
          filename = `bpl-commander-export-${timestamp}.xlsx`
          mimeType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          break
        case 'pdf':
          content = convertToPDF(exportData)
          filename = `bpl-commander-export-${timestamp}.pdf`
          mimeType = 'application/pdf'
          break
        case 'word':
          content = convertToWord(exportData)
          filename = `bpl-commander-export-${timestamp}.docx`
          mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          break
        default:
          throw new Error('Unsupported export format')
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      setTimeout(() => {
        downloadFile(content, filename, mimeType)
        toast.success(`Export completed successfully! Downloaded: ${filename}`)
        setIsExporting(false)
        setExportProgress(0)
        onClose()
      }, 500)

    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed. Please try again.')
      setIsExporting(false)
      setExportProgress(0)
    }
  }

  const previewData = generateExportData()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Project Data
          </DialogTitle>
          <DialogDescription>
            Export comprehensive project information including employee involvement and progress metrics
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="options" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="options">Export Options</TabsTrigger>
            <TabsTrigger value="preview">Data Preview</TabsTrigger>
            <TabsTrigger value="metrics">Summary Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="options" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Export Format</CardTitle>
                </CardHeader>
                <CardContent>
                  <Select 
                    value={exportOptions.format} 
                    onValueChange={(value) => setExportOptions(prev => ({ ...prev, format: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          Excel (.xlsx)
                        </div>
                      </SelectItem>
                      <SelectItem value="pdf">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          PDF Report
                        </div>
                      </SelectItem>
                      <SelectItem value="csv">
                        <div className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          CSV (.csv)
                        </div>
                      </SelectItem>
                      <SelectItem value="word">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          Word (.docx)
                        </div>
                      </SelectItem>
                      <SelectItem value="json">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4" />
                          JSON (.json)
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Select Projects</CardTitle>
                  <CardDescription>Choose specific projects to export</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="max-h-40 overflow-y-auto space-y-2">
                    {centralizedDb.getProjects().map((project) => (
                      <div key={project.id} className="flex items-center space-x-2">
                        <Checkbox
                          id={`project-${project.id}`}
                          checked={exportOptions.selectedProjects.includes(project.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setExportOptions(prev => ({
                                ...prev,
                                selectedProjects: [...prev.selectedProjects, project.id]
                              }))
                            } else {
                              setExportOptions(prev => ({
                                ...prev,
                                selectedProjects: prev.selectedProjects.filter(id => id !== project.id)
                              }))
                            }
                          }}
                        />
                        <Label htmlFor={`project-${project.id}`} className="text-sm cursor-pointer">
                          {project.title}
                          <Badge variant="outline" className="ml-2 text-xs">
                            {project.status}
                          </Badge>
                        </Label>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExportOptions(prev => ({
                        ...prev,
                        selectedProjects: centralizedDb.getProjects().map(p => p.id)
                      }))}
                    >
                      Select All
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setExportOptions(prev => ({
                        ...prev,
                        selectedProjects: []
                      }))}
                    >
                      Clear All
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Date Range</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="start-date">Start Date</Label>
                    <input
                      id="start-date"
                      type="date"
                      value={exportOptions.dateRange.start}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, start: e.target.value }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                    />
                  </div>
                  <div>
                    <Label htmlFor="end-date">End Date</Label>
                    <input
                      id="end-date"
                      type="date"
                      value={exportOptions.dateRange.end}
                      onChange={(e) => setExportOptions(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, end: e.target.value }
                      }))}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-md bg-background"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Data Sections</CardTitle>
                <CardDescription>Select what information to include in the export</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[
                    { key: 'includeProjects', label: 'Projects', icon: FileText },
                    { key: 'includeEmployees', label: 'Employees', icon: Users },
                    { key: 'includeInitiatives', label: 'Over & Beyond', icon: TrendingUp },
                    { key: 'includeProgress', label: 'Progress Metrics', icon: CheckCircle },
                    { key: 'includeComments', label: 'Comments', icon: FileText },
                    { key: 'includeMetrics', label: 'System Metrics', icon: TrendingUp }
                  ].map((option) => (
                    <div key={option.key} className="flex items-center space-x-2">
                      <Checkbox
                        id={option.key}
                        checked={exportOptions[option.key as keyof ExportOptions] as boolean}
                        onCheckedChange={(checked) => 
                          setExportOptions(prev => ({ ...prev, [option.key]: checked }))
                        }
                      />
                      <Label htmlFor={option.key} className="flex items-center gap-2">
                        <option.icon className="h-4 w-4" />
                        {option.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end space-x-3">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleExport} disabled={isExporting}>
                {isExporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                    Exporting... {exportProgress}%
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </>
                )}
              </Button>
            </div>

            {isExporting && (
              <div className="space-y-2">
                <Progress value={exportProgress} className="w-full" />
                <p className="text-sm text-muted-foreground text-center">
                  Generating export file...
                </p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="preview" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3>Projects</h3>
                    <p className="text-2xl font-bold text-primary">
                      {previewData.projects?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3>Employees</h3>
                    <p className="text-2xl font-bold text-primary">
                      {previewData.employees?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <h3>Initiatives</h3>
                    <p className="text-2xl font-bold text-primary">
                      {previewData.initiatives?.length || 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {previewData.projects && previewData.projects.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Sample Project Data</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {previewData.projects.slice(0, 3).map((project: any) => (
                      <div key={project.projectId} className="border rounded-lg p-3">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-medium">{project.title}</h4>
                          <Badge variant="outline">{project.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                          <div>Employees: {project.totalEmployees}</div>
                          <div>Progress: {project.progressPercentage.toFixed(1)}%</div>
                          <div>Manager: {project.manager}</div>
                          <div>Priority: {project.priority}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {previewData.summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Projects</p>
                        <p className="text-2xl font-bold">{previewData.summary.totalActiveProjects}</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-green-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completed Projects</p>
                        <p className="text-2xl font-bold">{previewData.summary.totalCompletedProjects}</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-blue-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Active Employees</p>
                        <p className="text-2xl font-bold">{previewData.summary.totalActiveEmployees}</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Project Progress</p>
                        <p className="text-2xl font-bold">{previewData.summary.averageProjectProgress.toFixed(1)}%</p>
                      </div>
                      <TrendingUp className="h-8 w-8 text-indigo-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Overloaded Employees</p>
                        <p className="text-2xl font-bold text-red-600">{previewData.summary.overloadedEmployees}</p>
                      </div>
                      <Users className="h-8 w-8 text-red-600" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Database Size</p>
                        <p className="text-2xl font-bold">{(previewData.metrics?.dataSize / 1024).toFixed(1)} KB</p>
                      </div>
                      <FileText className="h-8 w-8 text-gray-600" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}