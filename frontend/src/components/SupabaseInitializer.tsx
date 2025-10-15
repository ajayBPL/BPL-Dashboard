// Supabase Initialization Component
// This component helps initialize the Supabase system

import React, { useState } from 'react'
import { supabaseService } from '../services/supabaseService'
import { Button } from './ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { AlertCircle, CheckCircle, Loader2 } from 'lucide-react'

export function SupabaseInitializer() {
  const [isInitializing, setIsInitializing] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initializeSupabase = async () => {
    setIsInitializing(true)
    setError(null)
    
    try {
      const result = await supabaseService.initializeSystem()
      
      if (result.success) {
        setIsInitialized(true)
        console.log('✅ Supabase system initialized successfully!')
      } else {
        setError(result.error || 'Failed to initialize system')
      }
    } catch (error) {
      setError(`Initialization failed: ${(error as Error).message}`)
    } finally {
      setIsInitializing(false)
    }
  }

  if (isInitialized) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Supabase Ready
          </CardTitle>
          <CardDescription>
            System initialized successfully
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <p><strong>Default Users:</strong></p>
            <ul className="list-disc list-inside space-y-1 text-gray-600">
              <li>admin@bplcommander.com (admin123)</li>
              <li>manager@bplcommander.com (manager123)</li>
              <li>employee@bplcommander.com (employee123)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-yellow-500" />
          Initialize Supabase
        </CardTitle>
        <CardDescription>
          Set up the Supabase system with default users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}
        
        <Button 
          onClick={initializeSupabase} 
          disabled={isInitializing}
          className="w-full"
        >
          {isInitializing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Initializing...
            </>
          ) : (
            'Initialize System'
          )}
        </Button>
        
        <div className="text-xs text-gray-500">
          <p>This will create default users for testing:</p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Admin user</li>
            <li>Manager user</li>
            <li>Employee user</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
