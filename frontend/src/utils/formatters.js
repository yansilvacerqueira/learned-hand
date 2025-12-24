/**
 * Format file size in bytes to human-readable string
 * @param {number} bytes - File size in bytes
 * @returns {string} Formatted file size (e.g., "1.5 MB")
 */
export function formatFileSize(bytes) {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}
