// Real-Time Progress Component
// Displays live progress updates with WebSocket integration

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card'
import { Badge } from '../components/ui/badge'
import { Progress } from '../components/ui/progress'
import { Button } from '../components/ui/button'
import { 
  Activity, 
  TrendingUp, 
  Clock, 
  Users, 
  CheckCircle,
  AlertTriangle,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useWebSocket, useProjectRealtime } from '../hooks/useWebSocket'
import { toast } from 'sonner'

interface ProjectProgressData {
  projectId: string
  progress: number
  completedMilestones: number
  totalMilestones: number
  updatedAt: string
}

interface RealTimeProgressProps {
  projectId: string
  projectName: string
  initialProgress?: number
  initialMilestones?: { completed: number; total: number }
}

export function RealTimeProgress({ 
  projectId, 
  projectName, 
  initialProgress = 0,
  initialMilestones = { completed: 0, total: 0 }
}: RealTimeProgressProps) {
  const [progress, setProgress] = useState(initialProgress)
  const [milestones, setMilestones] = useState(initialMilestones)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [isConnected, setIsConnected] = useState(false)

  const { 
    isConnected: wsConnected, 
    projectUpdates, 
    collaborators 
  } = useProjectRealtime(projectId)

  // Update progress when real-time data arrives
  useEffect(() => {
    if (projectUpdates && projectUpdates.projectId === projectId) {
      setProgress(projectUpdates.progress)
      setMilestones({
        completed: projectUpdates.completedMilestones,
        total: projectUpdates.totalMilestones
      })
      setLastUpdate(projectUpdates.updatedAt)
      
      // Show toast notification for significant progress changes
      if (Math.abs(projectUpdates.progress - progress) >= 10) {
        toast.success(`Project "${projectName}" progress updated to ${projectUpdates.progress}%`)
      }
    }
  }, [projectUpdates, projectId, projectName, progress])

  // Update connection status
  useEffect(() => {
    setIsConnected(wsConnected)
  }, [wsConnected])

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-green-500'
    if (progress >= 60) return 'bg-yellow-500'
    if (progress >= 40) return 'bg-blue-500'
    return 'bg-red-500'
  }

  const getProgressStatus = (progress: number) => {
    if (progress >= 90) return { text: 'Almost Complete', color: 'text-green-600' }
    if (progress >= 70) return { text: 'On Track', color: 'text-blue-600' }
    if (progress >= 50) return { text: 'In Progress', color: 'text-yellow-600' }
    if (progress >= 25) return { text: 'Getting Started', color: 'text-orange-600' }
    return { text: 'Just Started', color: 'text-red-600' }
  }

  const status = getProgressStatus(progress)

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">{projectName}</CardTitle>
            <CardDescription>Real-time progress tracking</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            {/* Connection Status */}
            <div className="flex items-center space-x-1">
              {isConnected ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-500" />
              )}
              <span className="text-xs text-muted-foreground">
                {isConnected ? 'Live' : 'Offline'}
              </span>
            </div>
            
            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-xs text-muted-foreground">
                  {collaborators.length} online
                </span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Overall Progress</span>
            <div className="flex items-center space-x-2">
              <Badge className={status.color}>
                {status.text}
              </Badge>
              <span className="text-sm font-bold">{progress}%</span>
            </div>
          </div>
          <Progress 
            value={progress} 
            className="h-3"
          />
        </div>

        {/* Milestones */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Milestones</span>
            <span className="text-sm text-muted-foreground">
              {milestones.completed} of {milestones.total} completed
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Progress 
              value={milestones.total > 0 ? (milestones.completed / milestones.total) * 100 : 0} 
              className="h-2 flex-1"
            />
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-3 w-3 text-green-500" />
              <span className="text-xs text-muted-foreground">
                {milestones.completed}
              </span>
            </div>
          </div>
        </div>

        {/* Real-time Indicators */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <Activity className="h-3 w-3" />
            <span>Real-time updates</span>
          </div>
          {lastUpdate && (
            <div className="flex items-center space-x-1">
              <Clock className="h-3 w-3" />
              <span>Updated {new Date(lastUpdate).toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        {/* Progress Trend */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Progress Trend</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {progress > 0 ? 'Steady progress' : 'Getting started'}
          </div>
        </div>

        {/* Warning for low progress */}
        {progress < 25 && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <span className="text-sm text-yellow-800">
              Project is in early stages. Consider breaking down into smaller tasks.
            </span>
          </div>
        )}

        {/* Success message for high progress */}
        {progress >= 90 && (
          <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded-md">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm text-green-800">
              Excellent progress! Project is nearly complete.
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Real-time notification component
export function RealTimeNotification() {
  const { notifications, clearNotifications } = useRealtimeNotifications()

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="space-y-2">
        {notifications.slice(0, 3).map((notification, index) => (
          <div 
            key={index}
            className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 animate-in slide-in-from-right"
          >
            <div className="flex items-start space-x-2">
              <div className="flex-shrink-0">
                {notification.priority === 'high' ? (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                ) : (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">
                  {notification.title || 'Update'}
                </p>
                <p className="text-xs text-gray-600">
                  {notification.message}
                </p>
              </div>
              <button
                onClick={clearNotifications}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
