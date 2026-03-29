// src/audioManager.js
// Audio manager for hadouken sound effects

export class AudioManager {
  constructor() {
    this.sounds = {
      charging: null,
      blast: null,
      impact: null,
      bgm: null
    };
    this.enabled = true;
    this.chargingSound = null; // Track currently playing charging sound
    this.bgmPlaying = false;
  }

  async init() {
    // Load sound files
    // Note: You'll need to add actual sound files to public/sounds/
    try {
      this.sounds.charging = new Audio('/sounds/hadouken-charge.mp3');
      this.sounds.charging.loop = true; // Charging sound loops
      this.sounds.charging.volume = 0.6;

      this.sounds.blast = new Audio('/sounds/hadouken-blast.mp3');
      this.sounds.blast.volume = 0.8;

      this.sounds.impact = new Audio('/sounds/hadouken-impact.mp3');
      this.sounds.impact.volume = 0.7;

      // Load background music
      this.sounds.bgm = new Audio('/sounds/street-fighter-bgm.mp3');
      this.sounds.bgm.loop = true;
      this.sounds.bgm.volume = 0.3; // Lower volume for background

      console.log('✅ Audio loaded');
    } catch (error) {
      console.warn('⚠️ Audio files not found. Add sound files to public/sounds/');
      this.enabled = false;
    }
  }

  startCharging() {
    if (!this.enabled || !this.sounds.charging) return;

    try {
      this.sounds.charging.currentTime = 0;
      this.sounds.charging.play().catch(e => console.warn('Audio play failed:', e));
    } catch (error) {
      console.warn('Charging sound error:', error);
    }
  }

  stopCharging() {
    if (!this.enabled || !this.sounds.charging) return;

    try {
      this.sounds.charging.pause();
      this.sounds.charging.currentTime = 0;
    } catch (error) {
      console.warn('Stop charging error:', error);
    }
  }

  playBlast() {
    if (!this.enabled || !this.sounds.blast) return;

    try {
      this.sounds.blast.currentTime = 0;
      this.sounds.blast.play().catch(e => console.warn('Audio play failed:', e));
    } catch (error) {
      console.warn('Blast sound error:', error);
    }
  }

  playImpact() {
    if (!this.enabled || !this.sounds.impact) return;

    try {
      this.sounds.impact.currentTime = 0;
      this.sounds.impact.play().catch(e => console.warn('Audio play failed:', e));
    } catch (error) {
      console.warn('Impact sound error:', error);
    }
  }

  setVolume(volume) {
    if (this.sounds.charging) this.sounds.charging.volume = volume * 0.6;
    if (this.sounds.blast) this.sounds.blast.volume = volume * 0.8;
    if (this.sounds.impact) this.sounds.impact.volume = volume * 0.7;
  }

  startBGM() {
    if (!this.enabled || !this.sounds.bgm || this.bgmPlaying) return;

    try {
      this.sounds.bgm.currentTime = 0;
      this.sounds.bgm.play().catch(e => console.warn('BGM play failed:', e));
      this.bgmPlaying = true;
      console.log('🎵 BGM started');
    } catch (error) {
      console.warn('BGM error:', error);
    }
  }

  stopBGM() {
    if (!this.sounds.bgm) return;

    try {
      this.sounds.bgm.pause();
      this.sounds.bgm.currentTime = 0;
      this.bgmPlaying = false;
    } catch (error) {
      console.warn('Stop BGM error:', error);
    }
  }

  setBGMVolume(volume) {
    if (this.sounds.bgm) {
      this.sounds.bgm.volume = volume;
    }
  }

  mute() {
    this.enabled = false;
    this.stopCharging();
    this.stopBGM();
  }

  unmute() {
    this.enabled = true;
  }
}
