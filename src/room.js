// Room management — stub (Firebase Realtime DB integration in Phase 4)

export function createRoom() {
  // TODO: generate 6-char room ID, write to Realtime DB
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

export function joinRoom(roomId, avatarState) {
  // TODO: write player entry to rooms/{roomId}/players/{slug}
  return 'Purple Potato';
}

export function updateAvatarState(avatarState) {
  // TODO: debounced write to player's DB entry
}

export function leaveRoom() {
  // TODO: remove player entry, clear listeners
}
