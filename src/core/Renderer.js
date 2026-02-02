/**
 * Renderer - WebGPU/WebGL2 renderer management
 * Handles renderer initialization, configuration, and canvas management
 * @module core/Renderer
 */

'use strict';

import * as THREE from 'three';
import { WebGPURenderer } from 'three/webgpu';
import { RENDERING } from '../utils/Constants.js';

/**
 * Renderer class managing the Three.js rendering context
 * Attempts WebGPU first, falls back to WebGL2 automatically
 * @class
 */
export class Renderer {
  /** @type {THREE.WebGLRenderer|WebGPURenderer|null} */
  #renderer = null;

  /** @type {HTMLElement|null} */
  #container = null;

  /** @type {boolean} */
  #isWebGPU = false;

  /** @type {boolean} */
  #isInitialized = false;

  /** @type {Function|null} */
  #resizeHandler = null;

  /**
   * Creates a new Renderer instance
   * @param {HTMLElement} container - DOM container for the renderer canvas
   */
  constructor(container) {
    if (!container) {
      throw new Error('Renderer: container is required');
    }

    this.#container = container;
  }

  /**
   * Initialize the renderer with WebGPU/WebGL2 fallback
   * @async
   * @returns {Promise<THREE.WebGLRenderer|WebGPURenderer>}
   */
  async initialize() {
    if (this.#isInitialized) {
      console.warn('Renderer: Already initialized');
      return this.#renderer;
    }

    try {
      // Attempt WebGPU first
      await this.#initializeWebGPU();
    } catch (webgpuError) {
      console.warn('Renderer: WebGPU initialization failed, trying WebGL2...', webgpuError);

      try {
        // Fallback to WebGL2
        await this.#initializeWebGL2();
      } catch (webglError) {
        console.error('Renderer: Both WebGPU and WebGL2 failed to initialize', webglError);
        throw new Error('Failed to initialize any rendering backend');
      }
    }

    this.#configureRenderer();
    this.#setupResizeHandler();

    this.#isInitialized = true;

    console.log(`Renderer: Initialized with ${this.#isWebGPU ? 'WebGPU' : 'WebGL2'}`);

    return this.#renderer;
  }

  /**
   * Attempt to initialize WebGPU renderer
   * @private
   * @async
   * @throws {Error} If WebGPU initialization fails
   */
  async #initializeWebGPU() {
    this.#renderer = new WebGPURenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true
    });

    // WebGPU requires async initialization
    await this.#renderer.init();

    // Verify WebGPU is actually being used
    this.#isWebGPU = this.#renderer.isWebGPUBackend;

    if (!this.#isWebGPU) {
      throw new Error('WebGPU backend not available');
    }
  }

  /**
   * Initialize WebGL2 renderer as fallback
   * @private
   * @async
   */
  async #initializeWebGL2() {
    this.#renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
      stencil: false,
      depth: true
    });

    this.#isWebGPU = false;
  }

  /**
   * Configure renderer settings
   * @private
   */
  #configureRenderer() {
    if (!this.#renderer) return;

    const width = this.#container.clientWidth || window.innerWidth;
    const height = this.#container.clientHeight || window.innerHeight;

    // Size and pixel ratio
    this.#renderer.setSize(width, height);
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Shadow configuration
    this.#renderer.shadowMap.enabled = true;
    this.#renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Color space and tone mapping
    this.#renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.#renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.#renderer.toneMappingExposure = 1.0;

    // Add canvas to container
    const canvas = this.#renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    this.#container.appendChild(canvas);

    // Set initial clear color
    this.#renderer.setClearColor(0x0a0a0f, 1.0);
  }

  /**
   * Set up window resize handler
   * @private
   */
  #setupResizeHandler() {
    this.#resizeHandler = () => {
      this.handleResize();
    };

    window.addEventListener('resize', this.#resizeHandler);
  }

  /**
   * Handle window/container resize
   * Updates renderer size and pixel ratio
   */
  handleResize() {
    if (!this.#renderer || !this.#container) return;

    const width = this.#container.clientWidth || window.innerWidth;
    const height = this.#container.clientHeight || window.innerHeight;

    this.#renderer.setSize(width, height);
    this.#renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  }

  /**
   * Render a scene with a camera
   * @param {THREE.Scene} scene - Scene to render
   * @param {THREE.Camera} camera - Camera to use
   */
  render(scene, camera) {
    if (!this.#renderer || !scene || !camera) return;

    this.#renderer.render(scene, camera);
  }

  /**
   * Get the underlying Three.js renderer
   * @returns {THREE.WebGLRenderer|WebGPURenderer|null}
   */
  getRenderer() {
    return this.#renderer;
  }

  /**
   * Get the renderer's DOM canvas element
   * @returns {HTMLCanvasElement|null}
   */
  getCanvas() {
    return this.#renderer?.domElement || null;
  }

  /**
   * Check if using WebGPU backend
   * @returns {boolean}
   */
  isWebGPU() {
    return this.#isWebGPU;
  }

  /**
   * Check if renderer is initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.#isInitialized;
  }

  /**
   * Get current renderer dimensions
   * @returns {{width: number, height: number}}
   */
  getSize() {
    if (!this.#renderer) {
      return { width: 0, height: 0 };
    }

    return {
      width: this.#renderer.domElement.width,
      height: this.#renderer.domElement.height
    };
  }

  /**
   * Get rendering information (draw calls, triangles, etc.)
   * @returns {Object|null}
   */
  getInfo() {
    return this.#renderer?.info || null;
  }

  /**
   * Set clear color
   * @param {number|THREE.Color} color - Clear color
   * @param {number} [alpha=1.0] - Alpha value
   */
  setClearColor(color, alpha = 1.0) {
    this.#renderer?.setClearColor(color, alpha);
  }

  /**
   * Get the container element
   * @returns {HTMLElement|null}
   */
  getContainer() {
    return this.#container;
  }

  /**
   * Dispose of renderer resources
   * Removes event listeners and cleans up the renderer
   */
  dispose() {
    // Remove resize listener
    if (this.#resizeHandler) {
      window.removeEventListener('resize', this.#resizeHandler);
      this.#resizeHandler = null;
    }

    // Remove canvas from container
    if (this.#renderer?.domElement && this.#container) {
      try {
        this.#container.removeChild(this.#renderer.domElement);
      } catch (e) {
        // Canvas might already be removed
      }
    }

    // Dispose renderer
    if (this.#renderer) {
      this.#renderer.dispose();
      this.#renderer = null;
    }

    this.#isInitialized = false;
    this.#isWebGPU = false;
    this.#container = null;

    console.log('Renderer: Disposed');
  }
}
