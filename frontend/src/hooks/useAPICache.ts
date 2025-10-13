import { useState, useEffect, useCallback, useRef } from 'react'

interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

interface CacheOptions {
  ttl?: number // Time to live in milliseconds
  maxSize?: number // Maximum number of entries
}

class APICache {
  private cache = new Map<string, CacheEntry<any>>()
  private maxSize: number
  private defaultTTL: number

  constructor(options: CacheOptions = {}) {
    this.maxSize = options.maxSize || 100
    this.defaultTTL = options.ttl || 5 * 60 * 1000 // 5 minutes default
  }

  set<T>(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    })
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return false
    }

    return true
  }

  delete(key: string): void {
    this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    }
  }
}

// Global cache instance
const apiCache = new APICache({
  ttl: 5 * 60 * 1000, // 5 minutes
  maxSize: 100
})

interface UseAPICacheOptions {
  ttl?: number
  enabled?: boolean
  dependencies?: any[]
}

export function useAPICache<T>(
  key: string,
  fetcher: () => Promise<T>,
  options: UseAPICacheOptions = {}
) {
  const { ttl, enabled = true, dependencies = [] } = options
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    // Check cache first
    const cachedData = apiCache.get<T>(key)
    if (cachedData) {
      setData(cachedData)
      return
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    setLoading(true)
    setError(null)

    try {
      const result = await fetcher()
      
      // Only update if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setData(result)
        apiCache.set(key, result, ttl)
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false)
      }
    }
  }, [key, fetcher, enabled, ttl])

  useEffect(() => {
    fetchData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [fetchData, ...dependencies])

  const invalidate = useCallback(() => {
    apiCache.delete(key)
    fetchData()
  }, [key, fetchData])

  const refresh = useCallback(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    invalidate,
    refresh,
    cacheStats: apiCache.getStats()
  }
}

// Hook for manual cache management
export function useCacheManager() {
  const invalidateKey = useCallback((key: string) => {
    apiCache.delete(key)
  }, [])

  const invalidatePattern = useCallback((pattern: string) => {
    const regex = new RegExp(pattern)
    const keys = Array.from(apiCache.getStats().keys)
    keys.forEach(key => {
      if (regex.test(key)) {
        apiCache.delete(key)
      }
    })
  }, [])

  const clearAll = useCallback(() => {
    apiCache.clear()
  }, [])

  const getStats = useCallback(() => {
    return apiCache.getStats()
  }, [])

  return {
    invalidateKey,
    invalidatePattern,
    clearAll,
    getStats
  }
}

export default apiCache
