// File: src/utils/imageUtils.js

const getFullImageUrl = (imageName) => {
    // Define the default image once, centrally.
    const DEFAULT_IMAGE = "saare_1.jpeg";
    
    // 1. Fallback Validation
    if (!imageName) {
        return DEFAULT_IMAGE;
    }
    
    // 2. Absolute URL Passthrough
    if (imageName.startsWith('http')) {
        return imageName;
    }
    
    // 3. Dynamic URL Construction
    // Ensure IMAGEKIT_URL_ENDPOINT is defined in your backend .env file
    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT;
    return `${endpoint}/${imageName}`;
};

module.exports = { getFullImageUrl };