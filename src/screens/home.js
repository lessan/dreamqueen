import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { createRoom } from '../room.js';
import { getAvatarCanvas } from '../avatar.js';
import { loadMyAvatar } from './avatareditor.js';

export function init(container) {
  // Load saved avatar into state
  const saved = loadMyAvatar();
  Object.assign(state.myAvatar, saved);

  container.innerHTML = `
    <div class="screen" data-screen="home" style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;
      background:linear-gradient(160deg, var(--color-bg) 0%, #2d1b4e 50%, #1a0a2e 100%);
    ">
      <div style="text-align:center;margin-bottom:8px;">
        <div style="font-size:42px;font-weight:800;color:var(--color-primary);line-height:1.1;">Dream Queen</div>
        <div style="font-size:14px;color:var(--color-secondary);margin-top:4px;">Dress up, share, repeat.</div>
      </div>
      <div id="home-avatar-preview" style="width:120px;height:160px;margin:4px 0;"></div>
      <div style="display:flex;flex-direction:column;gap:10px;width:100%;max-width:280px;">
        <button class="btn btn--primary" id="btn-create" style="font-size:17px;padding:14px 24px;">Create Room</button>
        <div style="display:flex;gap:8px;">
          <input type="text" id="input-room" placeholder="Room code" maxlength="6"
            style="flex:1;padding:12px;border-radius:12px;border:2px solid var(--color-secondary);
                   background:var(--color-surface);color:var(--color-text);font-size:16px;text-transform:uppercase;">
          <button class="btn btn--secondary" id="btn-join">Join</button>
        </div>
        <button class="btn btn--secondary" id="btn-gallery" style="background:transparent;border:1px solid var(--color-secondary);">Browse Gallery</button>
        <button id="btn-avatar" style="
          background:none;border:none;color:var(--color-accent);font-size:15px;cursor:pointer;
          padding:8px 0;text-decoration:underline;text-underline-offset:3px;
        ">Customize Avatar</button>
      </div>
    </div>
  `;

  // Render small avatar preview
  const previewContainer = document.getElementById('home-avatar-preview');
  const cvs = getAvatarCanvas(state.myAvatar, 120, 160);
  cvs.style.width = '100%';
  cvs.style.height = '100%';
  cvs.style.objectFit = 'contain';
  previewContainer.appendChild(cvs);

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

  document.getElementById('btn-avatar').addEventListener('click', () => {
    navigateTo('avatareditor');
  });
}

export function destroy() {}
