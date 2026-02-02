/**
 * GameLoop - Main game loop with fixed timestep physics
 * Implements the game loop pattern with separate update and render phases
 * @module core/GameLoop
 */

'use strict';

import * as THREE from 'three';
import { RENDERING } from '../utils/Constants.js';
import { EventBus, GAME_EVENTS } from '../utils/EventBus.js';

/**
 * GameLoop class managing the main game update/render cycle
 * Uses fixed timestep for physics and variable timestep for rendering
 * @class
 */
export class GameLoop {
  /** @type {boolean} */
  #isRunning = false;

  /** @type {boolean} */
  #isPaused = false;

  /** @type {THREE.Clock} */
  #clock;

  /** @type {number} */
  #targetFPS = RENDERING.TARGET_FPS;

  /** @type {number} */
  #frameInterval = 1 / RENDERING.TARGET_FPS;

  /** @type {number} */
  #accumulator = 0;

  /** @type {number} */
  #alpha = 0; // Interpolation factor for rendering

  /** @type {number} */
  #lastTime = 0;

  /** @type {number} */
  #frameCount = 0;

  /** @type {number} */
  #lastFPSUpdate = 0;

  /** @type {number} */
  #currentFPS = 0;

  /** @type {Set<Function>} */
  #updateCallbacks = new Set();

  /** @type {Set<Function>} */
  #renderCallbacks = new Set();

  /** @type {Set<Function>} */
  #fixedUpdateCallbacks = new Set();

  /** @type {number|null} */
  #animationFrameId = null;

  /** @type {EventBus} */
  #eventBus;

  /** @type {Function|null} */
  #renderFunction = null;

  /**
   * Creates a new GameLoop
   * @param {Object} [options] - GameLoop options
   * @param {EventBus} [options.eventBus] - Event bus instance
   * @param {number} [options.targetFPS] - Target frame rate
   * @param {Function} [options.renderFunction] - Render function to call each frame
   */
  constructor(options = {}) {
    this.#eventBus = options.eventBus || EventBus.getInstance();
    this.#targetFPS = options.targetFPS || RENDERING.TARGET_FPS;
    this.#frameInterval = 1 / this.#targetFPS;
    this.#renderFunction = options.renderFunction || null;

    this.#clock = new THREE.Clock();
    this.#lastFPSUpdate = performance.now();
  }

  /**
   * Start the game loop
   */
  start() {
    if (this.#isRunning) {
      console.warn('GameLoop: Already running');
      return;
    }

    this.#isRunning = true;
    this.#isPaused = false;
    this.#clock.start();
    this.#lastTime = this.#clock.getElapsedTime();

    this.#eventBus.emit(GAME_EVENTS.GAME_START);

    this.#tick();

    console.log('GameLoop: Started');
  }

  /**
   * Stop the game loop
   */
  stop() {
    if (!this.#isRunning) return;

    this.#isRunning = false;
    this.#isPaused = false;

    if (this.#animationFrameId !== null) {
      cancelAnimationFrame(this.#animationFrameId);
      this.#animationFrameId = null;
    }

    this.#clock.stop();

    this.#eventBus.emit(GAME_EVENTS.GAME_STOP);

    console.log('GameLoop: Stopped');
  }

  /**
   * Pause the game loop (stops updates but keeps rendering)
   */
  pause() {
    if (!this.#isRunning || this.#isPaused) return;

    this.#isPaused = true;
    this.#clock.stop();

    this.#eventBus.emit(GAME_EVENTS.GAME_PAUSE);

    console.log('GameLoop: Paused');
  }

  /**
   * Resume the game loop
   */
  resume() {
    if (!this.#isRunning || !this.#isPaused) return;

    this.#isPaused = false;
    this.#clock.start();
    this.#lastTime = this.#clock.getElapsedTime();
    this.#accumulator = 0; // Reset accumulator to prevent jump

    this.#eventBus.emit(GAME_EVENTS.GAME_RESUME);

    console.log('GameLoop: Resumed');
  }

  /**
   * Main tick function - called each frame
   * @private
   */
  #tick() {
    if (!this.#isRunning) return;

    // Schedule next frame
    this.#animationFrameId = requestAnimationFrame(() => this.#tick());

    // Get delta time since last frame
    const currentTime = this.#clock.getElapsedTime();
    let deltaTime = currentTime - this.#lastTime;
    this.#lastTime = currentTime;

    // Cap delta time to prevent large jumps (e.g., after tab switch)
    deltaTime = Math.min(deltaTime, RENDERING.MAX_DELTA_TIME);

    // Update FPS counter
    this.#updateFPS();

    // If paused, only render (no updates)
    if (this.#isPaused) {
      this.#render(deltaTime);
      return;
    }

    // Accumulate time for fixed timestep physics
    this.#accumulator += deltaTime;

    // Fixed timestep updates (physics)
    while (this.#accumulator >= this.#frameInterval) {
      this.#fixedUpdate(this.#frameInterval);
      this.#accumulator -= this.#frameInterval;
    }

    // Calculate interpolation factor for smooth rendering
    this.#alpha = this.#accumulator / this.#frameInterval;

    // Variable timestep update (game logic)
    this.#update(deltaTime);

    // Render
    this.#render(deltaTime);
  }

  /**
   * Fixed timestep update for physics
   * @private
   * @param {number} fixedDeltaTime - Fixed time step
   */
  #fixedUpdate(fixedDeltaTime) {
    // Call all registered fixed update callbacks
    this.#fixedUpdateCallbacks.forEach((callback) => {
      try {
        callback(fixedDeltaTime);
      } catch (error) {
        console.error('GameLoop: Error in fixed update callback:', error);
      }
    });
  }

  /**
   * Variable timestep update for game logic
   * @private
   * @param {number} deltaTime - Variable time since last frame
   */
  #update(deltaTime) {
    // Call all registered update callbacks
    this.#updateCallbacks.forEach((callback) => {
      try {
        callback(deltaTime, this.#alpha);
      } catch (error) {
        console.error('GameLoop: Error in update callback:', error);
      }
    });
  }

  /**
   * Render the frame
   * @private
   * @param {number} deltaTime - Time since last frame
   */
  #render(deltaTime) {
    // Call the main render function if provided
    if (this.#renderFunction) {
      try {
        this.#renderFunction(deltaTime);
      } catch (error) {
        console.error('GameLoop: Error in render function:', error);
      }
    }

    // Call all registered render callbacks
    this.#renderCallbacks.forEach((callback) => {
      try {
        callback(deltaTime);
      } catch (error) {
        console.error('GameLoop: Error in render callback:', error);
      }
    });
  }

  /**
   * Update FPS counter
   * @private
   */
  #updateFPS() {
    this.#frameCount++;

    const now = performance.now();
    const elapsed = now - this.#lastFPSUpdate;

    if (elapsed >= 1000) {
      this.#currentFPS = Math.round((this.#frameCount * 1000) / elapsed);
      this.#frameCount = 0;
      this.#lastFPSUpdate = now;
    }
  }

  /**
   * Register an update callback
   * @param {Function} callback - Function(deltaTime, alpha) to call each frame
   * @returns {Function} Unsubscribe function
   */
  onUpdate(callback) {
    if (typeof callback !== 'function') {
      console.error('GameLoop: Update callback must be a function');
      return () => {};
    }

    this.#updateCallbacks.add(callback);

    return () => {
      this.#updateCallbacks.delete(callback);
    };
  }

  /**
   * Register a fixed update callback (physics)
   * @param {Function} callback - Function(fixedDeltaTime) to call at fixed intervals
   * @returns {Function} Unsubscribe function
   */
  onFixedUpdate(callback) {
    if (typeof callback !== 'function') {
      console.error('GameLoop: Fixed update callback must be a function');
      return () => {};
    }

    this.#fixedUpdateCallbacks.add(callback);

    return () => {
      this.#fixedUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Register a render callback
   * @param {Function} callback - Function(deltaTime) to call each frame after update
   * @returns {Function} Unsubscribe function
   */
  onRender(callback) {
    if (typeof callback !== 'function') {
      console.error('GameLoop: Render callback must be a function');
      return () => {};
    }

    this.#renderCallbacks.add(callback);

    return () => {
      this.#renderCallbacks.delete(callback);
    };
  }

  /**
   * Remove an update callback
   * @param {Function} callback - Callback to remove
   */
  offUpdate(callback) {
    this.#updateCallbacks.delete(callback);
  }

  /**
   * Remove a fixed update callback
   * @param {Function} callback - Callback to remove
   */
  offFixedUpdate(callback) {
    this.#fixedUpdateCallbacks.delete(callback);
  }

  /**
   * Remove a render callback
   * @param {Function} callback - Callback to remove
   */
  offRender(callback) {
    this.#renderCallbacks.delete(callback);
  }

  /**
   * Set the render function
   * @param {Function} renderFunction - Function to call for rendering
   */
  setRenderFunction(renderFunction) {
    this.#renderFunction = renderFunction;
  }

  /**
   * Get current FPS
   * @returns {number}
   */
  getFPS() {
    return this.#currentFPS;
  }

  /**
   * Get current interpolation alpha
   * @returns {number} Value between 0 and 1
   */
  getAlpha() {
    return this.#alpha;
  }

  /**
   * Get accumulator value
   * @returns {number}
   */
  getAccumulator() {
    return this.#accumulator;
  }

  /**
   * Check if the loop is running
   * @returns {boolean}
   */
  isRunning() {
    return this.#isRunning;
  }

  /**
   * Check if the loop is paused
   * @returns {boolean}
   */
  isPaused() {
    return this.#isPaused;
  }

  /**
   * Get the clock instance
   * @returns {THREE.Clock}
   */
  getClock() {
    return this.#clock;
  }

  /**
   * Get elapsed time since loop started
   * @returns {number}
   */
  getElapsedTime() {
    return this.#clock.getElapsedTime();
  }

  /**
   * Get target FPS
   * @returns {number}
   */
  getTargetFPS() {
    return this.#targetFPS;
  }

  /**
   * Set target FPS
   * @param {number} fps - Target frames per second
   */
  setTargetFPS(fps) {
    this.#targetFPS = fps;
    this.#frameInterval = 1 / fps;
  }

  /**
   * Clear all callbacks
   */
  clearCallbacks() {
    this.#updateCallbacks.clear();
    this.#fixedUpdateCallbacks.clear();
    this.#renderCallbacks.clear();
  }

  /**
   * Dispose of the game loop
   */
  dispose() {
    this.stop();
    this.clearCallbacks();
    this.#renderFunction = null;

    console.log('GameLoop: Disposed');
  }
}
