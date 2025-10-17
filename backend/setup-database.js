const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupDatabase() {
  try {
    console.log('🔄 Setting up BPL Commander database...');

    // Create the database schema
    const schemaSQL = `
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
`;

    // Execute schema creation
    const { error: schemaError } = await supabase.rpc('exec_sql', { sql: schemaSQL });
    
    if (schemaError) {
      console.log('⚠️  Schema creation error (might already exist):', schemaError.message);
    } else {
      console.log('✅ Database schema created successfully');
    }

    // Insert default users
    const bcrypt = require('bcrypt');
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash('Admin123!', saltRounds);

    const defaultUsers = [
      {
        email: 'admin@bplcommander.com',
        name: 'System Admin',
        password: hashedPassword,
        employeeId: 'ADMIN001',
        role: 'admin',
        designation: 'System Administrator',
        department: 'IT',
        isActive: true
      },
      {
        email: 'manager@bplcommander.com',
        name: 'Project Manager',
        password: hashedPassword,
        employeeId: 'MGR001',
        role: 'manager',
        designation: 'Senior Project Manager',
        department: 'Operations',
        isActive: true
      },
      {
        email: 'employee@bplcommander.com',
        name: 'Test Employee',
        password: hashedPassword,
        employeeId: 'EMP001',
        role: 'employee',
        designation: 'Software Developer',
        department: 'Engineering',
        isActive: true
      }
    ];

    // Insert users
    for (const user of defaultUsers) {
      const { error: userError } = await supabase
        .from('users')
        .upsert(user, { onConflict: 'email' });
      
      if (userError) {
        console.log(`⚠️  User ${user.email} error:`, userError.message);
      } else {
        console.log(`✅ User ${user.email} created/updated`);
      }
    }

    console.log('✅ Database setup completed successfully!');
    console.log('📝 Default login credentials:');
    console.log('   Admin: admin@bplcommander.com / Admin123!');
    console.log('   Manager: manager@bplcommander.com / Admin123!');
    console.log('   Employee: employee@bplcommander.com / Admin123!');

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
