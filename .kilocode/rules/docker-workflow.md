# Docker Workflow: Groucho the Hunter

## When This Applies

These rules apply when:
- Starting or stopping Docker containers
- Building Docker images
- Managing development/production environments
- Troubleshooting container issues
- Using the grouchocli tool

## Environment Overview

This project uses Docker with two distinct environments:

| Environment | File | Port | Purpose | Container Name |
|-------------|------|------|---------|----------------|
| **Development** | `docker-compose.yml` | 3000 | Hot reload, Vite dev server | `groucho-the-hunter-dev` |
| **Production** | `docker-compose.prod.yml` | 8080 | Optimized nginx build | `groucho-the-hunter` |

## Quick Reference Commands

### Using grouchocli (Recommended)

```bash
# Setup (run once)
cd grouchocli && ./setup.sh

# Development environment
  Start:   groucho start --dev
  Stop:    groucho stop --dev
  Restart: groucho restart --dev
  Logs:    groucho logs --dev --follow
  Shell:   groucho shell --dev

# Production environment
  Start:   groucho start --prod
  Stop:    groucho stop --prod
  Restart: groucho restart --prod
  Logs:    groucho logs --prod --follow
  Shell:   groucho shell --prod

# Interactive TUI menu
groucho menu

# Check status
groucho status

# Build images
groucho build --dev
groucho build --prod

# Clean all resources
groucho clean --force
```

### Using Docker Directly

```bash
# Development
docker-compose up --build          # Start with build
docker-compose up -d               # Start detached
docker-compose down                # Stop
docker-compose logs -f             # Follow logs

# Production
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml logs -f
```

## Container Management Rules

### 1. Development Environment

- **Purpose**: Active development with hot module replacement
- **Features**:
  - Volume mounts for live code changes
  - Vite dev server with HMR
  - Source maps enabled
  - No minification
- **When to use**: Writing code, testing changes, debugging
- **Access**: http://localhost:3000

### 2. Production Environment

- **Purpose**: Production-ready optimized build
- **Features**:
  - Multi-stage Docker build (Node.js build + nginx serve)
  - Minified and optimized assets
  - nginx gzip compression
  - Health checks enabled
  - Security headers
- **When to use**: Performance testing, deployment previews, final validation
- **Access**: http://localhost:8080

### 3. Container Lifecycle

```
Start Order:
  1. Check if containers already exist
  2. Build image if needed (--build flag)
  3. Start container in detached mode (-d)
  4. Verify health check passes
  5. Open browser (if --open flag)

Stop Order:
  1. Send graceful shutdown signal
  2. Wait for container cleanup (10s timeout)
  3. Remove container
  4. Keep volumes (unless --clean flag)
```

### 4. Volume Management

Development volumes (defined in `docker-compose.yml`):
- `.:/app` - Mounts entire project for hot reload
- `/app/node_modules` - Anonymous volume preserves node_modules

Production volumes:
- No host mounts (immutable deployment)
- All assets baked into image

### 5. Troubleshooting

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000
# Kill process or use different port
groucho start --dev --port 3001
```

**Container won't start:**
```bash
# Check logs
groucho logs --dev
# Rebuild from scratch
groucho build --dev --no-cache
groucho start --dev
```

**Hot reload not working:**
- Ensure file is within `/src` directory
- Check Docker volume mount: `docker inspect groucho-the-hunter-dev`
- Verify Vite HMR is enabled in `vite.config.js`

**Permission issues:**
```bash
# Fix file ownership on Linux
sudo chown -R $(id -u):$(id -g) .
# Rebuild container
groucho restart --dev
```

## Build Configuration

### Development Build

```yaml
# docker-compose.yml key settings
services:
  app:
    build:
      target: development  # Use development stage
    volumes:
      - .:/app             # Mount for hot reload
      - /app/node_modules  # Preserve node_modules
    ports:
      - "3000:3000"       # Vite dev server
    command: npm run dev   # Start dev server
```

### Production Build

```yaml
# docker-compose.prod.yml key settings
services:
  app:
    build:
      target: production   # Use production stage
    ports:
      - "8080:80"         # nginx server
    healthcheck:          # Automatic health checks
      test: ["CMD", "curl", "-f", "http://localhost:80"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## CLI Tool Architecture

The `grouchocli` tool provides a Python-based management layer:

```
groucho (CLI Entry Point)
    ├── DockerManager
    │   └── Manages: docker-compose operations
    │       • start_dev(), start_prod()
    │       • stop(), restart()
    │       • build(), clean()
    │
    ├── GameManager
    │   └── Manages: Container status, health checks
    │       • get_status()
    │       • stream_logs()
    │       • open_shell()
    │
    └── TUI (Textual - optional)
        └── Provides: Interactive menu interface
```

## Best Practices

### 1. Development Workflow

```bash
# 1. Start with clean state
groucho clean --force

# 2. Start development environment
groucho start --dev

# 3. Code with hot reload (access at http://localhost:3000)

# 4. Check logs if issues occur
groucho logs --dev --follow

# 5. Test production build before committing
groucho start --prod
groucho stop --prod
```

### 2. CI/CD Integration

```bash
# Build production image
groucho build --prod

# Run smoke tests
docker run --rm groucho-the-hunter curl -f http://localhost:80

# Push to registry (example)
docker tag groucho-the-hunter registry.example.com/groucho:latest
docker push registry.example.com/groucho:latest
```

### 3. Resource Management

- Development container: ~500MB RAM, minimal CPU
- Production container: ~50MB RAM, minimal CPU
- Clean up unused images: `docker image prune -a`
- Clean up stopped containers: `docker container prune`

## References

- See [`grouchocli/README.md`](grouchocli/README.md) for CLI documentation
- See [`Dockerfile`](Dockerfile) for build stages
- See [`docker-compose.yml`](docker-compose.yml) for dev configuration
- See [`docker-compose.prod.yml`](docker-compose.prod.yml) for prod configuration
