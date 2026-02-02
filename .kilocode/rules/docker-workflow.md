# Docker Workflow: Groucho the Hunter

> ⚠️ **MANDATORY: ALL development MUST use Docker via grouchocli. NEVER run `npm run dev` directly.**
> 
> **groucho start --dev is the ONLY approved way to run the application.**

## When This Applies

These rules apply when:
- Starting or stopping Docker containers
- Building Docker images
- Managing development/production environments
- Troubleshooting container issues
- Using the grouchocli tool

⚠️ **CRITICAL**: Running `npm run dev` directly on the host machine is STRICTLY PROHIBITED. All development, testing, and debugging must happen inside Docker containers managed by grouchocli.

## Hard Rule: Docker-Only Execution

| Rule | Description |
|------|-------------|
| **Execution** | All app execution MUST be via `groucho start --dev` or `groucho start --prod` |
| **Prohibition** | NEVER run `npm run dev`, `npm start`, or `node` directly on the host |
| **Testing** | All testing and debugging must occur inside containers |
| **Reference Only** | `npm` commands are documented for reference only - they run INSIDE the container |

### Why Docker-Only?
- **Consistency**: Identical environment across all machines
- **Isolation**: No dependency conflicts with host system
- **Reproducibility**: Same Node.js, dependencies, and configurations
- **Safety**: Container boundaries prevent accidental system changes

## Environment Overview

This project uses Docker with two distinct environments:

| Environment | File | Port | Purpose | Container Name |
|-------------|------|------|---------|----------------|
| **Development** | `docker-compose.yml` | 3000 | Hot reload, Vite dev server | `groucho-the-hunter-dev` |
| **Production** | `docker-compose.prod.yml` | 8080 | Optimized nginx build | `groucho-the-hunter` |

## Quick Reference Commands

### Using grouchocli (MANDATORY - ONLY APPROVED METHOD)

```bash
# Setup (run once)
cd grouchocli && ./setup.sh

# Development environment - THIS IS THE ONLY WAY TO RUN THE APP
groucho start --dev              # Start development server (port 3000)
groucho stop --dev               # Stop development container
groucho restart --dev            # Restart development container
groucho logs --dev --follow      # View and follow logs
groucho shell --dev              # Open shell inside container

# Production environment
groucho start --prod             # Start production server (port 8080)
groucho stop --prod              # Stop production container
groucho restart --prod           # Restart production container
groucho logs --prod --follow     # View and follow logs
groucho shell --prod             # Open shell inside container

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

⚠️ **REMINDER**: The `groucho start --dev` command is the ONLY approved way to run the application. Never use `npm run dev` directly.

### Using Docker Directly (Emergency/Advanced Use Only)

```bash
# Development - Only if grouchocli is unavailable
docker-compose up --build          # Start with build
docker-compose up -d               # Start detached
docker-compose down                # Stop
docker-compose logs -f             # Follow logs

# Production - Only if grouchocli is unavailable
docker-compose -f docker-compose.prod.yml up -d --build
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml logs -f
```

> **Note**: Direct docker-compose commands should only be used when grouchocli is unavailable or for debugging container issues. Prefer `groucho` commands for all normal operations.

## Container Management Rules

### 1. Development Environment

- **Purpose**: Active development with hot module replacement
- **Features**:
  - Volume mounts for live code changes
  - Vite dev server with HMR (runs INSIDE container)
  - Source maps enabled
  - No minification
- **When to use**: Writing code, testing changes, debugging
- **Access**: http://localhost:3000
- **How to start**: `groucho start --dev` (NEVER `npm run dev`)

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
- **How to start**: `groucho start --prod`

### 3. Container Lifecycle

```
Start Order (via @):
  1. Run: @ start --dev
  2. Check if containers already exist
  3. Build image if needed (--build flag)
  4. Start container in detached mode (-d)
  5. Verify health check passes
  6. Open browser (if --open flag)

Stop Order:
  1. Run: @ stop --dev
  2. Send graceful shutdown signal
  3. Wait for container cleanup (10s timeout)
  4. Remove container
  5. Keep volumes (unless --clean flag)
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
- Restart container: `groucho restart --dev`

**Permission issues:**
```bash
# Fix file ownership on Linux
sudo chown -R $(id -u):$(id -g) .
# Rebuild container
groucho restart --dev
```

**"I ran npm run dev by accident":**
```bash
# Stop any local Node processes
killall node
# Use the proper Docker command
groucho start --dev
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
    command: npm run dev   # INTERNAL: Runs INSIDE container only
```

> **IMPORTANT**: The `npm run dev` command in the docker-compose.yml runs INSIDE the container. Never run it directly on your host machine.

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

The `grouchocli` tool provides a Python-based management layer that enforces the Docker-only execution policy:

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

### 1. Development Workflow (Docker-Only)

```bash
# 1. Start with clean state (if needed)
groucho clean --force

# 2. Start development environment - THE ONLY WAY
groucho start --dev

# 3. Code with hot reload (access at http://localhost:3000)
#    Edit files on host, changes reflect automatically in container

# 4. Check logs if issues occur
groucho logs --dev --follow

# 5. Test production build before committing
groucho start --prod
# Verify at http://localhost:8080
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

## Command Hierarchy

When executing the application, use commands in this priority order:

1. **grouchocli (HIGHEST PRIORITY)**
   - `groucho start --dev` - Always use this
   - `groucho start --prod` - For production testing

2. **docker-compose (Emergency/Fallback)**
   - `docker-compose up --build` - Only if grouchocli unavailable
   - `docker-compose -f docker-compose.prod.yml up -d --build`

3. **npm (REFERENCE ONLY - NEVER USE DIRECTLY)**
   - `npm run dev` - Runs INSIDE container only (documented for reference)
   - `npm run build` - Used in CI/CD pipelines

## References

- See [`grouchocli/README.md`](grouchocli/README.md) for CLI documentation
- See [`Dockerfile`](Dockerfile) for build stages
- See [`docker-compose.yml`](docker-compose.yml) for dev configuration
- See [`docker-compose.prod.yml`](docker-compose.prod.yml) for prod configuration
- See [`.kilocode/rules/execution-policy.md`](execution-policy.md) for hard rule details
