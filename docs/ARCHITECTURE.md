# Dream Queen — Technical Architecture

## Overview

Dream Queen is a mobile-first browser dress-up social app. Players create avatars, customise outfits from a wardrobe, join multiplayer rooms to play together, and use AI to turn real photos or drawings into cartoon clothing items. The app is a PWA hosted on GitHub Pages with Firebase for backend services.

**Stack**: Vanilla JS (ES modules, no bundler, no framework), HTML5 Canvas, Firebase (Realtime Database, Firestore, Storage, Functions), PWA (service worker + manifest).

---

## Project Structure

```
dreamqueen/
├── index.html
├── style.css
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker (basic offline shell caching)
├── docs/
│   ├── GDD.md
│   └── ARCHITECTURE.md
├── src/
│   ├── main.js                # Entry point, app init, screen lifecycle
│   ├── state.js               # Global app state object (no imports)
│   ├── router.js              # URL param routing, screen transitions
│   ├── firebase.js            # Firebase SDK init, exports db/firestore/storage
│   ├── avatar.js              # Avatar canvas rendering, layer compositing
│   ├── wardrobe.js            # Wardrobe CRUD, localStorage persistence
│   ├── room.js                # Room creation, joining, Realtime DB sync
│   ├── camera.js              # getUserMedia, canvas capture, photo processing
│   ├── ai.js                  # Client-side AI calls (Firebase Functions bridge)
│   ├── gallery.js             # Firestore gallery reads/writes
│   ├── qr.js                  # QR code generation (via qrcode.js library)
│   ├── packs.js               # Pack download from Firestore, apply to wardrobe
│   ├── ui.js                  # UI helpers, DOM manipulation, screen transitions
│   └── screens/
│       ├── home.js            # Home screen
│       ├── lobby.js           # Room lobby (codename entry, player list)
│       ├── dressingroom.js    # Main dressing room (avatar + wardrobe + players)
│       ├── avatareditor.js    # Avatar body/face customisation
│       ├── camera.js          # Camera capture screen
│       ├── gallery.js         # Public gallery browsing
│       └── packlanding.js     # QR pack arrival / unlock screen
├── assets/
│   ├── sprites/               # Avatar part sprites (64x64 PNG)
│   │   ├── body/              # body_type1.png, body_type2.png, body_type3.png
│   │   ├── hair/              # hair_001.png ... hair_010.png
│   │   ├── clothing/          # Starter pack clothing sprites
│   │   └── ui/                # Buttons, icons
│   └── packs/
│       └── starter.json       # Built-in starter pack definition
└── functions/                 # Firebase Cloud Functions
    ├── package.json
    └── index.js               # cartoonize() and detectImageType() endpoints
```

---

## Module Responsibilities

### src/state.js
Global app state. Imports nothing — every other module imports from this.

```js
export const state = {
  screen: 'home',            // current screen name
  roomId: null,              // active room ID
  myCodename: null,          // display name (e.g. "Purple Potato")
  myCodenameSlug: null,      // URL-safe slug (e.g. "purple-potato")
  myAvatar: {
    bodyType: 1,             // 1-3
    skinTone: '#F5D0A9',     // hex colour
    hairStyle: 1,            // 1-10
    hairColor: '#3B2F2F',    // hex colour
    eyeShape: 1,
    mouthShape: 1,
    equipped: {              // item IDs or null
      top: null,
      bottom: null,
      shoes: null,
      outerwear: null,
      accessory: null
    }
  },
  myWardrobe: [],            // array of wardrobe item objects
  roomPlayers: {},           // { codenameSlug: { codename, avatarState, lastSeen } }
  galleryPosts: [],          // array of gallery post objects
  pendingPackId: null,       // pack ID from URL param, awaiting download
  ui: {
    selectedCategory: null,  // wardrobe filter category
    selectedItem: null,      // currently highlighted item
    cameraMode: null         // 'photo' | 'drawing' | null
  }
};
```

**Exported**: `state` object (mutable singleton).

### src/main.js
Entry point. Initialises the app on DOMContentLoaded.

- `initApp()` — load Firebase, load wardrobe from localStorage, parse URL params via router, render initial screen.
- Registers service worker.
- Sets up global event listeners.

**Exported**: `initApp()`.

### src/router.js
Hash/param-based routing. No history API — uses URL search params.

- `parseRoute()` — reads `window.location.search`, returns `{ room, pack, gallery }`.
- `navigateTo(screen, params)` — updates URL params and triggers screen transition.
- `onRouteChange(callback)` — listens for `popstate` events.

Routes:
| URL param | Screen |
|---|---|
| `?room=ROOM_ID` | lobby (then dressingroom) |
| `?pack=PACK_ID` | packlanding |
| `?gallery=1` | gallery |
| (none) | home |

**Exported**: `parseRoute()`, `navigateTo()`, `onRouteChange()`.

### src/firebase.js
Firebase SDK v9 modular initialisation. Single point of Firebase config.

- `initFirebase()` — calls `initializeApp()` with project config.
- Exports pre-initialised instances: `db` (Realtime Database), `firestore`, `storage`.

**Exported**: `db`, `firestore`, `storage`, `initFirebase()`.

### src/avatar.js
Canvas-based avatar rendering with layered compositing.

- `renderAvatar(canvas, avatarState, size)` — draws avatar onto a canvas element at given size. `size` is `'full'` (300x400) or `'thumb'` (150x200).
- `renderAvatarToDataURL(avatarState, size)` — returns base64 dataURL of rendered avatar.
- Layer ordering handled internally (see Avatar Layer System below).

**Exported**: `renderAvatar()`, `renderAvatarToDataURL()`.

### src/wardrobe.js
Local wardrobe management. All items persist in localStorage under key `dq_wardrobe`.

- `loadWardrobe()` — reads localStorage, populates `state.myWardrobe`.
- `saveWardrobe()` — writes `state.myWardrobe` to localStorage.
- `addItem(item)` — adds item to wardrobe and saves. Item shape: `{ id, name, category, imageURL }` where `imageURL` is either a remote URL (from packs) or a base64 dataURL (AI-generated).
- `removeItem(id)` — removes item by ID and saves.
- `equipItem(id)` — sets item in the appropriate equipped slot of `state.myAvatar`.
- `unequipCategory(category)` — clears the equipped slot for a category.
- `getItemsByCategory(category)` — filters wardrobe by category.

**Exported**: `loadWardrobe()`, `saveWardrobe()`, `addItem()`, `removeItem()`, `equipItem()`, `unequipCategory()`, `getItemsByCategory()`.

### src/room.js
Multiplayer room management via Firebase Realtime Database.

- `createRoom()` — generates a 6-character alphanumeric room ID, writes initial room entry to Realtime DB, returns roomId.
- `joinRoom(roomId, codename)` — writes player entry under `rooms/{roomId}/players/{slug}`, sets up `onDisconnect()` to remove entry, starts `lastSeen` heartbeat (30s interval).
- `leaveRoom()` — removes player entry, clears listeners.
- `onPlayersChange(callback)` — subscribes to `rooms/{roomId}/players` via `onValue()`, calls callback with updated player map.
- `syncAvatarState(avatarState)` — debounced write (300ms) of avatar state to player's DB entry.

**Exported**: `createRoom()`, `joinRoom()`, `leaveRoom()`, `onPlayersChange()`, `syncAvatarState()`.

### src/camera.js
Camera capture for AI clothing creation.

- `startCamera(videoElement)` — calls `getUserMedia({ video: { facingMode: 'environment' } })`, attaches stream to video element.
- `stopCamera()` — stops all media tracks.
- `captureFrame(videoElement)` — draws current video frame to an offscreen canvas, returns base64 PNG dataURL.

**Exported**: `startCamera()`, `stopCamera()`, `captureFrame()`.

### src/ai.js
Bridge to Firebase Functions for AI features.

- `detectImageType(imageBase64)` — calls `detectImageType` function, returns `'photo'` or `'drawing'`.
- `cartoonize(imageBase64, type)` — calls `cartoonize` function, returns `{ cartoonBase64 }`.
- Both functions call the Firebase Functions HTTPS endpoints.

**Exported**: `detectImageType()`, `cartoonize()`.

### src/gallery.js
Public gallery backed by Firestore.

- `postToGallery(codename, roomId, imageDataURL)` — uploads image to Firebase Storage (`gallery/{postId}.png`), writes Firestore doc with metadata.
- `loadGallery(limit)` — queries Firestore `gallery` collection ordered by `createdAt` desc, returns array of posts.
- `reportPost(postId)` — increments `reportCount` on gallery doc, creates entry in `reports` collection.

**Exported**: `postToGallery()`, `loadGallery()`, `reportPost()`.

### src/qr.js
QR code generation for sharing pack links.

- `generateQR(url, containerElement)` — renders QR code into a DOM element using qrcode.js library.

**Exported**: `generateQR()`.

### src/packs.js
Clothing pack download and application.

- `loadPack(packId)` — fetches pack doc from Firestore, downloads item images from Storage, returns pack object.
- `applyPack(pack)` — adds all pack items to wardrobe via `wardrobe.addItem()`.
- `isPackApplied(packId)` — checks localStorage flag `dq_pack_{packId}`.

**Exported**: `loadPack()`, `applyPack()`, `isPackApplied()`.

### src/ui.js
Shared UI utilities.

- `showScreen(screenName)` — hides all screen containers, shows the target one, updates `state.screen`.
- `showToast(message, durationMs)` — displays a temporary notification banner.
- `showModal(content, onConfirm, onCancel)` — shows a confirmation dialog.
- `setLoading(isLoading)` — shows/hides a loading spinner overlay.

**Exported**: `showScreen()`, `showToast()`, `showModal()`, `setLoading()`.

### src/screens/*.js
Each screen module exports `init(container)` and `destroy()`. The `init` function receives a DOM container, builds the screen's DOM, attaches event listeners, and starts any needed subscriptions. The `destroy` function tears down listeners and cleans up.

---

## Firebase Schema

### Realtime Database (Singapore region) — rooms only

Realtime Database is used exclusively for low-latency multiplayer room sync.

```
rooms/
  {roomId}/                      # 6-char alphanumeric, e.g. "A3K9Z2"
    createdAt: <timestamp>
    players/
      {codenameSlug}/            # e.g. "purple-potato"
        codename: "Purple Potato"
        avatarState: {
          bodyType: 1,
          skinTone: "#F5D0A9",
          hairStyle: 1,
          hairColor: "#3B2F2F",
          eyeShape: 1,
          mouthShape: 1,
          equipped: {
            top: "item_001",
            bottom: null,
            shoes: "item_003",
            outerwear: null,
            accessory: null
          }
        }
        lastSeen: <timestamp>
```

**Why Realtime DB for rooms**: Low-latency listeners (`onValue`) for real-time avatar sync. Cheaper for frequent small writes. `onDisconnect()` support for automatic cleanup.

### Firestore (Sydney region) — gallery + packs

```
gallery/
  {postId}/                      # auto-generated
    codename: string
    roomId: string
    imageURL: string             # Firebase Storage download URL
    createdAt: <timestamp>
    reportCount: number          # starts at 0

reports/
  {reportId}/                    # auto-generated
    postId: string
    reportedAt: <timestamp>

packs/
  {packId}/                      # auto-generated
    name: string
    theme: string
    createdAt: <timestamp>
    createdBy: string            # label only, no auth
    items: [
      { id: string, name: string, category: string, imageURL: string }
    ]
```

**Why Firestore for gallery/packs**: Better querying (orderBy, limit), offline caching, and document-oriented data suits gallery posts and pack definitions.

### Firebase Storage layout

```
gallery/{postId}.png             # published outfit screenshots
packs/{packId}/{itemId}.png      # clothing pack item images
```

**Important**: User-generated AI cartoon clothing items are stored ONLY in localStorage as base64 dataURLs. They are never uploaded to Firebase Storage.

---

## Avatar Layer System

### Canvas Dimensions
- **Full view** (dressing room): 300x400 px
- **Thumbnail** (lobby player list, gallery): 150x200 px

### Render Order (bottom to top)
1. **Body** — base body shape sprite (`body/body_type{n}.png`)
2. **Skin fill** — skin tone colour applied via `globalCompositeOperation: 'source-atop'` on the body shape (fills only non-transparent pixels)
3. **Hair** — hair sprite, tinted with hair colour using the same compositing technique
4. **Shoes** — equipped shoe sprite
5. **Bottoms** — equipped bottom sprite
6. **Tops** — equipped top sprite
7. **Outerwear** — equipped outerwear sprite
8. **Accessories** — equipped accessory sprite
9. **Face** — eyes + mouth composited onto body (eye shape + mouth shape sprites)

### Sprite Conventions
- All clothing sprites are 300x400 px with transparent backgrounds, aligned to body positions.
- Base part sprites (body, hair, eyes, mouth) are 64x64 px, scaled up when rendering.
- `imageSmoothingEnabled = false` on all canvas contexts for crisp pixel art scaling.

### Skin Tone Application
```js
// Draw body shape to temp canvas
tempCtx.drawImage(bodySprite, 0, 0);
// Fill with skin colour, clipped to body shape
tempCtx.globalCompositeOperation = 'source-atop';
tempCtx.fillStyle = skinToneHex;
tempCtx.fillRect(0, 0, width, height);
// Composite onto main canvas
mainCtx.drawImage(tempCanvas, 0, 0);
```

---

## Multiplayer Sync Model

### Join Flow
1. Player enters or generates a codename on the lobby screen.
2. `joinRoom(roomId, codename)` writes their entry to `rooms/{roomId}/players/{slug}`.
3. `onDisconnect().remove()` is set on the player's entry for automatic cleanup.
4. A `setInterval` heartbeat updates `lastSeen` every 30 seconds.

### Avatar Sync
- Any change to `state.myAvatar` triggers a debounced (300ms) write to `players/{slug}/avatarState`.
- All players subscribe to `rooms/{roomId}/players` via `onValue()`.
- On data change, `state.roomPlayers` is updated and all avatar canvases re-render.

### Presence
- A player is considered "online" if their `lastSeen` is less than 60 seconds ago.
- On disconnect, Firebase `onDisconnect()` removes the player entry immediately.
- Client-side: when iterating `roomPlayers`, filter out stale entries (lastSeen > 60s).

### Room Lifecycle
- Rooms are ephemeral. No explicit deletion — they become empty when all players disconnect.
- No room size limit enforced client-side (practical limit: ~10 concurrent players for performance).

---

## AI Integration (Firebase Functions)

### Function: `cartoonize`
- **Trigger**: HTTPS callable
- **Input**: `{ imageBase64: string, type: "photo" | "drawing" }`
- **Flow**:
  1. Call Gemini vision API to describe the clothing item in the image.
  2. Call Imagen 3 to generate a cartoon sprite (64x64, flat design, clean lines, white background, children's dress-up game style) based on the description.
  3. Return `{ cartoonBase64: string }`.
- Raw input image is never stored. The generated cartoon is returned to the client which stores it in localStorage.

### Function: `detectImageType`
- **Trigger**: HTTPS callable
- **Input**: `{ imageBase64: string }`
- **Flow**: Call Gemini vision — "Is this a photograph of real clothing, or a hand-drawn sketch? Reply: photo or drawing."
- **Return**: `{ type: "photo" | "drawing" }`

### Security
- Gemini API key stored in Firebase Functions environment config (`functions.config().gemini.key`).
- CORS restricted to `lessan.github.io` origin.
- Rate limit: max 10 AI requests per IP per hour (enforced via in-memory counter in Cloud Functions, reset on cold start — acceptable for MVP scope).

---

## QR Pack Flow

1. Parent/admin visits `lessan.github.io/dreamqueen/admin` (password-protected page, password stored in Firebase Functions config).
2. Enters pack name, theme, uploads clothing item images.
3. App uploads images to Firebase Storage under `packs/{packId}/`, writes pack doc to Firestore.
4. Client generates QR code encoding URL: `lessan.github.io/dreamqueen?pack={packId}`.
5. When a player scans the QR code:
   - Router detects `?pack=PACK_ID` param.
   - `packlanding` screen shows pack preview.
   - Player taps "Add to Wardrobe" — `packs.loadPack()` downloads items, `packs.applyPack()` adds them to localStorage wardrobe.

---

## Routing

URL-param based routing (no hash fragments, no History API pushState).

```
lessan.github.io/dreamqueen                    → home screen
lessan.github.io/dreamqueen?room=A3K9Z2        → lobby → dressingroom
lessan.github.io/dreamqueen?pack=abc123         → packlanding
lessan.github.io/dreamqueen?gallery=1           → gallery
```

- `router.parseRoute()` is called on app init and on `popstate` events.
- Internal navigation uses `router.navigateTo()` which updates `window.location.search` and triggers screen swap.
- Multiple params can coexist (e.g. `?room=X&gallery=1`) but are processed in priority order: pack > room > gallery > home.

---

## Data Flow Diagrams

### Clothing Creation (AI)
```
Camera → captureFrame() → base64 image
  → ai.detectImageType() → "photo" | "drawing"
  → ai.cartoonize(image, type) → cartoonBase64
  → wardrobe.addItem({ ..., imageURL: cartoonBase64 })
  → localStorage (dq_wardrobe)
```

### Avatar Change → Multiplayer Sync
```
Player equips item → state.myAvatar.equipped updated
  → avatar.renderAvatar() re-renders local canvas
  → room.syncAvatarState() debounced 300ms → Realtime DB write
  → Other players' onValue() fires → state.roomPlayers updated
  → All remote avatar canvases re-render
```

### Gallery Post
```
Player taps "Share" → avatar.renderAvatarToDataURL()
  → gallery.postToGallery() → upload PNG to Storage
  → write Firestore doc with imageURL
  → gallery screen shows new post on next loadGallery()
```

---

## PWA Configuration

### manifest.json
- `display: "standalone"` — fullscreen app feel.
- `orientation: "portrait"` — mobile-first, portrait only.
- Icons at 192px and 512px.
- `start_url: "/dreamqueen/"`.
- `theme_color` and `background_color` set to match app palette.

### sw.js (Service Worker)
- **Strategy**: Cache-first for static assets (HTML, CSS, JS, sprites), network-first for Firebase calls.
- On install: pre-cache the app shell (index.html, style.css, all src/*.js, starter pack sprites).
- On fetch: serve from cache if available, fall back to network. Firebase API calls always go to network.
- Minimal scope — no background sync, no push notifications for MVP.

---

## Constraints and Key Decisions

| Decision | Rationale |
|---|---|
| No bundler | Simplicity. Native ES modules work in all modern browsers. Avoids build step complexity. |
| No framework | Small app scope. Vanilla JS with manual DOM management keeps bundle size minimal and avoids framework learning curve. |
| Firebase SDK v9 modular | Tree-shakeable imports keep client bundle small. |
| Realtime DB for rooms, Firestore for gallery/packs | RTDB has lower latency for frequent small writes (avatar sync). Firestore is better for queryable, document-oriented data (gallery, packs). |
| No user accounts | Target audience is young children. No email/password flow. Identity is ephemeral codename per room session. |
| Wardrobe in localStorage only | Privacy-first: children's custom clothing items never leave the device. Avoids needing user accounts for cloud storage. |
| AI-generated items as base64 in localStorage | No server-side storage of user-generated content. Items are device-local. Trade-off: wardrobe is lost if browser storage is cleared. |
| `imageSmoothingEnabled = false` | Crisp pixel-art aesthetic when scaling sprites. |
| 300ms debounce on avatar sync | Prevents flooding Realtime DB during rapid wardrobe changes while keeping sync responsive. |
| Codename as identity | Fun, anonymous, child-friendly. Generated as adjective + noun (e.g. "Purple Potato"). Slug version used as DB key. |
| Firebase regions split | Realtime DB in Singapore (lowest latency for real-time sync in target region). Firestore in Sydney (closest multi-region for document storage). |
| Rate limit AI calls (10/hr/IP) | Prevents abuse of Gemini API. Simple in-memory counter acceptable for MVP scale. |
