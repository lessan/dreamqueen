// Gallery screen — browse published outfits

import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { fetchGallery, reportPost } from '../gallery.js';
import { showToast } from '../ui.js';

let _posts = [];
let _loading = false;

function renderPosts() {
  const grid = document.getElementById('gallery-grid');
  if (!grid) return;

  if (_loading) {
    grid.innerHTML = '';
    for (let i = 0; i < 4; i++) {
      const skel = document.createElement('div');
      skel.style.cssText = `
        aspect-ratio:3/4;border-radius:12px;
        background:var(--color-surface);
        animation:pulse 1.5s ease-in-out infinite;
      `;
      grid.appendChild(skel);
    }
    return;
  }

  if (_posts.length === 0) {
    grid.innerHTML = `
      <p style="color:var(--color-secondary);font-size:14px;grid-column:1/-1;text-align:center;padding:40px 0;">
        No outfits yet -- be the first to publish!
      </p>
    `;
    return;
  }

  grid.innerHTML = '';
  for (const post of _posts) {
    const card = document.createElement('div');
    card.style.cssText = `
      display:flex;flex-direction:column;background:var(--color-surface);
      border-radius:12px;overflow:hidden;position:relative;
    `;

    // Outfit image
    const img = document.createElement('img');
    img.src = post.imageURL || '';
    img.alt = post.codename || 'Outfit';
    img.style.cssText = 'width:100%;aspect-ratio:3/4;object-fit:cover;background:#1a0a2e;';
    img.loading = 'lazy';
    card.appendChild(img);

    // Info bar
    const info = document.createElement('div');
    info.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 10px;';

    const nameEl = document.createElement('span');
    nameEl.textContent = post.codename || 'Anonymous';
    nameEl.style.cssText = 'font-size:12px;color:var(--color-text);font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
    info.appendChild(nameEl);

    // Report button
    const reportBtn = document.createElement('button');
    reportBtn.textContent = '...';
    reportBtn.style.cssText = `
      background:none;border:none;color:var(--color-secondary);font-size:16px;
      cursor:pointer;padding:2px 6px;line-height:1;
    `;
    reportBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (confirm('Report this outfit as inappropriate?')) {
        try {
          await reportPost(post.id);
          showToast('Reported. Thanks for keeping it safe!');
        } catch {
          showToast('Could not report right now');
        }
      }
    });
    info.appendChild(reportBtn);

    card.appendChild(info);
    grid.appendChild(card);
  }
}

async function loadPosts() {
  _loading = true;
  renderPosts();
  try {
    _posts = await fetchGallery(20);
  } catch (err) {
    console.error('Failed to load gallery:', err);
    _posts = [];
  }
  _loading = false;
  renderPosts();
}

export function init(container) {
  _posts = [];
  _loading = false;

  container.innerHTML = `
    <div class="screen" data-screen="gallery" style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;border-bottom:1px solid var(--color-surface);flex-shrink:0;">
        <button id="gal-back" style="background:none;border:none;color:var(--color-text);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592; Back</button>
        <span style="flex:1;text-align:center;font-size:18px;font-weight:700;color:var(--color-primary);">Gallery</span>
        <span style="width:60px;"></span>
      </div>
      <div id="gallery-grid" style="
        flex:1;overflow-y:auto;padding:12px;
        display:grid;grid-template-columns:repeat(2,1fr);gap:12px;
        align-content:start;
      "></div>
    </div>
  `;

  document.getElementById('gal-back').addEventListener('click', () => {
    navigateTo('home');
  });

  // Add skeleton pulse animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes pulse {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 0.8; }
    }
  `;
  container.appendChild(style);

  loadPosts();
}

export function destroy() {
  _posts = [];
  _loading = false;
}
