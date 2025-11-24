/**
 * Constructs the full URL for an image stored on the backend server
 * @param imagePath - The image path returned from the API (e.g., "/uploads/news/image.jpg")
 * @returns Full URL to the image (e.g., "https://api.strmlns.app/uploads/news/image.jpg")
 */
export function getImageUrl(imagePath: string | undefined | null): string {
  if (!imagePath) return '';
  
  const serverBaseUrl = import.meta.env.VITE_API_BASE_URL.replace('/api', '');
  const cleanPath = imagePath.replace(/^\/+/, ''); // Remove leading slashes
  
  return `${serverBaseUrl}/${cleanPath}`;
}
