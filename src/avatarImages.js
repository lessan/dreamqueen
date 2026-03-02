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
  // female · athletic
  'female_athletic_deep_braids',
  'female_athletic_deep_longwaves',
  'female_athletic_deep_shaved',
  'female_athletic_deep_undercut',
  'female_athletic_fair_braids',
  'female_athletic_fair_longwaves',
  'female_athletic_fair_shaved',
  'female_athletic_fair_undercut',
  'female_athletic_olive_braids',
  'female_athletic_olive_longwaves',
  'female_athletic_olive_shaved',
  'female_athletic_olive_undercut',
  'female_athletic_warmbrown_braids',
  'female_athletic_warmbrown_longwaves',
  'female_athletic_warmbrown_shaved',
  'female_athletic_warmbrown_undercut',
  // female · plus
  'female_plus_deep_braids',
  'female_plus_deep_longwaves',
  'female_plus_deep_shaved',
  'female_plus_deep_undercut',
  'female_plus_fair_braids',
  'female_plus_fair_longwaves',
  'female_plus_fair_shaved',
  'female_plus_fair_undercut',
  'female_plus_olive_braids',
  'female_plus_olive_longwaves',
  'female_plus_olive_shaved',
  'female_plus_olive_undercut',
  'female_plus_warmbrown_braids',
  'female_plus_warmbrown_longwaves',
  'female_plus_warmbrown_undercut',
  // female · slim
  'female_slim_deep_braids',
  'female_slim_deep_longwaves',
  'female_slim_deep_shaved',
  'female_slim_deep_undercut',
  'female_slim_fair_braids',
  'female_slim_fair_longwaves',
  'female_slim_fair_shaved',
  'female_slim_fair_undercut',
  'female_slim_olive_braids',
  'female_slim_olive_longwaves',
  'female_slim_olive_shaved',
  'female_slim_olive_undercut',
  'female_slim_warmbrown_braids',
  'female_slim_warmbrown_longwaves',
  'female_slim_warmbrown_shaved',
  'female_slim_warmbrown_undercut',
  // male · slim
  'male_slim_fair_braids',
  'male_slim_fair_longwaves',
  'male_slim_fair_shaved',
  'male_slim_fair_undercut',
]);

export const AVAILABLE_WARDROBE = new Set([
  'tshirt_white',
  'hoodie_red',
  'top_pink_crop',
  'jacket_black_leather',
  'jacket_olive_bomber',
  'coat_camel_trench',
  'chinos_navy',
  'jeans_distressed',
  'sweatpants_grey',
  'skirt_pink_pleated',
  'dress_floral_sundress',
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
  // Tops
  { id: 'tshirt_white',         name: 'White T-Shirt',        category: 'top',       imagePath: wardrobePath('tshirt_white') },
  { id: 'hoodie_red',           name: 'Red Hoodie',            category: 'top',       imagePath: wardrobePath('hoodie_red') },
  { id: 'top_pink_crop',        name: 'Pink Crop Top',         category: 'top',       imagePath: wardrobePath('top_pink_crop') },
  // Outerwear
  { id: 'jacket_black_leather', name: 'Black Leather Jacket',  category: 'outerwear', imagePath: wardrobePath('jacket_black_leather') },
  { id: 'jacket_olive_bomber',  name: 'Olive Bomber Jacket',   category: 'outerwear', imagePath: wardrobePath('jacket_olive_bomber') },
  { id: 'coat_camel_trench',    name: 'Camel Trench Coat',     category: 'outerwear', imagePath: wardrobePath('coat_camel_trench') },
  // Bottoms
  { id: 'chinos_navy',          name: 'Navy Chinos',           category: 'bottom',    imagePath: wardrobePath('chinos_navy') },
  { id: 'jeans_distressed',     name: 'Distressed Jeans',      category: 'bottom',    imagePath: wardrobePath('jeans_distressed') },
  { id: 'sweatpants_grey',      name: 'Grey Sweatpants',       category: 'bottom',    imagePath: wardrobePath('sweatpants_grey') },
  { id: 'skirt_pink_pleated',   name: 'Pink Pleated Skirt',    category: 'bottom',    imagePath: wardrobePath('skirt_pink_pleated') },
  // Dresses
  { id: 'dress_floral_sundress',name: 'Floral Sundress',       category: 'top',       imagePath: wardrobePath('dress_floral_sundress') },
];
