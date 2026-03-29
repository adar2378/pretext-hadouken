// src/camera.js

export class Camera {
  constructor() {
    this.video = null;
    this.stream = null;
  }

  async init() {
    try {
      this.video = document.createElement('video');
      this.video.setAttribute('playsinline', '');
      this.video.style.display = 'none';
      document.body.appendChild(this.video);

      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      this.video.srcObject = this.stream;

      return new Promise((resolve, reject) => {
        this.video.onloadedmetadata = async () => {
          try {
            await this.video.play();
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        this.video.onerror = reject;
      });
    } catch (error) {
      console.error('Camera init failed:', error);
      throw new Error('Camera access denied or not available');
    }
  }

  getVideoElement() {
    return this.video;
  }

  getWidth() {
    return this.video?.videoWidth || 0;
  }

  getHeight() {
    return this.video?.videoHeight || 0;
  }

  stop() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
    }
    if (this.video) {
      this.video.srcObject = null;
      this.video.remove();
    }
  }
}
