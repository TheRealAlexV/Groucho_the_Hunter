# Project Context: Groucho the Hunter

## Current Work Focus

**Phase**: Project Initialization (Pre-Development)

The project is currently in the planning and documentation phase. All design documents have been completed, and the technical foundation is established. The actual implementation has not yet begun.

### Completed Documentation
- [`brief.md`](brief.md) - Project overview and objectives
- [`product.md`](product.md) - Product definition and user experience goals
- [`Docs/research.md`](../../Docs/research.md) - Technical research on Three.js best practices
- [`Docs/StoryBoard.md`](../../Docs/StoryBoard.md) - Complete narrative and level design
- [`Docs/TechnicalDesign.md`](../../Docs/TechnicalDesign.md) - Architecture and implementation details
- [`Docs/ImplementationPlan.md`](../../Docs/ImplementationPlan.md) - 12-week development roadmap

### Completed Infrastructure
- [`Dockerfile`](../../Dockerfile) - Multi-stage build configuration (Node.js builder + nginx production)
- [`docker-compose.yml`](../../docker-compose.yml) - Development environment with hot reload (Vite dev server on port 3000)
- [`docker-compose.prod.yml`](../../docker-compose.prod.yml) - Production deployment with nginx (port 8080), health checks, and security hardening
- [`nginx.conf`](../../nginx.conf) - Web server configuration for static assets
- [`.dockerignore`](../../.dockerignore) - Docker build optimization
- [`grouchocli/`](../../grouchocli/) - Python CLI management tool for Docker environments with interactive TUI

## Recent Changes

- **2026-02-01**: Added `grouchocli` Python CLI tool
  - Interactive TUI menu for Docker management (`groucho menu`)
  - Commands: start, stop, restart, status, logs, shell, build, clean
  - Supports both dev (port 3000) and prod (port 8080) environments
  - Automated setup script with `uv` package manager
- **2026-02-01**: Docker Compose configuration split into dev/prod files
  - `docker-compose.yml` - Development with hot reload, volume mounts, Vite dev server
  - `docker-compose.prod.yml` - Production with nginx, health checks, resource limits
- **2026-02-01**: Project documentation phase completed
- **2026-02-01**: Memory bank initialization started

## Next Steps

### Immediate (Next Session)
1. Initialize Vite project with Three.js
2. Set up folder structure per Technical Design
3. Configure build pipeline and development server
4. Set up linting (ESLint) and formatting (Prettier)
5. Initialize Git repository with `.gitignore`
6. Set up grouchocli CLI tool (`cd grouchocli && ./setup.sh`)

### Phase 1: Core Engine (Weeks 1-3)
- Week 1: Project initialization and tooling setup
- Week 2: WebGPU renderer with WebGL2 fallback, scene manager
- Week 3: FPS player controller with collision detection

### Phase 2: First Level (Weeks 4-6)
- Build Level 1: The Outskirts environment
- Implement 3 basic puzzle types
- Create Spamford boss encounter

## Active Decisions

| Decision | Status | Notes |
|----------|--------|-------|
| Three.js r171+ | Confirmed | WebGPU with automatic WebGL2 fallback |
| Vite build tool | Confirmed | Fast HMR and optimized builds |
| Docker deployment | Confirmed | Multi-stage nginx-based container |
| PointerLockControls | Confirmed | Standard FPS camera controls |
| three-mesh-bvh | Confirmed | Collision detection optimization |

## Blockers

None currently identified. Project is ready to begin Phase 1 implementation.

## Docker-Only Execution Policy

⚠️ **HARD RULE**: Always use Docker via grouchocli. Never run `npm run dev` directly.

### Mandatory Execution Policy

| Rule | Enforcement |
|------|-------------|
| **ONLY Approved Method** | `groucho start --dev` is the ONLY way to run the application |
| **Strictly Prohibited** | Running `npm run dev`, `npm start`, or `node` directly on host |
| **Container-Only Testing** | All testing, development, and debugging must happen inside containers |
| **Reference Only** | `npm` commands are for documentation only - they run INSIDE the container |

### Why Docker-Only?

1. **Consistency**: Identical Node.js, dependencies, and configurations across all machines
2. **Isolation**: No conflicts with host system packages or Node versions
3. **Reproducibility**: Same environment in development, testing, and production
4. **Safety**: Container boundaries prevent accidental system modifications

### Quick Start (Only Valid Method)

```bash
# One-time setup
cd grouchocli && ./setup.sh

# Run the application (ONLY approved way)
groucho start --dev        # Development (port 3000)
groucho start --prod       # Production (port 8080)

# Other useful commands
groucho status             # Check container status
groucho logs --dev --follow # View logs
groucho menu               # Interactive TUI
groucho stop --dev         # Stop container
```

### Violation Recovery

If you accidentally ran `npm run dev` directly:
```bash
# 1. Stop any local Node processes
killall node

# 2. Use the proper Docker command
groucho start --dev
```

See [`.kilocode/rules/docker-workflow.md`](../../docker-workflow.md) for complete Docker workflow documentation.
See [`.kilocode/rules/execution-policy.md`](../../execution-policy.md) for detailed execution policy.

## Key Metrics to Track

- Draw calls per frame (target: <100)
- Frame rate on target hardware (target: 60fps)
- Load time (target: <5 seconds)
- Level 1 completion rate (target: >70%)
