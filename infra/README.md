# Infrastructure and DevOps

This directory contains infrastructure configuration, deployment scripts, and DevOps tooling for the RRC Permit Scraper application.

## Overview

The infrastructure is designed to support:
- **Local Development**: Docker Compose setup with PostgreSQL and Redis
- **CI/CD**: GitHub Actions workflows for testing and deployment
- **Production**: Container-based deployment with health checks

## Directory Structure

```
infra/
├── config/               # Environment configuration templates
│   └── .env.example     # Example environment variables
├── scripts/             # Deployment and utility scripts
│   ├── deploy.sh        # Main deployment script
│   └── setup-local.sh   # Local development setup
├── docker-compose.yml   # Local development services
└── README.md           # This file
```

## Quick Start

### Local Development Setup

1. **Prerequisites**:
   - [Bun](https://bun.sh/) (JavaScript runtime)
   - [Docker](https://docs.docker.com/get-docker/)
   - [Docker Compose](https://docs.docker.com/compose/install/)

2. **Run setup script**:
   ```bash
   ./infra/scripts/setup-local.sh
   ```

3. **Or manually**:
   ```bash
   # Install dependencies
   bun install

   # Copy environment file
   cp infra/config/.env.example .env.local

   # Start infrastructure services
   cd infra && docker-compose up -d
   ```

### Services

After running the setup, the following services will be available:

| Service | URL/Port | Description |
|---------|----------|-------------|
| API | http://localhost:3000 | Main application API |
| PostgreSQL | localhost:5432 | Primary database |
| Redis | localhost:6379 | Cache and job queue |

## Configuration

### Environment Variables

Copy `infra/config/.env.example` to `.env.local` and configure:

```bash
cp infra/config/.env.example .env.local
```

Key configuration sections:
- **Database**: PostgreSQL connection settings
- **Redis**: Cache and queue configuration
- **Authentication**: Supabase Auth settings
- **External APIs**: RRC API credentials
- **Storage**: File storage configuration
- **Monitoring**: Logging and observability

### Docker Compose

The `docker-compose.yml` file defines:
- PostgreSQL database with automatic schema initialization
- Redis cache
- API service with health checks
- ETL worker for background processing

## Deployment

### Local Deployment

```bash
./infra/scripts/deploy.sh local
```

### Staging Deployment

```bash
./infra/scripts/deploy.sh staging
```

### Production Deployment

```bash
./infra/scripts/deploy.sh production
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci.yml`) includes:

1. **Lint & Type Check**: ESLint and TypeScript compilation
2. **Unit Tests**: Fast unit tests with no external dependencies
3. **Integration Tests**: Tests with real database and Redis
4. **Build**: Application build verification
5. **Docker Build**: Container image creation

### Pipeline Triggers

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

## Docker

### Building the Image

```bash
docker build -t rrc-permit-scraper:latest .
```

### Running the Container

```bash
docker run -p 3000:3000 \
  -e DATABASE_URL=postgresql://... \
  -e REDIS_URL=redis://... \
  rrc-permit-scraper:latest
```

### Multi-stage Build

The Dockerfile uses a multi-stage build:
1. **Builder stage**: Installs dependencies and builds the application
2. **Production stage**: Minimal image with only runtime dependencies

## Monitoring

### Health Checks

The API includes health check endpoints:
- `/health` - Application health status
- `/health/ready` - Readiness probe
- `/health/live` - Liveness probe

### Logs

View service logs:
```bash
# All services
docker-compose -f infra/docker-compose.yml logs -f

# Specific service
docker-compose -f infra/docker-compose.yml logs -f api
```

## Troubleshooting

### Database Connection Issues

1. Verify PostgreSQL is running:
   ```bash
   docker-compose -f infra/docker-compose.yml ps
   ```

2. Check database logs:
   ```bash
   docker-compose -f infra/docker-compose.yml logs postgres
   ```

### Port Conflicts

If ports are already in use, modify the port mappings in `docker-compose.yml`:
```yaml
ports:
  - "5433:5432"  # Use different host port
```

### Reset Local Environment

```bash
# Stop and remove containers
docker-compose -f infra/docker-compose.yml down -v

# Restart fresh
docker-compose -f infra/docker-compose.yml up -d
```

## Security

- Non-root user in Docker containers
- Environment variables for sensitive data
- Health checks for service monitoring
- No secrets committed to repository

## Contributing

When adding new infrastructure components:
1. Update this README
2. Add environment variables to `.env.example`
3. Update deployment scripts if needed
4. Test locally before committing
