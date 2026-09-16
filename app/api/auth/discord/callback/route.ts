import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // If Discord redirects to old callback URL, seamlessly forward to /auth/callback
  const url = new URL('/auth/callback', request.url);
  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });
  return NextResponse.redirect(url);
}
