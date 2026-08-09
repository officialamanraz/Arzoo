const ImageKit = require('@imagekit/nodejs');

const imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
});

console.log('[IMAGEKIT] client initialized', process.env.IMAGEKIT_URL_ENDPOINT ? 'ok' : 'missing');

module.exports = imagekit;