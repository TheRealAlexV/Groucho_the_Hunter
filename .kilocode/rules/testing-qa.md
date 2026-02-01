# Testing & QA: Groucho the Hunter

## When This Applies

These rules apply when:
- Writing tests for game systems
- Debugging performance issues
- Conducting code reviews
- Validating gameplay mechanics
- Testing across different browsers/devices

## Testing Strategy

### 1. Test Categories

| Category | Focus | Tools |
|----------|-------|-------|
| **Unit Tests** | Individual functions/classes | Jest/Vitest |
| **Integration Tests** | System interactions | Jest + jsdom |
| **Visual Tests** | Rendering correctness | Manual + Screenshots |
| **Performance Tests** | FPS, memory, load times | Stats.js, Chrome DevTools |
| **Gameplay Tests** | Mechanics, puzzles, progression | Manual playtesting |
| **Cross-Browser** | Compatibility | Chrome, Firefox, Safari, Edge |

### 2. Critical Test Areas

**Must test:**
- Player movement and collision detection
- Puzzle solution validation
- State machine transitions
- Save/load functionality
- Audio playback and spatial positioning
- UI responsiveness

**Should test:**
- Boss AI behavior
- Level loading/unloading
- Asset loading and caching
- Particle system performance
- Network-related features (if any)

## Unit Testing Guidelines

### 1. Test Structure

```javascript
// src/player/__tests__/Player.test.js
import { Player } from '../Player.js';
import { Vector3 } from 'three';

describe('Player', () => {
  let player;
  let mockCamera;
  let mockInputManager;
  
  beforeEach(() => {
    mockCamera = { position: new Vector3() };
    mockInputManager = { getMovementVector: jest.fn() };
    player = new Player(mockCamera, mockInputManager);
  });
  
  afterEach(() => {
    player.dispose();
  });
  
  describe('Movement', () => {
    test('should move forward when W key is pressed', () => {
      mockInputManager.getMovementVector.mockReturnValue(new Vector3(0, 0, -1));
      
      player.update(0.016); // 1 frame at 60fps
      
      expect(player.position.z).toBeLessThan(0);
    });
    
    test('should apply gravity when not grounded', () => {
      player.jump();
      const initialY = player.position.y;
      
      player.update(0.016);
      
      expect(player.position.y).toBeLessThan(initialY);
    });
  });
});
```

### 2. Testing Three.js Code

```javascript
// Mock Three.js for unit tests
jest.mock('three', () => ({
  Vector3: jest.fn().mockImplementation(() => ({
    x: 0, y: 0, z: 0,
    clone: jest.fn().mockReturnThis(),
    multiplyScalar: jest.fn().mockReturnThis(),
    add: jest.fn().mockReturnThis()
  })),
  Clock: jest.fn().mockImplementation(() => ({
    getDelta: jest.fn().mockReturnValue(0.016)
  }))
}));
```

### 3. Test Coverage Requirements

- **Core Systems**: 80%+ coverage (Input, State, Player)
- **Puzzle Logic**: 90%+ coverage (validation, state changes)
- **Utilities**: 70%+ coverage (Math helpers, storage)
- **UI Components**: 60%+ coverage (rendering logic)

## Performance Testing

### 1. FPS Monitoring

```javascript
// Enable in development only
const isDev = import.meta.env.DEV;

if (isDev) {
  const stats = new Stats();
  stats.showPanel(0); // FPS
  document.body.appendChild(stats.dom);
  
  gameLoop.on('tick', () => {
    stats.begin();
    // ... update loop
    stats.end();
  });
}
```

### 2. Performance Targets

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| FPS | 60 | 45-59 | <45 |
| Draw Calls | <100 | 100-150 | >150 |
| Memory Growth | 0 MB/min | 1-5 MB/min | >5 MB/min |
| Load Time | <5s | 5-10s | >10s |

### 3. Memory Leak Detection

```javascript
// Check memory every 10 seconds
setInterval(() => {
  const memory = performance.memory;
  if (memory) {
    console.log('Used JS Heap:', (memory.usedJSHeapSize / 1048576).toFixed(2), 'MB');
    console.log('Total JS Heap:', (memory.totalJSHeapSize / 1048576).toFixed(2), 'MB');
  }
}, 10000);

// Monitor Three.js objects
console.log('Geometries:', renderer.info.memory.geometries);
console.log('Textures:', renderer.info.memory.textures);
console.log('Programs:', renderer.info.programs?.length || 0);
```

### 4. Stress Testing

Test scenarios:
- 50+ enemies on screen
- Rapid level transitions
- Maximum particle count
- Multiple simultaneous puzzles
- Long play sessions (1+ hours)

## Debugging Guidelines

### 1. Debug Mode Configuration

```javascript
// src/utils/Debug.js
export const DEBUG = {
  enabled: import.meta.env.DEV,
  showColliders: false,
  showFPS: true,
  showEntityCount: false,
  logLevel: 'debug', // debug, info, warn, error
  
  toggle(key) {
    if (this.enabled) {
      this[key] = !this[key];
      console.log(`Debug.${key}: ${this[key]}`);
    }
  }
};
```

### 2. Console Logging

```javascript
// Use appropriate log levels
import { DEBUG } from './utils/Debug.js';

// Development only logs
DEBUG.enabled && console.log('Player spawned at:', position);

// Always show warnings
console.warn('Performance degraded: draw calls > 100');

// Errors must be actionable
console.error('Failed to load level:', levelId, error);
```

### 3. Visual Debugging

```javascript
// Collision visualization
if (DEBUG.showColliders) {
  const box = new THREE.BoxHelper(mesh, 0xffff00);
  scene.add(box);
}

// Raycast visualization
if (DEBUG.showColliders) {
  const rayHelper = new THREE.ArrowHelper(
    raycaster.ray.direction,
    raycaster.ray.origin,
    5,
    0xff0000
  );
  scene.add(rayHelper);
}
```

## Code Review Checklist

### Before Submitting PR

- [ ] All tests pass (`npm test`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Code formatted (`npm run format`)
- [ ] No console.log statements in production code
- [ ] No TODO/FIXME comments (create issues instead)
- [ ] JSDoc comments for public APIs
- [ ] Memory leaks checked (dispose() methods implemented)
- [ ] Performance impact assessed
- [ ] Browser compatibility verified

### Review Criteria

**Architecture:**
- Follows ECS pattern where appropriate
- Managers properly singleton-ized
- Event-driven communication used

**Performance:**
- No memory leaks in object lifecycle
- drawCalls minimized with instancing/merging
- Texture compression used

**Code Quality:**
- Naming conventions followed
- Single responsibility principle respected
- Error handling implemented

**Testing:**
- Unit tests for new logic
- Edge cases covered
- Integration tests for system interactions

## Browser Testing Matrix

| Browser | Version | WebGPU | Priority |
|---------|---------|--------|----------|
| Chrome | Latest | ✓ | Primary |
| Firefox | Latest | ✓ | High |
| Safari | 17+ | ✓ | High |
| Edge | Latest | ✓ | Medium |
| Chrome Mobile | Latest | - | Medium |
| Safari iOS | 17+ | - | Low |

## Bug Reporting Template

```markdown
## Bug Description
Brief description of the issue

## Reproduction Steps
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Environment
- Browser: [e.g., Chrome 120]
- OS: [e.g., Windows 11]
- GPU: [if applicable]

## Screenshots/Videos
If applicable

## Console Logs
```
[Paste relevant console output]
```

## Additional Context
Any other relevant information
```

## References

- See [`Docs/ImplementationPlan.md`](Docs/ImplementationPlan.md) for testing phases
- See [`.kilocode/rules/threejs-patterns.md`](threejs-patterns.md) for performance patterns
- Jest Documentation: https://jestjs.io/docs/getting-started
- Three.js Testing Guide: https://threejs.org/docs/#manual/en/introduction/Testing
