# BPL Commander - Project Management Application

<div align="center">
  <h3>🚀 Comprehensive Project Management Solution</h3>
  <p>A full-stack project management application with role-based access control, workload management, and team collaboration features.</p>
  
  ![Node.js](https://img.shields.io/badge/Node.js-18+-green)
  ![React](https://img.shields.io/badge/React-18+-blue)
  ![TypeScript](https://img.shields.io/badge/TypeScript-5+-blue)
  ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Database-blue)
  ![Prisma](https://img.shields.io/badge/Prisma-ORM-green)
</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Demo Accounts](#demo-accounts)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## 🎯 Overview

BPL Commander is a modern, full-stack project management application designed for organizations that need robust project tracking, workload management, and team collaboration. Built with React, Node.js, and PostgreSQL, it provides a comprehensive solution for managing projects, initiatives, and team resources.

### Key Highlights

- **Role-Based Access Control**: 5 distinct user roles with tailored permissions
- **Workload Management**: Smart workload tracking with 120% capacity limits
- **Real-time Collaboration**: Project discussions, comments, and notifications
- **Advanced Analytics**: Comprehensive dashboards and reporting
- **Export System**: Data export in Excel/PDF formats
- **Modern UI/UX**: Responsive design with theme customization

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Admin, Program Manager, R&D Manager, Manager, Employee)
- Password recovery system
- Session management

### 📊 Project Management
- Complete project lifecycle management
- Project versioning and change tracking
- Milestone tracking and management
- Budget tracking with multi-currency support
- Timeline and deadline management
- Project assignment and team collaboration

### 🎯 Initiative Management
- Initiative creation and tracking
- Workload percentage allocation
- Priority-based organization
- Due date management
- Progress tracking

### 👥 User Management
- Comprehensive user profiles
- Hierarchical management structure
- Skills and competency tracking
- Workload capacity management
- Department and designation tracking

### 📈 Analytics & Reporting
- Real-time dashboard analytics
- Project performance metrics
- Workload distribution analysis
- Export capabilities (Excel/PDF)
- Activity logging and audit trails

### 🔔 Communication & Notifications
- Real-time notification system
- Project discussion threads
- Comment system
- Activity feeds
- Email notifications (configurable)

### 🎨 User Experience
- Modern, responsive UI built with React and Tailwind CSS
- Dark/Light theme support
- Interactive animations (including animated owl companion)
- Mobile-friendly design
- Accessibility features

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Radix UI** - Component library
- **Vite** - Build tool
- **React Hook Form** - Form management
- **Sonner** - Toast notifications

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **TypeScript** - Type safety
- **Prisma** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Multer** - File uploads

### Development Tools
- **Yarn Workspaces** - Monorepo management
- **Concurrently** - Parallel script execution
- **Nodemon** - Development server
- **ESLint** - Code linting
- **Prettier** - Code formatting

## 📁 Project Structure

```
bpl-commander/
├── backend/                 # Node.js/Express API server
│   ├── prisma/             # Database schema and migrations
│   │   ├── migrations/     # Database migration files
│   │   └── schema.prisma   # Prisma schema definition
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── middleware/     # Express middleware
│   │   ├── routes/         # API route definitions
│   │   ├── services/       # Business logic
│   │   ├── types/          # TypeScript type definitions
│   │   ├── utils/          # Utility functions
│   │   └── index.ts        # Server entry point
│   ├── package.json
│   └── tsconfig.json
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── ui/         # Reusable UI components
│   │   │   ├── project/    # Project-specific components
│   │   │   └── initiatives/ # Initiative components
│   │   ├── contexts/       # React contexts
│   │   ├── services/       # API service layer
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # CSS and styling
│   │   └── main.tsx        # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── shared/                 # Shared TypeScript types
│   ├── types/
│   │   └── index.ts        # Shared type definitions
│   └── package.json
├── package.json            # Root package.json
└── README.md              # This file
```

## 🚀 Installation

### Prerequisites

- **Node.js** (version 18 or higher)
- **PostgreSQL** (version 12 or higher)
- **Package Manager**: Yarn (recommended) or npm
- **Git**

> **Note**: While Yarn is recommended for consistency with the project setup, all commands in this guide provide both Yarn and npm alternatives for cross-platform compatibility.

### Quick Start

#### 🪟 **Windows Users (Automated Setup)**

1. **Clone the repository**
   ```bash
   git clone https://github.com/Satyam-Chandel/BPL-Dashboard.git
   cd BPL-Dashboard
   ```

2. **Run automated setup (Choose one)**
   
   **Option A: PowerShell Script (Recommended)**
   ```powershell
   # Right-click PowerShell and "Run as Administrator"
   .\setup-windows.ps1
   ```
   
   **Option B: Batch Script**
   ```cmd
   # Right-click setup-windows.bat and "Run as administrator"
   setup-windows.bat
   ```
   
   **Option C: npm script**
   ```bash
   npm run setup:windows
   ```

#### 🍎🐧 **macOS/Linux Users**

1. **Clone the repository**
   ```bash
   git clone https://github.com/Satyam-Chandel/BPL-Dashboard.git
   cd BPL-Dashboard
   ```

2. **Install dependencies**
   
   **Using npm (Windows/macOS/Linux):**
   ```bash
   npm run install:all
   ```
   
   **Using Yarn (macOS/Linux - requires Yarn workspaces):**
   ```bash
   yarn install
   ```
   
   **Manual installation (if above fails):**
   ```bash
   # Install root dependencies
   npm install
   
   # Install backend dependencies
   cd backend && npm install && cd ..
   
   # Install frontend dependencies  
   cd frontend && npm install && cd ..
   
   # Install shared dependencies
   cd shared && npm install && cd ..
   ```

3. **Set up the database**
   ```bash
   # Create a PostgreSQL database
   createdb bpl_commander
   ```
   
   **Run database migrations:**
   ```bash
   # Using npm (Windows/macOS/Linux)
   npm run db:migrate
   
   # Using Yarn (macOS/Linux)
   npm run db:migrate:yarn
   ```

4. **Configure environment variables**
   
   **On Windows:**
   ```cmd
   copy backend\env.example backend\.env
   ```
   
   **On macOS/Linux:**
   ```bash
   cp backend/env.example backend/.env
   ```
   
   Then edit the `.env` file with your database credentials using your preferred text editor.

5. **Seed the database (optional)**
   ```bash
   # Using npm (Windows/macOS/Linux)
   npm run db:seed
   
   # Using Yarn (macOS/Linux)
   npm run db:seed:yarn
   ```

6. **Start the development servers**
   ```bash
   # Using npm (Windows/macOS/Linux)
   npm run dev
   
   # Using Yarn (macOS/Linux)
   npm run dev:yarn
   ```

7. **Open your browser**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:3001

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the `backend` directory:

```env
# Database Configuration
DATABASE_URL="postgresql://username:password@localhost:5432/bpl_commander"

# JWT Configuration
JWT_SECRET="your_super_secret_jwt_key_change_this_in_production"
JWT_EXPIRES_IN="24h"

# Server Configuration
PORT=3001
NODE_ENV="development"

# CORS Configuration
CORS_ORIGIN="http://localhost:3000"

# File Upload Configuration
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Notification Settings
NOTIFICATION_CHECK_INTERVAL=300000
```

### Database Setup

1. **Install PostgreSQL** on your system
2. **Create a database**:
   ```sql
   CREATE DATABASE bpl_commander;
   CREATE USER bpl_admin WITH PASSWORD 'your_password';
   GRANT ALL PRIVILEGES ON DATABASE bpl_commander TO bpl_admin;
   ```

3. **Run migrations**:
   ```bash
   cd backend
   npm run db:migrate
   ```

4. **Generate Prisma client**:
   ```bash
   npm run db:generate
   ```

## 📖 Usage

### Starting the Application

**Using npm (Windows/macOS/Linux):**
```bash
# Start both frontend and backend
npm run dev

# Start only frontend
npm run dev:frontend

# Start only backend
npm run dev:backend
```

**Using Yarn (macOS/Linux):**
```bash
# Start both frontend and backend
npm run dev:yarn

# Start only frontend
npm run dev:frontend:yarn

# Start only backend
npm run dev:backend:yarn
```

### Building for Production

**Using npm (Windows/macOS/Linux):**
```bash
# Build both frontend and backend
npm run build

# Build only frontend
npm run build:frontend

# Build only backend
npm run build:backend
```

**Using Yarn (macOS/Linux):**
```bash
# Build both frontend and backend
npm run build:yarn

# Build only frontend
npm run build:frontend:yarn

# Build only backend
npm run build:backend:yarn
```

### Database Operations

**Using npm (Windows/macOS/Linux):**
```bash
# Run database migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# Open Prisma Studio (database GUI)
npm run db:studio

# Seed the database with sample data
npm run db:seed
```

**Using Yarn (macOS/Linux):**
```bash
# Run database migrations
npm run db:migrate:yarn

# Generate Prisma client
npm run db:generate:yarn

# Open Prisma Studio (database GUI)
npm run db:studio:yarn

# Seed the database with sample data
npm run db:seed:yarn
```

## 🔌 API Documentation

### Authentication Endpoints

```
POST /api/auth/login          # User login
POST /api/auth/register       # User registration
POST /api/auth/logout         # User logout
POST /api/auth/refresh        # Refresh JWT token
POST /api/auth/forgot-password # Password recovery
```

### Project Endpoints

```
GET    /api/projects          # Get all projects
POST   /api/projects          # Create new project
GET    /api/projects/:id      # Get project by ID
PUT    /api/projects/:id      # Update project
DELETE /api/projects/:id      # Delete project
GET    /api/projects/:id/versions # Get project versions
```

### User Management Endpoints

```
GET    /api/users             # Get all users
POST   /api/users             # Create new user
GET    /api/users/:id         # Get user by ID
PUT    /api/users/:id         # Update user
DELETE /api/users/:id         # Delete user
GET    /api/users/:id/workload # Get user workload
```

### Initiative Endpoints

```
GET    /api/initiatives       # Get all initiatives
POST   /api/initiatives       # Create new initiative
GET    /api/initiatives/:id   # Get initiative by ID
PUT    /api/initiatives/:id   # Update initiative
DELETE /api/initiatives/:id   # Delete initiative
```

### Analytics Endpoints

```
GET    /api/analytics/dashboard    # Dashboard analytics
GET    /api/analytics/projects     # Project analytics
GET    /api/analytics/workload     # Workload analytics
GET    /api/analytics/performance  # Performance metrics
```

### Export Endpoints

```
POST   /api/export/excel      # Export data to Excel
POST   /api/export/pdf        # Export data to PDF
GET    /api/export/templates  # Get export templates
```

## 👤 Demo Accounts

The application includes predefined demo accounts for testing:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@bpl.com` | `admin123` | Full system access |
| **Program Manager** | `sarah.wilson@bpl.com` | `sarah123` | Program oversight |
| **R&D Manager** | `mike.chen@bpl.com` | `mike123` | R&D project management |
| **Manager** | `lisa.garcia@bpl.com` | `lisa123` | Team management |
| **Employee** | `john.doe@bpl.com` | `john123` | Individual contributor |

### Role Permissions

- **Admin**: Full system access, user management, system settings
- **Program Manager**: Cross-project oversight, resource allocation
- **R&D Manager**: R&D project management, technical initiatives
- **Manager**: Team management, project assignment, workload monitoring
- **Employee**: Personal tasks, project participation, time tracking

## 🔧 Development

### Available Scripts

**Using npm (Windows/macOS/Linux):**
```bash
# Development
npm run dev                 # Start both frontend and backend
npm run dev:frontend       # Start only frontend
npm run dev:backend        # Start only backend

# Building
npm run build              # Build both applications
npm run build:frontend     # Build frontend only
npm run build:backend      # Build backend only

# Testing
npm run test               # Run all tests
npm run test:frontend      # Run frontend tests
npm run test:backend       # Run backend tests

# Database
npm run db:migrate         # Run database migrations
npm run db:generate        # Generate Prisma client
npm run db:studio          # Open Prisma Studio
npm run db:seed            # Seed database with sample data

# Utilities
npm run clean              # Kill all running processes
npm run install:all        # Install all dependencies
```

**Using Yarn (macOS/Linux):**
```bash
# Development
npm run dev:yarn           # Start both frontend and backend
npm run dev:frontend:yarn  # Start only frontend
npm run dev:backend:yarn   # Start only backend

# Building
npm run build:yarn         # Build both applications
npm run build:frontend:yarn # Build frontend only
npm run build:backend:yarn # Build backend only

# Testing
npm run test:yarn          # Run all tests
npm run test:frontend:yarn # Run frontend tests
npm run test:backend:yarn  # Run backend tests

# Database
npm run db:migrate:yarn    # Run database migrations
npm run db:generate:yarn   # Generate Prisma client
npm run db:studio:yarn     # Open Prisma Studio
npm run db:seed:yarn       # Seed database with sample data

# Utilities
npm run clean              # Kill all running processes
npm run install:all:yarn   # Install all dependencies (yarn workspaces)
```

### Code Style

The project uses ESLint and Prettier for code formatting:

```bash
# Lint code
yarn lint

# Format code
yarn format

# Fix linting issues
yarn lint:fix
```

### Adding New Features

1. **Backend API Endpoint**:
   - Add route in `backend/src/routes/`
   - Implement controller logic
   - Update Prisma schema if needed
   - Add middleware if required

2. **Frontend Component**:
   - Create component in `frontend/src/components/`
   - Add to appropriate dashboard
   - Update navigation if needed
   - Add API service calls

3. **Database Changes**:
   - Update `backend/prisma/schema.prisma`
   - Run `yarn db:migrate` to create migration
   - Update seed data if needed

## 🚀 Deployment

### Production Build

**Using npm (Windows/macOS/Linux):**
```bash
# Build for production
npm run build

# Start production server
npm start
```

**Using Yarn (macOS/Linux):**
```bash
# Build for production
npm run build:yarn

# Start production server
npm run start:yarn
```

### Environment Setup

1. **Database**: Set up PostgreSQL instance
2. **Environment Variables**: Configure production `.env`
3. **File Storage**: Set up file upload directory
4. **SSL**: Configure HTTPS certificates
5. **Process Management**: Use PM2 or similar

### Deployment Platforms

- **Frontend**: Vercel, Netlify, AWS S3 + CloudFront
- **Backend**: Heroku, DigitalOcean, AWS EC2
- **Database**: AWS RDS, DigitalOcean Managed Databases

For detailed deployment instructions, see [DEPLOYMENT_GUIDE.md](frontend/src/DEPLOYMENT_GUIDE.md).

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Write meaningful commit messages
- Add tests for new features
- Update documentation as needed
- Follow the existing code style

## 🪟 Windows-Specific Notes

### PowerShell Execution Policy
If you encounter execution policy errors on Windows, run PowerShell as Administrator and execute:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Common Windows Issues & Solutions

#### 1. **Permission Errors (EPERM)**
If you encounter `EPERM: operation not permitted` errors:

```powershell
# Run PowerShell as Administrator
# Clear npm cache completely
npm cache clean --force

# Remove node_modules and package-lock.json
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue

# Use yarn instead of npm (recommended for Windows)
npm install -g yarn
yarn install
```

#### 2. **Corporate Network/Proxy Issues**
If you get `ETIMEDOUT` or registry errors:

```bash
# Switch to public npm registry
npm config set registry https://registry.npmjs.org/
yarn config set registry https://registry.npmjs.org/

# If behind corporate proxy, configure proxy settings
npm config set proxy http://your-proxy:port
npm config set https-proxy http://your-proxy:port

# Alternative: Use offline installation
# Download dependencies on a machine with internet access
# Copy node_modules folder to your Windows machine

# Emergency fix for registry issues
npm config delete proxy
npm config delete https-proxy
npm config set registry https://registry.npmjs.org/
```

#### 7. **Manual Setup (If Automated Scripts Fail)**
```bash
# Step 1: Fix registry and clean cache
npm run setup:registry
npm run setup:clean

# Step 2: Install dependencies manually
npm install -g yarn
yarn install

# Step 3: If yarn fails, use npm
npm install

# Step 4: Copy environment file
copy backend\env.example backend\.env
```

#### 3. **Node.js Path Issues**
   - Ensure Node.js is in your PATH environment variable
   - Restart your terminal after installing Node.js
   - Use Node.js 18+ (check with `node --version`)

#### 4. **PostgreSQL Setup on Windows**
   ```cmd
   # Using PostgreSQL installer
   # Download from: https://www.postgresql.org/download/windows/
   
   # Create database using pgAdmin or command line:
   createdb -U postgres bpl_commander
   ```

#### 5. **Long Path Names**
   Enable long path support in Windows 10/11:
   ```cmd
   # Run Command Prompt as Administrator
   reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1
   ```

#### 6. **Port Conflicts**
   If ports 3000 or 3001 are in use, kill processes:
   ```cmd
   # Find process using port
   netstat -ano | findstr :3000
   netstat -ano | findstr :3001
   
   # Kill process by PID
   taskkill /PID <PID> /F
   ```

### Windows Development Tools
- **Git Bash**: Recommended terminal for Windows
- **Windows Terminal**: Modern terminal with better PowerShell support
- **WSL2**: For Linux-like development experience on Windows

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:

1. **Documentation**: Check this README and inline code comments
2. **Issues**: Open a GitHub issue for bugs or feature requests
3. **Discussions**: Use GitHub Discussions for general questions

## 🙏 Acknowledgments

- **Figma Design**: Original design from [BPL Commander Figma](https://www.figma.com/design/TrD8QPPpybKUwnDu8B7hig/BPL-Commander-Project-Management-App--Copy-)
- **UI Components**: Built with Radix UI and Tailwind CSS
- **Icons**: Lucide React icon library
- **Database**: PostgreSQL and Prisma ORM

---

<div align="center">
  <p>Built with ❤️ by the BPL Team</p>
</div>
  