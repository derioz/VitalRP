export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';

function getCorsHeaders(request: NextRequest, methods = 'GET, POST, OPTIONS') {
  const origin = request.headers.get('origin') || '*';
  const headers: Record<string, string> = {
    'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
    'Access-Control-Allow-Methods': methods,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
  };
  if (origin !== '*' && origin !== 'null') {
    headers['Access-Control-Allow-Credentials'] = 'true';
  }
  return headers;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 204,
    headers: getCorsHeaders(request, 'GET, POST, OPTIONS'),
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const corsHeaders = {
    ...getCorsHeaders(request, 'GET, POST, OPTIONS'),
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  };

  const { slug } = await params;
  const supabase = createAdminClient();

  if (!supabase) {
    return NextResponse.json(
      {
        revisions: [
          {
            id: 'rev-default-1',
            revision_number: 1,
            title: slug,
            summary: 'Initial character profile creation',
            editor_discord_id: '150580708144840704',
            editor_name: 'Damon',
            created_at: '2026-02-01T12:00:00Z',
          },
        ],
      },
      { headers: corsHeaders }
    );
  }

  try {
    const { data: page } = await supabase
      .from('wiki_pages')
      .select('id, title, slug')
      .eq('slug', slug.toLowerCase())
      .single();

    if (!page) {
      return NextResponse.json({ error: 'Character not found.' }, { status: 404, headers: corsHeaders });
    }

    const { data: revisions, error } = await supabase
      .from('wiki_revisions')
      .select('id, revision_number, title, summary, editor_discord_id, editor_name, created_at')
      .eq('page_id', page.id)
      .order('revision_number', { ascending: false });

    if (error) throw error;

    return NextResponse.json(
      {
        pageTitle: page.title,
        slug: page.slug,
        revisions: revisions || [],
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const corsHeaders = getCorsHeaders(request, 'GET, POST, OPTIONS');
  const { slug } = await params;

  // Restore revision requires Admin or Super Admin
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session || (!session.isAdmin && !session.isSuperAdmin && !session.effectivePermissions.includes('wiki.moderate'))) {
    return NextResponse.json({ error: 'Forbidden: Only administrators can rollback revisions.' }, { status: 403, headers: corsHeaders });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503, headers: corsHeaders });
  }

  try {
    const { revisionId } = await request.json();
    if (!revisionId) {
      return NextResponse.json({ error: 'Revision ID is required.' }, { status: 400, headers: corsHeaders });
    }

    const { data: rev, error: revErr } = await supabase
      .from('wiki_revisions')
      .select('*')
      .eq('id', revisionId)
      .single();

    if (revErr || !rev) {
      return NextResponse.json({ error: 'Revision snapshot not found.' }, { status: 404, headers: corsHeaders });
    }

    const snapshot = rev.snapshot_data;
    if (!snapshot) {
      return NextResponse.json({ error: 'Revision snapshot data is empty.' }, { status: 400, headers: corsHeaders });
    }

    // Restore sections
    if (Array.isArray(snapshot.sections)) {
      await supabase.from('wiki_sections').delete().eq('page_id', rev.page_id);
      const rows = snapshot.sections.map((s: any, idx: number) => ({
        page_id: rev.page_id,
        section_key: s.section_key || `sec_${idx}`,
        title: s.title,
        content_html: s.content_html,
        sort_order: s.sort_order || idx + 1,
        is_hidden: Boolean(s.is_hidden),
      }));
      await supabase.from('wiki_sections').insert(rows);
    }

    // Add new rollback revision record
    const { count: revCount } = await supabase
      .from('wiki_revisions')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', rev.page_id);

    const nextRevNum = (revCount || 0) + 1;

    await supabase.from('wiki_revisions').insert({
      page_id: rev.page_id,
      revision_number: nextRevNum,
      title: rev.title,
      summary: `Restored to Revision #${rev.revision_number} by ${session.displayName}`,
      snapshot_data: snapshot,
      editor_discord_id: session.discordId,
      editor_name: session.displayName || session.username,
    });

    return NextResponse.json({ success: true, message: `Restored to revision #${rev.revision_number}` }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}
