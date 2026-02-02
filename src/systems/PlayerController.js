/**
 * PlayerController - FPS player controller with camera and movement
 * Manages player input, camera look, and movement physics
 * @module systems/PlayerController
 */

'use strict';

import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { RENDERING, PLAYER } from '../utils/Constants.js';
import { EventBus, GAME_EVENTS } from '../utils/EventBus.js';
import { InputManager } from './InputManager.js';
import { Movement } from '../player/Movement.js';

/**
 * PlayerController class for FPS gameplay
 * Integrates input, camera, movement, and collision systems
 * @class
 */
export class PlayerController {
  /** @type {EventBus} */
  #eventBus;

  /** @type {InputManager} */
  #inputManager;

  /** @type {Movement} */
  #movement;

  /** @type {CollisionSystem|null} */
  #collisionSystem = null;

  /** @type {PointerLockControls|null} */
  #controls = null;

  /** @type {THREE.Camera|null} */
  #camera = null;

  /** @type {boolean} */
  #isEnabled = false;

  /** @type {boolean} */
  #isPaused = false;

  /** @type {HTMLElement|null} */
  #domElement = null;

  /** @type {Function|null} */
  #pointerLockHandler = null;

  /**
   * Creates a new PlayerController
   * @param {Object} options - PlayerController options
   * @param {THREE.Camera} options.camera - Three.js camera
   * @param {HTMLElement} options.domElement - DOM element for pointer lock
   * @param {EventBus} [options.eventBus] - Event bus instance
   * @param {CollisionSystem} [options.collisionSystem] - Collision system
   */
  constructor(options) {
    if (!options.camera || !options.domElement) {
      throw new Error('PlayerController: camera and domElement are required');
    }

    this.#camera = options.camera;
    this.#domElement = options.domElement;
    this.#eventBus = options.eventBus || EventBus.getInstance();
    this.#collisionSystem = options.collisionSystem || null;

    // Initialize input manager
    this.#inputManager = new InputManager({
      eventBus: this.#eventBus,
      pointerLockElement: this.#domElement
    });

    // Initialize movement system
    this.#movement = new Movement({
      standingHeight: PLAYER.HEIGHT,
      crouchHeight: PLAYER.HEIGHT * 0.5
    });

    // Setup callbacks for movement system
    this.#movement.setCallbacks({
      groundCheck: (position) => this.#checkGround(position),
      collisionCheck: (position, movement) => this.#checkCollision(position, movement)
    });

    this.#setupPointerLockControls();
    this.#setupEventListeners();
  }

  /**
   * Setup PointerLockControls for FPS camera
   * @private
   */
  #setupPointerLockControls() {
    this.#controls = new PointerLockControls(this.#camera, this.#domElement);

    // Configure camera
    this.#camera.fov = RENDERING.FOV;
    this.#camera.near = RENDERING.NEAR_PLANE;
    this.#camera.far = RENDERING.FAR_PLANE;
    this.#camera.updateProjectionMatrix();

    // Set initial camera position
    this.#camera.position.set(0, PLAYER.EYE_HEIGHT, 5);
  }

  /**
   * Setup event listeners
   * @private
   */
  #setupEventListeners() {
    // Handle pointer lock changes
    this.#eventBus.on(GAME_EVENTS.POINTER_LOCK_ACQUIRED, () => {
      this.#isEnabled = true;
      this.#isPaused = false;
      this.#eventBus.emit(GAME_EVENTS.GAME_RESUME);
    });

    this.#eventBus.on(GAME_EVENTS.POINTER_LOCK_RELEASED, () => {
      this.#isEnabled = false;
      this.#isPaused = true;
      this.#eventBus.emit(GAME_EVENTS.GAME_PAUSE);
    });

    // Handle pause request
    this.#eventBus.on(GAME_EVENTS.PAUSE_REQUEST, () => {
      if (this.#isEnabled) {
        this.#inputManager.exitPointerLock();
      }
    });

    // Click to lock pointer
    this.#pointerLockHandler = () => {
      if (!this.#isEnabled && !this.#isPaused) {
        this.#inputManager.requestPointerLock();
      }
    };

    this.#domElement.addEventListener('click', this.#pointerLockHandler);
  }

  /**
   * Check ground collision
   * @private
   * @param {THREE.Vector3} position - Player position
   * @returns {GroundCheckResult}
   */
  #checkGround(position) {
    if (this.#collisionSystem) {
      return this.#collisionSystem.checkGround(position);
    }
    // Default: always grounded at y=0
    return {
      isGrounded: position.y <= PLAYER.HEIGHT * 0.5,
      height: 0
    };
  }

  /**
   * Check movement collision
   * @private
   * @param {THREE.Vector3} position - Current position
   * @param {THREE.Vector3} movement - Desired movement
   * @returns {MovementResult}
   */
  #checkCollision(position, movement) {
    if (this.#collisionSystem) {
      return this.#collisionSystem.checkMovement(position, movement);
    }
    // No collision: allow all movement
    return {
      allowed: true,
      position: position.clone().add(movement),
      slideVector: movement
    };
  }

  /**
   * Spawn player at position
   * @param {THREE.Vector3|Object} position - Spawn position
   */
  spawn(position) {
    const spawnPos = position instanceof THREE.Vector3
      ? position
      : new THREE.Vector3(position.x || 0, position.y || PLAYER.EYE_HEIGHT, position.z || 0);

    this.#movement.teleport(spawnPos);

    // Update camera position
    const eyePos = this.#movement.getEyePosition();
    this.#camera.position.copy(eyePos);

    console.log('PlayerController: Spawned at', spawnPos);
  }

  /**
   * Update player controller
   * @param {number} deltaTime - Time since last frame
   */
  update(deltaTime) {
    if (!this.#isEnabled || this.#isPaused) {
      return;
    }

    // Get input state
    const movementVector = this.#inputManager.getMovementVector();
    const isSprinting = this.#inputManager.isSprinting();
    const isJumpPressed = this.#inputManager.isJumpPressed();
    const isCrouching = this.#inputManager.isCrouching();

    // Get camera direction for movement
    const cameraDirection = new THREE.Vector3();
    this.#camera.getWorldDirection(cameraDirection);

    // Update movement physics
    this.#movement.update(deltaTime, {
      movementVector,
      isSprinting,
      isJumping: isJumpPressed,
      isCrouching
    }, cameraDirection);

    // Update camera position
    const eyePosition = this.#movement.getEyePosition();
    this.#camera.position.copy(eyePosition);
  }

  /**
   * Request pointer lock (enable controls)
   */
  enable() {
    if (!this.#isEnabled) {
      this.#inputManager.requestPointerLock();
    }
  }

  /**
   * Exit pointer lock (disable controls)
   */
  disable() {
    if (this.#isEnabled) {
      this.#inputManager.exitPointerLock();
    }
    this.#isEnabled = false;
  }

  /**
   * Pause player controller
   */
  pause() {
    this.#isPaused = true;
    this.#inputManager.exitPointerLock();
  }

  /**
   * Resume player controller
   */
  resume() {
    this.#isPaused = false;
    this.#inputManager.requestPointerLock();
  }

  /**
   * Check if controls are enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.#isEnabled;
  }

  /**
   * Check if player is grounded
   * @returns {boolean}
   */
  isGrounded() {
    return this.#movement.isGrounded();
  }

  /**
   * Check if player is sprinting
   * @returns {boolean}
   */
  isSprinting() {
    return this.#movement.isSprinting();
  }

  /**
   * Get current stamina
   * @returns {number}
   */
  getStamina() {
    return this.#movement.getStamina();
  }

  /**
   * Get player position
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.#movement.getPosition();
  }

  /**
   * Get player velocity
   * @returns {THREE.Vector3}
   */
  getVelocity() {
    return this.#movement.getVelocity();
  }

  /**
   * Get the camera
   * @returns {THREE.Camera}
   */
  getCamera() {
    return this.#camera;
  }

  /**
   * Get the controls
   * @returns {PointerLockControls}
   */
  getControls() {
    return this.#controls;
  }

  /**
   * Get the input manager
   * @returns {InputManager}
   */
  getInputManager() {
    return this.#inputManager;
  }

  /**
   * Set collision system
   * @param {CollisionSystem} collisionSystem
   */
  setCollisionSystem(collisionSystem) {
    this.#collisionSystem = collisionSystem;
  }

  /**
   * Teleport player to position
   * @param {THREE.Vector3} position
   */
  teleport(position) {
    this.#movement.teleport(position);
    this.#camera.position.copy(this.#movement.getEyePosition());
  }

  /**
   * Reset player state
   */
  reset() {
    this.#movement.reset();
    this.#inputManager.disable();
    this.#inputManager.enable();
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.disable();

    this.#domElement.removeEventListener('click', this.#pointerLockHandler);

    this.#inputManager.dispose();
    this.#movement = null;

    this.#controls = null;
    this.#camera = null;
  }
}
