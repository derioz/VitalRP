export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { syncPrintifyCatalog } from '@/lib/printify/sync';

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function POST(request: NextRequest) {
  const originHeader = request.headers.get('origin') || '*';
  const corsHeaders = {
    'Access-Control-Allow-Origin': originHeader === 'null' ? '*' : originHeader,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Cache-Control': 'no-store, no-cache, must-revalidate',
  };

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'merch.manage', session.discordId)) {
    return NextResponse.json(
      { error: 'Unauthorized. Requires merch.manage permission.' },
      { status: 403, headers: corsHeaders }
    );
  }

  try {
    const result = await syncPrintifyCatalog();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Sync failed.' },
        { status: 500, headers: corsHeaders }
      );
    }

    return NextResponse.json({
      success: true,
      productsCreated: result.productsCreated,
      productsUpdated: result.productsUpdated,
      productsArchived: result.productsArchived,
      productsSynced: result.productsSynced,
      variantsSynced: result.variantsSynced,
      pagesRetrieved: result.pagesRetrieved,
      totalPrintifyProducts: result.totalPrintifyProducts,
      message: result.message || `Sync complete\n${result.productsUpdated} products updated\n${result.productsCreated} products added\n${result.productsArchived} deleted products removed`,
    }, { headers: corsHeaders });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync catalog from Printify.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
