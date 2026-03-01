// Camera capture screen — capture clothing photos, AI cartoonize, add to wardrobe

import { state } from '../state.js';
import { navigateTo } from '../router.js';
import { startCamera, captureFrame, stopCamera } from '../camera.js';
import { detectImageType, cartoonizeImage } from '../ai.js';
import { addItem } from '../wardrobe.js';
import { showToast } from '../ui.js';

const CATEGORIES = [
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'shoes', label: 'Shoes' },
  { value: 'outerwear', label: 'Outerwear' },
  { value: 'accessory', label: 'Accessory' },
];

let _videoEl = null;
let _destroyed = false;

function generateItemId() {
  return 'item_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

function showCaptureView(container) {
  _destroyed = false;

  container.innerHTML = `
    <div class="screen" data-screen="camera" style="display:flex;flex-direction:column;height:100%;overflow:hidden;">
      <!-- Header -->
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;border-bottom:1px solid var(--color-surface);flex-shrink:0;">
        <button id="cam-back" style="background:none;border:none;color:var(--color-text);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592; Back</button>
        <span style="flex:1;text-align:center;font-size:18px;font-weight:700;color:var(--color-primary);">Add Clothes</span>
        <span style="width:60px;"></span>
      </div>

      <!-- Viewfinder -->
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:16px;padding:16px;">
        <div id="cam-viewport" style="width:100%;max-width:320px;aspect-ratio:4/3;background:#000;border-radius:12px;overflow:hidden;position:relative;">
          <video id="cam-video" autoplay playsinline muted style="width:100%;height:100%;object-fit:cover;"></video>
          <div id="cam-no-camera" style="display:none;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--color-secondary);font-size:14px;text-align:center;padding:16px;">
            Camera not available
          </div>
        </div>
        <p style="color:var(--color-secondary);font-size:14px;text-align:center;">Point at a clothing item and capture!</p>
      </div>

      <!-- Controls -->
      <div style="padding:16px 24px 24px;display:flex;flex-direction:column;align-items:center;gap:12px;flex-shrink:0;">
        <button class="btn btn--primary" id="cam-capture" style="width:64px;height:64px;border-radius:50%;font-size:24px;padding:0;background:#e74c3c;">&#9679;</button>
        <div style="display:flex;align-items:center;gap:8px;color:var(--color-secondary);font-size:13px;">
          <span style="flex:1;height:1px;background:var(--color-secondary);opacity:0.3;"></span>
          <span>or</span>
          <span style="flex:1;height:1px;background:var(--color-secondary);opacity:0.3;"></span>
        </div>
        <label class="btn btn--secondary" style="cursor:pointer;font-size:14px;padding:10px 20px;">
          Use Photo
          <input type="file" accept="image/*" capture="environment" id="cam-file" style="display:none;">
        </label>
      </div>
    </div>
  `;

  _videoEl = document.getElementById('cam-video');

  // Start camera
  startCamera(_videoEl).then(ok => {
    if (!ok && !_destroyed) {
      const noCamera = document.getElementById('cam-no-camera');
      if (noCamera) noCamera.style.display = 'flex';
    }
  });

  // Back button
  document.getElementById('cam-back').addEventListener('click', () => {
    cleanup();
    navigateTo('dressingroom');
  });

  // Capture button
  document.getElementById('cam-capture').addEventListener('click', () => {
    if (!_videoEl) return;
    const base64 = captureFrame(_videoEl);
    stopCamera();
    showProcessingView(container, base64);
  });

  // File input fallback
  document.getElementById('cam-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result.split(',')[1];
      stopCamera();
      showProcessingView(container, base64);
    };
    reader.readAsDataURL(file);
  });
}

function showProcessingView(container, imageBase64) {
  container.innerHTML = `
    <div class="screen" data-screen="camera" style="display:flex;flex-direction:column;height:100%;overflow-y:auto;">
      <!-- Header -->
      <div style="display:flex;align-items:center;padding:12px 16px;gap:12px;border-bottom:1px solid var(--color-surface);flex-shrink:0;">
        <button id="cam-retake" style="background:none;border:none;color:var(--color-text);font-size:20px;cursor:pointer;padding:4px 8px;">&#8592; Retake</button>
        <span id="cam-title" style="flex:1;text-align:center;font-size:18px;font-weight:700;color:var(--color-primary);">Processing</span>
        <span style="width:60px;"></span>
      </div>

      <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:16px;padding:20px;">
        <!-- Captured image preview -->
        <div style="width:100%;max-width:200px;">
          <img id="cam-preview-img" src="data:image/jpeg;base64,${imageBase64}" style="width:100%;border-radius:10px;object-fit:contain;" alt="Captured">
        </div>

        <!-- Status -->
        <div id="cam-status" style="color:var(--color-accent);font-size:15px;text-align:center;">Creating your cartoon item...</div>

        <!-- Cartoon result (hidden initially) -->
        <div id="cam-result" style="display:none;width:100%;max-width:200px;">
          <img id="cam-cartoon-img" style="width:100%;border-radius:10px;object-fit:contain;" alt="Cartoon">
        </div>

        <!-- Form (hidden initially) -->
        <div id="cam-form" style="display:none;width:100%;max-width:300px;display:flex;flex-direction:column;gap:12px;">
          <div>
            <label style="font-size:13px;color:var(--color-secondary);display:block;margin-bottom:4px;">Name this item:</label>
            <input type="text" id="cam-item-name" placeholder="e.g. Blue T-Shirt" maxlength="30"
              style="width:100%;padding:10px 12px;border-radius:10px;border:2px solid var(--color-secondary);
                     background:var(--color-surface);color:var(--color-text);font-size:15px;">
          </div>
          <div>
            <label style="font-size:13px;color:var(--color-secondary);display:block;margin-bottom:4px;">Category:</label>
            <select id="cam-item-category"
              style="width:100%;padding:10px 12px;border-radius:10px;border:2px solid var(--color-secondary);
                     background:var(--color-surface);color:var(--color-text);font-size:15px;appearance:auto;">
              ${CATEGORIES.map(c => `<option value="${c.value}">${c.label}</option>`).join('')}
            </select>
          </div>
          <button class="btn btn--primary" id="cam-add" style="width:100%;font-size:16px;padding:14px;">Add to Wardrobe</button>
        </div>
      </div>
    </div>
  `;

  // Retake button
  document.getElementById('cam-retake').addEventListener('click', () => {
    showCaptureView(container);
  });

  // Run AI pipeline
  runAIPipeline(container, imageBase64);
}

async function runAIPipeline(container, imageBase64) {
  const statusEl = document.getElementById('cam-status');
  const resultEl = document.getElementById('cam-result');
  const formEl = document.getElementById('cam-form');
  const titleEl = document.getElementById('cam-title');

  try {
    // Step 1: Detect image type
    if (statusEl) statusEl.textContent = 'Analyzing image...';
    const type = await detectImageType(imageBase64);

    // Step 2: Cartoonize
    if (statusEl) statusEl.textContent = 'Creating your cartoon item...';
    const cartoonBase64 = await cartoonizeImage(imageBase64, type);

    if (_destroyed) return;

    if (!cartoonBase64) {
      if (statusEl) statusEl.textContent = 'Hmm, try again with better lighting!';
      return;
    }

    // Show result
    const cartoonImg = document.getElementById('cam-cartoon-img');
    if (cartoonImg) {
      cartoonImg.src = `data:image/png;base64,${cartoonBase64}`;
    }
    if (resultEl) resultEl.style.display = 'block';
    if (formEl) formEl.style.display = 'flex';
    if (statusEl) statusEl.textContent = 'Looking good!';
    if (titleEl) titleEl.textContent = 'Result';

    // Store the cartoon data for the add button
    const addBtn = document.getElementById('cam-add');
    if (addBtn) {
      addBtn.addEventListener('click', () => {
        const name = document.getElementById('cam-item-name').value.trim() || 'New Item';
        const category = document.getElementById('cam-item-category').value;

        addItem({
          id: generateItemId(),
          name,
          category,
          imageDataURL: `data:image/png;base64,${cartoonBase64}`,
          source: type,
          packId: null,
          createdAt: Date.now()
        });

        showToast('Added to wardrobe!');
        navigateTo('dressingroom');
      });
    }
  } catch (err) {
    console.error('AI pipeline error:', err);
    if (statusEl) statusEl.textContent = 'Hmm, try again with better lighting!';
  }
}

function cleanup() {
  _destroyed = true;
  stopCamera();
  _videoEl = null;
}

export function init(container) {
  showCaptureView(container);
}

export function destroy() {
  cleanup();
}
