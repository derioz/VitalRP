import { NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { createAdminClient } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';

export async function GET() {
  const result: Record<string, any> = {
    firebase: {
      hasProjectId: Boolean(process.env.FIREBASE_PROJECT_ID),
      hasClientEmail: Boolean(process.env.FIREBASE_CLIENT_EMAIL),
      hasPrivateKey: Boolean(process.env.FIREBASE_PRIVATE_KEY),
      privateKeyLength: process.env.FIREBASE_PRIVATE_KEY?.length || 0,
      adminDbAvailable: Boolean(adminDb),
      testStatus: 'untested',
    },
    supabase: {
      hasUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      testStatus: 'untested',
    },
    envKeysPresent: Object.keys(process.env).filter(
      (k) => !k.startsWith('npm_') && !k.startsWith('__') && !k.includes('TOKEN') && !k.includes('SECRET') && !k.includes('KEY')
    ),
  };

  if (adminDb) {
    try {
      const snap = await adminDb.collection('wiki_characters').limit(5).get();
      result.firebase.testStatus = 'success';
      result.firebase.characterCount = snap.size;
      result.firebase.characterSlugs = snap.docs.map((d) => d.id);
    } catch (err: any) {
      result.firebase.testStatus = 'error';
      result.firebase.error = err.message;
    }
  } else {
    result.firebase.testStatus = 'adminDb is null';
  }

  const supabase = createAdminClient();
  if (supabase) {
    try {
      const { data, error } = await supabase.from('wiki_pages').select('slug').limit(5);
      if (error) {
        result.supabase.testStatus = 'error';
        result.supabase.error = error.message;
      } else {
        result.supabase.testStatus = 'success';
        result.supabase.pages = data;
      }
    } catch (err: any) {
      result.supabase.testStatus = 'exception';
      result.supabase.error = err.message;
    }
  } else {
    result.supabase.testStatus = 'supabase client is null';
  }

  return NextResponse.json(result);
}
