/**
 * Utility functions for avatar/profile photo handling.
 * All avatar URLs from the server are stored as relative paths like /uploads/avatar/...
 * This utility resolves them to full URLs.
 */

const SERVER_BASE_URL = "http://localhost:3000";

/**
 * Resolves an avatar URL to a full URL (with server base if relative).
 * Falls back to DiceBear avatar using the seed (usually username).
 */
export function resolveAvatarUrl(
  avatarUrl?: string | null,
  seed?: string
): string {
  if (avatarUrl && avatarUrl.trim() !== "") {
    // Already a full URL
    if (avatarUrl.startsWith("http://") || avatarUrl.startsWith("https://")) {
      return avatarUrl;
    }
    // Relative path from server (e.g., /uploads/avatar/avatar_xxx.jpg)
    return `${SERVER_BASE_URL}${avatarUrl}`;
  }
  // Fallback to DiceBear generated avatar
  const safeSeed = seed || "user";
  return `https://api.dicebear.com/9.x/avataaars/svg?seed=${encodeURIComponent(safeSeed)}`;
}
