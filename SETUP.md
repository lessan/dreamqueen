# Dream Queen — Setup

## 1. Firebase Configuration

Fill in `src/firebase-config.js` with your Firebase project values:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Open your project (or create one named "dreamqueen")
3. Go to **Project Settings** > **Your apps** > **SDK setup and configuration**
4. Copy the config values into `src/firebase-config.js`

## 2. Install Cloud Functions Dependencies

```bash
cd functions
npm install
```

## 3. Firebase CLI Setup

```bash
firebase login
firebase use dreamqueen
```

## 4. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

## 5. GitHub Pages

The static frontend is served from the `main` branch root at:

**https://lessan.github.io/dreamqueen**

Push to `main` to deploy updates.
