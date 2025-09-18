import React, { useState, useEffect, useMemo } from 'react'
import { centralizedDb, CentralizedUser } from '../utils/centralizedDb'
import { useAuth } from '../contexts/AuthContext'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Progress } from './ui/progress'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { 
  Users, 
  Search, 
  Filter, 
  Calendar,
  Clock,
  Target,
  Award,
  Briefcase,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  User
} from 'lucide-react'
import { toast } from 'sonner'

interface EmployeeAvailability {
  user: CentralizedUser
  workload: {
    totalWorkload: number
    availableCapacity: number
    overBeyondWorkload: number
    projectCount: number
    initiativeCount: number
  }
  nextAvailable: string | null
  experienceLevel: 'Junior' | 'Mid-level' | 'Senior' | 'Lead'
  projectHistory: number
}

export function EmployeeManagement() {
  const { user: currentUser } = useAuth()
  const [employees, setEmployees] = useState<EmployeeAvailability[]>([])
  const [filteredEmployees, setFilteredEmployees] = useState<EmployeeAvailability[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'name' | 'role' | 'department' | 'experience' | 'availability' | 'skills'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('all')
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeAvailability | null>(null)

  // Check if current user can manage employees
  const canManageEmployees = currentUser && (
    currentUser.role === 'admin' || 
    currentUser.role === 'program_manager' || 
    currentUser.role === 'rd_manager' ||
    currentUser.role === 'manager'
  )

  useEffect(() => {
    if (canManageEmployees) {
      loadEmployeeData()
    }
  }, [canManageEmployees])

  useEffect(() => {
    filterAndSortEmployees()
  }, [employees, searchQuery, sortBy, sortOrder, roleFilter, departmentFilter, availabilityFilter])

  const loadEmployeeData = async () => {
    try {
      setLoading(true)
      
      // Fetch users from backend API
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        console.error('No authentication token found')
        return
      }

      const usersResponse = await fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
        headers: getDefaultHeaders(token)
      })

      if (!usersResponse.ok) {
        throw new Error(`HTTP ${usersResponse.status}: ${usersResponse.statusText}`)
      }

      const usersData = await usersResponse.json()
      if (!usersData.success || !usersData.data) {
        throw new Error('Failed to fetch users from API')
      }

      // Convert API response to match the expected format
      const users = usersData.data.map((user: any) => ({
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

      // Fetch projects from backend API
      const projectsResponse = await fetch(API_ENDPOINTS.PROJECTS, {
        headers: getDefaultHeaders(token)
      })

      let backendProjects: any[] = []
      if (projectsResponse.ok) {
        const projectsData = await projectsResponse.json()
        if (projectsData.success && projectsData.data) {
          backendProjects = projectsData.data
        }
      }

      // Fallback to centralizedDb if API fails
      const fallbackProjects = centralizedDb.getProjects()
      const initiatives = centralizedDb.getInitiatives()
      
      const employeeData: EmployeeAvailability[] = users
        .filter(user => user.role === 'employee' || user.role === 'manager')
        .map(user => {
          // Calculate workload from backend data
          const calculateWorkloadFromBackend = (employeeId: string) => {
            // Use backend projects data if available, otherwise fallback to centralizedDb
            const projectsToUse = backendProjects.length > 0 ? backendProjects : fallbackProjects
            
            // Calculate project workload from all projects (including pending, active, etc.)
            const projectWorkload = projectsToUse
              .filter((p: any) => p.status === 'ACTIVE' || p.status === 'active' || p.status === 'PENDING' || p.status === 'pending')
              .reduce((total: number, project: any) => {
                // Handle both backend format (assignments) and frontend format (assignedEmployees)
                const assignments = project.assignments || project.assignedEmployees || []
                const assignment = assignments.find((emp: any) => emp.employeeId === employeeId)
                return total + (assignment?.involvementPercentage || 0)
              }, 0)
            
            // Calculate over & beyond workload from initiatives
            const overBeyondWorkload = initiatives
              .filter(i => i.assignedTo === employeeId && i.status === 'active')
              .reduce((total, initiative) => total + initiative.workloadPercentage, 0)
            
            const totalWorkload = projectWorkload + overBeyondWorkload
            const workloadCap = user.workloadCap || 100
            const overBeyondCap = user.overBeyondCap || 20
            
            return {
              projectWorkload,
              overBeyondWorkload,
              totalWorkload,
              availableCapacity: Math.max(0, workloadCap - totalWorkload),
              overBeyondAvailable: Math.max(0, overBeyondCap - overBeyondWorkload)
            }
          }

          // Calculate user projects count
          const projectsToUse = backendProjects.length > 0 ? backendProjects : fallbackProjects
          const userProjects = projectsToUse.filter((p: any) => {
            const assignments = p.assignments || p.assignedEmployees || []
            return assignments.some((emp: any) => emp.employeeId === user.id)
          })
          const userInitiatives = initiatives.filter(i => i.assignedTo === user.id)
          
          const workload = calculateWorkloadFromBackend(user.id)
          
          // Calculate experience level based on project history and skills
          let experienceLevel: 'Junior' | 'Mid-level' | 'Senior' | 'Lead' = 'Junior'
          const skillCount = user.skills.length
          const projectCount = userProjects.length
          
          if (skillCount >= 8 && projectCount >= 15) {
            experienceLevel = 'Lead'
          } else if (skillCount >= 5 && projectCount >= 8) {
            experienceLevel = 'Senior'
          } else if (skillCount >= 3 && projectCount >= 3) {
            experienceLevel = 'Mid-level'
          }
          
          // Estimate next availability based on current workload
          let nextAvailable: string | null = null
          if (workload.availableCapacity < 20) {
            // If heavily loaded, estimate 2-4 weeks
            const weeksUntilAvailable = Math.ceil((100 - workload.availableCapacity) / 25)
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + (weeksUntilAvailable * 7))
            nextAvailable = futureDate.toISOString().split('T')[0]
          }
          
          return {
            user,
            workload: {
              ...workload,
              projectCount: userProjects.length,
              initiativeCount: userInitiatives.length
            },
            nextAvailable,
            experienceLevel,
            projectHistory: userProjects.length + userInitiatives.length
          }
        })
      
      setEmployees(employeeData)
    } catch (error) {
      console.error('Error loading employee data:', error)
      
      // Fallback to centralizedDb if API fails
      const fallbackUsers = centralizedDb.getUsers()
      const projects = centralizedDb.getProjects()
      const initiatives = centralizedDb.getInitiatives()
      
      const fallbackEmployeeData: EmployeeAvailability[] = fallbackUsers
        .filter(user => user.role === 'employee' || user.role === 'manager')
        .map(user => {
          const workload = centralizedDb.getEmployeeWorkload(user.id)
          const userProjects = projects.filter(p => 
            p.assignedEmployees.some(emp => emp.employeeId === user.id)
          )
          const userInitiatives = initiatives.filter(i => i.assignedTo === user.id)
          
          // Calculate experience level based on project history and skills
          let experienceLevel: 'Junior' | 'Mid-level' | 'Senior' | 'Lead' = 'Junior'
          const skillCount = user.skills.length
          const projectCount = userProjects.length
          
          if (skillCount >= 8 && projectCount >= 15) {
            experienceLevel = 'Lead'
          } else if (skillCount >= 5 && projectCount >= 8) {
            experienceLevel = 'Senior'
          } else if (skillCount >= 3 && projectCount >= 3) {
            experienceLevel = 'Mid-level'
          }
          
          // Estimate next availability based on current workload
          let nextAvailable: string | null = null
          if (workload.availableCapacity < 20) {
            // If heavily loaded, estimate 2-4 weeks
            const weeksUntilAvailable = Math.ceil((100 - workload.availableCapacity) / 25)
            const futureDate = new Date()
            futureDate.setDate(futureDate.getDate() + (weeksUntilAvailable * 7))
            nextAvailable = futureDate.toISOString().split('T')[0]
          }
          
          return {
            user,
            workload,
            nextAvailable,
            experienceLevel,
            projectHistory: userProjects.length + userInitiatives.length
          }
        })
      
      setEmployees(fallbackEmployeeData)
      toast.error('Using offline data - some information may be outdated')
    } finally {
      setLoading(false)
    }
  }

  const filterAndSortEmployees = () => {
    let filtered = [...employees]
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(emp => 
        emp.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.user.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        emp.user.skills.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    }
    
    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(emp => emp.user.role === roleFilter)
    }
    
    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.user.department === departmentFilter)
    }
    
    // Apply availability filter
    if (availabilityFilter !== 'all') {
      switch (availabilityFilter) {
        case 'available':
          filtered = filtered.filter(emp => emp.workload.availableCapacity >= 20)
          break
        case 'busy':
          filtered = filtered.filter(emp => emp.workload.availableCapacity < 20 && emp.workload.availableCapacity > 0)
          break
        case 'overloaded':
          filtered = filtered.filter(emp => emp.workload.totalWorkload > 100)
          break
      }
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0
      
      switch (sortBy) {
        case 'name':
          comparison = a.user.name.localeCompare(b.user.name)
          break
        case 'role':
          comparison = a.user.role.localeCompare(b.user.role)
          break
        case 'department':
          comparison = a.user.department.localeCompare(b.user.department)
          break
        case 'experience':
          const expOrder = { 'Junior': 1, 'Mid-level': 2, 'Senior': 3, 'Lead': 4 }
          comparison = expOrder[a.experienceLevel] - expOrder[b.experienceLevel]
          break
        case 'availability':
          comparison = b.workload.availableCapacity - a.workload.availableCapacity
          break
        case 'skills':
          comparison = b.user.skills.length - a.user.skills.length
          break
        default:
          comparison = 0
      }
      
      return sortOrder === 'asc' ? comparison : -comparison
    })
    
    setFilteredEmployees(filtered)
  }

  const getAvailabilityColor = (availability: number) => {
    if (availability >= 20) return 'text-green-600'
    if (availability > 0) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getExperienceBadgeColor = (level: string) => {
    switch (level) {
      case 'Junior': return 'bg-blue-100 text-blue-800'
      case 'Mid-level': return 'bg-green-100 text-green-800'
      case 'Senior': return 'bg-orange-100 text-orange-800'
      case 'Lead': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const uniqueRoles = useMemo(() => {
    return [...new Set(employees.map(emp => emp.user.role))]
  }, [employees])

  const uniqueDepartments = useMemo(() => {
    return [...new Set(employees.map(emp => emp.user.department))]
  }, [employees])

  if (!canManageEmployees) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h3>Access Denied</h3>
          <p className="text-muted-foreground">
            Only managers and administrators can access employee management.
          </p>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading employee data...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Employee Management</h2>
          <p className="text-muted-foreground">
            View and manage team members, their availability, and project assignments
          </p>
        </div>
        <Badge variant="outline" className="text-sm">
          {filteredEmployees.length} of {employees.length} employees
        </Badge>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex gap-4 items-center">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, email, department, or skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label>Sort By</Label>
                <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name</SelectItem>
                    <SelectItem value="role">Role</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="experience">Experience</SelectItem>
                    <SelectItem value="availability">Availability</SelectItem>
                    <SelectItem value="skills">Skills Count</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Order</Label>
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
                <Label>Role</Label>
                <Select value={roleFilter} onValueChange={setRoleFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Roles</SelectItem>
                    {uniqueRoles.map(role => (
                      <SelectItem key={role} value={role}>
                        {role.charAt(0).toUpperCase() + role.slice(1).replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Departments</SelectItem>
                    {uniqueDepartments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Availability</Label>
                <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="available">Available (20%+)</SelectItem>
                    <SelectItem value="busy">Busy (1-19%)</SelectItem>
                    <SelectItem value="overloaded">Overloaded (100%+)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <div className="grid gap-4">
        {filteredEmployees.map((empData) => (
          <Card key={empData.user.id} className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 flex-1">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {empData.user.name.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{empData.user.name}</h3>
                    <Badge className={getExperienceBadgeColor(empData.experienceLevel)}>
                      {empData.experienceLevel}
                    </Badge>
                    {empData.workload.totalWorkload > 100 && (
                      <Badge variant="destructive" className="text-xs">
                        Overloaded
                      </Badge>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Briefcase className="h-3 w-3" />
                      {empData.user.role.replace('_', ' ')}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {empData.user.department}
                    </span>
                    <span className="flex items-center gap-1">
                      <Award className="h-3 w-3" />
                      {empData.user.skills.length} skills
                    </span>
                    <span className="flex items-center gap-1">
                      <Target className="h-3 w-3" />
                      {empData.projectHistory} projects
                    </span>
                  </div>
                  
                  {/* Skills Preview */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {empData.user.skills.slice(0, 4).map((skill, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {skill}
                      </Badge>
                    ))}
                    {empData.user.skills.length > 4 && (
                      <Badge variant="outline" className="text-xs">
                        +{empData.user.skills.length - 4} more
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="text-right space-y-2 min-w-[200px]">
                <div>
                  <p className="text-sm font-medium">Availability</p>
                  <p className={`text-lg font-bold ${getAvailabilityColor(empData.workload.availableCapacity)}`}>
                    {empData.workload.availableCapacity.toFixed(1)}%
                  </p>
                </div>
                
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>Workload</span>
                    <span>{empData.workload.totalWorkload.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={Math.min(empData.workload.totalWorkload, 100)} 
                    className="h-2"
                  />
                </div>
                
                {empData.nextAvailable && (
                  <div className="text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 inline mr-1" />
                    Available: {new Date(empData.nextAvailable).toLocaleDateString()}
                  </div>
                )}
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setSelectedEmployee(empData)}
                    >
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        {empData.user.name} - Employee Profile
                      </DialogTitle>
                      <DialogDescription>
                        Detailed information about employee availability and project history
                      </DialogDescription>
                    </DialogHeader>
                    
                    {selectedEmployee && (
                      <div className="grid gap-6">
                        {/* Contact & Basic Info */}
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label className="font-medium">Contact Information</Label>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center gap-2">
                                <Mail className="h-3 w-3" />
                                {selectedEmployee.user.email}
                              </div>
                              {selectedEmployee.user.phoneNumber && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {selectedEmployee.user.phoneNumber}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="font-medium">Work Information</Label>
                            <div className="space-y-1 text-sm">
                              <div>Role: {selectedEmployee.user.role.replace('_', ' ')}</div>
                              <div>Department: {selectedEmployee.user.department}</div>
                              <div>Experience: {selectedEmployee.experienceLevel}</div>
                              <div>Workload Cap: {selectedEmployee.user.workloadCap}%</div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Workload Details */}
                        <div className="space-y-2">
                          <Label className="font-medium">Current Workload</Label>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Project Workload</span>
                                <span>{(selectedEmployee.workload.totalWorkload - selectedEmployee.workload.overBeyondWorkload).toFixed(1)}%</span>
                              </div>
                              <Progress value={selectedEmployee.workload.totalWorkload - selectedEmployee.workload.overBeyondWorkload} className="h-2" />
                            </div>
                            <div>
                              <div className="flex justify-between text-sm mb-1">
                                <span>Over & Beyond</span>
                                <span>{selectedEmployee.workload.overBeyondWorkload.toFixed(1)}%</span>
                              </div>
                              <Progress value={selectedEmployee.workload.overBeyondWorkload} className="h-2" />
                            </div>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Available Capacity: {selectedEmployee.workload.availableCapacity.toFixed(1)}%
                          </div>
                        </div>
                        
                        {/* Skills */}
                        <div className="space-y-2">
                          <Label className="font-medium">Skills ({selectedEmployee.user.skills.length})</Label>
                          <div className="flex flex-wrap gap-2">
                            {selectedEmployee.user.skills.map((skill, index) => (
                              <Badge key={index} variant="outline">
                                {skill}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        
                        {/* Project History Summary */}
                        <div className="space-y-2">
                          <Label className="font-medium">Project Summary</Label>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-semibold">{selectedEmployee.workload.projectCount}</div>
                              <div className="text-muted-foreground">Active Projects</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-semibold">{selectedEmployee.workload.initiativeCount}</div>
                              <div className="text-muted-foreground">Initiatives</div>
                            </div>
                            <div className="text-center p-2 bg-muted rounded">
                              <div className="font-semibold">{selectedEmployee.projectHistory}</div>
                              <div className="text-muted-foreground">Total History</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </Card>
        ))}

        {filteredEmployees.length === 0 && (
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3>No employees found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
