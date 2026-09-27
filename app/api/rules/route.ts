import { NextResponse } from 'next/server';
import { getPublishedRulesAndCategories } from '@/lib/rules/supabase-rules';

export const revalidate = 60; // revalidate every 60 seconds

export async function GET() {
  try {
    const data = await getPublishedRulesAndCategories();
    return NextResponse.json(data, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    });
  } catch (error: any) {
    console.error('[API /api/rules] Error fetching published rules:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve rules' },
      { status: 500 }
    );
  }
}
