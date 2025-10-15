# BPL Commander API Test Script for Windows PowerShell
# This script tests all API endpoints to ensure they work correctly

Write-Host "🧪 BPL Commander API Testing" -ForegroundColor Cyan
Write-Host "=============================" -ForegroundColor Cyan

# Configuration
$API_BASE_URL = "http://localhost:3001"
$TEST_EMAIL = "admin@bplcommander.com"
$TEST_PASSWORD = "Admin123!"

# Function to make API requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = $null,
        [string]$Token = $null
    )
    
    $headers = @{
        "Content-Type" = "application/json"
    }
    
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }
    
    try {
        if ($Data) {
            $response = Invoke-RestMethod -Uri "$API_BASE_URL$Endpoint" -Method $Method -Headers $headers -Body $Data
        } else {
            $response = Invoke-RestMethod -Uri "$API_BASE_URL$Endpoint" -Method $Method -Headers $headers
        }
        return $response
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        return $null
    }
}

# Function to test endpoint
function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Endpoint,
        [string]$Data = $null,
        [string]$Token = $null,
        [string]$ExpectedStatus = "true"
    )
    
    Write-Host "Testing $Name... " -NoNewline
    
    try {
        $response = Invoke-ApiRequest -Method $Method -Endpoint $Endpoint -Data $Data -Token $Token
        
        if ($response -and ($response.success -eq $true -or $response.success -eq $ExpectedStatus)) {
            Write-Host "✅ PASS" -ForegroundColor Green
            return $true
        } else {
            Write-Host "❌ FAIL" -ForegroundColor Red
            Write-Host "Response: $($response | ConvertTo-Json -Depth 2)" -ForegroundColor Yellow
            return $false
        }
    } catch {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
}

# Check if server is running
Write-Host "🔍 Checking if server is running..." -ForegroundColor Blue
try {
    $healthResponse = Invoke-RestMethod -Uri "$API_BASE_URL/health" -Method GET
    if ($healthResponse.success) {
        Write-Host "✅ Server is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Server is not running" -ForegroundColor Red
        Write-Host "Please start the server with: npm run dev" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ Server is not running" -ForegroundColor Red
    Write-Host "Please start the server with: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🔐 Testing Authentication..." -ForegroundColor Blue

# Test login
Write-Host "Testing login... " -NoNewline
$loginData = @{
    email = $TEST_EMAIL
    password = $TEST_PASSWORD
} | ConvertTo-Json

try {
    $loginResponse = Invoke-ApiRequest -Method POST -Endpoint "/api/auth/login" -Data $loginData
    if ($loginResponse -and $loginResponse.token) {
        $token = $loginResponse.token
        Write-Host "✅ PASS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAIL" -ForegroundColor Red
        Write-Host "Login failed. Please check your Supabase configuration." -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "❌ FAIL" -ForegroundColor Red
    Write-Host "Login failed. Please check your Supabase configuration." -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "👥 Testing User Management..." -ForegroundColor Blue

# Test get users
Test-ApiEndpoint -Name "Get Users" -Method GET -Endpoint "/api/users" -Token $token

# Test get user by ID
Test-ApiEndpoint -Name "Get User by ID" -Method GET -Endpoint "/api/users/admin-001" -Token $token

Write-Host ""
Write-Host "📊 Testing Project Management..." -ForegroundColor Blue

# Test get projects
Test-ApiEndpoint -Name "Get Projects" -Method GET -Endpoint "/api/projects" -Token $token

# Test create project
$projectData = @{
    title = "Test Project"
    description = "Test Description"
    managerId = "admin-001"
    timeline = "1 month"
    priority = "medium"
} | ConvertTo-Json

Test-ApiEndpoint -Name "Create Project" -Method POST -Endpoint "/api/projects" -Data $projectData -Token $token

Write-Host ""
Write-Host "🎯 Testing Initiative Management..." -ForegroundColor Blue

# Test get initiatives
Test-ApiEndpoint -Name "Get Initiatives" -Method GET -Endpoint "/api/initiatives" -Token $token

# Test create initiative
$initiativeData = @{
    title = "Test Initiative"
    description = "Test Initiative Description"
    category = "Testing"
    priority = "medium"
    workloadPercentage = 10
    createdBy = "admin-001"
} | ConvertTo-Json

Test-ApiEndpoint -Name "Create Initiative" -Method POST -Endpoint "/api/initiatives" -Data $initiativeData -Token $token

Write-Host ""
Write-Host "💬 Testing Comments..." -ForegroundColor Blue

# Test get comments
Test-ApiEndpoint -Name "Get Comments" -Method GET -Endpoint "/api/comments" -Token $token

Write-Host ""
Write-Host "📈 Testing Analytics..." -ForegroundColor Blue

# Test analytics
Test-ApiEndpoint -Name "Get Analytics" -Method GET -Endpoint "/api/analytics" -Token $token

Write-Host ""
Write-Host "⚡ Testing Workload..." -ForegroundColor Blue

# Test workload
Test-ApiEndpoint -Name "Get Workload" -Method GET -Endpoint "/api/workload" -Token $token

Write-Host ""
Write-Host "🔍 Testing Search..." -ForegroundColor Blue

# Test search
Test-ApiEndpoint -Name "Search" -Method GET -Endpoint "/api/search?q=test" -Token $token

Write-Host ""
Write-Host "📝 Testing Activity Logs..." -ForegroundColor Blue

# Test activity logs
Test-ApiEndpoint -Name "Get Activity Logs" -Method GET -Endpoint "/api/activity" -Token $token

Write-Host ""
Write-Host "🔔 Testing Notifications..." -ForegroundColor Blue

# Test notifications
Test-ApiEndpoint -Name "Get Notifications" -Method GET -Endpoint "/api/notifications" -Token $token

Write-Host ""
Write-Host "⚙️ Testing Settings..." -ForegroundColor Blue

# Test settings
Test-ApiEndpoint -Name "Get Settings" -Method GET -Endpoint "/api/settings" -Token $token

Write-Host ""
Write-Host "🏢 Testing Departments..." -ForegroundColor Blue

# Test departments
Test-ApiEndpoint -Name "Get Departments" -Method GET -Endpoint "/api/departments" -Token $token

Write-Host ""
Write-Host "👔 Testing Roles..." -ForegroundColor Blue

# Test roles
Test-ApiEndpoint -Name "Get Roles" -Method GET -Endpoint "/api/roles" -Token $token

Write-Host ""
Write-Host "📤 Testing Export..." -ForegroundColor Blue

# Test export
Test-ApiEndpoint -Name "Export Data" -Method GET -Endpoint "/api/export" -Token $token

Write-Host ""
Write-Host "🔄 Testing Sync..." -ForegroundColor Blue

# Test sync
Test-ApiEndpoint -Name "Sync Data" -Method GET -Endpoint "/api/sync/data" -Token $token

Write-Host ""
Write-Host "🎉 API Testing Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary:" -ForegroundColor Cyan
Write-Host "- All endpoints have been tested" -ForegroundColor White
Write-Host "- Check the results above for any failures" -ForegroundColor White
Write-Host "- If any tests failed, check the server logs for more details" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Next steps:" -ForegroundColor Cyan
Write-Host "1. Fix any failing endpoints" -ForegroundColor White
Write-Host "2. Test the frontend application" -ForegroundColor White
Write-Host "3. Deploy to production" -ForegroundColor White
Write-Host ""

Read-Host "Press Enter to continue"
