import React, { memo, useMemo, useCallback } from 'react'
import { PrismaClient } from '@prisma/client'
import { Redis } from 'ioredis'

// Database service with caching and query optimization
class OptimizedDatabaseService {
  private prisma: PrismaClient
  private redis: Redis
  private useMock: boolean = false

  constructor() {
    this.prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['error'] : ['error'],
    })
    
    // Initialize Redis cache
    this.redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    })
  }

  // Optimized user fetching with caching
  async getAllUsers(): Promise<any[]> {
    const cacheKey = 'users:all'
    
    try {
      // Try to get from cache first
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Fetch from database with optimized query
      const users = await this.prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          designation: true,
          managerId: true,
          department: true,
          skills: true,
          workloadCap: true,
          overBeyondCap: true,
          avatar: true,
          phoneNumber: true,
          timezone: true,
          preferredCurrency: true,
          notificationSettings: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
          lastLoginAt: true,
          // Include related data in single query
          projects: {
            select: {
              id: true,
              name: true,
              status: true
            }
          },
          manager: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: {
          name: 'asc'
        }
      })

      // Transform data
      const transformedUsers = users.map(user => ({
        ...user,
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
        lastLoginAt: user.lastLoginAt?.toISOString() || null
      }))

      // Cache for 5 minutes
      await this.redis.setex(cacheKey, 300, JSON.stringify(transformedUsers))
      
      return transformedUsers
    } catch (error) {
      console.error('Database error:', error)
      // Fallback to mock data
      this.useMock = true
      return await this.getMockUsers()
    }
  }

  // Optimized project fetching with caching
  async getAllProjects(): Promise<any[]> {
    const cacheKey = 'projects:all'
    
    try {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      const projects = await this.prisma.project.findMany({
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          priority: true,
          startDate: true,
          endDate: true,
          budget: true,
          progress: true,
          createdAt: true,
          updatedAt: true,
          // Include related data efficiently
          assignedEmployees: {
            select: {
              employeeId: true,
              involvementPercentage: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            }
          },
          milestones: {
            select: {
              id: true,
              title: true,
              description: true,
              dueDate: true,
              completed: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      })

      const transformedProjects = projects.map(project => ({
        ...project,
        startDate: project.startDate.toISOString(),
        endDate: project.endDate.toISOString(),
        createdAt: project.createdAt.toISOString(),
        updatedAt: project.updatedAt.toISOString()
      }))

      // Cache for 3 minutes (projects change more frequently)
      await this.redis.setex(cacheKey, 180, JSON.stringify(transformedProjects))
      
      return transformedProjects
    } catch (error) {
      console.error('Database error:', error)
      return await this.getMockProjects()
    }
  }

  // Batch operations for better performance
  async updateMultipleProjects(updates: Array<{ id: string; data: any }>): Promise<void> {
    const cacheKey = 'projects:all'
    
    try {
      // Use transaction for consistency
      await this.prisma.$transaction(
        updates.map(update => 
          this.prisma.project.update({
            where: { id: update.id },
            data: update.data
          })
        )
      )

      // Invalidate cache
      await this.redis.del(cacheKey)
    } catch (error) {
      console.error('Batch update error:', error)
      throw error
    }
  }

  // Optimized analytics queries
  async getProjectAnalytics(projectId: string): Promise<any> {
    const cacheKey = `analytics:project:${projectId}`
    
    try {
      const cached = await this.redis.get(cacheKey)
      if (cached) {
        return JSON.parse(cached)
      }

      // Single query with all needed data
      const project = await this.prisma.project.findUnique({
        where: { id: projectId },
        select: {
          id: true,
          name: true,
          progress: true,
          startDate: true,
          endDate: true,
          budget: true,
          status: true,
          milestones: {
            select: {
              id: true,
              title: true,
              dueDate: true,
              completed: true
            }
          },
          assignedEmployees: {
            select: {
              involvementPercentage: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  workloadCap: true
                }
              }
            }
          }
        }
      })

      if (!project) return null

      // Calculate analytics
      const analytics = {
        project,
        totalMilestones: project.milestones.length,
        completedMilestones: project.milestones.filter(m => m.completed).length,
        totalInvolvement: project.assignedEmployees.reduce((sum, emp) => sum + emp.involvementPercentage, 0),
        averageWorkload: project.assignedEmployees.reduce((sum, emp) => sum + (emp.user.workloadCap || 0), 0) / project.assignedEmployees.length,
        daysRemaining: Math.ceil((new Date(project.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      }

      // Cache for 2 minutes
      await this.redis.setex(cacheKey, 120, JSON.stringify(analytics))
      
      return analytics
    } catch (error) {
      console.error('Analytics error:', error)
      return null
    }
  }

  // Cache invalidation methods
  async invalidateUserCache(userId?: string): Promise<void> {
    if (userId) {
      await this.redis.del(`user:${userId}`)
    }
    await this.redis.del('users:all')
  }

  async invalidateProjectCache(projectId?: string): Promise<void> {
    if (projectId) {
      await this.redis.del(`project:${projectId}`)
      await this.redis.del(`analytics:project:${projectId}`)
    }
    await this.redis.del('projects:all')
  }

  // Health check with performance metrics
  async healthCheck(): Promise<{ status: string; metrics: any }> {
    const start = Date.now()
    
    try {
      // Test database connection
      await this.prisma.$queryRaw`SELECT 1`
      const dbTime = Date.now() - start

      // Test Redis connection
      const redisStart = Date.now()
      await this.redis.ping()
      const redisTime = Date.now() - redisStart

      return {
        status: 'healthy',
        metrics: {
          database: { responseTime: dbTime, status: 'connected' },
          redis: { responseTime: redisTime, status: 'connected' },
          cacheHitRate: await this.getCacheHitRate()
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        metrics: { error: error.message }
      }
    }
  }

  // Get cache performance metrics
  private async getCacheHitRate(): Promise<number> {
    try {
      const info = await this.redis.info('stats')
      const lines = info.split('\r\n')
      const hits = lines.find(line => line.startsWith('keyspace_hits:'))?.split(':')[1] || '0'
      const misses = lines.find(line => line.startsWith('keyspace_misses:'))?.split(':')[1] || '0'
      
      const total = parseInt(hits) + parseInt(misses)
      return total > 0 ? (parseInt(hits) / total) * 100 : 0
    } catch {
      return 0
    }
  }

  // Mock data fallback methods
  private async getMockUsers(): Promise<any[]> {
    // Return mock data when database is unavailable
    return []
  }

  private async getMockProjects(): Promise<any[]> {
    // Return mock data when database is unavailable
    return []
  }

  // Cleanup method
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect()
    await this.redis.disconnect()
  }
}

// Singleton instance
export const optimizedDb = new OptimizedDatabaseService()

// Performance monitoring middleware
export function withPerformanceMonitoring<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    const start = Date.now()
    try {
      const result = await fn(...args)
      const duration = Date.now() - start
      
      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${operationName} took ${duration}ms`)
      }
      
      return result
    } catch (error) {
      const duration = Date.now() - start
      console.error(`Operation failed: ${operationName} took ${duration}ms`, error)
      throw error
    }
  }
}

// Query optimization utilities
export const QueryOptimizer = {
  // Pagination helper
  paginate: (page: number, limit: number) => ({
    skip: (page - 1) * limit,
    take: limit
  }),

  // Common select patterns
  userSelect: {
    id: true,
    email: true,
    name: true,
    role: true,
    designation: true,
    managerId: true,
    department: true,
    isActive: true
  },

  projectSelect: {
    id: true,
    name: true,
    description: true,
    status: true,
    priority: true,
    startDate: true,
    endDate: true,
    budget: true,
    progress: true
  },

  // Optimized include patterns
  userWithProjects: {
    projects: {
      select: {
        id: true,
        name: true,
        status: true
      }
    }
  },

  projectWithAssignments: {
    assignedEmployees: {
      select: {
        employeeId: true,
        involvementPercentage: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    }
  }
}
