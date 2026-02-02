/**
 * InputManager - Handles keyboard and mouse input
 * Manages key states, pointer lock, and emits input events via EventBus
 * @module systems/InputManager
 */

'use strict';

import { EventBus, GAME_EVENTS } from '../utils/EventBus.js';
import { INPUT_KEYS } from '../utils/Constants.js';

/**
 * InputManager class for handling all game input
 * Supports keyboard, mouse, and pointer lock for FPS controls
 * @class
 */
export class InputManager {
  /** @type {EventBus} */
  #eventBus;

  /** @type {Map<string, boolean>} */
  #keyStates = new Map();

  /** @type {Map<string, boolean>} */
  #keyPressedOnce = new Map();

  /** @type {{x: number, y: number}} */
  #mouseMovement = { x: 0, y: 0 };

  /** @type {{left: boolean, right: boolean, middle: boolean}} */
  #mouseButtons = { left: false, right: false, middle: false };

  /** @type {boolean} */
  #isPointerLocked = false;

  /** @type {boolean} */
  #isEnabled = true;

  /** @type {HTMLElement|null} */
  #pointerLockElement = null;

  /** @type {Function|null} */
  #keydownHandler = null;

  /** @type {Function|null} */
  #keyupHandler = null;

  /** @type {Function|null} */
  #mousemoveHandler = null;

  /** @type {Function|null} */
  #mousedownHandler = null;

  /** @type {Function|null} */
  #mouseupHandler = null;

  /** @type {Function|null} */
  #pointerLockChangeHandler = null;

  /** @type {Function|null} */
  #pointerLockErrorHandler = null;

  /** @type {Object} */
  #keyBindings = { ...INPUT_KEYS };

  /**
   * Creates a new InputManager
   * @param {Object} [options] - InputManager options
   * @param {EventBus} [options.eventBus] - Event bus instance
   * @param {HTMLElement} [options.pointerLockElement] - Element for pointer lock
   */
  constructor(options = {}) {
    this.#eventBus = options.eventBus || EventBus.getInstance();
    this.#pointerLockElement = options.pointerLockElement || document.body;

    this.#setupEventListeners();
  }

  /**
   * Setup all event listeners
   * @private
   */
  #setupEventListeners() {
    // Keyboard events
    this.#keydownHandler = (event) => this.#handleKeyDown(event);
    this.#keyupHandler = (event) => this.#handleKeyUp(event);

    // Mouse events
    this.#mousemoveHandler = (event) => this.#handleMouseMove(event);
    this.#mousedownHandler = (event) => this.#handleMouseDown(event);
    this.#mouseupHandler = (event) => this.#handleMouseUp(event);

    // Pointer lock events
    this.#pointerLockChangeHandler = () => this.#handlePointerLockChange();
    this.#pointerLockErrorHandler = (error) => this.#handlePointerLockError(error);

    // Add event listeners
    document.addEventListener('keydown', this.#keydownHandler);
    document.addEventListener('keyup', this.#keyupHandler);
    document.addEventListener('mousemove', this.#mousemoveHandler);
    document.addEventListener('mousedown', this.#mousedownHandler);
    document.addEventListener('mouseup', this.#mouseupHandler);
    document.addEventListener('pointerlockchange', this.#pointerLockChangeHandler);
    document.addEventListener('pointerlockerror', this.#pointerLockErrorHandler);

    // Prevent context menu on right click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  /**
   * Handle keydown event
   * @private
   * @param {KeyboardEvent} event
   */
  #handleKeyDown(event) {
    if (!this.#isEnabled) return;

    const code = event.code;

    // Track key state
    if (!this.#keyStates.get(code)) {
      this.#keyStates.set(code, true);
      this.#keyPressedOnce.set(code, true);

      // Emit key press event
      this.#eventBus.emit(GAME_EVENTS.KEY_PRESS, {
        code,
        key: event.key,
        ctrl: event.ctrlKey,
        shift: event.shiftKey,
        alt: event.altKey
      });

      // Handle specific actions
      this.#handleActionKeys(code, event);
    }
  }

  /**
   * Handle action keys (pause, interact, etc.)
   * @private
   * @param {string} code - Key code
   * @param {KeyboardEvent} event
   */
  #handleActionKeys(code, event) {
    // Prevent default for game keys
    const gameKeys = Object.values(this.#keyBindings);
    if (gameKeys.includes(code)) {
      event.preventDefault();
    }

    // Emit specific action events
    switch (code) {
    case this.#keyBindings.PAUSE:
      this.#eventBus.emit(GAME_EVENTS.PAUSE_REQUEST);
      break;
    case this.#keyBindings.INTERACT:
      this.#eventBus.emit(GAME_EVENTS.INTERACT_REQUEST);
      break;
    case this.#keyBindings.SCANNER:
      this.#eventBus.emit(GAME_EVENTS.SCANNER_TOGGLE);
      break;
    }
  }

  /**
   * Handle keyup event
   * @private
   * @param {KeyboardEvent} event
   */
  #handleKeyUp(event) {
    const code = event.code;
    this.#keyStates.set(code, false);
    this.#keyPressedOnce.set(code, false);

    this.#eventBus.emit(GAME_EVENTS.KEY_RELEASE, {
      code,
      key: event.key
    });
  }

  /**
   * Handle mouse movement
   * @private
   * @param {MouseEvent} event
   */
  #handleMouseMove(event) {
    if (!this.#isEnabled || !this.#isPointerLocked) return;

    this.#mouseMovement.x += event.movementX;
    this.#mouseMovement.y += event.movementY;

    this.#eventBus.emit(GAME_EVENTS.MOUSE_MOVE, {
      x: event.movementX,
      y: event.movementY,
      accumulatedX: this.#mouseMovement.x,
      accumulatedY: this.#mouseMovement.y
    });
  }

  /**
   * Handle mouse button down
   * @private
   * @param {MouseEvent} event
   */
  #handleMouseDown(event) {
    if (!this.#isEnabled) return;

    switch (event.button) {
    case 0:
      this.#mouseButtons.left = true;
      this.#eventBus.emit(GAME_EVENTS.MOUSE_CLICK, { button: 'left' });
      break;
    case 1:
      this.#mouseButtons.middle = true;
      this.#eventBus.emit(GAME_EVENTS.MOUSE_CLICK, { button: 'middle' });
      break;
    case 2:
      this.#mouseButtons.right = true;
      this.#eventBus.emit(GAME_EVENTS.MOUSE_CLICK, { button: 'right' });
      break;
    }
  }

  /**
   * Handle mouse button up
   * @private
   * @param {MouseEvent} event
   */
  #handleMouseUp(event) {
    switch (event.button) {
    case 0:
      this.#mouseButtons.left = false;
      break;
    case 1:
      this.#mouseButtons.middle = false;
      break;
    case 2:
      this.#mouseButtons.right = false;
      break;
    }
  }

  /**
   * Handle pointer lock change
   * @private
   */
  #handlePointerLockChange() {
    this.#isPointerLocked = document.pointerLockElement === this.#pointerLockElement;

    if (this.#isPointerLocked) {
      this.#eventBus.emit(GAME_EVENTS.POINTER_LOCK_ACQUIRED);
    } else {
      this.#eventBus.emit(GAME_EVENTS.POINTER_LOCK_RELEASED);
      // Reset mouse movement when lock is lost
      this.#mouseMovement.x = 0;
      this.#mouseMovement.y = 0;
    }
  }

  /**
   * Handle pointer lock error
   * @private
   * @param {Event} error
   */
  #handlePointerLockError(error) {
    console.error('InputManager: Pointer lock error:', error);
    this.#eventBus.emit(GAME_EVENTS.POINTER_LOCK_ERROR, { error });
  }

  /**
   * Request pointer lock for FPS controls
   */
  requestPointerLock() {
    if (this.#pointerLockElement && !this.#isPointerLocked) {
      this.#pointerLockElement.requestPointerLock();
    }
  }

  /**
   * Exit pointer lock
   */
  exitPointerLock() {
    if (this.#isPointerLocked) {
      document.exitPointerLock();
    }
  }

  /**
   * Check if a key is currently held down
   * @param {string} keyCode - Key code to check
   * @returns {boolean}
   */
  isKeyDown(keyCode) {
    return this.#keyStates.get(keyCode) || false;
  }

  /**
   * Check if a key was pressed once (resets after check)
   * @param {string} keyCode - Key code to check
   * @returns {boolean}
   */
  isKeyPressed(keyCode) {
    const pressed = this.#keyPressedOnce.get(keyCode) || false;
    if (pressed) {
      this.#keyPressedOnce.set(keyCode, false);
    }
    return pressed;
  }

  /**
   * Get movement vector from WASD keys
   * @returns {{x: number, z: number}} Movement vector (x: strafe, z: forward/back)
   */
  getMovementVector() {
    const vector = { x: 0, z: 0 };

    if (this.isKeyDown(this.#keyBindings.FORWARD)) vector.z -= 1;
    if (this.isKeyDown(this.#keyBindings.BACKWARD)) vector.z += 1;
    if (this.isKeyDown(this.#keyBindings.LEFT)) vector.x -= 1;
    if (this.isKeyDown(this.#keyBindings.RIGHT)) vector.x += 1;

    // Normalize diagonal movement
    if (vector.x !== 0 && vector.z !== 0) {
      const length = Math.sqrt(vector.x * vector.x + vector.z * vector.z);
      vector.x /= length;
      vector.z /= length;
    }

    return vector;
  }

  /**
   * Check if sprint key is held
   * @returns {boolean}
   */
  isSprinting() {
    return this.isKeyDown(this.#keyBindings.SPRINT);
  }

  /**
   * Check if jump key is pressed
   * @returns {boolean}
   */
  isJumpPressed() {
    return this.isKeyPressed(this.#keyBindings.JUMP);
  }

  /**
   * Check if jump key is held
   * @returns {boolean}
   */
  isJumping() {
    return this.isKeyDown(this.#keyBindings.JUMP);
  }

  /**
   * Check if crouch key is held
   * @returns {boolean}
   */
  isCrouching() {
    return this.isKeyDown(this.#keyBindings.CROUCH);
  }

  /**
   * Get accumulated mouse movement and reset
   * @returns {{x: number, y: number}}
   */
  getMouseMovement() {
    const movement = { ...this.#mouseMovement };
    this.#mouseMovement.x = 0;
    this.#mouseMovement.y = 0;
    return movement;
  }

  /**
   * Check if a mouse button is held
   * @param {string} button - 'left', 'right', or 'middle'
   * @returns {boolean}
   */
  isMouseButtonDown(button) {
    return this.#mouseButtons[button] || false;
  }

  /**
   * Check if pointer is locked
   * @returns {boolean}
   */
  isPointerLocked() {
    return this.#isPointerLocked;
  }

  /**
   * Enable input processing
   */
  enable() {
    this.#isEnabled = true;
  }

  /**
   * Disable input processing
   */
  disable() {
    this.#isEnabled = false;
    // Clear all key states when disabled
    this.#keyStates.clear();
    this.#keyPressedOnce.clear();
    this.#mouseButtons.left = false;
    this.#mouseButtons.right = false;
    this.#mouseButtons.middle = false;
  }

  /**
   * Update key bindings
   * @param {Object} newBindings - New key bindings to merge
   */
  setKeyBindings(newBindings) {
    this.#keyBindings = { ...this.#keyBindings, ...newBindings };
  }

  /**
   * Get current key bindings
   * @returns {Object}
   */
  getKeyBindings() {
    return { ...this.#keyBindings };
  }

  /**
   * Clean up all event listeners
   */
  dispose() {
    this.exitPointerLock();

    document.removeEventListener('keydown', this.#keydownHandler);
    document.removeEventListener('keyup', this.#keyupHandler);
    document.removeEventListener('mousemove', this.#mousemoveHandler);
    document.removeEventListener('mousedown', this.#mousedownHandler);
    document.removeEventListener('mouseup', this.#mouseupHandler);
    document.removeEventListener('pointerlockchange', this.#pointerLockChangeHandler);
    document.removeEventListener('pointerlockerror', this.#pointerLockErrorHandler);

    this.#keyStates.clear();
    this.#keyPressedOnce.clear();
  }
}
