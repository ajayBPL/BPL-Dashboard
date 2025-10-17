-- BPL Commander Database Setup Script
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS activityLogs CASCADE;
DROP TABLE IF EXISTS comments CASCADE;
DROP TABLE IF EXISTS milestones CASCADE;
DROP TABLE IF EXISTS projectAssignments CASCADE;
DROP TABLE IF EXISTS initiatives CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Users table
CREATE TABLE users (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    employeeId VARCHAR(100) UNIQUE NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'employee',
    designation VARCHAR(255) NOT NULL,
    managerId UUID REFERENCES users(id),
    department VARCHAR(100),
    skills TEXT[],
    workloadCap INTEGER DEFAULT 100,
    overBeyondCap INTEGER DEFAULT 20,
    avatar TEXT,
    phoneNumber VARCHAR(20),
    timezone VARCHAR(50) DEFAULT 'UTC',
    preferredCurrency VARCHAR(3) DEFAULT 'USD',
    notificationSettings JSONB DEFAULT '{"email": true, "inApp": true, "projectUpdates": true, "deadlineReminders": true, "weeklyReports": false}',
    isActive BOOLEAN DEFAULT true,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lastLoginAt TIMESTAMP WITH TIME ZONE
);

-- Projects table
CREATE TABLE projects (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    managerId UUID REFERENCES users(id),
    timeline TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    priority VARCHAR(50) DEFAULT 'medium',
    category VARCHAR(100),
    tags TEXT[],
    progress INTEGER DEFAULT 0,
    estimatedHours INTEGER DEFAULT 0,
    actualHours INTEGER DEFAULT 0,
    budgetAmount DECIMAL(15,2),
    budgetCurrency VARCHAR(3) DEFAULT 'USD',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    lastActivity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    versions JSONB DEFAULT '[]'
);

-- Project assignments table
CREATE TABLE projectAssignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
    employeeId UUID REFERENCES users(id) ON DELETE CASCADE,
    involvementPercentage INTEGER DEFAULT 0,
    assignedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assignedBy UUID REFERENCES users(id),
    UNIQUE(projectId, employeeId)
);

-- Initiatives table
CREATE TABLE initiatives (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    estimatedHours INTEGER DEFAULT 0,
    actualHours INTEGER DEFAULT 0,
    workloadPercentage INTEGER DEFAULT 0,
    assignedTo UUID REFERENCES users(id),
    createdBy UUID REFERENCES users(id),
    dueDate TIMESTAMP WITH TIME ZONE,
    completedAt TIMESTAMP WITH TIME ZONE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    userId UUID REFERENCES users(id),
    projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
    initiativeId UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE activityLogs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    userId UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entityType VARCHAR(50),
    entityId UUID,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    userId UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE milestones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    dueDate TIMESTAMP WITH TIME ZONE,
    completedAt TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending',
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_employee_id ON users(employeeId);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_projects_manager ON projects(managerId);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_project_assignments_project ON projectAssignments(projectId);
CREATE INDEX idx_project_assignments_employee ON projectAssignments(employeeId);
CREATE INDEX idx_initiatives_assigned_to ON initiatives(assignedTo);
CREATE INDEX idx_comments_project ON comments(projectId);
CREATE INDEX idx_comments_initiative ON comments(initiativeId);
CREATE INDEX idx_activity_logs_user ON activityLogs(userId);
CREATE INDEX idx_notifications_user ON notifications(userId);

-- Insert default admin user
INSERT INTO users (email, name, password, employeeId, role, designation, department, isActive) 
VALUES (
    'admin@bplcommander.com', 
    'System Admin', 
    '$2b$12$ALpZYdoI/d2YU.ZLJZu1SOXQpFjovkWOLU9BOaZqiNGRQDwSAjpE2', -- password: Admin123!
    'ADMIN001', 
    'admin', 
    'System Administrator',
    'IT',
    true
);

-- Insert default manager user
INSERT INTO users (email, name, password, employeeId, role, designation, department, isActive) 
VALUES (
    'manager@bplcommander.com', 
    'Project Manager', 
    '$2b$12$ALpZYdoI/d2YU.ZLJZu1SOXQpFjovkWOLU9BOaZqiNGRQDwSAjpE2', -- password: Admin123!
    'MGR001', 
    'manager', 
    'Senior Project Manager',
    'Operations',
    true
);

-- Insert default employee user
INSERT INTO users (email, name, password, employeeId, role, designation, department, managerId, isActive) 
VALUES (
    'employee@bplcommander.com', 
    'Test Employee', 
    '$2b$12$ALpZYdoI/d2YU.ZLJZu1SOXQpFjovkWOLU9BOaZqiNGRQDwSAjpE2', -- password: Admin123!
    'EMP001', 
    'employee', 
    'Software Developer',
    'Engineering',
    (SELECT id FROM users WHERE email = 'manager@bplcommander.com'),
    true
);

-- Insert sample projects
INSERT INTO projects (title, description, managerId, status, priority, progress, estimatedHours, timeline) 
VALUES (
    'BPL Commander Dashboard',
    'Main dashboard application for project management',
    (SELECT id FROM users WHERE email = 'manager@bplcommander.com'),
    'active',
    'high',
    75,
    120,
    '2024-12-31'
);

INSERT INTO projects (title, description, managerId, status, priority, progress, estimatedHours, timeline) 
VALUES (
    'API Integration',
    'Backend API development and integration',
    (SELECT id FROM users WHERE email = 'manager@bplcommander.com'),
    'pending',
    'medium',
    25,
    80,
    '2024-11-30'
);

-- Insert sample initiatives
INSERT INTO initiatives (title, description, category, priority, status, estimatedHours, workloadPercentage, assignedTo, createdBy) 
VALUES (
    'User Authentication',
    'Implement secure user authentication system',
    'Security',
    'high',
    'active',
    40,
    30,
    (SELECT id FROM users WHERE email = 'employee@bplcommander.com'),
    (SELECT id FROM users WHERE email = 'manager@bplcommander.com')
);

INSERT INTO initiatives (title, description, category, priority, status, estimatedHours, workloadPercentage, assignedTo, createdBy) 
VALUES (
    'Database Optimization',
    'Optimize database queries and performance',
    'Performance',
    'medium',
    'pending',
    20,
    15,
    (SELECT id FROM users WHERE email = 'employee@bplcommander.com'),
    (SELECT id FROM users WHERE email = 'admin@bplcommander.com')
);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;
