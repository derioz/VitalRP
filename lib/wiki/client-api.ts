import { supabase } from '../supabase/client';
import { getApiUrl } from '../api-config';
export async function wikiFetch(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  const headers = new Headers(init.headers);
  if (data.session?.access_token) headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init.body) headers.set('Content-Type', 'application/json');
  const response = await fetch(getApiUrl(path), { ...init, headers, credentials: 'include', cache: 'no-store' });
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || `Wiki request failed (${response.status}).`);
  return result;
}
