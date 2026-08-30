const ImageKit = require('@imagekit/nodejs');
require('dotenv').config(); // 🚨 YEH LINE MISSING THI! Iske bina env variables nahi aate.

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

// Test logs
console.log('👉 [IMAGEKIT] Keys mili kya?', process.env.IMAGEKIT_PUBLIC_KEY ? 'HAAN' : 'NAHI');
console.log('[IMAGEKIT] client initialized', process.env.IMAGEKIT_URL_ENDPOINT ? 'ok' : 'missing');

module.exports = imagekit;
