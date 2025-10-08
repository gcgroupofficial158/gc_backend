#!/bin/bash

# Session Management Test Script
# Author: Ganesh Patel
# This script tests all session management functionality

echo "🧪 Session Management Test Suite"
echo "Author: Ganesh Patel"
echo "=================================="

# Configuration
BASE_URL="http://localhost:3001"
UNIQUE_EMAIL="session_test_$(date +%s%N)@example.com"
REGISTER_PAYLOAD='{"firstName":"Session","lastName":"Test","email":"'"$UNIQUE_EMAIL"'","password":"Password123","phone":"1234567890"}'
LOGIN_PAYLOAD='{"email":"'"$UNIQUE_EMAIL"'","password":"Password123"}'

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
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

# Test functions
test_health_check() {
    print_info "Testing: Health Check"
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/health_response.json "$BASE_URL/api/v1/health")
    if [ "$RESPONSE" = "200" ]; then
        print_success "Health Check - Status: $RESPONSE"
        return 0
    else
        print_error "Health Check - Status: $RESPONSE"
        return 1
    fi
}

test_user_registration() {
    print_info "Testing: User Registration"
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/register_response.json -X POST "$BASE_URL/api/v1/auth/register" \
        -H "Content-Type: application/json" \
        -d "$REGISTER_PAYLOAD")
    
    if [ "$RESPONSE" = "201" ]; then
        print_success "User Registration - Status: $RESPONSE"
        # Extract tokens and user info
        ACCESS_TOKEN=$(cat /tmp/register_response.json | jq -r '.data.accessToken // empty')
        REFRESH_TOKEN=$(cat /tmp/register_response.json | jq -r '.data.refreshToken // empty')
        USER_ID=$(cat /tmp/register_response.json | jq -r '.data.user.id // empty')
        SESSION_ID=$(cat /tmp/register_response.json | jq -r '.data.session.sessionId // empty')
        
        if [ -n "$ACCESS_TOKEN" ] && [ -n "$REFRESH_TOKEN" ] && [ -n "$USER_ID" ]; then
            print_success "Tokens and User ID extracted successfully"
            if [ -n "$SESSION_ID" ]; then
                print_success "Session ID: $SESSION_ID"
            else
                print_warning "No session ID found in registration response"
            fi
            return 0
        else
            print_error "Failed to extract tokens or user ID"
            return 1
        fi
    else
        print_error "User Registration - Status: $RESPONSE"
        cat /tmp/register_response.json | jq . 2>/dev/null || cat /tmp/register_response.json
        return 1
    fi
}

test_user_login() {
    print_info "Testing: User Login"
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/login_response.json -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -d "$LOGIN_PAYLOAD")
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "User Login - Status: $RESPONSE"
        # Extract tokens
        LOGIN_ACCESS_TOKEN=$(cat /tmp/login_response.json | jq -r '.data.accessToken // empty')
        LOGIN_REFRESH_TOKEN=$(cat /tmp/login_response.json | jq -r '.data.refreshToken // empty')
        LOGIN_SESSION_ID=$(cat /tmp/login_response.json | jq -r '.data.session.sessionId // empty')
        IS_EXISTING_SESSION=$(cat /tmp/login_response.json | jq -r '.data.session.isExistingSession // false')
        
        if [ -n "$LOGIN_ACCESS_TOKEN" ] && [ -n "$LOGIN_REFRESH_TOKEN" ]; then
            print_success "Login tokens extracted successfully"
            if [ -n "$LOGIN_SESSION_ID" ]; then
                print_success "Login Session ID: $LOGIN_SESSION_ID"
                if [ "$IS_EXISTING_SESSION" = "true" ]; then
                    print_success "Existing session detected (same device)"
                else
                    print_success "New session created"
                fi
            else
                print_warning "No session ID found in login response"
            fi
            return 0
        else
            print_error "Failed to extract login tokens"
            return 1
        fi
    else
        print_error "User Login - Status: $RESPONSE"
        cat /tmp/login_response.json | jq . 2>/dev/null || cat /tmp/login_response.json
        return 1
    fi
}

test_get_active_sessions() {
    if [ -n "$LOGIN_ACCESS_TOKEN" ]; then
        print_info "Testing: Get Active Sessions"
        RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/sessions_response.json -X GET "$BASE_URL/api/v1/auth/sessions" \
            -H "Authorization: Bearer $LOGIN_ACCESS_TOKEN")
        
        if [ "$RESPONSE" = "200" ]; then
            print_success "Get Active Sessions - Status: $RESPONSE"
            SESSION_COUNT=$(cat /tmp/sessions_response.json | jq -r '.data.sessions | length')
            print_success "Active sessions count: $SESSION_COUNT"
            if [ "$SESSION_COUNT" -gt 0 ]; then
                print_success "Session details:"
                cat /tmp/sessions_response.json | jq -r '.data.sessions[] | "  - Session ID: \(.sessionId), Device: \(.deviceInfo.browser) on \(.deviceInfo.os), Active: \(.isActive)"'
            fi
            return 0
        else
            print_error "Get Active Sessions - Status: $RESPONSE"
            cat /tmp/sessions_response.json | jq . 2>/dev/null || cat /tmp/sessions_response.json
            return 1
        fi
    else
        print_warning "Skipping active sessions test - no access token available"
        return 0
    fi
}

test_deactivate_specific_session() {
    if [ -n "$LOGIN_SESSION_ID" ] && [ -n "$LOGIN_ACCESS_TOKEN" ]; then
        print_info "Testing: Deactivate Specific Session"
        RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/deactivate_session_response.json -X DELETE "$BASE_URL/api/v1/auth/sessions/$LOGIN_SESSION_ID" \
            -H "Authorization: Bearer $LOGIN_ACCESS_TOKEN")
        
        if [ "$RESPONSE" = "200" ]; then
            print_success "Deactivate Specific Session - Status: $RESPONSE"
            return 0
        else
            print_error "Deactivate Specific Session - Status: $RESPONSE"
            cat /tmp/deactivate_session_response.json | jq . 2>/dev/null || cat /tmp/deactivate_session_response.json
            return 1
        fi
    else
        print_warning "Skipping deactivate session test - no session ID or access token available"
        return 0
    fi
}

test_session_validation_after_deactivation() {
    if [ -n "$LOGIN_ACCESS_TOKEN" ]; then
        print_info "Testing: Session Validation After Deactivation"
        RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/validation_response.json -X GET "$BASE_URL/api/v1/auth/profile" \
            -H "Authorization: Bearer $LOGIN_ACCESS_TOKEN")
        
        if [ "$RESPONSE" = "401" ]; then
            print_success "Session Validation After Deactivation - Status: $RESPONSE (Expected: Session should be invalid)"
            return 0
        else
            print_error "Session Validation After Deactivation - Status: $RESPONSE (Expected: 401)"
            cat /tmp/validation_response.json | jq . 2>/dev/null || cat /tmp/validation_response.json
            return 1
        fi
    else
        print_warning "Skipping session validation test - no access token available"
        return 0
    fi
}

test_multiple_device_sessions() {
    print_info "Testing: Multiple Device Sessions"
    
    # Login from different device (different User-Agent)
    RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/mobile_login_response.json -X POST "$BASE_URL/api/v1/auth/login" \
        -H "Content-Type: application/json" \
        -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
        -d "$LOGIN_PAYLOAD")
    
    if [ "$RESPONSE" = "200" ]; then
        print_success "Mobile Device Login - Status: $RESPONSE"
        MOBILE_ACCESS_TOKEN=$(cat /tmp/mobile_login_response.json | jq -r '.data.accessToken // empty')
        MOBILE_SESSION_ID=$(cat /tmp/mobile_login_response.json | jq -r '.data.session.sessionId // empty')
        IS_EXISTING_SESSION=$(cat /tmp/mobile_login_response.json | jq -r '.data.session.isExistingSession // false')
        
        if [ -n "$MOBILE_ACCESS_TOKEN" ] && [ -n "$MOBILE_SESSION_ID" ]; then
            print_success "Mobile session created: $MOBILE_SESSION_ID"
            if [ "$IS_EXISTING_SESSION" = "false" ]; then
                print_success "New session created for different device (as expected)"
            else
                print_warning "Existing session detected for different device (unexpected)"
            fi
            
            # Check total active sessions
            RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/mobile_sessions_response.json -X GET "$BASE_URL/api/v1/auth/sessions" \
                -H "Authorization: Bearer $MOBILE_ACCESS_TOKEN")
            
            if [ "$RESPONSE" = "200" ]; then
                SESSION_COUNT=$(cat /tmp/mobile_sessions_response.json | jq -r '.data.sessions | length')
                print_success "Total active sessions: $SESSION_COUNT"
                return 0
            else
                print_error "Failed to get mobile sessions - Status: $RESPONSE"
                return 1
            fi
        else
            print_error "Failed to extract mobile session tokens"
            return 1
        fi
    else
        print_error "Mobile Device Login - Status: $RESPONSE"
        cat /tmp/mobile_login_response.json | jq . 2>/dev/null || cat /tmp/mobile_login_response.json
        return 1
    fi
}

test_deactivate_all_sessions() {
    if [ -n "$MOBILE_ACCESS_TOKEN" ]; then
        print_info "Testing: Deactivate All Sessions"
        RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/deactivate_all_response.json -X DELETE "$BASE_URL/api/v1/auth/sessions" \
            -H "Authorization: Bearer $MOBILE_ACCESS_TOKEN")
        
        if [ "$RESPONSE" = "200" ]; then
            print_success "Deactivate All Sessions - Status: $RESPONSE"
            return 0
        else
            print_error "Deactivate All Sessions - Status: $RESPONSE"
            cat /tmp/deactivate_all_response.json | jq . 2>/dev/null || cat /tmp/deactivate_all_response.json
            return 1
        fi
    else
        print_warning "Skipping deactivate all sessions test - no mobile access token available"
        return 0
    fi
}

test_session_statistics() {
    if [ -n "$MOBILE_ACCESS_TOKEN" ]; then
        print_info "Testing: Session Statistics"
        RESPONSE=$(curl -s -w "%{http_code}" -o /tmp/stats_response.json -X GET "$BASE_URL/api/v1/auth/sessions/stats" \
            -H "Authorization: Bearer $MOBILE_ACCESS_TOKEN")
        
        if [ "$RESPONSE" = "200" ]; then
            print_success "Session Statistics - Status: $RESPONSE"
            TOTAL_SESSIONS=$(cat /tmp/stats_response.json | jq -r '.data.totalSessions // 0')
            ACTIVE_SESSIONS=$(cat /tmp/stats_response.json | jq -r '.data.activeSessions // 0')
            EXPIRED_SESSIONS=$(cat /tmp/stats_response.json | jq -r '.data.expiredSessions // 0')
            TOTAL_USERS=$(cat /tmp/stats_response.json | jq -r '.data.totalUsers // 0')
            
            print_success "Session Statistics:"
            echo "  - Total Sessions: $TOTAL_SESSIONS"
            echo "  - Active Sessions: $ACTIVE_SESSIONS"
            echo "  - Expired Sessions: $EXPIRED_SESSIONS"
            echo "  - Total Users: $TOTAL_USERS"
            return 0
        else
            print_error "Session Statistics - Status: $RESPONSE"
            cat /tmp/stats_response.json | jq . 2>/dev/null || cat /tmp/stats_response.json
            return 1
        fi
    else
        print_warning "Skipping session statistics test - no mobile access token available"
        return 0
    fi
}

# Main test execution
main() {
    echo ""
    print_info "Starting session management tests..."
    echo ""
    
    # Check if server is running
    if ! test_health_check; then
        print_error "Server is not running. Please start the server first with: node server.js"
        exit 1
    fi
    
    echo ""
    print_info "Running session management tests..."
    echo ""
    
    # Test counter
    TESTS_PASSED=0
    TESTS_FAILED=0
    TOTAL_TESTS=0
    
    # Run tests
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_user_registration; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_user_login; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_get_active_sessions; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_deactivate_specific_session; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_session_validation_after_deactivation; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_multiple_device_sessions; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_deactivate_all_sessions; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_session_statistics; then
        TESTS_PASSED=$((TESTS_PASSED + 1))
    else
        TESTS_FAILED=$((TESTS_FAILED + 1))
    fi
    
    # Print summary
    echo ""
    echo "=================================="
    print_info "Test Summary"
    echo "=================================="
    echo "Total Tests: $TOTAL_TESTS"
    echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
    echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        print_success "All session management tests passed! 🎉"
        exit 0
    else
        print_error "Some tests failed. Please check the output above."
        exit 1
    fi
}

# Run main function
main "$@"
