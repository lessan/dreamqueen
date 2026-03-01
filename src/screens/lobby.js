// Lobby screen — room sharing, player list, start dressing

import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { joinRoom, leaveRoom } from '../room.js';
import { generateQR } from '../qr.js';
import { showToast } from '../ui.js';

const CODENAME_COLOURS = {
  Red: '#ff4444', Orange: '#ff8c00', Yellow: '#ffd700', Green: '#44bb44',
  Blue: '#4488ff', Purple: '#9944ff', Pink: '#ff69b4', Teal: '#008b8b',
  Gold: '#ffd700', Silver: '#aaaaaa'
};

function getCodenameColour(codename) {
  const first = codename.split(' ')[0];
  return CODENAME_COLOURS[first] || '#aaaaaa';
}

function renderPlayerList() {
  const list = document.getElementById('lobby-players');
  if (!list) return;

  const others = state.roomPlayers;
  const otherCount = Object.keys(others).length;
  const total = 1 + otherCount;

  let html = `<div style="font-size:15px;font-weight:700;color:var(--color-text);margin-bottom:8px;">Players (${total}/4)</div>`;

  // Self
  if (state.myCodename) {
    const col = getCodenameColour(state.myCodename);
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${col};flex-shrink:0;"></span>
      <span style="color:var(--color-text);font-size:14px;">${state.myCodename}</span>
      <span style="font-size:11px;color:var(--color-accent);font-weight:600;background:rgba(255,200,0,0.15);padding:2px 6px;border-radius:6px;">You</span>
    </div>`;
  }

  // Others
  Object.values(others).forEach(p => {
    const col = getCodenameColour(p.codename);
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;">
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:${col};flex-shrink:0;"></span>
      <span style="color:var(--color-text);font-size:14px;">${p.codename}</span>
    </div>`;
  });

  // Waiting slots
  for (let i = total; i < 4; i++) {
    html += `<div style="display:flex;align-items:center;gap:8px;padding:6px 0;color:var(--color-secondary);font-size:13px;font-style:italic;">
      <span style="display:inline-block;width:12px;height:12px;border-radius:50%;border:1px dashed var(--color-secondary);flex-shrink:0;"></span>
      + waiting...
    </div>`;
  }

  list.innerHTML = html;
}

export async function init(container) {
  const roomId = state.roomId || '------';
  const roomURL = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  container.innerHTML = `
    <div class="screen" data-screen="lobby" style="display:flex;flex-direction:column;height:100%;overflow-y:auto;">
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;border-bottom:1px solid var(--color-surface);">
        <button id="lobby-back" style="background:none;border:none;color:var(--color-text);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592; Back</button>
        <span style="flex:1;text-align:center;font-size:18px;font-weight:700;color:var(--color-primary);letter-spacing:2px;">Room ${roomId}</span>
      </div>

      <div style="padding:20px 24px;text-align:center;">
        <div style="font-size:14px;color:var(--color-secondary);margin-bottom:8px;">Share this link:</div>
        <button id="lobby-copy" style="
          background:var(--color-surface);border:1px solid var(--color-secondary);border-radius:10px;
          padding:10px 16px;color:var(--color-accent);font-size:13px;cursor:pointer;
          word-break:break-all;max-width:100%;text-align:center;
        ">${roomURL}</button>
        <div id="lobby-qr" style="margin:16px auto;display:flex;justify-content:center;"></div>
      </div>

      <div id="lobby-players" style="padding:0 24px 16px;"></div>

      <div style="padding:16px 24px;margin-top:auto;">
        <button class="btn btn--primary" id="lobby-start" style="width:100%;font-size:17px;padding:14px 24px;">Start Dressing!</button>
        <div style="text-align:center;font-size:12px;color:var(--color-secondary);margin-top:8px;">(any player can start at any time)</div>
      </div>
    </div>
  `;

  // Generate QR code
  const qrContainer = document.getElementById('lobby-qr');
  generateQR(roomURL, qrContainer);

  // Copy to clipboard
  document.getElementById('lobby-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(roomURL);
      showToast('Link copied!');
    } catch {
      showToast('Could not copy link');
    }
  });

  // Join room via Firebase
  if (state.roomId) {
    try {
      const { codename, codenameSlug } = await joinRoom(state.roomId);
      state.myCodename = codename;
      state.myCodenameSlug = codenameSlug;
    } catch (err) {
      console.error('Failed to join room:', err);
      showToast('Failed to join room');
    }
  }

  // Render initial player list
  renderPlayerList();

  // Listen for live player updates
  window.__onRoomPlayersUpdate = () => renderPlayerList();

  // Start dressing
  document.getElementById('lobby-start').addEventListener('click', () => {
    navigateTo('dressingroom', { roomId: state.roomId });
  });

  // Back to home
  document.getElementById('lobby-back').addEventListener('click', () => {
    leaveRoom();
    navigateTo('home');
  });
}

export function destroy() {
  window.__onRoomPlayersUpdate = null;
}
