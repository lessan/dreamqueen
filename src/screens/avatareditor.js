import { state } from '../state.js';
import { navigateTo } from '../router.js';
import {
  renderAvatar, getAvatarCanvas,
  SKIN_TONES, HAIR_COLORS, BODY_TYPES, HAIR_STYLES, EYE_SHAPES, MOUTH_SHAPES
} from '../avatar.js';

const AVATAR_LS_KEY = 'dq_myavatar';

const defaultAvatar = {
  bodyType: 2,
  skinTone: '#F5CBA7',
  hairStyle: 1,
  hairColor: '#3B2314',
  eyeShape: 1,
  mouthShape: 1,
  equipped: { top: null, bottom: null, shoes: null, outerwear: null, accessory: null }
};

export function loadMyAvatar() {
  try {
    const saved = localStorage.getItem(AVATAR_LS_KEY);
    return saved ? JSON.parse(saved) : { ...defaultAvatar };
  } catch {
    return { ...defaultAvatar };
  }
}

export function saveMyAvatar(avatarState) {
  localStorage.setItem(AVATAR_LS_KEY, JSON.stringify(avatarState));
}

let _previewCanvas = null;
let _returnTo = null;

function refreshPreview() {
  const container = document.getElementById('ae-preview');
  if (!container) return;
  container.innerHTML = '';
  _previewCanvas = getAvatarCanvas(state.myAvatar, 300, 400);
  _previewCanvas.style.width = '100%';
  _previewCanvas.style.height = '100%';
  _previewCanvas.style.objectFit = 'contain';
  container.appendChild(_previewCanvas);
}

function buildSwatches(colors, current, onPick) {
  let html = '<div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;padding:8px 0;">';
  for (const c of colors) {
    const sel = c === current;
    html += `<button data-color="${c}" style="
      width:40px;height:40px;border-radius:50%;border:3px solid ${sel ? 'var(--color-accent)' : 'transparent'};
      background:${c};cursor:pointer;transition:border-color 0.15s;flex-shrink:0;
    " aria-label="${c}"></button>`;
  }
  html += '</div>';
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      onPick(btn.dataset.color);
      refreshPreview();
      renderTab();
    });
  });
  return div;
}

function buildNumberButtons(count, current, label, onPick) {
  let html = `<div style="font-size:13px;color:var(--color-secondary);margin-bottom:4px;">${label}</div>`;
  html += '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center;padding:4px 0;">';
  for (let i = 1; i <= count; i++) {
    const sel = i === current;
    html += `<button data-val="${i}" style="
      width:38px;height:38px;border-radius:8px;font-size:14px;font-weight:600;
      border:2px solid ${sel ? 'var(--color-accent)' : 'var(--color-secondary)'};
      background:${sel ? 'var(--color-accent)' : 'var(--color-surface)'};
      color:${sel ? '#000' : 'var(--color-text)'};cursor:pointer;transition:all 0.15s;
    ">${i}</button>`;
  }
  html += '</div>';
  const div = document.createElement('div');
  div.innerHTML = html;
  div.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      onPick(parseInt(btn.dataset.val, 10));
      refreshPreview();
      renderTab();
    });
  });
  return div;
}

function buildBodyPreview(types, current, onPick) {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'display:flex;gap:12px;justify-content:center;padding:12px 0;';
  for (const t of types) {
    const sel = t === current;
    const mini = getAvatarCanvas({ ...state.myAvatar, bodyType: t, hairStyle: 0, eyeShape: 0, mouthShape: 0 }, 80, 110);
    mini.style.width = '70px';
    mini.style.height = '96px';
    mini.style.objectFit = 'contain';
    mini.style.borderRadius = '10px';
    mini.style.border = `3px solid ${sel ? 'var(--color-accent)' : 'var(--color-surface)'}`;
    mini.style.background = 'var(--color-surface)';
    mini.style.cursor = 'pointer';
    mini.dataset.val = t;
    mini.addEventListener('click', () => {
      onPick(t);
      refreshPreview();
      renderTab();
    });
    wrapper.appendChild(mini);
  }
  return wrapper;
}

let _activeTab = 'skin';

function renderTab() {
  const panel = document.getElementById('ae-options');
  if (!panel) return;
  panel.innerHTML = '';

  const av = state.myAvatar;

  if (_activeTab === 'skin') {
    const label = document.createElement('div');
    label.textContent = 'Skin Tone';
    label.style.cssText = 'font-size:14px;font-weight:600;text-align:center;margin-bottom:4px;color:var(--color-text);';
    panel.appendChild(label);
    panel.appendChild(buildSwatches(SKIN_TONES, av.skinTone, c => { av.skinTone = c; saveMyAvatar(av); }));

    const elabel = document.createElement('div');
    elabel.textContent = 'Eyes';
    elabel.style.cssText = 'font-size:14px;font-weight:600;text-align:center;margin:8px 0 4px;color:var(--color-text);';
    panel.appendChild(elabel);
    panel.appendChild(buildNumberButtons(EYE_SHAPES.length, av.eyeShape, '', v => { av.eyeShape = v; saveMyAvatar(av); }));

    const mlabel = document.createElement('div');
    mlabel.textContent = 'Mouth';
    mlabel.style.cssText = 'font-size:14px;font-weight:600;text-align:center;margin:8px 0 4px;color:var(--color-text);';
    panel.appendChild(mlabel);
    panel.appendChild(buildNumberButtons(MOUTH_SHAPES.length, av.mouthShape, '', v => { av.mouthShape = v; saveMyAvatar(av); }));
  } else if (_activeTab === 'hair') {
    panel.appendChild(buildNumberButtons(HAIR_STYLES, av.hairStyle, 'Hair Style', v => { av.hairStyle = v; saveMyAvatar(av); }));
    const spacer = document.createElement('div');
    spacer.style.height = '8px';
    panel.appendChild(spacer);
    const label = document.createElement('div');
    label.textContent = 'Hair Colour';
    label.style.cssText = 'font-size:14px;font-weight:600;text-align:center;margin-bottom:4px;color:var(--color-text);';
    panel.appendChild(label);
    panel.appendChild(buildSwatches(HAIR_COLORS, av.hairColor, c => { av.hairColor = c; saveMyAvatar(av); }));
  } else if (_activeTab === 'body') {
    const label = document.createElement('div');
    label.textContent = 'Body Type';
    label.style.cssText = 'font-size:14px;font-weight:600;text-align:center;margin-bottom:4px;color:var(--color-text);';
    panel.appendChild(label);
    panel.appendChild(buildBodyPreview(BODY_TYPES, av.bodyType, v => { av.bodyType = v; saveMyAvatar(av); }));
  }
}

function setTab(tab) {
  _activeTab = tab;
  // Update tab button styles
  document.querySelectorAll('.ae-tab').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.style.background = active ? 'var(--color-primary)' : 'var(--color-surface)';
    btn.style.color = active ? '#fff' : 'var(--color-text)';
    btn.style.borderColor = active ? 'var(--color-primary)' : 'var(--color-secondary)';
  });
  renderTab();
}

export function init(container, params) {
  _returnTo = (params && params.returnTo) || 'home';
  _activeTab = 'skin';

  // Load saved avatar into state
  const saved = loadMyAvatar();
  Object.assign(state.myAvatar, saved);

  container.innerHTML = `
    <div class="screen" data-screen="avatareditor" style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;">
        <button id="ae-back" style="background:none;border:none;color:var(--color-text);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592;</button>
        <span style="font-size:18px;font-weight:700;color:var(--color-primary);flex:1;text-align:center;">Edit Avatar</span>
        <button id="ae-done" class="btn btn--primary" style="padding:8px 16px;font-size:14px;">Done</button>
      </div>
      <div id="ae-preview" style="flex:0 0 auto;height:280px;display:flex;align-items:center;justify-content:center;margin:0 auto;width:220px;"></div>
      <div style="display:flex;gap:0;border-top:1px solid var(--color-surface);border-bottom:1px solid var(--color-surface);">
        <button class="ae-tab" data-tab="skin" style="flex:1;padding:10px 0;font-size:14px;font-weight:600;border:none;border-bottom:3px solid var(--color-primary);cursor:pointer;background:var(--color-primary);color:#fff;transition:all 0.15s;">Skin</button>
        <button class="ae-tab" data-tab="hair" style="flex:1;padding:10px 0;font-size:14px;font-weight:600;border:none;border-bottom:3px solid var(--color-secondary);cursor:pointer;background:var(--color-surface);color:var(--color-text);transition:all 0.15s;">Hair</button>
        <button class="ae-tab" data-tab="body" style="flex:1;padding:10px 0;font-size:14px;font-weight:600;border:none;border-bottom:3px solid var(--color-secondary);cursor:pointer;background:var(--color-surface);color:var(--color-text);transition:all 0.15s;">Body</button>
      </div>
      <div id="ae-options" style="flex:1;overflow-y:auto;padding:12px 16px;"></div>
    </div>
  `;

  refreshPreview();
  renderTab();

  // Tab switching
  document.querySelectorAll('.ae-tab').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  // Back / Done
  const goBack = () => {
    saveMyAvatar(state.myAvatar);
    navigateTo(_returnTo);
  };
  document.getElementById('ae-back').addEventListener('click', goBack);
  document.getElementById('ae-done').addEventListener('click', goBack);
}

export function destroy() {
  _previewCanvas = null;
}
