import { state } from '../state.js';
import { navigateTo } from '../router.js';

export function init(container) {
  container.innerHTML = `
    <div class="screen" data-screen="camera" style="align-items: center; justify-content: center; gap: 16px; padding: 24px;">
      <h2 style="color: var(--color-primary);">Camera Capture</h2>
      <div id="camera-viewport" style="width: 100%; max-width: 320px; aspect-ratio: 4/3; background: #000; border-radius: 12px; overflow: hidden;">
        <video id="camera-video" autoplay playsinline style="width: 100%; height: 100%; object-fit: cover;"></video>
      </div>
      <button class="btn btn--primary" id="btn-capture">Capture</button>
      <button class="btn btn--secondary" id="btn-cam-back" style="background: transparent; border: 1px solid var(--color-secondary);">Back</button>
    </div>
  `;
}

export function destroy() {}
