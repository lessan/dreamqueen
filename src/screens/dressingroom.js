import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { getAvatarCanvas } from '../avatar.js';
import { loadMyAvatar, saveMyAvatar } from './avatareditor.js';
import { getItems, equipItem, unequipItem, getEquipped } from '../wardrobe.js';
import { showToast } from '../ui.js';
import { publishOutfit } from '../gallery.js';

const CATEGORIES = [
  { key: 'top', label: 'Top' },
  { key: 'bottom', label: 'Bottom' },
  { key: 'shoes', label: 'Shoes' },
  { key: 'outerwear', label: 'Outer' },
  { key: 'accessory', label: 'Accessory' },
];

let _activeCategory = 'top';

function refreshAvatarDisplay() {
  const container = document.getElementById('dr-avatar');
  if (!container) return;
  container.innerHTML = '';
  const cvs = getAvatarCanvas(state.myAvatar, 220, 293);
  cvs.style.width = '100%';
  cvs.style.height = '100%';
  cvs.style.objectFit = 'contain';
  container.appendChild(cvs);
}

function renderWardrobeGrid() {
  const grid = document.getElementById('dr-wardrobe-grid');
  if (!grid) return;

  const items = getItems(_activeCategory);
  const equipped = getEquipped();
  const equippedItem = equipped[_activeCategory];

  if (items.length === 0) {
    grid.innerHTML = `
      <div style="grid-column:1/-1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;gap:8px;">
        <span style="font-size:24px;">📸</span>
        <span style="color:var(--color-secondary);font-size:14px;">Add some clothes!</span>
      </div>
    `;
    return;
  }

  grid.innerHTML = '';
  for (const item of items) {
    const isEquipped = equippedItem && equippedItem.id === item.id;
    const card = document.createElement('div');
    card.style.cssText = `
      display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px;
      border-radius:12px;cursor:pointer;transition:all 0.15s;
      background:${isEquipped ? 'rgba(255,215,0,0.12)' : 'var(--color-surface)'};
      border:2px solid ${isEquipped ? 'var(--color-accent)' : 'transparent'};
    `;

    // Item thumbnail — show item sprite on small canvas
    const thumb = document.createElement('div');
    thumb.style.cssText = 'width:80px;height:80px;display:flex;align-items:center;justify-content:center;';
    if (item.imageDataURL) {
      const img = document.createElement('img');
      img.src = item.imageDataURL;
      img.style.cssText = 'width:100%;height:100%;object-fit:contain;image-rendering:pixelated;';
      img.alt = item.name;
      thumb.appendChild(img);
    }
    card.appendChild(thumb);

    const nameEl = document.createElement('span');
    nameEl.textContent = item.name;
    nameEl.style.cssText = 'font-size:11px;color:var(--color-text);text-align:center;max-width:90px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    card.appendChild(nameEl);

    card.addEventListener('click', () => {
      if (isEquipped) {
        unequipItem(_activeCategory);
      } else {
        equipItem(item);
      }
      refreshAvatarDisplay();
      renderWardrobeGrid();
    });

    grid.appendChild(card);
  }
}

function renderCategoryTabs() {
  const bar = document.getElementById('dr-tab-bar');
  if (!bar) return;
  bar.innerHTML = '';

  for (const cat of CATEGORIES) {
    const btn = document.createElement('button');
    const active = cat.key === _activeCategory;
    btn.textContent = cat.label;
    btn.style.cssText = `
      flex:1;padding:10px 4px;font-size:13px;font-weight:600;border:none;cursor:pointer;
      transition:all 0.15s;border-bottom:3px solid ${active ? 'var(--color-primary)' : 'transparent'};
      background:${active ? 'rgba(255,105,180,0.15)' : 'transparent'};
      color:${active ? 'var(--color-primary)' : 'var(--color-secondary)'};
    `;
    btn.addEventListener('click', () => {
      _activeCategory = cat.key;
      renderCategoryTabs();
      renderWardrobeGrid();
    });
    bar.appendChild(btn);
  }
}

function renderOtherPlayers() {
  const strip = document.getElementById('dr-players');
  if (!strip) return;

  const playerSlugs = Object.keys(state.roomPlayers);
  if (playerSlugs.length === 0) {
    strip.style.display = 'none';
    return;
  }

  strip.style.display = 'flex';
  strip.innerHTML = '';
  for (const slug of playerSlugs) {
    const p = state.roomPlayers[slug];
    const card = document.createElement('div');
    card.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:2px;flex-shrink:0;';
    const thumb = getAvatarCanvas(p.avatarState || state.myAvatar, 80, 107);
    thumb.style.cssText = 'width:60px;height:80px;object-fit:contain;border-radius:8px;background:var(--color-surface);';
    card.appendChild(thumb);
    const nameEl = document.createElement('span');
    nameEl.textContent = p.codename || slug;
    nameEl.style.cssText = 'font-size:10px;color:var(--color-secondary);max-width:70px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    card.appendChild(nameEl);
    strip.appendChild(card);
  }
}

export function init(container) {
  // Load saved avatar into state
  const saved = loadMyAvatar();
  Object.assign(state.myAvatar, saved);
  _activeCategory = 'top';

  const codename = state.myCodename || 'You';

  container.innerHTML = `
    <div class="screen" data-screen="dressingroom" style="display:flex;flex-direction:column;height:100%;padding:0;overflow:hidden;">
      <!-- Header bar -->
      <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-bottom:1px solid var(--color-surface);flex-shrink:0;min-height:48px;">
        <div style="display:flex;align-items:center;gap:10px;">
          <button class="btn" id="dr-home" style="padding:4px 10px;font-size:18px;background:transparent;border:none;color:var(--color-secondary);">🏠</button>
          <span style="color:var(--color-primary);font-size:14px;font-weight:600;">${codename}</span>
        </div>
        <button class="btn btn--primary" id="dr-publish" style="padding:6px 14px;font-size:13px;">✨ Publish</button>
      </div>

      <!-- Avatar display -->
      <div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;gap:6px;padding:12px 0 8px;">
        <div id="dr-avatar" style="width:220px;height:293px;"></div>
        <div style="display:flex;gap:8px;margin-top:4px;">
          <button class="btn btn--secondary" id="dr-edit-avatar" style="padding:6px 14px;font-size:12px;">Edit Avatar</button>
          <button class="btn btn--secondary" id="dr-camera" style="padding:6px 14px;font-size:12px;">Add Clothes</button>
        </div>
      </div>

      <!-- Category tab bar -->
      <div id="dr-tab-bar" style="display:flex;border-top:1px solid var(--color-surface);border-bottom:1px solid var(--color-surface);flex-shrink:0;min-height:48px;"></div>

      <!-- Wardrobe grid -->
      <div id="dr-wardrobe-grid" style="
        flex:1;overflow-y:auto;padding:12px;
        display:grid;grid-template-columns:repeat(3,1fr);gap:10px;
        align-content:start;
      "></div>

      <!-- Other players strip -->
      <div id="dr-players" style="display:none;gap:8px;padding:8px 16px;overflow-x:auto;border-top:1px solid var(--color-surface);min-height:80px;align-items:center;flex-shrink:0;"></div>
    </div>
  `;

  refreshAvatarDisplay();
  renderCategoryTabs();
  renderWardrobeGrid();
  renderOtherPlayers();

  document.getElementById('dr-home').addEventListener('click', () => {
    navigateTo('home');
  });

  document.getElementById('dr-edit-avatar').addEventListener('click', () => {
    navigateTo('avatareditor');
  });

  document.getElementById('dr-camera').addEventListener('click', () => {
    navigateTo('camera');
  });

  document.getElementById('dr-publish').addEventListener('click', async () => {
    const btn = document.getElementById('dr-publish');
    btn.disabled = true;
    btn.textContent = 'Publishing...';
    try {
      await publishOutfit();
      showToast('Outfit published!');
    } catch (err) {
      console.error('Publish failed:', err);
      showToast('Could not publish right now');
    }
    btn.disabled = false;
    btn.textContent = 'Publish';
  });
}

export function destroy() {}
