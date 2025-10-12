@echo off
echo 🚀 BPL Commander Optimized Build
echo ================================

echo [INFO] Starting optimized build process...

echo [INFO] Cleaning previous builds...
if exist "backend\dist" rmdir /s /q "backend\dist"
if exist "frontend\build" rmdir /s /q "frontend\build"

echo [INFO] Building backend with incremental compilation...
cd backend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Backend build failed
    exit /b 1
)
cd ..

echo [INFO] Building frontend with optimized bundling...
cd frontend
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed
    exit /b 1
)
cd ..

echo [SUCCESS] ✅ Build completed successfully!
echo [INFO] Backend: backend\dist
echo [INFO] Frontend: frontend\build

echo.
echo 🎯 Build Performance Tips:
echo - Use 'npm run dev' for development (faster hot reload)
echo - Backend uses incremental TypeScript compilation
echo - Frontend uses Vite with optimized chunking
echo - Consider using 'npm run build:backend' or 'npm run build:frontend' for individual builds

pause
