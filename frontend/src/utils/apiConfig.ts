// API Configuration Utility
// Centralized configuration for all API endpoints

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3001/api';
const API_HEALTH_URL = (import.meta as any).env?.VITE_API_HEALTH_URL || 'http://localhost:3001/health';

// API Endpoints
export const API_ENDPOINTS = {
  // Auth endpoints
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  
  // User endpoints
  USERS: `${API_BASE_URL}/users`,
  USER_BY_ID: (id: string) => `${API_BASE_URL}/users/${id}`,
  
  // Project endpoints
  PROJECTS: `${API_BASE_URL}/projects`,
  PROJECT_BY_ID: (id: string) => `${API_BASE_URL}/projects/${id}`,
  
  // Initiative endpoints
  INITIATIVES: `${API_BASE_URL}/initiatives`,
  INITIATIVE_BY_ID: (id: string) => `${API_BASE_URL}/initiatives/${id}`,
  
  // Activity endpoints
  ACTIVITIES: `${API_BASE_URL}/activities`,
  
  // Notification endpoints
  NOTIFICATIONS: `${API_BASE_URL}/notifications`,
  
  // Analytics endpoints
  ANALYTICS: `${API_BASE_URL}/analytics`,
  
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
