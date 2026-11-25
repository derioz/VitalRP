import { NextResponse } from 'next/server';

export const revalidate = 30; // Next.js ISR route revalidation in seconds

const CFX_SERVER_ID = '3yyqyxy';

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
  // The public join code that connect.vitalrp.net redirects to.
  const serverId = CFX_SERVER_ID;
  const cfxUrl = `https://frontend.cfx-services.net/api/servers/single/${serverId}`;

  // "offline" means the server list has no such server running. "unknown" means
  // we could not find out, and the site must not claim either way.
  const unavailable = (status: 'offline' | 'unknown') =>
    NextResponse.json(
      { status, online: false, players: 0, max: 0, serverId, timestamp: Date.now() },
      { status: 200 }
    );

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
      return unavailable(response.status === 404 ? 'offline' : 'unknown');
    }

    const data: CFXApiResponse = await response.json();

    if (!data || !data.Data) {
      return unavailable('unknown');
    }

    const clients = typeof data.Data.clients === 'number' ? data.Data.clients : 0;
    const maxClients = typeof data.Data.sv_maxclients === 'number' ? data.Data.sv_maxclients : 2048;

    return NextResponse.json(
      {
        status: 'online',
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
    return unavailable('unknown');
  }
}
