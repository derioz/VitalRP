import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { createAdminClient } from '@/lib/supabase/admin';
import { getFallbackCharacterBySlug } from '@/data/wiki-fallback';
import { extractMentionIds, extractMentionSnippet } from '@/lib/wiki/mentions';

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin === 'null' ? '*' : origin,
      'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
      'Access-Control-Max-Age': '86400',
    },
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const isPreview = request.nextUrl.searchParams.get('preview') === 'true';

  const rawSlug = decodeURIComponent(slug).toLowerCase().trim();
  const normalizedSlug = rawSlug.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');

  const supabase = createAdminClient();

  if (supabase) {
    try {
      // 1. Check for slug redirect
      const { data: redirect } = await supabase
        .from('wiki_slug_redirects')
        .select('new_slug')
        .or(`old_slug.eq.${rawSlug},old_slug.eq.${normalizedSlug}`)
        .maybeSingle();

      if (redirect?.new_slug) {
        return NextResponse.json({ redirect: true, newSlug: redirect.new_slug });
      }

      // 2. Fetch page (by slug or UUID)
      const isUuid = /^[0-9a-fA-F-]{36}$/.test(rawSlug);
      let pageQuery = supabase.from('wiki_pages').select('*');
      if (isUuid) {
        pageQuery = pageQuery.eq('id', rawSlug);
      } else {
        pageQuery = pageQuery.or(`slug.eq.${rawSlug},slug.eq.${normalizedSlug}`);
      }

      const { data: page, error: pageErr } = await pageQuery.maybeSingle();

      if (!pageErr && page) {
        // Fetch character data
        const { data: character } = await supabase
          .from('wiki_characters')
          .select('*')
          .eq('page_id', page.id)
          .maybeSingle();

        // If preview only, return minimal character payload
        if (isPreview) {
          return NextResponse.json({
            id: page.id,
            slug: page.slug,
            title: page.title,
            status: page.status,
            character: character || { full_name: page.title },
          });
        }

        // Fetch sections
        const { data: sections } = await supabase
          .from('wiki_sections')
          .select('*')
          .eq('page_id', page.id)
          .order('sort_order', { ascending: true });

        // Fetch categories
        const { data: catRows } = await supabase
          .from('wiki_page_categories')
          .select(`
            category_id,
            wiki_categories (
              id,
              slug,
              name,
              description,
              icon
            )
          `)
          .eq('page_id', page.id);

        const categories = (catRows || []).map((r: any) => r.wiki_categories).filter(Boolean);

        // Fetch relationships
        const { data: relRows } = await supabase
          .from('wiki_relationships')
          .select(`
            id,
            page_id,
            target_page_id,
            relationship_type,
            description,
            is_confirmed,
            wiki_pages:target_page_id (
              id,
              slug,
              title,
              status,
              wiki_characters (
                full_name,
                avatar_url,
                gang,
                occupation
              )
            )
          `)
          .eq('page_id', page.id);

        const relationships = (relRows || []).map((r: any) => {
          const targetPage = r.wiki_pages;
          const targetChar = Array.isArray(targetPage?.wiki_characters)
            ? targetPage?.wiki_characters[0]
            : targetPage?.wiki_characters;

          return {
            id: r.id,
            page_id: r.page_id,
            target_page_id: r.target_page_id,
            relationship_type: r.relationship_type,
            description: r.description,
            is_confirmed: r.is_confirmed,
            target: targetPage
              ? {
                  id: targetPage.id,
                  slug: targetPage.slug,
                  full_name: targetChar?.full_name || targetPage.title,
                  avatar_url: targetChar?.avatar_url,
                  status: targetPage.status,
                  gang: targetChar?.gang,
                  occupation: targetChar?.occupation,
                }
              : undefined,
          };
        });

        // Fetch gallery images
        const { data: gallery } = await supabase
          .from('wiki_images')
          .select('*')
          .eq('page_id', page.id)
          .order('sort_order', { ascending: true });

        // Fetch backlinks (pages referencing this page)
        const { data: backlinkRows } = await supabase
          .from('wiki_links')
          .select(`
            id,
            source_page_id,
            target_page_id,
            section_key,
            context_snippet,
            created_at,
            source:source_page_id (
              id,
              slug,
              title,
              status,
              wiki_characters (
                full_name,
                avatar_url,
                gang,
                occupation
              )
            )
          `)
          .eq('target_page_id', page.id);

        const backlinks = (backlinkRows || []).map((b: any) => {
          const srcPage = b.source;
          const srcChar = Array.isArray(srcPage?.wiki_characters)
            ? srcPage?.wiki_characters[0]
            : srcPage?.wiki_characters;

          return {
            id: b.id,
            source_page_id: b.source_page_id,
            target_page_id: b.target_page_id,
            section_key: b.section_key,
            context_snippet: b.context_snippet,
            created_at: b.created_at,
            source: srcPage
              ? {
                  id: srcPage.id,
                  slug: srcPage.slug,
                  title: srcPage.title,
                  full_name: srcChar?.full_name || srcPage.title,
                  avatar_url: srcChar?.avatar_url,
                  status: srcPage.status,
                  gang: srcChar?.gang,
                  occupation: srcChar?.occupation,
                }
              : undefined,
          };
        });

        // Compute related characters from backlinks & outgoing links
        const relatedMap = new Map<string, any>();
        relationships.forEach((r: any) => {
          if (r.target) relatedMap.set(r.target.id, r.target);
        });
        backlinks.forEach((b: any) => {
          if (b.source && !relatedMap.has(b.source.id)) {
            relatedMap.set(b.source.id, b.source);
          }
        });

        return NextResponse.json({
          ...page,
          character: character || { page_id: page.id, full_name: page.title, aliases: [] },
          sections: sections || [],
          categories,
          relationships,
          gallery: gallery || [],
          backlinks,
          related_characters: Array.from(relatedMap.values()).slice(0, 6),
        });
      }
    } catch (err) {
      console.warn('[Wiki Character Detail API] Supabase error, falling back to static character:', err);
    }
  }

  // Graceful fallback from static characters
  const fallback = getFallbackCharacterBySlug(slug);
  if (fallback) {
    return NextResponse.json(fallback);
  }

  return NextResponse.json({ error: 'Character not found.' }, { status: 404 });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // 1. Authoritative Auth Check
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized: Discord login is required to edit Wiki pages.' }, { status: 401 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable.' }, { status: 503 });
  }

  try {
    const rawSlug = decodeURIComponent(slug).toLowerCase().trim();
    const normalizedSlug = rawSlug.replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
    const isUuid = /^[0-9a-fA-F-]{36}$/.test(rawSlug);

    // 2. Fetch existing page to verify permissions
    let pageQuery = supabase.from('wiki_pages').select('*');
    if (isUuid) {
      pageQuery = pageQuery.eq('id', rawSlug);
    } else {
      pageQuery = pageQuery.or(`slug.eq.${rawSlug},slug.eq.${normalizedSlug}`);
    }

    const { data: page, error: pageErr } = await pageQuery.maybeSingle();

    if (pageErr || !page) {
      return NextResponse.json({ error: 'Character page not found.' }, { status: 404 });
    }

    const isCreator = page.created_by_discord_id === session.discordId;
    const canEdit =
      session.isSuperAdmin ||
      session.isAdmin ||
      isCreator ||
      session.effectivePermissions.includes('wiki.edit') ||
      session.matchedRoleNames.some((r) => r.toLowerCase().includes('whitelist'));

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Forbidden: You do not have permission to edit this character page.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const {
      full_name,
      aliases = [],
      status = page.status,
      summary = page.summary,
      avatar_url,
      avatar_crop,
      date_of_birth,
      pronouns,
      gender,
      nationality,
      occupation,
      employer,
      gang,
      business,
      residence,
      relationship_status,
      player_name,
      sections = [],
      categories = [],
      relationships = [],
      gallery = [],
      edit_summary = 'Updated character details',
    } = body;

    const trimmedName = full_name ? full_name.trim() : page.title;
    const newSlug = generateSlug(trimmedName);

    // 3. Handle renaming & slug redirect if title changed
    let activeSlug = page.slug;
    if (newSlug && newSlug !== page.slug) {
      // Check if new slug already taken by another page
      const { data: conflict } = await supabase
        .from('wiki_pages')
        .select('id')
        .eq('slug', newSlug)
        .neq('id', page.id)
        .maybeSingle();

      if (!conflict) {
        // Record redirect from old slug to new slug
        await supabase.from('wiki_slug_redirects').upsert({
          old_slug: page.slug,
          new_slug: newSlug,
          page_id: page.id,
        });
        activeSlug = newSlug;
      }
    }

    // 4. Update wiki_pages row
    await supabase
      .from('wiki_pages')
      .update({
        slug: activeSlug,
        title: trimmedName,
        status,
        summary,
        updated_by_discord_id: session.discordId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', page.id);

    // 5. Update wiki_characters row
    await supabase.from('wiki_characters').upsert({
      page_id: page.id,
      full_name: trimmedName,
      aliases: Array.isArray(aliases) ? aliases : [],
      avatar_url: avatar_url !== undefined ? avatar_url : '',
      avatar_crop: avatar_crop !== undefined ? avatar_crop : null,
      date_of_birth: date_of_birth || '',
      pronouns: pronouns || '',
      gender: gender || '',
      nationality: nationality || '',
      occupation: occupation || '',
      employer: employer || '',
      gang: gang || '',
      business: business || '',
      residence: residence || '',
      relationship_status: relationship_status || '',
      player_name: player_name || '',
      updated_at: new Date().toISOString(),
    });

    // 6. Update sections (Upsert or replace)
    if (Array.isArray(sections) && sections.length > 0) {
      await supabase.from('wiki_sections').delete().eq('page_id', page.id);
      const sectionRows = sections.map((s: any, idx: number) => ({
        page_id: page.id,
        section_key: s.section_key || `sec_${idx}`,
        title: s.title || 'Section',
        content_html: s.content_html || '',
        content_json: s.content_json || {},
        sort_order: s.sort_order || idx + 1,
        is_hidden: Boolean(s.is_hidden),
      }));
      await supabase.from('wiki_sections').insert(sectionRows);

      // 7. Update link graph for backlinks
      await supabase.from('wiki_links').delete().eq('source_page_id', page.id);
      for (const sec of sectionRows) {
        const mentionIds = extractMentionIds(sec.content_html);
        for (const targetId of mentionIds) {
          if (targetId !== page.id) {
            const snippet = extractMentionSnippet(sec.content_html, targetId);
            try {
              await supabase.from('wiki_links').insert({
                source_page_id: page.id,
                target_page_id: targetId,
                section_key: sec.section_key,
                context_snippet: snippet,
              });
            } catch {
              // Ignore non-critical index insertion errors
            }
          }
        }
      }
    }

    // 8. Update categories
    if (Array.isArray(categories)) {
      await supabase.from('wiki_page_categories').delete().eq('page_id', page.id);
      const catRows = categories.map((catId: string) => ({
        page_id: page.id,
        category_id: catId,
      }));
      if (catRows.length > 0) {
        await supabase.from('wiki_page_categories').insert(catRows);
      }
    }

    // 9. Update relationships
    if (Array.isArray(relationships)) {
      await supabase.from('wiki_relationships').delete().eq('page_id', page.id);
      const relRows = relationships.map((r: any) => ({
        page_id: page.id,
        target_page_id: r.target_page_id,
        relationship_type: r.relationship_type,
        description: r.description || '',
      }));
      if (relRows.length > 0) {
        await supabase.from('wiki_relationships').insert(relRows);
      }
    }

    // 10. Update gallery images sort orders & captions
    if (Array.isArray(gallery) && gallery.length > 0) {
      for (let i = 0; i < gallery.length; i++) {
        const img = gallery[i];
        if (img.id) {
          await supabase
            .from('wiki_images')
            .update({
              caption: img.caption || '',
              date_taken: img.date_taken || '',
              sort_order: i + 1,
            })
            .eq('id', img.id);
        }
      }
    }

    // 11. Create Revision Snapshot
    const { count: revCount } = await supabase
      .from('wiki_revisions')
      .select('*', { count: 'exact', head: true })
      .eq('page_id', page.id);

    const nextRevNum = (revCount || 0) + 1;

    await supabase.from('wiki_revisions').insert({
      page_id: page.id,
      revision_number: nextRevNum,
      title: trimmedName,
      summary: edit_summary,
      snapshot_data: {
        character: { full_name: trimmedName, aliases, occupation, gang, business },
        sections,
        categories,
        relationships,
      },
      editor_discord_id: session.discordId,
      editor_name: session.displayName || session.username,
    });

    return NextResponse.json({
      success: true,
      slug: activeSlug,
      revision: nextRevNum,
    });
  } catch (err: any) {
    console.error('[Wiki Character Detail API PUT] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update character.' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : undefined;
  const session = await getCurrentSession(token);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Admin moderation check
  if (!session.isAdmin && !session.isSuperAdmin && !session.effectivePermissions.includes('wiki.moderate')) {
    return NextResponse.json({ error: 'Forbidden: Admin access required.' }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database service unavailable' }, { status: 503 });
  }

  try {
    // Soft archive rather than destructive wipe
    const { error } = await supabase
      .from('wiki_pages')
      .update({
        is_archived: true,
        status: 'archived',
        updated_by_discord_id: session.discordId,
      })
      .eq('slug', slug.toLowerCase());

    if (error) throw error;

    return NextResponse.json({ success: true, message: 'Character archived successfully.' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
