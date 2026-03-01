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
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const result = await model.generateContent([
      {
        inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
      },
      'Is this image a photograph of a real piece of clothing (or a real person wearing clothes), or is it a hand-drawn sketch/drawing of clothing? Reply with exactly one word: photo or drawing'
    ]);

    const text = result.response.text().trim().toLowerCase();
    const type = text.includes('drawing') ? 'drawing' : 'photo';
    return { type };
  }
);

// Cartoonize a clothing item image into a cartoon sprite
exports.cartoonize = onCall(
  {
    cors: ['https://lessan.github.io'],
    secrets: [geminiKey],
    region: 'australia-southeast1',
    timeoutSeconds: 60
  },
  async (request) => {
    const { imageBase64, type } = request.data;
    if (!imageBase64) throw new Error('imageBase64 required');

    const genAI = new GoogleGenerativeAI(geminiKey.value());

    // Step 1: Describe the clothing item
    const visionModel = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const descResult = await visionModel.generateContent([
      {
        inlineData: { mimeType: 'image/jpeg', data: imageBase64 }
      },
      type === 'drawing'
        ? 'This is a hand-drawn sketch of a clothing item. Describe it in detail: what type of garment is it, what colors, any patterns or decorations? Be specific and concise (2-3 sentences).'
        : 'Describe this clothing item in detail: what type of garment, what colors, any patterns, logos, or decorations? Be specific and concise (2-3 sentences).'
    ]);
    const description = descResult.response.text().trim();

    // Step 2: Generate cartoon sprite using Imagen
    const imageModel = genAI.getGenerativeModel({ model: 'imagen-3.0-generate-002' });
    const prompt = `A flat cartoon illustration of ${description}. Style: cute children's dress-up game clothing item, flat design, clean outlines, bright colors, white background, no person wearing it, just the garment floating, simple and charming, suitable for a tween girls' app.`;

    const imageResult = await imageModel.generateImages({
      prompt,
      number_of_images: 1,
      aspect_ratio: '3:4',
      safety_filter_level: 'block_low_and_above'
    });

    const cartoonBase64 = imageResult.images[0].imageBytes;
    return { cartoonBase64 };
  }
);
