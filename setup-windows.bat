@echo off
REM BPL Commander Windows Setup Script (Batch version)
REM Run this script as Administrator

echo.
echo 🚀 BPL Commander Windows Setup Starting...
echo.

REM Check if running as Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ This script must be run as Administrator!
    echo Right-click setup-windows.bat and select "Run as administrator"
    pause
    exit /b 1
)

echo 🔍 Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% neq 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please download and install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✅ Node.js version: %NODE_VERSION%

echo.
echo 🧹 Cleaning npm cache...
npm cache clean --force

echo.
echo 🔧 Configuring npm registry...
npm config set registry https://registry.npmjs.org/
npm config delete proxy 2>nul
npm config delete https-proxy 2>nul

echo.
echo 🗑️ Removing existing node_modules and lock files...
if exist "node_modules" rmdir /s /q "node_modules" 2>nul
if exist "package-lock.json" del /f "package-lock.json" 2>nul
if exist "backend\node_modules" rmdir /s /q "backend\node_modules" 2>nul
if exist "backend\package-lock.json" del /f "backend\package-lock.json" 2>nul
if exist "frontend\node_modules" rmdir /s /q "frontend\node_modules" 2>nul
if exist "frontend\package-lock.json" del /f "frontend\package-lock.json" 2>nul
if exist "shared\node_modules" rmdir /s /q "shared\node_modules" 2>nul
if exist "shared\package-lock.json" del /f "shared\package-lock.json" 2>nul

echo.
echo 📦 Installing dependencies...
echo Installing root dependencies...
npm install
if %errorLevel% neq 0 (
    echo ⚠️ Root installation failed, trying alternative method...
    npm install -g yarn
    yarn install
)

echo Installing backend dependencies...
cd backend
npm install
if %errorLevel% neq 0 (
    echo ⚠️ Backend installation failed, trying yarn...
    yarn install
)
cd ..

echo Installing frontend dependencies...
cd frontend
npm install
if %errorLevel% neq 0 (
    echo ⚠️ Frontend installation failed, trying yarn...
    yarn install
)
cd ..

echo Installing shared dependencies...
cd shared
npm install
if %errorLevel% neq 0 (
    echo ⚠️ Shared installation failed, trying yarn...
    yarn install
)
cd ..

echo.
echo 📋 Setting up environment file...
if exist "backend\env.example" (
    if not exist "backend\.env" (
        copy "backend\env.example" "backend\.env"
        echo ✅ Environment file created from template
        echo 📝 Please edit backend\.env with your database credentials
    ) else (
        echo ✅ Environment file already exists
    )
) else (
    echo ⚠️ Warning: backend\env.example not found
)

echo.
echo 🔨 Testing build process...
npm run build
if %errorLevel% neq 0 (
    echo ❌ Build test failed - this might be due to missing database configuration
) else (
    echo ✅ Build test successful!
)

echo.
echo 🎉 Setup completed!
echo.
echo Next steps:
echo 1. Install and configure PostgreSQL
echo 2. Edit backend\.env with your database credentials
echo 3. Run: npm run db:migrate
echo 4. Run: npm run db:seed (optional)
echo 5. Run: npm run dev
echo.
echo Demo accounts:
echo Admin: admin@bpl.com / admin123
echo Manager: lisa.garcia@bpl.com / lisa123
echo Employee: john.doe@bpl.com / john123
echo.

pause