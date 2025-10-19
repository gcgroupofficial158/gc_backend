#!/bin/bash

# Email Validation Test Script
# Tests email handling with dots and special characters

echo "🧪 Email Validation Test Suite"
echo "Author: Ganesh Patel"
echo "=================================="

BASE_URL="http://localhost:3001"

# Test emails with dots
TEST_EMAILS=(
    "ganesh.oficial158@gmail.com"
    "test.user@example.com"
    "user.name+tag@gmail.com"
    "user-name@domain.co.uk"
    "user_name@sub.domain.com"
)

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

# Test email validation
test_email_validation() {
    local email="$1"
    local test_number="$2"
    
    print_info "Test $test_number: Testing email '$email'"
    
    # Register user
    local register_payload='{"firstName":"Test","lastName":"User","email":"'"$email"'","password":"Password123","phone":"1234567890"}'
    
    local register_response=$(curl -s -w "%{http_code}" -o /tmp/register_test.json -X POST "$BASE_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "$register_payload")
    
    local register_status=$(echo "$register_response" | tail -c 4)
    
    if [ "$register_status" = "201" ]; then
        print_success "Registration successful for '$email'"
        
        # Extract stored email from response
        local stored_email=$(cat /tmp/register_test.json | jq -r '.data.user.email // empty')
        
        if [ "$stored_email" = "$email" ]; then
            print_success "Email stored correctly: '$stored_email'"
        else
            print_error "Email mismatch! Expected: '$email', Got: '$stored_email'"
        fi
        
        # Test login with original email
        local login_payload='{"email":"'"$email"'","password":"Password123"}'
        local login_response=$(curl -s -w "%{http_code}" -o /tmp/login_test.json -X POST "$BASE_URL/api/v1/auth/login" \
            -H "Content-Type: application/json" \
            -d "$login_payload")
        
        local login_status=$(echo "$login_response" | tail -c 4)
        
        if [ "$login_status" = "200" ]; then
            print_success "Login successful with original email: '$email'"
        else
            print_error "Login failed with original email: '$email'"
            cat /tmp/login_test.json | jq . 2>/dev/null || cat /tmp/login_test.json
        fi
        
        # Clean up - deactivate user
        local access_token=$(cat /tmp/register_test.json | jq -r '.data.tokens.accessToken // empty')
        if [ -n "$access_token" ]; then
            curl -s -X DELETE "$BASE_URL/api/v1/auth/deactivate" \
                -H "Authorization: Bearer $access_token" > /dev/null
        fi
        
    elif [ "$register_status" = "400" ]; then
        local error_message=$(cat /tmp/register_test.json | jq -r '.message // empty')
        print_error "Registration failed for '$email': $error_message"
    else
        print_error "Registration failed for '$email' with status: $register_status"
        cat /tmp/register_test.json | jq . 2>/dev/null || cat /tmp/register_test.json
    fi
    
    echo ""
}

# Main test execution
main() {
    echo ""
    print_info "Starting email validation tests..."
    echo ""
    
    # Check if server is running
    local health_response=$(curl -s -w "%{http_code}" -o /dev/null "$BASE_URL/api/v1/health")
    if [ "$health_response" != "200" ]; then
        print_error "Server is not running. Please start the server first with: node server.js"
        exit 1
    fi
    
    print_success "Server is running"
    echo ""
    
    # Test each email
    local test_count=1
    for email in "${TEST_EMAILS[@]}"; do
        test_email_validation "$email" "$test_count"
        test_count=$((test_count + 1))
    done
    
    echo "=================================="
    print_info "Email validation tests completed"
    echo "=================================="
}

# Run main function
main "$@"

