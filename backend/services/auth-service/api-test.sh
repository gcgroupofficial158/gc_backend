#!/bin/bash

# API Test Script for Auth Service
# Author: Ganesh Patel
# This script tests the API endpoints using curl

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:3001"

# Test counters
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Generate unique test email for this run
RUN_ID=$(date +%s)
TEST_EMAIL="test-${RUN_ID}@example.com"
TEST_PASSWORD="Password123"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    
    ((TOTAL_TESTS++))
    
    print_status "Testing: $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(printf "%s" "$response" | tail -n 1)
    # Extract response body (all lines except last) - portable for macOS/BSD
    response_body=$(printf "%s" "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$description - Status: $status_code"
        printf "Response: %s" "$response_body" | head -c 200
        echo "..."
    else
        print_error "$description - Expected: $expected_status, Got: $status_code"
        echo "Response: $response_body"
    fi
    echo ""
}

# Function to test with authentication
test_endpoint_with_auth() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    local description=$5
    local auth_token=$6
    
    ((TOTAL_TESTS++))
    
    print_status "Testing: $description"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $auth_token" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $auth_token" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $auth_token" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Bearer $auth_token" "$BASE_URL$endpoint")
    fi
    
    # Extract status code (last line)
    status_code=$(printf "%s" "$response" | tail -n 1)
    # Extract response body (all lines except last) - portable for macOS/BSD
    response_body=$(printf "%s" "$response" | sed '$d')
    
    if [ "$status_code" = "$expected_status" ]; then
        print_success "$description - Status: $status_code"
        printf "Response: %s" "$response_body" | head -c 200
        echo "..."
    else
        print_error "$description - Expected: $expected_status, Got: $status_code"
        echo "Response: $response_body"
    fi
    echo ""
}

# Function to extract token from response
extract_token() {
    local response=$1
    echo "$response" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4
}

# Function to extract refresh token from response
extract_refresh_token() {
    local response=$1
    echo "$response" | grep -o '"refreshToken":"[^"]*"' | cut -d'"' -f4
}

# Function to extract user ID from response
extract_user_id() {
    local response=$1
    echo "$response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4
}

echo "🧪 Auth Service API Test Suite"
echo "Author: Ganesh Patel"
echo "=================================="
echo ""

# Check if service is running
print_status "Checking if auth service is running..."
if curl -s "$BASE_URL/api/v1/health" > /dev/null; then
    print_success "Auth service is running"
else
    print_error "Auth service is not running. Please start it first."
    exit 1
fi
echo ""

# Test 1: Health Check
test_endpoint "GET" "/api/v1/health" "" "200" "Health Check"

# Test 2: API Documentation
test_endpoint "GET" "/api/v1/docs" "" "200" "API Documentation"

# Test 3: User Registration - Valid Data
print_status "Testing user registration..."
registration_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "{
    \"firstName\": \"John\",
    \"lastName\": \"Doe\",
    \"email\": \"$TEST_EMAIL\",
    \"password\": \"$TEST_PASSWORD\",
    \"phone\": \"+1234567890\",
    \"role\": \"user\"
}" "$BASE_URL/api/v1/auth/register")

registration_status=$(printf "%s" "$registration_response" | tail -n 1)
registration_body=$(printf "%s" "$registration_response" | sed '$d')

if [ "$registration_status" = "201" ]; then
    print_success "User Registration - Status: $registration_status"
    ACCESS_TOKEN=$(extract_token "$registration_body")
    REFRESH_TOKEN=$(extract_refresh_token "$registration_body")
    USER_ID=$(extract_user_id "$registration_body")
    echo "Access Token: ${ACCESS_TOKEN:0:50}..."
    echo "Refresh Token: ${REFRESH_TOKEN:0:50}..."
    echo "User ID: $USER_ID"
else
    print_error "User Registration - Expected: 201, Got: $registration_status"
    echo "Response: $registration_body"
fi
echo ""

# Test 4: User Registration - Duplicate Email
# Duplicate email should now hit the same unique email and return 400
test_endpoint "POST" "/api/v1/auth/register" "{\n    \"firstName\": \"Jane\",\n    \"lastName\": \"Doe\",\n    \"email\": \"$TEST_EMAIL\",\n    \"password\": \"$TEST_PASSWORD\",\n    \"phone\": \"+1234567891\",\n    \"role\": \"user\"\n}" "400" "User Registration - Duplicate Email"

# Test 5: User Registration - Invalid Data
test_endpoint "POST" "/api/v1/auth/register" '{
    "firstName": "J",
    "lastName": "D",
    "email": "invalid-email",
    "password": "123",
    "phone": "invalid-phone",
    "role": "invalid-role"
}' "400" "User Registration - Invalid Data"

# Test 6: User Login - Valid Credentials
print_status "Testing user login..."
login_response=$(curl -s -w "\n%{http_code}" -X POST -H "Content-Type: application/json" -d "{\n    \"email\": \"$TEST_EMAIL\",\n    \"password\": \"$TEST_PASSWORD\"\n}" "$BASE_URL/api/v1/auth/login")

login_status=$(printf "%s" "$login_response" | tail -n 1)
login_body=$(printf "%s" "$login_response" | sed '$d')

if [ "$login_status" = "200" ]; then
    print_success "User Login - Status: $login_status"
    LOGIN_ACCESS_TOKEN=$(extract_token "$login_body")
    LOGIN_REFRESH_TOKEN=$(extract_refresh_token "$login_body")
    echo "Login Access Token: ${LOGIN_ACCESS_TOKEN:0:50}..."
    echo "Login Refresh Token: ${LOGIN_REFRESH_TOKEN:0:50}..."
else
    print_error "User Login - Expected: 200, Got: $login_status"
    echo "Response: $login_body"
fi
echo ""

# Test 7: User Login - Invalid Credentials
test_endpoint "POST" "/api/v1/auth/login" "{\n    \"email\": \"$TEST_EMAIL\",\n    \"password\": \"WrongPassword\"\n}" "401" "User Login - Invalid Credentials"

# Test 8: User Login - Non-existent User
test_endpoint "POST" "/api/v1/auth/login" '{
    "email": "nonexistent@example.com",
    "password": "Password123"
}' "401" "User Login - Non-existent User"

# Test 9: Get User Profile - With Valid Token
if [ ! -z "$ACCESS_TOKEN" ]; then
    test_endpoint_with_auth "GET" "/api/v1/auth/profile" "" "200" "Get User Profile" "$ACCESS_TOKEN"
else
    print_warning "Skipping profile test - no access token available"
fi

# Test 10: Get User Profile - Without Token
test_endpoint "GET" "/api/v1/auth/profile" "" "401" "Get User Profile - No Token"

# Test 11: Get User Profile - Invalid Token
test_endpoint_with_auth "GET" "/api/v1/auth/profile" "" "401" "Get User Profile - Invalid Token" "invalid-token"

# Test 12: Update User Profile - With Valid Token
if [ ! -z "$ACCESS_TOKEN" ]; then
    test_endpoint_with_auth "PUT" "/api/v1/auth/profile" '{
        "firstName": "Updated",
        "lastName": "Name",
        "phone": "+9876543210"
    }' "200" "Update User Profile" "$ACCESS_TOKEN"
else
    print_warning "Skipping profile update test - no access token available"
fi

# Test 13: Update User Profile - Invalid Data
if [ ! -z "$ACCESS_TOKEN" ]; then
    test_endpoint_with_auth "PUT" "/api/v1/auth/profile" '{
        "firstName": "A",
        "lastName": "B",
        "phone": "invalid"
    }' "400" "Update User Profile - Invalid Data" "$ACCESS_TOKEN"
else
    print_warning "Skipping profile update validation test - no access token available"
fi

# Test 14: Change Password - With Valid Token
if [ ! -z "$ACCESS_TOKEN" ]; then
    test_endpoint_with_auth "PUT" "/api/v1/auth/change-password" '{
        "currentPassword": "Password123",
        "newPassword": "NewPassword123"
    }' "200" "Change Password" "$ACCESS_TOKEN"
else
    print_warning "Skipping password change test - no access token available"
fi

# Test 15: Change Password - Wrong Current Password
if [ ! -z "$ACCESS_TOKEN" ]; then
    test_endpoint_with_auth "PUT" "/api/v1/auth/change-password" '{
        "currentPassword": "WrongPassword",
        "newPassword": "NewPassword123"
    }' "401" "Change Password - Wrong Current Password" "$ACCESS_TOKEN"
else
    print_warning "Skipping password change validation test - no access token available"
fi

# Test 16: Refresh Token - With Valid Refresh Token
if [ ! -z "$REFRESH_TOKEN" ]; then
    test_endpoint "POST" "/api/v1/auth/refresh-token" "{\"refreshToken\": \"$REFRESH_TOKEN\"}" "200" "Refresh Token"
else
    print_warning "Skipping refresh token test - no refresh token available"
fi

# Test 17: Refresh Token - Invalid Refresh Token
test_endpoint "POST" "/api/v1/auth/refresh-token" '{"refreshToken": "invalid-token"}' "401" "Refresh Token - Invalid Token"

# Test 18: Logout - With Valid Token
if [ ! -z "$ACCESS_TOKEN" ] && [ ! -z "$REFRESH_TOKEN" ]; then
    test_endpoint_with_auth "POST" "/api/v1/auth/logout" "{\"refreshToken\": \"$REFRESH_TOKEN\"}" "200" "Logout" "$ACCESS_TOKEN"
else
    print_warning "Skipping logout test - no tokens available"
fi

# Test 19: Logout - Without Token
test_endpoint "POST" "/api/v1/auth/logout" '{"refreshToken": "some-token"}' "401" "Logout - No Token"

# Test 20: Validate Token - With Valid Token
if [ ! -z "$ACCESS_TOKEN" ]; then
    test_endpoint_with_auth "GET" "/api/v1/auth/validate-token" "" "200" "Validate Token" "$ACCESS_TOKEN"
else
    print_warning "Skipping token validation test - no access token available"
fi

# Test 21: Validate Token - Invalid Token
test_endpoint_with_auth "GET" "/api/v1/auth/validate-token" "" "401" "Validate Token - Invalid Token" "invalid-token"

# Test 22: Non-existent Endpoint
test_endpoint "GET" "/api/v1/non-existent" "" "404" "Non-existent Endpoint"

# Test 23: Rate Limiting Test
print_status "Testing rate limiting..."
rate_limit_passed=0
for i in {1..5}; do
    response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/v1/health")
    status_code=$(echo "$response" | tail -n1)
    if [ "$status_code" = "200" ]; then
        ((rate_limit_passed++))
    fi
    sleep 0.1
done

if [ "$rate_limit_passed" = "5" ]; then
    print_success "Rate Limiting Test - All requests successful"
else
    print_warning "Rate Limiting Test - Some requests may have been rate limited"
fi
echo ""

# Test Summary
echo "=================================="
echo "📊 Test Summary"
echo "=================================="
echo "Total Tests: $TOTAL_TESTS"
echo "Passed: $TESTS_PASSED"
echo "Failed: $TESTS_FAILED"

if [ "$TESTS_FAILED" -eq 0 ]; then
    print_success "All tests passed! 🎉"
    exit 0
else
    print_error "Some tests failed. Please check the output above."
    exit 1
fi
