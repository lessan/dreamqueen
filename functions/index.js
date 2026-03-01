const { onCall } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const geminiKey = defineSecret('GEMINI_KEY');

// Detect if image is a photo of clothing or a hand-drawn sketch
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

// Cartoonize a clothing item into a cartoon sprite
exports.cartoonize = onCall(
  {
    cors: ['https://lessan.github.io'],
    secrets: [geminiKey],
    region: 'australia-southeast1',
    timeoutSeconds: 120
  },
  async (request) => {
    const { imageBase64, type } = request.data;
    if (!imageBase64) throw new Error('imageBase64 required');

    const key = geminiKey.value();
    const genAI = new GoogleGenerativeAI(key);

    // Step 1: Describe the clothing item using Gemini vision
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const descResult = await visionModel.generateContent([
      { inlineData: { mimeType: 'image/jpeg', data: imageBase64 } },
      type === 'drawing'
        ? 'This is a hand-drawn sketch of clothing. Describe the garment: type, colors, patterns. One sentence.'
        : 'Describe this clothing item: type, colors, patterns, style. One sentence.'
    ]);
    const description = descResult.response.text().trim();

    // Step 2: Generate cartoon sprite via Imagen 4 REST API
    const prompt = `Cute flat cartoon illustration of ${description}. Clean outlines, bright colors, white background, floating garment with no person wearing it, children's dress-up game style.`;

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
          parameters: { numberOfImages: 1, aspectRatio: '3:4' }
        })
      }
    );

    if (!imgResponse.ok) {
      const errText = await imgResponse.text();
      console.error('Imagen API error', imgResponse.status, errText);
      throw new Error(`Imagen API error ${imgResponse.status}: ${errText}`);
    }

    const imgData = await imgResponse.json();
    // Imagen 4 returns generatedImages[].image.imageBytes
    const cartoonBase64 = imgData.predictions?.[0]?.bytesBase64Encoded
      ?? imgData.generatedImages?.[0]?.image?.imageBytes;
    if (!cartoonBase64) {
      console.error('Imagen response structure:', JSON.stringify(imgData).slice(0, 500));
      throw new Error('No image returned from Imagen');
    }

    return { cartoonBase64 };
  }
);
