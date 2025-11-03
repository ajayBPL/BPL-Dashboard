// API Configuration Utility
// Centralized configuration for all API endpoints

// Detect if we're in production mode
const isProduction = import.meta.env.PROD || import.meta.env.MODE === 'production';

// Helper to get API base URL
function getApiBaseUrl(): string {
  // First, check environment variable
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  
  // In production, derive from current window location if available
  if (isProduction && typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    // Remove port from hostname if present, backend should be on same domain or configured
    // For same-domain: use current hostname
    // For different domain: VITE_API_URL must be set
    return `${protocol}//${hostname}:3001/api`;
  }
  
  // Development fallback
  return 'http://localhost:3001/api';
}

function getHealthUrl(): string {
  if (import.meta.env.VITE_API_HEALTH_URL) {
    return import.meta.env.VITE_API_HEALTH_URL;
  }
  
  if (isProduction && typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    return `${protocol}//${hostname}:3001/health`;
  }
  
  return 'http://localhost:3001/health';
}

// Supabase Edge Function URL (from environment variable)
// ⚠️  SECURITY: DO NOT hardcode Supabase URLs - use environment variables
const SUPABASE_FUNCTION_URL = import.meta.env.VITE_SUPABASE_FUNCTION_URL || 'https://your-project-id.supabase.co/functions/v1/your-function';

// Use environment-aware API URLs
const API_BASE_URL = getApiBaseUrl();
const API_HEALTH_URL = getHealthUrl();

// Validate production configuration
if (isProduction && typeof window !== 'undefined') {
  if (!import.meta.env.VITE_API_URL) {
    console.warn('⚠️  WARNING: VITE_API_URL not set. Using derived URL from window.location. Set VITE_API_URL in production for best results.');
  }
  if (!import.meta.env.VITE_SUPABASE_PROJECT_ID || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    console.error('⚠️  CRITICAL: VITE_SUPABASE_PROJECT_ID and VITE_SUPABASE_ANON_KEY must be set in production!');
    console.error('   Create frontend/.env.production with these variables before building.');
  }
}

// Use local backend as primary API (with Supabase PostgreSQL)
const PRIMARY_API_BASE = API_BASE_URL;

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints (local backend)
  LOGIN: `${PRIMARY_API_BASE}/auth/login`,
  REGISTER: `${PRIMARY_API_BASE}/auth/register`,
  LOGOUT: `${PRIMARY_API_BASE}/auth/logout`,
  
  // User endpoints (local backend)
  USERS: `${PRIMARY_API_BASE}/users`,
  USER_BY_ID: (id: string) => `${PRIMARY_API_BASE}/users/${id}`,
  
  // Project endpoints (local backend)
  PROJECTS: `${PRIMARY_API_BASE}/projects`,
  PROJECT_BY_ID: (id: string) => `${PRIMARY_API_BASE}/projects/${id}`,
  PROJECTS_BY_USER: (userId: string) => `${PRIMARY_API_BASE}/projects/user/${userId}`,
  
  // Initiative endpoints (local backend)
  INITIATIVES: `${PRIMARY_API_BASE}/initiatives`,
  INITIATIVE_BY_ID: (id: string) => `${PRIMARY_API_BASE}/initiatives/${id}`,
  
  // Comment endpoints (local backend)
  PROJECT_COMMENTS: (projectId: string) => `${PRIMARY_API_BASE}/comments/project/${projectId}`,
  
  // Local backend endpoints
  ACTIVITIES: `${PRIMARY_API_BASE}/activity`,
  NOTIFICATIONS: `${PRIMARY_API_BASE}/notifications`,
  ANALYTICS: `${PRIMARY_API_BASE}/analytics`,
  WORKLOAD: `${PRIMARY_API_BASE}/workload`,
  ROLES: `${PRIMARY_API_BASE}/roles`,
  DEPARTMENTS: `${PRIMARY_API_BASE}/departments`,
  
  // Health check
  HEALTH: API_HEALTH_URL,
} as const;

// Helper function to get full URL for any endpoint
export const getApiUrl = (endpoint: string): string => {
  if (endpoint.startsWith('http')) {
    return endpoint; // Already a full URL
  }
  
  if (endpoint.startsWith('/api/')) {
    // If endpoint already has /api/, use the base URL without /api
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${endpoint}`;
  }
  
  if (endpoint.startsWith('/')) {
    return `${API_BASE_URL}${endpoint}`; // Add base URL to path
  }
  
  return `${API_BASE_URL}/${endpoint}`; // Add base URL and slash
};

// Default headers for API requests
export const getDefaultHeaders = (token?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
};

// Export base URL for backward compatibility
export { API_BASE_URL, API_HEALTH_URL };
