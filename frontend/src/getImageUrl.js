export const getImageUrl = (imageName) => {
  if (!imageName) return "/saare_1.jpeg";
  if (imageName.startsWith('http')) return imageName;
//   return `${API_BASE_URL}/uploads/${encodeURIComponent(imageName)}`;
};