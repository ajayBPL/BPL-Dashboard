# BPL Commander Windows Setup Script
# Run this script as Administrator in PowerShell

Write-Host "🚀 BPL Commander Windows Setup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Check if running as Administrator
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "❌ Please run this script as Administrator" -ForegroundColor Red
    Write-Host "Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    pause
    exit 1
}

# Set execution policy
Write-Host "📋 Setting PowerShell execution policy..." -ForegroundColor Blue
try {
    Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser -Force
    Write-Host "✅ Execution policy set successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not set execution policy" -ForegroundColor Yellow
}

# Enable long path support
Write-Host "📁 Enabling long path support..." -ForegroundColor Blue
try {
    reg add "HKLM\SYSTEM\CurrentControlSet\Control\FileSystem" /v LongPathsEnabled /t REG_DWORD /d 1 /f | Out-Null
    Write-Host "✅ Long path support enabled" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not enable long path support" -ForegroundColor Yellow
}

# Check Node.js version
Write-Host "🔍 Checking Node.js version..." -ForegroundColor Blue
try {
    $nodeVersion = node --version
    $majorVersion = [int]($nodeVersion -replace 'v(\d+)\..*', '$1')
    
    if ($majorVersion -ge 18) {
        Write-Host "✅ Node.js $nodeVersion is compatible" -ForegroundColor Green
    } else {
        Write-Host "❌ Node.js version $nodeVersion is too old. Please install Node.js 18+" -ForegroundColor Red
        Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
        pause
        exit 1
    }
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js 18+" -ForegroundColor Red
    Write-Host "Download from: https://nodejs.org/" -ForegroundColor Yellow
    pause
    exit 1
}

# Configure npm registry
Write-Host "🌐 Configuring npm registry..." -ForegroundColor Blue
npm config set registry https://registry.npmjs.org/
Write-Host "✅ Registry set to public npm" -ForegroundColor Green

# Clean npm cache
Write-Host "🧹 Cleaning npm cache..." -ForegroundColor Blue
npm cache clean --force
Write-Host "✅ Cache cleaned" -ForegroundColor Green

# Remove existing node_modules and lock files
Write-Host "🗑️  Removing existing dependencies..." -ForegroundColor Blue
if (Test-Path "node_modules") {
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "package-lock.json") {
    Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
}
if (Test-Path "backend/node_modules") {
    Remove-Item -Recurse -Force backend/node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "frontend/node_modules") {
    Remove-Item -Recurse -Force frontend/node_modules -ErrorAction SilentlyContinue
}
if (Test-Path "shared/node_modules") {
    Remove-Item -Recurse -Force shared/node_modules -ErrorAction SilentlyContinue
}
Write-Host "✅ Old dependencies removed" -ForegroundColor Green

# Install Yarn globally
Write-Host "📦 Installing Yarn globally..." -ForegroundColor Blue
try {
    npm install -g yarn
    Write-Host "✅ Yarn installed successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Warning: Could not install Yarn globally" -ForegroundColor Yellow
}

# Install dependencies using Yarn
Write-Host "📥 Installing project dependencies..." -ForegroundColor Blue
try {
    yarn install
    Write-Host "✅ Dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "❌ Yarn installation failed. Trying with npm..." -ForegroundColor Yellow
    
    # Fallback to npm
    try {
        npm install
        Write-Host "✅ Dependencies installed with npm" -ForegroundColor Green
    } catch {
        Write-Host "❌ Both Yarn and npm installation failed" -ForegroundColor Red
        Write-Host "Please check your internet connection and try again" -ForegroundColor Yellow
        pause
        exit 1
    }
}

# Copy environment file
Write-Host "⚙️  Setting up environment configuration..." -ForegroundColor Blue
if (Test-Path "backend/env.example") {
    if (-not (Test-Path "backend/.env")) {
        Copy-Item "backend/env.example" "backend/.env"
        Write-Host "✅ Environment file created" -ForegroundColor Green
        Write-Host "📝 Please edit backend/.env with your database credentials" -ForegroundColor Yellow
    } else {
        Write-Host "✅ Environment file already exists" -ForegroundColor Green
    }
} else {
    Write-Host "⚠️  Warning: backend/env.example not found" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Setup completed successfully!" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Blue
Write-Host "1. Configure your database in backend/.env" -ForegroundColor White
Write-Host "2. Run: yarn dev (or npm run dev)" -ForegroundColor White
Write-Host "3. Open http://localhost:3000 in your browser" -ForegroundColor White
Write-Host ""
Write-Host "For troubleshooting, see the README.md file" -ForegroundColor Yellow
Write-Host ""
pause
