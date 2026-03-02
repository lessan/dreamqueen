import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { getAvatarCanvas, SKIN_TONES, HAIR_COLORS, EYE_SHAPES, MOUTH_SHAPES } from '../avatar.js';
import {
  GENDERS_3D, BODIES_3D, SKINS_3D, HAIRS_3D,
  avatarAvailable, avatarImagePath,
} from '../avatarImages.js';

const AVATAR_LS_KEY = 'dq_myavatar';

export const defaultAvatar = {
  // ── 3D fields ──
  gender:  'female',
  body3d:  'slim',
  skin3d:  'fair',
  hair3d:  'undercut',
  // ── Classic canvas fields ──
  bodyType:   2,
  skinTone:   '#F5CBA7',
  hairStyle:  1,
  hairColor:  '#3B2314',
  eyeShape:   1,
  mouthShape: 1,
  equipped: { top: null, bottom: null, shoes: null, outerwear: null, accessory: null },
};

export function loadMyAvatar() {
  try {
    const saved = localStorage.getItem(AVATAR_LS_KEY);
    // Merge with defaults so new fields are always present
    return saved ? { ...defaultAvatar, ...JSON.parse(saved) } : { ...defaultAvatar };
  } catch {
    return { ...defaultAvatar };
  }
}

export function saveMyAvatar(avatarState) {
  localStorage.setItem(AVATAR_LS_KEY, JSON.stringify(avatarState));
}

// ── Preview ───────────────────────────────────────────────────────────────────

function refreshPreview() {
  const container = document.getElementById('ae-preview');
  if (!container) return;
  container.innerHTML = '';

  const av = state.myAvatar;
  const available = avatarAvailable(av.gender, av.body3d, av.skin3d, av.hair3d);

  if (available) {
    const img = document.createElement('img');
    img.src = avatarImagePath(av.gender, av.body3d, av.skin3d, av.hair3d);
    img.style.cssText = 'width:100%;height:100%;object-fit:contain;border-radius:12px;';
    img.onerror = () => { container.innerHTML = ''; appendCanvasFallback(container); };
    container.appendChild(img);
  } else {
    appendCanvasFallback(container);
    const badge = document.createElement('div');
    badge.textContent = '✨ Coming soon';
    badge.style.cssText = 'position:absolute;bottom:8px;left:50%;transform:translateX(-50%);' +
      'font-size:11px;color:var(--color-secondary);background:rgba(0,0,0,0.45);' +
      'padding:2px 8px;border-radius:99px;white-space:nowrap;';
    container.style.position = 'relative';
    container.appendChild(badge);
  }
}

function appendCanvasFallback(container) {
  const cvs = getAvatarCanvas(state.myAvatar, 300, 400);
  cvs.style.cssText = 'width:100%;height:100%;object-fit:contain;';
  container.appendChild(cvs);
}

// ── Option builders ───────────────────────────────────────────────────────────

/** Returns {el, update} — update() re-checks availability without rebuilding. */
function buildOptionBtn(label, isSelected, isAvailable, onClick) {
  const btn = document.createElement('button');
  btn.textContent = label;
  btn.style.cssText = `
    padding:8px 14px;border-radius:20px;font-size:14px;font-weight:600;
    cursor:${isAvailable ? 'pointer' : 'default'};
    transition:all 0.15s;border:2px solid;
    ${isSelected
      ? 'border-color:var(--color-primary);background:var(--color-primary);color:#fff;'
      : isAvailable
        ? 'border-color:var(--color-secondary);background:var(--color-surface);color:var(--color-text);'
        : 'border-color:transparent;background:var(--color-surface);color:var(--color-secondary);opacity:0.4;'
    }
  `;
  if (!isAvailable) {
    btn.title = 'Coming soon';
  }
  btn.addEventListener('click', () => { if (isAvailable) onClick(); });
  return btn;
}

function buildColorBtn(hex, label, isSelected, isAvailable, onClick) {
  const btn = document.createElement('button');
  btn.style.cssText = `
    width:44px;height:44px;border-radius:50%;cursor:${isAvailable ? 'pointer' : 'default'};
    border:3px solid ${isSelected ? 'var(--color-accent)' : 'transparent'};
    background:${hex};transition:border-color 0.15s;position:relative;flex-shrink:0;
    ${isAvailable ? '' : 'opacity:0.35;'}
  `;
  btn.title = label + (isAvailable ? '' : ' (coming soon)');
  if (!isAvailable) {
    const lock = document.createElement('span');
    lock.textContent = '🔒';
    lock.style.cssText = 'position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:14px;';
    btn.appendChild(lock);
  }
  btn.addEventListener('click', () => { if (isAvailable) onClick(); });
  return btn;
}

// ── Tabs ──────────────────────────────────────────────────────────────────────

let _activeTab = 'look';

function renderTab() {
  const panel = document.getElementById('ae-options');
  if (!panel) return;
  panel.innerHTML = '';

  const av = state.myAvatar;

  if (_activeTab === 'look') {
    renderLookTab(panel, av);
  } else {
    renderClassicTab(panel, av);
  }
}

function section(panel, title) {
  const el = document.createElement('div');
  el.textContent = title;
  el.style.cssText = 'font-size:13px;font-weight:700;color:var(--color-secondary);letter-spacing:0.05em;margin:12px 0 6px;text-transform:uppercase;';
  panel.appendChild(el);
}

function row(panel) {
  const el = document.createElement('div');
  el.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;padding:2px 0;';
  panel.appendChild(el);
  return el;
}

function renderLookTab(panel, av) {
  // ── Gender ──
  section(panel, 'Gender');
  const gRow = row(panel);
  for (const g of GENDERS_3D) {
    // Gender is always available (at least one combo per gender exists)
    const available = BODIES_3D.some(b =>
      SKINS_3D.some(s =>
        HAIRS_3D.some(h => avatarAvailable(g.id, b.id, s.id, h.id))
      )
    );
    const btn = buildOptionBtn(g.label, av.gender === g.id, available, () => {
      av.gender = g.id;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    gRow.appendChild(btn);
  }

  // ── Body ──
  section(panel, 'Body');
  const bRow = row(panel);
  for (const b of BODIES_3D) {
    const available = avatarAvailable(av.gender, b.id, av.skin3d, av.hair3d);
    const btn = buildOptionBtn(b.label, av.body3d === b.id, available, () => {
      av.body3d = b.id;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    bRow.appendChild(btn);
  }

  // ── Skin ──
  section(panel, 'Skin Tone');
  const sRow = row(panel);
  for (const s of SKINS_3D) {
    const available = avatarAvailable(av.gender, av.body3d, s.id, av.hair3d);
    const btn = buildColorBtn(s.hex, s.label, av.skin3d === s.id, available, () => {
      av.skin3d = s.id;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    sRow.appendChild(btn);
  }

  // ── Hair ──
  section(panel, 'Hair');
  const hRow = row(panel);
  for (const h of HAIRS_3D) {
    const available = avatarAvailable(av.gender, av.body3d, av.skin3d, h.id);
    const btn = buildOptionBtn(h.label, av.hair3d === h.id, available, () => {
      av.hair3d = h.id;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    hRow.appendChild(btn);
  }
}

function renderClassicTab(panel, av) {
  section(panel, 'Skin Tone');
  const sRow = row(panel);
  for (const c of SKIN_TONES) {
    const btn = buildColorBtn(c, c, av.skinTone === c, true, () => {
      av.skinTone = c;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    sRow.appendChild(btn);
  }

  section(panel, 'Hair Colour');
  const hcRow = row(panel);
  for (const c of HAIR_COLORS) {
    const btn = buildColorBtn(c, c, av.hairColor === c, true, () => {
      av.hairColor = c;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    hcRow.appendChild(btn);
  }

  section(panel, 'Eyes');
  const eRow = row(panel);
  for (let i = 1; i <= EYE_SHAPES.length; i++) {
    const btn = buildOptionBtn(String(i), av.eyeShape === i, true, () => {
      av.eyeShape = i;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    eRow.appendChild(btn);
  }

  section(panel, 'Mouth');
  const mRow = row(panel);
  for (let i = 1; i <= MOUTH_SHAPES.length; i++) {
    const btn = buildOptionBtn(String(i), av.mouthShape === i, true, () => {
      av.mouthShape = i;
      saveMyAvatar(av);
      refreshPreview();
      renderTab();
    });
    mRow.appendChild(btn);
  }
}

function setTab(tab) {
  _activeTab = tab;
  document.querySelectorAll('.ae-tab').forEach(btn => {
    const active = btn.dataset.tab === tab;
    btn.style.background    = active ? 'var(--color-primary)' : 'var(--color-surface)';
    btn.style.color         = active ? '#fff' : 'var(--color-text)';
    btn.style.borderColor   = active ? 'var(--color-primary)' : 'var(--color-secondary)';
  });
  renderTab();
}

// ── Init ──────────────────────────────────────────────────────────────────────

let _returnTo = null;

export function init(container, params) {
  _returnTo  = (params && params.returnTo) || 'home';
  _activeTab = 'look';

  const saved = loadMyAvatar();
  Object.assign(state.myAvatar, saved);

  container.innerHTML = `
    <div class="screen" data-screen="avatareditor" style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;">
        <button id="ae-back" style="background:none;border:none;color:var(--color-text);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592;</button>
        <span style="font-size:18px;font-weight:700;color:var(--color-primary);flex:1;text-align:center;">Edit Avatar</span>
        <button id="ae-done" class="btn btn--primary" style="padding:8px 16px;font-size:14px;">Done</button>
      </div>

      <div id="ae-preview" style="flex:0 0 auto;height:260px;display:flex;align-items:center;justify-content:center;margin:0 auto;width:200px;"></div>

      <div style="display:flex;gap:0;border-top:1px solid var(--color-surface);border-bottom:1px solid var(--color-surface);">
        <button class="ae-tab" data-tab="look"
          style="flex:1;padding:10px 0;font-size:14px;font-weight:600;border:none;border-bottom:3px solid var(--color-primary);cursor:pointer;background:var(--color-primary);color:#fff;transition:all 0.15s;">
          ✨ Look
        </button>
        <button class="ae-tab" data-tab="classic"
          style="flex:1;padding:10px 0;font-size:14px;font-weight:600;border:none;border-bottom:3px solid var(--color-secondary);cursor:pointer;background:var(--color-surface);color:var(--color-text);transition:all 0.15s;">
          Classic
        </button>
      </div>

      <div id="ae-options" style="flex:1;overflow-y:auto;padding:12px 16px;"></div>
    </div>
  `;

  refreshPreview();
  renderTab();

  document.querySelectorAll('.ae-tab').forEach(btn => {
    btn.addEventListener('click', () => setTab(btn.dataset.tab));
  });

  const goBack = () => { saveMyAvatar(state.myAvatar); navigateTo(_returnTo); };
  document.getElementById('ae-back').addEventListener('click', goBack);
  document.getElementById('ae-done').addEventListener('click', goBack);
}

export function destroy() {}
