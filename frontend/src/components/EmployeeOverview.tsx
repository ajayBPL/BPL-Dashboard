import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog'
import { 
  Users, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  Target,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User,
  Eye,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'

interface EmployeeProjectAssignment {
  projectId: string
  projectTitle: string
  projectStatus: string
  involvementPercentage: number
  role: string
  assignedDate: string
  startDate?: string
  endDate?: string
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
  totalWorkload: number
  availableCapacity: number
  overBeyondWorkload: number
}

export function EmployeeOverview() {
  const { user: currentUser } = useAuth()
  const [employees, setEmployees] = useState<EmployeeWithProjects[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeWithProjects[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'department' | 'workload' | 'projects'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
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
    if (canViewEmployees) {
      loadEmployeeData()
    }
  }, [canViewEmployees])

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

      const [usersResponse, projectsResponse] = await Promise.all([
        fetch(API_ENDPOINTS.USERS, {
          headers: getDefaultHeaders(token)
        }),
        fetch(API_ENDPOINTS.PROJECTS, {
          headers: getDefaultHeaders(token)
        })
      ])

      if (!usersResponse.ok || !projectsResponse.ok) {
        throw new Error('Failed to fetch data')
      }

      const usersData = await usersResponse.json()
      const projectsData = await projectsResponse.json()
      
      const users = usersData.data || []
      const projects = projectsData.data || []

      // Calculate employee workload and project assignments
      const employeeData: EmployeeWithProjects[] = users
        .filter((user: any) => user.role === 'employee' || user.role === 'manager')
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

          // Calculate total workload
          const totalWorkload = employeeProjects.reduce((total, project) => total + project.involvementPercentage, 0)
          const workloadCap = user.workloadCap || 100
          const availableCapacity = Math.max(0, workloadCap - totalWorkload)

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
            totalWorkload,
            availableCapacity,
            overBeyondWorkload: 0 // TODO: Calculate from initiatives if needed
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
      filtered = filtered.filter(emp => emp.role === roleFilter)
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

  const getWorkloadBadgeVariant = (workload: number, capacity: number) => {
    if (workload > capacity) return 'destructive'
    if (workload === capacity) return 'secondary'
    if (workload > capacity * 0.8) return 'outline'
    return 'default'
  }

  const uniqueRoles = [...new Set(employees.map(emp => emp.role))]
  const uniqueDepartments = [...new Set(employees.map(emp => emp.department))]

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

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <Card key={employee.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {employee.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold">{employee.name}</h3>
                    <p className="text-sm text-muted-foreground">{employee.designation}</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedEmployee(employee)
                    setShowDetails(true)
                  }}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Department:</span>
                  <p className="font-medium">{employee.department}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Role:</span>
                  <p className="font-medium">{employee.role}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Workload Capacity</span>
                  <span className={getWorkloadColor(employee.totalWorkload, employee.workloadCap)}>
                    {employee.totalWorkload.toFixed(1)}% / {employee.workloadCap}%
                  </span>
                </div>
                <Progress 
                  value={(employee.totalWorkload / employee.workloadCap) * 100} 
                  className="h-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Available: {employee.availableCapacity.toFixed(1)}%</span>
                  <span>{employee.projects.length} project{employee.projects.length !== 1 ? 's' : ''}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                <Badge variant={getWorkloadBadgeVariant(employee.totalWorkload, employee.workloadCap)}>
                  {employee.totalWorkload > employee.workloadCap ? 'Over Capacity' : 
                   employee.totalWorkload === employee.workloadCap ? 'At Capacity' :
                   employee.totalWorkload > employee.workloadCap * 0.8 ? 'High Load' : 'Available'}
                </Badge>
                {employee.projects.length > 0 && (
                  <Badge variant="outline">
                    {employee.projects.length} Project{employee.projects.length !== 1 ? 's' : ''}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
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
              {selectedEmployee?.name} - Project Assignments
            </DialogTitle>
            <DialogDescription>
              Detailed view of all project assignments and workload distribution
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
                  </div>
                </CardContent>
              </Card>

              {/* Workload Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Workload Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedEmployee.totalWorkload.toFixed(1)}%</div>
                      <div className="text-sm text-muted-foreground">Total Workload</div>
                    </div>
                    <div className="text-center">
                      <div className={`text-2xl font-bold ${getWorkloadColor(selectedEmployee.totalWorkload, selectedEmployee.workloadCap)}`}>
                        {selectedEmployee.availableCapacity.toFixed(1)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Available Capacity</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{selectedEmployee.projects.length}</div>
                      <div className="text-sm text-muted-foreground">Active Projects</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Workload Distribution</span>
                      <span>{selectedEmployee.totalWorkload.toFixed(1)}% / {selectedEmployee.workloadCap}%</span>
                    </div>
                    <Progress 
                      value={(selectedEmployee.totalWorkload / selectedEmployee.workloadCap) * 100} 
                      className="h-3"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Project Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Project Assignments</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedEmployee.projects.length > 0 ? (
                    <div className="space-y-4">
                      {selectedEmployee.projects.map((project) => (
                        <div key={project.projectId} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold">{project.projectTitle}</h4>
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
