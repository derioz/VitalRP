import { createClient } from '@supabase/supabase-js';

// Safely access environment variables
// We assign import.meta.env to a variable first to handle cases where it might be undefined
// before attempting to access properties on it.
// We cast import.meta to any to avoid TypeScript errors if vite/client types are missing in the checker.
const env = (import.meta as any).env || {};

// 1. Setup your keys here from Supabase > Project Settings > API
const SUPABASE_URL = env.VITE_SUPABASE_URL || 'https://vzjzwuggsmcohzmseyzu.supabase.co';
const SUPABASE_ANON_KEY = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ6anp3dWdnc21jb2h6bXNleXp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5NzA3MjYsImV4cCI6MjA4MjU0NjcyNn0.VBgnXXX80fdiu3Fw1TVR-bVIievtos-m3X6cHrkYM08';

// 2. Check if keys are actually set (not the placeholders)
// This prevents the "Invalid URL" error that crashes the app.
const isUrlValid = typeof SUPABASE_URL === 'string' && SUPABASE_URL.startsWith('http') && !SUPABASE_URL.includes('your-project');
const isKeyValid = typeof SUPABASE_ANON_KEY === 'string' && SUPABASE_ANON_KEY.length > 20 && !SUPABASE_ANON_KEY.includes('your-anon-key');

export const isSupabaseConfigured = isUrlValid && isKeyValid;

// 3. Create client 
// If not configured, we use a dummy valid URL to prevent the 'createClient' function from throwing an error.
// The app will load, but network requests to Supabase will simply fail gracefully.
export const supabase = createClient(
  isSupabaseConfigured ? SUPABASE_URL : 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY
);