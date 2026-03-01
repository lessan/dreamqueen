import { state } from './state.js';

export function showScreen(screenName) {
  const screens = document.querySelectorAll('.screen');
  screens.forEach((el) => {
    if (el.dataset.screen === screenName) {
      el.classList.remove('screen--hidden');
    } else {
      el.classList.add('screen--hidden');
    }
  });
  state.screen = screenName;
}

export function showToast(message, duration = 2500) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('toast--visible');
  setTimeout(() => toast.classList.remove('toast--visible'), duration);
}

export function setLoading(isLoading) {
  let overlay = document.querySelector('.loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.className = 'loading-overlay loading-overlay--hidden';
    overlay.innerHTML = '<div style="color: var(--color-text); font-size: 18px;">Loading...</div>';
    document.body.appendChild(overlay);
  }
  overlay.classList.toggle('loading-overlay--hidden', !isLoading);
}
