import { state } from '../state.js';
import { navigateTo } from '../router.js';

export function init(container) {
  container.innerHTML = `
    <div class="screen" data-screen="gallery" style="padding: 16px;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
        <h2 style="color: var(--color-primary); font-size: 20px;">Gallery</h2>
        <button class="btn btn--secondary" id="btn-gal-back" style="padding: 8px 16px; font-size: 14px; background: transparent; border: 1px solid var(--color-secondary);">Back</button>
      </div>
      <div id="gallery-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px;">
        <p style="color: var(--color-secondary); font-size: 14px; grid-column: 1 / -1; text-align: center;">No outfits published yet.</p>
      </div>
    </div>
  `;

  document.getElementById('btn-gal-back').addEventListener('click', () => {
    navigateTo('home');
  });
}

export function destroy() {}
