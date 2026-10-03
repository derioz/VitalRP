/**
 * FiveManage Media Client & Server-side Utilities for Vital RP Wiki.
 * Security: FIVEMANAGE_API_KEY is kept strictly on the server side and never exposed to the client.
 */

export const ALLOWED_WIKI_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

export const MAX_WIKI_IMAGE_SIZE_BYTES = 10 * 1024 * 1024; // 10 Megabytes

export interface WikiUploadResponse {
  success: boolean;
  url: string;
  fileId?: string;
  filename?: string;
  mimeType?: string;
  sizeBytes?: number;
  error?: string;
}

/**
 * Client-side helper to upload a wiki image through our secure backend endpoint.
 * Provides real-time upload progress feedback.
 */
export function uploadWikiImageWithProgress(
  file: File,
  pageId?: string,
  onProgress?: (percent: number) => void
): Promise<WikiUploadResponse> {
  return new Promise((resolve, reject) => {
    // Client-side quick check
    if (!ALLOWED_WIKI_IMAGE_MIME_TYPES.has(file.type)) {
      return reject(new Error('Invalid image format. Only JPEG, PNG, and WebP are allowed.'));
    }
    if (file.size > MAX_WIKI_IMAGE_SIZE_BYTES) {
      return reject(new Error('Image size exceeds 10MB limit.'));
    }

    const formData = new FormData();
    formData.append('file', file);
    if (pageId) {
      formData.append('pageId', pageId);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/wiki/upload', true);

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          resolve({ success: true, url: '' });
        }
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          reject(new Error(errData.error || `Upload failed with status ${xhr.status}`));
        } catch {
          reject(new Error(`Upload failed with HTTP ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error during image upload.'));
    };

    xhr.send(formData);
  });
}
