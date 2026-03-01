// Room management — Firebase Realtime DB multiplayer rooms

import { db } from './firebase.js';
import { ref, set, get, update, remove, onValue, onDisconnect, serverTimestamp } from
  'https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js';
import { state } from './state.js';
import { saveMyAvatar } from './screens/avatareditor.js';

const COLOURS = ['Red','Orange','Yellow','Green','Blue','Purple','Pink','Teal','Gold','Silver'];
const ANIMALS = ['Cat','Dog','Fox','Bear','Rabbit','Panda','Tiger','Owl','Frog','Potato'];

function randomCodename() {
  const c = COLOURS[Math.floor(Math.random() * COLOURS.length)];
  const a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  return `${c} ${a}`;
}

function codenameToSlug(codename) {
  return codename.toLowerCase().replace(' ', '-');
}

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createRoom() {
  const roomId = generateRoomId();
  const roomRef = ref(db, `rooms/${roomId}`);
  await set(roomRef, { createdAt: serverTimestamp() });
  return roomId;
}

export async function joinRoom(roomId) {
  const playersRef = ref(db, `rooms/${roomId}/players`);
  const snapshot = await get(playersRef);
  const existing = snapshot.val() || {};
  const existingSlugs = Object.keys(existing);

  let codename, slug;
  let attempts = 0;
  do {
    codename = randomCodename();
    slug = codenameToSlug(codename);
    attempts++;
  } while (existingSlugs.includes(slug) && attempts < 100);

  const playerRef = ref(db, `rooms/${roomId}/players/${slug}`);

  // Set up disconnect cleanup
  onDisconnect(playerRef).remove();

  // Write initial player state
  await set(playerRef, {
    codename,
    avatarState: state.myAvatar,
    lastSeen: serverTimestamp()
  });

  // Start heartbeat
  const heartbeatInterval = setInterval(() => {
    update(playerRef, { lastSeen: serverTimestamp() });
  }, 30000);

  // Listen for player changes
  onValue(ref(db, `rooms/${roomId}/players`), (snapshot) => {
    const players = snapshot.val() || {};
    const others = {};
    Object.entries(players).forEach(([s, p]) => {
      if (s !== slug) others[s] = p;
    });
    state.roomPlayers = others;
    if (typeof window.__onRoomPlayersUpdate === 'function') {
      window.__onRoomPlayersUpdate();
    }
  });

  // Store for cleanup
  state._roomCleanup = () => {
    clearInterval(heartbeatInterval);
    remove(playerRef);
  };

  return { codename, codenameSlug: slug };
}

// Debounced avatar state sync
let _syncTimeout = null;
export function updateAvatarState(avatarState) {
  if (!state.roomId || !state.myCodenameSlug) return;
  clearTimeout(_syncTimeout);
  _syncTimeout = setTimeout(() => {
    const playerRef = ref(db, `rooms/${state.roomId}/players/${state.myCodenameSlug}`);
    update(playerRef, { avatarState, lastSeen: serverTimestamp() });
  }, 300);
}

export function leaveRoom() {
  if (state._roomCleanup) {
    state._roomCleanup();
    state._roomCleanup = null;
  }
  state.roomId = null;
  state.myCodename = null;
  state.myCodenameSlug = null;
  state.roomPlayers = {};
}
