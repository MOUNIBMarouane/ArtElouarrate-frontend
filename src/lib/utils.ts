import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Convert relative image URL to full URL
export function getImageUrl(relativeUrl: string | undefined | null): string {
  if (!relativeUrl) return "/placeholder.svg";
  
  // If it's already a full URL, return as is
  if (relativeUrl.startsWith('http')) return relativeUrl;
  
  // If it's a relative URL starting with /, prepend backend URL
  if (relativeUrl.startsWith('/')) {
    // Use environment variable or fallback to localhost for development
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    return `${backendUrl}${relativeUrl}`;
  }
  
  // If it's just a filename, prepend full uploads path
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  return `${backendUrl}/uploads/${relativeUrl}`;
}
