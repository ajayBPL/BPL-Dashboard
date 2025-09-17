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
import * as XLSX from 'xlsx'
import { saveAs } from 'file-saver'

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
      
      // Find manager information
      const manager = user.managerId ? users.find(u => u.id === user.managerId) : null

      return {
        employeeId: user.employeeId || 'Not Assigned',
        name: user.name,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department || 'Not Specified',
        managerId: user.managerId || 'Not Assigned',
        managerName: manager?.name || 'Not Assigned',
        managerEmail: manager?.email || 'Not Assigned',
        skills: user.skills?.join(', ') || 'None',
        isActive: user.isActive ? 'Active' : 'Inactive',
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
        utilizationRate: (workload.totalWorkload / user.workloadCap) * 100,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
    })
  }

  const generateExportData = () => {
    const exportData: any = {
      exportInfo: {
        generatedAt: new Date().toISOString(),
        format: exportOptions.format
      },
      employees: generateEmployeeReport(),
      projects: [],
      initiatives: [],
      summary: null
    }

    return exportData
  }

  const convertToCSV = (data: any): string => {
    if (!data || typeof data !== 'object') return ''
    
    let csv = ''
    
    // Add employees CSV with all required fields
    if (data.employees && data.employees.length > 0) {
      csv += 'Employee ID,Name,Email,Role,Designation,Department,Manager Name,Manager Email,Skills,Status,Workload Cap %,Current Workload %,Available Capacity %,Total Projects,Total Initiatives,Utilization Rate %,Created At,Last Login\n'
      data.employees.forEach((employee: any) => {
        csv += `"${employee.employeeId || 'Not Assigned'}","${employee.name}","${employee.email}","${employee.role}","${employee.designation}","${employee.department}","${employee.managerName}","${employee.managerEmail}","${employee.skills}","${employee.isActive}",${employee.workloadCap},${employee.totalWorkload.toFixed(2)},${employee.availableCapacity.toFixed(2)},${employee.totalProjects},${employee.totalInitiatives},${employee.utilizationRate.toFixed(2)},"${employee.createdAt}","${employee.lastLoginAt || 'Never'}"\n`
      })
      csv += '\n'
    }

    // Add projects CSV
    if (data.projects && data.projects.length > 0) {
      csv += 'PROJECTS\n'
      csv += 'ID,Title,Status,Priority,Manager,Total Employees,Progress %,Budget,Estimated Hours,Actual Hours\n'
      data.projects.forEach((project: any) => {
        csv += `${project.projectId},"${project.title}",${project.status},${project.priority},"${project.manager}",${project.totalEmployees},${project.progressPercentage.toFixed(2)},${project.budget || 0},${project.estimatedHours || 0},${project.actualHours || 0}\n`
      })
      csv += '\n'
    }

    return csv
  }

  const convertToExcel = (data: any): Blob => {
    const workbook = XLSX.utils.book_new()
    
    // Create Employees sheet
    if (data.employees && data.employees.length > 0) {
      const employeeData = data.employees.map((employee: any) => ({
        'Employee ID': employee.employeeId || 'Not Assigned',
        'Name': employee.name,
        'Email': employee.email,
        'Role': employee.role,
        'Designation': employee.designation,
        'Department': employee.department,
        'Manager Name': employee.managerName,
        'Manager Email': employee.managerEmail,
        'Skills': employee.skills,
        'Status': employee.isActive,
        'Workload Cap %': employee.workloadCap,
        'Current Workload %': employee.totalWorkload.toFixed(2),
        'Available Capacity %': employee.availableCapacity.toFixed(2),
        'Total Projects': employee.totalProjects,
        'Total Initiatives': employee.totalInitiatives,
        'Utilization Rate %': employee.utilizationRate.toFixed(2),
        'Created At': employee.createdAt,
        'Last Login': employee.lastLoginAt || 'Never'
      }))
      
      const employeeSheet = XLSX.utils.json_to_sheet(employeeData)
      XLSX.utils.book_append_sheet(workbook, employeeSheet, 'Employees')
    }
    
    // Create Projects sheet
    if (data.projects && data.projects.length > 0) {
      const projectData = data.projects.map((project: any) => ({
        'Project ID': project.projectId,
        'Title': project.title,
        'Status': project.status,
        'Priority': project.priority,
        'Manager': project.manager,
        'Total Employees': project.totalEmployees,
        'Progress %': project.progressPercentage.toFixed(2),
        'Budget': project.budget || 0,
        'Estimated Hours': project.estimatedHours || 0,
        'Actual Hours': project.actualHours || 0,
        'Created At': project.createdAt,
        'Updated At': project.updatedAt
      }))
      
      const projectSheet = XLSX.utils.json_to_sheet(projectData)
      XLSX.utils.book_append_sheet(workbook, projectSheet, 'Projects')
    }
    
    // Create Summary sheet
    if (data.summary) {
      const summaryData = [
        { 'Metric': 'Active Projects', 'Value': data.summary.totalActiveProjects },
        { 'Metric': 'Completed Projects', 'Value': data.summary.totalCompletedProjects },
        { 'Metric': 'Active Employees', 'Value': data.summary.totalActiveEmployees },
        { 'Metric': 'Average Progress %', 'Value': data.summary.averageProjectProgress.toFixed(2) },
        { 'Metric': 'Overloaded Employees', 'Value': data.summary.overloadedEmployees }
      ]
      
      const summarySheet = XLSX.utils.json_to_sheet(summaryData)
      XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary')
    }
    
    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  }

  const convertToPDF = (data: any): string => {
    let pdf = ''
    pdf += `BPL COMMANDER - EMPLOYEE EXPORT REPORT\n`
    pdf += `${'='.repeat(50)}\n`
    pdf += `Generated: ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}\n\n`
    
    if (data.employees && data.employees.length > 0) {
      pdf += `EMPLOYEE DIRECTORY\n`
      pdf += `${'-'.repeat(30)}\n`
      data.employees.forEach((employee: any, index: number) => {
        pdf += `${index + 1}. ${employee.name.toUpperCase()}\n`
        pdf += `   Employee ID: ${employee.employeeId || 'Not Assigned'}\n`
        pdf += `   Email: ${employee.email}\n`
        pdf += `   Role: ${employee.role}\n`
        pdf += `   Designation: ${employee.designation}\n`
        pdf += `   Department: ${employee.department}\n`
        pdf += `   Manager: ${employee.managerName} (${employee.managerEmail})\n`
        pdf += `   Skills: ${employee.skills}\n`
        pdf += `   Status: ${employee.isActive}\n`
        pdf += `   Workload: ${employee.totalWorkload.toFixed(1)}% / ${employee.workloadCap}%\n`
        pdf += `   Projects: ${employee.totalProjects} | Initiatives: ${employee.totalInitiatives}\n`
        pdf += `   Utilization Rate: ${employee.utilizationRate.toFixed(1)}%\n`
        pdf += `   Created: ${employee.createdAt}\n`
        pdf += `   Last Login: ${employee.lastLoginAt || 'Never'}\n`
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
      pdf += `• Overloaded Employees: ${data.summary.overloadedEmployees}\n`
    }

    return pdf
  }

  const convertToWord = (data: any): string => {
    let word = ''
    word += `BPL COMMANDER\nEMPLOYEE DIRECTORY REPORT\n\n`
    word += `Report Generated: ${new Date().toLocaleDateString()}\n`
    word += `Export Format: Microsoft Word Document\n\n`
    
    word += `EXECUTIVE SUMMARY\n`
    word += `================\n\n`
    if (data.summary) {
      word += `This report provides a comprehensive overview of all employees and their organizational structure in the BPL Commander system.\n\n`
      word += `Key Metrics:\n`
      word += `• Active Projects: ${data.summary.totalActiveProjects}\n`
      word += `• Completed Projects: ${data.summary.totalCompletedProjects}\n`
      word += `• Active Employees: ${data.summary.totalActiveEmployees}\n`
      word += `• Average Progress: ${data.summary.averageProjectProgress.toFixed(1)}%\n`
      word += `• Overloaded Employees: ${data.summary.overloadedEmployees}\n\n`
    }

    if (data.employees && data.employees.length > 0) {
      word += `EMPLOYEE DIRECTORY\n`
      word += `==================\n\n`
      data.employees.forEach((employee: any, index: number) => {
        word += `${index + 1}. ${employee.name}\n`
        word += `   Employee ID: ${employee.employeeId || 'Not Assigned'}\n`
        word += `   Email Address: ${employee.email}\n`
        word += `   Role: ${employee.role.charAt(0).toUpperCase() + employee.role.slice(1)}\n`
        word += `   Designation: ${employee.designation}\n`
        word += `   Department: ${employee.department}\n`
        word += `   Manager: ${employee.managerName} (${employee.managerEmail})\n`
        word += `   Skills: ${employee.skills}\n`
        word += `   Status: ${employee.isActive}\n`
        word += `   Workload Capacity: ${employee.workloadCap}%\n`
        word += `   Current Workload: ${employee.totalWorkload.toFixed(1)}%\n`
        word += `   Available Capacity: ${employee.availableCapacity.toFixed(1)}%\n`
        word += `   Total Projects: ${employee.totalProjects}\n`
        word += `   Total Initiatives: ${employee.totalInitiatives}\n`
        word += `   Utilization Rate: ${employee.utilizationRate.toFixed(1)}%\n`
        word += `   Date Created: ${employee.createdAt}\n`
        word += `   Last Login: ${employee.lastLoginAt || 'Never'}\n`
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
      
      let filename: string

      switch (exportOptions.format) {
        case 'json':
          const jsonContent = JSON.stringify(exportData, null, 2)
          filename = `bpl-commander-employees-${timestamp}.json`
          const jsonBlob = new Blob([jsonContent], { type: 'application/json' })
          saveAs(jsonBlob, filename)
          break
        case 'csv':
          const csvContent = convertToCSV(exportData)
          filename = `bpl-commander-employees-${timestamp}.csv`
          const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' })
          saveAs(csvBlob, filename)
          break
        case 'excel':
          const excelBlob = convertToExcel(exportData)
          filename = `bpl-commander-employees-${timestamp}.xlsx`
          saveAs(excelBlob, filename)
          break
        case 'pdf':
          const pdfContent = convertToPDF(exportData)
          filename = `bpl-commander-employees-${timestamp}.pdf`
          const pdfBlob = new Blob([pdfContent], { type: 'text/plain' })
          saveAs(pdfBlob, filename)
          break
        case 'word':
          const wordContent = convertToWord(exportData)
          filename = `bpl-commander-employees-${timestamp}.docx`
          const wordBlob = new Blob([wordContent], { type: 'text/plain' })
          saveAs(wordBlob, filename)
          break
        default:
          throw new Error('Unsupported export format')
      }

      clearInterval(progressInterval)
      setExportProgress(100)

      setTimeout(() => {
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


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Export Employee Data
          </DialogTitle>
          <DialogDescription>
            Export comprehensive employee directory with role, designation, department, and manager information
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="options" className="mt-4">
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="options">Export Options</TabsTrigger>
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


            </div>


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

        </Tabs>
      </DialogContent>
    </Dialog>
  )
}