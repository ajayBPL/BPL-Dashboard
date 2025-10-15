-- Supabase Database Schema for BPL Commander
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS projects (
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
CREATE TABLE IF NOT EXISTS projectAssignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
    employeeId UUID REFERENCES users(id) ON DELETE CASCADE,
    involvementPercentage INTEGER DEFAULT 0,
    assignedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assignedBy UUID REFERENCES users(id),
    UNIQUE(projectId, employeeId)
);

-- Initiatives table
CREATE TABLE IF NOT EXISTS initiatives (
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
CREATE TABLE IF NOT EXISTS comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    content TEXT NOT NULL,
    userId UUID REFERENCES users(id),
    projectId UUID REFERENCES projects(id) ON DELETE CASCADE,
    initiativeId UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity logs table
CREATE TABLE IF NOT EXISTS activityLogs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    userId UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL,
    entityType VARCHAR(50),
    entityId UUID,
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    userId UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    read BOOLEAN DEFAULT false,
    createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones table
CREATE TABLE IF NOT EXISTS milestones (
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
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_employee_id ON users(employeeId);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_projects_manager ON projects(managerId);
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_project_assignments_project ON projectAssignments(projectId);
CREATE INDEX IF NOT EXISTS idx_project_assignments_employee ON projectAssignments(employeeId);
CREATE INDEX IF NOT EXISTS idx_initiatives_assigned_to ON initiatives(assignedTo);
CREATE INDEX IF NOT EXISTS idx_comments_project ON comments(projectId);
CREATE INDEX IF NOT EXISTS idx_comments_initiative ON comments(initiativeId);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activityLogs(userId);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(userId);

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
) ON CONFLICT (email) DO NOTHING;

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
) ON CONFLICT (email) DO NOTHING;

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
) ON CONFLICT (email) DO NOTHING;
