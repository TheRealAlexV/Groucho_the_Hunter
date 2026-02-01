/**
 * Groucho the Hunter - Main Entry Point
 * A cybersecurity threat hunting FPS adventure game
 * @module main
 */

'use strict';

import './style.css';
import { GameController } from './core/Game.js';

/**
 * Application entry point
 * Initializes the game and handles browser lifecycle
 */
async function init() {
  const container = document.getElementById('game-container');

  if (!container) {
    console.error('Game container not found');
    return;
  }

  try {
    // Initialize game controller singleton
    const game = new GameController(container);

    // Initialize renderer with WebGPU/WebGL2 fallback
    await game.initialize();

    // Handle window resize
    window.addEventListener('resize', () => {
      game.handleResize(window.innerWidth, window.innerHeight);
    });

    // Handle visibility change (pause when tab is hidden)
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        game.pause();
      } else {
        game.resume();
      }
    });

    // Start the game loop
    game.start();

  } catch (error) {
    console.error('Failed to initialize game:', error);
    container.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        height: 100vh;
        color: #ff4444;
        font-family: sans-serif;
      ">
        <h1>Failed to Start Game</h1>
        <p>${error.message}</p>
        <p style="font-size: 0.9rem; color: #888; margin-top: 20px;">
          Please ensure your browser supports WebGL2 or WebGPU
        </p>
      </div>
    `;
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

