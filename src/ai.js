// AI bridge — calls Firebase Functions for image detection and cartoonization

import { getFunctions, httpsCallable } from
  'https://www.gstatic.com/firebasejs/11.0.0/firebase-functions.js';
import { firebaseConfig } from './firebase-config.js';
import { initializeApp, getApps } from
  'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';

// Reuse the existing Firebase app
let _functions = null;
function getFunctionsInstance() {
  if (!_functions) {
    const apps = getApps();
    const app = apps.length ? apps[0] : initializeApp(firebaseConfig);
    _functions = getFunctions(app, 'australia-southeast1');
  }
  return _functions;
}

export async function detectImageType(imageBase64) {
  const fn = httpsCallable(getFunctionsInstance(), 'detectImageType');
  const result = await fn({ imageBase64 });
  return result.data.type; // 'photo' | 'drawing'
}

export async function cartoonizeImage(imageBase64, type) {
  const fn = httpsCallable(getFunctionsInstance(), 'cartoonize');
  const result = await fn({ imageBase64, type });
  return result.data.cartoonBase64; // base64 string
}
