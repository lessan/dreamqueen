// Camera capture — stub

export async function startCamera(videoEl) {
  // TODO: getUserMedia with facingMode environment, attach to video
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'environment' }
  });
  videoEl.srcObject = stream;
  await videoEl.play();
}

export function captureFrame(videoEl) {
  const canvas = document.createElement('canvas');
  canvas.width = videoEl.videoWidth;
  canvas.height = videoEl.videoHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(videoEl, 0, 0);
  return canvas.toDataURL('image/png');
}

export function stopCamera(videoEl) {
  if (videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach((t) => t.stop());
    videoEl.srcObject = null;
  }
}
