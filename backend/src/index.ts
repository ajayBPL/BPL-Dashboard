/**
 * BPL Commander Backend Server
 * 
 * This is the main entry point for the BPL Commander API server.
 * It sets up Express.js with all necessary middleware, routes, and configurations
 * for a comprehensive project management and employee tracking system.
 * 
 * Key Features:
 * - JWT-based authentication
 * - Role-based access control (Admin, Manager, Employee)
 * - Project and initiative management
 * - Employee workload tracking
 * - Analytics and reporting
 * - File upload/download
 * - Real-time notifications
 * - Database abstraction with mock data fallback
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { validateEnvironmentOrExit } from './utils/envValidation';

// Import security middleware
import { securityMiddleware } from './middleware/security';

// Import all API route modules
import authRoutes from './routes/auth';           // Authentication endpoints (login, register, logout)
import userRoutes from './routes/users';          // User management endpoints
import projectRoutes from './routes/projects-supabase';    // Project CRUD operations - Supabase compatible
import initiativeRoutes from './routes/initiatives-supabase'; // Initiative management - Supabase compatible
import workloadRoutes from './routes/workload';   // Employee workload tracking
// import analyticsRoutes from './routes/analytics'; // Advanced analytics and business intelligence - temporarily disabled
// import notificationRoutes from './routes/notifications'; // Notification system - temporarily disabled
import commentRoutes from './routes/comments';    // Project/initiative comments
import fileRoutes from './routes/files';          // File upload/download
import exportRoutes from './routes/export';       // Data export functionality
import settingsRoutes from './routes/settings';   // Application settings
import searchRoutes from './routes/search';       // Global search functionality
import activityRoutes from './routes/activity';   // Activity logging
import mockUserRoutes from './routes/mock-users'; // Mock user data for testing
import syncRoutes from './routes/sync';           // Data synchronization
import roleRoutes from './routes/roles';          // Role management
import departmentRoutes from './routes/departments'; // Department management

// Import custom middleware
import { errorHandler } from './middleware/errorHandler';     // Global error handling
import { notFoundHandler } from './middleware/notFoundHandler'; // 404 handler
import { db } from './services/database';                     // Database service abstraction
import WebSocketService from './services/websocketService';    // Real-time WebSocket service

// Load environment variables from .env file
dotenv.config();

// Validate environment variables and exit if validation fails
const envConfig = validateEnvironmentOrExit();

// Initialize Express application instance
const app = express();
const PORT = envConfig.PORT;

/**
 * Initialize Supabase database service
 * This ensures the application uses Supabase PostgreSQL
 */
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing Supabase database connection...');
    
    // Add timeout to prevent hanging - reduced to 5 seconds
    const timeoutPromise = new Promise<boolean>((_, reject) => {
      setTimeout(() => reject(new Error('Database connection timeout after 5 seconds')), 5000); // 5 second timeout
    });
    
    const connectionPromise = db.testConnection();
    const connected = await Promise.race([connectionPromise, timeoutPromise]);
    
    if (connected) {
      console.log('✅ Supabase database service initialized successfully');
      return true;
    } else {
      console.error('❌ Supabase database connection failed');
      console.error('📝 Please check your Supabase configuration in .env file');
      console.error('📝 Required variables: SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY');
      return false;
    }
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    if (errorMessage.includes('timeout')) {
      console.warn('⚠️  Database connection timed out - continuing without database connection');
      console.warn('⚠️  Database features will not work until connection is established');
    } else {
      console.error('❌ Supabase database initialization failed:', errorMessage);
      console.error('📝 Please check your Supabase configuration in .env file');
    }
    return false;
  }
}

// Initialize database connection in background (non-blocking)
// Server will start immediately regardless of database connection status
let dbInitialized = false;
// Start database initialization but don't wait for it
initializeDatabase().then((success) => {
  if (!success) {
    console.warn('⚠️  Database connection failed, but continuing startup (will retry on first request)');
    console.warn('⚠️  Please check your Supabase configuration in .env file');
    console.warn('⚠️  Required variables: DATABASE_URL, SUPABASE_URL, SUPABASE_ANON_KEY');
  } else {
    dbInitialized = true;
    console.log('✅ Database initialization completed');
  }
}).catch((error) => {
  console.error('❌ Database initialization error:', error);
  console.warn('⚠️  Continuing startup, but database features may not work');
});

// Don't wait for database - start server immediately
console.log('🚀 Starting server (database connection in background)...');

/**
 * Security middleware configuration
 * Helmet provides security headers to protect against common vulnerabilities
 */
// Enhanced Security middleware configuration
app.use(securityMiddleware.securityHeaders);

/**
 * CORS (Cross-Origin Resource Sharing) configuration
 * Allows frontend applications from different origins to access the API
 * Supports both localhost development and network access scenarios
 */
app.use(securityMiddleware.corsConfig);

/**
 * Rate limiting middleware to prevent abuse
 * Limits the number of requests per IP address within a time window
 */
// Enhanced rate limiting with different limits for different operations
app.use('/api/auth', securityMiddleware.authRateLimit);
app.use('/api/auth/reset-password', securityMiddleware.passwordResetRateLimit);
app.use('/api/files', securityMiddleware.uploadRateLimit);
app.use('/api', securityMiddleware.generalRateLimit);

/**
 * Additional security middleware
 */
app.use(securityMiddleware.requestSizeLimit);
app.use(securityMiddleware.sanitizeInput);
app.use(securityMiddleware.securityLogger);
app.use(securityMiddleware.sqlInjectionProtection);
app.use(securityMiddleware.xssProtection);
app.use(securityMiddleware.bruteForceProtection);
app.use(securityMiddleware.trackLoginAttempt);

/**
 * HTTP request logging middleware
 * Uses Morgan to log all HTTP requests in combined format
 * Disabled in test environment to reduce noise
 */
if (envConfig.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

/**
 * Health check endpoint
 * Provides basic server status information for monitoring and load balancers
 * Returns server status, timestamp, and version information
 */
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'BPL Commander API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * Database readiness middleware
 * Ensures database is initialized before processing API requests
 */
app.use('/api', (req, res, next) => {
  if (!dbInitialized) {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database is still initializing. Please try again in a moment.',
      retryAfter: 5
    });
  }
  return next();
});

/**
 * API Route Registration
 * All API endpoints are prefixed with '/api' for clear separation
 * Each route module handles specific domain functionality
 */
app.use('/api/auth', authRoutes);           // Authentication & authorization
app.use('/api/users', userRoutes);          // User management & profiles
app.use('/api/projects', projectRoutes);    // Project CRUD operations - Supabase compatible
app.use('/api/initiatives', initiativeRoutes); // Initiative management - Supabase compatible
app.use('/api/workload', workloadRoutes);   // Employee workload tracking
// app.use('/api/analytics', analyticsRoutes); // Dashboard analytics & reports - temporarily disabled
// app.use('/api/notifications', notificationRoutes); // Notification system - temporarily disabled
app.use('/api/comments', commentRoutes);    // Comments on projects/initiatives
app.use('/api/files', fileRoutes);          // File upload/download
app.use('/api/export', exportRoutes);       // Data export functionality
app.use('/api/settings', settingsRoutes);   // Application settings
app.use('/api/search', searchRoutes);       // Global search functionality
app.use('/api/activity', activityRoutes);    // Activity logging & audit trail
app.use('/api/mock-users', mockUserRoutes); // Mock data for testing
app.use('/api/sync', syncRoutes);           // Data synchronization
app.use('/api/roles', roleRoutes);          // Role management
app.use('/api/departments', departmentRoutes); // Department management

/**
 * Error handling middleware (must be registered last)
 * - notFoundHandler: Handles 404 errors for undefined routes
 * - errorHandler: Global error handler for all unhandled errors
 */
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Graceful shutdown handlers
 * Ensures proper cleanup of database connections and resources
 * when the server receives termination signals
 */
process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully...');
  // await db.disconnect(); // Temporarily disabled
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  // await db.disconnect(); // Temporarily disabled
  process.exit(0);
});

/**
 * Start the HTTP server
 * - Binds to all network interfaces (0.0.0.0) for network access
 * - Logs server startup information including network URLs
 */
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BPL Commander API server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🌍 Environment: ${envConfig.NODE_ENV}`);
  console.log(`🌐 Network access: http://192.168.10.205:${PORT}/health`);
  console.log(`✅ Environment validation passed`);
});

/**
 * Initialize WebSocket server for real-time communication
 * - Enables live progress updates
 * - Real-time notifications
 * - Collaborative editing features
 */
let wsService: WebSocketService;
try {
  wsService = new WebSocketService(server);
  console.log('🔌 WebSocket server initialized for real-time features');
} catch (error) {
  console.error('❌ Failed to initialize WebSocket server:', error);
}

// Export WebSocket service for use in other modules
export { wsService };

/**
 * Handle unhandled promise rejections
 * Prevents the server from crashing due to unhandled async errors
 * Logs the error and gracefully shuts down the server
 */
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  server.close(() => {
    process.exit(1);
  });
});

// Export the Express app for testing purposes
export default app;

