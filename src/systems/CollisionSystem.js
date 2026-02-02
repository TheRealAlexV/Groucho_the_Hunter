/**
 * CollisionSystem - Handles collision detection using three-mesh-bvh
 * Provides optimized raycasting for player movement and object interaction
 * @module systems/CollisionSystem
 */

'use strict';

import * as THREE from 'three';
import { MeshBVH, acceleratedRaycast } from 'three-mesh-bvh';

/**
 * CollisionSystem class for optimized collision detection
 * Uses three-mesh-bvh for fast raycasting against static geometry
 * @class
 */
export class CollisionSystem {
  /** @type {THREE.Mesh|null} */
  #collisionMesh = null;

  /** @type {THREE.Raycaster} */
  #raycaster;

  /** @type {number} */
  #playerRadius = 0.3;

  /** @type {number} */
  #playerHeight = 1.8;

  /** @type {boolean} */
  #isInitialized = false;

  /**
   * Creates a new CollisionSystem
   * @param {Object} [options] - CollisionSystem options
   * @param {number} [options.playerRadius=0.3] - Player collision radius
   * @param {number} [options.playerHeight=1.8] - Player collision height
   */
  constructor(options = {}) {
    this.#playerRadius = options.playerRadius || 0.3;
    this.#playerHeight = options.playerHeight || 1.8;
    this.#raycaster = new THREE.Raycaster();
    this.#raycaster.firstHitOnly = true;

    // Override THREE.js raycasting with accelerated version
    THREE.Mesh.prototype.raycast = acceleratedRaycast;
  }

  /**
   * Build BVH from level geometry
   * @param {THREE.Mesh|THREE.Group} levelMesh - Level geometry mesh or group
   */
  buildFromLevel(levelMesh) {
    if (!levelMesh) {
      console.warn('CollisionSystem: No level mesh provided');
      return;
    }

    // Update world matrices before traversing
    levelMesh.updateMatrixWorld(true);

    // If it's a group, merge all geometries
    if (levelMesh.isGroup) {
      const geometries = [];
      levelMesh.traverse((child) => {
        if (child.isMesh && child.geometry) {
          const clone = child.geometry.clone();
          clone.applyMatrix4(child.matrixWorld);
          geometries.push(clone);
        }
      });

      if (geometries.length === 0) {
        console.warn('CollisionSystem: No geometries found in level group');
        return;
      }

      // Merge geometries
      const mergedGeometry = this.#mergeGeometries(geometries);
      this.#createBVH(mergedGeometry);
    } else if (levelMesh.isMesh) {
      // Single mesh
      const geometry = levelMesh.geometry.clone();
      this.#createBVH(geometry);
    } else {
      console.warn('CollisionSystem: Invalid level mesh type');
    }

    this.#isInitialized = true;
    console.log('CollisionSystem: BVH built successfully');
  }

  /**
   * Merge multiple geometries into one
   * @private
   * @param {Array<THREE.BufferGeometry>} geometries
   * @returns {THREE.BufferGeometry}
   */
  #mergeGeometries(geometries) {
    // Simple merge using BufferGeometryUtils pattern
    let totalVertices = 0;
    let totalIndices = 0;

    geometries.forEach((geom) => {
      totalVertices += geom.attributes.position.count;
      totalIndices += geom.index ? geom.index.count : geom.attributes.position.count;
    });

    const mergedGeometry = new THREE.BufferGeometry();
    const positionArray = new Float32Array(totalVertices * 3);
    const normalArray = new Float32Array(totalVertices * 3);
    const indexArray = new Uint32Array(totalIndices);

    let vertexOffset = 0;
    let indexOffset = 0;

    geometries.forEach((geom) => {
      const positions = geom.attributes.position.array;
      const normals = geom.attributes.normal?.array;
      const indices = geom.index?.array;

      // Copy positions
      for (let i = 0; i < positions.length; i++) {
        positionArray[vertexOffset * 3 + i] = positions[i];
      }

      // Copy normals
      if (normals) {
        for (let i = 0; i < normals.length; i++) {
          normalArray[vertexOffset * 3 + i] = normals[i];
        }
      }

      // Copy indices
      if (indices) {
        for (let i = 0; i < indices.length; i++) {
          indexArray[indexOffset + i] = indices[i] + vertexOffset;
        }
        indexOffset += indices.length;
      }

      vertexOffset += geom.attributes.position.count;
    });

    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(positionArray, 3));
    mergedGeometry.setAttribute('normal', new THREE.BufferAttribute(normalArray, 3));
    mergedGeometry.setIndex(new THREE.BufferAttribute(indexArray, 1));

    return mergedGeometry;
  }

  /**
   * Create BVH from geometry
   * @private
   * @param {THREE.BufferGeometry} geometry
   */
  #createBVH(geometry) {
    // Create BVH for the geometry using three-mesh-bvh
    const bvh = new MeshBVH(geometry, {
      maxLeafSize: 10,
      strategy: 0, // SAH (Surface Area Heuristic)
      verbose: false
    });

    this.#collisionMesh = new THREE.Mesh(geometry);
    this.#collisionMesh.geometry.boundsTree = bvh;
  }

  /**
   * Check for collision at a position
   * @param {THREE.Vector3} position - Position to check
   * @param {THREE.Vector3} [velocity] - Optional velocity to check movement
   * @returns {CollisionResult}
   */
  checkCollision(position, velocity = null) {
    if (!this.#isInitialized) {
      return { collision: false, point: null, normal: null };
    }

    const checkPosition = position.clone();
    if (velocity) {
      checkPosition.add(velocity);
    }

    // Check multiple points around player (feet, center, head)
    const checkPoints = [
      checkPosition.clone().add(new THREE.Vector3(0, 0.1, 0)), // Feet
      checkPosition.clone().add(new THREE.Vector3(0, this.#playerHeight * 0.5, 0)), // Center
      checkPosition.clone().add(new THREE.Vector3(0, this.#playerHeight - 0.1, 0)), // Head
      // Add points around player radius
      checkPosition.clone().add(new THREE.Vector3(this.#playerRadius, this.#playerHeight * 0.5, 0)),
      checkPosition.clone().add(new THREE.Vector3(-this.#playerRadius, this.#playerHeight * 0.5, 0)),
      checkPosition.clone().add(new THREE.Vector3(0, this.#playerHeight * 0.5, this.#playerRadius)),
      checkPosition.clone().add(new THREE.Vector3(0, this.#playerHeight * 0.5, -this.#playerRadius))
    ];

    for (const point of checkPoints) {
      // Raycast from slightly above/below to detect surfaces
      const directions = [
        new THREE.Vector3(0, -1, 0), // Down
        new THREE.Vector3(0, 1, 0), // Up
        new THREE.Vector3(1, 0, 0), // Right
        new THREE.Vector3(-1, 0, 0), // Left
        new THREE.Vector3(0, 0, 1), // Forward
        new THREE.Vector3(0, 0, -1) // Back
      ];

      for (const direction of directions) {
        this.#raycaster.set(point, direction);
        this.#raycaster.near = 0;
        this.#raycaster.far = this.#playerRadius * 2;

        const intersects = this.#raycaster.intersectObject(this.#collisionMesh);

        if (intersects.length > 0 && intersects[0].distance < this.#playerRadius) {
          return {
            collision: true,
            point: intersects[0].point,
            normal: intersects[0].face?.normal || new THREE.Vector3(0, 1, 0),
            distance: intersects[0].distance
          };
        }
      }
    }

    return { collision: false, point: null, normal: null };
  }

  /**
   * Check ground collision and return ground height
   * @param {THREE.Vector3} position - Player position
   * @param {number} [checkDistance=0.2] - Distance to check below
   * @returns {GroundCheckResult}
   */
  checkGround(position, checkDistance = 0.2) {
    if (!this.#isInitialized) {
      return { isGrounded: false, height: null };
    }

    // Raycast down from player feet
    const rayOrigin = position.clone().add(new THREE.Vector3(0, 0.1, 0));
    const rayDirection = new THREE.Vector3(0, -1, 0);

    this.#raycaster.set(rayOrigin, rayDirection);
    this.#raycaster.near = 0;
    this.#raycaster.far = checkDistance + 0.1;

    const intersects = this.#raycaster.intersectObject(this.#collisionMesh);

    if (intersects.length > 0) {
      return {
        isGrounded: true,
        height: intersects[0].point.y,
        normal: intersects[0].face?.normal || new THREE.Vector3(0, 1, 0)
      };
    }

    return { isGrounded: false, height: null };
  }

  /**
   * Check if movement is valid (no wall clipping)
   * @param {THREE.Vector3} currentPosition - Current player position
   * @param {THREE.Vector3} desiredMovement - Desired movement vector
   * @returns {MovementResult}
   */
  checkMovement(currentPosition, desiredMovement) {
    if (!this.#isInitialized || desiredMovement.lengthSq() === 0) {
      return {
        allowed: true,
        position: currentPosition.clone().add(desiredMovement),
        slideVector: desiredMovement
      };
    }

    const targetPosition = currentPosition.clone().add(desiredMovement);

    // Check collision at target position
    const collision = this.checkCollision(targetPosition);

    if (!collision.collision) {
      return {
        allowed: true,
        position: targetPosition,
        slideVector: desiredMovement
      };
    }

    // Try sliding along walls
    // Separate movement into X/Z components
    const movementXZ = new THREE.Vector3(desiredMovement.x, 0, desiredMovement.z);
    const positionXZ = currentPosition.clone();
    positionXZ.y = targetPosition.y;

    // Try X-only movement
    const xOnly = new THREE.Vector3(desiredMovement.x, 0, 0);
    const xCollision = this.checkCollision(currentPosition.clone().add(xOnly));

    // Try Z-only movement
    const zOnly = new THREE.Vector3(0, 0, desiredMovement.z);
    const zCollision = this.checkCollision(currentPosition.clone().add(zOnly));

    const finalPosition = currentPosition.clone();
    const slideVector = new THREE.Vector3();

    if (!xCollision.collision) {
      slideVector.x = desiredMovement.x;
      finalPosition.x += desiredMovement.x;
    }

    if (!zCollision.collision) {
      slideVector.z = desiredMovement.z;
      finalPosition.z += desiredMovement.z;
    }

    // Allow vertical movement
    slideVector.y = desiredMovement.y;
    finalPosition.y += desiredMovement.y;

    return {
      allowed: slideVector.lengthSq() > 0,
      position: finalPosition,
      slideVector
    };
  }

  /**
   * Raycast from origin in direction
   * @param {THREE.Vector3} origin - Ray origin
   * @param {THREE.Vector3} direction - Ray direction
   * @param {number} [maxDistance=100] - Maximum distance
   * @returns {Array<THREE.Intersection>}
   */
  raycast(origin, direction, maxDistance = 100) {
    if (!this.#isInitialized) {
      return [];
    }

    this.#raycaster.set(origin, direction.normalize());
    this.#raycaster.near = 0;
    this.#raycaster.far = maxDistance;

    return this.#raycaster.intersectObject(this.#collisionMesh);
  }

  /**
   * Check if initialized
   * @returns {boolean}
   */
  isInitialized() {
    return this.#isInitialized;
  }

  /**
   * Clean up resources
   */
  dispose() {
    if (this.#collisionMesh) {
      this.#collisionMesh.geometry.dispose();
    }
    this.#collisionMesh = null;
    this.#isInitialized = false;
  }
}
