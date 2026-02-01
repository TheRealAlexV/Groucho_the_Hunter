# Implementation Plan: Groucho the Hunter

> **Comprehensive development roadmap and deployment strategy for the Three.js cybersecurity FPS/adventure game**

---

## Document Information

| Attribute | Value |
|-----------|-------|
| **Project** | Groucho the Hunter |
| **Version** | 1.0 |
| **Date** | 2026-02-01 |
| **Engine** | Three.js r171+ |
| **Build Tool** | Vite 5.x |
| **Target Platform** | Modern Web Browsers (WebGPU/WebGL2) |

---

## Table of Contents

1. [Phased Development Roadmap](#1-phased-development-roadmap)
2. [File Creation Checklist](#2-file-creation-checklist)
3. [Dependencies](#3-dependencies)
4. [Docker Deployment](#4-docker-deployment)

---

## 1. Phased Development Roadmap

### Overview

The development of **Groucho the Hunter** is organized into **4 major phases** spanning **12 weeks**. Each phase builds upon the previous, delivering incremental value while maintaining a playable product at every milestone.

```
Weeks:  1-3        4-6         7-9        10-12
        ├──────────┼───────────┼──────────┤
        │ Phase 1  │  Phase 2  │ Phase 3  │ Phase 4
        │  Core    │  First    │ Advanced │  Final
        │ Engine   │  Level    │ Systems  │ Polish
        └──────────┴───────────┴──────────┘
```

---

### Phase 1: Project Setup & Core Engine (Weeks 1-3)

**Goal**: Establish the technical foundation with a working FPS framework.

**Week 1: Project Initialization**
- Initialize Vite project with Three.js
- Set up folder structure per Technical Design
- Configure build pipeline and development server
- Set up linting (ESLint) and formatting (Prettier)
- Initialize Git repository with `.gitignore`

**Week 2: Renderer & Scene Management**
- Implement WebGPU renderer with WebGL2 fallback
- Create scene manager for level loading/unloading
- Set up basic lighting system with CSM shadows
- Implement performance monitoring system
- Create loading screen component

**Week 3: Player Controller & Physics**
- Integrate PointerLockControls for FPS camera
- Implement WASD movement with collision detection
- Add sprint mechanics with stamina system
- Implement jump physics with gravity
- Create input manager with key binding support

**Phase 1 Deliverables:**
- [ ] Playable test level (simple room)
- [ ] Smooth FPS movement without clipping
- [ ] 60fps performance on target hardware
- [ ] Clean, extensible code structure

**Key Technical Challenges:**
- WebGPU initialization with graceful fallback
- Collision detection performance with three-mesh-bvh
- Frame-rate independent movement physics

---

### Phase 2: First Level & Basic Puzzles (Weeks 4-6)

**Goal**: Create Level 1 (The Outskirts) with working puzzles and first boss encounter.

**Week 4: Level 1 Environment**
- Build "The Outskirts" 3D environment
  - Sheriff's Station (tutorial zone)
  - Email Corral
  - Password Saloon
  - USB Gulch
- Create environmental assets (server cabins, data rivers)
- Implement interactive object system
- Add NPC dialogue system for Groucho

**Week 5: Basic Puzzles**
- **Log Analysis Terminal**: Parse logs to identify attack patterns
  - Timestamped event display
  - Click-to-highlight suspicious entries
  - Timeline visualization
- **Phishing Hunt**: Spot visual indicators of phishing
  - Email inspection interface
  - Suspicious element highlighting
- **USB Drop**: Find and analyze malicious USB drives
  - File analysis mini-game
  - Signature matching mechanics
- Implement puzzle UI overlay system

**Week 6: Boss Fight & Progression**
- Create **Spamford** boss entity
  - Multi-phase encounter
  - Spam filtering mechanics
  - Visual/audio effects
- Implement XP and leveling system
- Create tool unlock progression
- Add save/load with localStorage
- Polish Level 1 flow and transitions

**Phase 2 Deliverables:**
- [ ] Complete Level 1 playable from start to finish
- [ ] 3 working puzzle types
- [ ] Boss fight with Spamford
- [ ] Progression saves correctly
- [ ] Tutorial system functional

**Key Technical Challenges:**
- Puzzle UI overlay without breaking immersion
- Boss AI state machine
- Save game data serialization

---

### Phase 3: Advanced Systems (Weeks 7-9)

**Goal**: Build Levels 2-3 with advanced puzzles and enemy types.

**Week 7: Level 2 - The SOC**
- Build Security Operations Center environment
  - Monitoring Floor with analyst stations
  - Server Room maze
  - Network Visualization Chamber
  - Command Center
- Create enemy types: Brute Forcers, Worms, DDoS Swarm
- **SIEM Triage Puzzle**: Sort and prioritize alerts
- **Log Timeline Puzzle**: Reconstruct attack sequences

**Week 8: Level 3 - The Deep Net**
- Build Deep Net underground environment
  - Dark corridors with flickering lights
  - Abandoned server rooms
  - Malware Laboratory
  - Covert Channel Tunnels
- Create advanced enemies: Rootkits, Backdoors, C2 Beacons
- **Hypothesis Formation Puzzle**: Develop hunting theories
- **Persistence Hunt Puzzle**: Find hidden backdoors
- **Memory Forensics Puzzle**: Analyze RAM dumps

**Week 9: Bosses & Tools**
- Implement **DeeDee O.S.** boss (Level 2)
  - DDoS swarm mechanics
  - Traffic filtering challenge
- Implement **ShadowStep APT** boss (Level 3)
  - Multi-stage incident response
  - Detection → Containment → Eradication → Recovery
- Add advanced tools:
  - Memory Forensics Kit
  - Malware Sandbox
  - Threat Intelligence Portal
- Tool progression UI

**Phase 3 Deliverables:**
- [ ] Level 2 (The SOC) complete
- [ ] Level 3 (The Deep Net) complete
- [ ] 6 total puzzle types implemented
- [ ] 2 boss encounters functional
- [ ] All advanced tools unlocked

**Key Technical Challenges:**
- Complex level geometry performance
- Multi-stage boss state machines
- Advanced puzzle UI complexity

---

### Phase 4: Final Level & Polish (Weeks 10-12)

**Goal**: Complete Level 4, add audio, polish, and optimize for deployment.

**Week 10: Level 4 - The Core War**
- Build massive-scale Core environment
  - Global Command Center
  - Power Grid Sector
  - Financial District
  - Communication Nexus
  - Zero-Day Vault
- Create elite enemies: Zero-Day Exploits, Supply Chain threats
- **Supply Chain Poisoning Puzzle**: Identify compromised software
- **Zero-Day Analysis Puzzle**: Reverse engineer unknown exploits
- **Crisis Management Puzzle**: Resource allocation under pressure

**Week 11: Audio & Visual Polish**
- Implement **The Architect** final boss
  - Ultimate test combining all mechanics
  - Multi-phase epic encounter
- Add 3D spatial audio system
  - Ambient server room sounds
  - Spatial threat audio cues
  - Interactive SFX
- Compose/procure background music
  - Exploration tracks (60-80 BPM)
  - Puzzle tracks (minimal beats)
  - Threat tracks (120+ BPM)
- Add post-processing effects
  - Bloom for active elements
  - Vignette for cinematic framing
  - Chromatic aberration for corruption effects
  - Fog for depth

**Week 12: Optimization & Deployment**
- Performance optimization pass
  - Reduce draw calls to < 100
  - Implement LOD system
  - Optimize shadow maps
- Asset optimization
  - Compress models with Draco (90-95% reduction)
  - Compress textures with KTX2 (10x VRAM reduction)
- Create Dockerfile and nginx configuration
- Build and test Docker deployment
- Write deployment documentation
- Final bug fixes and polish

**Phase 4 Deliverables:**
- [ ] Level 4 (The Core War) complete
- [ ] Final boss: The Architect
- [ ] Full audio implementation
- [ ] Post-processing effects
- [ ] Optimized 60fps performance
- [ ] Docker deployment ready
- [ ] Complete documentation

**Key Technical Challenges:**
- Massive-scale level performance
- Complex multi-phase boss synchronization
- Audio mixing and spatial positioning
- Final optimization pass

---

## 2. File Creation Checklist

### Phase 1 Files (Weeks 1-3)

#### Configuration Files
| File | Path | Purpose |
|------|------|---------|
| package.json | `/package.json` | Dependencies and scripts |
| vite.config.js | `/vite.config.js` | Build configuration |
| .gitignore | `/.gitignore` | Git exclusions |
| .eslintrc.js | `/.eslintrc.js` | Linting rules |
| .prettierrc | `/.prettierrc` | Formatting rules |

#### Core Engine Files
| File | Path | Purpose |
|------|------|---------|
| Game.js | `/src/core/Game.js` | Main game controller |
| Renderer.js | `/src/core/Renderer.js` | WebGPU/WebGL setup |
| SceneManager.js | `/src/core/SceneManager.js` | Scene loading/unloading |
| GameLoop.js | `/src/core/GameLoop.js` | Frame update loop |

#### Player System Files
| File | Path | Purpose |
|------|------|---------|
| Player.js | `/src/player/Player.js` | Player state and logic |
| Camera.js | `/src/player/Camera.js` | FPS camera with collision |
| Controls.js | `/src/player/Controls.js` | Input handling |
| Movement.js | `/src/player/Movement.js` | Physics and movement |

#### System Files
| File | Path | Purpose |
|------|------|---------|
| InputManager.js | `/src/systems/InputManager.js` | Keyboard/mouse input |
| StateManager.js | `/src/systems/StateManager.js` | Game state machine |
| CollisionSystem.js | `/src/systems/CollisionSystem.js` | BVH raycasting |
| PerformanceMonitor.js | `/src/systems/PerformanceMonitor.js` | FPS/statistics |
| AudioManager.js | `/src/systems/AudioManager.js` | Spatial audio |

#### Utility Files
| File | Path | Purpose |
|------|------|---------|
| EventBus.js | `/src/utils/EventBus.js` | Event system |
| MathUtils.js | `/src/utils/MathUtils.js` | Math helpers |
| Storage.js | `/src/utils/Storage.js` | localStorage wrapper |
| Constants.js | `/src/utils/Constants.js` | Game constants |

#### Entry Point
| File | Path | Purpose |
|------|------|---------|
| index.html | `/index.html` | HTML entry point |
| main.js | `/src/main.js` | JavaScript entry point |
| style.css | `/src/style.css` | Global styles |

---

### Phase 2 Files (Weeks 4-6)

#### World/Level Files
| File | Path | Purpose |
|------|------|---------|
| Level.js | `/src/world/Level.js` | Base level class |
| Level1_Outskirts.js | `/src/world/levels/Level1_Outskirts.js` | Level 1 implementation |
| Environment.js | `/src/world/Environment.js` | Static world geometry |
| Interactable.js | `/src/world/Interactable.js` | Base interactable class |
| InteractableFactory.js | `/src/world/InteractableFactory.js` | Object creation |

#### Entity Component System
| File | Path | Purpose |
|------|------|---------|
| Entity.js | `/src/ecs/Entity.js` | Base entity |
| Component.js | `/src/ecs/Component.js` | Base component |
| EntityManager.js | `/src/ecs/EntityManager.js` | Entity lifecycle |
| components/Transform.js | `/src/ecs/components/Transform.js` | Position/rotation/scale |
| components/MeshRenderer.js | `/src/ecs/components/MeshRenderer.js` | 3D mesh |
| components/Collider.js | `/src/ecs/components/Collider.js` | Collision bounds |
| components/AudioSource.js | `/src/ecs/components/AudioSource.js` | Sound emitter |

#### Puzzle Files
| File | Path | Purpose |
|------|------|---------|
| PuzzleBase.js | `/src/puzzles/PuzzleBase.js` | Base puzzle class |
| LogAnalysisPuzzle.js | `/src/puzzles/LogAnalysisPuzzle.js` | Log analysis mini-game |
| PhishingHuntPuzzle.js | `/src/puzzles/PhishingHuntPuzzle.js` | Phishing detection |
| USBAnalysisPuzzle.js | `/src/puzzles/USBAnalysisPuzzle.js` | USB drop puzzle |
| PuzzleManager.js | `/src/puzzles/PuzzleManager.js` | Puzzle state handling |

#### Boss Files
| File | Path | Purpose |
|------|------|---------|
| BossBase.js | `/src/bosses/BossBase.js` | Base boss class |
| SpamfordBoss.js | `/src/bosses/SpamfordBoss.js` | Level 1 boss |
| BossAI.js | `/src/bosses/BossAI.js` | AI state machine |

#### Tool System Files
| File | Path | Purpose |
|------|------|---------|
| Tool.js | `/src/tools/Tool.js` | Base tool class |
| BasicScanner.js | `/src/tools/BasicScanner.js` | Scanner tool |
| ToolManager.js | `/src/tools/ToolManager.js` | Tool inventory |

#### Progression Files
| File | Path | Purpose |
|------|------|---------|
| ProgressionSystem.js | `/src/progression/ProgressionSystem.js` | XP/leveling |
| AchievementSystem.js | `/src/progression/AchievementSystem.js` | Achievements |
| SaveManager.js | `/src/progression/SaveManager.js` | Game saves |

#### UI Files
| File | Path | Purpose |
|------|------|---------|
| HUD.js | `/src/ui/HUD.js` | Heads-up display |
| Crosshair.js | `/src/ui/Crosshair.js` | Aiming reticle |
| PuzzleUI.js | `/src/ui/PuzzleUI.js` | Puzzle interface overlay |
| LoadingScreen.js | `/src/ui/LoadingScreen.js` | Loading indicator |
| MainMenu.js | `/src/ui/menus/MainMenu.js` | Main menu |
| PauseMenu.js | `/src/ui/menus/PauseMenu.js` | Pause menu |
| ToolWheel.js | `/src/ui/ToolWheel.js` | Tool selector |
| XPBar.js | `/src/ui/XPBar.js` | Experience display |
| DialogueBox.js | `/src/ui/DialogueBox.js` | NPC dialogue |

#### Dialogue Files
| File | Path | Purpose |
|------|------|---------|
| DialogueSystem.js | `/src/dialogue/DialogueSystem.js` | Dialogue manager |
| Level1_Dialogue.json | `/src/dialogue/data/Level1_Dialogue.json` | Level 1 script |
| Groucho_Lines.json | `/src/dialogue/data/Groucho_Lines.json` | Character lines |

---

### Phase 3 Files (Weeks 7-9)

#### Level Files
| File | Path | Purpose |
|------|------|---------|
| Level2_SOC.js | `/src/world/levels/Level2_SOC.js` | Level 2 implementation |
| Level3_DeepNet.js | `/src/world/levels/Level3_DeepNet.js` | Level 3 implementation |
| SOC_Environment.js | `/src/world/environments/SOC_Environment.js` | SOC geometry |
| DeepNet_Environment.js | `/src/world/environments/DeepNet_Environment.js` | Deep Net geometry |

#### Additional Puzzle Files
| File | Path | Purpose |
|------|------|---------|
| SIEMTriagePuzzle.js | `/src/puzzles/SIEMTriagePuzzle.js` | Alert sorting |
| LogTimelinePuzzle.js | `/src/puzzles/LogTimelinePuzzle.js` | Event ordering |
| NetworkMapPuzzle.js | `/src/puzzles/NetworkMapPuzzle.js` | Traffic tracing |
| HypothesisPuzzle.js | `/src/puzzles/HypothesisPuzzle.js` | Hypothesis formation |
| PersistenceHuntPuzzle.js | `/src/puzzles/PersistenceHuntPuzzle.js` | Backdoor finding |
| LateralMovementPuzzle.js | `/src/puzzles/LateralMovementPuzzle.js` | Path tracing |
| C2DetectionPuzzle.js | `/src/puzzles/C2DetectionPuzzle.js` | Beacon detection |
| MemoryForensicsPuzzle.js | `/src/puzzles/MemoryForensicsPuzzle.js` | RAM analysis |

#### Boss Files
| File | Path | Purpose |
|------|------|---------|
| DeeDeeBoss.js | `/src/bosses/DeeDeeBoss.js` | Level 2 boss |
| ShadowStepBoss.js | `/src/bosses/ShadowStepBoss.js` | Level 3 boss |

#### Enemy/Threat Files
| File | Path | Purpose |
|------|------|---------|
| ThreatBase.js | `/src/threats/ThreatBase.js` | Base threat class |
| PhisherEnemy.js | `/src/threats/PhisherEnemy.js` | Email threats |
| BruteForcerEnemy.js | `/src/threats/BruteForcerEnemy.js` | Brute force |
| WormEnemy.js | `/src/threats/WormEnemy.js` | Self-replicating |
| RootkitEnemy.js | `/src/threats/RootkitEnemy.js` | Hidden threats |
| ThreatSpawner.js | `/src/threats/ThreatSpawner.js` | Enemy spawning |

#### Additional Tool Files
| File | Path | Purpose |
|------|------|---------|
| LogAnalyzer.js | `/src/tools/LogAnalyzer.js` | Log reading tool |
| NetworkSniffer.js | `/src/tools/NetworkSniffer.js` | Traffic analyzer |
| MemoryForensicsKit.js | `/src/tools/MemoryForensicsKit.js` | Memory tool |
| MalwareSandbox.js | `/src/tools/MalwareSandbox.js` | Sandbox tool |
| ThreatIntelPortal.js | `/src/tools/ThreatIntelPortal.js` | Intel database |
| AdvancedScanner.js | `/src/tools/AdvancedScanner.js` | Rootkit scanner |

#### Data Files
| File | Path | Purpose |
|------|------|---------|
| PuzzleData_L2.json | `/src/data/PuzzleData_L2.json` | Level 2 puzzles |
| PuzzleData_L3.json | `/src/data/PuzzleData_L3.json` | Level 3 puzzles |
| ThreatDatabase.json | `/src/data/ThreatDatabase.json` | Threat reference |

---

### Phase 4 Files (Weeks 10-12)

#### Level Files
| File | Path | Purpose |
|------|------|---------|
| Level4_CoreWar.js | `/src/world/levels/Level4_CoreWar.js` | Level 4 implementation |
| Core_Environment.js | `/src/world/environments/Core_Environment.js` | Core geometry |

#### Final Puzzle Files
| File | Path | Purpose |
|------|------|---------|
| SupplyChainPuzzle.js | `/src/puzzles/SupplyChainPuzzle.js` | Supply chain |
| ZeroDayPuzzle.js | `/src/puzzles/ZeroDayPuzzle.js` | Zero-day analysis |
| CrisisManagementPuzzle.js | `/src/puzzles/CrisisManagementPuzzle.js` | Resource allocation |
| MultiTenantPuzzle.js | `/src/puzzles/MultiTenantPuzzle.js` | Cross-org response |
| InsiderThreatPuzzle.js | `/src/puzzles/InsiderThreatPuzzle.js` | Insider detection |

#### Boss Files
| File | Path | Purpose |
|------|------|---------|
| ArchitectBoss.js | `/src/bosses/ArchitectBoss.js` | Final boss |

#### Additional Tool Files
| File | Path | Purpose |
|------|------|---------|
| ReverseEngineeringSuite.js | `/src/tools/ReverseEngineeringSuite.js` | RE tool |
| AttributionDatabase.js | `/src/tools/AttributionDatabase.js` | Threat actor DB |
| CrisisDashboard.js | `/src/tools/CrisisDashboard.js` | Crisis tool |

#### Audio Files
| File | Path | Purpose |
|------|------|---------|
| AudioLibrary.js | `/src/audio/AudioLibrary.js` | Sound registry |
| MusicManager.js | `/src/audio/MusicManager.js` | BGM controller |
| SFXManager.js | `/src/audio/SFXManager.js` | Sound effects |

#### Post-Processing Files
| File | Path | Purpose |
|------|------|---------|
| PostProcessing.js | `/src/postprocessing/PostProcessing.js` | Effect pipeline |
| EffectConfigs.js | `/src/postprocessing/EffectConfigs.js` | Level presets |

#### Asset Pipeline
| File | Path | Purpose |
|------|------|---------|
| AssetLoader.js | `/src/assets/AssetLoader.js` | Loading manager |
| AssetCache.js | `/src/assets/AssetCache.js` | Asset storage |
| DracoLoader.js | `/src/assets/DracoLoader.js` | Geometry loader |
| KTX2Loader.js | `/src/assets/KTX2Loader.js` | Texture loader |
| LODSystem.js | `/src/assets/LODSystem.js` | LOD manager |

#### Final UI Components
| File | Path | Purpose |
|------|------|---------|
| CreditsScreen.js | `/src/ui/CreditsScreen.js` | End credits |
| VictoryScreen.js | `/src/ui/VictoryScreen.js` | Win screen |
| OptionsMenu.js | `/src/ui/menus/OptionsMenu.js` | Settings |
| AudioSettings.js | `/src/ui/menus/AudioSettings.js` | Audio config |
| GraphicsSettings.js | `/src/ui/menus/GraphicsSettings.js` | Graphics config |

---

### Asset Files (All Phases)

#### 3D Models (GLB/GLTF with Draco)
| Asset | Path | Phase |
|-------|------|-------|
| Groucho_Model.glb | `/assets/models/characters/Groucho_Model.glb` | 2 |
| Sheriff_Station.glb | `/assets/models/environments/Sheriff_Station.glb` | 2 |
| Server_Rack.glb | `/assets/models/props/Server_Rack.glb` | 2 |
| Terminal.glb | `/assets/models/props/Terminal.glb` | 2 |
| SOC_Environment.glb | `/assets/models/environments/SOC_Environment.glb` | 3 |
| DeepNet_Environment.glb | `/assets/models/environments/DeepNet_Environment.glb` | 3 |
| Core_Environment.glb | `/assets/models/environments/Core_Environment.glb` | 4 |
| Threat_Models.glb | `/assets/models/characters/Threat_Models.glb` | 2-4 |

#### Textures (KTX2)
| Asset | Path | Phase |
|-------|------|-------|
| Groucho_Textures.ktx2 | `/assets/textures/characters/Groucho_Textures.ktx2` | 2 |
| Environment_Textures.ktx2 | `/assets/textures/environments/Environment_Textures.ktx2` | 2 |
| UI_Icons.png | `/assets/textures/ui/UI_Icons.png` | 2 |
| Lightmaps.ktx2 | `/assets/textures/lightmaps/Lightmaps.ktx2` | 2-4 |

#### Audio (OGG/MP3)
| Asset | Path | Phase |
|-------|------|-------|
| ambient_server_room.ogg | `/assets/audio/ambient/ambient_server_room.ogg` | 4 |
| music_exploration.ogg | `/assets/audio/music/music_exploration.ogg` | 4 |
| music_puzzle.ogg | `/assets/audio/music/music_puzzle.ogg` | 4 |
| music_threat.ogg | `/assets/audio/music/music_threat.ogg` | 4 |
| sfx_scanner.ogg | `/assets/audio/sfx/sfx_scanner.ogg` | 2 |
| sfx_puzzle_success.ogg | `/assets/audio/sfx/sfx_puzzle_success.ogg` | 2 |
| sfx_alert.ogg | `/assets/audio/sfx/sfx_alert.ogg` | 2 |
| vo_groucho_*.ogg | `/assets/audio/voice/vo_groucho_*.ogg` | 2-4 |

---

## 3. Dependencies

### Core Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| three | ^0.171.0 | 3D rendering engine (WebGPU/WebGL) |
| @three-tsl/stdlib | ^0.171.0 | TSL shader language support |

### Three.js Addons (from examples/jsm)

These are included with Three.js and imported from `three/addons/`:

| Addon | Purpose |
|-------|---------|
| PointerLockControls | FPS camera controls |
| GLTFLoader | 3D model loading |
| DRACOLoader | Draco-compressed geometry |
| KTX2Loader | KTX2-compressed textures |
| CSM | Cascaded Shadow Maps |
| BatchedMesh | Geometry batching |
| Raycaster | Collision detection |

### Build & Development Tools

| Package | Version | Purpose |
|---------|---------|---------|
| vite | ^5.4.0 | Build tool and dev server |
| eslint | ^8.57.0 | JavaScript linting |
| prettier | ^3.3.0 | Code formatting |
| @vitejs/plugin-basic-ssl | ^1.1.0 | HTTPS for local development |

### Optional Performance Libraries

| Package | Version | Purpose |
|---------|---------|---------|
| three-mesh-bvh | ^0.8.0 | Accelerated raycasting/collision |
| postprocessing | ^6.36.0 | Post-processing effects |

### Development Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| @types/three | ^0.171.0 | TypeScript definitions |
| gh-pages | ^6.1.0 | GitHub Pages deployment |

---

### Installation Commands

```bash
# Initialize project
npm create vite@latest groucho-the-hunter -- --template vanilla

# Install core dependencies
npm install three @three-tsl/stdlib

# Install build tools (if not included)
npm install -D vite eslint prettier

# Install optional performance libraries
npm install three-mesh-bvh postprocessing

# Install TypeScript definitions
npm install -D @types/three
```

---

## 4. Docker Deployment

See the following files in the project root:
- [`Dockerfile`](../Dockerfile) - Multi-stage Docker build
- [`docker-compose.yml`](../docker-compose.yml) - Container orchestration
- [`.dockerignore`](../.dockerignore) - Build exclusions
- [`nginx.conf`](../nginx.conf) - Web server configuration

### Quick Start

```bash
# Build and run with Docker
docker-compose up --build

# Access game at http://localhost:8080
```

---

## Appendix: Technology Stack Summary

| Layer | Technology |
|-------|------------|
| **Rendering** | Three.js r171+ (WebGPU/WebGL2) |
| **Physics** | three-mesh-bvh + Custom Raycasting |
| **Audio** | Three.js Audio + Web Audio API |
| **State** | Custom Event-Driven System |
| **Build** | Vite 5.x |
| **Container** | Docker + nginx |
| **Input** | Pointer Lock API |

---

*End of Implementation Plan*
