// Dream Queen — global app state (no imports)

export const state = {
  screen: 'home',
  roomId: null,
  myCodename: null,
  myCodenameSlug: null,
  myAvatar: {
    bodyType: 1,
    skinTone: '#F5CBA7',
    hairStyle: 1,
    hairColor: '#3B2314',
    eyeShape: 1,
    mouthShape: 1,
    equipped: { top: null, bottom: null, shoes: null, outerwear: null, accessory: null }
  },
  myWardrobe: [],
  roomPlayers: {},
  galleryPosts: [],
  pendingPackId: null,
  ui: { selectedCategory: 'top', selectedItem: null, cameraMode: 'photo' }
};
