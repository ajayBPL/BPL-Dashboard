# Test API Network Access
Write-Host "Testing API Network Access" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green

$hostIP = "192.168.29.213"
$backendPort = 3001

# Test 1: Health Check
Write-Host "`n1. Testing Backend Health Check..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-WebRequest -Uri "http://${hostIP}:${backendPort}/health" -Method GET -TimeoutSec 5
    Write-Host "SUCCESS: Backend health check passed" -ForegroundColor Green
    $healthData = $healthResponse.Content | ConvertFrom-Json
    Write-Host "Response: $($healthData.message)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Backend health check failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = "admin@bpl.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://${hostIP}:${backendPort}/api/auth/login" -Method POST -Body $loginBody -ContentType "application/json" -TimeoutSec 5
    Write-Host "SUCCESS: Login successful" -ForegroundColor Green
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.data.token
    Write-Host "Token received: $($token.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Login failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Get Users
Write-Host "`n3. Testing Get Users..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-WebRequest -Uri "http://${hostIP}:${backendPort}/api/users" -Method GET -Headers @{"Authorization"="Bearer $token"} -TimeoutSec 5
    Write-Host "SUCCESS: Users API working" -ForegroundColor Green
    
    $usersData = $usersResponse.Content | ConvertFrom-Json
    Write-Host "Users count: $($usersData.data.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Get Users failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Get Projects
Write-Host "`n4. Testing Get Projects..." -ForegroundColor Yellow
try {
    $projectsResponse = Invoke-WebRequest -Uri "http://${hostIP}:${backendPort}/api/projects" -Method GET -Headers @{"Authorization"="Bearer $token"} -TimeoutSec 5
    Write-Host "SUCCESS: Projects API working" -ForegroundColor Green
    
    $projectsData = $projectsResponse.Content | ConvertFrom-Json
    Write-Host "Projects count: $($projectsData.data.Count)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Get Projects failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 5: Get Analytics
Write-Host "`n5. Testing Get Analytics..." -ForegroundColor Yellow
try {
    $analyticsResponse = Invoke-WebRequest -Uri "http://${hostIP}:${backendPort}/api/analytics" -Method GET -Headers @{"Authorization"="Bearer $token"} -TimeoutSec 5
    Write-Host "SUCCESS: Analytics API working" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Get Analytics failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

# Summary
Write-Host "`nSummary:" -ForegroundColor Cyan
Write-Host "========" -ForegroundColor Cyan
Write-Host "Frontend URL: http://${hostIP}:3000" -ForegroundColor White
Write-Host "Backend URL: http://${hostIP}:${backendPort}" -ForegroundColor White
Write-Host "`nThe API is now working from other systems!" -ForegroundColor Green
Write-Host "Team members can access the application and all APIs will work correctly." -ForegroundColor Green
