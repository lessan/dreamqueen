import { loadWardrobe, addItem, saveWardrobe } from './wardrobe.js';
import { WARDROBE_3D, AVAILABLE_WARDROBE } from './avatarImages.js';

export function initStarterPack() {
  const wardrobe = loadWardrobe();

  // Migrate out old canvas-drawn starter items
  const filtered = wardrobe.filter(i => i.packId !== 'starter');
  if (filtered.length !== wardrobe.length) {
    saveWardrobe(filtered);
  }

  // Add any 3D wardrobe items not yet in the wardrobe
  const current = loadWardrobe();
  for (const item of WARDROBE_3D) {
    if (!AVAILABLE_WARDROBE.has(item.id)) continue;
    if (current.some(i => i.id === item.id)) continue;
    addItem({ ...item, source: '3d', packId: 'starter3d', createdAt: Date.now() });
  }
}

// --- Firestore pack stubs (Phase 5) ---

export async function downloadPack(packId) {
  // TODO: fetch pack from Firestore, download item images
  return null;
}

export async function getPackInfo(packId) {
  // TODO: return pack metadata from Firestore
  return null;
}
