/**
 * Game Controller - Core game management singleton
 * Handles initialization, game loop, and high-level state management
 * @module core/Game
 */

'use strict';

import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { GAME_STATES, RENDERING, DEBUG } from '../utils/Constants.js';

/**
 * GameController - Main game management singleton
 * @class
 */
export class GameController {
  /** @type {GameController|null} */
  static #instance = null;

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
      return GameController.#instance;
    }

    GameController.#instance = this;

    this.container = container;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.clock = new THREE.Clock();
    this.isRunning = false;
    this.currentState = GAME_STATES.LOADING;
    this.isWebGPU = false;

    // Performance monitoring
    this.frameCount = 0;
    this.lastTime = performance.now();
  }

  /**
   * Initialize the game renderer and core systems
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Attempt WebGPU first, fallback to WebGL2
      await this.#initializeRenderer();

      // Initialize scene
      this.#initializeScene();

      // Initialize camera
      this.#initializeCamera();

      DEBUG.ENABLED && console.log('Game initialized successfully');

    } catch (error) {
      console.error('Game initialization failed:', error);
      throw error;
    }
  }

  /**
   * Initialize renderer with WebGPU/WebGL2 fallback
   * @private
   * @async
   */
  async #initializeRenderer() {
    // Try WebGPU first
    try {
      this.renderer = new WebGPURenderer({
        antialias: true,
        powerPreference: 'high-performance',
        alpha: false
      });
      await this.renderer.init();
      this.isWebGPU = this.renderer.isWebGPUBackend;

      DEBUG.ENABLED && console.log('WebGPU renderer initialized');
    } catch (error) {
      // Fallback to WebGL2
      console.warn('WebGPU failed, falling back to WebGL2:', error);
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: 'high-performance'
      });
      this.isWebGPU = false;

      DEBUG.ENABLED && console.log('WebGL2 renderer initialized');
    }

    // Configure renderer
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // Add canvas to container
    this.container.appendChild(this.renderer.domElement);
  }

  /**
   * Initialize the scene
   * @private
   */
  #initializeScene() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a0f);
    this.scene.fog = new THREE.Fog(0x0a0a0f, 10, 100);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);

    // Add directional light
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(50, 100, 50);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = RENDERING.SHADOW_MAP_SIZE;
    dirLight.shadow.mapSize.height = RENDERING.SHADOW_MAP_SIZE;
    this.scene.add(dirLight);

    DEBUG.ENABLED && console.log('Scene initialized');
  }

  /**
   * Initialize the camera
   * @private
   */
  #initializeCamera() {
    this.camera = new THREE.PerspectiveCamera(
      RENDERING.FOV,
      window.innerWidth / window.innerHeight,
      RENDERING.NEAR_PLANE,
      RENDERING.FAR_PLANE
    );
    this.camera.position.set(0, 1.8, 5);

    DEBUG.ENABLED && console.log('Camera initialized');
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.isRunning) return;

    this.isRunning = true;
    this.currentState = GAME_STATES.PLAYING;
    this.#gameLoop();

    DEBUG.ENABLED && console.log('Game loop started');
  }

  /**
   * Pause the game
   */
  pause() {
    if (this.currentState === GAME_STATES.PLAYING) {
      this.currentState = GAME_STATES.PAUSED;
      DEBUG.ENABLED && console.log('Game paused');
    }
  }

  /**
   * Resume the game
   */
  resume() {
    if (this.currentState === GAME_STATES.PAUSED) {
      this.currentState = GAME_STATES.PLAYING;
      this.clock.getDelta(); // Reset delta to prevent jump
      DEBUG.ENABLED && console.log('Game resumed');
    }
  }

  /**
   * Handle window resize
   * @param {number} width - New window width
   * @param {number} height - New window height
   */
  handleResize(width, height) {
    if (!this.camera || !this.renderer) return;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);

    DEBUG.ENABLED && console.log(`Resized to ${width}x${height}`);
  }

  /**
   * Main game loop
   * @private
   */
  #gameLoop() {
    if (!this.isRunning) return;

    requestAnimationFrame(() => this.#gameLoop());

    // Skip updates if paused
    if (this.currentState === GAME_STATES.PAUSED) {
      return;
    }

    // Calculate delta time
    const deltaTime = Math.min(this.clock.getDelta(), RENDERING.MAX_DELTA_TIME);

    // Update game systems
    this.#update(deltaTime);

    // Render frame
    this.#render();

    // Performance monitoring
    this.#monitorPerformance();
  }

  /**
   * Update game systems
   * @private
   * @param {number} deltaTime - Time since last frame in seconds
   */
  #update(deltaTime) {
    // TODO: Update systems here
    // - InputManager
    // - PlayerController
    // - EntityManager
    // - PhysicsSystem
    // - AudioManager

    // Placeholder rotation for testing
    if (this.scene.children.length > 2) {
      const cube = this.scene.children.find(child => child.geometry instanceof THREE.BoxGeometry);
      if (cube) {
        cube.rotation.y += deltaTime;
        cube.rotation.x += deltaTime * 0.5;
      }
    }
  }

  /**
   * Render the frame
   * @private
   */
  #render() {
    if (this.renderer && this.scene && this.camera) {
      this.renderer.render(this.scene, this.camera);
    }
  }

  /**
   * Monitor performance metrics
   * @private
   */
  #monitorPerformance() {
    if (!DEBUG.SHOW_FPS) return;

    this.frameCount++;
    const currentTime = performance.now();
    const elapsed = currentTime - this.lastTime;

    if (elapsed >= 1000) {
      const fps = Math.round((this.frameCount * 1000) / elapsed);
      DEBUG.ENABLED && console.log(`FPS: ${fps}, Draw calls: ${this.renderer.info.render.calls}`);
      this.frameCount = 0;
      this.lastTime = currentTime;
    }
  }

  /**
   * Dispose of game resources
   */
  dispose() {
    this.isRunning = false;

    if (this.renderer) {
      this.renderer.dispose();
      this.container.removeChild(this.renderer.domElement);
    }

    if (this.scene) {
      this.scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(m => m.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    GameController.#instance = null;

    DEBUG.ENABLED && console.log('Game disposed');
  }
}
