// src/gestureDetector.js

import { distance, centroid } from './utils/math.js';

const STATES = {
  IDLE: 'IDLE',
  CHARGING: 'CHARGING',
  BLAST_READY: 'BLAST_READY',
  BLASTING: 'BLASTING'
};

export class GestureDetector {
  constructor(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.state = STATES.IDLE;
    this.chargingStartTime = 0;
    this.chargingDuration = 400; // ms - faster charging for better UX
    this.leftHand = null;
    this.rightHand = null;
    this.blastPosition = { x: 0, y: 0 };
    this.blastDirection = { x: 1, y: 0 };
    this.prevHandDistance = 0;
    this.prevHandY = 0;
    this.prevDistFromCenter = 0;
    this.lostPoseTime = 0; // Track when pose was lost
    this.gracePeriod = 500; // ms grace period before dropping to idle
    this.velocityHistory = []; // Track recent velocities for smoothing
    this.maxHistorySize = 3; // Smooth over last 3 frames
  }

  update(hands) {
    const now = Date.now();

    // Parse hands
    this.leftHand = null;
    this.rightHand = null;
    this.handScale = 1; // Default scale

    if (hands && hands.multiHandedness && hands.multiHandLandmarks) {
      for (let i = 0; i < hands.multiHandedness.length; i++) {
        const label = hands.multiHandedness[i].label; // 'Left' or 'Right'
        const landmarks = hands.multiHandLandmarks[i];

        const screenLandmarks = landmarks.map(lm => ({
          x: lm.x * this.canvasWidth, // No flip - direct mapping
          y: lm.y * this.canvasHeight,
          z: lm.z
        }));

        if (label === 'Left') {
          this.leftHand = screenLandmarks;
        } else {
          this.rightHand = screenLandmarks;
        }
      }

      // Calculate hand scale based on hand size (distance from wrist to middle finger tip)
      // This makes gestures work regardless of distance from camera
      if (this.leftHand || this.rightHand) {
        const scales = [];
        if (this.leftHand) {
          const wrist = this.leftHand[0];
          const middleTip = this.leftHand[12];
          scales.push(distance(wrist.x, wrist.y, middleTip.x, middleTip.y));
        }
        if (this.rightHand) {
          const wrist = this.rightHand[0];
          const middleTip = this.rightHand[12];
          scales.push(distance(wrist.x, wrist.y, middleTip.x, middleTip.y));
        }
        this.handScale = scales.reduce((a, b) => a + b, 0) / scales.length;
      }
    }

    // State machine
    switch (this.state) {
      case STATES.IDLE:
        if (this.checkChargingPose()) {
          this.state = STATES.CHARGING;
          this.chargingStartTime = now;
          this.calculateBlastVector(); // Initialize position
        }
        break;

      case STATES.CHARGING:
        if (!this.checkChargingPose()) {
          this.state = STATES.IDLE;
          this.chargingStartTime = 0;
          this.velocityHistory = []; // Reset velocity history
        } else {
          // Continuously update position while charging
          this.calculateBlastVector();
          if (now - this.chargingStartTime >= this.chargingDuration) {
            this.state = STATES.BLAST_READY;
          }
        }
        break;

      case STATES.BLAST_READY:
        if (this.checkBlastTrigger()) {
          // Blast triggered!
          this.calculateBlastVector(); // Final position
          this.state = STATES.BLASTING;
          this.lostPoseTime = 0; // Reset
          setTimeout(() => {
            this.state = STATES.IDLE;
          }, 300);
        } else if (!this.checkChargingPoseRelaxed()) {
          // Lost charging pose - but give grace period
          if (this.lostPoseTime === 0) {
            this.lostPoseTime = now;
          } else if (now - this.lostPoseTime > this.gracePeriod) {
            // Grace period expired, drop to idle
            this.state = STATES.IDLE;
            this.lostPoseTime = 0;
            this.velocityHistory = []; // Reset velocity history
          }
        } else {
          // Pose recovered or still good
          this.lostPoseTime = 0;
          // Continuously update position while ready
          this.calculateBlastVector();
        }
        break;

      case STATES.BLASTING:
        // Auto-return to IDLE after 300ms (set in BLAST_READY)
        break;
    }
  }

  checkChargingPose() {
    if (!this.leftHand || !this.rightHand) return false;

    const leftPalm = this.leftHand[9]; // Middle finger base
    const rightPalm = this.rightHand[9];

    const dist = distance(leftPalm.x, leftPalm.y, rightPalm.x, rightPalm.y);

    // Hands should be within ~2.5x hand size of each other (more forgiving)
    // This works regardless of distance from camera
    if (dist > this.handScale * 2.5) return false;

    return true;
  }

  checkChargingPoseRelaxed() {
    // More lenient check for BLAST_READY state
    if (!this.leftHand || !this.rightHand) return false;

    const leftPalm = this.leftHand[9];
    const rightPalm = this.rightHand[9];

    const dist = distance(leftPalm.x, leftPalm.y, rightPalm.x, rightPalm.y);

    // Even more lenient for holding the charge (~4x hand size - very forgiving)
    if (dist > this.handScale * 4) return false;

    return true;
  }

  checkBlastTrigger() {
    if (!this.leftHand || !this.rightHand) return false;

    const leftPalm = this.leftHand[9];
    const rightPalm = this.rightHand[9];

    // Current hand position
    const avgY = (leftPalm.y + rightPalm.y) / 2;
    const avgX = (leftPalm.x + rightPalm.x) / 2;

    // Initialize on first detection to prevent false triggers
    if (this.prevHandY === 0) {
      this.prevHandY = avgY;
    }
    if (this.prevDistFromCenter === 0) {
      const centerX = this.canvasWidth / 2;
      this.prevDistFromCenter = Math.abs(avgX - centerX);
    }

    // Check for UPWARD thrust (hands move up from hip)
    const deltaY = this.prevHandY - avgY; // Positive = moving up
    this.prevHandY = avgY;

    // Check for FORWARD thrust (hands move toward center/forward)
    const centerX = this.canvasWidth / 2;
    const distFromCenter = Math.abs(avgX - centerX);
    const deltaX = this.prevDistFromCenter - distFromCenter; // Positive = moving toward center
    this.prevDistFromCenter = distFromCenter;

    // Smooth velocity with moving average to reduce jitter
    const velocity = Math.sqrt(deltaY * deltaY + deltaX * deltaX);
    this.velocityHistory.push(velocity);
    if (this.velocityHistory.length > this.maxHistorySize) {
      this.velocityHistory.shift();
    }
    const smoothedVelocity = this.velocityHistory.reduce((a, b) => a + b, 0) / this.velocityHistory.length;

    // Trigger on upward thrust OR forward thrust
    // Thresholds relative to hand size - works at any distance from camera
    // Made MORE FORGIVING for better UX
    const upwardThrust = deltaY > this.handScale * 0.2; // Move up ~20% of hand size (was 30%)
    const forwardThrust = deltaX > this.handScale * 0.15; // Move forward ~15% of hand size (was 20%)
    const hasVelocity = smoothedVelocity > this.handScale * 0.18; // Lower velocity requirement (was 25%)

    const triggered = (upwardThrust || forwardThrust) && hasVelocity;

    return triggered;
  }

  calculateBlastVector() {
    const leftPalm = this.leftHand[9];
    const rightPalm = this.rightHand[9];

    this.blastPosition = {
      x: (leftPalm.x + rightPalm.x) / 2,
      y: (leftPalm.y + rightPalm.y) / 2
    };

    // Authentic hadouken: shoot STRAIGHT FORWARD (horizontal)
    // Determine direction based on which side of screen hands are on
    const centerX = this.canvasWidth / 2;
    const handsX = (leftPalm.x + rightPalm.x) / 2;

    if (handsX < centerX) {
      // Hands on left side, shoot right
      this.blastDirection = { x: 1, y: 0 };
    } else {
      // Hands on right side, shoot left
      this.blastDirection = { x: -1, y: 0 };
    }
  }

  getState() {
    return this.state;
  }

  getChargingProgress() {
    if (this.state !== STATES.CHARGING) return 0;
    const elapsed = Date.now() - this.chargingStartTime;
    return Math.min(elapsed / this.chargingDuration, 1);
  }

  getBlastPosition() {
    return this.blastPosition;
  }

  getBlastDirection() {
    return this.blastDirection;
  }

  getHandsForDebug() {
    return {
      left: this.leftHand,
      right: this.rightHand
    };
  }
}
