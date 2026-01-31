#!/bin/bash
set -e

# RRC Permit Scraper Local Development Setup
# Usage: ./setup-local.sh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "🚀 Setting up RRC Permit Scraper for local development..."

# Check prerequisites
echo "🔍 Checking prerequisites..."

if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first:"
    echo "   curl -fsSL https://bun.sh/install | bash"
    exit 1
fi
echo "✅ Bun is installed"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi
echo "✅ Docker is installed"

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi
echo "✅ Docker Compose is installed"

# Install dependencies
echo "📥 Installing dependencies..."
cd "${PROJECT_ROOT}"
bun install

# Create environment file
echo "📝 Setting up environment configuration..."
if [ ! -f ".env.local" ]; then
    cp infra/config/.env.example .env.local
    echo "✅ Created .env.local from template"
    echo "💡 Please edit .env.local with your actual configuration values"
else
    echo "⚠️  .env.local already exists, skipping"
fi

# Start infrastructure services
echo "🐳 Starting infrastructure services..."
cd "${PROJECT_ROOT}/infra"
docker-compose -f docker-compose.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Verify services
echo "🔍 Verifying services..."

# Check PostgreSQL
if docker-compose -f docker-compose.yml exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
    echo "✅ PostgreSQL is ready"
else
    echo "⚠️  PostgreSQL may not be ready yet"
fi

# Check Redis
if docker-compose -f docker-compose.yml exec -T redis redis-cli ping > /dev/null 2>&1; then
    echo "✅ Redis is ready"
else
    echo "⚠️  Redis may not be ready yet"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📚 Next steps:"
echo "   1. Edit .env.local with your configuration"
echo "   2. Run database migrations: bun run migrate:up"
echo "   3. Start the development server: bun run dev"
echo ""
echo "📊 Services:"
echo "   - API: http://localhost:3000"
echo "   - PostgreSQL: localhost:5432"
echo "   - Redis: localhost:6379"
echo ""
echo "💡 Useful commands:"
echo "   - View logs: docker-compose -f infra/docker-compose.yml logs -f"
echo "   - Stop services: docker-compose -f infra/docker-compose.yml down"
echo "   - Restart services: docker-compose -f infra/docker-compose.yml restart"
