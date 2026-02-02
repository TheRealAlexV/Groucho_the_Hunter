/**
 * Movement - Player movement physics system
 * Handles movement, sprinting, jumping, and stamina management
 * @module player/Movement
 */

'use strict';

import * as THREE from 'three';
import { PLAYER, PHYSICS } from '../utils/Constants.js';

/**
 * Movement class for player physics and movement
 * Handles WASD movement, sprinting, jumping, and stamina
 * @class
 */
export class Movement {
  /** @type {THREE.Vector3} */
  #velocity;

  /** @type {THREE.Vector3} */
  #position;

  /** @type {number} */
  #stamina;

  /** @type {boolean} */
  #isGrounded;

  /** @type {boolean} */
  #isSprinting;

  /** @type {boolean} */
  #canSprint;

  /** @type {boolean} */
  #isCrouching;

  /** @type {number} */
  #currentSpeed;

  /** @type {number} */
  #playerHeight;

  /** @type {number} */
  #standingHeight;

  /** @type {number} */
  #crouchHeight;

  /** @type {Function|null} */
  #groundCheckCallback;

  /** @type {Function|null} */
  #collisionCheckCallback;

  /**
   * Creates a new Movement instance
   * @param {Object} [options] - Movement options
   * @param {number} [options.standingHeight=1.8] - Player standing height
   * @param {number} [options.crouchHeight=1.0] - Player crouch height
   */
  constructor(options = {}) {
    this.#velocity = new THREE.Vector3();
    this.#position = new THREE.Vector3();
    this.#stamina = PLAYER.MAX_STAMINA;
    this.#isGrounded = false;
    this.#isSprinting = false;
    this.#canSprint = true;
    this.#isCrouching = false;
    this.#currentSpeed = PLAYER.DEFAULT_SPEED;
    this.#standingHeight = options.standingHeight || PLAYER.HEIGHT;
    this.#crouchHeight = options.crouchHeight || 1.0;
    this.#playerHeight = this.#standingHeight;
    this.#groundCheckCallback = null;
    this.#collisionCheckCallback = null;
  }

  /**
   * Set callbacks for ground and collision checking
   * @param {Object} callbacks - Callback functions
   * @param {Function} callbacks.groundCheck - Ground check callback
   * @param {Function} callbacks.collisionCheck - Collision check callback
   */
  setCallbacks(callbacks) {
    this.#groundCheckCallback = callbacks.groundCheck || null;
    this.#collisionCheckCallback = callbacks.collisionCheck || null;
  }

  /**
   * Update movement physics
   * @param {number} deltaTime - Time since last frame
   * @param {Object} input - Input state
   * @param {THREE.Vector3} input.movementVector - Normalized movement direction (x: strafe, z: forward)
   * @param {boolean} input.isSprinting - Whether sprint is held
   * @param {boolean} input.isJumping - Whether jump is pressed
   * @param {boolean} input.isCrouching - Whether crouch is held
   * @param {THREE.Vector3} cameraDirection - Camera forward direction
   */
  update(deltaTime, input, cameraDirection) {
    // Update sprint state and stamina
    this.#updateSprintState(input.isSprinting, deltaTime);

    // Update crouch state
    this.#updateCrouchState(input.isCrouching, deltaTime);

    // Calculate movement velocity
    this.#updateMovementVelocity(input.movementVector, cameraDirection);

    // Apply gravity
    this.#applyGravity(deltaTime);

    // Handle jumping
    this.#handleJumping(input.isJumping);

    // Apply velocity to position with collision
    this.#applyMovement(deltaTime);

    // Apply friction when grounded
    this.#applyFriction(deltaTime);

    // Check ground status
    this.#checkGroundStatus();
  }

  /**
   * Update sprint state and stamina
   * @private
   * @param {boolean} isSprinting - Whether sprint is held
   * @param {number} deltaTime - Time since last frame
   */
  #updateSprintState(isSprinting, deltaTime) {
    // Can only sprint if moving forward, grounded, and has stamina
    const canStartSprinting = isSprinting &&
      this.#isGrounded &&
      !this.#isCrouching &&
      this.#stamina > 10;

    if (canStartSprinting && this.#canSprint) {
      this.#isSprinting = true;
      this.#stamina -= PLAYER.STAMINA_DRAIN * deltaTime;
      this.#currentSpeed = PLAYER.DEFAULT_SPEED * PLAYER.SPRINT_MULTIPLIER;

      // Stop sprinting if stamina depleted
      if (this.#stamina <= 0) {
        this.#stamina = 0;
        this.#canSprint = false;
        this.#isSprinting = false;
        this.#currentSpeed = PLAYER.DEFAULT_SPEED;
      }
    } else {
      this.#isSprinting = false;
      this.#currentSpeed = PLAYER.DEFAULT_SPEED;

      // Regenerate stamina when not sprinting
      if (this.#stamina < PLAYER.MAX_STAMINA) {
        this.#stamina += PLAYER.STAMINA_REGEN * deltaTime;
        if (this.#stamina >= PLAYER.MAX_STAMINA) {
          this.#stamina = PLAYER.MAX_STAMINA;
          this.#canSprint = true;
        }
      }
    }
  }

  /**
   * Update crouch state
   * @private
   * @param {boolean} isCrouching - Whether crouch is held
   * @param {number} deltaTime - Time since last frame
   */
  #updateCrouchState(isCrouching, deltaTime) {
    const targetHeight = isCrouching ? this.#crouchHeight : this.#standingHeight;
    const heightDiff = targetHeight - this.#playerHeight;

    // Smooth height transition
    if (Math.abs(heightDiff) > 0.01) {
      this.#playerHeight += heightDiff * 10 * deltaTime;
    } else {
      this.#playerHeight = targetHeight;
    }

    this.#isCrouching = isCrouching;

    // Reduce speed when crouching
    if (isCrouching) {
      this.#currentSpeed = PLAYER.DEFAULT_SPEED * 0.5;
    }
  }

  /**
   * Update movement velocity based on input
   * @private
   * @param {Object} movementVector - Movement input
   * @param {THREE.Vector3} cameraDirection - Camera forward direction
   */
  #updateMovementVelocity(movementVector, cameraDirection) {
    if (!movementVector || (movementVector.x === 0 && movementVector.z === 0)) {
      return;
    }

    // Calculate forward and right vectors from camera direction
    const forward = cameraDirection.clone();
    forward.y = 0;
    forward.normalize();

    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

    // Calculate desired velocity
    const targetVelocity = new THREE.Vector3();
    targetVelocity.addScaledVector(forward, -movementVector.z * this.#currentSpeed);
    targetVelocity.addScaledVector(right, movementVector.x * this.#currentSpeed);

    // Smoothly interpolate to target velocity
    const acceleration = this.#isGrounded ? 10 : 2; // Less control in air
    this.#velocity.x += (targetVelocity.x - this.#velocity.x) * acceleration * 0.016;
    this.#velocity.z += (targetVelocity.z - this.#velocity.z) * acceleration * 0.016;
  }

  /**
   * Apply gravity to vertical velocity
   * @private
   * @param {number} deltaTime - Time since last frame
   */
  #applyGravity(deltaTime) {
    if (!this.#isGrounded) {
      this.#velocity.y += PHYSICS.GRAVITY * deltaTime;

      // Apply terminal velocity cap
      if (this.#velocity.y < PHYSICS.TERMINAL_VELOCITY) {
        this.#velocity.y = PHYSICS.TERMINAL_VELOCITY;
      }
    }
  }

  /**
   * Handle jumping
   * @private
   * @param {boolean} isJumping - Whether jump is pressed
   */
  #handleJumping(isJumping) {
    if (isJumping && this.#isGrounded && !this.#isCrouching) {
      this.#velocity.y = PLAYER.JUMP_FORCE;
      this.#isGrounded = false;
    }
  }

  /**
   * Apply velocity to position with collision detection
   * @private
   * @param {number} deltaTime - Time since last frame
   */
  #applyMovement(deltaTime) {
    // Calculate desired movement
    const movement = this.#velocity.clone().multiplyScalar(deltaTime);

    // Check collision if callback provided
    if (this.#collisionCheckCallback) {
      const result = this.#collisionCheckCallback(this.#position, movement);

      if (result.allowed) {
        this.#position.copy(result.position);

        // If sliding occurred, update velocity to match actual movement
        if (result.slideVector) {
          this.#velocity.x = result.slideVector.x / deltaTime;
          this.#velocity.z = result.slideVector.z / deltaTime;
        }
      } else {
        // Full collision - stop horizontal movement
        this.#velocity.x = 0;
        this.#velocity.z = 0;
      }
    } else {
      // No collision system - just apply movement
      this.#position.add(movement);
    }

    // Ensure position doesn't go below ground
    if (this.#groundCheckCallback) {
      const groundResult = this.#groundCheckCallback(this.#position);
      if (groundResult.isGrounded && this.#velocity.y <= 0) {
        const minHeight = groundResult.height + this.#playerHeight * 0.5;
        if (this.#position.y < minHeight) {
          this.#position.y = minHeight;
          this.#velocity.y = 0;
          this.#isGrounded = true;
        }
      }
    }
  }

  /**
   * Apply friction to slow down movement
   * @private
   * @param {number} deltaTime - Time since last frame
   */
  #applyFriction(deltaTime) {
    if (this.#isGrounded) {
      const friction = this.#isCrouching ? PHYSICS.FRICTION * 1.5 : PHYSICS.FRICTION;
      this.#velocity.x *= Math.pow(friction, deltaTime * 60);
      this.#velocity.z *= Math.pow(friction, deltaTime * 60);

      // Stop completely if very slow
      if (Math.abs(this.#velocity.x) < 0.01) this.#velocity.x = 0;
      if (Math.abs(this.#velocity.z) < 0.01) this.#velocity.z = 0;
    } else {
      // Air resistance
      this.#velocity.x *= Math.pow(PHYSICS.AIR_RESISTANCE, deltaTime * 60);
      this.#velocity.z *= Math.pow(PHYSICS.AIR_RESISTANCE, deltaTime * 60);
    }
  }

  /**
   * Check ground status
   * @private
   */
  #checkGroundStatus() {
    if (this.#groundCheckCallback) {
      const result = this.#groundCheckCallback(this.#position);
      this.#isGrounded = result.isGrounded;
    } else {
      // Simple ground check at y=0
      this.#isGrounded = this.#position.y <= this.#playerHeight * 0.5;
      if (this.#isGrounded) {
        this.#position.y = this.#playerHeight * 0.5;
        this.#velocity.y = 0;
      }
    }
  }

  /**
   * Set player position
   * @param {THREE.Vector3} position - New position
   */
  setPosition(position) {
    this.#position.copy(position);
  }

  /**
   * Get current position
   * @returns {THREE.Vector3}
   */
  getPosition() {
    return this.#position.clone();
  }

  /**
   * Get eye position (for camera)
   * @returns {THREE.Vector3}
   */
  getEyePosition() {
    return this.#position.clone().add(new THREE.Vector3(0, this.#playerHeight * 0.5, 0));
  }

  /**
   * Get current velocity
   * @returns {THREE.Vector3}
   */
  getVelocity() {
    return this.#velocity.clone();
  }

  /**
   * Get current stamina
   * @returns {number}
   */
  getStamina() {
    return this.#stamina;
  }

  /**
   * Check if sprinting
   * @returns {boolean}
   */
  isSprinting() {
    return this.#isSprinting;
  }

  /**
   * Check if grounded
   * @returns {boolean}
   */
  isGrounded() {
    return this.#isGrounded;
  }

  /**
   * Check if crouching
   * @returns {boolean}
   */
  isCrouching() {
    return this.#isCrouching;
  }

  /**
   * Get current player height
   * @returns {number}
   */
  getPlayerHeight() {
    return this.#playerHeight;
  }

  /**
   * Reset movement state
   */
  reset() {
    this.#velocity.set(0, 0, 0);
    this.#stamina = PLAYER.MAX_STAMINA;
    this.#isGrounded = false;
    this.#isSprinting = false;
    this.#canSprint = true;
    this.#isCrouching = false;
    this.#playerHeight = this.#standingHeight;
  }

  /**
   * Teleport player to position
   * @param {THREE.Vector3} position - New position
   */
  teleport(position) {
    this.#position.copy(position);
    this.#velocity.set(0, 0, 0);
  }
}
