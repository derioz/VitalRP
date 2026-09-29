import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { syncPrintifyCatalog } from '@/lib/printify/sync';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'merch.manage', session.discordId)) {
    return NextResponse.json(
      { error: 'Unauthorized. Requires merch.manage permission.' },
      { status: 403 }
    );
  }

  try {
    const result = await syncPrintifyCatalog();
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Sync failed.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      productsSynced: result.productsSynced,
      variantsSynced: result.variantsSynced,
      message: `Successfully synchronized ${result.productsSynced} products and ${result.variantsSynced} variants from Printify.`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to sync catalog from Printify.' },
      { status: 500 }
    );
  }
}
