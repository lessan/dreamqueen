const { onCall } = require('firebase-functions/v2/https');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// cartoonize: takes imageBase64 + type, returns cartoonBase64
exports.cartoonize = onCall({ cors: ['https://lessan.github.io'] }, async (request) => {
  // TODO: implement in Phase 6
  return { cartoonBase64: null };
});

// detectImageType: takes imageBase64, returns 'photo' | 'drawing'
exports.detectImageType = onCall({ cors: ['https://lessan.github.io'] }, async (request) => {
  // TODO: implement in Phase 6
  return { type: 'photo' };
});
