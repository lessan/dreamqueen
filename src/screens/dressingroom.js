import { state } from '../state.js';
import { navigateTo } from '../router.js';

export function init(container) {
  container.innerHTML = `
    <div class="screen" data-screen="dressingroom" style="padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="color: var(--color-secondary); font-size: 12px;">Room: ${state.roomId || '--'}</span>
        <button class="btn btn--primary" id="btn-publish" style="padding: 8px 16px; font-size: 14px;">Publish</button>
      </div>
      <div id="avatar-area" style="flex: 1; display: flex; align-items: center; justify-content: center;">
        <canvas id="avatar-canvas" width="300" height="400" style="background: var(--color-surface); border-radius: 12px;"></canvas>
      </div>
      <div id="wardrobe-tray" style="height: 120px; background: var(--color-surface); border-radius: 12px; margin-top: 8px; padding: 8px; overflow-x: auto;">
        <p style="color: var(--color-secondary); font-size: 12px;">Wardrobe items will appear here.</p>
      </div>
    </div>
  `;
}

export function destroy() {}
