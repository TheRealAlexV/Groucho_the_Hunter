/**
 * PerformanceMonitor - Tracks and reports game performance metrics
 * Monitors FPS, draw calls, memory usage, and renderer statistics
 * @module systems/PerformanceMonitor
 */

'use strict';

import { RENDERING } from '../utils/Constants.js';
import { EventBus, GAME_EVENTS } from '../utils/EventBus.js';

/**
 * PerformanceMonitor class for tracking game performance
 * Provides FPS monitoring, draw call tracking, and performance warnings
 * @class
 */
export class PerformanceMonitor {
  /** @type {boolean} */
  #isActive = false;

  /** @type {EventBus} */
  #eventBus;

  /** @type {Object} */
  #config = {
    targetFPS: RENDERING.TARGET_FPS,
    warningFPS: 45,
    criticalFPS: 30,
    maxDrawCalls: RENDERING.MAX_DRAW_CALLS,
    warningDrawCalls: 80,
    sampleSize: 60, // Number of frames for moving average
    logInterval: 5000 // ms between performance logs
  };

  // FPS tracking
  /** @type {number[]} */
  #fpsSamples = [];

  /** @type {number} */
  #currentFPS = 0;

  /** @type {number} */
  #averageFPS = 0;

  /** @type {number} */
  #minFPS = Infinity;

  /** @type {number} */
  #maxFPS = 0;

  /** @type {number} */
  #lastFrameTime = 0;

  /** @type {number} */
  #frameCount = 0;

  // Renderer stats
  /** @type {Object} */
  #lastRenderInfo = null;

  /** @type {number} */
  #lastLogTime = 0;

  // Stats.js overlay
  /** @type {Object|null} */
  #stats = null;

  /** @type {boolean} */
  #showOverlay = false;

  // Warnings
  /** @type {Set<string>} */
  #activeWarnings = new Set();

  /**
   * Creates a new PerformanceMonitor
   * @param {Object} [options] - Monitor options
   * @param {EventBus} [options.eventBus] - Event bus instance
   * @param {boolean} [options.showOverlay] - Show Stats.js overlay
   * @param {Object} [options.config] - Custom configuration
   */
  constructor(options = {}) {
    this.#eventBus = options.eventBus || EventBus.getInstance();

    if (options.config) {
      this.#config = { ...this.#config, ...options.config };
    }

    this.#showOverlay = options.showOverlay || false;
  }

  /**
   * Initialize the performance monitor
   * Sets up the stats overlay if enabled
   */
  async initialize() {
    if (this.#isActive) return;

    // Load Stats.js if overlay is enabled
    if (this.#showOverlay) {
      await this.#initializeStatsOverlay();
    }

    this.#isActive = true;
    this.#lastFrameTime = performance.now();
    this.#lastLogTime = performance.now();

    console.log('PerformanceMonitor: Initialized');
  }

  /**
   * Initialize Stats.js overlay
   * @private
   */
  async #initializeStatsOverlay() {
    try {
      // Dynamically import Stats.js
      const Stats = await import('three/addons/libs/stats.module.js');

      this.#stats = new Stats.default();
      this.#stats.showPanel(0); // 0: fps, 1: ms, 2: mb

      // Style the stats panel
      this.#stats.dom.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        z-index: 10000;
      `;

      document.body.appendChild(this.#stats.dom);

      console.log('PerformanceMonitor: Stats overlay enabled');
    } catch (error) {
      console.warn('PerformanceMonitor: Failed to load Stats.js:', error);
      this.#stats = null;
    }
  }

  /**
   * Begin performance monitoring for a frame
   * Call at the start of each frame
   */
  beginFrame() {
    if (!this.#isActive) return;

    if (this.#stats) {
      this.#stats.begin();
    }

    this.#lastFrameTime = performance.now();
  }

  /**
   * End performance monitoring for a frame
   * Call at the end of each frame with renderer info
   * @param {Object} renderInfo - Renderer info object from THREE.WebGLRenderer.info
   */
  endFrame(renderInfo) {
    if (!this.#isActive) return;

    const now = performance.now();
    const frameTime = now - this.#lastFrameTime;
    const fps = 1000 / frameTime;

    // Update FPS tracking
    this.#updateFPS(fps);

    // Store render info
    if (renderInfo) {
      this.#lastRenderInfo = { ...renderInfo };
      this.#checkRenderStats(renderInfo);
    }

    // Periodic logging
    if (now - this.#lastLogTime >= this.#config.logInterval) {
      this.#logPerformance();
      this.#lastLogTime = now;
    }

    // Update stats overlay
    if (this.#stats) {
      this.#stats.end();
    }

    this.#frameCount++;
  }

  /**
   * Update FPS tracking with new sample
   * @private
   * @param {number} fps - Current frame FPS
   */
  #updateFPS(fps) {
    // Clamp to reasonable values
    fps = Math.max(0, Math.min(fps, 999));

    this.#currentFPS = fps;

    // Add to samples
    this.#fpsSamples.push(fps);

    // Maintain sample size
    if (this.#fpsSamples.length > this.#config.sampleSize) {
      this.#fpsSamples.shift();
    }

    // Calculate moving average
    const sum = this.#fpsSamples.reduce((a, b) => a + b, 0);
    this.#averageFPS = sum / this.#fpsSamples.length;

    // Track min/max
    if (fps < this.#minFPS) this.#minFPS = fps;
    if (fps > this.#maxFPS) this.#maxFPS = fps;

    // Check for warnings
    this.#checkFPSWarnings();
  }

  /**
   * Check for FPS-related performance warnings
   * @private
   */
  #checkFPSWarnings() {
    // Critical FPS warning
    if (this.#averageFPS < this.#config.criticalFPS) {
      if (!this.#activeWarnings.has('fps_critical')) {
        this.#activeWarnings.add('fps_critical');
        this.#emitWarning('PERF_CRITICAL', {
          fps: this.#averageFPS.toFixed(1),
          threshold: this.#config.criticalFPS,
          message: `Critical: FPS dropped to ${this.#averageFPS.toFixed(1)}`
        });
      }
    } else {
      this.#activeWarnings.delete('fps_critical');
    }

    // Warning FPS
    if (this.#averageFPS < this.#config.warningFPS) {
      if (!this.#activeWarnings.has('fps_warning')) {
        this.#activeWarnings.add('fps_warning');
        this.#emitWarning('PERF_WARNING', {
          fps: this.#averageFPS.toFixed(1),
          threshold: this.#config.warningFPS,
          message: `Warning: FPS below ${this.#config.warningFPS} (${this.#averageFPS.toFixed(1)})`
        });
      }
    } else {
      this.#activeWarnings.delete('fps_warning');
    }
  }

  /**
   * Check renderer statistics for warnings
   * @private
   * @param {Object} renderInfo - Renderer info
   */
  #checkRenderStats(renderInfo) {
    if (!renderInfo || !renderInfo.render) return;

    const { calls, triangles } = renderInfo.render;

    // Draw call warnings
    if (calls > this.#config.maxDrawCalls) {
      if (!this.#activeWarnings.has('draw_calls_critical')) {
        this.#activeWarnings.add('draw_calls_critical');
        this.#emitWarning('PERF_CRITICAL', {
          drawCalls: calls,
          threshold: this.#config.maxDrawCalls,
          message: `Critical: Draw calls exceeded ${this.#config.maxDrawCalls} (${calls})`
        });
      }
    } else if (calls > this.#config.warningDrawCalls) {
      if (!this.#activeWarnings.has('draw_calls_warning')) {
        this.#activeWarnings.add('draw_calls_warning');
        this.#emitWarning('PERF_WARNING', {
          drawCalls: calls,
          threshold: this.#config.warningDrawCalls,
          message: `Warning: High draw calls (${calls})`
        });
      }
    } else {
      this.#activeWarnings.delete('draw_calls_warning');
      this.#activeWarnings.delete('draw_calls_critical');
    }
  }

  /**
   * Emit a performance warning event
   * @private
   * @param {string} type - Warning type
   * @param {Object} data - Warning data
   */
  #emitWarning(type, data) {
    console.warn(`PerformanceMonitor: ${data.message}`);

    if (type === 'PERF_CRITICAL') {
      this.#eventBus.emit(GAME_EVENTS.PERF_CRITICAL, data);
    } else {
      this.#eventBus.emit(GAME_EVENTS.PERF_WARNING, data);
    }
  }

  /**
   * Log current performance metrics
   * @private
   */
  #logPerformance() {
    if (this.#fpsSamples.length === 0) return;

    const stats = this.getStats();

    console.log(
      `Performance: ${stats.fps.current.toFixed(1)} FPS ` +
      `(avg: ${stats.fps.average.toFixed(1)}, ` +
      `min: ${stats.fps.min.toFixed(1)}, ` +
      `max: ${stats.fps.max.toFixed(1)}) | ` +
      `Draw Calls: ${stats.render.calls} | ` +
      `Triangles: ${stats.render.triangles}`
    );
  }

  /**
   * Get current performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    return {
      fps: {
        current: this.#currentFPS,
        average: this.#averageFPS,
        min: this.#minFPS === Infinity ? 0 : this.#minFPS,
        max: this.#maxFPS,
        samples: this.#fpsSamples.length
      },
      render: this.#lastRenderInfo ? {
        calls: this.#lastRenderInfo.render?.calls || 0,
        triangles: this.#lastRenderInfo.render?.triangles || 0,
        points: this.#lastRenderInfo.render?.points || 0,
        lines: this.#lastRenderInfo.render?.lines || 0
      } : { calls: 0, triangles: 0, points: 0, lines: 0 },
      memory: this.#lastRenderInfo?.memory || { geometries: 0, textures: 0 },
      frameCount: this.#frameCount,
      activeWarnings: Array.from(this.#activeWarnings)
    };
  }

  /**
   * Get current FPS
   * @returns {number}
   */
  getFPS() {
    return this.#currentFPS;
  }

  /**
   * Get average FPS
   * @returns {number}
   */
  getAverageFPS() {
    return this.#averageFPS;
  }

  /**
   * Check if performance monitor is active
   * @returns {boolean}
   */
  isActive() {
    return this.#isActive;
  }

  /**
   * Show or hide the stats overlay
   * @param {boolean} show - Whether to show the overlay
   */
  async showOverlay(show) {
    if (show && !this.#stats) {
      this.#showOverlay = true;
      await this.#initializeStatsOverlay();
    } else if (!show && this.#stats) {
      if (this.#stats.dom && this.#stats.dom.parentNode) {
        this.#stats.dom.parentNode.removeChild(this.#stats.dom);
      }
      this.#stats = null;
      this.#showOverlay = false;
    }
  }

  /**
   * Reset all performance statistics
   */
  reset() {
    this.#fpsSamples = [];
    this.#currentFPS = 0;
    this.#averageFPS = 0;
    this.#minFPS = Infinity;
    this.#maxFPS = 0;
    this.#frameCount = 0;
    this.#lastRenderInfo = null;
    this.#activeWarnings.clear();
    this.#lastFrameTime = performance.now();
    this.#lastLogTime = performance.now();
  }

  /**
   * Update configuration
   * @param {Object} config - New configuration values
   */
  setConfig(config) {
    this.#config = { ...this.#config, ...config };
  }

  /**
   * Get current configuration
   * @returns {Object}
   */
  getConfig() {
    return { ...this.#config };
  }

  /**
   * Dispose of the performance monitor
   */
  dispose() {
    this.#isActive = false;

    // Remove stats overlay
    if (this.#stats && this.#stats.dom && this.#stats.dom.parentNode) {
      this.#stats.dom.parentNode.removeChild(this.#stats.dom);
    }
    this.#stats = null;

    // Clear data
    this.#fpsSamples = [];
    this.#activeWarnings.clear();

    console.log('PerformanceMonitor: Disposed');
  }
}
