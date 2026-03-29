// src/blastProjectile.js

import { distance } from './utils/math.js';

export class BlastProjectile {
  constructor(x, y, directionX, directionY, canvasWidth, canvasHeight) {
    this.x = x;
    this.y = y;
    this.vx = directionX * 1000; // 1000 px/s - faster for more impact
    this.vy = directionY * 1000;
    this.radius = 40; // Larger for better visibility
    this.active = true;
    this.trail = [];
    this.maxTrailLength = 25; // Longer trail
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  update(deltaTime, textBounds) {
    if (!this.active) return 'inactive';

    const dt = deltaTime / 1000;

    // Update position
    this.x += this.vx * dt;
    this.y += this.vy * dt;

    // Add to trail
    this.trail.push({ x: this.x, y: this.y, opacity: 1 });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    // Update trail opacity
    for (let i = 0; i < this.trail.length; i++) {
      this.trail[i].opacity = i / this.trail.length;
    }

    // Check collision with text (simple bounds check)
    if (textBounds) {
      const dist = distance(this.x, this.y, textBounds.x, textBounds.y);
      const collisionDist = this.radius + Math.max(textBounds.width, textBounds.height) / 2;

      if (dist < collisionDist) {
        this.active = false;
        this.hitText = true; // Flag for impact sound
        return 'hit';
      }
    }

    // Check out of bounds
    if (
      this.x < -100 ||
      this.x > this.canvasWidth + 100 ||
      this.y < -100 ||
      this.y > this.canvasHeight + 100
    ) {
      this.active = false;
      return 'miss';
    }

    return 'active';
  }

  getPosition() {
    return { x: this.x, y: this.y, radius: this.radius };
  }

  getTrail() {
    return this.trail;
  }

  isActive() {
    return this.active;
  }
}
