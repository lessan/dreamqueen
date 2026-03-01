import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { getAvatarCanvas } from '../avatar.js';
import { loadMyAvatar } from './avatareditor.js';

export function init(container) {
  // Load saved avatar into state
  const saved = loadMyAvatar();
  Object.assign(state.myAvatar, saved);

  const codename = state.myCodename || 'You';

  container.innerHTML = `
    <div class="screen" data-screen="dressingroom" style="display:flex;flex-direction:column;height:100%;padding:0;">
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--color-surface);">
        <span style="color:var(--color-secondary);font-size:12px;">Room: ${state.roomId || '--'}</span>
        <button class="btn btn--primary" id="dr-publish" style="padding:6px 14px;font-size:13px;">Publish</button>
      </div>
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;padding:12px;">
        <div style="font-size:15px;font-weight:600;color:var(--color-accent);">${codename}</div>
        <div id="dr-avatar" style="width:220px;height:300px;"></div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button class="btn btn--secondary" id="dr-edit-avatar" style="padding:8px 16px;font-size:13px;">Edit Avatar</button>
          <button class="btn btn--secondary" id="dr-camera" style="padding:8px 16px;font-size:13px;">Add Clothes</button>
        </div>
      </div>
      <div id="dr-players" style="display:flex;gap:8px;padding:8px 16px;overflow-x:auto;border-top:1px solid var(--color-surface);min-height:80px;align-items:center;">
        <span style="color:var(--color-secondary);font-size:12px;">Other players will appear here...</span>
      </div>
      <div id="wardrobe-tray" style="height:100px;background:var(--color-surface);border-radius:12px 12px 0 0;padding:8px;overflow-x:auto;">
        <p style="color:var(--color-secondary);font-size:12px;">Wardrobe items will appear here.</p>
      </div>
    </div>
  `;

  // Render player avatar
  const avatarContainer = document.getElementById('dr-avatar');
  const cvs = getAvatarCanvas(state.myAvatar, 220, 300);
  cvs.style.width = '100%';
  cvs.style.height = '100%';
  cvs.style.objectFit = 'contain';
  avatarContainer.appendChild(cvs);

  // Render other players
  const playersStrip = document.getElementById('dr-players');
  const playerSlugs = Object.keys(state.roomPlayers);
  if (playerSlugs.length > 0) {
    playersStrip.innerHTML = '';
    for (const slug of playerSlugs) {
      const p = state.roomPlayers[slug];
      const card = document.createElement('div');
      card.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;';
      const thumb = getAvatarCanvas(p.avatarState || state.myAvatar, 60, 80);
      thumb.style.width = '50px';
      thumb.style.height = '66px';
      thumb.style.objectFit = 'contain';
      thumb.style.borderRadius = '8px';
      thumb.style.background = 'var(--color-surface)';
      card.appendChild(thumb);
      const nameEl = document.createElement('span');
      nameEl.textContent = p.codename || slug;
      nameEl.style.cssText = 'font-size:10px;color:var(--color-secondary);max-width:60px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
      card.appendChild(nameEl);
      playersStrip.appendChild(card);
    }
  }

  document.getElementById('dr-edit-avatar').addEventListener('click', () => {
    navigateTo('avatareditor');
  });

  document.getElementById('dr-camera').addEventListener('click', () => {
    navigateTo('camera');
  });
}

export function destroy() {}
