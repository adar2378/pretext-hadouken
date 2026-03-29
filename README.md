# Pretext Hadouken Experiment 👊⚡

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14-brightgreen.svg)

An experiment combining hand gesture recognition with [Pretext](https://github.com/chenglou/pretext) – a library that lets you layout text **without CSS or DOM manipulation**. Control flowing ASCII text with Street Fighter-style hand gestures!

## 🎬 Demo

![Demo](demo.gif)

**[📹 Watch full video](demo.mp4)** | **[🎮 Try it live](#)** (coming soon)

## What's This About?

This is an experiment exploring two main things:

1. **[Pretext](https://github.com/chenglou/pretext)** – A fascinating library that measures and layouts text **without CSS or DOM**. It uses canvas measurements directly, making text layout super fast and flexible.

2. **Gesture-based interaction** – Using MediaPipe to detect hand gestures and make ASCII text flow around your hands in real-time.

The result? A Street Fighter-inspired hadouken blast that pushes text around on screen, all calculated and rendered without traditional CSS layouts.

## Setup

### Prerequisites

- Node.js 14+ and npm
- A modern browser with camera support
- Good lighting for optimal hand tracking

### Installation

```bash
# Clone the repository
git clone <your-repo-url>
cd pretext-hadouken

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Try It

1. Allow camera access when prompted
2. Bring both hands together at chest height
3. Wait for the blue orb to charge (~0.5s)
4. Push hands forward or thrust upward to blast!
5. Watch the ASCII text flow around your gestures

## Tech Used

- **[Pretext](https://github.com/chenglou/pretext)** – CSS-free text layout engine
- **[MediaPipe Hands](https://google.github.io/mediapipe/solutions/hands.html)** – Hand tracking ML
- **DOM rendering** – No WebGL/Three.js needed! Just divs and CSS transforms
- **[Vite](https://vitejs.dev/)** – Dev tooling

## Browser Support

- ✅ Chrome/Edge (recommended) - Best performance
- ✅ Firefox - Good support
- ⚠️ Safari - May have MediaPipe limitations

## Key Files

```
src/
├── main.js              # Main entry point
├── textFlow.js          # Pretext-powered text layout (the interesting part!)
├── gestureDetector.js   # Hand gesture state machine
├── handTracker.js       # MediaPipe integration
├── simpleRenderer.js    # DOM-based renderer
└── audioManager.js      # Sound effects
```

## Notes

- Gesture detection works better with good lighting
- Both hands need to be visible to the camera
- Chrome/Edge recommended for best MediaPipe performance
- The gesture is intentionally forgiving – no need for precision!

## Why Pretext?

Traditional web text layout requires:
1. Creating DOM elements
2. Letting the browser calculate positions (CSS)
3. Reading back those positions
4. Causing layout thrashing if you do this repeatedly

**Pretext skips all that** – it calculates text positions directly using canvas measurements, giving you instant, predictable text layout without touching the DOM. Perfect for dynamic, interactive text like this!

## License

MIT – Experiment freely!

---

Built to explore [Pretext](https://github.com/chenglou/pretext) and gesture-based UIs
