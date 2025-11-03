import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { 
  Users, 
  Search, 
  Calendar,
  Clock,
  Target,
  Briefcase,
  AlertCircle,
  User,
  Loader2,
  Lightbulb
} from 'lucide-react'
import { toast } from 'sonner'
import { getDepartmentColors, getEnhancedColors } from '../utils/departmentColors'

interface EmployeeProjectAssignment {
  projectId: string
  projectTitle: string
  projectStatus: string
  category?: string
  involvementPercentage: number
  role: string
  assignedDate: string
  startDate?: string
  endDate?: string
}

interface EmployeeInitiative {
  id: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  workloadPercentage: number
  estimatedHours: number
  actualHours?: number
  dueDate?: string
  createdAt: string
}

interface EmployeeWithProjects {
  id: string
  name: string
  email: string
  role: string
  designation: string
  department: string
  skills: string[]
  workloadCap: number
  overBeyondCap: number
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  projects: EmployeeProjectAssignment[]
  initiatives: EmployeeInitiative[]
  totalWorkload: number
  availableCapacity: number
  overBeyondWorkload: number
}

export function EmployeeOverview() {
  const { user: currentUser, loading: authLoading } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithProjects[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithProjects[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'department' | 'workload' | 'projects'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [roleFilter] = useState<string>('all')
  const [departmentFilter] = useState<string>('all')
  const [workloadFilter, setWorkloadFilter] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeWithProjects | null>(null)
  const [showDetails, setShowDetails] = useState(false)

  // Check if current user can view employees
  const canViewEmployees = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'program_manager' || 
    currentUser.role === 'rd_manager' ||
    currentUser.role === 'manager'
  )

  useEffect(() => {
    if (!authLoading && canViewEmployees) {
      loadEmployeeData()
    }
  }, [authLoading, canViewEmployees])

  useEffect(() => {
    filterAndSortEmployees()
  }, [employees, searchQuery, sortBy, sortOrder, roleFilter, departmentFilter, workloadFilter])

  const loadEmployeeData = async () => {
    try {
      setLoading(true)
      
      // Fetch users and projects from backend API
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      const [usersResponse, projectsResponse, initiativesResponse] = await Promise.all([
        fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
          headers: getDefaultHeaders(token)
        }),
        fetch(API_ENDPOINTS.PROJECTS, {
          headers: getDefaultHeaders(token)
        }),
        fetch(API_ENDPOINTS.INITIATIVES, {
          headers: getDefaultHeaders(token)
        })
      ])

      if (!usersResponse.ok || !projectsResponse.ok || !initiativesResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const usersData = await usersResponse.json()
      const projectsData = await projectsResponse.json()
      const initiativesData = await initiativesResponse.json()
      
      const users = usersData.data || []
      const projects = projectsData.data || []
      const initiatives = initiativesData.success ? (initiativesData.data || []) : []

      // Calculate employee workload and project assignments
      const employeeData: EmployeeWithProjects[] = users
        .filter((user: any) => {
          const role = user.role?.toLowerCase()
          return role === 'employee' || role === 'manager' || role === 'program_manager' || role === 'rd_manager' ||
                 role === 'EMPLOYEE' || role === 'MANAGER' || role === 'PROGRAM_MANAGER' || role === 'RD_MANAGER' ||
                 role === 'intern' || role === 'INTERN' || role === 'lab in charge' || role === 'LAB IN CHARGE'
        })
        .map((user: any) => {
          // Find all projects assigned to this employee
          const employeeProjects: EmployeeProjectAssignment[] = projects
            .filter((project: any) => project.status === 'ACTIVE' || project.status === 'active' || project.status === 'PENDING' || project.status === 'pending')
            .map((project: any) => {
              const assignments = project.assignments || project.assignedEmployees || []
              const assignment = assignments.find((emp: any) => emp.employeeId === user.id)
              
              if (assignment) {
                return {
                  projectId: project.id,
                  projectTitle: project.title,
                  projectStatus: project.status,
                  category: project.category || 'standard',
                  involvementPercentage: assignment.involvementPercentage || 0,
                  role: assignment.role || 'Team Member',
                  assignedDate: assignment.assignedDate || project.createdAt,
                  startDate: assignment.startDate,
                  endDate: assignment.endDate
                }
              }
              return null
            })
            .filter(Boolean)


          // Find all initiatives assigned to this employee
          const employeeInitiatives: EmployeeInitiative[] = initiatives
            .filter((initiative: any) => {
              const assignedTo = initiative.assignedTo || initiative.assigned_to
              return assignedTo === user.id && 
                     (initiative.status === 'ACTIVE' || 
                      initiative.status === 'active' || 
                      initiative.status === 'PENDING' || 
                      initiative.status === 'pending')
            })
            .map((initiative: any) => ({
              id: initiative.id,
              title: initiative.title,
              description: initiative.description || '',
              category: initiative.category || '',
              priority: initiative.priority || 'medium',
              status: initiative.status,
              workloadPercentage: initiative.workloadPercentage || 0,
              estimatedHours: initiative.estimatedHours || 0,
              actualHours: initiative.actualHours,
              dueDate: initiative.dueDate || initiative.due_date,
              createdAt: initiative.createdAt || initiative.created_at
            }))

          // Calculate total workload from projects
          const projectWorkload = employeeProjects.reduce((total, project) => total + project.involvementPercentage, 0)
          // Calculate over & beyond workload from initiatives
          const overBeyondWorkload = employeeInitiatives.reduce((total, initiative) => total + initiative.workloadPercentage, 0)
          
          const workloadCap = user.workloadCap || 100
          const availableCapacity = Math.max(0, workloadCap - projectWorkload)

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            designation: user.designation,
            department: user.department,
            skills: user.skills || [],
            workloadCap,
            overBeyondCap: user.overBeyondCap || 20,
            isActive: user.isActive,
            createdAt: user.createdAt,
            lastLoginAt: user.lastLoginAt,
            projects: employeeProjects,
            initiatives: employeeInitiatives,
            totalWorkload: projectWorkload,
            availableCapacity,
            overBeyondWorkload
          }
        })

      setEmployees(employeeData)
    } catch (error) {
      console.error('Error loading employee data:', error)
      toast.error('Failed to load employee data')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortEmployees = () => {
    let filtered = [...employees]

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(emp => 
        emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.designation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.department.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(emp => emp.role?.toLowerCase() === roleFilter.toLowerCase())
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter)
    }

    // Apply workload filter
    if (workloadFilter !== 'all') {
      switch (workloadFilter) {
        case 'available':
          filtered = filtered.filter(emp => emp.availableCapacity > 0)
          break
        case 'full':
          filtered = filtered.filter(emp => emp.availableCapacity <= 0)
          break
        case 'over-capacity':
          filtered = filtered.filter(emp => emp.totalWorkload > emp.workloadCap)
          break
      }
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case 'name':
          aValue = a.name
          bValue = b.name
          break
        case 'role':
          aValue = a.role
          bValue = b.role
          break
        case 'department':
          aValue = a.department
          bValue = b.department
          break
        case 'workload':
          aValue = a.totalWorkload
          bValue = b.totalWorkload
          break
        case 'projects':
          aValue = a.projects.length
          bValue = b.projects.length
          break
        default:
          aValue = a.name
          bValue = b.name
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredEmployees(filtered)
  }

  const getWorkloadColor = (workload: number, capacity: number) => {
    if (workload > capacity) return 'text-red-600'
    if (workload === capacity) return 'text-orange-600'
    if (workload > capacity * 0.8) return 'text-yellow-600'
    return 'text-green-600'
  }

  // Removed unused functions and variables to fix linting issues

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Loading...</h3>
          <p className="text-sm text-muted-foreground mt-2">
            Checking authentication...
          </p>
        </div>
      </div>
    )
  }

  if (!canViewEmployees) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Access Denied</h3>
          <p className="text-sm text-muted-foreground">You don't have permission to view employee data.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading employee data...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Search</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Sort By</label>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Name</SelectItem>
              <SelectItem value="role">Role</SelectItem>
              <SelectItem value="department">Department</SelectItem>
              <SelectItem value="workload">Workload</SelectItem>
              <SelectItem value="projects">Projects</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Order</label>
          <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Ascending</SelectItem>
              <SelectItem value="desc">Descending</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Workload</label>
          <Select value={workloadFilter} onValueChange={setWorkloadFilter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="available">Available Capacity</SelectItem>
              <SelectItem value="full">At Capacity</SelectItem>
              <SelectItem value="over-capacity">Over Capacity</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Employee Thumbnail Grid - Updated Layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredEmployees.map((employee) => {
          const departmentColors = getDepartmentColors(employee.department);
          const enhancedColors = getEnhancedColors(departmentColors, employee.role);
          
          return (
            <Card 
              key={employee.id} 
              className={`hover:shadow-lg transition-all duration-200 ${
                employee.department === 'R&D' ? 'rounded-md' : ''
              }`}
              style={{ 
                backgroundColor: '#ffffff', 
                border: `1px solid #e5e7eb` 
              }}
            >
            <CardContent className="p-2 relative">
              <div className="space-y-2 pt-8">
                {/* Project Count Badge - Top Right */}
                <div className="absolute top-2 right-2 text-right z-10">
                  <div 
                    className="flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold"
                    style={{ 
                      backgroundColor: '#000000', 
                      color: '#FFFFFF' 
                    }}
                  >
                    {employee.projects.length}
                  </div>
                </div>
                
                {/* Project Categories - Top Section */}
                <div className="flex items-center justify-center pr-12 mb-1">
                  <div className="flex flex-wrap gap-1 justify-center">
                    {['ECR', 'ECN', 'NPD', 'SUST'].map((category, index) => {
                      const isInvolved = employee.projects.some(project => project.category === category)
                      const colors = ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6'] // Red, Blue, Green, Purple
                      return (
                        <span 
                          key={category}
                          className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                            isInvolved 
                              ? 'text-white' 
                              : 'text-gray-400'
                          }`}
                          style={{
                            backgroundColor: isInvolved ? colors[index] : '#e5e7eb'
                          }}
                        >
                          {category}
                        </span>
                      )
                    })}
                  </div>
                </div>

                {/* Main Horizontal Progress Bar */}
                <div className="space-y-1 mb-0">
                  <div 
                    style={{
                      width: '100%',
                      height: '12px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    {(() => {
                      const categoryData = ['ECR', 'ECN', 'NPD', 'SUST'].map(category => {
                        const categoryProjects = employee.projects.filter(project => project.category === category)
                        const categoryWorkload = categoryProjects.reduce((total, project) => total + project.involvementPercentage, 0)
                        return { category, workload: categoryWorkload }
                      })
                      
                      const colors = ['#ef4444', '#3b82f6', '#10b981', '#8b5cf6'] // Red, Blue, Green, Purple
                      const totalInvolvement = categoryData.reduce((total, cat) => total + cat.workload, 0)
                      
                      // Show total involvement as a single bar, then segment it by categories
                      const totalBarWidth = Math.min(totalInvolvement, 100)
                      
                      let cumulativeWidth = 0
                      return categoryData.map((cat, index) => {
                        if (cat.workload === 0) return null
                        
                        // Calculate proportional width within the total involvement
                        const proportionalWidth = totalInvolvement > 0 ? (cat.workload / totalInvolvement) * totalBarWidth : 0
                        const left = (cumulativeWidth / totalInvolvement) * totalBarWidth
                        cumulativeWidth += cat.workload
                        
                        return (
                          <div
                            key={cat.category}
                            style={{
                              position: 'absolute',
                              top: '0',
                              left: `${left}%`,
                              height: '100%',
                              backgroundColor: colors[index],
                              width: `${proportionalWidth}%`,
                              transition: 'width 0.3s ease'
                            }}
                            title={`${cat.category}: ${cat.workload.toFixed(1)}% involvement`}
                          />
                        )
                      }).filter(Boolean)
                    })()}
                  </div>
                </div>
                

                {/* Overall Workload Progress Bar */}
                <div className="space-y-1 mt-0">
                  <div 
                    style={{
                      width: '100%',
                      height: '12px',
                      backgroundColor: '#e5e7eb',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      position: 'relative',
                      border: '1px solid #d1d5db'
                    }}
                  >
                    <div 
                      style={{
                        height: '100%',
                        backgroundColor: '#ef4444',
                        width: `${Math.min((employee.totalWorkload / employee.workloadCap) * 100, 100)}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                    <div 
                      style={{
                        position: 'absolute',
                        top: '0',
                        left: '0',
                        height: '100%',
                        backgroundColor: '#22c55e',
                        width: `${Math.max(100 - (employee.totalWorkload / employee.workloadCap) * 100, 0)}%`,
                        transition: 'width 0.3s ease'
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-red-600 font-medium">
                      Involved: {employee.totalWorkload}%
                    </span>
                    <span className="text-green-600 font-medium">
                      Available: {Math.max(employee.workloadCap - employee.totalWorkload, 0)}%
                    </span>
                  </div>
                </div>

                {/* Employee Name - Centered with right margin to avoid overlap */}
                <div className="flex items-center justify-center pr-12 mb-1 mt-0">
                  <h3 
                    className="font-semibold text-sm transition-colors cursor-pointer text-center"
                    style={{ color: enhancedColors.text }}
                    onClick={() => {
                      setSelectedEmployee(employee)
                      setShowDetails(true)
                    }}
                  >
                    {employee.name}
                  </h3>
                </div>
                
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">No employees found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter criteria.</p>
        </div>
      )}

      {/* Employee Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {selectedEmployee?.name} - Assignments & Workload
            </DialogTitle>
            <DialogDescription>
              Detailed view of project assignments, Over & Beyond initiatives, and workload distribution
            </DialogDescription>
          </DialogHeader>

          {selectedEmployee && (
            <div className="space-y-6">
              {/* Employee Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Employee Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedEmployee.name}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Employee ID:</span>
                      <p className="font-medium">{selectedEmployee.id}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedEmployee.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Role:</span>
                      <p className="font-medium">{selectedEmployee.role}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Designation:</span>
                      <p className="font-medium">{selectedEmployee.designation}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Department:</span>
                      <p className="font-medium">{selectedEmployee.department}</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Status:</span>
                      <Badge variant={selectedEmployee.isActive ? 'default' : 'secondary'}>
                        {selectedEmployee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Skills:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedEmployee.skills?.map((skill, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Workload Capacity:</span>
                      <p className="font-medium">{selectedEmployee.workloadCap}%</p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Created:</span>
                      <p className="font-medium">{new Date(selectedEmployee.createdAt).toLocaleDateString()}</p>
                    </div>
                    {selectedEmployee.lastLoginAt && (
                      <div>
                        <span className="text-sm text-muted-foreground">Last Login:</span>
                        <p className="font-medium">{new Date(selectedEmployee.lastLoginAt).toLocaleDateString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Workload Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workload Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedEmployee.totalWorkload.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Project Workload</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedEmployee.overBeyondWorkload.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Over & Beyond</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getWorkloadColor(selectedEmployee.totalWorkload, selectedEmployee.workloadCap)}`}>
                        {selectedEmployee.availableCapacity.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Available Capacity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedEmployee.projects.length}</div>
                      <div className="text-sm text-muted-foreground">Active Projects</div>
                    </div>
                  </div>
                  <div className="mt-4 space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Project Workload Distribution</span>
                        <span>{selectedEmployee.totalWorkload.toFixed(1)}% / {selectedEmployee.workloadCap}%</span>
                      </div>
                      <Progress 
                        value={(selectedEmployee.totalWorkload / selectedEmployee.workloadCap) * 100} 
                        className="h-3"
                      />
                    </div>
                    {selectedEmployee.overBeyondWorkload > 0 && (
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span>Over & Beyond Workload</span>
                          <span>{selectedEmployee.overBeyondWorkload.toFixed(1)}% / {selectedEmployee.overBeyondCap}%</span>
                        </div>
                        <Progress 
                          value={(selectedEmployee.overBeyondWorkload / selectedEmployee.overBeyondCap) * 100} 
                          className="h-3"
                        />
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Project Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Briefcase className="h-5 w-5" />
                    Project Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEmployee.projects.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEmployee.projects.map((project) => (
                        <div key={project.projectId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">{project.projectTitle}</h4>
                                {project.category && (
                                  <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" variant="secondary">
                                    {project.category}
                                  </Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">Role: {project.role}</p>
                            </div>
                            <Badge variant="outline">{project.projectStatus}</Badge>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-2">
                                <Target className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">Involvement: {project.involvementPercentage}%</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm text-muted-foreground">
                                  Assigned: {new Date(project.assignedDate).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                            {(project.startDate || project.endDate) && (
                              <div className="flex justify-between items-center text-sm text-muted-foreground">
                                {project.startDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>Start: {new Date(project.startDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                                {project.endDate && (
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    <span>End: {new Date(project.endDate).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="mt-2">
                            <Progress value={project.involvementPercentage} className="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground">No Project Assignments</h3>
                      <p className="text-sm text-muted-foreground">This employee is not currently assigned to any projects.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Over & Beyond Initiatives */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                    Over & Beyond (Initiatives)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEmployee.initiatives.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEmployee.initiatives.map((initiative) => {
                        const completionRate = initiative.actualHours && initiative.estimatedHours 
                          ? (initiative.actualHours / initiative.estimatedHours) * 100 
                          : 0
                        
                        return (
                          <div key={initiative.id} className="border rounded-lg p-4">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-semibold">{initiative.title}</h4>
                                  {initiative.category && (
                                    <Badge variant="outline" className="text-xs">
                                      {initiative.category}
                                    </Badge>
                                  )}
                                </div>
                                {initiative.description && (
                                  <p className="text-sm text-muted-foreground line-clamp-2">{initiative.description}</p>
                                )}
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge 
                                  variant="outline"
                                  className={initiative.status === 'ACTIVE' || initiative.status === 'active' 
                                    ? 'border-green-500 text-green-700' 
                                    : initiative.status === 'COMPLETED' || initiative.status === 'completed'
                                    ? 'border-blue-500 text-blue-700'
                                    : ''}
                                >
                                  {initiative.status}
                                </Badge>
                                <Badge 
                                  variant="outline"
                                  className={initiative.priority === 'high' 
                                    ? 'border-red-500 text-red-700' 
                                    : initiative.priority === 'medium'
                                    ? 'border-yellow-500 text-yellow-700'
                                    : 'border-gray-500 text-gray-700'}
                                >
                                  {initiative.priority}
                                </Badge>
                              </div>
                            </div>
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-sm text-muted-foreground">Workload: </span>
                                    <span className="text-sm font-medium">{initiative.workloadPercentage}%</span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Target className="h-4 w-4 text-muted-foreground" />
                                  <div>
                                    <span className="text-sm text-muted-foreground">Est. Hours: </span>
                                    <span className="text-sm font-medium">{initiative.estimatedHours}h</span>
                                  </div>
                                </div>
                                {initiative.dueDate && (
                                  <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <span className="text-sm text-muted-foreground">Due Date: </span>
                                      <span className="text-sm font-medium">
                                        {new Date(initiative.dueDate).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                )}
                                {initiative.actualHours && (
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <div>
                                      <span className="text-sm text-muted-foreground">Actual Hours: </span>
                                      <span className="text-sm font-medium">{initiative.actualHours}h</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              {initiative.estimatedHours > 0 && (
                                <div className="mt-3">
                                  <div className="flex justify-between text-sm mb-2">
                                    <span>Progress ({initiative.estimatedHours}h estimated)</span>
                                    <span>{completionRate.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={completionRate} className="h-2" />
                                </div>
                              )}
                              <div className="mt-2">
                                <Progress value={initiative.workloadPercentage} className="h-2" />
                                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                  <span>Workload: {initiative.workloadPercentage}%</span>
                                  <span>Cap: {selectedEmployee.overBeyondCap}%</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-muted-foreground">No Over & Beyond Initiatives</h3>
                      <p className="text-sm text-muted-foreground">
                        This employee is not currently assigned to any Over & Beyond initiatives.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
