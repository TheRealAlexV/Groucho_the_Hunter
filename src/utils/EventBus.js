/**
 * EventBus - Simple pub/sub pattern for inter-system communication
 * Supports namespaced events with dot notation (e.g., 'player.move', 'game.pause')
 * @module utils/EventBus
 */

'use strict';

/**
 * EventBus class implementing pub/sub pattern
 * @class
 */
export class EventBus {
  /** @type {Map<string, Set<Function>>} */
  #listeners = new Map();

  /** @type {EventBus|null} */
  static #instance = null;

  /**
   * Get singleton instance
   * @returns {EventBus}
   */
  static getInstance() {
    if (!EventBus.#instance) {
      EventBus.#instance = new EventBus();
    }
    return EventBus.#instance;
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name (supports namespacing with '.')
   * @param {Function} callback - Callback function to invoke
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (typeof event !== 'string' || !event) {
      console.error('EventBus.on: event must be a non-empty string');
      return () => {};
    }

    if (typeof callback !== 'function') {
      console.error('EventBus.on: callback must be a function');
      return () => {};
    }

    if (!this.#listeners.has(event)) {
      this.#listeners.set(event, new Set());
    }

    this.#listeners.get(event).add(callback);

    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback to remove
   */
  off(event, callback) {
    if (typeof event !== 'string' || !event) {
      console.error('EventBus.off: event must be a non-empty string');
      return;
    }

    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.delete(callback);

      // Clean up empty listener sets
      if (listeners.size === 0) {
        this.#listeners.delete(event);
      }
    }
  }

  /**
   * Emit an event to all subscribers
   * @param {string} event - Event name
   * @param {*} data - Data to pass to callbacks
   */
  emit(event, data) {
    if (typeof event !== 'string' || !event) {
      console.error('EventBus.emit: event must be a non-empty string');
      return;
    }

    // Emit to exact match listeners
    const listeners = this.#listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`EventBus: Error in listener for '${event}':`, error);
        }
      });
    }

    // Emit to wildcard namespace listeners (e.g., 'player.*' matches 'player.move')
    const parts = event.split('.');
    let namespace = '';

    for (let i = 0; i < parts.length - 1; i++) {
      namespace += (i > 0 ? '.' : '') + parts[i];
      const wildcardEvent = namespace + '.*';
      const wildcardListeners = this.#listeners.get(wildcardEvent);

      if (wildcardListeners) {
        wildcardListeners.forEach(callback => {
          try {
            callback(data, event);
          } catch (error) {
            console.error(`EventBus: Error in wildcard listener for '${wildcardEvent}':`, error);
          }
        });
      }
    }
  }

  /**
   * Subscribe to an event that only fires once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    const onceWrapper = (data) => {
      this.off(event, onceWrapper);
      callback(data);
    };

    this.on(event, onceWrapper);
  }

  /**
   * Remove all listeners for an event, or all listeners entirely
   * @param {string} [event] - Optional event name to clear
   */
  clear(event) {
    if (event) {
      this.#listeners.delete(event);
    } else {
      this.#listeners.clear();
    }
  }

  /**
   * Get count of listeners for an event
   * @param {string} event - Event name
   * @returns {number} Number of listeners
   */
  listenerCount(event) {
    const listeners = this.#listeners.get(event);
    return listeners ? listeners.size : 0;
  }

  /**
   * Get all registered event names
   * @returns {string[]}
   */
  getEvents() {
    return Array.from(this.#listeners.keys());
  }

  /**
   * Dispose the event bus
   */
  dispose() {
    this.clear();
    EventBus.#instance = null;
  }
}

// Export singleton instance for convenience
export const eventBus = EventBus.getInstance();

// Common game events as constants
export const GAME_EVENTS = {
  // Game lifecycle
  GAME_INIT: 'game.init',
  GAME_START: 'game.start',
  GAME_PAUSE: 'game.pause',
  GAME_RESUME: 'game.resume',
  GAME_STOP: 'game.stop',

  // State changes
  STATE_CHANGE: 'state.change',
  STATE_LOADING: 'state.loading',
  STATE_PLAYING: 'state.playing',
  STATE_PAUSED: 'state.paused',

  // Scene events
  SCENE_LOAD: 'scene.load',
  SCENE_UNLOAD: 'scene.unload',
  SCENE_READY: 'scene.ready',

  // Player events
  PLAYER_SPAWN: 'player.spawn',
  PLAYER_MOVE: 'player.move',
  PLAYER_INTERACT: 'player.interact',
  PLAYER_DAMAGE: 'player.damage',

  // Input events
  KEY_PRESS: 'input.key.press',
  KEY_RELEASE: 'input.key.release',
  MOUSE_MOVE: 'input.mouse.move',
  MOUSE_CLICK: 'input.mouse.click',
  INTERACT_REQUEST: 'input.interact',
  SCANNER_TOGGLE: 'input.scanner.toggle',
  PAUSE_REQUEST: 'input.pause',

  // Pointer lock events
  POINTER_LOCK_ACQUIRED: 'pointerlock.acquired',
  POINTER_LOCK_RELEASED: 'pointerlock.released',
  POINTER_LOCK_ERROR: 'pointerlock.error',

  // UI events
  UI_SHOW: 'ui.show',
  UI_HIDE: 'ui.hide',
  UI_LOADING_PROGRESS: 'ui.loading.progress',
  UI_SHOW_MESSAGE: 'ui.show.message',

  // Puzzle events
  PUZZLE_START: 'puzzle.start',
  PUZZLE_COMPLETE: 'puzzle.complete',
  PUZZLE_FAIL: 'puzzle.fail',

  // Performance events
  PERF_WARNING: 'perf.warning',
  PERF_CRITICAL: 'perf.critical'
};
