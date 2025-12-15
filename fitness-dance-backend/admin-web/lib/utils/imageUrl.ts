// lib/utils/imageUrl.ts
// Utility functions for handling image URLs

/**
 * Get the API base URL
 */
function getApiBaseUrl(): string {
  return process.env.NEXT_PUBLIC_API_URL || "http://localhost:3002";
}

/**
 * Convert relative image path to full URL
 * Handles both relative paths and absolute URLs
 */
export function getFullImageUrl(pathOrUrl: string | null | undefined): string | null {
  if (!pathOrUrl) return null;

  // If already a full URL, return as is
  if (pathOrUrl.startsWith("http://") || pathOrUrl.startsWith("https://")) {
    return pathOrUrl;
  }

  // If relative path, construct full URL
  // Remove leading slash if present
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl.substring(1) : pathOrUrl;
  return `${getApiBaseUrl()}/${cleanPath}`;
}

