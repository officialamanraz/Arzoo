// File: frontend/src/getImageUrl.js

export const getImageUrl = (imagePath) => {
    // Agar image path nahi hai, toh empty string return karo
    if (!imagePath) return ''; 
    
    // Agar image pehle se hi full URL hai (jaise Cloudinary ya kisi aur website ka link), toh wahi return karo
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
        return imagePath;
    }
    
    // Agar image relative path hai (jaise '/uploads/image.jpg'), toh uske aage Backend ka URL laga do.
    // NOTE: Agar aapka backend kisi aur port par hai (e.g., 5000), toh 5000 kar dena.
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000'; 
    
    return `${backendUrl}${imagePath}`;
};