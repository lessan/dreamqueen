import { state } from './state.js';

const STORAGE_KEY = 'dq_wardrobe';

export function loadWardrobe() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    state.myWardrobe = raw ? JSON.parse(raw) : [];
  } catch {
    state.myWardrobe = [];
  }
  return state.myWardrobe;
}

export function saveWardrobe(items) {
  if (items) state.myWardrobe = items;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state.myWardrobe));
}

export function addItem(item) {
  state.myWardrobe.push(item);
  saveWardrobe();
}

export function removeItem(id) {
  state.myWardrobe = state.myWardrobe.filter((item) => item.id !== id);
  saveWardrobe();
}

export function getItems(category) {
  if (!category) return state.myWardrobe;
  return state.myWardrobe.filter((item) => item.category === category);
}
