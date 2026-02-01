# AI Development Blueprint: Groucho the Hunter

> **Complete guide for AI systems to develop a Three.js cybersecurity threat hunting FPS/adventure game**
> 
> **Version**: 1.0 | **Last Updated**: 2026-02-01 | **Project Phase**: Pre-Development

---

## TABLE OF CONTENTS

1. [Project Identity](#1-project-identity)
2. [Game Overview](#2-game-overview)
3. [Core Mechanics](#3-core-mechanics)
4. [Technical Specifications](#4-technical-specifications)
5. [Implementation Roadmap](#5-implementation-roadmap)
6. [MCP Usage Guide](#6-mcp-usage-guide)
7. [Git Workflow & Version Control](#7-git-workflow--version-control)
8. [Development Commands](#8-development-commands)
9. [File Creation Checklist](#9-file-creation-checklist)
10. [AI Development Guidelines](#10-ai-development-guidelines)

---

## 1. PROJECT IDENTITY

### 1.1 Game Information
| Attribute | Value |
|-----------|-------|
| **Game Name** | Groucho the Hunter |
| **Genre** | First-Person Shooter / Adventure |
| **Theme** | Cybersecurity Threat Hunting / Cyber-Western |
| **Platform** | Browser (WebGL/WebGPU) |
| **Engine** | Three.js r171+ |
| **Build Tool** | Vite 5.x |
| **Container** | Docker + nginx |

### 1.2 Main Character: Groucho
- **Role**: The Threat Hunter / Sheriff of Cyberspace
- **Appearance**: 
  - Green furry monster/digital entity (approximately 4 feet tall)
  - Soft, luminous green fur that pulses with digital energy
  - Large, expressive white eyes with black pupils
  - **Brown leather cowboy hat** with **silver sheriff's star badge** (glows when threats near)
  - **Red western-style bandana** around neck
  - Brown leather vest with digital circuit patterns
  - Light turquoise button-up shirt
  - Wide, friendly smile and approachable demeanor
- **Reference Image**: [`images/Groucho.png`](images/Groucho.png)
- **Personality**: Approachable yet authoritative, curious, analytical, determined, witty
- **Backstory**: Began as a debugging script that gained sentience; now dedicates existence to protecting digital world
- **Character Voice**: Warm, friendly with western drawl; addresses player as "Partner" or "Rookie"
- **Catchphrase**: *"The frontier ain't gonna secure itself, Partner."*

### 1.3 Narrative Theme
Groucho is a digital sheriff patrolling the **Digital Frontier**—a vast cyber-universe where:
- Data flows like rivers
- Networks form cities
- Firewall mountains tower over landscapes
- The Deep Net lurks beneath in shadow

The game visualizes abstract cybersecurity concepts as tangible 3D environments where threats appear as monsters, puzzles represent forensic analysis, and victories mean securing the digital realm. A shadow has fallen over the frontier—the **Syndicate of Corrupted Code** threatens to collapse digital infrastructure.

### 1.4 The Four Levels

| Level | Name | Theme | Environment | Boss | Key Skills |
|-------|------|-------|-------------|------|------------|
| **1** | The Outskirts | Digital Frontier / Wild West | Rolling data hills, server cabins, email corrals | **Spamford** (spam email monster) | Basic scanning, phishing detection, USB analysis |
| **2** | The SOC | Professional Cybersecurity | High-tech facility, monitoring floor, server maze | **DeeDee O.S.** (DDoS swarm entity) | SIEM triage, log timeline reconstruction |
| **3** | The Deep Net | Advanced Threat Hunting | Dark underground, abandoned servers, malware lab | **ShadowStep APT** (sophisticated persistent threat) | Hypothesis formation, persistence hunting, memory forensics |
| **4** | The Core War | Global Cyberwarfare | Critical infrastructure, massive scale, apocalyptic | **The Architect** (ancient AI mastermind) | Supply chain analysis, zero-day research, crisis management |

### 1.5 The Four Bosses

1. **Spamford the Annoying** (Level 1)
   - Appearance: Giant blob of vibrating emails and advertisements
   - Attack: Overwhelms with noise, hides malicious payload in volume
   - Defeat: Sort legitimate from spam, filter traffic

2. **DeeDee O.S.** (Level 2 - Distributed Denial of Service)
   - Appearance: Swarm of countless tiny attacking nodes
   - Attack: Overwhelms resources through sheer volume
   - Defeat: Rate limiting, traffic filtering, finding command source

3. **ShadowStep APT** (Level 3 - Advanced Persistent Threat)
   - Appearance: Shifting shadow that changes form
   - Attack: Multi-stage, evades detection, reappears elsewhere
   - Defeat: Complete incident response cycle (detect, contain, eradicate, recover)

4. **The Architect** (Level 4)
   - Appearance: Ancient AI core—massive crystalline structure with shifting code
   - Attack: Uses all previous threat types, zero-day exploits, supply chain attacks
   - Defeat: Ultimate test—apply everything learned to identify, contain, neutralize

### 1.6 Threat Design Philosophy

**Visual Metaphor System:**
| Threat Type | Visual Representation | Behavior |
|-------------|----------------------|----------|
| Phishers | Email-shaped creatures with fake faces | Try to trick systems |
| Trojans | Innocent-looking programs with hidden monster faces | Appear friendly until activated |
| Worms | Segmented, snake-like creatures | Self-replicate across networks |
| Rootkits | Nearly invisible entities with glitchy outlines | Hide deep in system kernel |
| Ransomware | Creatures carrying heavy locks and chains | Encrypt data, demand payment |
| APTs | Shadowy, shifting forms that adapt | Long-term presence, patient |
| Zero-Day | Formless voids—pure darkness | Exploit unknown vulnerabilities |

**Environmental Corruption:**
- **Safe Zones**: Blue-green ambient lighting, smooth data flows
- **Caution Zones**: Yellow/orange lighting, slightly erratic flows
- **Danger Zones**: Red/purple lighting, chaotic textures, corrupted geometry, chromatic aberration effects

---

## 2. GAME OVERVIEW

### 2.1 Elevator Pitch
*"Groucho the Hunter" is a browser-based FPS/adventure where players become Groucho, a cyber-sheriff hunting digital threats in immersive 3D environments. Players explore networked worlds, investigate security incidents, and solve cybersecurity puzzles based on real threat hunting techniques—turning complex security analysis into engaging gameplay.*

### 2.2 Target Audience
| Segment | Motivation | Experience |
|---------|------------|------------|
| Aspiring SOC Analysts | Build practical skills for job interviews | Educational + Portfolio |
| IT Professionals | Transition into security roles | Career development |
| Students | Learn cybersecurity fundamentals | Academic supplement |
| Gamers | Enjoy unique FPS/puzzle hybrid | Entertainment first |
| Corporate Training | Engaging security awareness | Compliance + Awareness |

### 2.3 Core Gameplay Loop
```
┌─────────────────────────────────────────────────────────────┐
│   EXPLORE → DETECT → ANALYZE → NEUTRALIZE → PROGRESS       │
│      ↓         ↓        ↓           ↓          ↓           │
│   3D World   Scanner   Puzzles   Combat/Tools  Unlock      │
└─────────────────────────────────────────────────────────────┘
```

1. **Explore**: Navigate 3D environments (The Outskirts, The SOC, The Deep Net, The Core)
2. **Detect**: Use the scanner to identify suspicious entities and anomalies
3. **Analyze**: Engage in cybersecurity-themed puzzles
4. **Neutralize**: Use appropriate tools or combat mechanics to contain threats
5. **Progress**: Earn XP, unlock new tools, advance through levels

### 2.4 Dual Objectives
- **Educational**: Raise cybersecurity awareness by gamifying real-world security analysis
- **Entertainment**: Deliver compelling FPS gameplay with engaging mechanics and progression

### 2.5 Success Metrics
- **Completion Rate**: >70% of players finish Level 1
- **Learning Retention**: Players can explain 3+ threat hunting concepts after playing
- **Engagement**: Average session >20 minutes
- **Performance**: Consistent 60fps on target hardware
- **Accessibility**: Loads in <5 seconds on broadband

---

## 3. CORE MECHANICS

### 3.1 First-Person Movement and Controls

**Movement System:**
| Key | Action |
|-----|--------|
| W / Arrow Up | Move Forward |
| S / Arrow Down | Move Backward |
| A / Arrow Left | Strafe Left |
| D / Arrow Right | Strafe Right |
| Spacebar | Jump |
| Shift | Sprint (limited stamina) |
| E | Interact |
| Tab | Inventory/Tools Menu |
| ESC | Pause / Release Mouse |
| 1-4 | Tool Hotkeys |

**Mouse Controls:**
- Mouse movement: Camera look (PointerLockControls)
- Left click: Use current tool / Confirm in puzzles
- Right click: Alternative action / Cancel

**Implementation Notes:**
```javascript
// Use THREE.PointerLockControls for FPS camera
// Apply velocity * deltaTime for frame-rate independence
// Implement smooth camera damping for natural feel
// Raycast for collision detection before movement
```

**Collision Detection:**
- Raycast from camera position in movement direction
- Use `three-mesh-bvh` for optimized raycasting against complex geometry
- Minimum 5 rays (center, forward-left, forward-right, left, right) for robust collision
- Stop movement at intersection point to prevent wall clipping

### 3.2 Threat Detection Mechanics

**Visual Indicators:**
- **Glowing Particles**: Suspicious network traffic flows
- **Color Coding**: Green (safe) → Yellow (caution) → Red (threat)
- **Scanning Overlay**: Activate scanning tool to highlight anomalies
- **Threat Radar**: Mini-map showing nearby threat locations

**Detection Tools (Progressively Unlocked):**
| Tool | Level Unlocked | Function |
|------|---------------|----------|
| Basic Scanner | 1 | Highlights suspicious objects within range |
| Log Analyzer | 2 | Reveals hidden event logs |
| Network Sniffer | 2 | Visualizes data flows |
| Malware Detector | 3 | Identifies infected files/systems |
| Forensics Kit | 3 | Advanced artifact analysis |
| Advanced Threat Intel | 4 | Knows TTPs and attribution techniques |

### 3.3 Puzzle Types (5 Core Types)

**1. Log Analysis Terminal**
- Parse timestamped events, identify attack patterns
- Click-to-highlight suspicious entries
- Timeline visualization
- Story context: Reconstruct how attackers got in

**2. Phishing Hunt**
- Spot visual indicators in emails
- Suspicious sender addresses, urgent subject lines
- Fake logos and malicious links
- Story context: Local users being tricked by fake emails

**3. USB Drop / File Analysis**
- Find and safely analyze USB contents
- File analysis mini-game
- Signature matching mechanics
- Story context: Abandoned USB drives contain surprises

**4. SIEM Triage**
- Sort and prioritize security alerts
- Separate real threats from false positives
- Time pressure mechanic
- Story context: Too many alerts, not enough time

**5. Memory Forensics**
- Analyze RAM dumps for malware
- Extract hidden processes
- Behavioral analysis
- Story context: Malware Lab analysis

**Additional Puzzle Types:**
- **Log Timeline**: Order events chronologically
- **Network Map**: Trace suspicious traffic paths
- **Hypothesis Formation**: Develop and test hunting theories
- **Persistence Hunt**: Find backdoors and implants
- **C2 Detection**: Find command infrastructure
- **Supply Chain Poisoning**: Identify compromised software
- **Zero-Day Analysis**: Reverse engineer unknown exploits
- **Crisis Management**: Resource allocation under pressure

**Puzzle UI System:**
- Approach puzzle object → Press E to activate
- Puzzle UI overlays game view (not full screen)
- Time pressure optional based on difficulty
- Multiple solution paths for complex puzzles
- Clear visual/audio feedback for correct/incorrect actions

### 3.4 Progression System

**Experience Points (XP):**
| Action | XP Reward |
|--------|-----------|
| Solve puzzle | +50-500 (based on difficulty) |
| Discover threat | +25 per threat |
| Complete objective | +100-1,000 |
| Time bonus | Additional XP for fast completion |

**Level Thresholds:**
- Level 1: 0-1,000 XP (Security Awareness)
- Level 2: 1,001-3,000 XP (Security Analyst)
- Level 3: 3,001-6,000 XP (Threat Hunter)
- Level 4: 6,001+ XP (Security Expert)

**Unlockables:**
- New tools and scanning capabilities
- Cosmetic upgrades for Groucho
- Bonus levels and challenge modes
- Achievement badges

### 3.5 Game States
```javascript
const GameStates = {
    LOADING: 'loading',
    MAIN_MENU: 'mainMenu',
    PLAYING: 'playing',
    PAUSED: 'paused',
    PUZZLE: 'puzzle',
    CUTSCENE: 'cutscene',
    GAME_OVER: 'gameOver',
    VICTORY: 'victory'
};
```

---

## 4. TECHNICAL SPECIFICATIONS

### 4.1 Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| **Engine** | Three.js | r171+ | 3D rendering engine |
| **Renderer** | WebGPU / WebGL2 | - | Hardware-accelerated graphics |
| **Language** | JavaScript (ES2022+) | - | Application logic |
| **Build Tool** | Vite | 5.x | Development server & bundling |
| **Physics** | three-mesh-bvh | ^0.7.0 | Collision detection |
| **Post-Processing** | postprocessing | ^6.33.0 | Visual effects |
| **Container** | Docker | - | Deployment packaging |
| **Web Server** | nginx | alpine | Static file serving |
| **CLI Tool** | Python 3.11+ | - | Docker environment management |
| **CLI Framework** | Click + Textual | - | CLI and TUI interface |

### 4.2 Rendering Pipeline

**Renderer Configuration:**
```javascript
// WebGPU with WebGL2 fallback
const renderer = new THREE.WebGPURenderer({
    antialias: true,
    powerPreference: "high-performance"
});
await renderer.init(); // Required for WebGPU

// Fallback for unsupported browsers
if (!renderer.isWebGPUBackend) {
    renderer = new THREE.WebGLRenderer({ antialias: true });
}
```

**Renderer Settings:**
- ShadowMap: PCFSoftShadowMap with CSM (Cascaded Shadow Maps)
- Output Color Space: SRGBColorSpace
- Tone Mapping: ACESFilmicToneMapping
- Pixel Ratio: Math.min(window.devicePixelRatio, 2)

**Lighting Strategy:**
- Ambient light for base illumination
- Directional light (sun/main source) with CSM
- Dynamic point light pool for puzzles and threats

### 4.3 Performance Targets

| Metric | Target | Implementation |
|--------|--------|----------------|
| **Draw Calls** | <100 | Instancing, BatchedMesh, LOD |
| **Frame Rate** | 60fps | WebGPU, optimized shaders |
| **Load Time** | <5s | Progressive loading, compression |
| **Memory** | Stable | Object pooling, proper disposal |
| **Poly Count** | <100,000 triangles per scene |
| **Texture Memory** | <256MB VRAM |

**Performance Monitoring:**
```javascript
// Monitor draw calls
console.log('Draw calls:', renderer.info.render.calls);
console.log('Triangles:', renderer.info.render.triangles);
console.log('Geometries:', renderer.info.memory.geometries);
console.log('Textures:', renderer.info.memory.textures);
```

### 4.4 Asset Pipeline

| Asset Type | Format | Compression |
|------------|--------|-------------|
| Models | glTF 2.0 | Draco (90-95% reduction) |
| Textures | KTX2 | UASTC/ETC1S (10x VRAM reduction) |
| Audio | Ogg Vorbis | Variable bitrate |
| Code | ES modules | Tree-shaking, minification |

### 4.5 Browser Compatibility

| Browser | Minimum Version | Notes |
|---------|-----------------|-------|
| Chrome | 113+ | Full WebGPU support |
| Firefox | 118+ | WebGPU via flag |
| Safari | 17+ | WebGPU supported |
| Edge | 113+ | Full WebGPU support |

**Fallback**: All browsers with WebGL2 support get WebGL2 renderer.

### 4.6 Source Code Structure

```
src/
├── core/                    # Core engine systems
│   ├── Game.js              # Main game controller
│   ├── Renderer.js          # WebGPU/WebGL2 renderer setup
│   ├── SceneManager.js      # Scene graph management
│   ├── GameLoop.js          # Main game loop
│   └── EventBus.js          # Inter-system communication
│
├── systems/                 # Game systems
│   ├── InputManager.js      # Input handling
│   ├── PlayerController.js  # Player controller
│   ├── CollisionSystem.js   # BVH raycasting
│   ├── StateManager.js      # Game state machine
│   ├── AudioManager.js      # Spatial audio
│   └── PerformanceMonitor.js # FPS/statistics
│
├── world/                   # World systems
│   ├── Level.js             # Base level class
│   ├── LevelManager.js      # Level loading/unloading
│   ├── Environment.js       # Static world geometry
│   ├── Interactable.js      # Interactive objects
│   └── InteractableFactory.js # Object creation
│
├── ecs/                     # Entity Component System
│   ├── Entity.js            # Base entity
│   ├── Component.js         # Base component
│   ├── EntityManager.js     # Entity lifecycle
│   └── components/          # Component implementations
│       ├── Transform.js
│       ├── MeshRenderer.js
│       ├── Collider.js
│       └── AudioSource.js
│
├── puzzles/                 # Puzzle framework
│   ├── PuzzleBase.js        # Base puzzle class
│   ├── PuzzleManager.js     # Puzzle state handling
│   ├── LogAnalysisPuzzle.js
│   ├── PhishingHuntPuzzle.js
│   ├── USBAnalysisPuzzle.js
│   ├── SIEMTriagePuzzle.js
│   └── MemoryForensicsPuzzle.js
│
├── bosses/                  # Boss encounters
│   ├── BossBase.js          # Base boss class
│   ├── BossAI.js            # AI state machine
│   ├── SpamfordBoss.js      # Level 1 boss
│   ├── DeeDeeBoss.js        # Level 2 boss
│   ├── ShadowStepBoss.js    # Level 3 boss
│   └── ArchitectBoss.js     # Level 4 boss
│
├── tools/                   # Tool system
│   ├── Tool.js              # Base tool class
│   ├── BasicScanner.js
│   ├── LogAnalyzer.js
│   ├── NetworkSniffer.js
│   └── ToolManager.js       # Tool inventory
│
├── progression/             # Progression systems
│   ├── ProgressionSystem.js # XP/leveling
│   ├── AchievementSystem.js
│   └── SaveManager.js       # localStorage saves
│
├── ui/                      # User interface
│   ├── HUD.js               # Heads-up display
│   ├── Crosshair.js
│   ├── PuzzleUI.js          # Puzzle interface overlay
│   ├── LoadingScreen.js
│   ├── ToolWheel.js         # Tool selector
│   ├── XPBar.js
│   ├── DialogueBox.js
│   └── menus/               # Menu screens
│       ├── MainMenu.js
│       ├── PauseMenu.js
│       └── SettingsMenu.js
│
├── dialogue/                # Dialogue system
│   ├── DialogueSystem.js
│   └── data/
│       ├── Level1_Dialogue.json
│       └── Groucho_Lines.json
│
├── assets/                  # Asset management
│   ├── AssetLoader.js
│   ├── AssetCache.js
│   └── LODSystem.js
│
├── utils/                   # Utilities
│   ├── MathUtils.js
│   ├── Debug.js
│   ├── Storage.js           # localStorage wrapper
│   └── Constants.js
│
├── world/levels/            # Level implementations
│   ├── Level1_Outskirts.js
│   ├── Level2_SOC.js
│   ├── Level3_DeepNet.js
│   └── Level4_CoreWar.js
│
├── main.js                  # Entry point
├── index.html               # HTML entry point
└── style.css                # Global styles

grouchocli/                  # CLI management tool
├── __init__.py
├── config.py
├── docker_manager.py
├── game_manager.py
├── main.py                  # CLI entry point (Click)
├── tui.py                   # Interactive TUI (Textual)
└── utils.py
```

### 4.7 Design Patterns

| Pattern | Usage | Location |
|---------|-------|----------|
| **Singleton** | GameController, managers | `Game.js`, `*-manager.js` |
| **Component** | Entity behavior composition | `ecs/` folder |
| **Observer** | Event-driven communication | `EventBus.js` |
| **State Machine** | Game state management | `StateManager.js` |
| **Object Pool** | Particle/bullet reuse | `utils/ObjectPool.js` |
| **Factory** | Entity creation | `InteractableFactory.js` |

---

## 5. IMPLEMENTATION ROADMAP

### 5.1 Overview: 12-Week Development Plan

```
Weeks:  1-3        4-6         7-9        10-12
        ├──────────┼───────────┼──────────┤
        │ Phase 1  │  Phase 2  │ Phase 3  │ Phase 4
        │  Core    │  First    │ Advanced │  Final
        │ Engine   │  Level    │ Systems  │ Polish
        └──────────┴───────────┴──────────┘
```

### 5.2 Phase 1: Project Setup & Core Engine (Weeks 1-3)

**Goal**: Establish the technical foundation with a working FPS framework.

**Week 1: Project Initialization**
- [ ] Initialize Vite project with Three.js r171+
- [ ] Set up folder structure per Technical Design
- [ ] Configure build pipeline and development server
- [ ] Set up linting (ESLint) and formatting (Prettier)
- [ ] Initialize Git repository with `.gitignore`
- [ ] Set up grouchocli CLI tool (`cd grouchocli && ./setup.sh`)

**Week 2: Renderer & Scene Management**
- [ ] Implement WebGPU renderer with WebGL2 fallback
- [ ] Create scene manager for level loading/unloading
- [ ] Set up basic lighting system with CSM shadows
- [ ] Implement performance monitoring system
- [ ] Create loading screen component

**Week 3: Player Controller & Physics**
- [ ] Integrate PointerLockControls for FPS camera
- [ ] Implement WASD movement with collision detection
- [ ] Add sprint mechanics with stamina system
- [ ] Implement jump physics with gravity
- [ ] Create input manager with key binding support

**Phase 1 Deliverables:**
- [ ] Playable test level (simple room)
- [ ] Smooth FPS movement without clipping
- [ ] 60fps performance on target hardware
- [ ] Clean, extensible code structure

### 5.3 Phase 2: First Level & Basic Puzzles (Weeks 4-6)

**Goal**: Create Level 1 (The Outskirts) with working puzzles and first boss encounter.

**Week 4: Level 1 Environment**
- [ ] Build "The Outskirts" 3D environment
  - Sheriff's Station (tutorial zone)
  - Email Corral
  - Password Saloon
  - USB Gulch
- [ ] Create environmental assets (server cabins, data rivers)
- [ ] Implement interactive object system
- [ ] Add NPC dialogue system for Groucho

**Week 5: Basic Puzzles**
- [ ] **Log Analysis Terminal**: Parse logs to identify attack patterns
- [ ] **Phishing Hunt**: Spot visual indicators of phishing
- [ ] **USB Drop**: Find and analyze malicious USB drives
- [ ] Implement puzzle UI overlay system

**Week 6: Boss Fight & Progression**
- [ ] Create **Spamford** boss entity
- [ ] Implement XP and leveling system
- [ ] Create tool unlock progression
- [ ] Add save/load with localStorage
- [ ] Polish Level 1 flow and transitions

**Phase 2 Deliverables:**
- [ ] Complete Level 1 playable from start to finish
- [ ] 3 working puzzle types
- [ ] Boss fight with Spamford
- [ ] Progression saves correctly
- [ ] Tutorial system functional

### 5.4 Phase 3: Advanced Systems (Weeks 7-9)

**Goal**: Build Levels 2-3 with advanced puzzles and enemy types.

**Week 7: Level 2 - The SOC**
- [ ] Build Security Operations Center environment
- [ ] Create enemy types: Brute Forcers, Worms, DDoS Swarm
- [ ] **SIEM Triage Puzzle**: Sort and prioritize alerts
- [ ] **Log Timeline Puzzle**: Reconstruct attack sequences

**Week 8: Level 3 - The Deep Net**
- [ ] Build Deep Net underground environment
- [ ] Create advanced enemies: Rootkits, Backdoors, C2 Beacons
- [ ] **Hypothesis Formation Puzzle**: Develop hunting theories
- [ ] **Persistence Hunt Puzzle**: Find hidden backdoors
- [ ] **Memory Forensics Puzzle**: Analyze RAM dumps

**Week 9: Bosses & Tools**
- [ ] Implement **DeeDee O.S.** boss (Level 2)
- [ ] Implement **ShadowStep APT** boss (Level 3)
- [ ] Add advanced tools: Memory Forensics Kit, Malware Sandbox, Threat Intelligence Portal

**Phase 3 Deliverables:**
- [ ] Level 2 (The SOC) complete
- [ ] Level 3 (The Deep Net) complete
- [ ] 6 total puzzle types implemented
- [ ] 2 boss encounters functional
- [ ] All advanced tools unlocked

### 5.5 Phase 4: Final Level & Polish (Weeks 10-12)

**Goal**: Complete Level 4, add audio, polish, and optimize for deployment.

**Week 10: Level 4 - The Core War**
- [ ] Build massive-scale Core environment
- [ ] Create elite enemies: Zero-Day Exploits, Supply Chain threats
- [ ] **Supply Chain Poisoning Puzzle**: Identify compromised software
- [ ] **Zero-Day Analysis Puzzle**: Reverse engineer unknown exploits
- [ ] **Crisis Management Puzzle**: Resource allocation under pressure

**Week 11: Audio & Visual Polish**
- [ ] Implement **The Architect** final boss
- [ ] Add 3D spatial audio system
- [ ] Compose/procure background music
- [ ] Add post-processing effects (bloom, vignette, chromatic aberration, fog)

**Week 12: Optimization & Deployment**
- [ ] Performance optimization pass (reduce draw calls to <100)
- [ ] Implement LOD system
- [ ] Asset optimization (Draco, KTX2 compression)
- [ ] Final Docker deployment testing
- [ ] Final bug fixes and polish

**Phase 4 Deliverables:**
- [ ] Level 4 (The Core War) complete
- [ ] Final boss: The Architect
- [ ] Full audio implementation
- [ ] Post-processing effects
- [ ] Optimized 60fps performance
- [ ] Docker deployment ready
- [ ] Complete documentation

---

## 6. MCP USAGE GUIDE

This project has access to multiple MCP (Model Context Protocol) servers that provide additional tools and resources. Use these effectively to enhance development.

### 6.1 Web Search & Research MCPs

#### `mcp--web___search___prime--webSearchPrime`
**Purpose**: Search the web for current information, Three.js updates, cybersecurity concepts

**Use Cases:**
- Finding latest Three.js documentation and best practices
- Researching cybersecurity threat hunting techniques
- Looking up game design patterns and FPS mechanics
- Finding solutions to technical problems

**Example:**
```
Search: "Three.js r171 WebGPU renderer best practices"
Search: "cybersecurity threat hunting log analysis techniques"
```

#### `mcp--web___reader--webReader`
**Purpose**: Read and extract content from documentation pages, tutorials, articles

**Use Cases:**
- Reading Three.js documentation pages
- Extracting code examples from tutorials
- Reading cybersecurity reference materials
- Converting web content to markdown

**Example:**
```
URL: https://threejs.org/docs/index.html#api/en/renderers/WebGLRenderer
Use: Extract documentation for renderer configuration
```

#### `mcp--fetch--fetch`
**Purpose**: Fetch raw HTML, API requests, web resources

**Use Cases:**
- Fetching raw HTML for parsing
- Making API requests
- Downloading web resources
- Getting unformatted web content

**Example:**
```
URL: https://api.github.com/repos/mrdoob/three.js/releases/latest
Use: Get latest Three.js version information
```

### 6.2 Documentation MCP

#### `mcp--Context7--resolve___library___id` & `mcp--Context7--query___docs`
**Purpose**: Query up-to-date Three.js API documentation and code examples

**Use Cases:**
- Looking up Three.js class methods and signatures
- Finding renderer options and configurations
- Getting code examples for specific features
- Understanding Three.js API changes

**Workflow:**
1. First resolve the library ID: `resolve-library-id` with "three.js"
2. Then query specific documentation: `query-docs` with your question

**Example:**
```
Step 1: resolve-library-id for "three.js"
Step 2: query-docs for "How to set up WebGPU renderer with fallback"
```

**Important Notes:**
- Do not call resolve-library-id more than 3 times per session
- Do not call query-docs more than 3 times per session
- Use the best result if you cannot find what you need

### 6.3 Data Management MCP

#### `mcp--google___sheets` (Google Sheets)
**Purpose**: Track bugs, feature requests, test results, development progress

**Available Operations:**
- Create/read/update spreadsheets
- Track bugs and feature requests
- Log test results
- Manage development tasks

**Recommended Spreadsheets to Create:**
1. **Bug Tracker**: ID, Description, Severity, Status, Assigned To, Notes
2. **Feature Status**: Feature, Phase, Status, Completion %, Notes
3. **Test Results**: Test Case, Result, Date, Notes

**Example Workflow:**
```
1. Create spreadsheet "Groucho Development Tracker"
2. Create sheets: "Bugs", "Features", "Tests"
3. Log bugs as they are found
4. Update feature status weekly
5. Record test results
```

### 6.4 MCP Best Practices

1. **Use Web Search for Current Info**: Always check for latest documentation
2. **Use Context7 for Three.js API**: Get accurate, up-to-date API information
3. **Use Google Sheets for Tracking**: Maintain organized development records
4. **Cache Results**: Don't make the same MCP calls repeatedly
5. **Prioritize**: Use MCPs when stuck or need external information

---

## 7. GIT WORKFLOW & VERSION CONTROL

### 7.1 Git MCP Tools Available

The Git MCP provides the following capabilities:
- `mcp--git--git_status` - Show working tree status
- `mcp--git--git_diff_unstaged` - Show unstaged changes
- `mcp--git--git_diff_staged` - Show staged changes
- `mcp--git--git_diff` - Show differences between branches/commits
- `mcp--git--git_commit` - Record changes to repository
- `mcp--git--git_add` - Add file contents to staging area
- `mcp--git--git_reset` - Unstage all staged changes
- `mcp--git--git_log` - Show commit logs
- `mcp--git--git_create_branch` - Create new branch
- `mcp--git--git_checkout` - Switch branches
- `mcp--git--git_show` - Show contents of a commit
- `mcp--git--git_branch` - List branches

### 7.2 Branch Naming Conventions

| Branch Type | Pattern | Example |
|-------------|---------|---------|
| **Feature** | `feature/description` | `feature/player-controller` |
| **Bugfix** | `bugfix/description` | `bugfix/collision-detection` |
| **Hotfix** | `hotfix/description` | `hotfix/memory-leak` |
| **Phase** | `phase/N-description` | `phase/1-core-engine` |

### 7.3 Commit Message Format (Conventional Commits)

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
| Type | Use For |
|------|---------|
| `feat` | New features |
| `fix` | Bug fixes |
| `docs` | Documentation changes |
| `style` | Formatting, missing semicolons, etc. |
| `refactor` | Code refactoring |
| `perf` | Performance improvements |
| `test` | Adding tests |
| `chore` | Build process, dependencies |

**Scopes:**
- `core` - Core engine systems
- `player` - Player controller
- `puzzle` - Puzzle systems
- `ui` - User interface
- `level` - Level-specific code
- `asset` - Assets and resources
- `config` - Configuration files

**Examples:**
```
feat(player): implement FPS camera controller with collision detection

fix(puzzle): resolve log analysis puzzle state persistence issue

docs(readme): add installation instructions

refactor(core): optimize render loop for better performance
```

### 7.4 When to Commit

**Commit When:**
- A logical unit of work is complete
- Tests pass after changes
- You want to preserve a working state
- Before switching contexts or tasks
- At the end of each development session

**Commit Frequency:**
- Small, focused commits are better than large ones
- Aim for commits that represent 15-60 minutes of work
- Each commit should leave the codebase in a working state

### 7.5 When to Create Branches

**Create a New Branch For:**
- New features (create from `main` or `develop`)
- Bug fixes (create from the branch where the bug exists)
- Experimental work that might break things
- Each phase of the 12-week plan
- Code reviews before merging

**Branch Workflow:**
```
1. git checkout main
2. git pull origin main
3. git checkout -b feature/player-controller
4. Make changes, commit regularly
5. git push origin feature/player-controller
6. Create Pull Request
7. Review, approve, merge
8. Delete feature branch
```

### 7.6 Recommended Git Workflow for This Project

**Phase-Based Branching:**
```
main
├── phase/1-core-engine
│   ├── feature/renderer-setup
│   ├── feature/player-controller
│   └── feature/collision-system
├── phase/2-first-level
│   ├── feature/level1-environment
│   ├── feature/puzzle-system
│   └── feature/spamford-boss
├── phase/3-advanced-systems
│   ├── feature/level2-soc
│   ├── feature/level3-deepnet
│   └── feature/advanced-puzzles
└── phase/4-final-polish
    ├── feature/level4-core
    ├── feature/architect-boss
    └── feature/audio-system
```

### 7.7 Daily Git MCP Workflow

**Start of Day:**
```
1. git_status - Check current state
2. git_pull - Sync with remote
3. Create/checkout feature branch
```

**During Development:**
```
1. Make changes
2. git_status - See what changed
3. git_diff_unstaged - Review changes
4. git_add - Stage files
5. git_diff_staged - Review staged changes
6. git_commit - Commit with conventional message
```

**End of Day:**
```
1. git_status - Ensure clean state
2. git_push - Push branch to remote
3. Update any tracking spreadsheets
```

### 7.8 Commit Checklist

Before committing, verify:
- [ ] Code compiles without errors
- [ ] ESLint passes (`npm run lint`)
- [ ] Tests pass (if applicable)
- [ ] Commit message follows convention
- [ ] Only relevant files are staged
- [ ] No debug code or console.logs left in

---

## 8. DEVELOPMENT COMMANDS

### 8.1 Vite / npm Commands

| Command | Purpose |
|---------|---------|
| `npm run dev` | Start development server (port 3000, HMR enabled) |
| `npm run build` | Production build with optimizations |
| `npm run lint` | Run ESLint on source files |
| `npm run format` | Format code with Prettier |

### 8.2 Docker Commands (Manual)

```bash
# Development with hot reload (Vite dev server on port 3000)
docker-compose up --build

# Access development server at http://localhost:3000

# Production deployment (nginx on port 8080)
docker-compose -f docker-compose.prod.yml up -d --build

# Access production build at http://localhost:8080

# Alternative: Direct Docker build and run
docker build -t groucho-the-hunter .
docker run -d -p 8080:80 --name groucho groucho-the-hunter
```

### 8.3 grouchocli Commands (Recommended)

**Setup:**
```bash
cd grouchocli && ./setup.sh
```

**Common Commands:**
| Command | Purpose |
|---------|---------|
| `groucho start --dev` | Start development environment (port 3000) |
| `groucho start --prod` | Start production environment (port 8080) |
| `groucho stop` | Stop containers |
| `groucho restart` | Restart containers |
| `groucho status` | Show container/game status |
| `groucho logs --dev --follow` | View logs with follow |
| `groucho shell --dev` | Open interactive shell |
| `groucho build --prod` | Build Docker images |
| `groucho clean --force` | Remove all resources |
| `groucho menu` | Launch interactive TUI |

### 8.4 Git Commands (with MCP)

**Status and Information:**
```bash
# Check repository status
mcp--git--git_status

# View commit history
mcp--git--git_log

# List branches
mcp--git--git_branch --branch_type local
```

**Making Changes:**
```bash
# View unstaged changes
mcp--git--git_diff_unstaged

# Stage files
mcp--git--git_add --files ["file1.js", "file2.js"]

# View staged changes
mcp--git--git_diff_staged

# Commit changes
mcp--git--git_commit --message "feat(player): implement jump mechanics"
```

**Branching:**
```bash
# Create new branch
mcp--git--git_create_branch --branch_name feature/player-controller

# Switch branch
mcp--git--git_checkout --branch_name feature/player-controller
```

---

## 9. FILE CREATION CHECKLIST

### 9.1 Phase 1 Files (Weeks 1-3)

#### Configuration Files
| File | Path | Priority |
|------|------|----------|
| package.json | `/package.json` | High |
| vite.config.js | `/vite.config.js` | High |
| .gitignore | `/.gitignore` | High |
| .eslintrc.js | `/.eslintrc.js` | Medium |
| .prettierrc | `/.prettierrc` | Medium |

#### Core Engine Files
| File | Path | Priority |
|------|------|----------|
| Game.js | `/src/core/Game.js` | High |
| Renderer.js | `/src/core/Renderer.js` | High |
| SceneManager.js | `/src/core/SceneManager.js` | High |
| GameLoop.js | `/src/core/GameLoop.js` | High |
| EventBus.js | `/src/utils/EventBus.js` | Medium |

#### Player System Files
| File | Path | Priority |
|------|------|----------|
| PlayerController.js | `/src/systems/PlayerController.js` | High |
| FPSCamera.js | `/src/player/FPSCamera.js` | High |
| Movement.js | `/src/player/Movement.js` | High |

#### System Files
| File | Path | Priority |
|------|------|----------|
| InputManager.js | `/src/systems/InputManager.js` | High |
| StateManager.js | `/src/systems/StateManager.js` | High |
| CollisionSystem.js | `/src/systems/CollisionSystem.js` | High |
| PerformanceMonitor.js | `/src/systems/PerformanceMonitor.js` | Medium |
| AudioManager.js | `/src/systems/AudioManager.js` | Low |

#### Utility Files
| File | Path | Priority |
|------|------|----------|
| MathUtils.js | `/src/utils/MathUtils.js` | Medium |
| Storage.js | `/src/utils/Storage.js` | Medium |
| Constants.js | `/src/utils/Constants.js` | Medium |

#### Entry Point
| File | Path | Priority |
|------|------|----------|
| index.html | `/index.html` | High |
| main.js | `/src/main.js` | High |
| style.css | `/src/style.css` | Medium |

### 9.2 Phase 2 Files (Weeks 4-6)

#### World/Level Files
| File | Path | Priority |
|------|------|----------|
| Level.js | `/src/world/Level.js` | High |
| Level1_Outskirts.js | `/src/world/levels/Level1_Outskirts.js` | High |
| Environment.js | `/src/world/Environment.js` | High |
| Interactable.js | `/src/world/Interactable.js` | Medium |

#### ECS Files
| File | Path | Priority |
|------|------|----------|
| Entity.js | `/src/ecs/Entity.js` | Medium |
| Component.js | `/src/ecs/Component.js` | Medium |
| EntityManager.js | `/src/ecs/EntityManager.js` | Medium |

#### Puzzle Files
| File | Path | Priority |
|------|------|----------|
| PuzzleBase.js | `/src/puzzles/PuzzleBase.js` | High |
| LogAnalysisPuzzle.js | `/src/puzzles/LogAnalysisPuzzle.js` | High |
| PhishingHuntPuzzle.js | `/src/puzzles/PhishingHuntPuzzle.js` | High |
| USBAnalysisPuzzle.js | `/src/puzzles/USBAnalysisPuzzle.js` | High |
| PuzzleManager.js | `/src/puzzles/PuzzleManager.js` | High |

#### Boss Files
| File | Path | Priority |
|------|------|----------|
| BossBase.js | `/src/bosses/BossBase.js` | High |
| SpamfordBoss.js | `/src/bosses/SpamfordBoss.js` | High |
| BossAI.js | `/src/bosses/BossAI.js` | Medium |

#### UI Files
| File | Path | Priority |
|------|------|----------|
| HUD.js | `/src/ui/HUD.js` | High |
| PuzzleUI.js | `/src/ui/PuzzleUI.js` | High |
| LoadingScreen.js | `/src/ui/LoadingScreen.js` | Medium |
| MainMenu.js | `/src/ui/menus/MainMenu.js` | Medium |
| PauseMenu.js | `/src/ui/menus/PauseMenu.js` | Medium |
| DialogueBox.js | `/src/ui/DialogueBox.js` | Medium |

#### Progression Files
| File | Path | Priority |
|------|------|----------|
| ProgressionSystem.js | `/src/progression/ProgressionSystem.js` | Medium |
| SaveManager.js | `/src/progression/SaveManager.js` | Medium |

### 9.3 Phase 3 Files (Weeks 7-9)

#### Level Files
| File | Path | Priority |
|------|------|----------|
| Level2_SOC.js | `/src/world/levels/Level2_SOC.js` | High |
| Level3_DeepNet.js | `/src/world/levels/Level3_DeepNet.js` | High |

#### Additional Puzzle Files
| File | Path | Priority |
|------|------|----------|
| SIEMTriagePuzzle.js | `/src/puzzles/SIEMTriagePuzzle.js` | High |
| LogTimelinePuzzle.js | `/src/puzzles/LogTimelinePuzzle.js` | High |
| HypothesisPuzzle.js | `/src/puzzles/HypothesisPuzzle.js` | Medium |
| PersistenceHuntPuzzle.js | `/src/puzzles/PersistenceHuntPuzzle.js` | Medium |
| MemoryForensicsPuzzle.js | `/src/puzzles/MemoryForensicsPuzzle.js` | Medium |

#### Boss Files
| File | Path | Priority |
|------|------|----------|
| DeeDeeBoss.js | `/src/bosses/DeeDeeBoss.js` | High |
| ShadowStepBoss.js | `/src/bosses/ShadowStepBoss.js` | High |

### 9.4 Phase 4 Files (Weeks 10-12)

#### Level Files
| File | Path | Priority |
|------|------|----------|
| Level4_CoreWar.js | `/src/world/levels/Level4_CoreWar.js` | High |

#### Additional Puzzle Files
| File | Path | Priority |
|------|------|----------|
| SupplyChainPuzzle.js | `/src/puzzles/SupplyChainPuzzle.js` | Medium |
| ZeroDayPuzzle.js | `/src/puzzles/ZeroDayPuzzle.js` | Medium |
| CrisisManagementPuzzle.js | `/src/puzzles/CrisisManagementPuzzle.js` | Medium |

#### Boss Files
| File | Path | Priority |
|------|------|----------|
| ArchitectBoss.js | `/src/bosses/ArchitectBoss.js` | High |

#### Audio/Visual Files
| File | Path | Priority |
|------|------|----------|
| PostProcessing.js | `/src/core/PostProcessing.js` | Medium |

---

## 10. AI DEVELOPMENT GUIDELINES

### 10.1 Code Quality Standards

**JavaScript Style:**
- Use ES2022+ features (async/await, optional chaining, etc.)
- Follow ESLint rules consistently
- Use Prettier for formatting
- Prefer `const` and `let` over `var`
- Use meaningful variable and function names

**Three.js Best Practices:**
- Always dispose of geometries, materials, and textures when done
- Use object pooling for frequently created/destroyed objects
- Implement proper cleanup in `dispose()` methods
- Use `THREE.MathUtils` for math operations
- Leverage `three-mesh-bvh` for collision detection

**Performance Guidelines:**
- Target <100 draw calls per frame
- Use instancing for repeated geometry
- Implement LOD (Level of Detail) system
- Compress textures with KTX2
- Use Draco compression for models

### 10.2 Documentation Standards

**JSDoc Comments:**
```javascript
/**
 * Player controller for FPS movement
 * @class
 * @param {THREE.Camera} camera - The camera to control
 * @param {InputManager} input - Input manager instance
 * @param {THREE.Scene} scene - The active scene
 */
export class PlayerController {
    /**
     * Update player movement
     * @param {number} deltaTime - Time since last frame in seconds
     */
    update(deltaTime) {
        // Implementation
    }
}
```

**Inline Comments:**
- Explain WHY, not WHAT
- Comment complex algorithms
- Document workarounds and hacks
- Reference external documentation when applicable

### 10.3 Testing Approach

**Manual Testing Checklist:**
- [ ] FPS movement smooth at 60fps
- [ ] Collision detection prevents wall clipping
- [ ] All puzzles solvable and provide feedback
- [ ] Boss fights completable
- [ ] Save/load works correctly
- [ ] Audio plays at correct volume
- [ ] UI elements render correctly

**Browser Testing:**
- Test on Chrome, Firefox, Safari, Edge
- Test WebGPU and WebGL2 fallbacks
- Test at different screen resolutions
- Test with keyboard and mouse

### 10.4 Common Pitfalls to Avoid

1. **Memory Leaks**: Always dispose of Three.js objects
2. **Frame Rate Dependency**: Use deltaTime for all time-based calculations
3. **Collision Issues**: Test collision thoroughly with different geometries
4. **State Management**: Keep game state centralized, avoid scattered state
5. **Asset Loading**: Implement proper loading states and error handling
6. **Mobile Performance**: Even though desktop-focused, keep mobile in mind

### 10.5 When to Ask for Help

Use MCP tools when:
- Need latest Three.js documentation
- Stuck on a technical implementation
- Need cybersecurity concept clarification
- Researching best practices

Ask the user when:
- Requirements are unclear
- Design decisions need input
- Scope changes are needed
- Technical trade-offs need discussion

### 10.6 Development Priorities

**Always Prioritize:**
1. Core gameplay functionality
2. Performance (60fps target)
3. Player experience and feedback
4. Code maintainability
5. Educational value (accurate cybersecurity concepts)

**Defer to Later:**
- Visual polish (can be added in Phase 4)
- Additional features beyond scope
- Optimization (do in Phase 4)
- Advanced accessibility features

### 10.7 Communication Guidelines

**When Implementing:**
- Summarize what you're implementing
- Call out any assumptions made
- Note any deviations from the design
- Suggest improvements when applicable

**When Complete:**
- Summarize what was implemented
- List files created/modified
- Note any open questions
- Update tracking spreadsheets if applicable

---

## APPENDIX A: QUICK REFERENCE

### A.1 Project Commands Cheat Sheet

```bash
# Development
npm run dev                    # Start dev server
npm run build                  # Production build
npm run lint                   # Check code style
npm run format                 # Format code

# Docker (grouchocli)
groucho start --dev           # Start development
groucho start --prod          # Start production
groucho status                # Check status
groucho logs --dev --follow   # View logs
groucho menu                  # Interactive TUI

# Git (via MCP)
git_status                    # Check status
git_diff_unstaged            # View unstaged changes
git_add                      # Stage files
git_commit                   # Commit changes
git_create_branch            # Create branch
git_checkout                 # Switch branch
```

### A.2 Key File Locations

| Document | Location |
|----------|----------|
| Story Board | `Docs/StoryBoard.md` |
| Technical Design | `Docs/TechnicalDesign.md` |
| Implementation Plan | `Docs/ImplementationPlan.md` |
| Memory Bank | `.kilocode/rules/memory-bank/` |
| Character Image | `images/Groucho.png` |
| CLI Tool | `grouchocli/` |

### A.3 Performance Targets Reminder

| Metric | Target |
|--------|--------|
| Frame Rate | 60fps |
| Draw Calls | <100 |
| Load Time | <5 seconds |
| Completion Rate | >70% Level 1 |

---

## APPENDIX B: EXTERNAL RESOURCES

### B.1 Three.js Documentation
- **Main Docs**: https://threejs.org/docs/
- **Examples**: https://threejs.org/examples/
- **WebGPU Guide**: Use Context7 MCP for latest

### B.2 Cybersecurity References
- **MITRE ATT&CK**: https://attack.mitre.org/
- **SANS Threat Hunting**: Use web-search-prime MCP
- **Log Analysis Techniques**: Use web-search-prime MCP

### B.3 Game Development Resources
- **Game Programming Patterns**: Use web-reader MCP
- **FPS Controller Reference**: Use Context7 MCP
- **ECS Architecture**: Use web-search-prime MCP

---

*This document is a living blueprint. Update it as the project evolves. Refer to the memory bank files in `.kilocode/rules/memory-bank/` for additional context.*

**Project Status**: Phase 1 - Project Initialization  
**Last Updated**: 2026-02-01  
**Next Milestone**: Week 1 Complete - Project Setup
