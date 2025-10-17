-- Insert Default Users for BPL Commander
-- Run this in your Supabase SQL Editor after the main schema is created

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
) ON CONFLICT DO NOTHING;

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
) ON CONFLICT DO NOTHING;

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
) ON CONFLICT DO NOTHING;

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
) ON CONFLICT DO NOTHING;

-- Verify users were inserted
SELECT id, email, name, role, designation, isActive FROM users;
