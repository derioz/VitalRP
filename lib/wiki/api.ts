import { NextRequest, NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
export function wikiCors(request: NextRequest) {
  const origin = request.headers.get('origin') || '*';
  return {
    'Access-Control-Allow-Origin': origin,
    ...(origin !== '*' && origin !== 'null' ? { 'Access-Control-Allow-Credentials': 'true' } : {}),
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store',
  };
}
export const wikiResponse = (request: NextRequest, data: unknown, status = 200) => NextResponse.json(data, { status, headers: wikiCors(request) });
export const wikiOptions = (request: NextRequest) => new NextResponse(null, { status: 204, headers: wikiCors(request) });
export function wikiSession(request: NextRequest) {
  const auth = request.headers.get('authorization');
  return getCurrentSession(auth?.startsWith('Bearer ') ? auth.slice(7) : undefined);
}
