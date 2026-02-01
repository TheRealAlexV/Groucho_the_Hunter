# Technical Specifications: Groucho the Hunter

## Technology Stack

### Core Technologies

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Engine** | Three.js | r171+ | 3D rendering engine |
| **Renderer** | WebGPU / WebGL2 | - | Hardware-accelerated graphics |
| **Language** | JavaScript (ES2022+) | - | Application logic |
| **Build Tool** | Vite | 5.x | Development server & bundling |
| **Container** | Docker | - | Deployment packaging |
| **Web Server** | nginx | alpine | Static file serving |

### Rendering Pipeline

- **Primary**: WebGPU (Three.js WebGPURenderer)
- **Fallback**: WebGL2 (automatic)
- **Shader Language**: TSL (Three Shader Language)
- **Shadows**: PCFSoftShadowMap with CSM
- **Post-Processing**: pmndrs/postprocessing
- **Tone Mapping**: ACESFilmicToneMapping

### Physics & Collision

- **Collision Detection**: three-mesh-bvh
- **Raycasting**: Three.js Raycaster
- **Movement**: Custom FPS controller with delta-time physics

### Audio

- **3D Audio**: Three.js Audio + Web Audio API
- **Music**: Web Audio API for dynamic mixing
- **Spatial Audio**: Positional audio sources

## Development Setup

### Prerequisites

```bash
# Required
Node.js >= 18.x
npm >= 9.x
Docker (optional, for deployment)

# Recommended
VSCode with extensions:
- ESLint
- Prettier
- Three.js snippets
```

### Project Initialization

```bash
# 1. Create Vite project
npm create vite@latest groucho-the-hunter -- --template vanilla

# 2. Install Three.js
npm install three@r171

# 3. Install additional dependencies
npm install three-mesh-bvh postprocessing

# 4. Install dev dependencies
npm install -D eslint prettier vite-plugin-eslint

# 5. Start development server
npm run dev
```

### Development Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (HMR enabled) |
| `npm run build` | Production build with optimizations |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint on source files |
| `npm run format` | Format code with Prettier |

### Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up --build

# Access application at http://localhost:8080

# Production deployment
docker build -t groucho-the-hunter .
docker run -p 8080:80 groucho-the-hunter
```

## Technical Constraints

### Browser Compatibility

| Feature | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 113+ | Full WebGPU support |
| Firefox | 118+ | WebGPU via flag |
| Safari | 17+ | WebGPU supported |
| Edge | 113+ | Full WebGPU support |

**Fallback**: All browsers with WebGL2 support get WebGL2 renderer.

### Performance Constraints

- **Draw Calls**: Maximum 100 per frame
- **Frame Rate**: Target 60fps on mid-range hardware
- **Load Time**: <5 seconds on broadband
- **Memory**: Stable heap usage (no leaks)
- **VRAM**: Optimized with KTX2 textures

### Asset Constraints

| Asset Type | Format | Compression |
|------------|--------|-------------|
| Models | glTF 2.0 | Draco (90-95% reduction) |
| Textures | KTX2 | UASTC/ETC1S (10x VRAM reduction) |
| Audio | Ogg Vorbis | Variable bitrate |
| Code | ES modules | Tree-shaking, minification |

## Dependencies

### Production Dependencies

```json
{
  "three": "^0.171.0",
  "three-mesh-bvh": "^0.7.0",
  "postprocessing": "^6.33.0"
}
```

### Development Dependencies

```json
{
  "vite": "^5.0.0",
  "eslint": "^8.55.0",
  "prettier": "^3.1.0"
}
```

### Optional Enhancements

- **Stats.js**: Performance monitoring overlay
- **lil-gui**: Debug UI for development
- **tweakpane**: Advanced debug controls

## Tool Usage Patterns

### Vite Configuration

```javascript
// vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          vendor: ['three-mesh-bvh', 'postprocessing']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  },
  assetsInclude: ['**/*.gltf', '**/*.glb', '**/*.ktx2']
});
```

### ESLint Configuration

```javascript
// .eslintrc.js
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
    'prefer-const': 'error'
  }
};
```

### Import Patterns

```javascript
// Three.js core
import * as THREE from 'three';

// Three.js addons
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// External libraries
import { MeshBVH } from 'three-mesh-bvh';

// Project modules
import { GameController } from './game.js';
import { config } from './config.js';
```

## File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Modules | kebab-case | `scene-manager.js` |
| Classes | PascalCase | `GameController` |
| Constants | UPPER_SNAKE_CASE | `MAX_DRAW_CALLS` |
| Private methods | _camelCase | `_updateInternal()` |
| Test files | *.test.js | `player.test.js` |

## Git Workflow

```bash
# Feature branch workflow
git checkout -b feature/player-controller
# ... make changes ...
git add .
git commit -m "feat: implement FPS camera controller"
git push origin feature/player-controller
# Create PR, review, merge
```

### .gitignore Template

```
# Dependencies
node_modules/

# Build output
dist/
*.tgz

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/

# Cache
.cache/
.parcel-cache/
```

## Debugging Patterns

### Performance Monitoring

```javascript
// Enable stats overlay
import Stats from 'three/addons/libs/stats.module.js';
const stats = new Stats();
document.body.appendChild(stats.dom);

// Monitor draw calls
console.log('Draw calls:', renderer.info.render.calls);
console.log('Triangles:', renderer.info.render.triangles);

// Memory monitoring
console.log('Geometries:', renderer.info.memory.geometries);
console.log('Textures:', renderer.info.memory.textures);
```

### Debug UI

```javascript
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

const gui = new GUI();
const folder = gui.addFolder('Player Settings');
folder.add(player, 'speed', 0, 20);
folder.add(player, 'jumpForce', 0, 20);
```
