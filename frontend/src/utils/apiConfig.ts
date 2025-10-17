// API Configuration Utility
// Centralized configuration for all API endpoints

// Supabase Edge Function URL
const SUPABASE_FUNCTION_URL = 'https://mwrdlemotjhrnjzncbxk.supabase.co/functions/v1/make-server-de95975d';

// Use local backend API (running on port 3001)
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
const API_HEALTH_URL = (import.meta as any).env?.VITE_API_HEALTH_URL || 'http://localhost:3001/health';

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
