/**
 * TestLevel - Simple test environment for player controller
 * Creates a basic room with obstacles for movement and collision testing
 * @module world/levels/TestLevel
 */

'use strict';

import * as THREE from 'three';
import { RENDERING } from '../../utils/Constants.js';

/**
 * TestLevel class for creating a simple test environment
 * @class
 */
export class TestLevel {
  /** @type {THREE.Scene|null} */
  #scene = null;

  /** @type {THREE.Group|null} */
  #levelGroup = null;

  /** @type {Array<THREE.Object3D>} */
  #objects = [];

  /** @type {boolean} */
  #showWireframe = false;

  /** @type {THREE.Material} */
  #floorMaterial;

  /** @type {THREE.Material} */
  #wallMaterial;

  /** @type {THREE.Material} */
  #obstacleMaterial;

  /**
   * Creates a new TestLevel
   * @param {Object} [options] - TestLevel options
   * @param {boolean} [options.showWireframe=false] - Show wireframe for debugging
   */
  constructor(options = {}) {
    this.#showWireframe = options.showWireframe || false;
    this.#createMaterials();
  }

  /**
   * Create level materials
   * @private
   */
  #createMaterials() {
    const materialOptions = {
      wireframe: this.#showWireframe
    };

    this.#floorMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.1,
      ...materialOptions
    });

    this.#wallMaterial = new THREE.MeshStandardMaterial({
      color: 0x666666,
      roughness: 0.9,
      metalness: 0.1,
      ...materialOptions
    });

    this.#obstacleMaterial = new THREE.MeshStandardMaterial({
      color: 0x884444,
      roughness: 0.5,
      metalness: 0.3,
      ...materialOptions
    });
  }

  /**
   * Build the test level in a scene
   * @param {THREE.Scene} scene - Three.js scene
   * @returns {THREE.Group} Level group for collision
   */
  build(scene) {
    this.#scene = scene;
    this.#levelGroup = new THREE.Group();
    this.#levelGroup.name = 'TestLevel';

    this.#createRoom();
    this.#createObstacles();
    this.#createLighting();
    this.#createVisualMarkers();

    this.#scene.add(this.#levelGroup);

    console.log('TestLevel: Built test environment');
    return this.#levelGroup;
  }

  /**
   * Create the room (floor, walls, ceiling)
   * @private
   */
  #createRoom() {
    const roomSize = 20;
    const wallHeight = 5;

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    floorGeometry.rotateX(-Math.PI / 2);
    const floor = new THREE.Mesh(floorGeometry, this.#floorMaterial);
    floor.name = 'Floor';
    floor.receiveShadow = true;
    this.#levelGroup.add(floor);
    this.#objects.push(floor);

    // Ceiling
    const ceilingGeometry = new THREE.PlaneGeometry(roomSize, roomSize);
    ceilingGeometry.rotateX(Math.PI / 2);
    const ceiling = new THREE.Mesh(ceilingGeometry, this.#wallMaterial);
    ceiling.position.y = wallHeight;
    ceiling.name = 'Ceiling';
    this.#levelGroup.add(ceiling);

    // Walls
    const wallThickness = 0.5;
    const halfSize = roomSize / 2;

    // North wall
    this.#createWall(
      new THREE.Vector3(0, wallHeight / 2, -halfSize),
      new THREE.Vector3(roomSize, wallHeight, wallThickness),
      'Wall_North'
    );

    // South wall
    this.#createWall(
      new THREE.Vector3(0, wallHeight / 2, halfSize),
      new THREE.Vector3(roomSize, wallHeight, wallThickness),
      'Wall_South'
    );

    // East wall
    this.#createWall(
      new THREE.Vector3(halfSize, wallHeight / 2, 0),
      new THREE.Vector3(wallThickness, wallHeight, roomSize),
      'Wall_East'
    );

    // West wall
    this.#createWall(
      new THREE.Vector3(-halfSize, wallHeight / 2, 0),
      new THREE.Vector3(wallThickness, wallHeight, roomSize),
      'Wall_West'
    );
  }

  /**
   * Create a wall
   * @private
   * @param {THREE.Vector3} position - Wall position
   * @param {THREE.Vector3} size - Wall size
   * @param {string} name - Wall name
   */
  #createWall(position, size, name) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const wall = new THREE.Mesh(geometry, this.#wallMaterial);
    wall.position.copy(position);
    wall.name = name;
    wall.castShadow = true;
    wall.receiveShadow = true;
    this.#levelGroup.add(wall);
    this.#objects.push(wall);
  }

  /**
   * Create obstacles for collision testing
   * @private
   */
  #createObstacles() {
    // Central platform
    this.#createBox(
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(4, 1, 4),
      'Platform_Center'
    );

    // Corner boxes
    this.#createBox(
      new THREE.Vector3(-6, 0.75, -6),
      new THREE.Vector3(2, 1.5, 2),
      'Box_Corner_1'
    );

    this.#createBox(
      new THREE.Vector3(6, 0.75, -6),
      new THREE.Vector3(2, 1.5, 2),
      'Box_Corner_2'
    );

    this.#createBox(
      new THREE.Vector3(-6, 0.75, 6),
      new THREE.Vector3(2, 1.5, 2),
      'Box_Corner_3'
    );

    this.#createBox(
      new THREE.Vector3(6, 0.75, 6),
      new THREE.Vector3(2, 1.5, 2),
      'Box_Corner_4'
    );

    // Wall obstacles
    this.#createBox(
      new THREE.Vector3(-3, 1, 0),
      new THREE.Vector3(0.5, 2, 3),
      'Obstacle_Wall_1'
    );

    this.#createBox(
      new THREE.Vector3(3, 1, 0),
      new THREE.Vector3(0.5, 2, 3),
      'Obstacle_Wall_2'
    );

    // Small stepping stones
    for (let i = 0; i < 5; i++) {
      this.#createBox(
        new THREE.Vector3(-5 + i * 2.5, 0.25, 3),
        new THREE.Vector3(1, 0.5, 1),
        `Step_${i}`
      );
    }
  }

  /**
   * Create a box obstacle
   * @private
   * @param {THREE.Vector3} position - Box position
   * @param {THREE.Vector3} size - Box size
   * @param {string} name - Box name
   */
  #createBox(position, size, name) {
    const geometry = new THREE.BoxGeometry(size.x, size.y, size.z);
    const box = new THREE.Mesh(geometry, this.#obstacleMaterial);
    box.position.copy(position);
    box.name = name;
    box.castShadow = true;
    box.receiveShadow = true;
    this.#levelGroup.add(box);
    this.#objects.push(box);
  }

  /**
   * Create lighting for the level
   * @private
   */
  #createLighting() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    ambientLight.name = 'AmbientLight';
    this.#levelGroup.add(ambientLight);

    // Directional light (sun-like)
    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(10, 20, 10);
    dirLight.name = 'DirectionalLight';
    dirLight.castShadow = true;

    // Configure shadow properties
    dirLight.shadow.mapSize.width = RENDERING.SHADOW_MAP_SIZE;
    dirLight.shadow.mapSize.height = RENDERING.SHADOW_MAP_SIZE;
    dirLight.shadow.camera.near = 0.5;
    dirLight.shadow.camera.far = 50;
    dirLight.shadow.camera.left = -15;
    dirLight.shadow.camera.right = 15;
    dirLight.shadow.camera.top = 15;
    dirLight.shadow.camera.bottom = -15;
    dirLight.shadow.bias = -0.001;

    this.#levelGroup.add(dirLight);

    // Point lights for corners
    const pointLightColors = [0xffaa00, 0x00aaff, 0xff00aa, 0xaaff00];
    const corners = [
      new THREE.Vector3(-8, 3, -8),
      new THREE.Vector3(8, 3, -8),
      new THREE.Vector3(-8, 3, 8),
      new THREE.Vector3(8, 3, 8)
    ];

    corners.forEach((pos, i) => {
      const pointLight = new THREE.PointLight(pointLightColors[i], 0.5, 10);
      pointLight.position.copy(pos);
      pointLight.name = `PointLight_${i}`;
      this.#levelGroup.add(pointLight);
    });
  }

  /**
   * Create visual markers for testing
   * @private
   */
  #createVisualMarkers() {
    // Grid helper
    const gridHelper = new THREE.GridHelper(20, 20, 0x444444, 0x222222);
    gridHelper.name = 'GridHelper';
    gridHelper.position.y = 0.01; // Slightly above floor to avoid z-fighting
    this.#levelGroup.add(gridHelper);

    // Axes helper at center
    const axesHelper = new THREE.AxesHelper(2);
    axesHelper.position.set(0, 0.1, 0);
    axesHelper.name = 'AxesHelper';
    this.#levelGroup.add(axesHelper);

    // Spawn point marker
    const spawnMarker = new THREE.Mesh(
      new THREE.RingGeometry(0.3, 0.5, 32),
      new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.5
      })
    );
    spawnMarker.rotation.x = -Math.PI / 2;
    spawnMarker.position.set(0, 0.02, 5);
    spawnMarker.name = 'SpawnMarker';
    this.#levelGroup.add(spawnMarker);
  }

  /**
   * Get spawn point for player
   * @returns {THREE.Vector3}
   */
  getSpawnPoint() {
    return new THREE.Vector3(0, 1.8, 5);
  }

  /**
   * Get level group (for collision system)
   * @returns {THREE.Group|null}
   */
  getLevelGroup() {
    return this.#levelGroup;
  }

  /**
   * Get all collision objects
   * @returns {Array<THREE.Object3D>}
   */
  getCollisionObjects() {
    return this.#objects;
  }

  /**
   * Toggle wireframe mode
   * @param {boolean} enabled
   */
  setWireframe(enabled) {
    this.#showWireframe = enabled;
    this.#floorMaterial.wireframe = enabled;
    this.#wallMaterial.wireframe = enabled;
    this.#obstacleMaterial.wireframe = enabled;
  }

  /**
   * Clean up resources
   */
  dispose() {
    this.#objects.forEach((obj) => {
      if (obj.geometry) obj.geometry.dispose();
    });

    this.#floorMaterial.dispose();
    this.#wallMaterial.dispose();
    this.#obstacleMaterial.dispose();

    if (this.#levelGroup && this.#scene) {
      this.#scene.remove(this.#levelGroup);
    }

    this.#levelGroup = null;
    this.#scene = null;
    this.#objects = [];
  }
}
