@echo off
REM Build Optimization Script for BPL Commander Frontend (Windows)
REM This script optimizes the build process and provides different build modes

echo 🚀 BPL Commander Frontend Build Optimizer
echo ==========================================

REM Function to clean build artifacts
if "%1"=="clean" (
    echo 🧹 Cleaning build artifacts...
    if exist build rmdir /s /q build
    if exist dist rmdir /s /q dist
    if exist node_modules\.vite rmdir /s /q node_modules\.vite
    echo ✅ Build artifacts cleaned
    goto :eof
)

REM Function to check dependencies
if not exist node_modules (
    echo ⚠️  node_modules not found. Installing dependencies...
    npm install
) else (
    echo ✅ Dependencies found
)

REM Main build commands
if "%1"=="fast" (
    echo ⚡ Running fast build (development mode)...
    npm run build:fast
    echo ✅ Fast build completed
    goto :show_stats
)

if "%1"=="prod" (
    echo 🏭 Running production build...
    npm run build
    echo ✅ Production build completed
    goto :show_stats
)

if "%1"=="analyze" (
    echo 📊 Analyzing bundle size...
    npm run build:analyze
    echo ✅ Bundle analysis completed
    goto :eof
)

if "%1"=="stats" (
    goto :show_stats
)

REM Show usage if no valid command
echo Usage: %0 {clean^|fast^|prod^|analyze^|stats}
echo.
echo Commands:
echo   clean   - Clean build artifacts
echo   fast    - Fast build (development mode)
echo   prod    - Production build
echo   analyze - Analyze bundle size
echo   stats   - Show build statistics
echo.
echo Examples:
echo   %0 fast    # Quick build for development
echo   %0 prod    # Full production build
echo   %0 analyze # Analyze bundle and show recommendations
goto :eof

:show_stats
if exist build (
    echo 📈 Build Statistics:
    echo ===================
    for /f "tokens=3" %%a in ('dir build /s /-c ^| find "File(s)"') do echo Total build size: %%a bytes
    echo JavaScript files: 
    for /f "tokens=3" %%a in ('dir build\*.js /s /-c ^| find "File(s)"') do echo   %%a bytes
    echo CSS files:
    for /f "tokens=3" %%a in ('dir build\*.css /s /-c ^| find "File(s)"') do echo   %%a bytes
) else (
    echo ❌ No build directory found
)
goto :eof
