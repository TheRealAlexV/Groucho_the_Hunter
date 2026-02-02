/**
 * LoadingScreen - Full-screen loading overlay with progress bar
 * Cyberpunk-styled loading interface matching game theme
 * @module ui/LoadingScreen
 */

'use strict';

import { EventBus, GAME_EVENTS } from '../utils/EventBus.js';

/**
 * LoadingScreen class for displaying loading progress
 * Features cyberpunk styling with animated progress bar
 * @class
 */
export class LoadingScreen {
  /** @type {HTMLElement|null} */
  #container = null;

  /** @type {HTMLElement|null} */
  #overlay = null;

  /** @type {HTMLElement|null} */
  #progressBar = null;

  /** @type {HTMLElement|null} */
  #progressFill = null;

  /** @type {HTMLElement|null} */
  #statusText = null;

  /** @type {HTMLElement|null} */
  #percentageText = null;

  /** @type {boolean} */
  #isVisible = false;

  /** @type {number} */
  #currentProgress = 0;

  /** @type {EventBus} */
  #eventBus;

  /** @type {string[]} */
  #loadingMessages = [
    'Initializing systems...',
    'Loading assets...',
    'Compiling shaders...',
    'Building world geometry...',
    'Spawning entities...',
    'Calibrating scanners...',
    'Establishing connection...',
    'Decrypting security protocols...',
    'Almost there...'
  ];

  /** @type {number|null} */
  #messageInterval = null;

  /**
   * Creates a new LoadingScreen
   * @param {Object} [options] - Loading screen options
   * @param {EventBus} [options.eventBus] - Event bus instance
   * @param {HTMLElement} [options.container] - Container element (defaults to document.body)
   */
  constructor(options = {}) {
    this.#eventBus = options.eventBus || EventBus.getInstance();
    this.#container = options.container || document.body;

    this.#createElements();
    this.#setupEventListeners();
  }

  /**
   * Create the loading screen DOM elements
   * @private
   */
  #createElements() {
    // Main overlay container
    this.#overlay = document.createElement('div');
    this.#overlay.className = 'loading-screen';
    this.#overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #0a0a0f 0%, #1a0a2e 50%, #0a0a0f 100%);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 9999;
      opacity: 0;
      visibility: hidden;
      transition: opacity 0.3s ease, visibility 0.3s ease;
      font-family: 'Courier New', monospace;
    `;

    // Decorative grid background
    const gridOverlay = document.createElement('div');
    gridOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(0, 255, 136, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(0, 255, 136, 0.03) 1px, transparent 1px);
      background-size: 50px 50px;
      pointer-events: none;
    `;
    this.#overlay.appendChild(gridOverlay);

    // Title
    const title = document.createElement('h1');
    title.textContent = 'GROUCHO THE HUNTER';
    title.style.cssText = `
      font-size: 2.5rem;
      font-weight: bold;
      color: #00ff88;
      text-transform: uppercase;
      letter-spacing: 0.3em;
      margin-bottom: 0.5rem;
      text-shadow: 
        0 0 10px rgba(0, 255, 136, 0.5),
        0 0 20px rgba(0, 255, 136, 0.3),
        0 0 30px rgba(0, 255, 136, 0.1);
      animation: pulse 2s ease-in-out infinite;
    `;
    this.#overlay.appendChild(title);

    // Subtitle
    const subtitle = document.createElement('p');
    subtitle.textContent = 'Cybersecurity Threat Hunting Simulation';
    subtitle.style.cssText = `
      font-size: 0.9rem;
      color: #8899aa;
      margin-bottom: 3rem;
      letter-spacing: 0.2em;
      text-transform: uppercase;
    `;
    this.#overlay.appendChild(subtitle);

    // Progress container
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      width: 400px;
      max-width: 80%;
      position: relative;
    `;

    // Progress bar background
    this.#progressBar = document.createElement('div');
    this.#progressBar.style.cssText = `
      width: 100%;
      height: 4px;
      background: rgba(0, 255, 136, 0.1);
      border-radius: 2px;
      overflow: visible;
      position: relative;
    `;

    // Progress fill
    this.#progressFill = document.createElement('div');
    this.#progressFill.style.cssText = `
      width: 0%;
      height: 100%;
      background: linear-gradient(90deg, #00ff88, #00ccff);
      border-radius: 2px;
      transition: width 0.3s ease;
      box-shadow: 
        0 0 10px rgba(0, 255, 136, 0.5),
        0 0 20px rgba(0, 255, 136, 0.3);
      position: relative;
    `;

    // Progress glow effect
    const progressGlow = document.createElement('div');
    progressGlow.style.cssText = `
      position: absolute;
      right: -5px;
      top: 50%;
      transform: translateY(-50%);
      width: 10px;
      height: 10px;
      background: #00ff88;
      border-radius: 50%;
      box-shadow: 
        0 0 10px rgba(0, 255, 136, 0.8),
        0 0 20px rgba(0, 255, 136, 0.5);
      animation: glow 1.5s ease-in-out infinite;
    `;
    this.#progressFill.appendChild(progressGlow);
    this.#progressBar.appendChild(this.#progressFill);
    progressContainer.appendChild(this.#progressBar);

    // Percentage text
    this.#percentageText = document.createElement('div');
    this.#percentageText.textContent = '0%';
    this.#percentageText.style.cssText = `
      position: absolute;
      right: 0;
      top: -25px;
      font-size: 0.9rem;
      color: #00ff88;
      font-weight: bold;
    `;
    progressContainer.appendChild(this.#percentageText);

    this.#overlay.appendChild(progressContainer);

    // Status text
    this.#statusText = document.createElement('p');
    this.#statusText.textContent = 'Initializing...';
    this.#statusText.style.cssText = `
      font-size: 0.85rem;
      color: #667788;
      margin-top: 1.5rem;
      letter-spacing: 0.1em;
      min-height: 1.2em;
    `;
    this.#overlay.appendChild(this.#statusText);

    // Decorative corner elements
    const corners = document.createElement('div');
    corners.style.cssText = `
      position: absolute;
      top: 20px;
      left: 20px;
      right: 20px;
      bottom: 20px;
      border: 1px solid rgba(0, 255, 136, 0.1);
      pointer-events: none;
    `;

    // Corner accents
    const cornerPositions = [
      { t: '-1px', l: '-1px', b: 'none', r: 'none', bt: '20px', bl: '20px' },
      { t: '-1px', r: '-1px', b: 'none', l: 'none', bt: '20px', br: '20px' },
      { b: '-1px', l: '-1px', t: 'none', r: 'none', bb: '20px', bl: '20px' },
      { b: '-1px', r: '-1px', t: 'none', l: 'none', bb: '20px', br: '20px' }
    ];

    cornerPositions.forEach(pos => {
      const corner = document.createElement('div');
      corner.style.cssText = `
        position: absolute;
        ${pos.t !== 'none' ? `top: ${pos.t};` : ''}
        ${pos.b !== 'none' ? `bottom: ${pos.b};` : ''}
        ${pos.l !== 'none' ? `left: ${pos.l};` : ''}
        ${pos.r !== 'none' ? `right: ${pos.r};` : ''}
        width: ${pos.bt || pos.bb};
        height: ${pos.bt || pos.bb};
        border-${pos.bt ? 'top' : 'bottom'}: 2px solid #00ff88;
        border-${pos.bl ? 'left' : 'right'}: 2px solid #00ff88;
      `;
      corners.appendChild(corner);
    });

    this.#overlay.appendChild(corners);

    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.7; }
      }
      @keyframes glow {
        0%, 100% { box-shadow: 0 0 10px rgba(0, 255, 136, 0.8), 0 0 20px rgba(0, 255, 136, 0.5); }
        50% { box-shadow: 0 0 15px rgba(0, 255, 136, 1), 0 0 30px rgba(0, 255, 136, 0.7); }
      }
    `;
    document.head.appendChild(style);

    // Add to container
    this.#container.appendChild(this.#overlay);
  }

  /**
   * Set up event listeners
   * @private
   */
  #setupEventListeners() {
    this.#eventBus.on(GAME_EVENTS.UI_LOADING_PROGRESS, (data) => {
      if (data && typeof data.progress === 'number') {
        this.setProgress(data.progress, data.message);
      }
    });
  }

  /**
   * Show the loading screen
   * @param {string} [message] - Initial loading message
   */
  show(message = 'Initializing...') {
    if (this.#isVisible) return;

    this.#isVisible = true;
    this.#currentProgress = 0;
    this.#overlay.style.opacity = '1';
    this.#overlay.style.visibility = 'visible';

    this.setStatus(message);

    // Start cycling loading messages
    this.#startMessageCycle();

    console.log('LoadingScreen: Shown');
  }

  /**
   * Hide the loading screen
   */
  hide() {
    if (!this.#isVisible) return;

    this.#isVisible = false;
    this.#overlay.style.opacity = '0';
    this.#overlay.style.visibility = 'hidden';

    // Stop message cycling
    this.#stopMessageCycle();

    console.log('LoadingScreen: Hidden');
  }

  /**
   * Update progress bar
   * @param {number} progress - Progress value (0-100)
   * @param {string} [message] - Optional status message
   */
  setProgress(progress, message) {
    // Clamp progress to 0-100
    this.#currentProgress = Math.max(0, Math.min(100, progress));

    // Update progress bar
    if (this.#progressFill) {
      this.#progressFill.style.width = `${this.#currentProgress}%`;
    }

    // Update percentage text
    if (this.#percentageText) {
      this.#percentageText.textContent = `${Math.round(this.#currentProgress)}%`;
    }

    // Update message if provided
    if (message) {
      this.setStatus(message);
    }

    // Emit progress event
    this.#eventBus.emit(GAME_EVENTS.UI_LOADING_PROGRESS, {
      progress: this.#currentProgress,
      message: this.#statusText?.textContent || ''
    });
  }

  /**
   * Get current progress
   * @returns {number} Current progress (0-100)
   */
  getProgress() {
    return this.#currentProgress;
  }

  /**
   * Update status text
   * @param {string} message - Status message to display
   */
  setStatus(message) {
    if (this.#statusText) {
      this.#statusText.textContent = message;
    }
  }

  /**
   * Start cycling through loading messages
   * @private
   */
  #startMessageCycle() {
    this.#stopMessageCycle();

    let messageIndex = 0;
    this.#messageInterval = setInterval(() => {
      if (!this.#isVisible) return;

      messageIndex = (messageIndex + 1) % this.#loadingMessages.length;
      this.setStatus(this.#loadingMessages[messageIndex]);
    }, 2000);
  }

  /**
   * Stop message cycling
   * @private
   */
  #stopMessageCycle() {
    if (this.#messageInterval) {
      clearInterval(this.#messageInterval);
      this.#messageInterval = null;
    }
  }

  /**
   * Increment progress by a specific amount
   * @param {number} amount - Amount to increment (0-100)
   * @param {string} [message] - Optional status message
   */
  incrementProgress(amount, message) {
    this.setProgress(this.#currentProgress + amount, message);
  }

  /**
   * Check if loading screen is visible
   * @returns {boolean}
   */
  isVisible() {
    return this.#isVisible;
  }

  /**
   * Dispose of the loading screen
   */
  dispose() {
    this.#stopMessageCycle();

    if (this.#overlay && this.#overlay.parentNode) {
      this.#overlay.parentNode.removeChild(this.#overlay);
    }

    this.#overlay = null;
    this.#progressBar = null;
    this.#progressFill = null;
    this.#statusText = null;
    this.#percentageText = null;
    this.#container = null;

    console.log('LoadingScreen: Disposed');
  }
}
