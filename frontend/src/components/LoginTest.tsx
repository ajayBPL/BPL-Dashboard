// Simple Login Test Component
import React, { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card'
import { supabaseService } from '../services/supabaseService'

export function LoginTest() {
  const [email, setEmail] = useState('admin@bplcommander.com')
  const [password, setPassword] = useState('admin123')
  const [result, setResult] = useState<string>('')

  const testLogin = async () => {
    try {
      setResult('Testing login...')
      const response = await supabaseService.signIn(email, password)
      
      if (response.success) {
        setResult(`✅ Login successful! User: ${response.user?.name}`)
      } else {
        setResult(`❌ Login failed: ${response.error}`)
      }
    } catch (error) {
      setResult(`❌ Error: ${(error as Error).message}`)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Login Test</CardTitle>
        <CardDescription>Test the authentication system</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
          />
        </div>
        <div>
          <label className="text-sm font-medium">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
          />
        </div>
        <Button onClick={testLogin} className="w-full">
          Test Login
        </Button>
        {result && (
          <div className="p-3 bg-gray-100 rounded-md">
            <p className="text-sm">{result}</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
