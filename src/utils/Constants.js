/**
 * Game Constants - Groucho the Hunter
 * Centralized configuration values for game systems
 * @module utils/Constants
 */

'use strict';

/**
 * Game States
 * @readonly
 * @enum {string}
 */
export const GAME_STATES = {
  LOADING: 'loading',
  MAIN_MENU: 'main_menu',
  PLAYING: 'playing',
  PAUSED: 'paused',
  PUZZLE: 'puzzle',
  CUTSCENE: 'cutscene',
  GAME_OVER: 'game_over',
  VICTORY: 'victory'
};

/**
 * Player Configuration
 * @readonly
 */
export const PLAYER = {
  DEFAULT_SPEED: 5.0,
  SPRINT_MULTIPLIER: 1.5,
  JUMP_FORCE: 8.0,
  MAX_STAMINA: 100,
  STAMINA_DRAIN: 20, // per second
  STAMINA_REGEN: 10, // per second
  HEIGHT: 1.8,
  RADIUS: 0.3,
  EYE_HEIGHT: 1.6,
  MOUSE_SENSITIVITY: 0.002
};

/**
 * Physics Configuration
 * @readonly
 */
export const PHYSICS = {
  GRAVITY: -9.81,
  TERMINAL_VELOCITY: -50,
  FRICTION: 0.9,
  AIR_RESISTANCE: 0.98,
  GROUND_CHECK_DISTANCE: 0.1
};

/**
 * Rendering Configuration
 * @readonly
 */
export const RENDERING = {
  MAX_DRAW_CALLS: 100,
  SHADOW_MAP_SIZE: 2048,
  FOV: 75,
  NEAR_PLANE: 0.1,
  FAR_PLANE: 1000,
  TARGET_FPS: 60,
  MAX_DELTA_TIME: 0.1 // Cap at 100ms to prevent large time steps
};

/**
 * Input Key Mappings
 * @readonly
 */
export const INPUT_KEYS = {
  FORWARD: 'KeyW',
  BACKWARD: 'KeyS',
  LEFT: 'KeyA',
  RIGHT: 'KeyD',
  JUMP: 'Space',
  SPRINT: 'ShiftLeft',
  CROUCH: 'ControlLeft',
  INTERACT: 'KeyE',
  SCANNER: 'KeyQ',
  PAUSE: 'Escape',
  FLASHLIGHT: 'KeyF'
};

/**
 * Tool Types
 * @readonly
 * @enum {string}
 */
export const TOOL_TYPES = {
  SCANNER: 'scanner',
  PACKET_SNIFFER: 'packet_sniffer',
  FIREWALL: 'firewall',
  DECRYPTOR: 'decryptor',
  MEMORY_ANALYZER: 'memory_analyzer'
};

/**
 * Puzzle Types
 * @readonly
 * @enum {string}
 */
export const PUZZLE_TYPES = {
  LOG_ANALYSIS: 'log_analysis',
  PHISHING_HUNT: 'phishing_hunt',
  USB_ANALYSIS: 'usb_analysis',
  SIEM_TRIAGE: 'siem_triage',
  MEMORY_FORENSICS: 'memory_forensics',
  NETWORK_MAPPING: 'network_mapping'
};

/**
 * Threat Types (Enemy classifications)
 * @readonly
 * @enum {string}
 */
export const THREAT_TYPES = {
  MALWARE: 'malware',
  PHISHING: 'phishing',
  DDOS: 'ddos',
  APT: 'apt',
  RANSOMWARE: 'ransomware'
};

/**
 * Level Identifiers
 * @readonly
 * @enum {string}
 */
export const LEVELS = {
  OUTSKIRTS: 'level_1_outskirts',
  SOC: 'level_2_soc',
  DEEP_NET: 'level_3_deep_net',
  CORE: 'level_4_core'
};

/**
 * Audio Configuration
 * @readonly
 */
export const AUDIO = {
  MASTER_VOLUME: 1.0,
  MUSIC_VOLUME: 0.7,
  SFX_VOLUME: 0.8,
  DIALOGUE_VOLUME: 1.0,
  AMBIENT_VOLUME: 0.5,
  MAX_DISTANCE: 100,
  ROLLOFF_FACTOR: 1.0
};

/**
 * UI Configuration
 * @readonly
 */
export const UI = {
  CROSSHAIR_SIZE: 20,
  INTERACTION_RANGE: 5, // meters
  HUD_UPDATE_INTERVAL: 100, // ms
  FADE_DURATION: 0.5, // seconds
  NOTIFICATION_DURATION: 3 // seconds
};

/**
 * Progression Configuration
 * @readonly
 */
export const PROGRESSION = {
  XP_PER_PUZZLE: 100,
  XP_PER_THREAT: 50,
  XP_PER_SECRET: 25,
  LEVEL_UP_MULTIPLIER: 1.5
};

/**
 * Debug Configuration (Development Only)
 * @readonly
 */
export const DEBUG = {
  ENABLED: import.meta.env?.DEV || false,
  SHOW_FPS: true,
  SHOW_COLLIDERS: false,
  SHOW_ENTITY_COUNT: false,
  LOG_LEVEL: 'debug' // debug, info, warn, error
};

/**
 * Storage Keys for LocalStorage
 * @readonly
 */
export const STORAGE_KEYS = {
  SETTINGS: 'groucho_settings',
  SAVE_GAME: 'groucho_save',
  PROGRESS: 'groucho_progress',
  UNLOCKS: 'groucho_unlocks'
};
