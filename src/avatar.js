/**
 * Avatar rendering — stub implementation.
 * Draws a placeholder coloured rectangle until sprites are available.
 */

export function renderAvatar(ctx, avatarState, x, y, scale) {
  const w = 64 * scale;
  const h = 64 * scale;
  ctx.fillStyle = avatarState.skinTone || '#F5CBA7';
  ctx.fillRect(x, y, w, h);
  // Placeholder: draw a simple face
  ctx.fillStyle = '#333';
  ctx.fillRect(x + w * 0.25, y + h * 0.3, w * 0.12, w * 0.12); // left eye
  ctx.fillRect(x + w * 0.63, y + h * 0.3, w * 0.12, w * 0.12); // right eye
  ctx.fillRect(x + w * 0.3, y + h * 0.6, w * 0.4, w * 0.08);   // mouth
}

export function getAvatarCanvas(avatarState, width, height) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const scale = Math.min(width, height) / 64;
  const x = (width - 64 * scale) / 2;
  const y = (height - 64 * scale) / 2;
  renderAvatar(ctx, avatarState, x, y, scale);
  return canvas;
}
