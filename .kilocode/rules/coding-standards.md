# Coding Standards: Groucho the Hunter

## When This Applies

These rules apply when:
- Writing JavaScript/ES2022+ code
- Creating new files or modules
- Naming variables, functions, classes
- Writing documentation or comments
- Organizing imports and exports

## Code Style

### 1. JavaScript Standards

- Use ES2022+ features (modern async/await, optional chaining, nullish coalescing)
- Always use strict mode: `'use strict';` at file top
- Prefer `const` over `let`, never use `var`
- Use semicolons explicitly
- Maximum line length: 100 characters
- Indentation: 2 spaces (no tabs)

### 2. Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Files | kebab-case | `scene-manager.js` |
| Classes | PascalCase | `GameController` |
| Functions | camelCase | `updatePlayerPosition()` |
| Variables | camelCase | `playerVelocity` |
| Constants | UPPER_SNAKE_CASE | `MAX_DRAW_CALLS` |
| Private methods | _camelCase (leading underscore) | `_internalUpdate()` |
| Private fields | #camelCase (private class fields) | `#instance` |
| Event handlers | handle[Event] | `handleKeyDown()` |
| Boolean variables | is/has/can prefix | `isJumping`, `hasWeapon` |

### 3. File Organization

Each file must follow this structure:
```javascript
// 1. Shebang/strict mode (if needed)
'use strict';

// 2. Imports (grouped by type)
// External libraries
import * as THREE from 'three';

// Three.js addons
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';

// Project modules
import { GameController } from './Game.js';
import { config } from '../config.js';

// 3. Constants
const MAX_DELTA_TIME = 0.1;

// 4. Class/Module definition
export class MyClass {
  // Class body
}

// 5. Export (default or named)
export default MyClass;
```

Import grouping order:
1. External libraries (Three.js, etc.)
2. Three.js addons (controls, loaders, etc.)
3. External dependencies (three-mesh-bvh, etc.)
4. Project core modules
5. Project system modules
6. Project utility modules
7. Relative imports (siblings)

### 4. Class Structure

```javascript
export class PlayerController {
  // 1. Static properties
  static DEFAULT_SPEED = 5.0;
  
  // 2. Private fields
  #isGrounded = false;
  #velocity = new THREE.Vector3();
  
  // 3. Constructor
  constructor(camera, inputManager) {
    this.camera = camera;
    this.inputManager = inputManager;
    this.speed = PlayerController.DEFAULT_SPEED;
  }
  
  // 4. Public methods
  update(deltaTime) {
    this.#updateVelocity(deltaTime);
    this.#applyMovement();
  }
  
  jump() {
    if (this.#isGrounded) {
      this.#velocity.y = JUMP_FORCE;
    }
  }
  
  // 5. Private methods
  #updateVelocity(deltaTime) {
    // Implementation
  }
  
  #applyMovement() {
    // Implementation
  }
  
  // 6. Getter/Setter
  get isGrounded() {
    return this.#isGrounded;
  }
  
  // 7. Cleanup
  dispose() {
    // Cleanup code
  }
}
```

### 5. Function Design

- Functions should do ONE thing (single responsibility)
- Maximum 20 lines per function (ideally <10)
- Maximum 3 parameters (use options object for more)
- Use default parameters when appropriate
- Return early to reduce nesting

```javascript
// GOOD
function createPlayer(options = {}) {
  const { position = new THREE.Vector3(), health = 100 } = options;
  return new Player(position, health);
}

// BAD - Too many parameters
function createPlayer(x, y, z, health, speed, jumpForce, canSprint) {
  // ...
}
```

### 6. Documentation Requirements

All public APIs must have JSDoc comments:

```javascript
/**
 * Handles player movement and collision detection.
 * @class
 */
export class PlayerController {
  /**
   * Creates a new PlayerController.
   * @param {THREE.Camera} camera - The first-person camera
   * @param {InputManager} inputManager - Input handling system
   * @param {CollisionSystem} collisionSystem - Collision detection
   */
  constructor(camera, inputManager, collisionSystem) {
    // ...
  }
  
  /**
   * Updates player position and velocity.
   * @param {number} deltaTime - Time since last frame in seconds
   * @returns {boolean} True if movement was successful
   */
  update(deltaTime) {
    // ...
  }
}
```

### 7. Comments

- Use `//` for single-line comments
- Use `/* */` for multi-line comments
- Explain WHY, not WHAT (code should be self-documenting)
- Use TODO comments with format: `// TODO(author): description`
- Use FIXME for known issues: `// FIXME: description`

```javascript
// GOOD - Explains why
// Use deltaTime to ensure consistent movement speed across different frame rates
position.add(velocity.clone().multiplyScalar(deltaTime));

// BAD - States the obvious
// Add velocity to position
position.add(velocity);
```

### 8. Error Handling

- Use try/catch for async operations
- Validate inputs at function boundaries
- Use custom Error classes for domain-specific errors
- Always clean up resources in finally blocks

```javascript
async function loadLevel(levelId) {
  try {
    const data = await fetchLevelData(levelId);
    return validateLevelData(data);
  } catch (error) {
    console.error(`Failed to load level ${levelId}:`, error);
    throw new LevelLoadError(levelId, error);
  }
}
```

### 9. Async Patterns

- Prefer async/await over Promise chains
- Use Promise.all() for concurrent operations
- Always await promises, don't ignore them

```javascript
// GOOD
async function initializeGame() {
  await Promise.all([
    renderer.initialize(),
    assetManager.preloadCriticalAssets(),
    audioManager.initialize()
  ]);
  gameLoop.start();
}

// BAD
function initializeGame() {
  renderer.initialize().then(() => {
    assetManager.preloadCriticalAssets().then(() => {
      // Nested callbacks
    });
  });
}
```

### 10. Magic Numbers

- NEVER use magic numbers
- Define all constants in `src/utils/Constants.js` or at file top

```javascript
// src/utils/Constants.js
export const PLAYER = {
  DEFAULT_SPEED: 5.0,
  SPRINT_MULTIPLIER: 1.5,
  JUMP_FORCE: 8.0,
  MAX_STAMINA: 100,
  STAMINA_DRAIN: 20, // per second
  HEIGHT: 1.8,
  RADIUS: 0.3
};

export const PHYSICS = {
  GRAVITY: -9.81,
  TERMINAL_VELOCITY: -50,
  FRICTION: 0.9
};

export const RENDERING = {
  MAX_DRAW_CALLS: 100,
  SHADOW_MAP_SIZE: 2048,
  FOV: 75,
  NEAR_PLANE: 0.1,
  FAR_PLANE: 1000
};
```

## ESLint Configuration

Use these rules in `.eslintrc.js`:
```javascript
module.exports = {
  env: {
    browser: true,
    es2022: true
  },
  extends: ['eslint:recommended'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'no-unused-vars': 'warn',
    'no-console': 'warn',
    'prefer-const': 'error',
    'no-var': 'error',
    'semi': ['error', 'always'],
    'quotes': ['error', 'single'],
    'indent': ['error', 2],
    'max-len': ['warn', { 'code': 100 }],
    'no-trailing-spaces': 'error',
    'eol-last': 'error'
  }
};
```

## Prettier Configuration

`.prettierrc`:
```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true
}
```

## References

- See [`Docs/AI/prompt.md`](Docs/AI/prompt.md) Section 10 for AI development guidelines
- See [`Docs/TechnicalDesign.md`](Docs/TechnicalDesign.md) Section 11 for file structure
- See [`.kilocode/rules/memory-bank/tech.md`](memory-bank/tech.md) for tech stack
