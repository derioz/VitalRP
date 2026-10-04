export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { ALLOWED_WIKI_IMAGE_MIME_TYPES, MAX_WIKI_IMAGE_SIZE_BYTES } from '@/lib/wiki/fivemanage';

import { isWhitelistApproved } from '@/lib/auth/vital-admin';
import { getServerCharacterBySlug } from '@/lib/wiki/server-store';

function getCorsHeaders(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request),
  });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeaders(request);

  // 1. Authoritative Server-Side Auth Check
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json(
      { error: 'Unauthorized: Discord login is required to upload images.' },
      { status: 401, headers: corsHeaders }
    );
  }

  // 2. Authorization Check: Whitelist Approved role or staff permission required
  const isWhitelisted = isWhitelistApproved(session.discordRoles) || session.effectivePermissions.includes('wiki.upload') || session.effectivePermissions.includes('wiki.create');
  const isAdmin = session.isSuperAdmin || session.isAdmin || session.effectivePermissions.includes('wiki.moderate');

  if (!isWhitelisted && !isAdmin) {
    return NextResponse.json(
      { error: 'Forbidden: You must have the Whitelist Approved Discord role to upload Wiki images.' },
      { status: 403, headers: corsHeaders }
    );
  }

  // 3. FiveManage API Key check (with server fallback if not yet set in Vercel project settings)
  const apiKey = process.env.FIVEMANAGE_API_KEY || 'eZgUsaWmqR3G146rqypFtL8DIHSOD0vv';
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: FIVEMANAGE_API_KEY is not configured.' },
      { status: 500, headers: corsHeaders }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const pageId = formData.get('pageId') as string | null;

    if (pageId && !isAdmin) {
      const existingChar = await getServerCharacterBySlug(pageId, { isAdmin: true });
      if (existingChar && existingChar.created_by_discord_id && existingChar.created_by_discord_id !== session.discordId) {
        return NextResponse.json(
          { error: 'Forbidden: You do not own this character and cannot upload images for it.' },
          { status: 403, headers: corsHeaders }
        );
      }
    }

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No valid image file provided.' }, { status: 400, headers: corsHeaders });
    }

    // 4. Validate MIME type
    if (!ALLOWED_WIKI_IMAGE_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported image format (${file.type}). Allowed formats: JPEG, PNG, WebP.` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 5. Validate file size
    if (file.size > MAX_WIKI_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)} MB).` },
        { status: 400, headers: corsHeaders }
      );
    }

    // 6. Forward to FiveManage v3 API
    const uploadFormData = new FormData();
    const origFilename = (file as any).name || `wiki_img_${Date.now()}.webp`;
    uploadFormData.append('file', file, origFilename);
    uploadFormData.append('path', 'wiki');

    const fiveManageRes = await fetch('https://api.fivemanage.com/api/v3/file', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
      },
      body: uploadFormData,
    });

    const fiveData = await fiveManageRes.json().catch(() => null);

    if (!fiveManageRes.ok) {
      const msg = fiveData?.message || fiveData?.error || `FiveManage HTTP ${fiveManageRes.status}`;
      console.error('[Wiki Upload] FiveManage API error:', msg);
      return NextResponse.json({ error: `Image service error: ${msg}` }, { status: 502, headers: corsHeaders });
    }

    const downloadUrl = fiveData?.url || fiveData?.data?.url;
    const fileId = fiveData?.id || fiveData?.data?.id || '';

    if (!downloadUrl) {
      return NextResponse.json(
        { error: 'FiveManage upload succeeded but no URL was returned.' },
        { status: 502, headers: corsHeaders }
      );
    }

    // 7. Save metadata to Supabase wiki_images table if database available
    const supabase = createAdminClient();
    let savedId = '';
    if (supabase) {
      try {
        const { data: imgRow } = await supabase
          .from('wiki_images')
          .insert({
            page_id: pageId || null,
            fivemanage_id: fileId,
            url: downloadUrl,
            original_name: origFilename,
            mime_type: file.type,
            size_bytes: file.size,
            uploaded_by_discord_id: session?.discordId || 'unknown',
          })
          .select('id')
          .single();

        if (imgRow) savedId = imgRow.id;
      } catch (dbErr) {
        console.warn('[Wiki Upload] Failed to write wiki_images row:', dbErr);
      }
    }

    return NextResponse.json(
      {
        success: true,
        url: downloadUrl,
        fileId,
        imageRecordId: savedId,
        originalName: origFilename,
        mimeType: file.type,
        sizeBytes: file.size,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[Wiki Upload] Unhandled error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error during image upload.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
