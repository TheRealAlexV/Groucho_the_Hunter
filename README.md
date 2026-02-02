# Groucho the Hunter

> A browser-based first-person shooter/adventure game built with Three.js, combining FPS gameplay with cybersecurity-themed puzzles.

![Groucho](images/Groucho.png)

---

## ⚠️ CRITICAL: Docker-Only Execution Policy

**ALL development, testing, and execution MUST use Docker via grouchocli.**

| ⚠️ HARD RULE | Enforcement |
|--------------|-------------|
| **ONLY Approved Method** | `groucho start --dev` is the **ONLY** way to run the application |
| **STRICTLY PROHIBITED** | Never run `npm run dev`, `npm start`, or `node` directly on the host |
| **Container-Only** | All testing and debugging must happen inside Docker containers |

### Why Docker-Only?
- **Consistency**: Identical Node.js, dependencies, and configurations across all machines
- **Isolation**: No conflicts with host system packages or Node versions
- **Reproducibility**: Same environment in development, testing, and production

---

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- Python 3.11+ (for grouchocli)

### 1. Setup (One Time)

```bash
cd grouchocli && ./setup.sh
```

This installs the `groucho` CLI tool with all dependencies.

### 2. Run the Application

```bash
# Development (port 3000 with hot reload)
groucho start --dev

# Production (port 8080, optimized build)
groucho start --prod
```

Access the game at:
- Development: http://localhost:3000
- Production: http://localhost:8080

### 3. Development Workflow

```bash
# Start development environment
groucho start --dev

# View logs
groucho logs --dev --follow

# Check status
groucho status

# Open interactive menu
groucho menu

# Stop when done
groucho stop --dev
```

### 4. Recovery (If You Accidentally Ran npm run dev)

```bash
# Stop any local Node processes
killall node

# Use the proper Docker command
groucho start --dev
```

---

## Available Commands

### grouchocli Commands

| Command | Purpose |
|---------|---------|
| `groucho start --dev` | Start development environment (port 3000) |
| `groucho start --prod` | Start production environment (port 8080) |
| `groucho stop --dev` | Stop development container |
| `groucho stop --prod` | Stop production container |
| `groucho restart --dev` | Restart development container |
| `groucho status` | Show container/game status |
| `groucho logs --dev --follow` | View and follow logs |
| `groucho shell --dev` | Open shell inside container |
| `groucho build --dev` | Build development image |
| `groucho build --prod` | Build production image |
| `groucho clean --force` | Remove all containers and images |
| `groucho menu` | Launch interactive TUI |

### Container Commands (Reference Only)

> ⚠️ **These commands run INSIDE the container. Never run them directly on the host.**

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start Vite dev server (inside container only) |
| `npm run build` | Production build (inside container only) |
| `npm run lint` | Run ESLint (inside container only) |
| `npm run format` | Format code with Prettier (inside container only) |

---

## Project Structure

```
├── src/                      # Source code
│   ├── core/                 # Core engine (Renderer, SceneManager, GameLoop)
│   ├── systems/              # Game systems (Input, Audio, State, Collision)
│   ├── player/               # Player controller and movement
│   ├── world/                # World systems (levels, entities, puzzles)
│   ├── ui/                   # User interface components
│   └── utils/                # Utilities and constants
├── grouchocli/               # CLI management tool
├── Docs/                     # Documentation
├── docker-compose.yml        # Development configuration
├── docker-compose.prod.yml   # Production configuration
└── Dockerfile                # Multi-stage build
```

---

## Documentation

- [Technical Design](Docs/TechnicalDesign.md) - Architecture and implementation details
- [Implementation Plan](Docs/ImplementationPlan.md) - 12-week development roadmap
- [Story Board](Docs/StoryBoard.md) - Narrative and level design
- [Docker Workflow](.kilocode/rules/docker-workflow.md) - Complete Docker documentation
- [Execution Policy](.kilocode/rules/execution-policy.md) - Hard rule details

---

## Technology Stack

- **Engine**: Three.js r171+ with WebGPU/WebGL2
- **Build Tool**: Vite 5.x
- **Container**: Docker with nginx
- **CLI Tool**: Python 3.11+ with Click and Textual

---

## Troubleshooting

### Port already in use
```bash
# Use different port
groucho start --dev --port 3001
```

### Hot reload not working
```bash
# Restart the container
groucho restart --dev
```

### Permission issues (Linux)
```bash
sudo chown -R $(id -u):$(id -g) .
groucho restart --dev
```

---

## License

[Add your license information here]
