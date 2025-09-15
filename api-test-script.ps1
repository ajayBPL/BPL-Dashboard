# BPL Commander API Testing Script
# This script helps you test and feed data to the API

$baseUrl = "http://192.168.29.213:3001"
$frontendUrl = "http://192.168.29.213:3000"

Write-Host "🚀 BPL Commander API Testing Script" -ForegroundColor Green
Write-Host "=====================================" -ForegroundColor Green

# Function to make API calls
function Invoke-ApiCall {
    param(
        [string]$Method,
        [string]$Endpoint,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $uri = "$baseUrl$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.Body = $Body
            $params.ContentType = "application/json"
        }
        
        $response = Invoke-WebRequest @params
        return $response
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Test 1: Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Yellow
$healthResponse = Invoke-ApiCall -Method "GET" -Endpoint "/health"
if ($healthResponse) {
    Write-Host "✅ Backend is running!" -ForegroundColor Green
    Write-Host "Response: $($healthResponse.Content)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Backend is not accessible" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "`n2. Testing Login..." -ForegroundColor Yellow
$loginBody = @{
    email = "admin@bpl.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-ApiCall -Method "POST" -Endpoint "/api/auth/login" -Body $loginBody
if ($loginResponse) {
    $loginData = $loginResponse.Content | ConvertFrom-Json
    if ($loginData.success) {
        Write-Host "✅ Login successful!" -ForegroundColor Green
        $token = $loginData.data.token
        Write-Host "Token: $($token.Substring(0, 20))..." -ForegroundColor Cyan
    } else {
        Write-Host "❌ Login failed: $($loginData.error)" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Login request failed" -ForegroundColor Red
    exit 1
}

# Test 3: Get Users
Write-Host "`n3. Testing Get Users..." -ForegroundColor Yellow
$headers = @{
    "Authorization" = "Bearer $token"
}
$usersResponse = Invoke-ApiCall -Method "GET" -Endpoint "/api/users" -Headers $headers
if ($usersResponse) {
    $usersData = $usersResponse.Content | ConvertFrom-Json
    Write-Host "✅ Users retrieved successfully!" -ForegroundColor Green
    Write-Host "Total users: $($usersData.data.length)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to get users" -ForegroundColor Red
}

# Test 4: Get Projects
Write-Host "`n4. Testing Get Projects..." -ForegroundColor Yellow
$projectsResponse = Invoke-ApiCall -Method "GET" -Endpoint "/api/projects" -Headers $headers
if ($projectsResponse) {
    $projectsData = $projectsResponse.Content | ConvertFrom-Json
    Write-Host "✅ Projects retrieved successfully!" -ForegroundColor Green
    Write-Host "Total projects: $($projectsData.data.length)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to get projects" -ForegroundColor Red
}

# Test 5: Create a Test Project
Write-Host "`n5. Testing Create Project..." -ForegroundColor Yellow
$newProject = @{
    title = "API Test Project"
    description = "This project was created via API testing script"
    priority = "medium"
    estimated_hours = 50
    status = "planning"
    budget_amount = 5000
    budget_currency = "USD"
} | ConvertTo-Json

$createResponse = Invoke-ApiCall -Method "POST" -Endpoint "/api/projects" -Headers $headers -Body $newProject
if ($createResponse) {
    $createData = $createResponse.Content | ConvertFrom-Json
    if ($createData.success) {
        Write-Host "✅ Project created successfully!" -ForegroundColor Green
        Write-Host "Project ID: $($createData.data.id)" -ForegroundColor Cyan
    } else {
        Write-Host "❌ Project creation failed: $($createData.error)" -ForegroundColor Red
    }
} else {
    Write-Host "❌ Project creation request failed" -ForegroundColor Red
}

# Test 6: Get Mock Users
Write-Host "`n6. Testing Mock Users..." -ForegroundColor Yellow
$mockUsersResponse = Invoke-ApiCall -Method "GET" -Endpoint "/api/mock-users" -Headers $headers
if ($mockUsersResponse) {
    $mockUsersData = $mockUsersResponse.Content | ConvertFrom-Json
    Write-Host "✅ Mock users retrieved successfully!" -ForegroundColor Green
    Write-Host "Mock users count: $($mockUsersData.data.length)" -ForegroundColor Cyan
} else {
    Write-Host "❌ Failed to get mock users" -ForegroundColor Red
}

# Summary
Write-Host "`n🎉 API Testing Complete!" -ForegroundColor Green
Write-Host "=========================" -ForegroundColor Green
Write-Host "Frontend URL: $frontendUrl" -ForegroundColor Cyan
Write-Host "Backend URL: $baseUrl" -ForegroundColor Cyan
Write-Host "`nYou can now:" -ForegroundColor Yellow
Write-Host "1. Access the application at: $frontendUrl" -ForegroundColor White
Write-Host "2. Use the API endpoints to feed data" -ForegroundColor White
Write-Host "3. Share the URLs with your team members" -ForegroundColor White
Write-Host "`nFor more information, check NETWORK_ACCESS_GUIDE.md" -ForegroundColor Cyan
