# Simple Network Access Test
Write-Host "BPL Commander Network Access Test" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

$hostIP = "192.168.29.213"
$frontendPort = 3000
$backendPort = 3001

# Test 1: Check if services are running
Write-Host "`n1. Checking if services are running..." -ForegroundColor Yellow

$frontendListening = netstat -an | findstr ":3000" | findstr "LISTENING"
$backendListening = netstat -an | findstr ":3001" | findstr "LISTENING"

if ($frontendListening) {
    Write-Host "SUCCESS: Frontend is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "ERROR: Frontend is NOT running on port 3000" -ForegroundColor Red
}

if ($backendListening) {
    Write-Host "SUCCESS: Backend is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "ERROR: Backend is NOT running on port 3001" -ForegroundColor Red
}

# Test 2: Test network access
Write-Host "`n2. Testing network access..." -ForegroundColor Yellow

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://192.168.29.213:3000" -Method GET -TimeoutSec 5
    Write-Host "SUCCESS: Frontend accessible via network" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Frontend NOT accessible via network" -ForegroundColor Red
    Write-Host "This is likely a Windows Firewall issue!" -ForegroundColor Yellow
}

try {
    $backendResponse = Invoke-WebRequest -Uri "http://192.168.29.213:3001/health" -Method GET -TimeoutSec 5
    Write-Host "SUCCESS: Backend accessible via network" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Backend NOT accessible via network" -ForegroundColor Red
    Write-Host "This is likely a Windows Firewall issue!" -ForegroundColor Yellow
}

# Summary
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan
Write-Host "Frontend URL: http://192.168.29.213:3000" -ForegroundColor White
Write-Host "Backend URL: http://192.168.29.213:3001" -ForegroundColor White
Write-Host "`nFor team members to access:" -ForegroundColor Yellow
Write-Host "1. Ensure they are on the same network (192.168.29.x)" -ForegroundColor White
Write-Host "2. Open browser and go to: http://192.168.29.213:3000" -ForegroundColor White
Write-Host "3. If it does not work, check Windows Firewall settings" -ForegroundColor White
