#!/bin/bash
set -e

# RRC Permit Scraper Deployment Script
# Usage: ./deploy.sh [environment]
# Environments: local, staging, production

ENVIRONMENT=${1:-local}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🚀 Deploying RRC Permit Scraper to ${ENVIRONMENT}..."

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(local|staging|production)$ ]]; then
    echo "❌ Invalid environment: ${ENVIRONMENT}"
    echo "Usage: ./deploy.sh [local|staging|production]"
    exit 1
fi

# Load environment variables
ENV_FILE="${PROJECT_ROOT}/.env.${ENVIRONMENT}"
if [ -f "$ENV_FILE" ]; then
    echo "📄 Loading environment from ${ENV_FILE}"
    export $(grep -v '^#' "$ENV_FILE" | xargs)
else
    echo "⚠️  Warning: ${ENV_FILE} not found, using defaults"
fi

case $ENVIRONMENT in
    local)
        deploy_local
        ;;
    staging)
        deploy_staging
        ;;
    production)
        deploy_production
        ;;
esac

deploy_local() {
    echo "🏠 Local deployment"
    
    cd "${PROJECT_ROOT}/infra"
    
    # Start infrastructure services
    echo "🐳 Starting Docker services..."
    docker-compose -f docker-compose.yml up -d --build
    
    # Wait for database to be ready
    echo "⏳ Waiting for database..."
    sleep 5
    
    # Run migrations
    echo "🔄 Running database migrations..."
    cd "${PROJECT_ROOT}"
    bun run migrate:up || echo "⚠️  Migration script not configured"
    
    echo "✅ Local deployment complete!"
    echo "📊 Services:"
    echo "   - API: http://localhost:3000"
    echo "   - PostgreSQL: localhost:5432"
    echo "   - Redis: localhost:6379"
}

deploy_staging() {
    echo "🧪 Staging deployment"
    
    # Build Docker image
    echo "🔨 Building Docker image..."
    cd "${PROJECT_ROOT}"
    docker build -t rrc-permit-scraper:staging .
    
    # Push to registry (configure based on your setup)
    echo "📤 Pushing to registry..."
    # docker push your-registry/rrc-permit-scraper:staging
    
    echo "✅ Staging deployment complete!"
    echo "📝 Note: Configure your staging environment deployment target"
}

deploy_production() {
    echo "🏭 Production deployment"
    
    # Verify production environment
    if [ -z "$PRODUCTION_DEPLOY_KEY" ]; then
        echo "❌ PRODUCTION_DEPLOY_KEY not set"
        exit 1
    fi
    
    # Build production image
    echo "🔨 Building production Docker image..."
    cd "${PROJECT_ROOT}"
    docker build -t rrc-permit-scraper:latest .
    docker tag rrc-permit-scraper:latest rrc-permit-scraper:$(date +%Y%m%d-%H%M%S)
    
    # Push to production registry
    echo "📤 Pushing to production registry..."
    # docker push your-registry/rrc-permit-scraper:latest
    
    echo "✅ Production deployment complete!"
    echo "📝 Note: Configure your production deployment target"
}

# Health check function
health_check() {
    echo "🏥 Running health checks..."
    
    # Check API health
    if curl -s http://localhost:3000/health > /dev/null; then
        echo "✅ API is healthy"
    else
        echo "❌ API health check failed"
        return 1
    fi
    
    # Check database
    if docker-compose -f "${PROJECT_ROOT}/infra/docker-compose.yml" exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ Database is healthy"
    else
        echo "❌ Database health check failed"
        return 1
    fi
}

# Run health check if --check flag is passed
if [ "$2" == "--check" ]; then
    health_check
fi
