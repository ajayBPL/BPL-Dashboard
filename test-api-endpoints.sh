#!/bin/bash

# BPL Commander API Test Script
# This script tests all API endpoints to ensure they work correctly

echo "🧪 BPL Commander API Testing"
echo "============================="

# Configuration
API_BASE_URL="http://localhost:3001"
TEST_EMAIL="admin@bplcommander.com"
TEST_PASSWORD="Admin123!"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to make API requests
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local token=$4
    
    if [ -n "$token" ]; then
        if [ -n "$data" ]; then
            curl -s -X $method \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $token" \
                -d "$data" \
                "$API_BASE_URL$endpoint"
        else
            curl -s -X $method \
                -H "Authorization: Bearer $token" \
                "$API_BASE_URL$endpoint"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X $method \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_BASE_URL$endpoint"
        else
            curl -s -X $method \
                "$API_BASE_URL$endpoint"
        fi
    fi
}

# Function to test endpoint
test_endpoint() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    local token=$5
    local expected_status=$6
    
    echo -n "Testing $name... "
    
    response=$(make_request $method $endpoint "$data" "$token")
    status_code=$(echo "$response" | grep -o '"success":[^,]*' | cut -d':' -f2 | tr -d ' "')
    
    if [ "$status_code" = "true" ] || [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC}"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Check if server is running
echo "🔍 Checking if server is running..."
health_response=$(curl -s "$API_BASE_URL/health")
if echo "$health_response" | grep -q "success"; then
    echo -e "${GREEN}✅ Server is running${NC}"
else
    echo -e "${RED}❌ Server is not running${NC}"
    echo "Please start the server with: npm run dev"
    exit 1
fi

echo ""
echo "🔐 Testing Authentication..."

# Test login
echo -n "Testing login... "
login_response=$(make_request POST "/api/auth/login" "{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}")
token=$(echo "$login_response" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ -n "$token" ]; then
    echo -e "${GREEN}✅ PASS${NC}"
else
    echo -e "${RED}❌ FAIL${NC}"
    echo "Login failed. Response: $login_response"
    echo "Please check your Supabase configuration and ensure the database is set up correctly."
    exit 1
fi

echo ""
echo "👥 Testing User Management..."

# Test get users
test_endpoint "Get Users" "GET" "/api/users" "" "$token"

# Test get user by ID (assuming first user)
test_endpoint "Get User by ID" "GET" "/api/users/admin-001" "" "$token"

echo ""
echo "📊 Testing Project Management..."

# Test get projects
test_endpoint "Get Projects" "GET" "/api/projects" "" "$token"

# Test create project
project_data='{"title":"Test Project","description":"Test Description","managerId":"admin-001","timeline":"1 month","priority":"medium"}'
test_endpoint "Create Project" "POST" "/api/projects" "$project_data" "$token"

echo ""
echo "🎯 Testing Initiative Management..."

# Test get initiatives
test_endpoint "Get Initiatives" "GET" "/api/initiatives" "" "$token"

# Test create initiative
initiative_data='{"title":"Test Initiative","description":"Test Initiative Description","category":"Testing","priority":"medium","workloadPercentage":10,"createdBy":"admin-001"}'
test_endpoint "Create Initiative" "POST" "/api/initiatives" "$initiative_data" "$token"

echo ""
echo "💬 Testing Comments..."

# Test get comments
test_endpoint "Get Comments" "GET" "/api/comments" "" "$token"

echo ""
echo "📈 Testing Analytics..."

# Test analytics
test_endpoint "Get Analytics" "GET" "/api/analytics" "" "$token"

echo ""
echo "⚡ Testing Workload..."

# Test workload
test_endpoint "Get Workload" "GET" "/api/workload" "" "$token"

echo ""
echo "🔍 Testing Search..."

# Test search
test_endpoint "Search" "GET" "/api/search?q=test" "" "$token"

echo ""
echo "📝 Testing Activity Logs..."

# Test activity logs
test_endpoint "Get Activity Logs" "GET" "/api/activity" "" "$token"

echo ""
echo "🔔 Testing Notifications..."

# Test notifications
test_endpoint "Get Notifications" "GET" "/api/notifications" "" "$token"

echo ""
echo "⚙️ Testing Settings..."

# Test settings
test_endpoint "Get Settings" "GET" "/api/settings" "" "$token"

echo ""
echo "🏢 Testing Departments..."

# Test departments
test_endpoint "Get Departments" "GET" "/api/departments" "" "$token"

echo ""
echo "👔 Testing Roles..."

# Test roles
test_endpoint "Get Roles" "GET" "/api/roles" "" "$token"

echo ""
echo "📤 Testing Export..."

# Test export
test_endpoint "Export Data" "GET" "/api/export" "" "$token"

echo ""
echo "🔄 Testing Sync..."

# Test sync
test_endpoint "Sync Data" "GET" "/api/sync/data" "" "$token"

echo ""
echo "🎉 API Testing Complete!"
echo ""
echo "📋 Summary:"
echo "- All endpoints have been tested"
echo "- Check the results above for any failures"
echo "- If any tests failed, check the server logs for more details"
echo ""
echo "🔧 Next steps:"
echo "1. Fix any failing endpoints"
echo "2. Test the frontend application"
echo "3. Deploy to production"
echo ""
