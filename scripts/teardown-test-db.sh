#!/bin/bash

# Teardown Test Database Script
#
# This script tears down the test database environment after database integration tests.

set -e

echo "Tearing down test database environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    exit 1
fi

# Check if docker-compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Stop the test database containers
echo "Stopping test database containers..."
docker-compose -f docker-compose.test.yml down

echo "Test database environment has been torn down!"