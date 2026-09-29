/**
 * Resolves the appropriate API endpoint URL.
 * When running on static GitHub Pages hosting (vitalrp.net) or Vite local dev/preview,
 * routes API calls to the live Vercel backend (https://vital-rp.vercel.app).
 * When running directly on Next.js (port 3000 or on vercel.app), uses relative paths.
 */
export function getApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const port = window.location.port;

    // Direct Next.js environments
    if (host.includes('vercel.app') || (host === 'localhost' && port === '3000')) {
      return cleanPath;
    }

    // Static SPA / GitHub Pages / Vite dev server
    return `https://vital-rp.vercel.app${cleanPath}`;
  }
  return cleanPath;
}

