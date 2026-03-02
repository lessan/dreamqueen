const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Jimp = require('jimp');

const geminiKey = defineSecret('GEMINI_KEY');

// ── Background Removal ────────────────────────────────────────────────────────
// Corner BFS flood-fill — removes connected near-white pixels seeded from all
// four corners. Equivalent to the PIL flood-fill in generate_wardrobe.py.
async function removeWhiteBackground(base64, threshold = 240) {
  const buffer = Buffer.from(base64, 'base64');
  const img = await Jimp.read(buffer);
  const { width, height } = img.bitmap;

  const visited = new Uint8Array(width * height);
  // Store x,y pairs flat in the array for O(1) dequeue
  const queue = [];
  let head = 0;

  const seed = (x, y) => {
    const idx = y * width + x;
    if (!visited[idx]) { visited[idx] = 1; queue.push(x, y); }
  };

  seed(0, 0);           seed(width - 1, 0);
  seed(0, height - 1);  seed(width - 1, height - 1);

  while (head < queue.length) {
    const x = queue[head++];
    const y = queue[head++];
    const color = img.getPixelColor(x, y);
    const r = (color >>> 24) & 0xFF;
    const g = (color >>> 16) & 0xFF;
    const b = (color >>>  8) & 0xFF;

    if (r >= threshold && g >= threshold && b >= threshold) {
      img.setPixelColor(0x00000000, x, y);  // transparent
      if (x + 1 < width)  seed(x + 1, y);
      if (x - 1 >= 0)     seed(x - 1, y);
      if (y + 1 < height) seed(x, y + 1);
      if (y - 1 >= 0)     seed(x, y - 1);
    }
  }

  const buf = await img.getBufferAsync('image/png');
  return buf.toString('base64');
}

// ── Detect image type ─────────────────────────────────────────────────────────
exports.detectImageType = onCall(
  {
    cors: ['https://lessan.github.io'],
    secrets: [geminiKey],
    region: 'australia-southeast1'
  },
  async (request) => {
    const { imageBase64 } = request.data;
    if (!imageBase64) throw new Error('imageBase64 required');

    const genAI = new GoogleGenerativeAI(geminiKey.value());
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const result = await model.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
      'Is this a photograph of real clothing, or a hand-drawn sketch of clothing? Reply with exactly one word: photo or drawing'
    ]);

    const text = result.response.text().trim().toLowerCase();
    return { type: text.includes('drawing') ? 'drawing' : 'photo' };
  }
);

// ── Cartoonize ────────────────────────────────────────────────────────────────
exports.cartoonize = onCall(
  {
    cors: ['https://lessan.github.io'],
    secrets: [geminiKey],
    region: 'australia-southeast1',
    timeoutSeconds: 120,
    memory: '512MiB'
  },
  async (request) => {
    const { imageBase64, type } = request.data;
    if (!imageBase64) throw new Error('imageBase64 required');

    const key = geminiKey.value();
    const genAI = new GoogleGenerativeAI(key);
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // Step 1: Extract the structural essence of the garment.
    // For photos: extract material, color, and key design features.
    // For sketches: treat line-work as seams/structure, shading as material density.
    // Either way the output is a design brief, not a literal description.
    const descPrompt = type === 'drawing'
      ? 'This is a hand-drawn sketch of a clothing item. Analyse the structural intent: ' +
        'identify the garment type, inferred colors from any shading, fabric weight suggested by line density, ' +
        'and key design features (collar style, sleeve type, closures, length). ' +
        'Describe in one sentence as a design brief, not a literal drawing description.'
      : 'Analyse this clothing item and extract its material essence: ' +
        'garment type, exact colors, fabric/material (e.g. denim, leather, cotton jersey, chiffon), ' +
        'and key design features (collar, closures, fit, length). ' +
        'One sentence describing the essential garment, not the photo or the person wearing it.';

    const descResult = await visionModel.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
      descPrompt
    ]);
    const description = descResult.response.text().trim();
    console.log('Garment description:', description);

    // Step 2: Generate a standardised wardrobe asset using the description.
    // Style must match the Modern Editorial 3D avatar set.
    const prompt =
      `[CLOTHING ASSET] ${description}, Neutral anatomical standing position, ` +
      `perfectly symmetrical, front-on view, no tilt, no rotation. ` +
      `[ISOLATION] invisible ghost mannequin technique: only the garment itself floating upright, ` +
      `no body parts, no mannequin, no hands, no head. ` +
      `[MATERIAL] translate the source material into a stylized 3D version: ` +
      `polished clay/satin textures for soft fabrics, structured matte surfaces for stiff materials, ` +
      `diffused highlights, no harsh specular reflections. ` +
      `[BACKGROUND] pure white background #FFFFFF, fully isolated garment, no floor, no shadows on background. ` +
      `[STYLE] Modern Editorial 3D style, high-fidelity 3D render, front-facing orthographic view, ` +
      `no perspective distortion, three-point studio lighting with soft diffused highlights, ` +
      `Sims 4 and Fortnite visual quality. ` +
      `[TECHNICAL] 1:1 square canvas, garment centered and fills 75% of frame, ` +
      `single item only, no accessories, no text, no labels, no watermarks.`;

    const imgResponse = await fetch(
      'https://generativelanguage.googleapis.com/v1beta/models/imagen-4.0-fast-generate-001:predict',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key
        },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { numberOfImages: 1, aspectRatio: '1:1' }
        })
      }
    );

    if (!imgResponse.ok) {
      const errText = await imgResponse.text();
      console.error('Imagen API error', imgResponse.status, errText);
      throw new Error(`Imagen API error ${imgResponse.status}: ${errText}`);
    }

    const imgData = await imgResponse.json();
    const rawBase64 = imgData.predictions?.[0]?.bytesBase64Encoded
      ?? imgData.generatedImages?.[0]?.image?.imageBytes;
    if (!rawBase64) {
      console.error('Imagen response structure:', JSON.stringify(imgData).slice(0, 500));
      throw new Error('No image returned from Imagen');
    }

    // Step 3: Remove white background → return transparent PNG
    let cartoonBase64;
    try {
      cartoonBase64 = await removeWhiteBackground(rawBase64);
    } catch (e) {
      console.error('Background removal failed, returning raw image:', e.message);
      cartoonBase64 = rawBase64;
    }

    return { cartoonBase64 };
  }
);
