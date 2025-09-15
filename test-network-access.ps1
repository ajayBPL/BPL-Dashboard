# BPL Commander Network Access Test Script
# Run this script to test if the application is accessible from other systems

Write-Host "🔍 BPL Commander Network Access Test" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

$hostIP = "192.168.29.213"
$frontendPort = 3000
$backendPort = 3001

# Test 1: Check if services are running
Write-Host "`n1. Checking if services are running..." -ForegroundColor Yellow

$frontendListening = netstat -an | findstr ":3000" | findstr "LISTENING"
$backendListening = netstat -an | findstr ":3001" | findstr "LISTENING"

if ($frontendListening) {
    Write-Host "✅ Frontend is running on port 3000" -ForegroundColor Green
} else {
    Write-Host "❌ Frontend is NOT running on port 3000" -ForegroundColor Red
}

if ($backendListening) {
    Write-Host "✅ Backend is running on port 3001" -ForegroundColor Green
} else {
    Write-Host "❌ Backend is NOT running on port 3001" -ForegroundColor Red
}

# Test 2: Test local access
Write-Host "`n2. Testing local access..." -ForegroundColor Yellow

try {
    $frontendResponse = Invoke-WebRequest -Uri "http://localhost:$frontendPort" -Method GET -TimeoutSec 5
    Write-Host "✅ Frontend accessible locally" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend NOT accessible locally: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $backendResponse = Invoke-WebRequest -Uri "http://localhost:$backendPort/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend accessible locally" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend NOT accessible locally: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Test network access
Write-Host "`n3. Testing network access..." -ForegroundColor Yellow

try {
    $frontendNetworkResponse = Invoke-WebRequest -Uri "http://${hostIP}:${frontendPort}" -Method GET -TimeoutSec 5
    Write-Host "✅ Frontend accessible via network (${hostIP}:${frontendPort})" -ForegroundColor Green
} catch {
    Write-Host "❌ Frontend NOT accessible via network: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This is likely a Windows Firewall issue!" -ForegroundColor Yellow
}

try {
    $backendNetworkResponse = Invoke-WebRequest -Uri "http://${hostIP}:${backendPort}/health" -Method GET -TimeoutSec 5
    Write-Host "✅ Backend accessible via network (${hostIP}:${backendPort})" -ForegroundColor Green
} catch {
    Write-Host "❌ Backend NOT accessible via network: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "   This is likely a Windows Firewall issue!" -ForegroundColor Yellow
}

# Test 4: Check Windows Firewall
Write-Host "`n4. Checking Windows Firewall..." -ForegroundColor Yellow

$firewallRules = netsh advfirewall firewall show rule name="BPL Frontend" | Out-String
if ($firewallRules -match "BPL Frontend") {
    Write-Host "✅ BPL Frontend firewall rule exists" -ForegroundColor Green
} else {
    Write-Host "❌ BPL Frontend firewall rule NOT found" -ForegroundColor Red
    Write-Host "   Run as Administrator: netsh advfirewall firewall add rule name=`"BPL Frontend`" dir=in action=allow protocol=TCP localport=3000" -ForegroundColor Yellow
}

$firewallRulesBackend = netsh advfirewall firewall show rule name="BPL Backend" | Out-String
if ($firewallRulesBackend -match "BPL Backend") {
    Write-Host "✅ BPL Backend firewall rule exists" -ForegroundColor Green
} else {
    Write-Host "❌ BPL Backend firewall rule NOT found" -ForegroundColor Red
    Write-Host "   Run as Administrator: netsh advfirewall firewall add rule name=`"BPL Backend`" dir=in action=allow protocol=TCP localport=3001" -ForegroundColor Yellow
}

# Summary
Write-Host "`n📋 Summary:" -ForegroundColor Cyan
Write-Host "===========" -ForegroundColor Cyan
Write-Host "Frontend URL: http://${hostIP}:${frontendPort}" -ForegroundColor White
Write-Host "Backend URL: http://${hostIP}:${backendPort}" -ForegroundColor White
Write-Host "`nFor team members to access:" -ForegroundColor Yellow
Write-Host "1. Ensure they're on the same network (192.168.29.x)" -ForegroundColor White
Write-Host "2. Open browser and go to: http://${hostIP}:${frontendPort}" -ForegroundColor White
Write-Host "3. If it doesn't work, check Windows Firewall settings" -ForegroundColor White
Write-Host "`nFor detailed troubleshooting, see TROUBLESHOOTING_NETWORK_ACCESS.md" -ForegroundColor Cyan
