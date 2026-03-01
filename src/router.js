import { state } from './state.js';

export function parseRoute() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('pack')) return { screen: 'packlanding', packId: params.get('pack') };
  if (params.get('room')) return { screen: 'lobby', roomId: params.get('room') };
  if (params.get('gallery')) return { screen: 'gallery' };
  return { screen: 'home' };
}

export function navigateTo(screen, params = {}) {
  const url = new URL(window.location);
  // Clear existing screen params
  url.searchParams.delete('room');
  url.searchParams.delete('pack');
  url.searchParams.delete('gallery');

  if (params.roomId) url.searchParams.set('room', params.roomId);
  if (params.packId) url.searchParams.set('pack', params.packId);
  if (screen === 'gallery') url.searchParams.set('gallery', '1');

  window.history.pushState({}, '', url);
  state.screen = screen;
  if (params.roomId) state.roomId = params.roomId;
  if (params.packId) state.pendingPackId = params.packId;

  // Dispatch custom event for screen change
  window.dispatchEvent(new CustomEvent('screenchange', { detail: { screen } }));
}

export function onRouteChange(callback) {
  window.addEventListener('popstate', () => {
    const route = parseRoute();
    callback(route);
  });
}
