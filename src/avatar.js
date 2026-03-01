/**
 * Avatar rendering — fully programmatic Canvas 2D drawing.
 * No external image files. Everything is drawn with canvas paths.
 */

// --- Constants ---

export const SKIN_TONES = [
  '#FDDBB4', // very light
  '#F5CBA7', // light
  '#E8A87C', // medium light
  '#C68642', // medium
  '#8D5524', // medium dark
  '#4A2912', // dark
];

export const HAIR_COLORS = [
  '#3B2314', // dark brown
  '#7B3F00', // brown
  '#C19A6B', // blonde
  '#D4A017', // golden
  '#FF4500', // red
  '#1C1C1C', // black
  '#A9A9A9', // grey
  '#FF69B4', // pink
];

export const BODY_TYPES = [1, 2, 3];
export const HAIR_STYLES = 10;
export const EYE_SHAPES = [1, 2, 3];
export const MOUTH_SHAPES = [1, 2, 3];

// --- Helpers ---

/** Darken a hex colour by a factor (0-1). */
function darken(hex, factor = 0.15) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - factor;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

/** Draw a rounded rectangle path. */
function roundRect(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// --- Body dimensions per type ---
// All values are fractions of canvas width/height (300x400 base).

function getBodyDims(bodyType) {
  const base = {
    headR: 38,   // head radius
    headCX: 150, // head centre x
    headCY: 72,  // head centre y
    neckW: 20, neckH: 18, neckY: 108,
    torsoW: 80, torsoH: 100, torsoY: 126, torsoR: 16,
    armW: 22, armH: 80, armY: 132, armR: 10, armGap: 2,
    legW: 26, legH: 100, legY: 226, legGap: 8, legR: 12,
  };
  if (bodyType === 1) {
    // Slim
    base.torsoW = 66; base.armW = 18; base.legW = 22;
    base.headR = 36;
  } else if (bodyType === 3) {
    // Curvy / wider
    base.torsoW = 96; base.armW = 26; base.legW = 32;
    base.torsoR = 20; base.headR = 40;
  }
  return base;
}

// --- Drawing functions ---

function drawBody(ctx, bodyType, skinTone) {
  const d = getBodyDims(bodyType);
  const outline = darken(skinTone, 0.18);

  // Two-pass: outline then fill
  for (let pass = 0; pass < 2; pass++) {
    const expand = pass === 0 ? 3 : 0;
    ctx.fillStyle = pass === 0 ? outline : skinTone;

    // Head
    ctx.beginPath();
    ctx.arc(d.headCX, d.headCY, d.headR + expand, 0, Math.PI * 2);
    ctx.fill();

    // Neck
    const nw = d.neckW + expand * 2;
    roundRect(ctx, d.headCX - nw / 2, d.neckY - expand, nw, d.neckH + expand * 2, 4);
    ctx.fill();

    // Torso
    const tw = d.torsoW + expand * 2;
    roundRect(ctx, d.headCX - tw / 2, d.torsoY - expand, tw, d.torsoH + expand * 2, d.torsoR);
    ctx.fill();

    // Arms
    const aw = d.armW + expand * 2;
    const ah = d.armH + expand * 2;
    // Left arm
    const leftArmX = d.headCX - d.torsoW / 2 - d.armW - d.armGap - expand;
    roundRect(ctx, leftArmX, d.armY - expand, aw, ah, d.armR);
    ctx.fill();
    // Right arm
    const rightArmX = d.headCX + d.torsoW / 2 + d.armGap - expand;
    roundRect(ctx, rightArmX, d.armY - expand, aw, ah, d.armR);
    ctx.fill();

    // Legs
    const lw = d.legW + expand * 2;
    const lh = d.legH + expand * 2;
    const legOffset = d.legGap / 2;
    // Left leg
    roundRect(ctx, d.headCX - legOffset - lw, d.legY - expand, lw, lh, d.legR);
    ctx.fill();
    // Right leg
    roundRect(ctx, d.headCX + legOffset, d.legY - expand, lw, lh, d.legR);
    ctx.fill();

    // Hands (small circles at bottom of arms)
    const handR = (d.armW / 2) + expand;
    ctx.beginPath();
    ctx.arc(leftArmX + aw / 2, d.armY + d.armH + expand, handR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rightArmX + aw / 2, d.armY + d.armH + expand, handR, 0, Math.PI * 2);
    ctx.fill();

    // Feet (small rounded rects at bottom of legs)
    const fw = lw + 4;
    roundRect(ctx, d.headCX - legOffset - lw - 2, d.legY + d.legH - 4 + expand, fw, 14, 6);
    ctx.fill();
    roundRect(ctx, d.headCX + legOffset - 2, d.legY + d.legH - 4 + expand, fw, 14, 6);
    ctx.fill();
  }
}

function drawHairBack(ctx, hairStyle, hairColor, bodyType) {
  const d = getBodyDims(bodyType);
  ctx.fillStyle = hairColor;

  switch (hairStyle) {
    case 2: // Long straight — back layer hangs behind body
      ctx.beginPath();
      ctx.moveTo(d.headCX - d.headR - 6, d.headCY - 10);
      ctx.lineTo(d.headCX - d.headR - 2, d.headCY + 120);
      ctx.lineTo(d.headCX - d.headR + 14, d.headCY + 130);
      ctx.lineTo(d.headCX + d.headR - 14, d.headCY + 130);
      ctx.lineTo(d.headCX + d.headR + 2, d.headCY + 120);
      ctx.lineTo(d.headCX + d.headR + 6, d.headCY - 10);
      ctx.closePath();
      ctx.fill();
      break;
    case 6: // Braids — two long lines down front
      ctx.beginPath();
      roundRect(ctx, d.headCX - d.headR + 2, d.headCY + 10, 12, 120, 5);
      ctx.fill();
      roundRect(ctx, d.headCX + d.headR - 14, d.headCY + 10, 12, 120, 5);
      ctx.fill();
      break;
    case 10: // Afro — large back circle
      ctx.beginPath();
      ctx.arc(d.headCX, d.headCY - 6, d.headR + 26, 0, Math.PI * 2);
      ctx.fill();
      break;
    default:
      break;
  }
}

function drawHairFront(ctx, hairStyle, hairColor, bodyType) {
  const d = getBodyDims(bodyType);
  ctx.fillStyle = hairColor;
  const cx = d.headCX;
  const cy = d.headCY;
  const r = d.headR;

  switch (hairStyle) {
    case 1: { // Short bob
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 6, Math.PI, Math.PI * 2);
      ctx.lineTo(cx + r + 6, cy + 14);
      ctx.quadraticCurveTo(cx + r + 8, cy + 22, cx + r - 4, cy + 24);
      ctx.lineTo(cx - r + 4, cy + 24);
      ctx.quadraticCurveTo(cx - r - 8, cy + 22, cx - r - 6, cy + 14);
      ctx.closePath();
      ctx.fill();
      // Bangs
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 4, Math.PI + 0.3, -0.3);
      ctx.lineTo(cx + r - 6, cy - r + 18);
      ctx.lineTo(cx - r + 6, cy - r + 18);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 2: { // Long straight — front bangs only
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 4, Math.PI + 0.3, -0.3);
      ctx.lineTo(cx + r - 4, cy - r + 20);
      ctx.lineTo(cx - r + 4, cy - r + 20);
      ctx.closePath();
      ctx.fill();
      // Side locks
      ctx.beginPath();
      roundRect(ctx, cx - r - 5, cy - 4, 10, 50, 4);
      ctx.fill();
      roundRect(ctx, cx + r - 5, cy - 4, 10, 50, 4);
      ctx.fill();
      break;
    }
    case 3: { // Curly short
      const curls = 8;
      for (let i = 0; i < curls; i++) {
        const angle = Math.PI + (i / (curls - 1)) * Math.PI;
        const bx = cx + Math.cos(angle) * (r + 4);
        const by = cy - 6 + Math.sin(angle) * (r + 4);
        ctx.beginPath();
        ctx.arc(bx, by, 12, 0, Math.PI * 2);
        ctx.fill();
      }
      // Top curls
      for (let i = 0; i < 5; i++) {
        const angle = Math.PI * 1.2 + (i / 4) * Math.PI * 0.6;
        const bx = cx + Math.cos(angle) * (r - 2);
        const by = cy - 6 + Math.sin(angle) * (r - 2);
        ctx.beginPath();
        ctx.arc(bx, by, 10, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 4: { // Ponytail
      // Top cap
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 4, Math.PI + 0.2, -0.2);
      ctx.lineTo(cx + r - 2, cy - r + 18);
      ctx.lineTo(cx - r + 2, cy - r + 18);
      ctx.closePath();
      ctx.fill();
      // Bun at back-right
      ctx.beginPath();
      ctx.arc(cx + r - 4, cy - r + 4, 14, 0, Math.PI * 2);
      ctx.fill();
      // Tail hanging down
      ctx.beginPath();
      ctx.moveTo(cx + r + 4, cy - r + 10);
      ctx.quadraticCurveTo(cx + r + 18, cy + 20, cx + r + 6, cy + 70);
      ctx.lineTo(cx + r - 4, cy + 64);
      ctx.quadraticCurveTo(cx + r + 8, cy + 16, cx + r - 2, cy - r + 12);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 5: { // Pigtails
      // Top cap
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 3, Math.PI + 0.3, -0.3);
      ctx.lineTo(cx + r - 4, cy - r + 18);
      ctx.lineTo(cx - r + 4, cy - r + 18);
      ctx.closePath();
      ctx.fill();
      // Left pigtail
      ctx.beginPath();
      ctx.arc(cx - r - 6, cy + 4, 14, 0, Math.PI * 2);
      ctx.fill();
      roundRect(ctx, cx - r - 13, cy + 14, 14, 46, 6);
      ctx.fill();
      // Right pigtail
      ctx.beginPath();
      ctx.arc(cx + r + 6, cy + 4, 14, 0, Math.PI * 2);
      ctx.fill();
      roundRect(ctx, cx + r - 1, cy + 14, 14, 46, 6);
      ctx.fill();
      break;
    }
    case 6: { // Braids — front: top cap + braid tips
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 3, Math.PI + 0.3, -0.3);
      ctx.lineTo(cx + r - 4, cy - r + 18);
      ctx.lineTo(cx - r + 4, cy - r + 18);
      ctx.closePath();
      ctx.fill();
      // Braid tie dots
      ctx.beginPath();
      ctx.arc(cx - r + 8, cy + 128, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx + r - 8, cy + 128, 6, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 7: { // Pixie cut
      ctx.beginPath();
      ctx.arc(cx, cy - 8, r + 2, Math.PI + 0.4, -0.1);
      ctx.lineTo(cx + r + 4, cy - 6);
      ctx.quadraticCurveTo(cx + r + 2, cy + 6, cx + r - 6, cy + 8);
      ctx.lineTo(cx - r + 6, cy + 8);
      ctx.quadraticCurveTo(cx - r - 2, cy + 6, cx - r - 4, cy - 6);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 8: { // Wavy medium
      // Top cap
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 5, Math.PI + 0.2, -0.2);
      ctx.lineTo(cx + r, cy - r + 18);
      ctx.lineTo(cx - r, cy - r + 18);
      ctx.closePath();
      ctx.fill();
      // Wavy sides
      ctx.beginPath();
      ctx.moveTo(cx - r - 5, cy - 4);
      ctx.quadraticCurveTo(cx - r - 12, cy + 20, cx - r - 4, cy + 44);
      ctx.quadraticCurveTo(cx - r + 4, cy + 56, cx - r - 2, cy + 68);
      ctx.lineTo(cx - r + 8, cy + 64);
      ctx.quadraticCurveTo(cx - r + 12, cy + 50, cx - r + 4, cy + 38);
      ctx.quadraticCurveTo(cx - r - 4, cy + 16, cx - r + 2, cy);
      ctx.closePath();
      ctx.fill();
      // Right side
      ctx.beginPath();
      ctx.moveTo(cx + r + 5, cy - 4);
      ctx.quadraticCurveTo(cx + r + 12, cy + 20, cx + r + 4, cy + 44);
      ctx.quadraticCurveTo(cx + r - 4, cy + 56, cx + r + 2, cy + 68);
      ctx.lineTo(cx + r - 8, cy + 64);
      ctx.quadraticCurveTo(cx + r - 12, cy + 50, cx + r - 4, cy + 38);
      ctx.quadraticCurveTo(cx + r + 4, cy + 16, cx + r - 2, cy);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case 9: { // High bun
      // Slight cap
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 2, Math.PI + 0.4, -0.4);
      ctx.lineTo(cx + r - 6, cy - r + 16);
      ctx.lineTo(cx - r + 6, cy - r + 16);
      ctx.closePath();
      ctx.fill();
      // Bun on top
      ctx.beginPath();
      ctx.arc(cx, cy - r - 14, 18, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case 10: { // Afro — front layer (top portion)
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 24, Math.PI + 0.5, -0.5);
      ctx.lineTo(cx + r + 10, cy + 8);
      ctx.lineTo(cx - r - 10, cy + 8);
      ctx.closePath();
      ctx.fill();
      break;
    }
    default: { // Fallback to style 1
      ctx.beginPath();
      ctx.arc(cx, cy - 6, r + 4, Math.PI + 0.3, -0.3);
      ctx.lineTo(cx + r - 6, cy - r + 18);
      ctx.lineTo(cx - r + 6, cy - r + 18);
      ctx.closePath();
      ctx.fill();
      break;
    }
  }
}

function drawEyes(ctx, eyeShape, bodyType) {
  const d = getBodyDims(bodyType);
  const cx = d.headCX;
  const cy = d.headCY;
  const eyeY = cy + d.headR * 0.05;
  const eyeSpacing = 14;

  // Eyebrow arcs
  ctx.strokeStyle = '#555';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const side of [-1, 1]) {
    const ex = cx + side * eyeSpacing;
    ctx.beginPath();
    ctx.arc(ex, eyeY - 8, 8, Math.PI + 0.4, -0.4);
    ctx.stroke();
  }

  switch (eyeShape) {
    case 1: { // Round eyes
      for (const side of [-1, 1]) {
        const ex = cx + side * eyeSpacing;
        // White
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 6, 0, Math.PI * 2);
        ctx.fill();
        // Iris
        ctx.fillStyle = '#4A3728';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 4, 0, Math.PI * 2);
        ctx.fill();
        // Pupil
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
    case 2: { // Almond eyes with lashes
      for (const side of [-1, 1]) {
        const ex = cx + side * eyeSpacing;
        // Eye shape
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.moveTo(ex - 8, eyeY);
        ctx.quadraticCurveTo(ex, eyeY - 6, ex + 8, eyeY);
        ctx.quadraticCurveTo(ex, eyeY + 5, ex - 8, eyeY);
        ctx.fill();
        // Iris
        ctx.fillStyle = '#4A3728';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 3.5, 0, Math.PI * 2);
        ctx.fill();
        // Pupil
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 1.5, 0, Math.PI * 2);
        ctx.fill();
        // Lashes
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(ex + 7 * side, eyeY - 2);
        ctx.lineTo(ex + 10 * side, eyeY - 5);
        ctx.stroke();
      }
      break;
    }
    case 3: { // Wide eyes with sparkle
      for (const side of [-1, 1]) {
        const ex = cx + side * eyeSpacing;
        // Large white
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex, eyeY, 8, 0, Math.PI * 2);
        ctx.fill();
        // Iris
        ctx.fillStyle = '#5B8C5A';
        ctx.beginPath();
        ctx.arc(ex, eyeY + 1, 5, 0, Math.PI * 2);
        ctx.fill();
        // Pupil
        ctx.fillStyle = '#111';
        ctx.beginPath();
        ctx.arc(ex, eyeY + 1, 2.5, 0, Math.PI * 2);
        ctx.fill();
        // Sparkle dot
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(ex + 2, eyeY - 2, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      break;
    }
  }
}

function drawNose(ctx, bodyType) {
  const d = getBodyDims(bodyType);
  const cx = d.headCX;
  const cy = d.headCY;
  const noseY = cy + d.headR * 0.22;

  ctx.fillStyle = darken('#C8A080', 0.1);
  ctx.beginPath();
  ctx.moveTo(cx, noseY - 3);
  ctx.lineTo(cx - 3, noseY + 3);
  ctx.lineTo(cx + 3, noseY + 3);
  ctx.closePath();
  ctx.fill();
}

function drawMouth(ctx, mouthShape, bodyType) {
  const d = getBodyDims(bodyType);
  const cx = d.headCX;
  const cy = d.headCY;
  const mouthY = cy + d.headR * 0.42;

  ctx.strokeStyle = '#8B4513';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';

  switch (mouthShape) {
    case 1: { // Simple smile
      ctx.beginPath();
      ctx.arc(cx, mouthY - 4, 10, 0.2, Math.PI - 0.2);
      ctx.stroke();
      break;
    }
    case 2: { // Open smile with teeth
      ctx.beginPath();
      ctx.arc(cx, mouthY - 4, 10, 0.2, Math.PI - 0.2);
      ctx.stroke();
      // Teeth
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(cx, mouthY - 4, 9, 0.3, Math.PI - 0.3);
      ctx.lineTo(cx - 7, mouthY - 1);
      ctx.closePath();
      ctx.fill();
      // Lip line
      ctx.strokeStyle = '#8B4513';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - 8, mouthY - 1);
      ctx.lineTo(cx + 8, mouthY - 1);
      ctx.stroke();
      break;
    }
    case 3: { // Cute / default
      ctx.beginPath();
      ctx.moveTo(cx - 6, mouthY);
      ctx.quadraticCurveTo(cx + 2, mouthY + 7, cx + 7, mouthY - 1);
      ctx.stroke();
      break;
    }
  }
}

function drawClothing(ctx, equipped) {
  if (!equipped) return;
  // Layer order: shoes, bottom, top, outerwear, accessory
  const slots = ['shoes', 'bottom', 'top', 'outerwear', 'accessory'];
  for (const slot of slots) {
    const item = equipped[slot];
    if (item && item.imageDataURL) {
      const img = new Image();
      img.src = item.imageDataURL;
      // Only draw if already loaded (synchronous check)
      if (img.complete && img.naturalWidth > 0) {
        ctx.drawImage(img, 0, 0, 300, 400);
      }
    }
  }
}

// --- Main render function ---

export function renderAvatar(ctx, avatarState, x = 0, y = 0, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  const {
    bodyType = 2,
    skinTone = '#F5CBA7',
    hairStyle = 1,
    hairColor = '#3B2314',
    eyeShape = 1,
    mouthShape = 1,
    equipped = {}
  } = avatarState;

  // 1. Hair back layer (behind body)
  drawHairBack(ctx, hairStyle, hairColor, bodyType);

  // 2. Body (with skin tone)
  drawBody(ctx, bodyType, skinTone);

  // 3. Eyes
  drawEyes(ctx, eyeShape, bodyType);

  // 4. Nose
  drawNose(ctx, bodyType);

  // 5. Mouth
  drawMouth(ctx, mouthShape, bodyType);

  // 6. Clothing layers
  drawClothing(ctx, equipped);

  // 7. Hair front layer (over face/body)
  drawHairFront(ctx, hairStyle, hairColor, bodyType);

  ctx.restore();
}

export function getAvatarCanvas(avatarState, width = 300, height = 400) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;

  // Scale to fit
  const scaleX = width / 300;
  const scaleY = height / 400;
  const s = Math.min(scaleX, scaleY);
  const ox = (width - 300 * s) / 2;
  const oy = (height - 400 * s) / 2;

  renderAvatar(ctx, avatarState, ox, oy, s);
  return canvas;
}
