/**
 * Client helper to upload images through our secure server-side API proxy.
 * Protects the FiveManage API key by keeping it strictly on the server.
 */
export async function uploadImage(file: File | Blob, pathPrefix: string = 'uploads'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('path', pathPrefix);

  const response = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error || `Upload failed with status ${response.status}`);
  }

  if (!data?.url) {
    throw new Error('Upload succeeded but no URL was returned.');
  }

  return data.url;
}
