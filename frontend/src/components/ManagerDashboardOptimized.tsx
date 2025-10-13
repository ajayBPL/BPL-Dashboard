import React, { memo, useMemo, useCallback, useReducer } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { CentralizedProject, CentralizedInitiative } from '../utils/centralizedDb'
import { API_ENDPOINTS, getDefaultHeaders } from '../utils/apiConfig'
import { ProjectCard } from './project/ProjectCard'
import { DashboardStats } from './project/DashboardStats'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'
import { Plus, Download, Target, Lightbulb } from 'lucide-react'

// Optimized state management with useReducer
interface DashboardState {
  data: {
    projects: CentralizedProject[]
    initiatives: CentralizedInitiative[]
    users: any[]
  }
  ui: {
    loading: boolean
    activeTab: string
    selectedProjectId: string | null
  }
  modals: {
    showCreateProject: boolean
    showCreateInitiative: boolean
    showExportSystem: boolean
  }
  filters: {
    searchQuery: string
    statusFilter: string
    priorityFilter: string
  }
}

type DashboardAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PROJECTS'; payload: CentralizedProject[] }
  | { type: 'SET_INITIATIVES'; payload: CentralizedInitiative[] }
  | { type: 'SET_USERS'; payload: any[] }
  | { type: 'SET_ACTIVE_TAB'; payload: string }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_STATUS_FILTER'; payload: string }
  | { type: 'TOGGLE_MODAL'; payload: keyof DashboardState['modals'] }

const initialState: DashboardState = {
  data: {
    projects: [],
    initiatives: [],
    users: []
  },
  ui: {
    loading: true,
    activeTab: 'projects',
    selectedProjectId: null
  },
  modals: {
    showCreateProject: false,
    showCreateInitiative: false,
    showExportSystem: false
  },
  filters: {
    searchQuery: '',
    statusFilter: 'all',
    priorityFilter: 'all'
  }
}

function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, ui: { ...state.ui, loading: action.payload } }
    case 'SET_PROJECTS':
      return { ...state, data: { ...state.data, projects: action.payload } }
    case 'SET_INITIATIVES':
      return { ...state, data: { ...state.data, initiatives: action.payload } }
    case 'SET_USERS':
      return { ...state, data: { ...state.data, users: action.payload } }
    case 'SET_ACTIVE_TAB':
      return { ...state, ui: { ...state.ui, activeTab: action.payload } }
    case 'SET_SEARCH_QUERY':
      return { ...state, filters: { ...state.filters, searchQuery: action.payload } }
    case 'SET_STATUS_FILTER':
      return { ...state, filters: { ...state.filters, statusFilter: action.payload } }
    case 'TOGGLE_MODAL':
      return { 
        ...state, 
        modals: { 
          ...state.modals, 
          [action.payload]: !state.modals[action.payload] 
        } 
      }
    default:
      return state
  }
}

// Custom hook for data fetching
function useDashboardData() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState)
  const { user: currentUser } = useAuth()

  const fetchData = useCallback(async () => {
    if (!currentUser) return

    dispatch({ type: 'SET_LOADING', payload: true })
    
    try {
      const token = localStorage.getItem('bpl-token')
      if (!token) return

      // Parallel API calls for better performance
      const [projectsResponse, usersResponse] = await Promise.all([
        fetch(API_ENDPOINTS.PROJECTS, {
          headers: getDefaultHeaders(token)
        }),
        fetch(`${API_ENDPOINTS.USERS}?limit=100`, {
          headers: getDefaultHeaders(token)
        })
      ])

      if (projectsResponse.ok && usersResponse.ok) {
        const projectsData = await projectsResponse.json()
        const usersData = await usersResponse.json()
        
        if (projectsData.success && projectsData.data) {
          dispatch({ type: 'SET_PROJECTS', payload: projectsData.data })
        }
        
        if (usersData.success && usersData.data) {
          dispatch({ type: 'SET_USERS', payload: usersData.data })
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [currentUser])

  return { state, dispatch, fetchData }
}

// Memoized filtered projects calculation
const useFilteredProjects = (projects: CentralizedProject[], filters: DashboardState['filters']) => {
  return useMemo(() => {
    return projects.filter(project => {
      const matchesSearch = project.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
                           project.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
      
      const matchesStatus = filters.statusFilter === 'all' || project.status === filters.statusFilter
      const matchesPriority = filters.priorityFilter === 'all' || project.priority === filters.priorityFilter
      
      return matchesSearch && matchesStatus && matchesPriority
    })
  }, [projects, filters])
}

// Memoized dashboard stats calculation
const useDashboardStats = (projects: CentralizedProject[]) => {
  return useMemo(() => {
    const totalProjects = projects.length
    const activeProjects = projects.filter(p => p.status === 'active').length
    const completedProjects = projects.filter(p => p.status === 'completed').length
    const totalBudget = projects.reduce((sum, p) => sum + (p.budget || 0), 0)
    
    return {
      totalProjects,
      activeProjects,
      completedProjects,
      totalBudget,
      completionRate: totalProjects > 0 ? (completedProjects / totalProjects) * 100 : 0
    }
  }, [projects])
}

// Optimized ManagerDashboard component
export const ManagerDashboard = memo(function ManagerDashboard() {
  const { state, dispatch, fetchData } = useDashboardData()
  const filteredProjects = useFilteredProjects(state.data.projects, state.filters)
  const stats = useDashboardStats(state.data.projects)

  // Memoized event handlers
  const handleSearchChange = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query })
  }, [])

  const handleStatusFilterChange = useCallback((status: string) => {
    dispatch({ type: 'SET_STATUS_FILTER', payload: status })
  }, [])

  const toggleModal = useCallback((modal: keyof DashboardState['modals']) => {
    dispatch({ type: 'TOGGLE_MODAL', payload: modal })
  }, [])

  // Load data on mount
  React.useEffect(() => {
    fetchData()
  }, [fetchData])

  if (state.ui.loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Manager Dashboard</h1>
        <div className="flex gap-2">
          <Button onClick={() => toggleModal('showCreateProject')}>
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
          <Button onClick={() => toggleModal('showExportSystem')}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <DashboardStats stats={stats} />

      {/* Main Content */}
      <Tabs value={state.ui.activeTab} onValueChange={(tab) => dispatch({ type: 'SET_ACTIVE_TAB', payload: tab })}>
        <TabsList>
          <TabsTrigger value="projects">
            <Target className="h-4 w-4 mr-2" />
            Projects ({filteredProjects.length})
          </TabsTrigger>
          <TabsTrigger value="initiatives">
            <Lightbulb className="h-4 w-4 mr-2" />
            Initiatives
          </TabsTrigger>
        </TabsList>

        <TabsContent value="projects" className="space-y-4">
          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id}
                project={project}
                onViewDetails={(id) => dispatch({ type: 'SET_SELECTED_PROJECT', payload: id })}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="initiatives">
          <Card>
            <CardHeader>
              <CardTitle>Initiatives</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">Initiative management coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
})
