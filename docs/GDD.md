# Dream Queen — Game Design Document

> Dress up, share, repeat.

## 1. App Overview

| Field | Detail |
|-------|--------|
| **Name** | Dream Queen |
| **Platform** | Mobile-first browser PWA |
| **Hosting** | lessan.github.io/dreamqueen |
| **Audience** | Tweens 10-13, initially friends & family (small scale) |
| **Genre** | Dress-up / social |
| **Monetisation** | None (free, no ads) |

Dream Queen is a multiplayer dress-up app where players join rooms, customise avatars, dress them from a personal wardrobe, and publish outfits to a public gallery. Wardrobes grow via a phone camera feature that uses AI to cartoonise real clothing or hand-drawn designs.

---

## 2. Core User Flow

```
Home Screen
  ├── Create Room → get shareable URL → share with friends
  ├── Join Room   → enter room code or tap link
  └── Browse Gallery
```

1. **Land on home screen** — choose Create Room, Join Room, or Browse Gallery.
2. **Create room** — generates a short room URL. Share it via messaging apps or QR.
3. **Join room** — player is auto-assigned a random codename (e.g. "Purple Potato").
4. **Up to 4 players per room.**
5. **Customise avatar** — pick skin tone, hair style/colour, body type, face.
6. **Dress up** — drag clothing items from personal wardrobe onto avatar.
7. **Live preview** — all players see each other's avatars updating in real time (identified by codenames).
8. **Publish** — when happy, tap Publish to send the outfit to the public gallery.
9. **Gallery** — anyone with the site URL can browse published outfits.

---

## 3. Codename System

Every player who joins a room is assigned a random codename. Codenames are **unique within a room** but can repeat across rooms.

**Format:** `[Colour] [Animal]`

### Colours (10)
Red, Orange, Yellow, Green, Blue, Purple, Pink, Teal, Gold, Silver

### Animals (10)
Cat, Dog, Fox, Bear, Rabbit, Panda, Tiger, Owl, Frog, Potato

This gives **100 possible combinations**, far exceeding the 4-player room cap.

### Assignment Rules
- On room join, pick a random combo not already taken in the room.
- Codename persists for the duration of the session.
- If a player disconnects and reconnects within the room's lifetime, they get a new codename.

---

## 4. Avatar System

Avatars are rendered as a **layered canvas** composited bottom-to-top:

| Layer | Options |
|-------|---------|
| 1. Body silhouette | 3 body types |
| 2. Skin tone fill | 6 swatches |
| 3. Hair | 10 styles x 8 colours = 80 combinations |
| 4. Face | 3 eye shapes x 3 mouth shapes = 9 combinations |
| 5. Clothing (bottom → top) | shoes → bottoms → tops → outerwear → accessories |

### Rendering
- Each layer is a separate canvas or offscreen image.
- Final composite drawn to a single `<canvas>` element.
- Sprite size: **64x64 px** per item/layer.
- `imageSmoothingEnabled = false` for crisp pixel art at any display scale.

### Avatar State Object
```js
{
  bodyType: 0,        // 0-2
  skinTone: 0,        // 0-5
  hairStyle: 0,       // 0-9
  hairColour: 0,      // 0-7
  eyeShape: 0,        // 0-2
  mouthShape: 0,      // 0-2
  clothing: {
    shoes: null,       // item id or null
    bottoms: null,
    tops: null,
    outerwear: null,
    accessories: null
  }
}
```

---

## 5. Wardrobe System

Each player has a **personal wardrobe** of clothing items stored in `localStorage`. No account or sign-in required.

### Item Sources

| Source | Description |
|--------|-------------|
| **Starter pack** | 10 basic items included by default for every new player |
| **Photo-to-cartoon** | Point phone camera at a real clothing item → Gemini AI cartoonises it → added to wardrobe |
| **Drawing mode** | Draw an outfit on paper, photograph it → Gemini detects it is a drawing → AI enhances/cartoonises → added to wardrobe |
| **QR pack download** | Scan a QR code → downloads a themed clothing pack → all items added to wardrobe |

### Clothing Item Data Model

```js
{
  id: "item_abc123",           // unique ID (uuid or nanoid)
  name: "Blue T-Shirt",       // display name
  category: "tops",           // tops | bottoms | shoes | outerwear | accessories
  imageDataURL: "data:...",   // cartoon sprite, 64x64 px, PNG base64
  source: "photo",            // starter | photo | drawing | pack
  packId: null,               // pack ID if source === "pack"
  createdAt: 1709300000000    // timestamp
}
```

### Storage
- `localStorage` key: `dq_wardrobe`
- Value: JSON array of item objects.
- Starter pack items seeded on first visit if wardrobe is empty.

---

## 6. QR Pack System

QR packs let a parent or organiser create themed clothing bundles that players can download by scanning a QR code.

### Pack Creation Flow
1. Parent opens pack creator page.
2. Names the pack and sets a theme (e.g. "Beach Party").
3. Uploads 5-20 clothing images.
4. System generates cartoon sprites for each via AI, stores in Firebase Storage.
5. Pack record saved in Firestore.
6. System generates a QR code linking to `lessan.github.io/dreamqueen?pack=PACK_ID`.
7. Parent prints or shares the QR code.

### Pack Download Flow
1. Player scans QR (or taps link).
2. App fetches pack JSON from Firestore.
3. Downloads each item's cartoon sprite.
4. All items added to player's localStorage wardrobe.
5. Confirmation shown: "Added 12 items from Beach Party pack!"

### Pack JSON Schema (Firestore)
```js
{
  id: "pack_xyz789",
  name: "Beach Party",
  theme: "summer",
  createdAt: 1709300000000,
  items: [
    {
      id: "item_p01",
      name: "Flip Flops",
      category: "shoes",
      imageURL: "https://storage.googleapis.com/..."  // Firebase Storage URL
    }
    // ... 5-20 items
  ]
}
```

---

## 7. Multiplayer Room Model

### Room Creation
- First player taps "Create Room".
- Server generates a **6-character alphanumeric room ID** (e.g. `A3F9K2`).
- Room URL: `lessan.github.io/dreamqueen?room=ROOM_ID`

### Room Data (Firebase Realtime DB)
```js
{
  roomId: "A3F9K2",
  createdAt: 1709300000000,
  players: {
    "purple-potato": {
      codename: "Purple Potato",
      avatarState: { /* avatar state object */ },
      lastSeen: 1709300500000
    }
    // up to 4 players
  }
}
```

### Rules
- Maximum **4 players** per room.
- If room is full, new joiners see a "Room Full" message.
- Room **expires after 24 hours of inactivity** (no player updates).
- Avatar state syncs in real time via Firebase Realtime DB listeners.
- Player considered disconnected if `lastSeen` is more than 60 seconds stale.

---

## 8. Public Gallery

### Publishing
1. Player taps "Publish" in the dressing room.
2. App takes a canvas screenshot of the avatar (transparent background, 256x256 px).
3. Screenshot uploaded to Firebase Storage.
4. Firestore record created:

```js
{
  id: "outfit_abc",
  codename: "Green Fox",
  imageURL: "https://storage.googleapis.com/...",
  publishedAt: 1709300000000,
  reported: false
}
```

### Browsing
- Gallery is a publicly accessible grid at `/gallery` (or home screen tab).
- Sorted by most recent first.
- Each card shows: avatar image, codename, date published.
- Infinite scroll or paginated (20 per page).

### Reporting
- Each outfit card has a small "Report" button.
- Tapping report writes to a Firestore `reports` collection:
  ```js
  { outfitId: "outfit_abc", reason: "inappropriate", reportedAt: 1709300000000 }
  ```
- **No automated moderation in v1.** Admin manually reviews via Firebase console.

---

## 9. AI Features

All AI processing happens server-side via Firebase Functions. API keys are **never exposed to the client**.

### 9.1 Photo-to-Cartoon

| Step | Detail |
|------|--------|
| 1 | User takes a photo of a real clothing item via `<input type="file" capture="environment">` |
| 2 | Photo sent to Firebase Function as base64 |
| 3 | Gemini vision describes the item (colour, type, key features) |
| 4 | Imagen 3 generates a 64x64 cartoon sprite based on the description |
| 5 | Cartoon sprite returned to client as base64 |
| 6 | Stored in localStorage wardrobe. Raw photo is **never stored**. |

### 9.2 Drawing Detection & Enhancement

| Step | Detail |
|------|--------|
| 1 | User photographs a hand-drawn clothing design |
| 2 | Photo sent to Firebase Function |
| 3 | Gemini vision classifies: `"drawing"` or `"real_photo"` |
| 4a | If **drawing**: enhance while preserving drawn lines; boost colours; cartoonise into 64x64 sprite |
| 4b | If **real photo**: standard photo-to-cartoon pipeline (section 9.1) |
| 5 | Result returned and stored. Raw photo **never stored**. |

### Privacy
- Raw photos are transmitted to the Firebase Function, processed, and immediately discarded.
- Only the generated cartoon output is persisted (client-side in localStorage or server-side in Storage for packs).

---

## 10. Screens / Views

### 10.1 Home Screen
- App title "Dream Queen" + tagline
- **Create Room** button
- **Join Room** button (text input for room code)
- **Browse Gallery** link
- Starter wardrobe auto-seeded on first visit

### 10.2 Room Lobby
- Shows room code and shareable URL/QR
- Lists connected players by codename
- "Start Dressing" button (or auto-start when 2+ players join)

### 10.3 Dressing Room (Main Screen)
- **Centre**: Player's avatar (large, interactive)
- **Bottom**: Wardrobe tray — horizontal scrollable list filtered by category tabs (tops, bottoms, shoes, outerwear, accessories)
- **Side panel**: Other players' avatars (small, live-updating, with codenames)
- **Top bar**: Room code, Publish button, Camera button (add to wardrobe)
- Tap a wardrobe item to equip; tap equipped item to unequip.

### 10.4 Avatar Editor
- Accessed before entering dressing room (or via edit button).
- Grid of options for: body type, skin tone, hair style, hair colour, eye shape, mouth shape.
- Live preview updates as options are tapped.

### 10.5 Camera Capture
- Triggered from dressing room's camera button.
- Uses `<input type="file" accept="image/*" capture="environment">` for mobile camera.
- Shows loading spinner while AI processes.
- Preview of generated cartoon item → confirm to add to wardrobe.

### 10.6 Gallery
- Grid of published outfit cards.
- Each card: avatar image, codename, date.
- Report button per card.
- Back button to home.

### 10.7 Pack Landing Page
- Arrived at via QR code URL (`?pack=PACK_ID`).
- Shows pack name, theme, item count.
- "Add to My Wardrobe" button.
- After download: redirects to home screen.

---

## 11. Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | Vanilla JS ES modules, HTML5 Canvas, CSS. No framework, no bundler. |
| **Backend** | Firebase: Realtime DB (rooms), Firestore (gallery, packs, reports), Storage (images), Functions (AI proxy) |
| **AI** | Gemini API + Imagen 3 via Firebase Functions (API keys server-side only) |
| **Hosting** | GitHub Pages (static frontend) + Firebase Functions (serverless backend) |
| **QR generation** | Client-side `qrcode.js` library |
| **PWA** | Service worker for offline shell + manifest.json for Add to Home Screen |

### Frontend File Structure (planned)
```
dreamqueen/
  index.html
  style.css
  manifest.json
  sw.js
  docs/
    GDD.md
  src/
    main.js          # entry point, router
    state.js         # shared app state
    avatar.js        # avatar rendering + editor
    wardrobe.js      # wardrobe management
    room.js          # multiplayer room logic
    gallery.js       # public gallery
    camera.js        # photo capture + AI flow
    pack.js          # QR pack download
    codename.js      # codename generation
    firebase.js      # firebase config + helpers
    renderer.js      # canvas rendering
    ui.js            # DOM UI helpers
  assets/
    sprites/         # base avatar layers, starter pack items
```

---

## 12. Data Storage Summary

| Data | Where | Persistence |
|------|-------|-------------|
| Personal wardrobe | `localStorage` (`dq_wardrobe`) | Permanent (per browser) |
| Avatar customisation | `localStorage` (`dq_avatar`) | Permanent (per browser) |
| Room state | Firebase Realtime DB | 24h TTL |
| Published outfits | Firestore + Storage | Permanent until admin deletes |
| Clothing packs | Firestore + Storage | Permanent |
| Reports | Firestore | Permanent |

---

## 13. Scope & Constraints

### In Scope (v1)
- Room creation and joining (up to 4 players)
- Avatar customisation (body, skin, hair, face)
- Wardrobe with starter pack
- Photo-to-cartoon via AI
- Drawing detection and enhancement
- QR pack creation and download
- Real-time multiplayer avatar preview
- Public gallery with publish and report
- PWA install support

### Out of Scope (v1)
- User accounts or authentication
- Chat or messaging between players
- Outfit trading or gifting
- Automated content moderation
- Animations or avatar poses
- Sound effects or music
- In-app purchases or currency

### Key Constraints
- **No frameworks** — vanilla JS, no React/Vue/Svelte, no bundler.
- **No user accounts** — everything is anonymous, localStorage-based.
- **Privacy-first** — raw photos never stored, only AI-generated cartoons.
- **Small scale** — designed for friends & family, not millions of users.
- **64x64 sprites** — all clothing items and avatar layers rendered at this size.
- **Mobile-first** — touch-optimised, responsive to small screens.
