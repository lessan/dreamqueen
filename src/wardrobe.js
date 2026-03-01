import { state } from './state.js';
import { saveMyAvatar } from './screens/avatareditor.js';

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

export function equipItem(item) {
  state.myAvatar.equipped[item.category] = item;
  saveMyAvatar(state.myAvatar);
}

export function unequipItem(category) {
  state.myAvatar.equipped[category] = null;
  saveMyAvatar(state.myAvatar);
}

export function getEquipped() {
  return state.myAvatar.equipped;
}
