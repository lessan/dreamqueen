import { state } from '../state.js';
import { navigateTo } from '../router.js';

export function init(container) {
  container.innerHTML = `
    <div class="screen" data-screen="lobby" style="align-items: center; justify-content: center; gap: 16px; padding: 24px;">
      <h2 style="color: var(--color-primary);">Room: ${state.roomId || '...'}</h2>
      <p style="color: var(--color-text); font-size: 14px;">Share this code with friends to join!</p>
      <div id="player-list" style="margin: 16px 0; color: var(--color-secondary);">Waiting for players...</div>
      <button class="btn btn--primary" id="btn-start">Start Dressing</button>
      <button class="btn btn--secondary" id="btn-back" style="background: transparent; border: 1px solid var(--color-secondary);">Back</button>
    </div>
  `;

  document.getElementById('btn-start').addEventListener('click', () => {
    navigateTo('dressingroom', { roomId: state.roomId });
  });

  document.getElementById('btn-back').addEventListener('click', () => {
    navigateTo('home');
  });
}

export function destroy() {}
