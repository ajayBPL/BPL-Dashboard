// Advanced Analytics API Routes
// Provides business intelligence, predictive insights, and performance metrics

import express, { Request, Response } from 'express'
import { authenticateToken } from '../middleware/auth'
import { asyncHandler } from '../middleware/errorHandler'
import AnalyticsService from '../services/analyticsService'
import cacheService from '../services/cacheService'

const router = express.Router()
const analyticsService = new AnalyticsService()

// Apply authentication to all routes
router.use(authenticateToken)

// GET /analytics/business-metrics - Get overall business metrics
router.get('/business-metrics', cacheService.middleware(300), asyncHandler(async (req: Request, res: Response) => {
  try {
    const metrics = await analyticsService.generateBusinessMetrics()
    
    res.json({
      success: true,
      data: metrics,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating business metrics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate business metrics'
    })
  }
}))

// GET /analytics/team-performance - Get team performance report
router.get('/team-performance', cacheService.middleware(600), asyncHandler(async (req: Request, res: Response) => {
  try {
    const teamId = req.query.teamId as string
    const report = await analyticsService.generateTeamPerformanceReport(teamId)
    
    res.json({
      success: true,
      data: report,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating team performance report:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate team performance report'
    })
  }
}))

// GET /analytics/project-insights/:projectId - Get detailed project insights
router.get('/project-insights/:projectId', cacheService.middleware(300), asyncHandler(async (req: Request, res: Response) => {
  try {
    const { projectId } = req.params
    const insights = await analyticsService.generateProjectInsights(projectId)
    
    res.json({
      success: true,
      data: insights,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating project insights:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate project insights'
    })
  }
}))

// GET /analytics/predictive - Get predictive analytics
router.get('/predictive', cacheService.middleware(1800), asyncHandler(async (req: Request, res: Response) => {
  try {
    const predictions = await analyticsService.generatePredictiveAnalytics()
    
    res.json({
      success: true,
      data: predictions,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error generating predictive analytics:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to generate predictive analytics'
    })
  }
}))

// GET /analytics/cache-stats - Get caching statistics
router.get('/cache-stats', asyncHandler(async (req: Request, res: Response) => {
  try {
    const stats = cacheService.getStats()
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error getting cache stats:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to get cache statistics'
    })
  }
}))

// POST /analytics/invalidate-cache - Invalidate specific cache entries
router.post('/invalidate-cache', asyncHandler(async (req: Request, res: Response) => {
  try {
    const { tags, keys } = req.body
    
    if (tags && Array.isArray(tags)) {
      await cacheService.invalidateByTags(tags)
    }
    
    if (keys && Array.isArray(keys)) {
      for (const key of keys) {
        await cacheService.del(key)
      }
    }
    
    res.json({
      success: true,
      message: 'Cache invalidated successfully',
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error invalidating cache:', error)
    res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache'
    })
  }
}))

// GET /analytics/health - Analytics service health check
router.get('/health', asyncHandler(async (req: Request, res: Response) => {
  try {
    const cacheStats = cacheService.getStats()
    
    res.json({
      success: true,
      data: {
        service: 'analytics',
        status: 'healthy',
        cache: cacheStats,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Analytics health check failed:', error)
    res.status(500).json({
      success: false,
      error: 'Analytics service unhealthy'
    })
  }
}))

export default router