import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/permissions';
import { createCategory, updateCategory, deleteCategory, reorderCategories } from '@/lib/rules/supabase-rules';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.edit', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.edit.' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const category = await createCategory(body, {
      discordId: session.discordId,
      displayName: session.displayName,
    });
    return NextResponse.json({ success: true, category });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.edit', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.edit.' }, { status: 403 });
  }

  try {
    const body = await request.json();

    if (body.reorder && Array.isArray(body.reorder)) {
      await reorderCategories(body.reorder, {
        discordId: session.discordId,
        displayName: session.displayName,
      });
      return NextResponse.json({ success: true });
    }

    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'Missing category id' }, { status: 400 });

    const updated = await updateCategory(id, data, {
      discordId: session.discordId,
      displayName: session.displayName,
    });
    return NextResponse.json({ success: true, category: updated });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || !hasPermission(session.effectivePermissions, 'rules.edit', session.discordId)) {
    return NextResponse.json({ error: 'Unauthorized. Requires rules.edit.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing category id' }, { status: 400 });

    const result = await deleteCategory(id, {
      discordId: session.discordId,
      displayName: session.displayName,
    });

    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete category' }, { status: 500 });
  }
}
