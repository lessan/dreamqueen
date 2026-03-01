import { state } from './state.js';
import { parseRoute, onRouteChange } from './router.js';
import { loadWardrobe } from './wardrobe.js';
import { showScreen } from './ui.js';
import { loadMyAvatar } from './screens/avatareditor.js';
import { initStarterPack } from './packs.js';

const screens = {};

async function loadScreen(name) {
  if (!screens[name]) {
    const mod = await import(`./screens/${name}.js`);
    screens[name] = mod;
  }
  return screens[name];
}

export async function render() {
  const app = document.getElementById('app');
  const screen = await loadScreen(state.screen);
  if (screen.init) screen.init(app);
  showScreen(state.screen);
}

async function initApp() {
  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  }

  // Load avatar from localStorage
  const saved = loadMyAvatar();
  Object.assign(state.myAvatar, saved);

  // Load wardrobe from localStorage
  loadWardrobe();

  // Seed starter pack if needed
  initStarterPack();

  // Parse initial route
  const route = parseRoute();
  state.screen = route.screen;
  if (route.roomId) state.roomId = route.roomId;
  if (route.packId) state.pendingPackId = route.packId;

  // Listen for route changes
  onRouteChange(async (route) => {
    state.screen = route.screen;
    if (route.roomId) state.roomId = route.roomId;
    if (route.packId) state.pendingPackId = route.packId;
    await render();
  });

  // Listen for screen changes from navigateTo
  window.addEventListener('screenchange', async () => {
    await render();
  });

  // Initial render
  await render();
}

document.addEventListener('DOMContentLoaded', initApp);
