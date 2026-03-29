// src/handTracker.js

import { Hands } from '@mediapipe/hands';
import { Camera as MediaPipeCamera } from '@mediapipe/camera_utils';

export class HandTracker {
  constructor() {
    this.hands = null;
    this.camera = null;
    this.onResultsCallback = null;
    this.videoElement = null;
  }

  async init(videoElement) {
    this.videoElement = videoElement;

    this.hands = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
      }
    });

    this.hands.setOptions({
      maxNumHands: 2,
      modelComplexity: 1, // 1 = full model (better accuracy, worth the slight performance cost)
      minDetectionConfidence: 0.5, // Lower = easier to detect (was 0.7 - too strict!)
      minTrackingConfidence: 0.5, // Lower = maintains tracking better (was 0.7)
      selfieMode: true // Mirror the camera for natural interaction
    });

    this.hands.onResults((results) => {
      if (this.onResultsCallback) {
        this.onResultsCallback(results);
      }
    });

    this.camera = new MediaPipeCamera(videoElement, {
      onFrame: async () => {
        await this.hands.send({ image: videoElement });
      },
      width: 640, // Lower resolution = better performance = more consistent detection
      height: 480
    });

    await this.camera.start();
  }

  onResults(callback) {
    this.onResultsCallback = callback;
  }

  stop() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.hands) {
      this.hands.close();
    }
  }
}
