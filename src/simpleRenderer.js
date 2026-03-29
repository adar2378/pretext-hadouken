// src/simpleRenderer.js
// Simple DOM-based renderer for text flow demo

export class SimpleRenderer {
  constructor(container) {
    this.container = container;
    this.videoElement = null;
    this.lineElements = [];
    this.orbElement = null;
    this.createVideoBackground();
    this.createOrb();
  }

  createVideoBackground() {
    this.videoElement = document.createElement('video');
    this.videoElement.style.position = 'absolute';
    this.videoElement.style.top = '0';
    this.videoElement.style.left = '0';
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.style.transform = 'scaleX(-1)'; // Mirror the video
    this.videoElement.style.filter = 'saturate(0.6) brightness(0.7)'; // Dim for text visibility
    this.videoElement.style.zIndex = '0';
    this.videoElement.autoplay = true;
    this.videoElement.playsInline = true;
    this.container.appendChild(this.videoElement);
  }

  setVideoSource(videoSourceElement) {
    if (videoSourceElement && videoSourceElement.srcObject) {
      this.videoElement.srcObject = videoSourceElement.srcObject;
    }
  }

  createOrb() {
    // Main orb container
    this.orbElement = document.createElement('div');
    this.orbElement.style.position = 'absolute';
    this.orbElement.style.pointerEvents = 'none';
    this.orbElement.style.display = 'none';
    this.orbElement.style.zIndex = '100';

    // Layer 1: Outer atmospheric glow (largest)
    const atmosphere = document.createElement('div');
    atmosphere.className = 'orb-atmosphere';
    atmosphere.style.position = 'absolute';
    atmosphere.style.width = '200%';
    atmosphere.style.height = '200%';
    atmosphere.style.left = '-50%';
    atmosphere.style.top = '-50%';
    atmosphere.style.borderRadius = '50%';
    atmosphere.style.background = 'radial-gradient(circle, rgba(0,217,255,0.3), rgba(77,166,255,0.1) 40%, transparent 70%)';
    atmosphere.style.filter = 'blur(20px)';
    atmosphere.style.animation = 'orbAtmosphere 2s ease-in-out infinite alternate';

    // Layer 2: Main glow ring
    const glow = document.createElement('div');
    glow.className = 'orb-glow';
    glow.style.position = 'absolute';
    glow.style.width = '160%';
    glow.style.height = '160%';
    glow.style.left = '-30%';
    glow.style.top = '-30%';
    glow.style.borderRadius = '50%';
    glow.style.background = 'radial-gradient(circle, rgba(0,217,255,0.6), rgba(77,166,255,0.3) 50%, transparent 75%)';
    glow.style.filter = 'blur(8px)';
    glow.style.animation = 'orbGlow 0.8s ease-in-out infinite alternate';

    // Layer 3: Chromatic aberration layers (RGB split)
    const chromaticR = document.createElement('div');
    chromaticR.style.position = 'absolute';
    chromaticR.style.width = '100%';
    chromaticR.style.height = '100%';
    chromaticR.style.borderRadius = '50%';
    chromaticR.style.background = 'radial-gradient(circle at 35% 35%, rgba(255,100,150,0.4), transparent 60%)';
    chromaticR.style.mixBlendMode = 'screen';
    chromaticR.style.animation = 'chromaticShift 0.4s ease-in-out infinite alternate';

    const chromaticB = document.createElement('div');
    chromaticB.style.position = 'absolute';
    chromaticB.style.width = '100%';
    chromaticB.style.height = '100%';
    chromaticB.style.borderRadius = '50%';
    chromaticB.style.background = 'radial-gradient(circle at 28% 28%, rgba(100,150,255,0.4), transparent 60%)';
    chromaticB.style.mixBlendMode = 'screen';
    chromaticB.style.animation = 'chromaticShift 0.4s ease-in-out infinite alternate-reverse';

    // Layer 4: Core energy ball (premium gradient)
    const core = document.createElement('div');
    core.className = 'orb-core';
    core.style.position = 'absolute';
    core.style.width = '100%';
    core.style.height = '100%';
    core.style.borderRadius = '50%';
    core.style.background = `
      radial-gradient(circle at 25% 25%, rgba(255,255,255,1) 0%, rgba(255,255,255,0.9) 10%, transparent 15%),
      radial-gradient(circle at 30% 30%, rgba(200,240,255,1), rgba(120,200,255,0.95) 40%, rgba(0,170,255,0.9) 70%, rgba(0,100,200,0.8))
    `;
    core.style.boxShadow = `
      0 0 20px 2px rgba(255,255,255,0.8),
      0 0 40px 4px rgba(77,166,255,1),
      0 0 60px 6px rgba(0,217,255,0.8),
      0 0 100px 10px rgba(0,150,255,0.5),
      inset 0 0 20px rgba(255,255,255,0.8),
      inset -10px -10px 30px rgba(0,100,200,0.5)
    `;
    core.style.animation = 'orbPulse 0.4s ease-in-out infinite alternate, orbShake 0.15s infinite';

    // Layer 5: Specular highlight (shiny spot)
    const highlight = document.createElement('div');
    highlight.style.position = 'absolute';
    highlight.style.width = '30%';
    highlight.style.height = '30%';
    highlight.style.left = '20%';
    highlight.style.top = '20%';
    highlight.style.borderRadius = '50%';
    highlight.style.background = 'radial-gradient(circle, rgba(255,255,255,0.9), transparent 70%)';
    highlight.style.filter = 'blur(3px)';
    highlight.style.animation = 'highlightShimmer 1.5s ease-in-out infinite';

    // Energy particles container
    this.particlesContainer = document.createElement('div');
    this.particlesContainer.style.position = 'absolute';
    this.particlesContainer.style.width = '220%';
    this.particlesContainer.style.height = '220%';
    this.particlesContainer.style.left = '-60%';
    this.particlesContainer.style.top = '-60%';

    // Create premium energy particles with trails
    for (let i = 0; i < 12; i++) {
      const particle = document.createElement('div');
      particle.style.position = 'absolute';

      // Alternate between dots and streaks
      if (i % 3 === 0) {
        // Energy streak
        particle.style.width = '2px';
        particle.style.height = '12px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'linear-gradient(to bottom, rgba(255,255,255,0.9), rgba(77,166,255,0.6), transparent)';
      } else {
        // Energy dot
        particle.style.width = '6px';
        particle.style.height = '6px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'rgba(255,255,255,0.95)';
      }

      particle.style.boxShadow = '0 0 8px rgba(255,255,255,1), 0 0 16px rgba(77,166,255,1), 0 0 24px rgba(0,217,255,0.6)';
      const angle = (i / 12) * Math.PI * 2;
      const distance = 55 + (i % 3) * 5;
      const x = 50 + Math.cos(angle) * distance;
      const y = 50 + Math.sin(angle) * distance;
      particle.style.left = `${x}%`;
      particle.style.top = `${y}%`;
      particle.style.animation = `orbParticle${i} ${0.6 + Math.random() * 0.5}s ease-in-out infinite alternate`;
      particle.style.animationDelay = `${Math.random() * 0.6}s`;
      this.particlesContainer.appendChild(particle);
    }

    // Assemble layers (back to front)
    this.orbElement.appendChild(atmosphere);
    this.orbElement.appendChild(glow);
    this.orbElement.appendChild(this.particlesContainer);
    this.orbElement.appendChild(chromaticR);
    this.orbElement.appendChild(chromaticB);
    this.orbElement.appendChild(core);
    this.orbElement.appendChild(highlight);
    this.container.appendChild(this.orbElement);

    // Add CSS animations
    this.injectOrbStyles();
  }

  injectOrbStyles() {
    if (document.getElementById('orb-styles')) return;

    const style = document.createElement('style');
    style.id = 'orb-styles';
    style.textContent = `
      @keyframes orbPulse {
        from { transform: scale(1); opacity: 0.95; }
        to { transform: scale(1.06); opacity: 1; }
      }
      @keyframes orbShake {
        0%, 100% { transform: translate(0, 0); }
        25% { transform: translate(-0.5px, 0.5px); }
        50% { transform: translate(0.5px, -0.5px); }
        75% { transform: translate(-0.5px, -0.5px); }
      }
      @keyframes orbGlow {
        from { transform: scale(1); opacity: 0.5; }
        to { transform: scale(1.15); opacity: 0.8; }
      }
      @keyframes orbAtmosphere {
        from { transform: scale(1) rotate(0deg); opacity: 0.4; }
        to { transform: scale(1.1) rotate(10deg); opacity: 0.6; }
      }
      @keyframes chromaticShift {
        from { transform: translate(-1px, -1px); }
        to { transform: translate(1px, 1px); }
      }
      @keyframes highlightShimmer {
        0%, 100% { opacity: 0.7; transform: translate(0, 0) scale(1); }
        50% { opacity: 1; transform: translate(2px, 2px) scale(1.1); }
      }
      ${Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const orbitX = Math.cos(angle) * 15;
        const orbitY = Math.sin(angle) * 15;
        return `
        @keyframes orbParticle${i} {
          0% {
            transform: scale(0.8) translate(0, 0) rotate(0deg);
            opacity: 0.6;
          }
          50% {
            transform: scale(1.2) translate(${orbitX * 0.5}px, ${orbitY * 0.5}px) rotate(180deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translate(${orbitX}px, ${orbitY}px) rotate(360deg);
            opacity: 0.4;
          }
        }
      `}).join('\n')}
    `;
    document.head.appendChild(style);
  }

  setLines(lines, font = '12px "Courier New", Courier, monospace', color = 'rgba(0,255,255,0.95)') {
    // Sync line elements
    while (this.lineElements.length < lines.length) {
      const element = document.createElement('div');
      element.style.position = 'absolute';
      element.style.whiteSpace = 'pre';
      element.style.font = font;
      element.style.userSelect = 'text';
      element.style.cursor = 'text';
      element.style.zIndex = '10';
      element.style.transition = 'opacity 0.3s ease, transform 0.2s ease';
      this.container.appendChild(element);
      this.lineElements.push(element);
    }

    // Animate characters by randomly changing some of them
    const time = Date.now() / 1000;

    // Update line elements with density-aware styling and animation
    for (let i = 0; i < this.lineElements.length; i++) {
      if (i < lines.length) {
        const line = lines[i];
        const element = this.lineElements[i];

        // Animate characters: randomly flicker some characters
        let animatedText = line.text;
        if (Math.random() > 0.95) { // 5% chance to update on each frame
          const densityChars = '@#81O0o+*-:. ';
          animatedText = line.text.split('').map(char => {
            if (Math.random() > 0.97) { // 3% of characters change
              return densityChars[Math.floor(Math.random() * densityChars.length)];
            }
            return char;
          }).join('');
        }

        element.textContent = animatedText;
        element.style.left = `${line.x}px`;
        element.style.top = `${line.y}px`;
        element.style.display = 'block';

        // Apply density-based opacity and color (ASCII shading effect)
        const density = line.density || 0.8;

        // Add wave/breathing animation
        const waveOffset = Math.sin(time * 2 + i * 0.1) * 0.1;
        const opacity = 0.4 + (density + waveOffset) * 0.6; // Range: 0.4 to 1.0

        // Cyan to white gradient based on density
        const r = Math.floor(0 + density * 255);
        const g = Math.floor(255);
        const b = Math.floor(255);

        element.style.color = `rgba(${r},${g},${b},${opacity})`;

        // Pulsing glow effect
        const glowIntensity = 5 + density * 10 + Math.sin(time * 3 + i * 0.05) * 3;
        element.style.textShadow = `0 0 ${glowIntensity}px rgba(0,255,255,${opacity * 0.8})`;

        // Subtle scale animation
        const scale = 1 + Math.sin(time * 1.5 + i * 0.08) * 0.02;
        element.style.transform = `scale(${scale})`;
      } else {
        this.lineElements[i].style.display = 'none';
      }
    }
  }

  setOrb(position, radius, visible = true) {
    if (!visible || !position) {
      this.orbElement.style.display = 'none';
      return;
    }

    this.orbElement.style.display = 'block';
    this.orbElement.style.left = `${position.x - radius}px`;
    this.orbElement.style.top = `${position.y - radius}px`;
    this.orbElement.style.width = `${radius * 2}px`;
    this.orbElement.style.height = `${radius * 2}px`;

    // Pulsing animation
    const pulse = 1 + Math.sin(Date.now() * 0.008) * 0.1;
    this.orbElement.style.transform = `scale(${pulse})`;
  }

  clear() {
    this.lineElements.forEach(el => el.remove());
    this.lineElements = [];
    if (this.orbElement) {
      this.orbElement.remove();
      this.orbElement = null;
    }
  }
}
