// Gallery — Firestore gallery publish, fetch, and report

import { firestore, storage } from './firebase.js';
import { collection, addDoc, getDocs, query, orderBy, limit, updateDoc, doc, increment }
  from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-firestore.js';
import { ref as storageRef, uploadString, getDownloadURL }
  from 'https://www.gstatic.com/firebasejs/11.0.0/firebase-storage.js';
import { getAvatarCanvas } from './avatar.js';
import { state } from './state.js';

export async function publishOutfit() {
  // 1. Get avatar canvas as PNG dataURL
  const canvas = getAvatarCanvas(state.myAvatar, 300, 400);
  const dataURL = canvas.toDataURL('image/png');
  const base64 = dataURL.split(',')[1];

  // 2. Generate unique post ID
  const postId = Date.now().toString(36) + Math.random().toString(36).substr(2);

  // 3. Upload to Storage
  const imageRef = storageRef(storage, `gallery/${postId}.png`);
  await uploadString(imageRef, base64, 'base64', { contentType: 'image/png' });
  const imageURL = await getDownloadURL(imageRef);

  // 4. Write to Firestore
  await addDoc(collection(firestore, 'gallery'), {
    postId,
    codename: state.myCodename || 'Anonymous',
    roomId: state.roomId || null,
    imageURL,
    createdAt: new Date(),
    reportCount: 0
  });

  return imageURL;
}

export async function fetchGallery(limitCount = 20) {
  const q = query(
    collection(firestore, 'gallery'),
    orderBy('createdAt', 'desc'),
    limit(limitCount)
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function reportPost(postId) {
  const docRef = doc(firestore, 'gallery', postId);
  await updateDoc(docRef, { reportCount: increment(1) });
}
