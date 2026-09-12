// File: src/utils/imageUtils.js

const getFullImageUrl = (imageName) => {
    const DEFAULT_IMAGE = "/saare_1.jpeg";

    if (!imageName || imageName === 'null' || imageName === 'undefined' || String(imageName).includes('undefined')) {
        return DEFAULT_IMAGE;
    }

    // 🚨 BUG FIX: Kisi bhi tarah ke data (number/object) ko pehle String (Text) mein convert karo
    const imgStr = String(imageName);

    // Ab crash nahi hoga!
    if (imgStr.startsWith('http://') || imgStr.startsWith('https://')) {
        return imgStr;
    }

    const endpoint = process.env.IMAGEKIT_URL_ENDPOINT; 
    
    if (!endpoint) {
        return `/${imgStr}`;
    }

    const cleanEndpoint = endpoint.endsWith('/') ? endpoint.slice(0, -1) : endpoint;
    const cleanImageName = imgStr.startsWith('/') ? imgStr.substring(1) : imgStr;

    if (!cleanImageName.includes('arzoo-saree/uploads/')) {
        return `${cleanEndpoint}/arzoo-saree/uploads/${cleanImageName}`;
    }
    
    return `${cleanEndpoint}/${cleanImageName}`;
};

module.exports = { getFullImageUrl };