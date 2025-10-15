@echo off
echo Killing all development server processes...

echo Killing port 3000 (Frontend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Killing port 3001 (Backend)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Killing port 5173 (Vite)...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo Killing all Node.js processes...
taskkill /IM node.exe /F >nul 2>&1

echo All development processes killed!
pause