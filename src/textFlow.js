// src/textFlow.js
// Adapted from @chenglou/pretext editorial-engine demo

import { prepareWithSegments, layoutNextLine } from '@chenglou/pretext';

const MIN_SLOT_WIDTH = 50;

/**
 * Calculate horizontal interval blocked by a circle for a given horizontal band
 */
function circleIntervalForBand(cx, cy, r, bandTop, bandBottom, hPad = 20, vPad = 10) {
  const top = bandTop - vPad;
  const bottom = bandBottom + vPad;

  // Circle doesn't intersect this band
  if (top >= cy + r || bottom <= cy - r) return null;

  // Calculate closest distance from circle center to band
  const minDy = cy >= top && cy <= bottom ? 0 : cy < top ? top - cy : cy - bottom;
  if (minDy >= r) return null;

  // Calculate horizontal extent of circle at this band
  const maxDx = Math.sqrt(r * r - minDy * minDy);
  return { left: cx - maxDx - hPad, right: cx + maxDx + hPad };
}

/**
 * Carve out text line slots from a region, excluding blocked intervals
 */
function carveTextLineSlots(region, blocked) {
  if (blocked.length === 0) return [region];

  // Merge overlapping blocked intervals
  const sorted = [...blocked].sort((a, b) => a.left - b.left);
  const merged = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    if (current.left <= last.right) {
      last.right = Math.max(last.right, current.right);
    } else {
      merged.push({ ...current });
    }
  }

  // Find available slots
  const slots = [];
  let cursor = region.left;

  for (const interval of merged) {
    if (cursor < interval.left) {
      slots.push({ left: cursor, right: interval.left });
    }
    cursor = Math.max(cursor, interval.right);
  }

  if (cursor < region.right) {
    slots.push({ left: cursor, right: region.right });
  }

  // Filter out slots that are too narrow
  return slots.filter(slot => slot.right - slot.left >= MIN_SLOT_WIDTH);
}

/**
 * Layout text in a column, flowing around circular obstacles
 */
export class TextFlow {
  constructor(text, font, lineHeight, canvasWidth, canvasHeight) {
    this.text = text;
    this.font = font;
    this.lineHeight = lineHeight;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.prepared = prepareWithSegments(text, font);
    this.lines = [];
    this.obstacles = []; // Array of {cx, cy, r}
  }

  setObstacles(obstacles) {
    this.obstacles = obstacles;
    this.reflow();
  }

  reflow() {
    // Position text on the right side, shaped like a jumping martial artist (side view)
    // Figure grounded at BOTTOM of screen
    const rightSideX = this.canvasWidth * 0.65; // Right side start
    const baseX = this.canvasWidth * 0.78; // Base X position
    const topY = this.canvasHeight * 0.10; // Start from upper area
    const bottomY = this.canvasHeight * 0.98; // Feet at bottom of screen

    this.lines = [];
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let lineTop = topY;

    while (lineTop + this.lineHeight <= bottomY) {
      const bandTop = lineTop;
      const bandBottom = lineTop + this.lineHeight;
      const blocked = [];

      // Calculate jumping martial artist shape (side view)
      // Wider proportions (1.6x scale)
      const progress = (lineTop - topY) / (bottomY - topY);
      let lineWidth;
      let centerOffset = 0; // Horizontal offset for creating the pose

      if (progress < 0.10) {
        // Head - rounded, slightly forward
        const headProgress = progress / 0.10;
        lineWidth = 80 + Math.sin(headProgress * Math.PI) * 25;
        centerOffset = 30; // Head leans forward
      } else if (progress < 0.14) {
        // Neck/upper back
        lineWidth = 65;
        centerOffset = 25;
      } else if (progress < 0.25) {
        // Shoulders and back arm (extending backward)
        const armProgress = (progress - 0.14) / 0.11;
        lineWidth = 65 + armProgress * 145; // Wide due to extended arm
        centerOffset = 15 - armProgress * 25; // Arm goes back
      } else if (progress < 0.40) {
        // Upper torso + front arm extending forward
        const torsoProgress = (progress - 0.25) / 0.15;
        lineWidth = 210 + torsoProgress * 50; // Widest - both arms extended
        centerOffset = -10 + torsoProgress * 50; // Front arm pushes shape forward
      } else if (progress < 0.52) {
        // Mid torso - pulling back
        const midProgress = (progress - 0.40) / 0.12;
        lineWidth = 260 - midProgress * 100;
        centerOffset = 40 - midProgress * 15;
      } else if (progress < 0.60) {
        // Waist/hips - compact
        lineWidth = 160;
        centerOffset = 25;
      } else if (progress < 0.75) {
        // Front leg extending forward (kick position)
        const legProgress = (progress - 0.60) / 0.15;
        lineWidth = 160 + legProgress * 80;
        centerOffset = 25 + legProgress * 55; // Leg extends forward
      } else if (progress < 0.88) {
        // Lower front leg
        const lowerLegProgress = (progress - 0.75) / 0.13;
        lineWidth = 240 - lowerLegProgress * 110;
        centerOffset = 80 - lowerLegProgress * 30;
      } else {
        // Foot - pointed
        lineWidth = 130;
        centerOffset = 50;
      }

      const centerX = baseX + centerOffset;
      const regionLeft = centerX - lineWidth / 2;
      const regionRight = centerX + lineWidth / 2;

      // Find blocked intervals from all obstacles (hadouken orb)
      for (const obstacle of this.obstacles) {
        const interval = circleIntervalForBand(
          obstacle.cx,
          obstacle.cy,
          obstacle.r,
          bandTop,
          bandBottom,
          obstacle.hPad || 20,
          obstacle.vPad || 10
        );
        if (interval !== null) blocked.push(interval);
      }

      // Find available slots
      const slots = carveTextLineSlots(
        { left: regionLeft, right: regionRight },
        blocked
      );

      if (slots.length === 0) {
        lineTop += this.lineHeight;
        continue;
      }

      // Use the widest slot
      const bestSlot = slots.reduce((best, slot) => {
        const bestWidth = best.right - best.left;
        const slotWidth = slot.right - slot.left;
        return slotWidth > bestWidth ? slot : best;
      });

      const slotWidth = bestSlot.right - bestSlot.left;
      const line = layoutNextLine(this.prepared, cursor, slotWidth);

      if (line === null) {
        // Text exhausted
        break;
      }

      // Calculate density for this line (center = dense, edges = light)
      const distFromCenter = Math.abs((bestSlot.left + bestSlot.right) / 2 - centerX);
      const maxDist = lineWidth / 2;
      const density = 1 - (distFromCenter / maxDist); // 1.0 at center, 0.0 at edges

      this.lines.push({
        text: line.text,
        x: bestSlot.left,
        y: lineTop,
        width: line.width,
        density: density, // Add density for rendering
      });

      cursor = line.end;
      lineTop += this.lineHeight;
    }
  }

  getLines() {
    return this.lines;
  }

  resize(canvasWidth, canvasHeight) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.reflow();
  }
}
