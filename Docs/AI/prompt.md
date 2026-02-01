# AI Development Blueprint: Groucho the Hunter

> **Complete guide for AI systems to develop a Three.js cybersecurity threat hunting FPS/adventure game**

---

## 1. PROJECT IDENTITY

### Game Information
| Attribute | Value |
|-----------|-------|
| **Game Name** | Groucho the Hunter |
| **Genre** | First-Person Shooter / Adventure |
| **Theme** | Cybersecurity Threat Hunting |
| **Platform** | Browser (WebGL/WebGPU) |
| **Engine** | Three.js |

### Main Character: Groucho
- **Role**: The Threat Hunter
- **Appearance**: Friendly green furry monster/cowboy wearing a sheriff's hat with star badge, red bandana, and western-style outfit
- **Reference Image**: [`images/Groucho.png`](images/Groucho.png)
- **Personality**: Approachable yet authoritative, curious, analytical, determined
- **Backstory**: A digital sheriff protecting cyberspace from malicious threats

### Narrative Theme
Groucho is a digital sheriff patrolling the cyber-frontier, hunting down malware, intruders, and digital threats. The game world visualizes abstract cybersecurity concepts as tangible 3D environments where threats appear as monsters, puzzles represent forensic analysis, and victories mean securing the digital realm.

---

## 2. GAME OVERVIEW

### Elevator Pitch
*"Groucho the Hunter" is a browser-based FPS/adventure where players become Groucho, a cyber-sheriff hunting digital threats in immersive 3D environments. Players explore networked worlds, investigate security incidents, and solve cybersecurity puzzles based on real threat hunting techniques—turning complex security analysis into engaging gameplay.*

### Target Audience
- **Primary**: Aspiring cybersecurity professionals (ages 16-30)
- **Secondary**: IT professionals seeking to understand threat hunting
- **Tertiary**: General gamers interested in educational games
- **Prerequisites**: Basic computer literacy; no prior security knowledge required

### Core Gameplay Loop
```
┌─────────────────────────────────────────────────────────────┐
│  EXPLORE → DISCOVER → ANALYZE → SOLVE → ADVANCE → REPEAT   │
└─────────────────────────────────────────────────────────────┘
```

1. **Explore**: Navigate 3D environments (network nodes, server rooms, data centers)
2. **Discover**: Find anomalies, suspicious activities, or threat indicators
3. **Analyze**: Examine logs, network traffic, system artifacts using in-game tools
4. **Solve**: Complete puzzles representing real security analysis tasks
5. **Advance**: Progress through levels, unlock new tools and capabilities
6. **Repeat**: Face increasingly complex threats and scenarios

### Dual Objectives
- **Educational**: Raise cybersecurity awareness by gamifying real-world security analysis
- **Entertainment**: Deliver compelling FPS gameplay with engaging mechanics and progression

---

## 3. CORE MECHANICS

### 3.1 First-Person Movement and Controls

**Movement System:**
- WASD for directional movement (W: forward, S: backward, A: strafe left, D: strafe right)
- Mouse for camera look (PointerLockControls)
- Spacebar for jump
- Shift for sprint (limited stamina)
- E for interact
- Tab for inventory/tools menu
- ESC to pause/release mouse

**Implementation:**
```javascript
// Use THREE.PointerLockControls for FPS camera
// Apply velocity * deltaTime for frame-rate independence
// Implement smooth camera damping for natural feel
// Raycast for collision detection before movement
```

**Collision Detection:**
- Raycast from camera position in movement direction
- Use `three-mesh-bvh` for optimized raycasting against complex geometry
- Minimum 3 rays (center, left, right) for robust collision
- Stop movement at intersection point to prevent wall clipping

### 3.2 Threat Detection Mechanics

**Visual Indicators:**
- **Glowing Particles**: Suspicious network traffic flows
- **Color Coding**: Green (safe) → Yellow (caution) → Red (threat)
- **Scanning Overlay**: Activate scanning tool to highlight anomalies
- **Threat Radar**: Mini-map showing nearby threat locations

**Detection Tools (Progressively Unlocked):**
- **Basic Scanner**: Highlights suspicious objects within range
- **Log Analyzer**: Reveals hidden event logs
- **Network Sniffer**: Visualizes data flows
- **Malware Detector**: Identifies infected files/systems
- **Forensics Kit**: Advanced artifact analysis

### 3.3 Puzzle Types

**Interactive Puzzle System:**
- Approach puzzle object → Press E to activate
- Puzzle UI overlays game view (not full screen)
- Time pressure optional based on difficulty
- Multiple solution paths for complex puzzles

**Puzzle Categories:**
1. **Log Analysis**: Parse timestamped events, identify attack patterns
2. **Network Forensics**: Analyze traffic flows, detect C2 communications
3. **Malware Analysis**: Match signatures, identify malicious behaviors
4. **Anomaly Detection**: Spot outliers in normal traffic patterns
5. **Incident Response**: Contain threats, eradicate malware, restore systems

### 3.4 Progression System

**Experience Points (XP):**
- Solve puzzles: +50-500 XP based on difficulty
- Discover threats: +25 XP per threat
- Complete objectives: +100-1000 XP
- Time bonuses: Additional XP for fast completion

**Level Progression:**
- Level 1: 0-1,000 XP (Security Awareness)
- Level 2: 1,001-3,000 XP (Security Analyst)
- Level 3: 3,001-6,000 XP (Threat Hunter)
- Level 4: 6,001+ XP (Security Expert)

**Unlockables:**
- New tools and scanning capabilities
- Cosmetic upgrades for Groucho
- Bonus levels and challenge modes
- Achievement badges

---

## 4. TECHNICAL SPECIFICATIONS

### 4.1 Core Engine: Three.js

**Version Requirements:**
- Three.js r171+ (WebGPU production-ready)
- Modern browsers: Chrome 113+, Firefox 118+, Safari 17+

**Renderer Setup:**
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

**Scene Structure:**
```
src/
├── core/
│   ├── Game.js           # Main game controller
│   ├── SceneManager.js   # Scene loading/unloading
│   └── Renderer.js       # WebGPU/WebGL renderer setup
├── player/
│   ├── Player.js         # Player state and controls
│   ├── Camera.js         # FPS camera system
│   └── Controls.js       # Input handling
├── world/
│   ├── Level.js          # Level base class
│   ├── Environment.js    # Static world geometry
│   └── Interactables.js  # Interactive objects
├── puzzles/
│   ├── PuzzleBase.js     # Base puzzle class
│   ├── LogAnalysis.js    # Log analysis puzzles
│   ├── NetworkForensics.js
│   ├── MalwareAnalysis.js
│   └── AnomalyDetection.js
├── ui/
│   ├── HUD.js            # Heads-up display
│   ├── PuzzleUI.js       # Puzzle interfaces
│   └── Menu.js           # Main/pause menus
└── audio/
    ├── AudioManager.js   # Spatial audio controller
    └── SoundEffects.js   # SFX library
```

### 4.2 Performance Targets

**Render Performance:**
- **Target FPS**: 60fps on mid-range hardware
- **Draw Calls**: < 100 per frame
- **Poly Count**: < 100,000 triangles per scene
- **Texture Memory**: < 256MB VRAM usage

**Optimization Techniques:**

1. **Instancing** (`InstancedMesh`):
   - Use for repeated objects (servers, particles, props)
   - Reduces 1,000 draw calls to 1

2. **BatchedMesh** (r156+):
   - Combine multiple geometries sharing materials
   - Single draw call for varied meshes

3. **LOD (Level of Detail)**:
   - High poly: < 10 meters from camera
   - Medium poly: 10-30 meters
   - Low poly: > 30 meters

4. **Material Sharing**:
   - Reuse materials across meshes for automatic batching
   - Limit unique materials to < 50 per scene

5. **Frustum Culling**:
   - Three.js automatic; ensure proper bounding boxes

6. **Shadow Optimization**:
   - Maximum 3 active lights with shadows
   - Shadow map size: 1024-2048 (desktop), 512-1024 (mobile)
   - Use `renderer.shadowMap.autoUpdate = false` for static scenes

### 4.3 Asset Optimization

**Geometry Compression (Draco):**
- Compress all GLTF/GLB models with Draco
- Expected compression: 90-95% size reduction
- Runtime decompression via `DRACOLoader`

```javascript
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
const dracoLoader = new DRACOLoader();
dracoLoader.setDecoderPath('/draco/');
gltfLoader.setDRACOLoader(dracoLoader);
```

**Texture Compression (KTX2):**
- Use KTX2 for all textures
- **UASTC**: High quality (normal maps, hero textures)
- **ETC1S**: Smaller files (environment, secondary assets)
- Expected VRAM reduction: ~10x vs PNG/JPEG

```javascript
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
const ktx2Loader = new KTX2Loader();
ktx2Loader.setTranscoderPath('/basis/');
```

**Texture Guidelines:**
| Texture Type | Max Resolution | Format |
|--------------|----------------|--------|
| Hero/Character | 2048x2048 | KTX2 UASTC |
| Environment | 1024x1024 | KTX2 ETC1S |
| UI/Icons | 256x256 | PNG (lossless) |
| Lightmaps | 1024x1024 | KTX2 ETC1S |

**Audio Optimization:**
- Format: OGG Vorbis (primary), MP3 (fallback)
- Bitrate: 128kbps for music, 96kbps for SFX
- Preload critical audio; stream background music

### 4.4 Memory Management

**Disposal Requirements:**
```javascript
// Always dispose when removing objects
geometry.dispose();
material.dispose();
texture.dispose();

// Special handling for ImageBitmap
texture.source.data.close?.();
```

**Object Pooling:**
- Pool frequently created/destroyed objects (particles, projectiles)
- Reuse arrays and objects; avoid garbage collection spikes

**Monitoring:**
```javascript
// Check memory stats
console.log(renderer.info.memory);
// textures: should stay stable
// geometries: should stay stable
```

### 4.5 Browser Compatibility

**Required Features:**
- WebGL 2.0 (baseline)
- WebGPU (preferred, with fallback)
- Pointer Lock API
- Fullscreen API
- ES6+ JavaScript

**Feature Detection:**
```javascript
// Check WebGPU support
if (navigator.gpu) {
    // Use WebGPU renderer
} else {
    // Fall back to WebGL2
}
```

---

## 5. VISUAL & AUDIO DESIGN

### 5.1 Visual Aesthetic: Cyberpunk Digital Frontier

**Art Direction:**
- **Theme**: Digital Wild West - cowboys meets cyberspace
- **Mood**: Mysterious yet approachable; neon-lit data centers
- **Color Palette**: 
  - Primary: Deep blues (#0a1628), electric cyan (#00d4ff)
  - Secondary: Warm amber (#ff9500), alert red (#ff3366)
  - Accents: Matrix green (#00ff88), clean white (#ffffff)

**Environment Design:**
- **Server Rooms**: Rows of blinking server racks, cable pathways
- **Network Nodes**: Floating platforms connected by data streams
- **Security Operations Center**: Wall of monitors, holographic displays
- **Digital Void**: Abstract spaces representing deleted/corrupted data

**Visual Metaphors for Security Concepts:**

| Security Concept | Visual Representation |
|------------------|----------------------|
| Network Traffic | Flowing particle streams between nodes |
| Encrypted Data | Glowing, locked containers |
| Malware | Corrupted, glitching geometry |
| Firewalls | Energy barriers, force fields |
| Vulnerabilities | Cracks, exposed wiring |
| System Health | Color-coded status lights |
| Data Exfiltration | Data particles leaving through holes |
| Authentication | Keyholes, biometric scanners |

**Post-Processing Effects:**
```javascript
// Recommended effects (pmndrs/postprocessing)
- Bloom: Selective glow on active elements (threshold: 0.8)
- Vignette: Cinematic framing (darkness: 0.5)
- Chromatic Aberration: Glitch effects during malware encounters (offset: 0.003)
- Scanlines: Retro terminal aesthetic for UI elements
- Fog: Depth and atmosphere (density: 0.02)
```

**Lighting Strategy:**
- **Maximum 3 active lights** per scene for performance
- **Baked Lightmaps** for static environments (free at runtime)
- **Point Lights** with shadows only for dynamic objects
- **Environment Map** (HDRI) for realistic ambient lighting

### 5.2 Audio Design: 3D Spatial Audio

**Audio System Setup:**
```javascript
// Attach listener to camera
const listener = new THREE.AudioListener();
camera.add(listener);

// Spatial audio source
const sound = new THREE.PositionalAudio(listener);
sound.setRefDistance(10);  // Audible within 10 units
sound.setMaxDistance(100); // Fades to silence at 100 units
sound.setDistanceModel('inverse');
mesh.add(sound);
```

**Audio Categories:**

1. **Ambient Audio**:
   - Server room hum (low-frequency loop)
   - Data flow sounds (whooshing streams)
   - Electronic buzzing and beeps

2. **Interactive SFX**:
   - Footsteps on metal/grating
   - Scanner activation (startup beep + scan loop)
   - Puzzle success/failure sounds
   - Object interaction clicks

3. **Threat Audio**:
   - Malware growls/corruption sounds
   - Alert klaxons for detected threats
   - C2 communication (encrypted chatter)

4. **Music**:
   - Exploration: Ambient electronic, 60-80 BPM
   - Puzzle: Focused, minimal beats
   - Threat: Intense, 120+ BPM with tension
   - Victory: Uplifting resolution

**Spatial Audio Guidelines:**
- Position audio sources at visual object locations
- Use distance attenuation for realism
- Limit simultaneous positional sources to 8-10
- Preload critical audio; stream ambient tracks

---

## 6. PUZZLE TYPES

### 6.1 Log Analysis Puzzles

**Core Concept**: Parse system logs to identify attack patterns

**Gameplay:**
- Player finds log terminals in the environment
- Logs display timestamped events (login attempts, file access, process execution)
- Identify suspicious patterns: repeated failures, unusual times, privilege escalation

**Example Puzzle:**
```
[10:42:15] User admin logged in from 192.168.1.50
[10:42:20] Failed login attempt from 192.168.1.99
[10:42:21] Failed login attempt from 192.168.1.99
[10:42:22] Failed login attempt from 192.168.1.99
[10:42:25] User root logged in from 192.168.1.99  ← SUSPICIOUS
[10:42:30] File /etc/passwd accessed by root
[10:42:35] New user 'backdoor' created by root
```

**Mechanics:**
- Click to highlight suspicious entries
- Drag to connect related events
- Submit hypothesis for scoring
- Hints available (cost: time penalty)

**Visual Design:**
- Terminal aesthetic: Monospace font, green/cyan text
- Animated scrolling
- Highlight effects on selection
- Timeline visualization

### 6.2 Network Traffic Analysis

**Core Concept**: Analyze network flows to detect malicious communications

**Gameplay:**
- Activate network sniffer tool
- Visual representation: flowing particles between nodes
- Identify: Command & Control (C2), data exfiltration, lateral movement

**Visual Representation:**
- Nodes = Servers/workstations (spheres or cubes)
- Connections = Data flows (animated lines/particles)
- Color coding by protocol (HTTP=blue, DNS=yellow, encrypted=green)
- Suspicious flows pulse red or have erratic patterns

**Example Puzzle:**
```
Node A (Workstation) → Node B (Server): Normal traffic, steady flow
Node B (Server) → External IP (Unknown): Large data transfer, after hours
Node C (Workstation) → Node D (Workstation): Unusual, lateral movement
```

**Mechanics:**
- Click nodes to inspect traffic statistics
- Filter by protocol, time, data volume
- Mark suspicious connections
- Trace attack path from entry to exfiltration

### 6.3 Malware Signature Matching

**Core Concept**: Identify malware by matching behavioral patterns and file signatures

**Gameplay:**
- Player finds suspicious files in the environment
- File analysis interface shows: file hash, strings, API calls, behavior
- Match against known malware signatures

**Example Puzzle:**
```
FILE: invoice.pdf.exe  ← Suspicious double extension
Hash: d41d8cd98f00b204e9800998ecf8427e

Strings found:
- "CreateRemoteThread"
- "WSAStartup"  ← Network functionality
- "RegSetValueEx"  ← Registry manipulation
- "cmd.exe /c powershell -enc..."

Behavior observed:
- Creates process: powershell.exe
- Connects to: 185.220.101.42:443
- Modifies: HKLM\Software\Microsoft\Windows\CurrentVersion\Run

SIGNATURE MATCH: Trojan.Dropper (95% confidence)
```

**Mechanics:**
- Click to inspect file properties
- String search with highlighting
- Pattern matching mini-game
- Quarantine/delete infected files

### 6.4 Anomaly Detection

**Core Concept**: Identify outliers in normal system behavior

**Gameplay:**
- Baseline "normal" behavior is established
- Player monitors real-time metrics
- Detect deviations from baseline

**Metrics Tracked:**
- CPU/Memory usage
- Network bandwidth
- Login frequency
- File access patterns
- Process execution

**Visual Representation:**
- Real-time graphs (line charts, heat maps)
- Normal zone shaded green
- Anomalies highlighted in red
- Radar charts for multi-dimensional data

**Example Puzzle:**
```
Normal baseline:
- Logins: 50-100/hour during business hours
- Network: 10-50 MB/hour
- CPU: 20-40% average

Current readings:
- Logins: 2,500/hour (50x spike) ← ANOMALY
- Network: 800 MB/hour (16x spike) ← ANOMALY
- CPU: 85% sustained ← ANOMALY

DIAGNOSIS: Likely brute force attack with data exfiltration
```

**Mechanics:**
- Set threshold sensitivity
- Click anomalies to investigate
- Correlate multiple anomalies
- Generate incident report

### 6.5 Incident Response Scenarios

**Core Concept**: Respond to active security incidents in real-time

**Gameplay:**
- Multi-stage scenarios simulating real incidents
- Time pressure increases tension
- Decisions affect outcome

**Phases:**
1. **Detection**: Identify the incident type and scope
2. **Containment**: Isolate affected systems
3. **Eradication**: Remove threat (malware, backdoors)
4. **Recovery**: Restore systems to normal operation
5. **Lessons Learned**: Review actions, identify improvements

**Example Scenario: Ransomware Attack**
```
ALERT: Multiple files encrypted on file server!

Phase 1 - DETECT:
- Identify patient zero (first infected system)
- Determine ransomware variant
- Assess spread (which systems affected?)

Phase 2 - CONTAIN:
- Isolate infected systems from network
- Block C2 communications at firewall
- Disable compromised accounts

Phase 3 - ERADICATE:
- Remove ransomware binaries
- Clean registry entries
- Patch vulnerability used for entry

Phase 4 - RECOVER:
- Restore from clean backups
- Verify integrity of restored data
- Monitor for reinfection

Phase 5 - DOCUMENT:
- Timeline of events
- Actions taken
- Recommendations for prevention
```

**Mechanics:**
- Choose from response options
- Each choice has consequences
- Score based on speed and effectiveness
- Unlock playbooks for future incidents

---

## 7. LEVEL STRUCTURE

### 7.1 Overview: 4 Main Levels

Each level represents a career stage in cybersecurity, progressively introducing concepts and tools.

### 7.2 Level 1: Security Awareness (Beginner)

**Theme**: Introduction to the Digital Frontier
**XP Range**: 0-1,000
**Estimated Playtime**: 30-45 minutes

**Learning Objectives:**
- Understand basic security concepts
- Recognize common attack vectors
- Learn to identify suspicious activities

**Environment**: 
- Tutorial zone: Groucho's Sheriff Office
- Outskirts of Network Town
- Simple, brightly lit areas

**Puzzles:**
1. **Tutorial**: Movement, interaction, basic scanning
2. **Phishing Hunt**: Find suspicious emails (visual indicators)
3. **Password Strength**: Identify weak passwords
4. **USB Drop**: Find and secure unattended USB drives

**Tools Unlocked:**
- Basic Scanner
- Threat Encyclopedia (reference guide)

**Boss Challenge**: Identify and report 5 security violations in a simulated office environment

### 7.3 Level 2: Security Analyst (Intermediate)

**Theme**: The SIEM Operations Center
**XP Range**: 1,001-3,000
**Estimated Playtime**: 45-60 minutes

**Learning Objectives:**
- Log analysis fundamentals
- Network traffic basics
- Incident response procedures
- SIEM tool usage

**Environment**:
- Security Operations Center (SOC)
- Server rooms with blinking lights
- Network topology visualization room

**Puzzles:**
1. **SIEM Alert Triage**: Sort and prioritize security alerts
2. **Log Timeline**: Reconstruct attack sequence from logs
3. **Network Map**: Trace suspicious traffic paths
4. **False Positive**: Distinguish real threats from noise
5. **First Response**: Initial incident containment

**Tools Unlocked:**
- Log Analyzer
- Network Sniffer
- Alert Manager

**Boss Challenge**: Respond to a simulated DDoS attack in real-time

### 7.4 Level 3: Threat Hunter (Advanced)

**Theme**: The Deep Net - Hunting APTs
**XP Range**: 3,001-6,000
**Estimated Playtime**: 60-90 minutes

**Learning Objectives:**
- Hypothesis-driven hunting
- Advanced forensics techniques
- MITRE ATT&CK framework
- Persistence mechanism detection

**Environment**:
- Dark, complex network architecture
- Hidden backdoors and covert channels
- Malware analysis laboratory

**Puzzles:**
1. **Hypothesis Formation**: Develop hunting hypotheses from threat intel
2. **Persistence Hunt**: Find backdoors and implants
3. **Lateral Movement**: Trace attacker's path through network
4. **C2 Detection**: Identify command and control infrastructure
5. **Memory Forensics**: Analyze RAM dump for malware artifacts
6. **ATT&CK Mapping**: Match observed behaviors to MITRE techniques

**Tools Unlocked:**
- Memory Forensics Kit
- Malware Sandbox
- Threat Intelligence Portal
- Advanced Scanner (detects rootkits)

**Boss Challenge**: Hunt and eradicate an APT that has been resident for 200+ days

### 7.5 Level 4: Security Expert (Master)

**Theme**: The Global Cyberwar
**XP Range**: 6,001+
**Estimated Playtime**: 90+ minutes

**Learning Objectives:**
- Complex multi-stage attack analysis
- Supply chain attack detection
- Zero-day vulnerability handling
- Strategic threat hunting

**Environment**:
- Global network map
- Multiple organizations under attack
- Time-critical scenarios

**Puzzles:**
1. **Supply Chain Poisoning**: Identify compromised software updates
2. **Zero-Day Exploitation**: Analyze unknown vulnerability
3. **Multi-Tenant Breach**: Coordinate response across organizations
4. **Insider Threat**: Distinguish malicious from compromised insider
5. **Nation-State Attribution**: Analyze TTPs for threat actor identification
6. **Crisis Management**: Prioritize limited resources during major incident

**Tools Unlocked:**
- Reverse Engineering Suite
- Attribution Database
- Crisis Management Dashboard

**Boss Challenge**: Coordinate defense against a simulated cyberwarfare scenario affecting critical infrastructure

### 7.6 Bonus Content

**Challenge Modes** (Unlock after completing Level 2):
- **Speed Run**: Complete puzzles with time limits
- **Ironman**: No hints, single attempt per puzzle
- **Daily Hunt**: New randomly generated threat scenarios

**Sandbox Mode**:
- Create custom scenarios
- Share with community
- Practice specific techniques

---

## 8. IMPLEMENTATION PHASES

### Phase 1: Core Engine and Player Controls (Weeks 1-3)

**Goals:**
- Set up Three.js project with WebGPU/WebGL fallback
- Implement FPS camera and movement controls
- Basic collision detection
- Scene loading system

**Deliverables:**
- [ ] Project structure with build pipeline (Vite recommended)
- [ ] Renderer initialization with WebGPU fallback
- [ ] `PointerLockControls` integrated
- [ ] WASD + mouse movement with collision
- [ ] Basic test level (simple room)
- [ ] Loading screen

**Technical Tasks:**
```
1. Initialize Three.js project
2. Set up WebGPU renderer with WebGL2 fallback
3. Implement player controller with PointerLockControls
4. Add raycast-based collision detection
5. Create scene manager for level loading
6. Add basic UI (crosshair, FPS counter)
```

**Success Criteria:**
- 60fps on target hardware
- Smooth movement without clipping
- Clean code structure for extensibility

### Phase 2: First Level and Basic Puzzles (Weeks 4-6)

**Goals:**
- Build Level 1 environment (Sheriff Office + Tutorial Zone)
- Implement 3 basic puzzle types
- Add threat detection mechanics
- Create tool system

**Deliverables:**
- [ ] Level 1 3D environment
- [ ] Interactive objects system
- [ ] Log analysis puzzle mini-game
- [ ] Phishing detection puzzle
- [ ] Basic Scanner tool
- [ ] XP and progression system
- [ ] Save/load game state

**Technical Tasks:**
```
1. Model/texture Level 1 environment
2. Create interactable base class
3. Implement LogAnalysis puzzle UI
4. Implement PhishingHunt puzzle UI
5. Create Tool system with unlock progression
6. Build XP and leveling system
7. Add localStorage for save games
```

**Success Criteria:**
- Complete Level 1 playable from start to finish
- 3 working puzzle types
- Progression saves correctly

### Phase 3: Additional Levels (Weeks 7-10)

**Goals:**
- Build Levels 2, 3, and 4
- Implement all puzzle types
- Add advanced tools
- Create boss challenges

**Deliverables:**
- [ ] Level 2: SOC environment + SIEM puzzles
- [ ] Level 3: Deep Net + forensics puzzles
- [ ] Level 4: Global Net + expert puzzles
- [ ] All 5 puzzle types fully implemented
- [ ] Boss challenge system
- [ ] Advanced tools (Memory Forensics, Sandbox, etc.)

**Technical Tasks:**
```
1. Design and build Level 2 environment
2. Implement NetworkTraffic puzzle
3. Implement AnomalyDetection puzzle
4. Design and build Level 3 environment
5. Implement MalwareAnalysis puzzle
6. Implement IncidentResponse scenarios
7. Design and build Level 4 environment
8. Create boss challenge framework
9. Add all advanced tools
```

**Success Criteria:**
- All 4 levels playable
- All puzzle types functional
- Boss challenges provide satisfying conclusion to each level

### Phase 4: Polish and Deployment (Weeks 11-12)

**Goals:**
- Audio integration
- Visual polish and effects
- Performance optimization
- Docker deployment

**Deliverables:**
- [ ] 3D spatial audio system
- [ ] Soundtrack and SFX
- [ ] Post-processing effects (bloom, vignette)
- [ ] Performance pass (target < 100 draw calls)
- [ ] Asset optimization (Draco, KTX2)
- [ ] Docker containerization
- [ ] Documentation

**Technical Tasks:**
```
1. Implement AudioManager with spatial audio
2. Create/add sound effects for all interactions
3. Compose/procure background music
4. Add post-processing pipeline
5. Performance audit and optimization
6. Compress all assets with Draco/KTX2
7. Create Dockerfile and nginx config
8. Write deployment documentation
```

**Success Criteria:**
- Consistent 60fps performance
- Audio enhances gameplay experience
- Deployable via Docker
- Code documented

---

## 9. DEPLOYMENT

### 9.1 Docker Containerization

**Dockerfile:**
```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**nginx.conf:**
```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ktx2|glb)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 9.2 Build Configuration

**Vite Configuration (vite.config.js):**
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
    base: '/',
    build: {
        outDir: 'dist',
        assetsDir: 'assets',
        sourcemap: true,
        rollupOptions: {
            output: {
                manualChunks: {
                    three: ['three'],
                    vendor: ['@pmndrs/postprocessing']
                }
            }
        }
    },
    server: {
        headers: {
            'Cross-Origin-Opener-Policy': 'same-origin',
            'Cross-Origin-Embedder-Policy': 'require-corp'
        }
    }
});
```

### 9.3 Deployment Commands

**Build and run locally:**
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```

**Docker deployment:**
```bash
# Build Docker image
docker build -t groucho-the-hunter .

# Run container
docker run -p 8080:80 groucho-the-hunter

# Access game at http://localhost:8080
```

**Docker Compose (optional):**
```yaml
version: '3.8'
services:
  groucho:
    build: .
    ports:
      - "8080:80"
    restart: unless-stopped
```

### 9.4 Hosting Requirements

**Server Requirements:**
- Static file hosting only (no server-side processing required)
- HTTPS support (required for Pointer Lock API)
- Gzip/Brotli compression enabled
- HTTP/2 support recommended

**CDN Integration:**
- Serve assets from CDN for global performance
- Cache static assets aggressively (1 year)
- Use immutable filenames for cache busting

### 9.5 Performance Checklist for Production

- [ ] All assets compressed (Draco geometry, KTX2 textures)
- [ ] Code split into chunks (Three.js separate from game code)
- [ ] Tree-shaking enabled (remove unused Three.js modules)
- [ ] Lazy load non-critical assets
- [ ] Preload critical assets (hero character, Level 1)
- [ ] Service worker for offline play (optional)
- [ ] Analytics integration (optional)

---

## 10. QUICK REFERENCE

### File Structure
```
groucho-the-hunter/
├── public/
│   ├── assets/
│   │   ├── models/          # GLB/GLTF files (Draco compressed)
│   │   ├── textures/        # KTX2 textures
│   │   ├── audio/           # OGG/MP3 files
│   │   └── fonts/           # Web fonts
│   ├── draco/               # Draco decoder
│   └── basis/               # KTX2 transcoder
├── src/
│   ├── core/                # Engine components
│   ├── player/              # Player systems
│   ├── world/               # Level/environment
│   ├── puzzles/             # Puzzle implementations
│   ├── ui/                  # Interface components
│   ├── audio/               # Audio systems
│   └── utils/               # Helper functions
├── index.html
├── package.json
├── vite.config.js
└── Dockerfile
```

### Key Dependencies
```json
{
  "dependencies": {
    "three": "^0.171.0",
    "three-mesh-bvh": "^0.8.0"
  },
  "devDependencies": {
    "vite": "^6.0.0"
  }
}
```

### Performance Budgets
| Metric | Target | Maximum |
|--------|--------|---------|
| Initial Load | < 3s | < 5s |
| Draw Calls | < 50 | < 100 |
| VRAM Usage | < 128MB | < 256MB |
| JS Bundle | < 500KB | < 1MB |
| FPS | 60 | 30 (minimum) |

### External Resources
- **Three.js Documentation**: https://threejs.org/docs/
- **WebGPU Guide**: https://threejs.org/manual/#en/webgpu
- **MITRE ATT&CK**: https://attack.mitre.org/
- **Draco Compression**: https://google.github.io/draco/
- **KTX2 Format**: https://github.com/KhronosGroup/KTX-Software

---

## APPENDIX: THREAT HUNTING CONCEPTS REFERENCE

### MITRE ATT&CK Tactics (14 Phases)
1. **Reconnaissance**: Information gathering about target
2. **Resource Development**: Acquiring infrastructure and tools
3. **Initial Access**: First entry into target network
4. **Execution**: Running malicious code
5. **Persistence**: Maintaining access over time
6. **Privilege Escalation**: Gaining higher-level permissions
7. **Defense Evasion**: Avoiding detection
8. **Credential Access**: Stealing account credentials
9. **Discovery**: Exploring network and systems
10. **Lateral Movement**: Moving between systems
11. **Collection**: Gathering data of interest
12. **Command and Control**: Communicating with attacker
13. **Exfiltration**: Stealing data from network
14. **Impact**: Disrupting availability or compromising integrity

### Cyber Kill Chain (7 Stages)
1. **Reconnaissance**: Research and target identification
2. **Weaponization**: Creating exploit/malware payload
3. **Delivery**: Transmitting payload to target
4. **Exploitation**: Triggering vulnerability
5. **Installation**: Establishing persistence
6. **Command & Control**: Remote control channel
7. **Actions on Objectives**: Achieving attack goals

### Common Attack Types
| Attack Type | Description | Visual Metaphor |
|-------------|-------------|-----------------|
| **Phishing** | Deceptive emails/credential theft | Fake treasure chests, decoy doors |
| **Malware** | Viruses, trojans, ransomware | Corrupted, glitching creatures |
| **DDoS** | Distributed denial of service | Traffic flood overwhelming pathways |
| **SQL Injection** | Database manipulation | Rewriting signs and labels |
| **Man-in-the-Middle** | Intercepting communications | Shadowy figures between nodes |
| **Privilege Escalation** | Gaining admin access | Unlocking restricted areas |
| **Lateral Movement** | Spreading through network | Teleporting between zones |
| **Data Exfiltration** | Stealing sensitive data | Data packets leaving through holes |

### Security Tools Visualized
| Tool | Real Function | In-Game Representation |
|------|---------------|------------------------|
| **SIEM** | Log aggregation/analysis | Central command center console |
| **EDR** | Endpoint detection/response | Scanner device, threat radar |
| **Wireshark** | Packet analyzer | X-ray vision for data flows |
| **YARA** | Malware signature matching | Pattern matching mini-game |
| **Volatility** | Memory forensics | Memory crystal examination |
| **Splunk/ELK** | Log analysis platform | Interactive log terminals |
| **VirusTotal** | Multi-engine scanning | Analysis laboratory station |
| **Nmap** | Network scanning | Area mapping, revealing hidden paths |

---

**END OF BLUEPRINT**

*This document serves as the complete specification for AI systems developing "Groucho the Hunter". All sections should be implemented according to the technical specifications and design guidelines provided.*

---

**Document Version**: 1.0
**Last Updated**: 2026-02-01
**Project**: Groucho the Hunter
**Purpose**: AI Development Blueprint
**Status**: Complete

**Key Success Factors:**
1. Maintain 60fps performance target
2. Ensure puzzles are educational yet engaging
3. Balance visual complexity with browser compatibility
4. Progressive difficulty that teaches real concepts
5. Docker deployment for easy hosting

**For AI Developers:**
- Follow the implementation phases sequentially
- Reference the research document at `Docs/research.md` for additional technical details
- Use the Groucho character image at `images/Groucho.png` for character modeling reference
- Test on multiple browsers and hardware configurations
- Document all code thoroughly for future maintenance

*Happy Hunting!* 🤠🎯🔒
</parameter name="old_string">
<parameter name="new_string">
### External Resources
- **Three.js Documentation**: https://threejs.org/docs/
- **WebGPU Guide**: https://threejs.org/manual/#en/webgpu
- **MITRE ATT&CK**: https://attack.mitre.org/
- **Draco Compression**: https://google.github.io/draco/
- **KTX2 Format**: https://github.com/KhronosGroup/KTX-Software

---

## APPENDIX: THREAT HUNTING CONCEPTS REFERENCE

### MITRE ATT&CK Tactics (14 Phases)
1. **Reconnaissance**: Information gathering about target
2. **Resource Development**: Acquiring infrastructure and tools
3. **Initial Access**: First entry into target network
4. **Execution**: Running malicious code
5. **Persistence**: Maintaining access over time
6. **Privilege Escalation**: Gaining higher-level permissions
7. **Defense Evasion**: Avoiding detection
8. **Credential Access**: Stealing account credentials
9. **Discovery**: Exploring network and systems
10. **Lateral Movement**: Moving between systems
11. **Collection**: Gathering data of interest
12. **Command and Control**: Communicating with attacker
13. **Exfiltration**: Stealing data from network
14. **Impact**: Disrupting availability or compromising integrity

### Cyber Kill Chain (7 Stages)
1. **Reconnaissance**: Research and target identification
2. **Weaponization**: Creating exploit/malware payload
3. **Delivery**: Transmitting payload to target
4. **Exploitation**: Triggering vulnerability
5. **Installation**: Establishing persistence
6. **Command & Control**: Remote control channel
7. **Actions on Objectives**: Achieving attack goals

### Common Attack Types
| Attack Type | Description | Visual Metaphor |
|-------------|-------------|-----------------|
| **Phishing** | Deceptive emails/credential theft | Fake treasure chests, decoy doors |
| **Malware** | Viruses, trojans, ransomware | Corrupted, glitching creatures |
| **DDoS** | Distributed denial of service | Traffic flood overwhelming pathways |
| **SQL Injection** | Database manipulation | Rewriting signs and labels |
| **Man-in-the-Middle** | Intercepting communications | Shadowy figures between nodes |
| **Privilege Escalation** | Gaining admin access | Unlocking restricted areas |
| **Lateral Movement** | Spreading through network | Teleporting between zones |
| **Data Exfiltration** | Stealing sensitive data | Data packets leaving through holes |

### Security Tools Visualized
| Tool | Real Function | In-Game Representation |
|------|---------------|------------------------|
| **SIEM** | Log aggregation/analysis | Central command center console |
| **EDR** | Endpoint detection/response | Scanner device, threat radar |
| **Wireshark** | Packet analyzer | X-ray vision for data flows |
| **YARA** | Malware signature matching | Pattern matching mini-game |
| **Volatility** | Memory forensics | Memory crystal examination |
| **Splunk/ELK** | Log analysis platform | Interactive log terminals |
| **VirusTotal** | Multi-engine scanning | Analysis laboratory station |
| **Nmap** | Network scanning | Area mapping, revealing hidden paths |

---

**END OF BLUEPRINT**

*This document serves as the complete specification for AI systems developing "Groucho the Hunter". All sections should be implemented according to the technical specifications and design guidelines provided.*

---

**Document Version**: 1.0
**Last Updated**: 2026-02-01
**Project**: Groucho the Hunter
**Purpose**: AI Development Blueprint
**Status**: Complete

**Key Success Factors:**
1. Maintain 60fps performance target
2. Ensure puzzles are educational yet engaging
3. Balance visual complexity with browser compatibility
4. Progressive difficulty that teaches real concepts
5. Docker deployment for easy hosting

**For AI Developers:**
- Follow the implementation phases sequentially
- Reference the research document at `Docs/research.md` for additional technical details
- Use the Groucho character image at `images/Groucho.png` for character modeling reference
- Test on multiple browsers and hardware configurations
- Document all code thoroughly for future maintenance

*Happy Hunting!* 🤠🎯🔒
</parameter name="new_string">
</invoke>