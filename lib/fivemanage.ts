import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface FiveManageUploadOptions {
  filename?: string;
  path?: string;
}

/**
 * Direct upload to FiveManage API v3 endpoint
 */
export async function uploadToFiveManage(
  file: File | Blob,
  options?: FiveManageUploadOptions
): Promise<string> {
  const apiKey = import.meta.env.VITE_FIVEMANAGE_API_KEY;
  if (!apiKey) {
    throw new Error('VITE_FIVEMANAGE_API_KEY is not configured in .env');
  }

  const formData = new FormData();
  const filename = (file as File).name || options?.filename || `image_${Date.now()}.png`;
  formData.append('file', file, filename);
  
  if (options?.filename) {
    formData.append('filename', options.filename);
  }
  if (options?.path) {
    formData.append('path', options.path);
  }

  const response = await fetch('https://api.fivemanage.com/api/v3/file', {
    method: 'POST',
    headers: {
      'Authorization': apiKey
    },
    body: formData
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = data?.message || data?.error || `Upload failed with status ${response.status}`;
    throw new Error(`FiveManage Error: ${errorMsg}`);
  }

  const url = data?.url || data?.data?.url;
  if (!url) {
    throw new Error('FiveManage API response did not contain a valid URL.');
  }

  return url;
}

/**
 * Universal image upload helper.
 * Tries FiveManage first if API key exists, with fallback to Firebase Storage.
 */
export async function uploadImage(
  file: File | Blob,
  pathPrefix: string = 'uploads'
): Promise<string> {
  const apiKey = import.meta.env.VITE_FIVEMANAGE_API_KEY;

  if (apiKey) {
    try {
      return await uploadToFiveManage(file, { path: pathPrefix });
    } catch (err: any) {
      console.warn('FiveManage upload failed, attempting fallback to Firebase Storage:', err.message);
      if (storage) {
        try {
          const fileName = `${pathPrefix}/${Date.now()}_${(file as File).name || 'image.png'}`;
          const storageRef = ref(storage, fileName);
          await uploadBytes(storageRef, file);
          return await getDownloadURL(storageRef);
        } catch (fbErr: any) {
          throw new Error(`FiveManage upload failed (${err.message}). Firebase Storage fallback also failed: ${fbErr.message}`);
        }
      }
      throw err;
    }
  }

  // If FiveManage API key is missing, attempt Firebase Storage fallback if storage is ready
  if (storage) {
    try {
      const fileName = `${pathPrefix}/${Date.now()}_${(file as File).name || 'image.png'}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    } catch (fbErr: any) {
      throw new Error(`VITE_FIVEMANAGE_API_KEY is missing in .env. Firebase Storage fallback failed: ${fbErr.message}`);
    }
  }

  throw new Error('Please set VITE_FIVEMANAGE_API_KEY in your .env file to enable image uploads.');
}
