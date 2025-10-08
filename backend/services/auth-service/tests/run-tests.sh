#!/bin/bash

# Test Runner Script for Auth Service
# Author: Ganesh Patel

set -e

echo "🧪 Starting Auth Service Test Suite"
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if service is running
check_service() {
    print_status "Checking if auth service is running..."
    if curl -s http://localhost:3001/api/v1/health > /dev/null; then
        print_success "Auth service is running"
        return 0
    else
        print_error "Auth service is not running. Please start it first with 'npm start'"
        return 1
    fi
}

# Install dependencies if needed
install_dependencies() {
    print_status "Installing test dependencies..."
    if [ ! -d "node_modules" ]; then
        npm install
    else
        print_status "Dependencies already installed"
    fi
}

# Run unit tests
run_unit_tests() {
    print_status "Running unit tests..."
    if npm run test:unit; then
        print_success "Unit tests passed"
    else
        print_error "Unit tests failed"
        return 1
    fi
}

# Run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    if npm run test:integration; then
        print_success "Integration tests passed"
    else
        print_error "Integration tests failed"
        return 1
    fi
}

# Run all Jest tests
run_jest_tests() {
    print_status "Running all Jest tests..."
    if npm test; then
        print_success "All Jest tests passed"
    else
        print_error "Jest tests failed"
        return 1
    fi
}

# Run load tests
run_load_tests() {
    print_status "Running load tests..."
    if npm run test:load; then
        print_success "Load tests passed"
    else
        print_warning "Load tests had issues (this might be expected)"
    fi
}

# Run stress tests
run_stress_tests() {
    print_status "Running stress tests..."
    if artillery run tests/load/stress-test.yml; then
        print_success "Stress tests completed"
    else
        print_warning "Stress tests had issues (this might be expected)"
    fi
}

# Run performance tests
run_performance_tests() {
    print_status "Running performance tests..."
    if artillery run tests/load/performance-test.yml; then
        print_success "Performance tests completed"
    else
        print_warning "Performance tests had issues (this might be expected)"
    fi
}

# Generate test coverage report
generate_coverage() {
    print_status "Generating test coverage report..."
    if npm run test:coverage; then
        print_success "Coverage report generated"
        print_status "Coverage report available at: coverage/lcov-report/index.html"
    else
        print_error "Failed to generate coverage report"
        return 1
    fi
}

# Clean up test data
cleanup() {
    print_status "Cleaning up test data..."
    # Add cleanup commands here if needed
    print_success "Cleanup completed"
}

# Main execution
main() {
    local test_type=${1:-"all"}
    
    case $test_type in
        "unit")
            install_dependencies
            run_unit_tests
            ;;
        "integration")
            install_dependencies
            check_service
            run_integration_tests
            ;;
        "jest")
            install_dependencies
            run_jest_tests
            ;;
        "load")
            install_dependencies
            check_service
            run_load_tests
            ;;
        "stress")
            install_dependencies
            check_service
            run_stress_tests
            ;;
        "performance")
            install_dependencies
            check_service
            run_performance_tests
            ;;
        "coverage")
            install_dependencies
            run_jest_tests
            generate_coverage
            ;;
        "all")
            install_dependencies
            check_service
            run_jest_tests
            generate_coverage
            run_load_tests
            print_status "All tests completed!"
            ;;
        *)
            echo "Usage: $0 [unit|integration|jest|load|stress|performance|coverage|all]"
            echo ""
            echo "Test types:"
            echo "  unit        - Run unit tests only"
            echo "  integration - Run integration tests only"
            echo "  jest        - Run all Jest tests"
            echo "  load        - Run load tests"
            echo "  stress      - Run stress tests"
            echo "  performance - Run performance tests"
            echo "  coverage    - Generate test coverage report"
            echo "  all         - Run all tests (default)"
            exit 1
            ;;
    esac
    
    cleanup
}

# Run main function with all arguments
main "$@"
