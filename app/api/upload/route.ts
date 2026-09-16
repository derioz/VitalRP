import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10 MB

export async function POST(request: NextRequest) {
  // 1. Authentication Check
  const session = await getCurrentSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Authentication required.' }, { status: 401 });
  }

  // 2. Authorization Check (Must have permission to upload assets)
  const canUpload =
    session.permissions.canManageGallery ||
    session.permissions.canManageStaff ||
    session.permissions.canManageSettings ||
    session.permissions.canManageUsers;

  if (!canUpload) {
    return NextResponse.json(
      { error: 'Forbidden: You do not have permission to upload files.' },
      { status: 403 }
    );
  }

  // 3. Server Configuration Check
  const apiKey = process.env.FIVEMANAGE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'Server configuration error: FIVEMANAGE_API_KEY is not configured.' },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'No valid file provided in request.' }, { status: 400 });
    }

    // 4. File Type Validation
    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type (${file.type}). Allowed: JPG, PNG, WEBP, GIF.` },
        { status: 400 }
      );
    }

    // 5. File Size Validation
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit (size: ${(file.size / 1024 / 1024).toFixed(2)} MB).` },
        { status: 400 }
      );
    }

    // 6. Forward Multipart Request to FiveManage API v3
    const uploadFormData = new FormData();
    const filename = (file as any).name || `upload_${Date.now()}.png`;
    uploadFormData.append('file', file, filename);

    const path = formData.get('path');
    if (typeof path === 'string') {
      uploadFormData.append('path', path);
    }

    const fiveManageResponse = await fetch('https://api.fivemanage.com/api/v3/file', {
      method: 'POST',
      headers: {
        Authorization: apiKey,
      },
      body: uploadFormData,
    });

    const fiveManageData = await fiveManageResponse.json().catch(() => null);

    if (!fiveManageResponse.ok) {
      const msg = fiveManageData?.message || fiveManageData?.error || `FiveManage responded with ${fiveManageResponse.status}`;
      console.error('FiveManage API error:', msg);
      return NextResponse.json({ error: `Upload service error: ${msg}` }, { status: 502 });
    }

    const downloadUrl = fiveManageData?.url || fiveManageData?.data?.url;
    if (!downloadUrl) {
      return NextResponse.json({ error: 'Invalid response from FiveManage media service.' }, { status: 502 });
    }

    return NextResponse.json({ success: true, url: downloadUrl }, { status: 200 });
  } catch (err: any) {
    console.error('Unhandled upload error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error during upload.' }, { status: 500 });
  }
}
