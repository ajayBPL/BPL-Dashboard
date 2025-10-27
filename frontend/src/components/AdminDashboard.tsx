import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { apiService } from '../services/api'
import { centralizedDb, CentralizedUser } from '../utils/centralizedDb'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { 
  normalizeRole, 
  isAdmin, 
  isManager, 
  isProgramManager, 
  isRdManager,
  canManageUsers,
  canAccessAnalytics,
  getRoleDisplayName,
  getRoleColorClasses,
  UserRole
} from '../utils/roleUtils'
import { DashboardAnalytics } from './DashboardAnalytics'
import { ActivityFeed } from './ActivityFeed'
import { ExportSystem } from './ExportSystem'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Badge } from './ui/badge'
import { Alert, AlertDescription } from './ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Switch } from './ui/switch'
import { Avatar, AvatarFallback } from './ui/avatar'
import { SearchableSelect, SearchableSelectOption } from './ui/searchable-select'
import { 
  Users, 
  UserPlus, 
  Activity, 
  Building, 
  Info, 
  Eye, 
  EyeOff,
  Download,
  Search,
  Filter,
  Shield,
  Clock,
  Mail,
  Phone,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'

export function AdminDashboard() {
  const [users, setUsers] = useState<CentralizedUser[]>([])
  const [filteredUsers, setFilteredUsers] = useState<CentralizedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [showExportSystem, setShowExportSystem] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [activeTab, setActiveTab] = useState('users')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showRoleManagement, setShowRoleManagement] = useState(false)
  const [showDepartmentManagement, setShowDepartmentManagement] = useState(false)
  const [newRole, setNewRole] = useState({ name: '', description: '', permissions: [] as string[] })
  const [newDepartment, setNewDepartment] = useState({ name: '', description: '', headId: '' })
  const [customRoles, setCustomRoles] = useState<any[]>([])
  const [customDepartments, setCustomDepartments] = useState<any[]>([])
  const [subordinateEmployees, setSubordinateEmployees] = useState<any[]>([])
  const [selectedManager, setSelectedManager] = useState<string>('all')
  const { user: currentUser } = useAuth()

  // Get subordinate managers (managers who report to current user)
  const getSubordinateManagers = () => {
    if (!currentUser) return []
    
    // For admins, program managers, and R&D managers, get all managers who report to them
    if (isAdmin(currentUser) || isProgramManager(currentUser) || isRdManager(currentUser)) {
      return users.filter(user => 
        user.managerId === currentUser.id && 
        isManager(user)
      )
    }
    return []
  }

  // Get employees under a specific manager
  const getEmployeesUnderManager = (managerId: string) => {
    return users.filter(user => 
      user.managerId === managerId && 
      normalizeRole(user.role) === 'employee'
    )
  }

  // Get all employees under subordinate managers
  const getAllSubordinateEmployees = () => {
    const subordinateManagers = getSubordinateManagers()
    const allEmployees: any[] = []
    
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

  // Load custom roles and departments from API
  const loadCustomRoles = async () => {
    try {
      console.log('🔄 Loading custom roles...');
      const response = await apiService.request('/roles');
      console.log('📡 Roles API response:', response);
      console.log('🔍 response.data type:', typeof response.data);
      console.log('🔍 response.data is array?:', Array.isArray(response.data));
      console.log('🔍 response.data keys:', response.data ? Object.keys(response.data) : 'null');
      console.log('🔍 Full response.data:', JSON.stringify(response.data));
      
      if (response.success && response.data) {
        // The API might return data in different formats, let's handle them all
        let rolesData = [];
        
        if (Array.isArray(response.data)) {
          rolesData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Check if data has a nested array property
          const dataObj = response.data as any;
          rolesData = dataObj.roles || dataObj.data || [];
        }
        
        console.log('✅ Setting custom roles:', rolesData.length, 'roles:', rolesData.map((r: any) => r?.name || 'unnamed'));
        setCustomRoles(rolesData);
        
        // Verify state update
        setTimeout(() => {
          console.log('🔍 Verification: customRoles state should now have', rolesData.length, 'items');
        }, 100);
      } else {
        console.error('❌ Failed to load roles:', response.error || 'No data in response');
        setCustomRoles([]);
      }
    } catch (error) {
      console.error('🚨 Error loading custom roles:', error);
      setCustomRoles([]);
    }
  };

  const loadCustomDepartments = async () => {
    try {
      console.log('🔄 Loading custom departments...');
      const response = await apiService.request('/departments');
      console.log('📡 Departments API response:', response);
      console.log('🔍 response.data type:', typeof response.data);
      console.log('🔍 response.data is array?:', Array.isArray(response.data));
      console.log('🔍 Full response.data:', JSON.stringify(response.data));
      
      if (response.success && response.data) {
        // The API might return data in different formats, let's handle them all
        let deptsData = [];
        
        if (Array.isArray(response.data)) {
          deptsData = response.data;
        } else if (typeof response.data === 'object' && response.data !== null) {
          // Check if data has a nested array property
          const dataObj = response.data as any;
          deptsData = dataObj.departments || dataObj.data || [];
        }
        
        console.log('✅ Setting custom departments:', deptsData.length, 'departments:', deptsData.map((d: any) => d?.name || 'unnamed'));
        setCustomDepartments(deptsData);
        
        // Verify state update
        setTimeout(() => {
          console.log('🔍 Verification: customDepartments state should now have', deptsData.length, 'items');
        }, 100);
      } else {
        console.error('❌ Failed to load departments:', response.error || 'No data in response');
        setCustomDepartments([]);
      }
    } catch (error) {
      console.error('🚨 Error loading custom departments:', error);
      setCustomDepartments([]);
    }
  };

  // Enhanced form state
  const [formData, setFormData] = useState({
    email: '',
    password: '', // Remove hardcoded password - require user to set it
    name: '',
    employeeId: '',
    role: '',
    designation: '',
    managerId: '',
    department: '',
    skills: '',
    phoneNumber: '',
    notificationSettings: {
      email: true,
      inApp: true,
      projectUpdates: true,
      deadlineReminders: true,
      weeklyReports: false
    }
  })

  useEffect(() => {
    console.log('AdminDashboard mounted, loading data...')
    fetchUsers()
    loadCustomRoles()
    loadCustomDepartments()
  }, [])

  // Debug: Log customRoles whenever it changes
  useEffect(() => {
    console.log('🔥 customRoles updated:', customRoles.length, 'items:', customRoles.map(r => r.name))
  }, [customRoles])

  // Debug: Log customDepartments whenever it changes
  useEffect(() => {
    console.log('🔥 customDepartments updated:', customDepartments.length, 'items:', customDepartments.map(d => d.name))
  }, [customDepartments])

  useEffect(() => {
    if (users.length > 0 && currentUser) {
      const subordinateEmployees = getAllSubordinateEmployees()
      setSubordinateEmployees(subordinateEmployees)
    }
  }, [users, currentUser])

  // Prepare role options for SearchableSelect
  const roleOptions: SearchableSelectOption[] = React.useMemo(() => {
    const builtInRoles: SearchableSelectOption[] = [
      { value: 'admin', label: 'Admin', group: 'Built-in Roles' },
      { value: 'program_manager', label: 'Program Manager', group: 'Built-in Roles' },
      { value: 'rd_manager', label: 'R&D Manager', group: 'Built-in Roles' },
      { value: 'manager', label: 'Team Manager', group: 'Built-in Roles' },
      { value: 'employee', label: 'Employee', group: 'Built-in Roles' },
    ]

    const customRoleOptions: SearchableSelectOption[] = customRoles.map((role) => ({
      value: role.name,
      label: role.name,
      description: role.description,
      group: 'Custom Roles',
    }))

    return [...builtInRoles, ...customRoleOptions]
  }, [customRoles])

  // Prepare department options for SearchableSelect
  const departmentOptions: SearchableSelectOption[] = React.useMemo(() => {
    const builtInDepts: SearchableSelectOption[] = [
      { value: 'Engineering', label: 'Engineering', group: 'Built-in Departments' },
      { value: 'Product Management', label: 'Product Management', group: 'Built-in Departments' },
      { value: 'Marketing', label: 'Marketing', group: 'Built-in Departments' },
      { value: 'Sales', label: 'Sales', group: 'Built-in Departments' },
      { value: 'Operations', label: 'Operations', group: 'Built-in Departments' },
      { value: 'HR', label: 'Human Resources', group: 'Built-in Departments' },
      { value: 'Finance', label: 'Finance', group: 'Built-in Departments' },
      { value: 'R&D', label: 'Research & Development', group: 'Built-in Departments' },
    ]

    const customDeptOptions: SearchableSelectOption[] = customDepartments.map((dept) => ({
      value: dept.name,
      label: dept.name,
      description: dept.description,
      group: 'Custom Departments',
    }))

    return [...builtInDepts, ...customDeptOptions]
  }, [customDepartments])

  useEffect(() => {
    filterUsers()
  }, [users, searchQuery, roleFilter, statusFilter])

  const fetchUsers = useCallback(async () => {
    try {
      // Get the access token from localStorage
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      const response = await fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
        headers: getDefaultHeaders(token)
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      if (data.success && data.data) {
        // Convert API response to match the expected format
        const usersData = data.data.map((user: any) => ({
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
        setUsers(usersData)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
      // Fallback to demo data if API fails
      const usersData = centralizedDb.getUsers()
      setUsers(usersData)
    } finally {
      setLoading(false)
    }
  }, []) // Empty dependency array since fetchUsers doesn't depend on any props/state

  const filterUsers = useCallback(() => {
    let filtered = [...users]

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(user =>
        (user.name?.toLowerCase() || '').includes(query) ||
        (user.email?.toLowerCase() || '').includes(query) ||
        (user.designation?.toLowerCase() || '').includes(query) ||
        (user.department?.toLowerCase() || '').includes(query) ||
        (user.skills || []).some(skill => (skill?.toLowerCase() || '').includes(query))
      )
    }

    // Apply role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter)
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(user => 
        statusFilter === 'active' ? user.isActive === true : user.isActive === false
      )
    }

    setFilteredUsers(filtered)
  }, [users, searchQuery, roleFilter, statusFilter]) // Add dependencies

  const handleCreateRole = async () => {
    if (!newRole.name.trim()) {
      toast.error('Role name is required')
      return
    }

    try {
      console.log('Creating role:', newRole);
      const response = await apiService.request('/roles', {
        method: 'POST',
        body: JSON.stringify(newRole)
      });
      console.log('Create role API response:', response);

      if (response.success) {
        toast.success(`Role "${newRole.name}" created successfully!`)
        
        // Reload custom roles
        await loadCustomRoles();
        
        // Auto-select the newly created role in the form (use the actual role name, not transformed)
        updateFormField('role', (response.data as any).name)
        
        setNewRole({ name: '', description: '', permissions: [] })
        setShowRoleManagement(false)
      } else {
        toast.error(response.error || 'Failed to create role')
      }
    } catch (error) {
      console.error('Error creating role:', error)
      toast.error('Failed to create role')
    }
  }

  const handleCreateDepartment = async () => {
    if (!newDepartment.name.trim()) {
      toast.error('Department name is required')
      return
    }

    try {
      console.log('Creating department:', newDepartment);
      const response = await apiService.request('/departments', {
        method: 'POST',
        body: JSON.stringify(newDepartment)
      });
      console.log('Create department API response:', response);

      if (response.success) {
        toast.success(`Department "${newDepartment.name}" created successfully!`)
        
        // Reload custom departments
        await loadCustomDepartments();
        
        // Auto-select the newly created department in the form (use the actual department name from API)
        updateFormField('department', (response.data as any).name)
        
        setNewDepartment({ name: '', description: '', headId: '' })
        setShowDepartmentManagement(false)
      } else {
        toast.error(response.error || 'Failed to create department')
      }
    } catch (error) {
      console.error('Error creating department:', error)
      toast.error('Failed to create department')
    }
  }

  const resetForm = () => {
    setFormData({
      email: '',
      password: 'defaultpass123',
      name: '',
      employeeId: '',
      role: '',
      designation: '',
      managerId: '',
      department: '',
      skills: '',
      phoneNumber: '',
      notificationSettings: {
        email: true,
        inApp: true,
        projectUpdates: true,
        deadlineReminders: true,
        weeklyReports: false
      }
    })
  }


  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!currentUser) return

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        toast.error('Please enter a valid email address')
        return
      }

      // Validate phone number format
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/
      if (!phoneRegex.test(formData.phoneNumber)) {
        toast.error('Please enter a valid phone number (e.g., +1234567890 or 1234567890)')
        return
      }

      // Validate employee ID format
      const employeeIdRegex = /^[A-Z0-9]{3,10}$/
      if (!employeeIdRegex.test(formData.employeeId)) {
        toast.error('Employee ID must be 3-10 alphanumeric characters (uppercase letters and numbers only)')
        return
      }

      // Check if user with email already exists
      const existingUser = users.find(u => u.email === formData.email)
      if (existingUser) {
        toast.error('A user with this email already exists')
        return
      }

      // Check if employee ID already exists
      const existingEmployeeId = users.find(u => u.employeeId === formData.employeeId)
      if (existingEmployeeId) {
        toast.error('An employee with this ID already exists. Please use a different Employee ID.')
        return
      }

      // Get the access token
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      // Prepare user data for API
      const userData = {
        email: formData.email,
        name: formData.name,
        employeeId: formData.employeeId,
        password: formData.password || 'password123',
        role: formData.role, // Send role as-is, backend will handle case conversion
        designation: formData.designation,
        managerId: formData.managerId || undefined,
        department: formData.department || 'General',
        skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
        phoneNumber: formData.phoneNumber || undefined,
        notificationSettings: formData.notificationSettings
      }

      console.log('🌐 Creating user via API:', userData)

      // Make API call to create user
      const response = await fetch(API_ENDPOINTS.USERS, {
        method: 'POST',
        headers: getDefaultHeaders(token),
        body: JSON.stringify({
          action: 'create',
          data: userData
        })
      })

      const data = await response.json()
      console.log('📡 API Response:', response.status, data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (data.success && data.data) {
        // Convert API response to match the expected format
        const newUser: CentralizedUser = {
          id: data.data.id,
          email: data.data.email,
          name: data.data.name,
          employeeId: formData.employeeId,
          role: data.data.role,
          designation: data.data.designation,
          managerId: data.data.managerId,
          department: data.data.department,
          skills: userData.skills,
          workloadCap: data.data.workloadCap || 100,
          overBeyondCap: data.data.overBeyondCap || 20,
          phoneNumber: userData.phoneNumber,
          notificationSettings: data.data.notificationSettings || userData.notificationSettings,
          isActive: true,
          password: formData.password, // Add password for type compatibility
          createdAt: data.data.createdAt || new Date().toISOString()
        }

        setUsers([...users, newUser])
        toast.success(`User "${newUser.name}" created successfully! Login: ${newUser.email} / ${formData.password}`)

        // Record an admin-only credential notification for the popup system
        try {
          const adminNoticeStoreKey = 'bpl-admin-notifications'
          const existing = JSON.parse(localStorage.getItem(adminNoticeStoreKey) || '[]')
          existing.unshift({
            id: `cred-${Date.now()}`,
            type: 'system',
            title: 'New User Credentials',
            message: `User ID: ${newUser.email}  Password: ${formData.password}`,
            priority: 'high',
            read: false,
            createdAt: new Date().toISOString()
          })
          localStorage.setItem(adminNoticeStoreKey, JSON.stringify(existing.slice(0, 200)))
        } catch {}
        
        resetForm()
        setShowAddUser(false)
      }
    } catch (error) {
      console.error('Error adding user:', error)
      toast.error(`Failed to add user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const toggleUserStatus = async (userId: string) => {
    if (!currentUser) return
    
    const user = users.find(u => u.id === userId)
    if (!user) return

    try {
      // Get the access token
      const token = localStorage.getItem('bpl-token')
      if (!token) {
        toast.error('No authentication token found')
        return
      }

      const action = user.isActive ? 'deactivate' : 'activate'
      console.log(`🌐 ${action}ing user ${user.email}`)

      // Make API call to update user status using the action-based endpoint
      const response = await fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
        method: 'POST',
        headers: getDefaultHeaders(token),
        body: JSON.stringify({
          action: action,
          id: userId
        })
      })

      const data = await response.json()
      console.log('📡 API Response:', response.status, data)

      if (!response.ok) {
        throw new Error(data.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      if (data.success) {
        // Update the user in the local state based on the action performed
        const newActiveStatus = action === 'activate'
        console.log(`✅ User ${user.email}: ${user.isActive} -> ${newActiveStatus}`)
        
        const updatedUser: CentralizedUser = {
          ...user,
          isActive: newActiveStatus
        }
        
        setUsers(users.map(u => u.id === userId ? updatedUser : u))
        toast.success(`User ${action === 'activate' ? 'activated' : 'deactivated'} successfully`)
      }
    } catch (error) {
      console.error('Error toggling user status:', error)
      toast.error(`Failed to ${user.isActive ? 'deactivate' : 'activate'} user: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleClearFilters = () => {
    setSearchQuery('')
    setRoleFilter('all')
    setStatusFilter('all')
  }

  const updateFormField = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as object),
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({ ...prev, [field]: value }))
    }
  }

  const managers = users.filter(user => isManager(user))

  const getRoleDisplay = (role: string) => {
    return getRoleDisplayName(role)
  }

  const hasActiveFilters = searchQuery || roleFilter !== 'all' || statusFilter !== 'all'

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">System administration and analytics, welcome {currentUser?.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setShowExportSystem(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
          <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="cursor-pointer hover:shadow-md" onClick={() => { setActiveTab('users'); setRoleFilter('all'); setStatusFilter('all'); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => { setActiveTab('users'); setRoleFilter('admin'); setStatusFilter('active'); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Admins</p>
                <p className="text-2xl font-bold text-red-600">{users.filter(u => u.role === 'admin' && u.isActive === true).length}</p>
              </div>
              <Shield className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => { setActiveTab('users'); setRoleFilter('manager'); setStatusFilter('active'); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Managers</p>
                <p className="text-2xl font-bold text-blue-600">
                  {users.filter(u => ['program_manager', 'rd_manager', 'manager'].includes(u.role) && u.isActive === true).length}
                </p>
              </div>
              <Building className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="cursor-pointer hover:shadow-md" onClick={() => { setActiveTab('users'); setRoleFilter('employee'); setStatusFilter('active'); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Employees</p>
                <p className="text-2xl font-bold text-green-600">{users.filter(u => (u.role === 'employee' || u.role === 'rd_manager') && u.isActive === true).length}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:shadow-md" onClick={() => { setActiveTab('users'); setStatusFilter('active'); }}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Users</p>
                <p className="text-2xl font-bold text-primary">{users.filter(u => u.isActive === true).length}</p>
              </div>
              <Clock className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <div className="space-y-6">
        <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-lg p-1 border">
          <div className="flex flex-row items-center justify-between gap-1">
            <button
              onClick={() => setActiveTab('users')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'users' 
                  ? 'bg-blue-600 text-black shadow-lg font-semibold border-2 border-blue-700' 
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              Users ({users.length})
            </button>
            {(isAdmin(currentUser) || isProgramManager(currentUser) || isRdManager(currentUser)) && (
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                  activeTab === 'hierarchy' 
                    ? 'bg-blue-600 text-black shadow-lg font-semibold border-2 border-blue-700' 
                    : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
                }`}
              >
                Team Hierarchy ({subordinateEmployees.length})
              </button>
            )}
            <button
              onClick={() => setActiveTab('departments')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'departments' 
                  ? 'bg-blue-600 text-black shadow-lg font-semibold border-2 border-blue-700' 
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'analytics' 
                  ? 'bg-blue-600 text-black shadow-lg font-semibold border-2 border-blue-700' 
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveTab('activity')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-all ${
                activeTab === 'activity' 
                  ? 'bg-blue-600 text-black shadow-lg font-semibold border-2 border-blue-700' 
                  : 'text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              Activity
            </button>
          </div>
        </div>

        {activeTab === 'users' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                System Users
              </CardTitle>
              <CardDescription>
                Manage all users in the BPL Commander system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filter Controls */}
              <div className="space-y-4 mb-6">
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search users by name, email, department, or skills..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Select value={roleFilter} onValueChange={setRoleFilter}>
                      <SelectTrigger className="w-40">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Roles</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="program_manager">Program Manager</SelectItem>
                        <SelectItem value="rd_manager">R&D Manager</SelectItem>
                        <SelectItem value="manager">Team Manager</SelectItem>
                        <SelectItem value="employee">Employee</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-32">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                {hasActiveFilters && (
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Showing {filteredUsers.length} of {users.length} users
                    </span>
                    <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                      Clear filters
                    </Button>
                  </div>
                )}
              </div>

              {/* Users List */}
              <div className="space-y-4">
                {filteredUsers.map((user) => {
                  const workload = centralizedDb.getEmployeeWorkload(user.id)
                  
                  return (
                    <div key={user.id} className="flex items-center justify-between p-6 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                          <span className="font-medium text-primary">{user.name.charAt(0)}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">{user.name}</p>
                            <Badge className={getRoleColorClasses(user.role)}>
                              {getRoleDisplay(user.role)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {user.email}
                            </div>
                            {user.phoneNumber && (
                              <div className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {user.phoneNumber}
                              </div>
                            )}
                            {user.department && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {user.department}
                              </div>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{user.designation}</p>
                          {user.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {user.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{user.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        {/* Workload indicator for employees */}
                        {(user.role === 'employee' || user.role === 'manager' || user.role === 'rd_manager') && (
                          <div className="text-right text-sm">
                            <p className="text-muted-foreground">Workload</p>
                            <p className={`font-medium ${
                              workload.totalWorkload > 100 ? 'text-red-600' :
                              workload.totalWorkload > 80 ? 'text-yellow-600' : 'text-green-600'
                            }`}>
                              {workload.totalWorkload.toFixed(1)}%
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => toggleUserStatus(user.id)}
                            disabled={user.id === currentUser?.id}
                          />
                          <Badge variant={user.isActive ? "default" : "secondary"}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  )
                })}

                {filteredUsers.length === 0 && users.length > 0 && (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No users match your filters</h3>
                    <p className="text-muted-foreground mb-4">Try adjusting your search or filter criteria</p>
                    <Button variant="outline" onClick={handleClearFilters}>
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {activeTab === 'hierarchy' && (
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
                        <Card key={employee.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="font-medium">
            {employee.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
                              <div>
                                <h4 className="font-medium">{employee.name}</h4>
                                <p className="text-sm text-muted-foreground">{employee.email}</p>
                                <p className="text-sm text-muted-foreground">
                                  Reports to: {employee.managerName} ({getRoleDisplay(employee.managerRole)})
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-4">
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Workload</p>
                                <p className={`font-medium ${
                                  workload > 100 ? 'text-red-600' :
                                  workload > 80 ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                  {workload}%
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Department</p>
                                <p className="font-medium">{employee.department || 'Not assigned'}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-muted-foreground">Designation</p>
                                <p className="font-medium">{employee.designation || 'Not assigned'}</p>
                              </div>
                              <Badge variant="outline">
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
        )}

        {activeTab === 'departments' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Department Management
              </CardTitle>
              <CardDescription>
                Create and manage organizational departments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Current Departments */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Current Departments</h3>
                  <div className="grid gap-4">
                    {/* Demo departments - in real app, these would come from database */}
                    {[
                      { name: 'Engineering', description: 'Software development and technical teams', head: 'John Doe', userCount: 12 },
                      { name: 'Product Management', description: 'Product strategy and management', head: 'Jane Smith', userCount: 8 },
                      { name: 'Quality Assurance', description: 'Testing and quality control', head: 'Bob Johnson', userCount: 6 },
                      { name: 'DevOps', description: 'Infrastructure and deployment', head: 'Alice Brown', userCount: 4 },
                      { name: 'Research & Development', description: 'Innovation and new technology research', head: 'Charlie Wilson', userCount: 5 }
                    ].map((dept, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold">{dept.name}</h4>
                            <p className="text-sm text-muted-foreground">{dept.description}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <span className="text-sm">Head: {dept.head}</span>
                              <Badge variant="outline">{dept.userCount} members</Badge>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                            <Button variant="outline" size="sm" className="text-destructive">
                              Delete
                            </Button>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Create New Department */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Create New Department</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="dept-name">Department Name *</Label>
                          <Input
                            id="dept-name"
                            value={newDepartment.name}
                            onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="e.g., Engineering, Marketing"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="dept-head">Department Head</Label>
                          <Select
                            value={newDepartment.headId}
                            onValueChange={(value) => setNewDepartment(prev => ({ ...prev, headId: value }))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select department head" />
                            </SelectTrigger>
                            <SelectContent className="max-h-[300px] overflow-y-auto">
                              {managers.map((user) => (
                                <SelectItem key={user.id} value={user.id}>
                                  {user.name} ({getRoleDisplay(user.role)})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="dept-description">Description</Label>
                        <Textarea
                          id="dept-description"
                          value={newDepartment.description}
                          onChange={(e) => setNewDepartment(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="Brief description of the department's responsibilities"
                          rows={3}
                        />
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setNewDepartment({ name: '', description: '', headId: '' })}
                        >
                          Reset
                        </Button>
                        <Button
                          type="button"
                          onClick={handleCreateDepartment}
                          disabled={!newDepartment.name.trim()}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Create Department
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>
        )}

        {activeTab === 'analytics' && (
        <div className="space-y-6">
          <DashboardAnalytics />
        </div>
        )}

        {activeTab === 'activity' && (
        <div className="space-y-6">
          <ActivityFeed showUserFilter={true} maxItems={50} />
        </div>
        )}


        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>BPL Commander Admin:</strong> Manage users, projects, and system settings. 
            User data is stored in the database and persists across sessions. 
            New users can login with their credentials immediately after creation.
          </AlertDescription>
        </Alert>
      </div>

      {/* Add User Dialog */}
      <Dialog open={showAddUser} onOpenChange={setShowAddUser}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account in the BPL Commander system
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleAddUser} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => updateFormField('name', e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => updateFormField('email', e.target.value)}
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => updateFormField('employeeId', e.target.value)}
                  placeholder="e.g., EMP001, BPL2024001"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Unique employee identifier (cannot be repeated)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => updateFormField('password', e.target.value)}
                    required
                    minLength={8}
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>Password must contain:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>At least 8 characters</li>
                    <li>One uppercase letter</li>
                    <li>One lowercase letter</li>
                    <li>One number</li>
                    <li>One special character (@$!%*?&)</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Role and Organization */}
            <div className="space-y-4">
              <h3 className="font-medium">Role & Organization</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="role">Role *</Label>
                    {customRoles.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {customRoles.length} custom role{customRoles.length !== 1 ? 's' : ''} loaded
                      </span>
                    )}
                  </div>
                  <SearchableSelect
                    key={`role-select-${customRoles.length}`}
                    options={roleOptions}
                    value={formData.role}
                    onValueChange={(value) => {
                      console.log('🎯 Role selected:', value)
                      updateFormField('role', value)
                    }}
                    placeholder="Select role..."
                    searchPlaceholder="Search roles..."
                    emptyMessage="No role found."
                    onCreateNew={() => {
                      console.log('🆕 Opening role management')
                      setShowRoleManagement(true)
                    }}
                    createNewLabel="➕ Create New Role"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designation">Designation *</Label>
                  <Input
                    id="designation"
                    value={formData.designation}
                    onChange={(e) => updateFormField('designation', e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="department">Department</Label>
                    {customDepartments.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {customDepartments.length} custom dept{customDepartments.length !== 1 ? 's' : ''} loaded
                      </span>
                    )}
                  </div>
                  <SearchableSelect
                    key={`dept-select-${customDepartments.length}`}
                    options={departmentOptions}
                    value={formData.department}
                    onValueChange={(value) => {
                      console.log('🏢 Department selected:', value)
                      updateFormField('department', value)
                    }}
                    placeholder="Select department..."
                    searchPlaceholder="Search departments..."
                    emptyMessage="No department found."
                    onCreateNew={() => {
                      console.log('🆕 Opening department management')
                      setShowDepartmentManagement(true)
                    }}
                    createNewLabel="➕ Create New Department"
                  />
                </div>
                {(normalizeRole(formData.role) === 'employee' || normalizeRole(formData.role) === 'manager' || normalizeRole(formData.role) === 'rd_manager') && (
                  <div className="space-y-2">
                    <Label htmlFor="manager">Manager</Label>
                    <Select value={formData.managerId} onValueChange={(value) => updateFormField('managerId', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select manager (optional)" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px] overflow-y-auto">
                        {managers.map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>
                            {manager.name} ({getRoleDisplay(manager.role)})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="font-medium">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={(e) => updateFormField('phoneNumber', e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-4">
              <h3 className="font-medium">Skills</h3>
              <div className="space-y-2">
                <Label htmlFor="skills">Skills (comma-separated)</Label>
                <Textarea
                  id="skills"
                  value={formData.skills}
                  onChange={(e) => updateFormField('skills', e.target.value)}
                  placeholder="e.g., React, Node.js, Python, Project Management"
                  rows={2}
                />
              </div>
            </div>

            {/* Notification Settings */}
            <div className="space-y-4">
              <h3 className="font-medium">Notification Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Switch
                    id="email-notifications"
                    checked={formData.notificationSettings.email}
                    onCheckedChange={(checked) => updateFormField('notificationSettings.email', checked)}
                  />
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="in-app-notifications"
                    checked={formData.notificationSettings.inApp}
                    onCheckedChange={(checked) => updateFormField('notificationSettings.inApp', checked)}
                  />
                  <Label htmlFor="in-app-notifications">In-App Notifications</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="project-updates"
                    checked={formData.notificationSettings.projectUpdates}
                    onCheckedChange={(checked) => updateFormField('notificationSettings.projectUpdates', checked)}
                  />
                  <Label htmlFor="project-updates">Project Updates</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="deadline-reminders"
                    checked={formData.notificationSettings.deadlineReminders}
                    onCheckedChange={(checked) => updateFormField('notificationSettings.deadlineReminders', checked)}
                  />
                  <Label htmlFor="deadline-reminders">Deadline Reminders</Label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowAddUser(false)}>
                Cancel
              </Button>
              <Button type="submit">Create User</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Department Dialog */}
      <Dialog open={showDepartmentManagement} onOpenChange={setShowDepartmentManagement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogDescription>
              Define a new department with its head and responsibilities
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateDepartment(); }} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="deptName">Department Name *</Label>
                <Input
                  id="deptName"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                  placeholder="e.g., Engineering, Marketing, Sales"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="deptDescription">Description</Label>
                <Textarea
                  id="deptDescription"
                  value={newDepartment.description}
                  onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                  placeholder="Brief description of the department's responsibilities"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deptHead">Department Head (Optional)</Label>
                <Select
                  value={newDepartment.headId}
                  onValueChange={(value) => setNewDepartment({ ...newDepartment, headId: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department head" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px] overflow-y-auto">
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>
                        {manager.name} ({getRoleDisplay(manager.role)})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setNewDepartment({ name: '', description: '', headId: '' });
                  setShowDepartmentManagement(false);
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newDepartment.name.trim()}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Department
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={showRoleManagement} onOpenChange={setShowRoleManagement}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Role</DialogTitle>
            <DialogDescription>
              Define a new role with specific permissions and access levels
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={(e) => { e.preventDefault(); handleCreateRole(); }} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="roleName">Role Name *</Label>
                <Input
                  id="roleName"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="e.g., Senior Manager, Lead Developer"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="roleDescription">Description</Label>
                <Textarea
                  id="roleDescription"
                  value={newRole.description}
                  onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                  placeholder="Describe the role's responsibilities and scope"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    'user_management',
                    'project_management', 
                    'department_management',
                    'analytics_access',
                    'export_data',
                    'system_settings',
                    'role_management',
                    'notification_management'
                  ].map((permission) => (
                    <div key={permission} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={permission}
                        checked={newRole.permissions.includes(permission)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setNewRole({
                              ...newRole,
                              permissions: [...newRole.permissions, permission]
                            });
                          } else {
                            setNewRole({
                              ...newRole,
                              permissions: newRole.permissions.filter(p => p !== permission)
                            });
                          }
                        }}
                        className="rounded"
                      />
                      <Label htmlFor={permission} className="text-sm">
                        {permission.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-2 pt-4 border-t">
              <Button type="button" variant="outline" onClick={() => setShowRoleManagement(false)}>
                Cancel
              </Button>
              <Button type="submit">Create Role</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

        <ExportSystem 
          isOpen={showExportSystem} 
          onClose={() => setShowExportSystem(false)} 
        />
      </div>
    )
  }
