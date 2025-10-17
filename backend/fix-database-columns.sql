-- Fix Database Column Names
-- Run this in Supabase SQL Editor to fix the column naming issues

-- Check current table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- Update the isActive column if it's null
UPDATE users SET "isActive" = true WHERE "isActive" IS NULL;

-- Update the employeeId column if it's null
UPDATE users SET "employeeId" = 'ADMIN001' WHERE email = 'admin@bplcommander.com' AND "employeeId" IS NULL;
UPDATE users SET "employeeId" = 'MGR001' WHERE email = 'manager@bplcommander.com' AND "employeeId" IS NULL;
UPDATE users SET "employeeId" = 'EMP001' WHERE email = 'employee@bplcommander.com' AND "employeeId" IS NULL;

-- Verify the updates
SELECT id, email, name, role, "employeeId", "isActive", "createdAt" FROM users;
