export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { POST as handleProductAction, GET as handleProductGet } from '../[id]/route';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * GET /api/merch/products/manage?productId=...
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const productId = searchParams.get('productId') || searchParams.get('id') || '';

  if (!productId) {
    return NextResponse.json(
      { error: 'Missing productId query parameter' },
      { status: 400 }
    );
  }

  return handleProductGet(request, { params: Promise.resolve({ id: productId }) });
}

/**
 * POST /api/merch/products/manage
 * Body: { productId: string, action: string, reason?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const productId = body.productId || body.id;

    if (!productId) {
      return NextResponse.json(
        { error: 'Missing productId in request body' },
        { status: 400 }
      );
    }

    const syntheticRequest = new NextRequest(request.url, {
      method: 'POST',
      headers: request.headers,
      body: JSON.stringify(body),
    });

    return handleProductAction(syntheticRequest, { params: Promise.resolve({ id: String(productId) }) });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || 'Invalid JSON request' },
      { status: 400 }
    );
  }
}
