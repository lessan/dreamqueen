import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-app.js';
import { getDatabase } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-database.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);
