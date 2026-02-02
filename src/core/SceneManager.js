/**
 * SceneManager - Manages scenes, cameras, and scene transitions
 * Handles scene lifecycle, lighting setup, and object disposal
 * @module core/SceneManager
 */

'use strict';

import * as THREE from 'three';
import { RENDERING } from '../utils/Constants.js';
import { EventBus, GAME_EVENTS } from '../utils/EventBus.js';

/**
 * SceneManager class for managing 3D scenes and transitions
 * @class
 */
export class SceneManager {
  /** @type {THREE.Scene|null} */
  #currentScene = null;

  /** @type {THREE.Camera|null} */
  #currentCamera = null;

  /** @type {THREE.Scene|null} */
  #uiScene = null;

  /** @type {THREE.OrthographicCamera|null} */
  #uiCamera = null;

  /** @type {Map<string, THREE.Scene>} */
  #scenes = new Map();

  /** @type {EventBus} */
  #eventBus;

  /** @type {boolean} */
  #isTransitioning = false;

  /** @type {HTMLElement|null} */
  #transitionOverlay = null;

  /** @type {Object} */
  #lightingConfig = {
    ambientIntensity: 0.5,
    directionalIntensity: 1.0,
    shadowMapSize: RENDERING.SHADOW_MAP_SIZE
  };

  /**
   * Creates a new SceneManager
   * @param {EventBus} [eventBus] - Event bus instance
   */
  constructor(eventBus) {
    this.#eventBus = eventBus || EventBus.getInstance();
    this.#createTransitionOverlay();
  }

  /**
   * Create the transition overlay element
   * @private
   */
  #createTransitionOverlay() {
    this.#transitionOverlay = document.createElement('div');
    this.#transitionOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #000;
      opacity: 0;
      pointer-events: none;
      transition: opacity 0.3s ease;
      z-index: 1000;
    `;
    document.body.appendChild(this.#transitionOverlay);
  }

  /**
   * Create a new world scene with default lighting
   * @param {string} name - Scene identifier
   * @param {Object} [options] - Scene options
   * @returns {THREE.Scene}
   */
  createScene(name, options = {}) {
    const scene = new THREE.Scene();

    // Set scene background
    scene.background = new THREE.Color(options.backgroundColor || 0x0a0a0f);

    // Add fog if specified
    if (options.fog !== false) {
      scene.fog = new THREE.Fog(
        options.fogColor || 0x0a0a0f,
        options.fogNear || 10,
        options.fogFar || 100
      );
    }

    // Set up default lighting
    if (options.lighting !== false) {
      this.#setupLighting(scene, options.lighting);
    }

    // Store scene
    this.#scenes.set(name, scene);

    return scene;
  }

  /**
   * Set up default lighting for a scene
   * @private
   * @param {THREE.Scene} scene - Scene to add lights to
   * @param {Object} [config] - Lighting configuration
   */
  #setupLighting(scene, config = {}) {
    const {
      ambientColor = 0x404040,
      ambientIntensity = this.#lightingConfig.ambientIntensity,
      directionalColor = 0xffffff,
      directionalIntensity = this.#lightingConfig.directionalIntensity,
      directionalPosition = { x: 50, y: 100, z: 50 },
      shadows = true
    } = config;

    // Ambient light for base illumination
    const ambientLight = new THREE.AmbientLight(ambientColor, ambientIntensity);
    ambientLight.name = 'AmbientLight';
    scene.add(ambientLight);

    // Directional light (sun/main light)
    const dirLight = new THREE.DirectionalLight(directionalColor, directionalIntensity);
    dirLight.name = 'DirectionalLight';
    dirLight.position.set(directionalPosition.x, directionalPosition.y, directionalPosition.z);

    if (shadows) {
      dirLight.castShadow = true;
      dirLight.shadow.mapSize.width = this.#lightingConfig.shadowMapSize;
      dirLight.shadow.mapSize.height = this.#lightingConfig.shadowMapSize;
      dirLight.shadow.camera.near = 0.5;
      dirLight.shadow.camera.far = 500;
      dirLight.shadow.camera.left = -50;
      dirLight.shadow.camera.right = 50;
      dirLight.shadow.camera.top = 50;
      dirLight.shadow.camera.bottom = -50;
      dirLight.shadow.bias = -0.0005;
    }

    scene.add(dirLight);

    // Store lighting reference
    scene.userData.lights = { ambient: ambientLight, directional: dirLight };
  }

  /**
   * Create the UI overlay scene
   * @returns {THREE.Scene}
   */
  createUIScene() {
    this.#uiScene = new THREE.Scene();

    // Orthographic camera for UI (pixel-perfect)
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.#uiCamera = new THREE.OrthographicCamera(
      width / -2, width / 2,
      height / 2, height / -2,
      0.1, 1000
    );
    this.#uiCamera.position.z = 10;

    return this.#uiScene;
  }

  /**
   * Create a perspective camera with standard settings
   * @param {Object} [options] - Camera options
   * @returns {THREE.PerspectiveCamera}
   */
  createCamera(options = {}) {
    const camera = new THREE.PerspectiveCamera(
      options.fov || RENDERING.FOV,
      options.aspect || (window.innerWidth / window.innerHeight),
      options.near || RENDERING.NEAR_PLANE,
      options.far || RENDERING.FAR_PLANE
    );

    if (options.position) {
      camera.position.set(
        options.position.x || 0,
        options.position.y || 1.8,
        options.position.z || 0
      );
    }

    return camera;
  }

  /**
   * Add a point light to a scene
   * @param {THREE.Scene} scene - Target scene
   * @param {Object} config - Light configuration
   * @returns {THREE.PointLight}
   */
  addPointLight(scene, config = {}) {
    const {
      color = 0xffffff,
      intensity = 1,
      distance = 20,
      decay = 2,
      position = { x: 0, y: 5, z: 0 },
      castShadow = false
    } = config;

    const light = new THREE.PointLight(color, intensity, distance, decay);
    light.position.set(position.x, position.y, position.z);
    light.castShadow = castShadow;

    if (castShadow) {
      light.shadow.mapSize.width = 1024;
      light.shadow.mapSize.height = 1024;
      light.shadow.bias = -0.001;
    }

    scene.add(light);

    // Track point lights
    if (!scene.userData.pointLights) {
      scene.userData.pointLights = [];
    }
    scene.userData.pointLights.push(light);

    return light;
  }

  /**
   * Switch to a different scene with optional transition
   * @async
   * @param {string} sceneName - Name of scene to switch to
   * @param {Object} [options] - Transition options
   */
  async switchScene(sceneName, options = {}) {
    if (this.#isTransitioning) return;

    const targetScene = this.#scenes.get(sceneName);
    if (!targetScene) {
      console.error(`SceneManager: Scene '${sceneName}' not found`);
      return;
    }

    this.#isTransitioning = true;

    // Emit scene unload event
    if (this.#currentScene) {
      this.#eventBus.emit(GAME_EVENTS.SCENE_UNLOAD, {
        from: this.getCurrentSceneName(),
        to: sceneName
      });
    }

    // Fade out
    if (options.transition !== false) {
      await this.#fadeOut(options.fadeOutDuration || 300);
    }

    // Clear current scene
    this.clearCurrentScene();

    // Set new scene
    this.#currentScene = targetScene;

    // Create new camera if needed
    if (!this.#currentCamera || options.newCamera) {
      this.#currentCamera = this.createCamera(options.camera);
    }

    // Fade in
    if (options.transition !== false) {
      await this.#fadeIn(options.fadeInDuration || 300);
    }

    // Emit scene ready event
    this.#eventBus.emit(GAME_EVENTS.SCENE_READY, {
      scene: this.#currentScene,
      sceneName
    });

    this.#isTransitioning = false;
  }

  /**
   * Fade out transition
   * @private
   * @param {number} duration - Fade duration in ms
   * @returns {Promise<void>}
   */
  #fadeOut(duration) {
    return new Promise((resolve) => {
      if (!this.#transitionOverlay) {
        resolve();
        return;
      }

      this.#transitionOverlay.style.transition = `opacity ${duration}ms ease`;
      this.#transitionOverlay.style.opacity = '1';

      setTimeout(resolve, duration);
    });
  }

  /**
   * Fade in transition
   * @private
   * @param {number} duration - Fade duration in ms
   * @returns {Promise<void>}
   */
  #fadeIn(duration) {
    return new Promise((resolve) => {
      if (!this.#transitionOverlay) {
        resolve();
        return;
      }

      this.#transitionOverlay.style.transition = `opacity ${duration}ms ease`;
      this.#transitionOverlay.style.opacity = '0';

      setTimeout(resolve, duration);
    });
  }

  /**
   * Clear the current scene and dispose of its dynamic objects
   */
  clearCurrentScene() {
    if (!this.#currentScene) return;

    // Dispose of all objects in the scene (except lights if keeping)
    const objectsToRemove = [];

    this.#currentScene.traverse((object) => {
      if (object !== this.#currentScene) {
        objectsToRemove.push(object);
      }
    });

    objectsToRemove.forEach((object) => {
      this.disposeObject(object);
    });

    // Clear scene arrays
    while (this.#currentScene.children.length > 0) {
      this.#currentScene.remove(this.#currentScene.children[0]);
    }

    this.#currentScene = null;
    this.#currentCamera = null;
  }

  /**
   * Dispose of a Three.js object and its resources
   * @param {THREE.Object3D} object - Object to dispose
   */
  disposeObject(object) {
    if (!object) return;

    // Dispose geometry
    if (object.geometry) {
      object.geometry.dispose();
    }

    // Dispose material(s)
    if (object.material) {
      if (Array.isArray(object.material)) {
        object.material.forEach((material) => this.#disposeMaterial(material));
      } else {
        this.#disposeMaterial(object.material);
      }
    }

    // Dispose any textures in userData
    if (object.userData) {
      Object.values(object.userData).forEach((value) => {
        if (value && value.isTexture) {
          value.dispose();
        }
      });
    }

    // Remove from parent
    if (object.parent) {
      object.parent.remove(object);
    }
  }

  /**
   * Dispose of a material and its textures
   * @private
   * @param {THREE.Material} material - Material to dispose
   */
  #disposeMaterial(material) {
    if (!material) return;

    // Dispose textures
    Object.keys(material).forEach((key) => {
      const value = material[key];
      if (value && value.isTexture) {
        value.dispose();
      }
    });

    material.dispose();
  }

  /**
   * Get the current active scene
   * @returns {THREE.Scene|null}
   */
  getCurrentScene() {
    return this.#currentScene;
  }

  /**
   * Get the current active camera
   * @returns {THREE.Camera|null}
   */
  getCurrentCamera() {
    return this.#currentCamera;
  }

  /**
   * Set the current camera
   * @param {THREE.Camera} camera - Camera to set as active
   */
  setCurrentCamera(camera) {
    this.#currentCamera = camera;
  }

  /**
   * Get the UI scene
   * @returns {THREE.Scene|null}
   */
  getUIScene() {
    return this.#uiScene;
  }

  /**
   * Get the UI camera
   * @returns {THREE.OrthographicCamera|null}
   */
  getUICamera() {
    return this.#uiCamera;
  }

  /**
   * Get a stored scene by name
   * @param {string} name - Scene name
   * @returns {THREE.Scene|undefined}
   */
  getScene(name) {
    return this.#scenes.get(name);
  }

  /**
   * Get the name of the current scene
   * @returns {string|null}
   */
  getCurrentSceneName() {
    for (const [name, scene] of this.#scenes.entries()) {
      if (scene === this.#currentScene) {
        return name;
      }
    }
    return null;
  }

  /**
   * Check if a scene transition is in progress
   * @returns {boolean}
   */
  isTransitioning() {
    return this.#isTransitioning;
  }

  /**
   * Update lighting configuration
   * @param {Object} config - New lighting configuration
   */
  setLightingConfig(config) {
    this.#lightingConfig = { ...this.#lightingConfig, ...config };
  }

  /**
   * Handle window resize
   * @param {number} width - New width
   * @param {number} height - New height
   */
  handleResize(width, height) {
    // Update perspective camera
    if (this.#currentCamera && this.#currentCamera.isPerspectiveCamera) {
      this.#currentCamera.aspect = width / height;
      this.#currentCamera.updateProjectionMatrix();
    }

    // Update orthographic UI camera
    if (this.#uiCamera) {
      this.#uiCamera.left = width / -2;
      this.#uiCamera.right = width / 2;
      this.#uiCamera.top = height / 2;
      this.#uiCamera.bottom = height / -2;
      this.#uiCamera.updateProjectionMatrix();
    }
  }

  /**
   * Dispose of all scenes and resources
   */
  dispose() {
    // Clear current scene
    this.clearCurrentScene();

    // Dispose all stored scenes
    this.#scenes.forEach((scene, name) => {
      this.disposeObject(scene);
    });
    this.#scenes.clear();

    // Remove transition overlay
    if (this.#transitionOverlay && this.#transitionOverlay.parentNode) {
      this.#transitionOverlay.parentNode.removeChild(this.#transitionOverlay);
    }
    this.#transitionOverlay = null;

    // Clear UI scene
    if (this.#uiScene) {
      while (this.#uiScene.children.length > 0) {
        this.disposeObject(this.#uiScene.children[0]);
      }
      this.#uiScene = null;
    }

    this.#uiCamera = null;
    this.#currentCamera = null;

    console.log('SceneManager: Disposed');
  }
}
