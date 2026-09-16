import { NextResponse } from 'next/server';

export const revalidate = 30; // Next.js ISR route revalidation in seconds

interface CFXServerData {
  clients?: number;
  sv_maxclients?: number;
  gametype?: string;
  hostname?: string;
  mapname?: string;
}

interface CFXApiResponse {
  Data?: CFXServerData;
}

export async function GET() {
  const serverId = process.env.CFX_SERVER_ID || 'ogpvmv';
  const cfxUrl = `https://frontend.cfx-services.net/api/servers/single/${serverId}`;

  // Default fallback payload if CFX is unreachable or offline
  const fallbackResponse = {
    online: false,
    players: 0,
    max: 2048,
    serverId,
    timestamp: Date.now(),
    cached: false,
  };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(cfxUrl, {
      signal: controller.signal,
      next: { revalidate: 30 },
      headers: {
        'User-Agent': 'VitalRP-Website/2.0 (Server Status Monitor)',
        Accept: 'application/json',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`CFX API returned non-200 status: ${response.status}`);
      return NextResponse.json(fallbackResponse, { status: 200 });
    }

    const data: CFXApiResponse = await response.json();

    if (!data || !data.Data) {
      return NextResponse.json(fallbackResponse, { status: 200 });
    }

    const clients = typeof data.Data.clients === 'number' ? data.Data.clients : 0;
    const maxClients = typeof data.Data.sv_maxclients === 'number' ? data.Data.sv_maxclients : 2048;

    return NextResponse.json(
      {
        online: true,
        players: clients,
        max: maxClients,
        serverId,
        timestamp: Date.now(),
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (error: any) {
    console.warn('CFX population fetch failed or timed out:', error.message || error);
    return NextResponse.json(fallbackResponse, { status: 200 });
  }
}
