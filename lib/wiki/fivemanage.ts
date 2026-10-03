/**
 * FiveManage Media Client & Server-side Utilities for Vital RP Wiki.
 * Security: FIVEMANAGE_API_KEY is kept strictly on the server side and never exposed to the client.
 */

import { getApiUrl } from '../api-config';
import { supabase } from '../supabase/client';

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
 * Includes graceful local data URL fallback so users are never blocked.
 */
export async function uploadWikiImageWithProgress(
  file: File,
  pageId?: string,
  onProgress?: (percent: number) => void
): Promise<WikiUploadResponse> {
  // Client-side format & size check
  if (!ALLOWED_WIKI_IMAGE_MIME_TYPES.has(file.type)) {
    throw new Error('Invalid image format. Only JPEG, PNG, and WebP are allowed.');
  }
  if (file.size > MAX_WIKI_IMAGE_SIZE_BYTES) {
    throw new Error('Image size exceeds 10MB limit.');
  }

  // Get active session token
  const { data: authData } = await supabase.auth.getSession();
  const token = authData?.session?.access_token;

  const formData = new FormData();
  formData.append('file', file);
  if (pageId) {
    formData.append('pageId', pageId);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const endpoint = getApiUrl('/api/wiki/upload');

    xhr.open('POST', endpoint, true);

    // Pass authorization header for cross-origin server auth
    if (token) {
      xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    }

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      let data: any = null;
      try {
        data = JSON.parse(xhr.responseText);
      } catch {}

      if (xhr.status >= 200 && xhr.status < 300) {
        if (data?.url) {
          resolve(data);
        } else {
          // If no URL returned, fallback to data URL
          const reader = new FileReader();
          reader.onload = () => resolve({ success: true, url: reader.result as string });
          reader.readAsDataURL(file);
        }
      } else {
        const errorMsg = data?.error || `Upload failed with status ${xhr.status}`;
        console.warn('[FiveManage Upload] Server returned non-200:', errorMsg);

        // Fallback to local Data URL so user is never blocked from editing/saving
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            success: true,
            url: reader.result as string,
            error: errorMsg,
          });
        };
        reader.onerror = () => reject(new Error(errorMsg));
        reader.readAsDataURL(file);
      }
    };

    xhr.onerror = () => {
      // Graceful fallback to client Data URL if network or CORS is blocked
      console.warn('[FiveManage Upload] Network error, falling back to local image URL');
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          success: true,
          url: reader.result as string,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
    };

    xhr.send(formData);
  });
}
