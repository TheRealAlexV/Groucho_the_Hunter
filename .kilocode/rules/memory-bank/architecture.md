# System Architecture: Groucho the Hunter

## Overview

Groucho the Hunter uses a modular component-based architecture built on Three.js. The system follows a manager pattern with clear separation of concerns between rendering, game logic, and UI.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Browser Client                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │   Core       │  │    Game      │  │       World          │   │
│  │   Engine     │  │   Systems    │  │      Systems         │   │
│  │              │  │              │  │                      │   │
│  │ • Renderer   │  │ • Input      │  │ • Level Manager      │   │
│  │ • Scene Mgr  │  │ • Player     │  │ • ECS                │   │
│  │ • Game Loop  │  │ • Physics    │  │ • Puzzle Framework   │   │
│  │              │  │ • Audio      │  │ • Interactables      │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌────────────────────────────────────┐   │
│  │       UI         │  │         Asset Management           │   │
│  │                  │  │                                    │   │
│  │ • HUD System     │  │ • Asset Loader                     │   │
│  │ • Menu Manager   │  │ • Asset Cache                      │   │
│  │ • Puzzle UIs     │  │ • LOD System                       │   │
│  └──────────────────┘  └────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                     CLI Tool (grouchocli)                        │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────────────┐  │
│  │   Docker    │  │     TUI      │  │    Game Manager        │  │
│  │   Manager   │  │   Interface  │  │    • Status checks     │  │
│  │             │  │              │  │    • Log streaming     │  │
│  │ • Start/Stop│  │ • Menu nav   │  │    • Shell access      │  │
│  │ • Build     │  │ • Keybinds   │  │                        │  │
│  │ • Logs      │  │ • Status UI  │  │                        │  │
│  └─────────────┘  └──────────────┘  └────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│  Server/CDN   │    │ Local Storage  │    │   External   │
│               │    │                │    │              │
│ • Static      │    │ • Save Games   │    │ • APIs       │
│ • Config      │    │ • Settings     │    │ • Analytics  │
└───────────────┘    └────────────────┘    └──────────────┘
```

## Source Code Structure (Planned)

```
src/
├── core/                    # Core engine systems
│   ├── renderer.js          # WebGPU/WebGL2 renderer setup
│   ├── scene-manager.js     # Scene graph management
│   ├── game-loop.js         # Main game loop
│   └── event-bus.js         # Inter-system communication
│
├── systems/                 # Game systems
│   ├── input/               # Input handling
│   │   ├── input-manager.js
│   │   └── key-bindings.js
│   ├── player/              # Player controller
│   │   ├── fps-controller.js
│   │   ├── camera-controller.js
│   │   └── movement.js
│   ├── physics/             # Collision detection
│   │   ├── collision-system.js
│   │   └── raycast-helper.js
│   └── audio/               # Audio management
│       └── audio-manager.js
│
├── world/                   # World systems
│   ├── level/               # Level management
│   │   ├── level-manager.js
│   │   └── level-loader.js
│   ├── entities/            # Entity Component System
│   │   ├── entity.js
│   │   ├── component.js
│   │   └── entity-manager.js
│   ├── puzzles/             # Puzzle framework
│   │   ├── puzzle-base.js
│   │   ├── log-analysis.js
│   │   ├── phishing-hunt.js
│   │   └── memory-forensics.js
│   └── interactables/       # Interactive objects
│       └── interaction-system.js
│
├── ui/                      # User interface
│   ├── hud/                 # Heads-up display
│   │   ├── hud-manager.js
│   │   ├── crosshair.js
│   │   └── scanner-display.js
│   ├── menus/               # Menu screens
│   │   ├── main-menu.js
│   │   ├── pause-menu.js
│   │   └── settings-menu.js
│   └── puzzle-ui/           # Puzzle interfaces
│       └── puzzle-overlay.js
│
├── assets/                  # Asset management
│   ├── loader.js            # Asset loading
│   ├── cache.js             # Asset caching
│   └── lod.js               # Level of detail
│
├── utils/                   # Utilities
│   ├── math-helpers.js
│   ├── debug.js
│   └── constants.js
│
├── game.js                  # Main game controller
├── main.js                  # Entry point
└── config.js                # Game configuration

grouchocli/                  # CLI management tool
├── __init__.py              # Package initialization
├── config.py                # Configuration management
├── docker_manager.py        # Docker operations wrapper
├── game_manager.py          # Game state monitoring
├── main.py                  # CLI entry point (Click)
├── tui.py                   # Interactive TUI (Textual)
├── utils.py                 # Utility functions
├── pyproject.toml           # UV project configuration
├── setup.sh                 # Bootstrap script
└── README.md                # CLI documentation
```

## Key Technical Decisions

### 1. Rendering: WebGPU with WebGL2 Fallback
- **Three.js r171+** provides production-ready WebGPU support
- Automatic fallback ensures broad browser compatibility
- TSL (Three Shader Language) for portable shaders
- Performance gains: 2-10x in draw-call-heavy scenes

### 2. Physics: Custom Raycasting + three-mesh-bvh
- No heavy physics engine needed for FPS movement
- BVH acceleration enables 80,000+ polygon collision at 60fps
- Raycasting approach fits puzzle-adventure gameplay

### 3. State Management: Custom Event-Driven System
- Lightweight implementation tailored to game needs
- States: LOADING, MAIN_MENU, PLAYING, PAUSED, PUZZLE, CUTSCENE, GAME_OVER, VICTORY
- Event bus for loose coupling between systems

### 4. Component Architecture
- Entity Component System (ECS) for game objects
- Composition over inheritance
- Enables data-driven level design

### 5. Asset Pipeline
- Draco compression for models (90-95% size reduction)
- KTX2 texture compression (10x VRAM reduction)
- LOD system for performance scaling
- Progressive loading with priority queues

## Component Relationships

```
GameController (Singleton)
    ├── SceneManager
    │   └── Manages: Scene graph, level transitions
    │
    ├── RenderManager
    │   └── Manages: WebGPU/WebGL renderer, post-processing
    │
    ├── AssetManager
    │   └── Manages: Loading, caching, LOD
    │
    ├── InputManager
    │   └── Maps: Keyboard/mouse → game actions
    │
    ├── AudioManager
    │   └── Manages: 3D spatial audio, music, SFX
    │
    └── StateManager
        └── Manages: Game state machine, transitions

Entity Layer
    ├── Player Entity
    │   ├── Transform Component
    │   ├── Camera Component
    │   ├── Movement Component
    │   └── Scanner Component
    │
    ├── Threat Entities (Enemies)
    │   ├── Transform Component
    │   ├── AI Component
    │   ├── Health Component
    │   └── Attack Component
    │
    ├── Interactable Props
    │   ├── Transform Component
    │   ├── Interaction Component
    │   └── Visual Component
    │
    └── Puzzle Objects
        ├── Puzzle Logic Component
        ├── UI Component
        └── State Component
```

## Design Patterns in Use

| Pattern | Usage | Location |
|---------|-------|----------|
| **Singleton** | GameController, managers | `game.js`, `*-manager.js` |
| **Component** | Entity behavior composition | `world/entities/` |
| **Observer** | Event-driven communication | `core/event-bus.js` |
| **State Machine** | Game state management | `StateManager` |
| **Object Pool** | Particle/bullet reuse | `utils/object-pool.js` |
| **Factory** | Entity creation | `world/entities/factory.js` |

## Critical Implementation Paths

### Frame Update Flow
```
GameLoop.tick():
  1. Calculate deltaTime
  2. InputManager.poll()
  3. StateManager.update()
  4. PlayerController.update(deltaTime)
  5. EntityManager.updateAll(deltaTime)
  6. PhysicsSystem.update()
  7. SceneManager.prepareRender()
  8. RenderManager.render()
```

### Level Loading Flow
```
LevelManager.loadLevel(levelId):
  1. StateManager.transitionTo(LOADING)
  2. AssetManager.loadLevelAssets(levelId)
  3. SceneManager.clearCurrentScene()
  4. EntityManager.spawnLevelEntities(levelData)
  5. PlayerController.spawnAt(levelData.spawnPoint)
  6. StateManager.transitionTo(PLAYING)
```

### Puzzle Interaction Flow
```
Player.scan() → Raycast detects PuzzleObject
  → InteractionSystem.trigger(puzzleObject)
  → StateManager.transitionTo(PUZZLE)
  → PuzzleUI.show(puzzleObject.type)
  → Player solves puzzle
  → PuzzleSystem.onComplete() → Rewards
  → StateManager.transitionTo(PLAYING)
```

## Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| Draw Calls | <100 | Instancing, BatchedMesh, LOD |
| Frame Rate | 60fps | WebGPU, optimized shaders |
| Load Time | <5s | Progressive loading, compression |
| Memory | Stable | Object pooling, proper disposal |
## CLI Architecture

The `grouchocli` tool provides a Python-based management layer for Docker environments:

### CLI Component Relationships

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
    ├── TUI (Textual)
    │   └── Provides: Interactive menu interface
    │       • MainMenu screen
    │       • Status widgets
    │       • Key bindings
    │
    └── Config
        └── Manages: Environment configuration
            • Dev settings (port 3000)
            • Prod settings (port 8080)
```

### CLI Design Patterns

| Pattern | Usage | Location |
|---------|-------|----------|
| **Command Pattern** | CLI command abstraction | `main.py` (Click decorators) |
| **Facade Pattern** | Docker complexity hiding | `docker_manager.py` |
| **Observer Pattern** | TUI reactive updates | `tui.py` (Textual reactive) |
| **Singleton Config** | Global configuration | `config.py` |

### Environment Detection

The CLI automatically detects project configuration:

```python
# Development environment
docker-compose.yml        # Port 3000, Vite dev server
Container: groucho-the-hunter-dev

# Production environment  
docker-compose.prod.yml   # Port 8080, nginx
Container: groucho-the-hunter
```
