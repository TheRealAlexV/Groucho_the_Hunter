/**
 * Game Controller - Core game management singleton
 * Handles initialization, game loop, and high-level state management
 * Integrates Renderer, SceneManager, GameLoop, and supporting systems
 * @module core/Game
 */

'use strict';

import * as THREE from 'three';
import { GAME_STATES, RENDERING, DEBUG } from '../utils/Constants.js';
import { EventBus, GAME_EVENTS } from '../utils/EventBus.js';
import { Renderer } from './Renderer.js';
import { SceneManager } from './SceneManager.js';
import { GameLoop } from './GameLoop.js';
import { PerformanceMonitor } from '../systems/PerformanceMonitor.js';
import { LoadingScreen } from '../ui/LoadingScreen.js';
import { PlayerController } from '../systems/PlayerController.js';
import { CollisionSystem } from '../systems/CollisionSystem.js';
import { TestLevel } from '../world/levels/TestLevel.js';

/**
 * GameController - Main game management singleton
 * Coordinates all core game systems and manages the game lifecycle
 * @class
 */
export class GameController {
  /** @type {GameController|null} */
  static #instance = null;

  /** @type {Function|null} */
  #resizeHandler = null;

  /**
   * Get singleton instance
   * @returns {GameController|null}
   */
  static getInstance() {
    return GameController.#instance;
  }

  /**
   * Creates a new GameController
   * @param {HTMLElement} container - DOM container for the game canvas
   */
  constructor(container) {
    if (GameController.#instance) {
      console.warn('GameController: Instance already exists, returning existing instance');
      return GameController.#instance;
    }

    GameController.#instance = this;

    this.container = container;
    this.currentState = GAME_STATES.LOADING;

    // Core systems
    this.eventBus = null;
    this.renderer = null;
    this.sceneManager = null;
    this.gameLoop = null;
    this.performanceMonitor = null;
    this.loadingScreen = null;

    // Player systems
    this.playerController = null;
    this.collisionSystem = null;
    this.testLevel = null;
  }

  /**
   * Initialize the game and all core systems
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      DEBUG.ENABLED && console.log('Game: Initializing core systems...');

      // 1. Initialize EventBus first (needed by other systems)
      this.eventBus = EventBus.getInstance();

      // 2. Initialize LoadingScreen
      this.loadingScreen = new LoadingScreen({ eventBus: this.eventBus });
      this.loadingScreen.show('Initializing systems...');
      this.loadingScreen.setProgress(10);

      // 3. Initialize Renderer (WebGPU/WebGL2)
      this.loadingScreen.setProgress(20, 'Initializing renderer...');
      this.renderer = new Renderer(this.container);
      await this.renderer.initialize();

      const isWebGPU = this.renderer.isWebGPU();
      DEBUG.ENABLED && console.log(`Game: Renderer initialized (${isWebGPU ? 'WebGPU' : 'WebGL2'})`);

      // 4. Initialize SceneManager
      this.loadingScreen.setProgress(40, 'Setting up scene manager...');
      this.sceneManager = new SceneManager(this.eventBus);

      // Create main scene
      const mainScene = this.sceneManager.createScene('main', {
        backgroundColor: 0x0a0a0f,
        fog: true,
        fogNear: 10,
        fogFar: 100
      });

      // Create UI scene
      this.sceneManager.createUIScene();

      // Create and set main camera
      const camera = this.sceneManager.createCamera({
        position: { x: 0, y: 1.8, z: 5 }
      });
      this.sceneManager.setCurrentCamera(camera);

      // Set as current scene
      this.sceneManager.switchScene('main', { transition: false });

      DEBUG.ENABLED && console.log('Game: SceneManager initialized');

      // 5. Initialize GameLoop
      this.loadingScreen.setProgress(60, 'Starting game loop...');
      this.gameLoop = new GameLoop({
        eventBus: this.eventBus,
        targetFPS: RENDERING.TARGET_FPS,
        renderFunction: () => this.#render()
      });

      // Register game loop callbacks
      this.gameLoop.onUpdate((deltaTime) => this.#update(deltaTime));

      DEBUG.ENABLED && console.log('Game: GameLoop initialized');

      // 6. Initialize PerformanceMonitor (dev mode only)
      if (DEBUG.ENABLED || DEBUG.SHOW_FPS) {
        this.loadingScreen.setProgress(70, 'Initializing performance monitor...');
        this.performanceMonitor = new PerformanceMonitor({
          eventBus: this.eventBus,
          showOverlay: DEBUG.SHOW_FPS
        });
        await this.performanceMonitor.initialize();

        DEBUG.ENABLED && console.log('Game: PerformanceMonitor initialized');
      }

      // 7. Initialize Collision System
      this.loadingScreen.setProgress(80, 'Initializing collision system...');
      this.collisionSystem = new CollisionSystem();
      DEBUG.ENABLED && console.log('Game: CollisionSystem initialized');

      // 8. Create test level
      this.loadingScreen.setProgress(85, 'Building test level...');
      this.testLevel = new TestLevel({ showWireframe: DEBUG.SHOW_COLLIDERS });
      const levelGroup = this.testLevel.build(this.sceneManager.getCurrentScene());

      // Build collision mesh from level
      this.collisionSystem.buildFromLevel(levelGroup);
      DEBUG.ENABLED && console.log('Game: TestLevel built');

      // 9. Initialize PlayerController
      this.loadingScreen.setProgress(90, 'Initializing player controller...');
      const mainCamera = this.sceneManager.getCurrentCamera();
      const domElement = this.renderer.getCanvas();

      this.playerController = new PlayerController({
        camera: mainCamera,
        domElement: domElement,
        eventBus: this.eventBus,
        collisionSystem: this.collisionSystem
      });

      // Spawn player at level spawn point
      this.playerController.spawn(this.testLevel.getSpawnPoint());
      DEBUG.ENABLED && console.log('Game: PlayerController initialized');

      // 10. Setup window resize handler
      this.#setupResizeHandler();

      // 11. Setup event listeners
      this.#setupEventListeners();

      // 9. Complete initialization
      this.loadingScreen.setProgress(100, 'Ready!');

      // Small delay to show 100% before hiding
      await new Promise(resolve => setTimeout(resolve, 200));
      this.loadingScreen.hide();

      this.currentState = GAME_STATES.MAIN_MENU;

      this.eventBus.emit(GAME_EVENTS.GAME_INIT, {
        webgpu: isWebGPU,
        state: this.currentState
      });

      DEBUG.ENABLED && console.log('Game: Initialization complete');

    } catch (error) {
      console.error('Game: Initialization failed:', error);

      if (this.loadingScreen) {
        this.loadingScreen.setStatus('Error: ' + error.message);
      }

      throw error;
    }
  }

  /**
   * Setup event listeners
   * @private
   */
  #setupEventListeners() {
    // Listen for state change requests
    this.eventBus.on(GAME_EVENTS.STATE_CHANGE, (data) => {
      if (data && data.state) {
        this.setState(data.state);
      }
    });

    // Listen for performance warnings
    this.eventBus.on(GAME_EVENTS.PERF_WARNING, (data) => {
      DEBUG.ENABLED && console.warn('Performance warning:', data);
    });

    this.eventBus.on(GAME_EVENTS.PERF_CRITICAL, (data) => {
      console.error('Performance critical:', data);
    });
  }

  /**
   * Setup window resize handler
   * @private
   */
  #setupResizeHandler() {
    this.#resizeHandler = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Update renderer
      this.renderer.handleResize();

      // Update scene manager cameras
      this.sceneManager.handleResize(width, height);
    };

    window.addEventListener('resize', this.#resizeHandler);
  }

  /**
   * Start the game loop
   */
  start() {
    if (!this.gameLoop) {
      console.error('Game: Cannot start - game loop not initialized');
      return;
    }

    this.gameLoop.start();
    this.currentState = GAME_STATES.PLAYING;

    DEBUG.ENABLED && console.log('Game: Started');
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (this.gameLoop) {
      this.gameLoop.stop();
    }

    this.currentState = GAME_STATES.MAIN_MENU;

    DEBUG.ENABLED && console.log('Game: Stopped');
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.currentState === GAME_STATES.PLAYING) {
      this.gameLoop?.pause();
      this.currentState = GAME_STATES.PAUSED;

      DEBUG.ENABLED && console.log('Game: Paused');
    }
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.currentState === GAME_STATES.PAUSED) {
      this.gameLoop?.resume();
      this.currentState = GAME_STATES.PLAYING;

      DEBUG.ENABLED && console.log('Game: Resumed');
    }
  }

  /**
   * Set game state
   * @param {string} state - New game state
   */
  setState(state) {
    const previousState = this.currentState;
    this.currentState = state;

    this.eventBus.emit(GAME_EVENTS.STATE_CHANGE, {
      previous: previousState,
      current: state
    });

    DEBUG.ENABLED && console.log(`Game: State changed from ${previousState} to ${state}`);
  }

  /**
   * Get current game state
   * @returns {string}
   */
  getState() {
    return this.currentState;
  }

  /**
   * Update game systems
   * @private
   * @param {number} deltaTime - Time since last frame in seconds
   */
  #update(deltaTime) {
    // Begin performance monitoring
    this.performanceMonitor?.beginFrame();

    // Skip updates if not playing
    if (this.currentState !== GAME_STATES.PLAYING) {
      return;
    }

    // Update player controller (handles input, movement, physics)
    this.playerController?.update(deltaTime);

    // TODO: Update other systems here in order:
    // 1. EntityManager
    // 2. AudioManager
    // 3. PuzzleSystem
  }

  /**
   * Render the frame
   * @private
   */
  #render() {
    const scene = this.sceneManager.getCurrentScene();
    const camera = this.sceneManager.getCurrentCamera();

    if (!scene || !camera) return;

    // Render main scene
    this.renderer.render(scene, camera);

    // Render UI scene if needed
    const uiScene = this.sceneManager.getUIScene();
    const uiCamera = this.sceneManager.getUICamera();

    if (uiScene && uiCamera) {
      // Note: For proper UI rendering, we'd use a second render pass or overlay
      // For now, we render the main scene only
    }

    // End performance monitoring
    if (this.performanceMonitor) {
      const renderInfo = this.renderer.getInfo();
      this.performanceMonitor.endFrame(renderInfo);
    }
  }

  /**
   * Handle window resize
   * @param {number} width - New window width
   * @param {number} height - New window height
   */
  handleResize(width, height) {
    // Handled by the resize event listener
    this.#resizeHandler?.();
  }

  /**
   * Create a test cube for debugging
   * @param {Object} options - Cube options
   */
  createTestCube(options = {}) {
    const scene = this.sceneManager.getCurrentScene();
    if (!scene) return;

    const geometry = new THREE.BoxGeometry(
      options.size || 1,
      options.size || 1,
      options.size || 1
    );

    const material = new THREE.MeshStandardMaterial({
      color: options.color || 0x00ff88,
      emissive: options.emissive || 0x004400,
      roughness: 0.5,
      metalness: 0.1
    });

    const cube = new THREE.Mesh(geometry, material);
    cube.name = 'testCube';
    cube.position.set(
      options.x || 0,
      options.y || 0.5,
      options.z || 0
    );
    cube.castShadow = true;
    cube.receiveShadow = true;

    scene.add(cube);

    DEBUG.ENABLED && console.log('Game: Test cube created');

    return cube;
  }

  /**
   * Show the loading screen
   * @param {string} [message] - Loading message
   */
  showLoading(message) {
    this.loadingScreen?.show(message);
  }

  /**
   * Hide the loading screen
   */
  hideLoading() {
    this.loadingScreen?.hide();
  }

  /**
   * Update loading progress
   * @param {number} progress - Progress value (0-100)
   * @param {string} [message] - Status message
   */
  setLoadingProgress(progress, message) {
    this.loadingScreen?.setProgress(progress, message);
  }

  /**
   * Get performance statistics
   * @returns {Object|null}
   */
  getPerformanceStats() {
    return this.performanceMonitor?.getStats() || null;
  }

  /**
   * Check if using WebGPU
   * @returns {boolean}
   */
  isWebGPU() {
    return this.renderer?.isWebGPU() || false;
  }

  /**
   * Dispose of all game resources
   */
  dispose() {
    DEBUG.ENABLED && console.log('Game: Disposing...');

    // Stop game loop
    this.gameLoop?.dispose();
    this.gameLoop = null;

    // Remove resize listener
    if (this.#resizeHandler) {
      window.removeEventListener('resize', this.#resizeHandler);
      this.#resizeHandler = null;
    }

    // Dispose systems
    this.playerController?.dispose();
    this.playerController = null;

    this.testLevel?.dispose();
    this.testLevel = null;

    this.collisionSystem?.dispose();
    this.collisionSystem = null;

    this.performanceMonitor?.dispose();
    this.performanceMonitor = null;

    this.loadingScreen?.dispose();
    this.loadingScreen = null;

    this.sceneManager?.dispose();
    this.sceneManager = null;

    this.renderer?.dispose();
    this.renderer = null;

    // Clear event bus
    this.eventBus?.dispose();
    this.eventBus = null;

    // Clear singleton
    GameController.#instance = null;

    DEBUG.ENABLED && console.log('Game: Disposed');
  }
}
