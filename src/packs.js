import { loadWardrobe, addItem } from './wardrobe.js';

// --- Starter pack sprite generation ---

/** Darken a hex colour by a factor (0-1). */
function darken(hex, factor = 0.2) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const f = 1 - factor;
  return `rgb(${Math.round(r * f)},${Math.round(g * f)},${Math.round(b * f)})`;
}

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

function makeCanvas() {
  const c = document.createElement('canvas');
  c.width = 300;
  c.height = 400;
  return c;
}

function strokeAndFill(ctx, fill, stroke) {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

// Body reference: Head centred x=150,y=60,r=40; Torso x=100-200,y=130-230; Legs x=110-190,y=230-360; Feet x=110-190,y=360-395

function drawPlainWhiteTee(ctx) {
  const fill = '#FFFFFF';
  const stroke = darken('#FFFFFF', 0.15);
  // Torso rectangle
  roundRect(ctx, 95, 130, 110, 100, 8);
  strokeAndFill(ctx, fill, stroke);
  // Left sleeve
  roundRect(ctx, 70, 132, 30, 35, 6);
  strokeAndFill(ctx, fill, stroke);
  // Right sleeve
  roundRect(ctx, 200, 132, 30, 35, 6);
  strokeAndFill(ctx, fill, stroke);
  // Neckline
  ctx.beginPath();
  ctx.arc(150, 132, 18, 0, Math.PI, false);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawBlueJeans(ctx) {
  const fill = '#3B6FB6';
  const stroke = darken('#3B6FB6');
  // Left leg
  roundRect(ctx, 110, 230, 34, 130, 6);
  strokeAndFill(ctx, fill, stroke);
  // Right leg
  roundRect(ctx, 156, 230, 34, 130, 6);
  strokeAndFill(ctx, fill, stroke);
  // Waistband
  roundRect(ctx, 105, 228, 90, 14, 4);
  strokeAndFill(ctx, darken('#3B6FB6', 0.1), stroke);
  // Centre line
  ctx.beginPath();
  ctx.moveTo(150, 242);
  ctx.lineTo(150, 290);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawRedSneakers(ctx) {
  const fill = '#E74C3C';
  const stroke = darken('#E74C3C');
  // Left shoe
  roundRect(ctx, 102, 362, 42, 26, 10);
  strokeAndFill(ctx, fill, stroke);
  // Right shoe
  roundRect(ctx, 156, 362, 42, 26, 10);
  strokeAndFill(ctx, fill, stroke);
  // White sole strip
  ctx.fillStyle = '#fff';
  roundRect(ctx, 102, 380, 42, 8, 4);
  ctx.fill();
  roundRect(ctx, 156, 380, 42, 8, 4);
  ctx.fill();
  // Lace dots
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(120, 370, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(174, 370, 2, 0, Math.PI * 2);
  ctx.fill();
}

function drawPinkHoodie(ctx) {
  const fill = '#FF85C0';
  const stroke = darken('#FF85C0');
  // Main body
  roundRect(ctx, 90, 126, 120, 108, 10);
  strokeAndFill(ctx, fill, stroke);
  // Left sleeve
  roundRect(ctx, 64, 130, 32, 80, 8);
  strokeAndFill(ctx, fill, stroke);
  // Right sleeve
  roundRect(ctx, 204, 130, 32, 80, 8);
  strokeAndFill(ctx, fill, stroke);
  // Hood shape at top
  ctx.beginPath();
  ctx.moveTo(110, 128);
  ctx.quadraticCurveTo(115, 108, 130, 104);
  ctx.lineTo(170, 104);
  ctx.quadraticCurveTo(185, 108, 190, 128);
  ctx.closePath();
  strokeAndFill(ctx, fill, stroke);
  // Front pocket
  roundRect(ctx, 118, 194, 64, 28, 6);
  ctx.fillStyle = darken('#FF85C0', 0.08);
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Drawstrings
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(140, 128);
  ctx.lineTo(138, 160);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(160, 128);
  ctx.lineTo(162, 160);
  ctx.stroke();
}

function drawBlackSkirt(ctx) {
  const fill = '#222222';
  const stroke = '#111111';
  // Trapezoid skirt shape
  ctx.beginPath();
  ctx.moveTo(108, 228);
  ctx.lineTo(192, 228);
  ctx.lineTo(202, 310);
  ctx.lineTo(98, 310);
  ctx.closePath();
  strokeAndFill(ctx, fill, stroke);
  // Waistband
  roundRect(ctx, 105, 225, 90, 12, 4);
  strokeAndFill(ctx, '#333', stroke);
}

function drawYellowRaincoat(ctx) {
  const fill = '#FFD93D';
  const stroke = darken('#FFD93D');
  // Main coat body (long)
  roundRect(ctx, 86, 126, 128, 180, 10);
  strokeAndFill(ctx, fill, stroke);
  // Left sleeve
  roundRect(ctx, 60, 130, 32, 85, 8);
  strokeAndFill(ctx, fill, stroke);
  // Right sleeve
  roundRect(ctx, 208, 130, 32, 85, 8);
  strokeAndFill(ctx, fill, stroke);
  // Collar
  ctx.beginPath();
  ctx.moveTo(118, 128);
  ctx.lineTo(130, 150);
  ctx.lineTo(150, 138);
  ctx.lineTo(170, 150);
  ctx.lineTo(182, 128);
  ctx.closePath();
  strokeAndFill(ctx, darken('#FFD93D', 0.06), stroke);
  // Buttons
  ctx.fillStyle = '#B8860B';
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.arc(150, 168 + i * 32, 4, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPurpleDress(ctx) {
  const fill = '#9B59B6';
  const stroke = darken('#9B59B6');
  // Bodice (fitted top)
  roundRect(ctx, 100, 130, 100, 70, 8);
  strokeAndFill(ctx, fill, stroke);
  // Shoulder straps
  roundRect(ctx, 108, 118, 18, 20, 4);
  strokeAndFill(ctx, fill, stroke);
  roundRect(ctx, 174, 118, 18, 20, 4);
  strokeAndFill(ctx, fill, stroke);
  // Flared skirt
  ctx.beginPath();
  ctx.moveTo(98, 200);
  ctx.lineTo(202, 200);
  ctx.lineTo(216, 330);
  ctx.lineTo(84, 330);
  ctx.closePath();
  strokeAndFill(ctx, fill, stroke);
  // Waist detail
  ctx.strokeStyle = darken('#9B59B6', 0.15);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(100, 200);
  ctx.lineTo(200, 200);
  ctx.stroke();
}

function drawStarHairClip(ctx) {
  const fill = '#FFD700';
  const stroke = darken('#FFD700');
  // Draw a 5-point star near the head
  function drawStar(cx, cy, outerR, innerR) {
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerAngle = (Math.PI / 2 * 3) + (i * Math.PI * 2 / 5);
      const innerAngle = outerAngle + Math.PI / 5;
      const ox = cx + Math.cos(outerAngle) * outerR;
      const oy = cy + Math.sin(outerAngle) * outerR;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      const ix = cx + Math.cos(innerAngle) * innerR;
      const iy = cy + Math.sin(innerAngle) * innerR;
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
  }
  // Main star
  drawStar(180, 40, 14, 6);
  strokeAndFill(ctx, fill, stroke);
  // Small companion star
  drawStar(196, 54, 8, 3);
  strokeAndFill(ctx, fill, stroke);
}

function drawWhiteSocks(ctx) {
  const fill = '#FFFFFF';
  const stroke = darken('#FFFFFF', 0.15);
  // Left sock
  roundRect(ctx, 108, 340, 34, 28, 6);
  strokeAndFill(ctx, fill, stroke);
  // Right sock
  roundRect(ctx, 158, 340, 34, 28, 6);
  strokeAndFill(ctx, fill, stroke);
  // Sock top trim
  ctx.strokeStyle = '#DDD';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 342);
  ctx.lineTo(142, 342);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(158, 342);
  ctx.lineTo(192, 342);
  ctx.stroke();
}

function drawDenimJacket(ctx) {
  const fill = '#5B8DB8';
  const stroke = darken('#5B8DB8');
  // Main body
  roundRect(ctx, 88, 126, 124, 100, 10);
  strokeAndFill(ctx, fill, stroke);
  // Left sleeve
  roundRect(ctx, 62, 130, 32, 78, 8);
  strokeAndFill(ctx, fill, stroke);
  // Right sleeve
  roundRect(ctx, 206, 130, 32, 78, 8);
  strokeAndFill(ctx, fill, stroke);
  // Collar
  ctx.beginPath();
  ctx.moveTo(120, 128);
  ctx.lineTo(132, 148);
  ctx.lineTo(120, 148);
  ctx.closePath();
  strokeAndFill(ctx, darken('#5B8DB8', 0.08), stroke);
  ctx.beginPath();
  ctx.moveTo(180, 128);
  ctx.lineTo(168, 148);
  ctx.lineTo(180, 148);
  ctx.closePath();
  strokeAndFill(ctx, darken('#5B8DB8', 0.08), stroke);
  // Front zip line
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 138);
  ctx.lineTo(150, 226);
  ctx.stroke();
  // Pocket outlines
  roundRect(ctx, 100, 182, 34, 26, 4);
  ctx.strokeStyle = stroke;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  roundRect(ctx, 166, 182, 34, 26, 4);
  ctx.stroke();
}

const DRAW_FNS = [
  { id: 'starter_tee',           name: 'Plain White Tee',  category: 'top',        draw: drawPlainWhiteTee },
  { id: 'starter_jeans',         name: 'Blue Jeans',       category: 'bottom',     draw: drawBlueJeans },
  { id: 'starter_sneakers',      name: 'Red Sneakers',     category: 'shoes',      draw: drawRedSneakers },
  { id: 'starter_hoodie',        name: 'Pink Hoodie',      category: 'top',        draw: drawPinkHoodie },
  { id: 'starter_skirt',         name: 'Black Skirt',      category: 'bottom',     draw: drawBlackSkirt },
  { id: 'starter_raincoat',      name: 'Yellow Raincoat',  category: 'outerwear',  draw: drawYellowRaincoat },
  { id: 'starter_dress',         name: 'Purple Dress',     category: 'top',        draw: drawPurpleDress },
  { id: 'starter_hairclip',      name: 'Star Hair Clip',   category: 'accessory',  draw: drawStarHairClip },
  { id: 'starter_socks',         name: 'White Socks',      category: 'shoes',      draw: drawWhiteSocks },
  { id: 'starter_denim_jacket',  name: 'Denim Jacket',     category: 'outerwear',  draw: drawDenimJacket },
];

export function generateStarterSprites() {
  return DRAW_FNS.map(def => {
    const canvas = makeCanvas();
    const ctx = canvas.getContext('2d');
    def.draw(ctx);
    return {
      id: def.id,
      name: def.name,
      category: def.category,
      imageDataURL: canvas.toDataURL('image/png'),
      source: 'starter',
      packId: 'starter',
      createdAt: Date.now()
    };
  });
}

export function initStarterPack() {
  const wardrobe = loadWardrobe();
  const hasStarter = wardrobe.some(i => i.packId === 'starter');
  if (hasStarter) return;

  const sprites = generateStarterSprites();
  sprites.forEach(item => addItem(item));
}

// --- Firestore pack stubs (Phase 5) ---

export async function downloadPack(packId) {
  // TODO: fetch pack from Firestore, download item images
  return null;
}

export async function getPackInfo(packId) {
  // TODO: return pack metadata from Firestore
  return null;
}
