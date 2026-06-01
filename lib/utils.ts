import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getAvatarUrl(userImage: string, size?: string) {
  if (!userImage) return undefined;

  let fileName = userImage;

  if (size) {
    fileName = fileName.replace('.webp', `_${size}.webp`);
  }

  return `${process.env.NEXT_PUBLIC_API_URL}/api/users/avatar/${fileName}`
}

export async function urlToBlob(url: string) {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    return blob;
  } catch (error) {
    console.error("Error converting URL to Blob:", error);
    return null;
  }
}

export const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';

export const rootDomain = process.env.NEXT_PUBLIC_ROOT_DOMAIN || 'localhost:3000';