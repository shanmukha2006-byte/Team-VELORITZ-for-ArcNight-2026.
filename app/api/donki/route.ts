import { NextResponse } from 'next/server';
import { fetchDonki } from '../../../lib/nasa';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchDonki();
    return NextResponse.json(data, {
      headers: { 'Cache-Control': 'no-store, max-age=0' }
    });
  } catch (e) {
    return NextResponse.json({ error: 'Failed to stream ionospheric telemetry' }, { status: 500 });
  }
}
