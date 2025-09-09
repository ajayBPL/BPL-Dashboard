# BPL Commander Windows Setup Script
# Run this script as Administrator in PowerShell

Write-Host "🚀 BPL Commander Windows Setup Starting..." -ForegroundColor Green

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ This script must be run as Administrator!" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Set execution policy
Write-Host "🔧 Setting PowerShell execution policy..." -ForegroundColor Blue
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "✅ Execution policy set successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Could not set execution policy: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Check Node.js version
Write-Host "🔍 Checking Node.js version..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
    
    # Extract version number and check if it's >= 18
    $versionNumber = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    if ($versionNumber -lt 18) {
        Write-Host "❌ Node.js version 18 or higher is required. Current version: $nodeVersion" -ForegroundColor Red
        Write-Host "Please download and install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
} catch {
    Write-Host "❌ Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please download and install Node.js 18+ from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Clean npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Blue
try {
    npm cache clean --force
    Write-Host "✅ npm cache cleaned" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Could not clean npm cache: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Configure npm registry
Write-Host "🔧 Configuring npm registry..." -ForegroundColor Blue
try {
    npm config set registry https://registry.npmjs.org/
    npm config delete proxy 2>$null
    npm config delete https-proxy 2>$null
    Write-Host "✅ npm registry configured" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Could not configure npm registry: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Remove existing node_modules and lock files
Write-Host "🗑️ Removing existing node_modules and lock files..." -ForegroundColor Blue
try {
    if (Test-Path "node_modules") { Remove-Item -Recurse -Force "node_modules" }
    if (Test-Path "package-lock.json") { Remove-Item -Force "package-lock.json" }
    if (Test-Path "backend/node_modules") { Remove-Item -Recurse -Force "backend/node_modules" }
    if (Test-Path "backend/package-lock.json") { Remove-Item -Force "backend/package-lock.json" }
    if (Test-Path "frontend/node_modules") { Remove-Item -Recurse -Force "frontend/node_modules" }
    if (Test-Path "frontend/package-lock.json") { Remove-Item -Force "frontend/package-lock.json" }
    if (Test-Path "shared/node_modules") { Remove-Item -Recurse -Force "shared/node_modules" }
    if (Test-Path "shared/package-lock.json") { Remove-Item -Force "shared/package-lock.json" }
    Write-Host "✅ Cleanup completed" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Warning: Some files could not be removed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Blue
try {
    Write-Host "Installing root dependencies..." -ForegroundColor Cyan
    npm install
    
    Write-Host "Installing backend dependencies..." -ForegroundColor Cyan
    Set-Location "backend"
    npm install
    Set-Location ".."
    
    Write-Host "Installing frontend dependencies..." -ForegroundColor Cyan
    Set-Location "frontend"
    npm install
    Set-Location ".."
    
    Write-Host "Installing shared dependencies..." -ForegroundColor Cyan
    Set-Location "shared"
    npm install
    Set-Location ".."
    
    Write-Host "✅ All dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Error installing dependencies: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Trying alternative installation method..." -ForegroundColor Yellow
    
    try {
        # Try with yarn if npm fails
        Write-Host "Installing yarn globally..." -ForegroundColor Cyan
        npm install -g yarn
        
        Write-Host "Installing dependencies with yarn..." -ForegroundColor Cyan
        yarn install
        Write-Host "✅ Dependencies installed with yarn" -ForegroundColor Green
    } catch {
        Write-Host "❌ Both npm and yarn installation failed" -ForegroundColor Red
        Write-Host "Please check your internet connection and try manual installation" -ForegroundColor Yellow
        Read-Host "Press Enter to continue anyway"
    }
}

# Copy environment file
Write-Host "📋 Setting up environment file..." -ForegroundColor Blue
try {
    if (Test-Path "backend/env.example") {
        if (-not (Test-Path "backend/.env")) {
            Copy-Item "backend/env.example" "backend/.env"
            Write-Host "✅ Environment file created from template" -ForegroundColor Green
            Write-Host "📝 Please edit backend/.env with your database credentials" -ForegroundColor Yellow
        } else {
            Write-Host "✅ Environment file already exists" -ForegroundColor Green
        }
    } else {
        Write-Host "⚠️ Warning: backend/env.example not found" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Warning: Could not copy environment file: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Test build
Write-Host "🔨 Testing build process..." -ForegroundColor Blue
try {
    npm run build
    Write-Host "✅ Build test successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ Build test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "This might be due to missing database configuration" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Install and configure PostgreSQL" -ForegroundColor White
Write-Host "2. Edit backend/.env with your database credentials" -ForegroundColor White
Write-Host "3. Run: npm run db:migrate" -ForegroundColor White
Write-Host "4. Run: npm run db:seed (optional)" -ForegroundColor White
Write-Host "5. Run: npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Demo accounts:" -ForegroundColor Cyan
Write-Host "Admin: admin@bpl.com / admin123" -ForegroundColor White
Write-Host "Manager: lisa.garcia@bpl.com / lisa123" -ForegroundColor White
Write-Host "Employee: john.doe@bpl.com / john123" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to exit"