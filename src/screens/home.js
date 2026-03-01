import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { createRoom } from '../room.js';

export function init(container) {
  container.innerHTML = `
    <div class="screen" data-screen="home" style="align-items: center; justify-content: center; gap: 16px; padding: 24px;">
      <h1 style="font-size: 36px; color: var(--color-primary); text-align: center;">Dream Queen</h1>
      <p style="color: var(--color-secondary); font-size: 14px;">Dress up, share, repeat.</p>
      <div style="display: flex; flex-direction: column; gap: 12px; margin-top: 24px; width: 100%; max-width: 280px;">
        <button class="btn btn--primary" id="btn-create">Create Room</button>
        <div style="display: flex; gap: 8px;">
          <input type="text" id="input-room" placeholder="Room code" maxlength="6"
            style="flex: 1; padding: 12px; border-radius: 12px; border: 2px solid var(--color-secondary); background: var(--color-surface); color: var(--color-text); font-size: 16px; text-transform: uppercase;">
          <button class="btn btn--secondary" id="btn-join">Join</button>
        </div>
        <button class="btn btn--secondary" id="btn-gallery" style="background: transparent; border: 1px solid var(--color-secondary);">Browse Gallery</button>
      </div>
    </div>
  `;

  document.getElementById('btn-create').addEventListener('click', () => {
    const roomId = createRoom();
    navigateTo('lobby', { roomId });
  });

  document.getElementById('btn-join').addEventListener('click', () => {
    const code = document.getElementById('input-room').value.trim().toUpperCase();
    if (code.length === 6) navigateTo('lobby', { roomId: code });
  });

  document.getElementById('btn-gallery').addEventListener('click', () => {
    navigateTo('gallery');
  });
}

export function destroy() {}
