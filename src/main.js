// src/main-simple.js
// Simplified hadouken demo with text flow

import { Camera } from './camera.js';
import { HandTracker } from './handTracker.js';
import { GestureDetector } from './gestureDetector.js';
import { TextFlow } from './textFlow.js';
import { SimpleRenderer } from './simpleRenderer.js';
import { BlastProjectile } from './blastProjectile.js';
import { AudioManager } from './audioManager.js';

// Generate ASCII density-shaded text for human silhouette
// Uses different characters for different density levels (like the pretext demo)
function generateDensityText(length) {
  // ASCII density palette (darkest to lightest)
  // Dense areas (core/mass): @, #, 8
  // Medium areas: +, =, *, x
  // Light areas (edges): -, :, .
  // Binary themed: use 0 and 1 with different densities
  const densityChars = '@#81O0o+*-:. ';

  let text = '';
  for (let i = 0; i < length; i++) {
    // Create varied density - use randomness to create texture
    const rand = Math.random();
    let char;

    if (rand > 0.7) {
      // Dense areas (30%)
      char = densityChars[Math.floor(Math.random() * 4)]; // @, #, 8, 1
    } else if (rand > 0.4) {
      // Medium areas (30%)
      char = densityChars[Math.floor(4 + Math.random() * 4)]; // O, 0, o, +
    } else {
      // Light areas (40%)
      char = densityChars[Math.floor(8 + Math.random() * 5)]; // *, -, :, ., space
    }

    text += char;
  }
  return text;
}

const DEMO_TEXT = generateDensityText(10000); // Dense ASCII art with varied characters

class HadoukenTextFlowApp {
  constructor() {
    this.container = document.getElementById('stage');
    this.loadingEl = document.getElementById('loading');
    this.statusEl = document.getElementById('status');
    this.fpsEl = document.getElementById('fps');
    this.gestureEl = document.getElementById('gesture');
    this.handFeedbackEl = document.getElementById('hand-feedback');
    this.handStatusEl = document.getElementById('hand-status');
    this.handTipEl = document.getElementById('hand-tip');

    this.camera = null;
    this.handTracker = null;
    this.gestureDetector = null;
    this.textFlow = null;
    this.renderer = null;
    this.blastProjectile = null;
    this.audioManager = null;

    this.lastTime = performance.now();
    this.frameCount = 0;
    this.fpsUpdateTime = 0;
    this.prevGestureState = 'IDLE';
  }

  async init() {
    try {
      // Initialize camera
      this.camera = new Camera();
      await this.camera.init();

      // Initialize hand tracker
      this.handTracker = new HandTracker();
      await this.handTracker.init(this.camera.getVideoElement());

      // Initialize gesture detector
      this.gestureDetector = new GestureDetector(
        window.innerWidth,
        window.innerHeight
      );

      // Initialize text flow with smaller, denser settings for binary text
      this.textFlow = new TextFlow(
        DEMO_TEXT,
        '12px "Courier New", Courier, monospace',
        14,
        window.innerWidth,
        window.innerHeight
      );

      // Initial layout with no obstacles
      this.textFlow.reflow();

      // Initialize renderer
      this.renderer = new SimpleRenderer(this.container);
      this.renderer.setVideoSource(this.camera.getVideoElement());

      // Initialize audio
      this.audioManager = new AudioManager();
      await this.audioManager.init();

      // Start background music (may require user interaction)
      // Try to start immediately, but browser may block until first gesture
      this.audioManager.startBGM();

      // Hand tracking callback
      this.handTracker.onResults((results) => {
        this.gestureDetector.update(results);
      });

      // Hide loading (status stays hidden - no FPS/gesture display needed)
      this.loadingEl.classList.add('hidden');

      // Show hand feedback
      this.handFeedbackEl.classList.remove('hidden');

      // Handle window resize
      window.addEventListener('resize', () => this.handleResize());

      // Start game loop
      this.lastTime = performance.now();
      this.gameLoop();

    } catch (error) {
      console.error('Initialization failed:', error);
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error';
      errorDiv.textContent = `Error: ${error.message}`;

      const errorDetail = document.createElement('div');
      errorDetail.className = 'error-detail';
      errorDetail.textContent = 'Please ensure camera access is allowed';

      this.loadingEl.textContent = '';
      this.loadingEl.appendChild(errorDiv);
      this.loadingEl.appendChild(errorDetail);
    }
  }

  gameLoop() {
    requestAnimationFrame(() => this.gameLoop());

    const now = performance.now();
    const deltaTime = now - this.lastTime;
    this.lastTime = now;

    // Update FPS counter
    this.frameCount++;
    this.fpsUpdateTime += deltaTime;
    if (this.fpsUpdateTime >= 1000) {
      const fps = Math.round(this.frameCount / (this.fpsUpdateTime / 1000));
      this.fpsEl.textContent = `FPS: ${fps}`;
      this.frameCount = 0;
      this.fpsUpdateTime = 0;
    }

    // Update gesture status
    const gestureState = this.gestureDetector.getState();
    this.gestureEl.textContent = `Gesture: ${gestureState}`;

    // Update hand detection feedback with helpful tips
    const hands = this.gestureDetector.getHandsForDebug();
    if (hands.left && hands.right) {
      this.handStatusEl.textContent = 'Both hands detected ✓';
      this.handTipEl.textContent = 'Ready to hadouken!';
      this.handFeedbackEl.classList.add('both-hands');
    } else if (hands.left || hands.right) {
      this.handStatusEl.textContent = 'One hand detected';
      this.handTipEl.textContent = '💡 Show your other hand to the camera';
      this.handFeedbackEl.classList.remove('both-hands');
    } else {
      this.handStatusEl.textContent = 'No hands detected';
      this.handTipEl.textContent = '💡 Move closer, improve lighting, or spread hands apart';
      this.handFeedbackEl.classList.remove('both-hands');
    }

    // Handle audio based on state changes
    if (gestureState !== this.prevGestureState) {
      // Start BGM on first gesture if not playing (handles browser autoplay restrictions)
      if (gestureState === 'CHARGING' && !this.audioManager.bgmPlaying) {
        this.audioManager.startBGM();
      }

      if (gestureState === 'CHARGING') {
        this.audioManager.startCharging();
      } else if (this.prevGestureState === 'CHARGING' || this.prevGestureState === 'BLAST_READY') {
        this.audioManager.stopCharging();
      }

      if (gestureState === 'BLASTING') {
        this.audioManager.playBlast();
      }

      this.prevGestureState = gestureState;
    }

    // Handle blast firing
    if (gestureState === 'BLASTING' && !this.blastProjectile) {
      const pos = this.gestureDetector.getBlastPosition();
      const dir = this.gestureDetector.getBlastDirection();
      this.blastProjectile = new BlastProjectile(
        pos.x,
        pos.y,
        dir.x,
        dir.y,
        window.innerWidth,
        window.innerHeight
      );
    }

    // Update blast projectile
    if (this.blastProjectile) {
      // Simple collision: check if blast reached right side where text is
      const textRegionLeft = window.innerWidth * 0.65;
      const didHit = this.blastProjectile.x > textRegionLeft;

      const result = this.blastProjectile.update(deltaTime, null);

      if (didHit && result === 'active' && !this.blastProjectile.playedImpact) {
        this.audioManager.playImpact();
        this.blastProjectile.playedImpact = true;
      }

      if (result === 'miss' || result === 'inactive') {
        this.blastProjectile = null;
      }
    }

    // Update text flow based on gesture and blast
    const obstacles = [];

    // Charging orb
    if (gestureState === 'CHARGING' || gestureState === 'BLAST_READY') {
      const pos = this.gestureDetector.getBlastPosition();
      const progress = this.gestureDetector.getChargingProgress();
      const radius = 50 + progress * 50; // Grow from 50 to 100
      obstacles.push({ cx: pos.x, cy: pos.y, r: radius, hPad: 20, vPad: 10 });
    }

    // Moving blast projectile
    if (this.blastProjectile && this.blastProjectile.isActive()) {
      const pos = this.blastProjectile.getPosition();
      obstacles.push({ cx: pos.x, cy: pos.y, r: pos.radius, hPad: 25, vPad: 15 });
    }

    // Update obstacles and reflow text
    this.textFlow.setObstacles(obstacles);

    // Render
    this.render();
  }

  render() {
    // Render text lines
    this.renderer.setLines(this.textFlow.getLines());

    // Render charging orb or moving blast
    const gestureState = this.gestureDetector.getState();

    if (this.blastProjectile && this.blastProjectile.isActive()) {
      // Show moving blast
      const pos = this.blastProjectile.getPosition();
      this.renderer.setOrb(pos, pos.radius, true);
    } else if (gestureState === 'CHARGING' || gestureState === 'BLAST_READY') {
      // Show charging orb
      const pos = this.gestureDetector.getBlastPosition();
      const progress = this.gestureDetector.getChargingProgress();
      const radius = 50 + progress * 50;
      this.renderer.setOrb(pos, radius, true);
    } else {
      this.renderer.setOrb(null, 0, false);
    }
  }

  handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;

    // Update gesture detector dimensions
    this.gestureDetector.canvasWidth = width;
    this.gestureDetector.canvasHeight = height;

    // Update text flow dimensions
    this.textFlow.resize(width, height);
  }

  dispose() {
    if (this.camera) this.camera.stop();
    if (this.handTracker) this.handTracker.stop();
    if (this.renderer) this.renderer.clear();
  }
}

// Initialize app
const app = new HadoukenTextFlowApp();
app.init();

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  app.dispose();
});
