/**
 * Avatar & wardrobe image manifest.
 * Update AVAILABLE_AVATARS when new WebP files are generated.
 */

export const GENDERS_3D = [
  { id: 'female', label: 'Female' },
  { id: 'male',   label: 'Male'   },
];

export const BODIES_3D = [
  { id: 'slim',     label: 'Slim'     },
  { id: 'athletic', label: 'Athletic' },
  { id: 'plus',     label: 'Plus'     },
  { id: 'petite',   label: 'Petite'   },
];

export const SKINS_3D = [
  { id: 'deep',      label: 'Deep',       hex: '#3B1A0A' },
  { id: 'olive',     label: 'Olive',      hex: '#8B6B3D' },
  { id: 'fair',      label: 'Fair',       hex: '#F5CBA7' },
  { id: 'warmbrown', label: 'Warm Brown', hex: '#A0522D' },
];

export const HAIRS_3D = [
  { id: 'braids',    label: 'Braids'     },
  { id: 'undercut',  label: 'Undercut'   },
  { id: 'longwaves', label: 'Long Waves' },
  { id: 'shaved',    label: 'Shaved'     },
];

// ── Generated image manifest ──────────────────────────────────────────────────
// Add an entry here whenever a new avatar WebP lands in assets/avatars/.
export const AVAILABLE_AVATARS = new Set([
  'female_slim_fair_braids',
  'female_slim_fair_longwaves',
  'female_slim_fair_shaved',
  'female_slim_fair_undercut',
  'male_slim_fair_braids',
  'male_slim_fair_undercut',
]);

export const AVAILABLE_WARDROBE = new Set([
  'tshirt_white',
  'hoodie_red',
  'jacket_black_leather',
]);

// ── Helpers ───────────────────────────────────────────────────────────────────

export function avatarKey(gender, body, skin, hair) {
  return `${gender}_${body}_${skin}_${hair}`;
}

export function avatarImagePath(gender, body, skin, hair) {
  return `assets/avatars/${avatarKey(gender, body, skin, hair)}.webp`;
}

export function avatarAvailable(gender, body, skin, hair) {
  return AVAILABLE_AVATARS.has(avatarKey(gender, body, skin, hair));
}

export function wardrobePath(id) {
  return `assets/wardrobe/${id}.webp`;
}

// ── 3D wardrobe starter items ─────────────────────────────────────────────────
export const WARDROBE_3D = [
  { id: 'tshirt_white',         name: 'White T-Shirt',       category: 'top',       imagePath: wardrobePath('tshirt_white') },
  { id: 'hoodie_red',           name: 'Red Hoodie',           category: 'top',       imagePath: wardrobePath('hoodie_red') },
  { id: 'jacket_black_leather', name: 'Black Leather Jacket', category: 'outerwear', imagePath: wardrobePath('jacket_black_leather') },
];
