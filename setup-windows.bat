@echo off
REM BPL Commander Windows Setup Script (Batch Version)
REM Run this as Administrator

echo.
echo ========================================
echo   BPL Commander Windows Setup (Batch)
echo ========================================
echo.

REM Check for Administrator privileges
net session >nul 2>&1
if %errorLevel% == 0 (
    echo [INFO] Running as Administrator - Good!
) else (
    echo [ERROR] Please run this script as Administrator
    echo Right-click this file and select "Run as administrator"
    pause
    exit /b 1
)

REM Check Node.js
echo [INFO] Checking Node.js installation...
node --version >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Node.js is installed
) else (
    echo [ERROR] Node.js not found
    echo Please install Node.js 18+ from https://nodejs.org/
    pause
    exit /b 1
)

REM Enable long path support
echo [INFO] Enabling long path support...
reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f >nul 2>&1
if %errorLevel% == 0 (
    echo [OK] Long path support enabled
) else (
    echo [WARNING] Could not enable long path support
)

REM Configure npm registry
echo [INFO] Configuring npm registry...
npm config set registry https://registry.npmjs.org/
echo [OK] Registry configured

REM Clean npm cache
echo [INFO] Cleaning npm cache...
npm cache clean --force
echo [OK] Cache cleaned

REM Remove existing dependencies
echo [INFO] Removing old dependencies...
if exist node_modules rmdir /s /q node_modules >nul 2>&1
if exist package-lock.json del /q package-lock.json >nul 2>&1
if exist backend\node_modules rmdir /s /q backend\node_modules >nul 2>&1
if exist frontend\node_modules rmdir /s /q frontend\node_modules >nul 2>&1
if exist shared\node_modules rmdir /s /q shared\node_modules >nul 2>&1
echo [OK] Old dependencies removed

REM Install Yarn
echo [INFO] Installing Yarn globally...
npm install -g yarn
if %errorLevel% == 0 (
    echo [OK] Yarn installed
) else (
    echo [WARNING] Could not install Yarn
)

REM Install dependencies
echo [INFO] Installing project dependencies...
yarn install
if %errorLevel% == 0 (
    echo [OK] Dependencies installed with Yarn
) else (
    echo [WARNING] Yarn failed, trying npm...
    npm install
    if %errorLevel% == 0 (
        echo [OK] Dependencies installed with npm
    ) else (
        echo [ERROR] Both Yarn and npm failed
        echo Please check your internet connection
        pause
        exit /b 1
    )
)

REM Copy environment file
echo [INFO] Setting up environment file...
if exist backend\env.example (
    if not exist backend\.env (
        copy backend\env.example backend\.env >nul
        echo [OK] Environment file created
        echo [NOTE] Please edit backend\.env with your database settings
    ) else (
        echo [OK] Environment file already exists
    )
) else (
    echo [WARNING] backend\env.example not found
)

echo.
echo ========================================
echo   Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Configure your database in backend\.env
echo 2. Run: yarn dev (or npm run dev)
echo 3. Open http://localhost:3000 in your browser
echo.
echo For troubleshooting, see README.md
echo.
pause
