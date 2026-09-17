import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export interface FiveManageUploadOptions {
  filename?: string;
  path?: string;
}

export async function uploadToFiveManage(
  file: File | Blob,
  options?: FiveManageUploadOptions
): Promise<string> {
  const apiKey = (typeof process !== 'undefined' && process.env?.FIVEMANAGE_API_KEY) ||
    (typeof import.meta !== 'undefined' && (import.meta as any).env?.VITE_FIVEMANAGE_API_KEY) ||
    'eZgUsaWmqR3G146rqypFtL8DIHSOD0vv';

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
      'Authorization': apiKey,
    },
    body: formData,
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

export async function uploadImage(
  file: File | Blob,
  pathPrefix: string = 'uploads'
): Promise<string> {
  try {
    return await uploadToFiveManage(file, { path: pathPrefix });
  } catch (err: any) {
    console.warn('FiveManage direct upload failed, attempting fallback to Firebase Storage:', err.message);
    if (storage) {
      const fileName = `${pathPrefix}/${Date.now()}_${(file as File).name || 'image.png'}`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, file);
      return await getDownloadURL(storageRef);
    }
    throw err;
  }
}
