import { state } from '../state.js';
import { navigateTo } from '../router.js';

export function init(container) {
  container.innerHTML = `
    <div class="screen" data-screen="packlanding" style="align-items: center; justify-content: center; gap: 16px; padding: 24px;">
      <h2 style="color: var(--color-primary);">Clothing Pack</h2>
      <p style="color: var(--color-secondary); font-size: 14px;">Pack ID: ${state.pendingPackId || '...'}</p>
      <div id="pack-items" style="color: var(--color-text); font-size: 14px;">Loading pack info...</div>
      <button class="btn btn--primary" id="btn-add-pack">Add to My Wardrobe</button>
      <button class="btn btn--secondary" id="btn-pack-back" style="background: transparent; border: 1px solid var(--color-secondary);">Back to Home</button>
    </div>
  `;

  document.getElementById('btn-add-pack').addEventListener('click', () => {
    // TODO: download pack and apply to wardrobe
    navigateTo('home');
  });

  document.getElementById('btn-pack-back').addEventListener('click', () => {
    navigateTo('home');
  });
}

export function destroy() {}
