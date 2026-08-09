export const getImageUrl = (imageName) => {
  if (!imageName) return "/saare_1.jpeg";
  if (imageName.startsWith('http')) return imageName;
  return `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}/${imageName}`;
};