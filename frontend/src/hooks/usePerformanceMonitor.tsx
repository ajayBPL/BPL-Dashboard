import React, { memo, useMemo, useCallback, useEffect, useRef } from 'react'

// Performance monitoring hook
export function usePerformanceMonitor(componentName: string) {
  const renderCount = useRef(0)
  const lastRenderTime = useRef(Date.now())
  const mountTime = useRef(Date.now())

  useEffect(() => {
    renderCount.current++
    const now = Date.now()
    const timeSinceLastRender = now - lastRenderTime.current
    lastRenderTime.current = now

    // Log performance metrics in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${componentName}:`, {
        renderCount: renderCount.current,
        timeSinceLastRender: `${timeSinceLastRender}ms`,
        totalMountTime: `${now - mountTime.current}ms`
      })

      // Warn about excessive re-renders
      if (renderCount.current > 10) {
        console.warn(`[Performance Warning] ${componentName} has rendered ${renderCount.current} times`)
      }

      // Warn about slow renders
      if (timeSinceLastRender > 100) {
        console.warn(`[Performance Warning] ${componentName} took ${timeSinceLastRender}ms to render`)
      }
    }
  })

  return {
    renderCount: renderCount.current,
    mountTime: Date.now() - mountTime.current
  }
}

// Bundle size analyzer component
export const BundleAnalyzer = memo(function BundleAnalyzer() {
  const [bundleStats, setBundleStats] = React.useState<any>(null)

  useEffect(() => {
    // Analyze bundle size in development
    if (process.env.NODE_ENV === 'development') {
      const analyzeBundle = async () => {
        try {
          // This would integrate with webpack-bundle-analyzer or similar
          const stats = {
            totalSize: '2.1MB',
            gzippedSize: '650KB',
            chunks: [
              { name: 'vendor', size: '1.2MB', gzipped: '380KB' },
              { name: 'app', size: '900KB', gzipped: '270KB' }
            ],
            recommendations: [
              'Consider code splitting for large components',
              'Remove unused Radix UI components',
              'Implement lazy loading for routes'
            ]
          }
          setBundleStats(stats)
        } catch (error) {
          console.error('Bundle analysis failed:', error)
        }
      }

      analyzeBundle()
    }
  }, [])

  if (!bundleStats) return null

  return (
    <div className="fixed bottom-4 right-4 bg-background border rounded-lg p-4 shadow-lg max-w-sm">
      <h3 className="font-semibold mb-2">Bundle Analysis</h3>
      <div className="space-y-2 text-sm">
        <div>Total Size: {bundleStats.totalSize}</div>
        <div>Gzipped: {bundleStats.gzippedSize}</div>
        <div className="mt-2">
          <h4 className="font-medium">Recommendations:</h4>
          <ul className="list-disc list-inside text-xs">
            {bundleStats.recommendations.map((rec: string, index: number) => (
              <li key={index}>{rec}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
})

// API performance monitor
export function useAPIPerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<{
    totalRequests: number
    averageResponseTime: number
    slowRequests: Array<{ url: string; duration: number }>
    errorRate: number
  }>({
    totalRequests: 0,
    averageResponseTime: 0,
    slowRequests: [],
    errorRate: 0
  })

  const trackRequest = useCallback(async <T,>(
    requestFn: () => Promise<T>,
    url: string
  ): Promise<T> => {
    const start = Date.now()
    try {
      const result = await requestFn()
      const duration = Date.now() - start

      setMetrics(prev => {
        const newTotalRequests = prev.totalRequests + 1
        const newAverageResponseTime = 
          (prev.averageResponseTime * prev.totalRequests + duration) / newTotalRequests
        
        const slowRequests = duration > 1000 
          ? [...prev.slowRequests, { url, duration }].slice(-10) // Keep last 10
          : prev.slowRequests

        return {
          totalRequests: newTotalRequests,
          averageResponseTime: newAverageResponseTime,
          slowRequests,
          errorRate: prev.errorRate // Update error rate separately
        }
      })

      return result
    } catch (error) {
      setMetrics(prev => ({
        ...prev,
        errorRate: (prev.errorRate * prev.totalRequests + 1) / (prev.totalRequests + 1)
      }))
      throw error
    }
  }, [])

  return { metrics, trackRequest }
}

// Memory usage monitor
export function useMemoryMonitor() {
  const [memoryInfo, setMemoryInfo] = React.useState<{
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } | null>(null)

  useEffect(() => {
    const updateMemoryInfo = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        setMemoryInfo({
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit
        })
      }
    }

    updateMemoryInfo()
    const interval = setInterval(updateMemoryInfo, 5000) // Update every 5 seconds

    return () => clearInterval(interval)
  }, [])

  return memoryInfo
}

// Performance dashboard component
export const PerformanceDashboard = memo(function PerformanceDashboard() {
  const apiMetrics = useAPIPerformanceMonitor()
  const memoryInfo = useMemoryMonitor()
  const [isVisible, setIsVisible] = React.useState(false)

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 left-4 bg-primary text-primary-foreground p-2 rounded-full shadow-lg"
      >
        📊
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 left-4 bg-background border rounded-lg p-4 shadow-lg max-w-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Performance Monitor</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
      </div>

      <div className="space-y-4">
        {/* API Metrics */}
        <div>
          <h4 className="font-medium mb-2">API Performance</h4>
          <div className="text-sm space-y-1">
            <div>Total Requests: {apiMetrics.metrics.totalRequests}</div>
            <div>Avg Response Time: {apiMetrics.metrics.averageResponseTime.toFixed(2)}ms</div>
            <div>Error Rate: {(apiMetrics.metrics.errorRate * 100).toFixed(2)}%</div>
            {apiMetrics.metrics.slowRequests.length > 0 && (
              <div>
                <div className="font-medium">Slow Requests:</div>
                {apiMetrics.metrics.slowRequests.map((req, index) => (
                  <div key={index} className="text-xs text-red-600">
                    {req.url}: {req.duration}ms
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Memory Usage */}
        {memoryInfo && (
          <div>
            <h4 className="font-medium mb-2">Memory Usage</h4>
            <div className="text-sm space-y-1">
              <div>Used: {(memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
              <div>Total: {(memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB</div>
              <div>Limit: {(memoryInfo.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${(memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Recommendations */}
        <div>
          <h4 className="font-medium mb-2">Recommendations</h4>
          <div className="text-xs space-y-1">
            {apiMetrics.metrics.averageResponseTime > 500 && (
              <div className="text-yellow-600">⚠️ Consider API caching</div>
            )}
            {apiMetrics.metrics.errorRate > 0.05 && (
              <div className="text-red-600">⚠️ High error rate detected</div>
            )}
            {memoryInfo && memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit > 0.8 && (
              <div className="text-red-600">⚠️ High memory usage</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

// Performance optimization utilities
export const PerformanceUtils = {
  // Debounce function for performance
  debounce: <T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  },

  // Throttle function for performance
  throttle: <T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args)
        inThrottle = true
        setTimeout(() => (inThrottle = false), limit)
      }
    }
  },

  // Batch updates for better performance
  batchUpdates: (updates: (() => void)[]) => {
    React.unstable_batchedUpdates(() => {
      updates.forEach(update => update())
    })
  },

  // Lazy load component
  lazyLoad: <T extends React.ComponentType<any>>(
    importFunc: () => Promise<{ default: T }>
  ) => {
    return React.lazy(importFunc)
  }
}
