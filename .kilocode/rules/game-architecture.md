# Game Architecture Rules: Groucho the Hunter

## When This Applies

These rules apply when:
- Designing or implementing game systems, managers, or controllers
- Creating Entity Component System (ECS) patterns
- Working with scene graphs or level architecture
- Implementing game state management
- Building puzzle frameworks or interactable systems

## Core Architecture Principles

### 1. Manager Pattern

- Use Singleton managers for core systems (GameController, SceneManager, InputManager)
- Managers must be initialized in a specific order: Renderer → Scene → Input → Audio → State
- All managers must have a `dispose()` method for cleanup
- Use dependency injection rather than direct imports between managers

### 2. Entity Component System (ECS)

- **Entities**: Simple containers with a unique ID and list of components
- **Components**: Pure data containers, no logic
  ```javascript
  // GOOD - Pure data
  class TransformComponent {
    position = new THREE.Vector3();
    rotation = new THREE.Euler();
    scale = new THREE.Vector3(1, 1, 1);
  }
  
  // BAD - Logic in component
  class TransformComponent {
    update() { /* logic here */ }
  }
  ```
- **Systems**: Contain all logic, operate on entities with specific components
  ```javascript
  class MovementSystem {
    update(entities, deltaTime) {
      for (const entity of entities) {
        if (entity.hasComponent(Transform) && entity.hasComponent(Velocity)) {
          // Apply movement logic
        }
      }
    }
  }
  ```

### 3. Component Design Rules

- Components must be serializable for save/load
- Use composition over inheritance
- Maximum 10 components per entity (performance constraint)
- Name components descriptively: `[Feature][Type]Component`
  - Examples: `PlayerMovementComponent`, `ThreatAIComponent`, `PuzzleStateComponent`

### 4. Scene Graph Structure

```
Root Scene
├── World Container
│   ├── Static Level Geometry (BVH optimized)
│   ├── Dynamic Entities
│   │   ├── Player Group
│   │   ├── Threat Entities
│   │   └── Interactables
│   └── Lighting Setup
└── UI Overlay (Orthographic camera)
    ├── HUD Elements
    ├── Crosshair
    └── Puzzle Overlays
```

- Separate static and dynamic geometry for BVH optimization
- UI must be in a separate scene with orthographic camera
- Use object pooling for frequently spawned/destroyed entities

### 5. State Management

Game states (defined in `src/utils/Constants.js`):
- `LOADING` - Asset loading
- `MAIN_MENU` - Menu screen
- `PLAYING` - Active gameplay
- `PAUSED` - Pause menu open
- `PUZZLE` - Puzzle interface active
- `CUTSCENE` - Non-interactive sequence
- `GAME_OVER` - Player defeated
- `VICTORY` - Level completed

Rules:
- State transitions must go through `StateManager.transitionTo(newState)`
- Always validate state transitions (e.g., cannot go from LOADING directly to PUZZLE)
- Save game state on every state change
- Pause all systems except UI when in PAUSED state

### 6. Puzzle Framework Architecture

```javascript
// Base class for all puzzles
class PuzzleBase {
  constructor(puzzleData) {
    this.id = puzzleData.id;
    this.type = puzzleData.type;
    this.difficulty = puzzleData.difficulty;
    this.isCompleted = false;
  }
  
  initialize() { /* Override */ }
  showUI() { /* Override */ }
  hideUI() { /* Override */ }
  checkSolution() { /* Override */ }
  onComplete() { /* Override */ }
  dispose() { /* Cleanup */ }
}
```

Puzzle types:
- `LogAnalysisPuzzle` - Timeline reconstruction
- `PhishingHuntPuzzle` - Visual indicator spotting
- `USBAnalysisPuzzle` - File signature matching
- `SIEMTriagePuzzle` - Alert prioritization
- `MemoryForensicsPuzzle` - RAM dump analysis

### 7. Level Architecture

Each level consists of:
- **Level Data** (JSON): Spawn points, entity positions, puzzle locations
- **Static Geometry** (glTF): Environment meshes with BVH
- **Dynamic Entities** (ECS): Threats, NPCs, collectibles
- **Lighting Configuration**: Ambient, directional (CSM), point lights
- **Audio Zones**: Ambient sounds, music triggers

Level loading flow:
1. StateManager.transitionTo(LOADING)
2. AssetManager.loadLevelAssets(levelId)
3. SceneManager.clearCurrentScene()
4. EntityManager.spawnLevelEntities(levelData)
5. PlayerController.spawnAt(levelData.spawnPoint)
6. StateManager.transitionTo(PLAYING)

### 8. Interactable System

All interactable objects must:
- Implement `Interactable` interface
- Have a collision box for raycast detection
- Display interaction prompt when player looks at them
- Emit events through EventBus

```javascript
class InteractableSystem {
  // Raycast from camera to detect interactables
  checkInteraction(camera, maxDistance = 5) {
    // Return interactable object or null
  }
}
```

## File Organization

```
src/
├── core/              # Core engine systems
│   ├── Game.js
│   ├── Renderer.js
│   ├── SceneManager.js
│   └── GameLoop.js
├── systems/           # Game systems
│   ├── InputManager.js
│   ├── StateManager.js
│   ├── AudioManager.js
│   └── CollisionSystem.js
├── world/             # World systems
│   ├── entities/      # ECS
│   ├── puzzles/       # Puzzle implementations
│   └── levels/        # Level data and loaders
├── player/            # Player systems
│   ├── Player.js
│   ├── Camera.js
│   └── Movement.js
├── ui/                # User interface
│   ├── hud/
│   └── puzzles/
└── utils/             # Utilities
    ├── EventBus.js
    ├── Constants.js
    └── Storage.js
```

## Performance Constraints

- Maximum 100 draw calls per frame
- Maximum 50 dynamic entities per level
- BVH rebuild only when static geometry changes
- Object pool for bullets, particles, effects
- LOD system for entities >10 units from camera

## References

- See [`Docs/TechnicalDesign.md`](Docs/TechnicalDesign.md) for detailed architecture
- See [`Docs/ImplementationPlan.md`](Docs/ImplementationPlan.md) for file structure
- See [`.kilocode/rules/memory-bank/architecture.md`](memory-bank/architecture.md) for system overview
