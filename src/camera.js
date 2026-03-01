// Camera capture — getUserMedia + frame capture

let _stream = null;

export async function startCamera(videoEl) {
  try {
    _stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    });
    videoEl.srcObject = _stream;
    await videoEl.play();
    return true;
  } catch (err) {
    console.error('Camera error:', err);
    return false;
  }
}

export function captureFrame(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth || 640;
  canvas.height = videoEl.videoHeight || 480;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  // Return base64 without the data:image/jpeg;base64, prefix
  return canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
}

export function stopCamera() {
  if (_stream) {
    _stream.getTracks().forEach(t => t.stop());
    _stream = null;
  }
}
