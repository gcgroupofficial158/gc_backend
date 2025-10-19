#!/bin/bash

# Profile Service API Test Script
# Tests all profile service endpoints
# Author: Ganesh Patel

echo "🧪 Profile Service API Test Suite"
echo "Author: Ganesh Patel"
echo "=================================="

BASE_URL="http://localhost:3002"
AUTH_SERVICE_URL="http://localhost:3001"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

# Test counter
test_count=0
passed_tests=0
failed_tests=0

# Run a test and track results
run_test() {
    local test_name="$1"
    local command="$2"
    local expected_status="$3"
    
    test_count=$((test_count + 1))
    print_info "Test $test_count: $test_name"
    
    local response=$(eval "$command")
    local status=$(echo "$response" | tail -c 4)
    
    if [ "$status" = "$expected_status" ]; then
        print_success "$test_name - Status: $status"
        passed_tests=$((passed_tests + 1))
    else
        print_error "$test_name - Expected: $expected_status, Got: $status"
        echo "Response: $response" | jq . 2>/dev/null || echo "Response: $response"
        failed_tests=$((failed_tests + 1))
    fi
    
    echo ""
}

# Check if services are running
check_services() {
    print_info "Checking if services are running..."
    
    # Check Profile Service
    local profile_health=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/health")
    if [ "$profile_health" != "200" ]; then
        print_error "Profile Service is not running. Please start it with: npm start"
        exit 1
    fi
    print_success "Profile Service is running"
    
    # Check Auth Service
    local auth_health=$(curl -s -w "%{http_code}" -o /dev/null "$AUTH_SERVICE_URL/api/v1/health")
    if [ "$auth_health" != "200" ]; then
        print_warning "Auth Service is not running. Some tests may fail."
    else
        print_success "Auth Service is running"
    fi
    
    echo ""
}

# Get auth token (if auth service is running)
get_auth_token() {
    local auth_health=$(curl -s -w "%{http_code}" -o /dev/null "$AUTH_SERVICE_URL/api/v1/health")
    
    if [ "$auth_health" = "200" ]; then
        print_info "Getting auth token..."
        
        # Register a test user
        local register_response=$(curl -s -X POST "$AUTH_SERVICE_URL/api/v1/auth/register" \
            -H "Content-Type: application/json" \
            -d '{
                "firstName": "Test",
                "lastName": "User",
                "email": "testuser@example.com",
                "password": "Password123",
                "phone": "1234567890"
            }')
        
        local register_status=$(echo "$register_response" | tail -c 4)
        
        if [ "$register_status" = "201" ]; then
            ACCESS_TOKEN=$(echo "$register_response" | jq -r '.data.tokens.accessToken // empty')
            if [ -n "$ACCESS_TOKEN" ]; then
                print_success "Auth token obtained"
                return 0
            fi
        fi
        
        print_warning "Could not get auth token. Some tests will be skipped."
        return 1
    else
        print_warning "Auth service not available. Some tests will be skipped."
        return 1
    fi
}

# Main test execution
main() {
    echo ""
    check_services
    
    # Get auth token
    get_auth_token
    local has_token=$?
    
    echo "=================================="
    print_info "Starting API tests..."
    echo "=================================="
    
    # Health Check Tests
    run_test "Health Check" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/health'" "200"
    run_test "Root Endpoint" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/'" "200"
    
    # Public Profile Tests
    run_test "Get Profiles (Public)" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles'" "200"
    run_test "Search Profiles" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles/search?q=test'" "200"
    run_test "Get Statistics" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles/statistics'" "200"
    
    # Protected Profile Tests (if we have a token)
    if [ $has_token -eq 0 ]; then
        print_info "Running protected endpoint tests..."
        
        # Get current user profile
        run_test "Get My Profile" "curl -s -w '%{http_code}' -o /dev/null -H 'Authorization: Bearer $ACCESS_TOKEN' '$BASE_URL/api/v1/profiles/me'" "200"
        
        # Update profile
        run_test "Update My Profile" "curl -s -w '%{http_code}' -o /dev/null -X PUT -H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json' -d '{\"bio\": \"Updated bio\"}' '$BASE_URL/api/v1/profiles/me'" "200"
        
        # Test validation
        run_test "Update Profile Validation (Invalid Data)" "curl -s -w '%{http_code}' -o /dev/null -X PUT -H 'Authorization: Bearer $ACCESS_TOKEN' -H 'Content-Type: application/json' -d '{\"firstName\": \"A\"}' '$BASE_URL/api/v1/profiles/me'" "400"
        
    else
        print_warning "Skipping protected endpoint tests (no auth token)"
    fi
    
    # Test error cases
    run_test "Get Non-existent Profile" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles/507f1f77bcf86cd799439011'" "404"
    run_test "Invalid Search Query" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles/search'" "400"
    
    # Test pagination
    run_test "Get Profiles with Pagination" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles?page=1&limit=5'" "200"
    run_test "Get Profiles with Filters" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles?occupation=developer'" "200"
    
    # Test location search
    run_test "Get Profiles by Location" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles/location?city=New York'" "200"
    run_test "Get Profiles by Occupation" "curl -s -w '%{http_code}' -o /dev/null '$BASE_URL/api/v1/profiles/occupation/developer'" "200"
    
    # Test webhook endpoints (these might fail without proper setup)
    run_test "Create Profile Webhook" "curl -s -w '%{http_code}' -o /dev/null -X POST -H 'Content-Type: application/json' -d '{\"firstName\": \"Webhook\", \"lastName\": \"User\", \"email\": \"webhook@example.com\"}' '$BASE_URL/api/v1/profiles/webhook/create'" "201"
    
    echo "=================================="
    print_info "Test Results Summary"
    echo "=================================="
    echo "Total Tests: $test_count"
    echo -e "Passed: ${GREEN}$passed_tests${NC}"
    echo -e "Failed: ${RED}$failed_tests${NC}"
    
    if [ $failed_tests -eq 0 ]; then
        print_success "All tests passed! 🎉"
        exit 0
    else
        print_error "Some tests failed. Please check the output above."
        exit 1
    fi
}

# Run main function
main "$@"
