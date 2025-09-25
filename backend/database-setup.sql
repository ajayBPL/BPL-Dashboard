-- Database Setup Script for BPL Commander
-- This script creates the database and user for the application

-- Create database
CREATE DATABASE bpl_commander_db;

-- Create user
CREATE USER bpl_admin WITH PASSWORD 'password123';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE bpl_commander_db TO bpl_admin;

-- Connect to the database and grant schema privileges
\c bpl_commander_db;
GRANT ALL ON SCHEMA public TO bpl_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO bpl_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO bpl_admin;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO bpl_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO bpl_admin;

