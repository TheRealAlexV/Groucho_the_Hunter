# Three.js Patterns: Groucho the Hunter

## When This Applies

These rules apply when:
- Working with Three.js rendering, scenes, or objects
- Implementing WebGPU/WebGL rendering
- Managing 3D assets and geometries
- Optimizing performance
- Handling memory management and disposal
- Creating shaders or materials

## Rendering Setup

### 1. Renderer Initialization

Always implement WebGPU with WebGL2 fallback:

```javascript
// src/core/Renderer.js
import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';

export class GameRenderer {
  async initialize() {
    // Attempt WebGPU first
    try {
      this.renderer = new WebGPURenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
      });
      await this.renderer.init();
      this.isWebGPU = this.renderer.isWebGPUBackend;
    } catch (e) {
      console.warn('WebGPU failed, falling back to WebGL2');
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.isWebGPU = false;
    }
    
    // Standard configuration
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;
    
    return this.renderer;
  }
}
```

### 2. Scene Graph Best Practices

- Group related objects using `THREE.Group`
- Use meaningful names for debugging: `mesh.name = 'Player_Weapon'`
- Enable matrix auto-update only for dynamic objects
- Frustum culling is automatic, but help it with proper bounding boxes

```javascript
// GOOD - Organized hierarchy
const playerGroup = new THREE.Group();
playerGroup.name = 'Player';

const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
body.name = 'Player_Body';
playerGroup.add(body);

const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
weapon.name = 'Player_Weapon';
playerGroup.add(weapon);

scene.add(playerGroup);

// Disable matrix auto-update for static objects
staticBuilding.matrixAutoUpdate = false;
staticBuilding.updateMatrix();
```

### 3. Camera Configuration

FPS camera settings:
```javascript
const camera = new THREE.PerspectiveCamera(
  75,                                    // FOV
  window.innerWidth / window.innerHeight, // Aspect
  0.1,                                   // Near plane
  1000                                   // Far plane
);

camera.position.set(0, 1.8, 0); // Player eye level
```

### 4. Lighting Setup

Standard lighting configuration:
```javascript
// Ambient light (base illumination)
const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
scene.add(ambientLight);

// Directional light with shadows (sun/main light)
const dirLight = new THREE.DirectionalLight(0xffffff, 1);
dirLight.position.set(50, 100, 50);
dirLight.castShadow = true;

// Shadow optimization
dirLight.shadow.mapSize.width = 2048;
dirLight.shadow.mapSize.height = 2048;
dirLight.shadow.camera.near = 0.5;
dirLight.shadow.camera.far = 500;
dirLight.shadow.bias = -0.001;
scene.add(dirLight);

// Point lights for dynamic lighting (limit to <10)
const pointLight = new THREE.PointLight(0xffaa00, 1, 20);
pointLight.position.set(x, y, z);
scene.add(pointLight);
```

## Memory Management

### 1. Disposal Rules

Always dispose Three.js objects to prevent memory leaks:

```javascript
class GameObject {
  dispose() {
    // Dispose geometry
    if (this.mesh.geometry) {
      this.mesh.geometry.dispose();
    }
    
    // Dispose material(s)
    if (this.mesh.material) {
      if (Array.isArray(this.mesh.material)) {
        this.mesh.material.forEach(m => this.disposeMaterial(m));
      } else {
        this.disposeMaterial(this.mesh.material);
      }
    }
    
    // Remove from scene
    this.mesh.parent?.remove(this.mesh);
    
    // Dispose textures
    this.textures.forEach(texture => texture.dispose());
  }
  
  disposeMaterial(material) {
    // Dispose textures used by material
    Object.keys(material).forEach(key => {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    });
    material.dispose();
  }
}
```

### 2. Texture Management

- Use power-of-2 texture dimensions
- Compress textures with KTX2 format (10x VRAM reduction)
- Use texture atlases for UI elements
- Set appropriate wrap modes and filters

```javascript
// GOOD - Proper texture configuration
const texture = loader.load('texture.ktx2');
texture.wrapS = THREE.RepeatWrapping;
texture.wrapT = THREE.RepeatWrapping;
texture.minFilter = THREE.LinearMipMapLinearFilter;
texture.magFilter = THREE.Linear;
texture.anisotropy = renderer.capabilities.getMaxAnisotropy();

// BAD - Default settings waste memory
const texture = loader.load('huge_texture.png'); // No compression
```

### 3. Geometry Reuse

- Reuse geometries for identical objects
- Use InstancedMesh for repeated objects (grass, particles)
- Merge static geometries when possible

```javascript
// GOOD - Geometry reuse
const sharedGeometry = new THREE.BoxGeometry(1, 1, 1);
const enemies = [];
for (let i = 0; i < 50; i++) {
  const enemy = new THREE.Mesh(sharedGeometry, enemyMaterial);
  enemies.push(enemy);
}

// GOOD - InstancedMesh for many identical objects
const count = 1000;
const instancedMesh = new THREE.InstancedMesh(grassGeometry, grassMaterial, count);
// Set matrices for each instance...
```

## Performance Optimization

### 1. Draw Call Optimization

Target: <100 draw calls per frame

```javascript
// BAD - 100 draw calls
for (let i = 0; i < 100; i++) {
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
}

// GOOD - 1 draw call
const instancedMesh = new THREE.InstancedMesh(geometry, material, 100);
scene.add(instancedMesh);
```

Techniques:
- Use `BatchedMesh` (Three.js r151+) for dynamic merging
- Use `InstancedMesh` for many identical objects
- Use texture atlases to reduce material count
- Merge static level geometry

### 2. LOD (Level of Detail)

Implement LOD for complex models:

```javascript
import { LOD } from 'three';

const lod = new THREE.LOD();

// High detail (close)
lod.addLevel(highDetailMesh, 0);

// Medium detail
lod.addLevel(mediumDetailMesh, 20);

// Low detail (far)
lod.addLevel(lowDetailMesh, 50);

scene.add(lod);
```

### 3. Shadow Optimization

- Use PCFSoftShadowMap for softer shadows
- Limit shadow casters to important objects
- Adjust shadow camera frustum tightly
- Use shadow bias to prevent artifacts

```javascript
// Only important objects cast shadows
player.castShadow = true;
enemy.castShadow = true;
staticBuilding.castShadow = true;

// Small objects don't need shadows
particleEffect.castShadow = false;
smallRock.castShadow = false;
```

### 4. BVH Collision Optimization

Use three-mesh-bvh for fast raycasting:

```javascript
import { MeshBVH, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

// Build BVH for static level geometry
levelGeometry.computeBoundsTree();

// Raycasting against BVH
const raycaster = new THREE.Raycaster();
raycaster.firstHitOnly = true; // Optimization: stop at first hit

const intersects = raycaster.intersectBVH(levelGeometry, rayOrigin, rayDirection);
```

### 5. Animation Loop Best Practices

```javascript
class GameLoop {
  constructor() {
    this.clock = new THREE.Clock();
    this.targetFPS = 60;
    this.frameInterval = 1 / this.targetFPS;
    this.accumulator = 0;
  }
  
  tick() {
    requestAnimationFrame(() => this.tick());
    
    const deltaTime = Math.min(this.clock.getDelta(), 0.1); // Cap at 100ms
    this.accumulator += deltaTime;
    
    // Fixed timestep physics updates
    while (this.accumulator >= this.frameInterval) {
      this.physicsUpdate(this.frameInterval);
      this.accumulator -= this.frameInterval;
    }
    
    // Variable timestep for rendering
    this.renderUpdate(deltaTime);
    this.renderer.render(scene, camera);
  }
}
```

## Material and Shader Patterns

### 1. Material Reuse

- Create material libraries for consistent look
- Clone materials when variations are needed
- Use ShaderMaterial sparingly (prefer built-in materials)

```javascript
// src/materials/MaterialLibrary.js
export const Materials = {
  player: new THREE.MeshStandardMaterial({ 
    color: 0x00ff00,
    roughness: 0.5,
    metalness: 0.1
  }),
  
  threat: new THREE.MeshStandardMaterial({ 
    color: 0xff0000,
    emissive: 0x330000,
    roughness: 0.3
  }),
  
  environment: new THREE.MeshStandardMaterial({ 
    color: 0x888888,
    roughness: 0.8
  })
};

// Clone for variation
const blueThreat = Materials.threat.clone();
blueThreat.color.setHex(0x0000ff);
```

### 2. Shader Includes (TSL)

When using Three Shader Language (TSL) for WebGPU:

```javascript
import { positionLocal, color, uniform } from 'three/tsl';

// Reusable shader functions
const pulseEffect = (position, time) => {
  return position.add(
    positionLocal.normalize().mul(
      Math.sin(time.mul(5)).mul(0.1)
    )
  );
};
```

## Asset Loading

### 1. GLTF Loading

```javascript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';

const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');

const gltfLoader = new GLTFLoader();
gltfLoader.setDRACOLoader(dracoLoader);

// Load with async/await
async function loadModel(url) {
  return new Promise((resolve, reject) => {
    gltfLoader.load(url, resolve, undefined, reject);
  });
}
```

### 2. Asset Caching

```javascript
class AssetCache {
  #cache = new Map();
  
  async get(url) {
    if (this.#cache.has(url)) {
      return this.#cache.get(url).clone();
    }
    
    const asset = await this.load(url);
    this.#cache.set(url, asset);
    return asset.clone();
  }
  
  dispose() {
    this.#cache.forEach(asset => {
      // Dispose based on asset type
      if (asset.geometry) asset.geometry.dispose();
      if (asset.material) asset.material.dispose();
    });
    this.#cache.clear();
  }
}
```

## Debugging

### 1. Performance Monitoring

```javascript
import Stats from 'three/addons/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

function animate() {
  stats.begin();
  // ... rendering ...
  stats.end();
  requestAnimationFrame(animate);
}

// Monitor draw calls
console.log('Draw calls:', renderer.info.render.calls);
console.log('Triangles:', renderer.info.render.triangles);
console.log('Geometries:', renderer.info.memory.geometries);
console.log('Textures:', renderer.info.memory.textures);
```

### 2. Debug Helpers

```javascript
// Bounding boxes
const box = new THREE.BoxHelper(mesh, 0xffff00);
scene.add(box);

// Normals
import { VertexNormalsHelper } from 'three/addons/helpers/VertexNormalsHelper.js';
const normals = new VertexNormalsHelper(mesh, 0.5, 0x00ff00);
scene.add(normals);

// Grid
const grid = new THREE.GridHelper(100, 100, 0xff0000, 0x444444);
scene.add(grid);

// Axes
const axes = new THREE.AxesHelper(5);
scene.add(axes);
```

## References

- See [`Docs/TechnicalDesign.md`](Docs/TechnicalDesign.md) Sections 2, 5
- See [`Docs/research.md`](Docs/research.md) for Three.js research
- See [`.kilocode/rules/memory-bank/tech.md`](memory-bank/tech.md) for rendering specs
- Three.js Documentation: https://threejs.org/docs/
- three-mesh-bvh: https://github.com/gkjohnson/three-mesh-bvh
