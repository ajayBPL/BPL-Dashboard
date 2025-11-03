import React, { useState } from 'react'
import { CentralizedInitiative, centralizedDb } from '../../utils/centralizedDb'
import { useUsers } from '../../contexts/UsersContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'
import { Button } from '../ui/button'
import { Lightbulb, Calendar, User, Clock, X, Loader2 } from 'lucide-react'
import { getPriorityColor, getStatusColor, formatDate } from '../../utils/projectHelpers'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog'

interface InitiativesListProps {
  initiatives: CentralizedInitiative[]
  canCreateInitiatives: boolean
  onCreateInitiative: () => void
  onDeleteInitiative: (initiativeId: string, initiativeTitle: string) => Promise<void>
}

export function InitiativesList({ 
  initiatives, 
  canCreateInitiatives, 
  onCreateInitiative,
  onDeleteInitiative
}: InitiativesListProps) {
  const { users, getUserById } = useUsers()
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [initiativeToDelete, setInitiativeToDelete] = useState<{ id: string; title: string } | null>(null)

  const handleDeleteClick = (initiative: CentralizedInitiative) => {
    setInitiativeToDelete({ id: initiative.id, title: initiative.title })
    setShowDeleteDialog(true)
  }

  const handleDeleteConfirm = async () => {
    if (!initiativeToDelete) return
    
    setDeletingId(initiativeToDelete.id)
    setShowDeleteDialog(false)
    
    try {
      await onDeleteInitiative(initiativeToDelete.id, initiativeToDelete.title)
    } finally {
      setDeletingId(null)
      setInitiativeToDelete(null)
    }
  }
  if (initiatives.length === 0) {
    return (
      <div className="text-center py-12">
        <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3>No Over & Beyond Initiatives</h3>
        <p className="text-muted-foreground mb-4">
          {canCreateInitiatives 
            ? "Create innovative projects beyond regular work" 
            : "No initiatives have been created yet"}
        </p>
        {canCreateInitiatives && (
          <Button onClick={onCreateInitiative}>
            <Lightbulb className="h-4 w-4 mr-2" />
            Create First Initiative
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {initiatives.map((initiative) => {
        // Try to get creator from API users first, then fallback to centralizedDb
        let creator = getUserById(initiative.createdBy)
        if (!creator) {
          creator = centralizedDb.getUserById(initiative.createdBy)
        }
        
        // Try to get assignee from API users first, then fallback to centralizedDb
        let assignee = null
        if (initiative.assignedTo) {
          assignee = getUserById(initiative.assignedTo)
          if (!assignee) {
            assignee = centralizedDb.getUserById(initiative.assignedTo)
          }
        }
        const completionRate = initiative.actualHours && initiative.estimatedHours 
          ? (initiative.actualHours / initiative.estimatedHours) * 100 
          : 0

        return (
          <Card key={initiative.id} className={deletingId === initiative.id ? 'opacity-50' : ''}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-base">{initiative.title}</CardTitle>
                  <CardDescription className="mt-1">{initiative.description}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(initiative.status)}>{initiative.status}</Badge>
                  <Badge className={getPriorityColor(initiative.priority)}>{initiative.priority}</Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => handleDeleteClick(initiative)}
                    disabled={deletingId === initiative.id}
                  >
                    {deletingId === initiative.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Created by</p>
                    <p>{creator?.name || 'Unknown'}</p>
                  </div>
                </div>
                {assignee && (
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Assigned to</p>
                      <p>{assignee.name}</p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-muted-foreground">Workload</p>
                    <p>{initiative.workloadPercentage}%</p>
                  </div>
                </div>
                {initiative.dueDate && (
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-muted-foreground">Due Date</p>
                      <p>{formatDate(initiative.dueDate)}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between text-sm mb-2">
                <span>Progress ({initiative.estimatedHours}h estimated)</span>
                <span>{completionRate.toFixed(1)}%</span>
              </div>
              <Progress value={completionRate} />

              <div className="mt-3">
                <Badge variant="outline">{initiative.category}</Badge>
              </div>
            </CardContent>
          </Card>
        )
      })}
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Initiative</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{initiativeToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}