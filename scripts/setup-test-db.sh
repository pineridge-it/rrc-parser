#!/bin/bash

# Setup Test Database Script
#
# This script sets up the test database environment for database integration tests.

set -e

echo "Setting up test database environment..."

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

# Start the test database containers
echo "Starting test database containers..."
docker-compose -f docker-compose.test.yml up -d

# Wait for the database to be ready
echo "Waiting for database to be ready..."
until docker-compose -f docker-compose.test.yml exec postgres-test pg_isready -U test -d rrc_test &> /dev/null; do
    sleep 1
done

echo "Test database environment is ready!"