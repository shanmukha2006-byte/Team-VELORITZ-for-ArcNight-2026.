import { NextResponse } from 'next/server';
import { fetchDonki } from '@/lib/nasa';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const data = await fetchDonki();
    return NextResponse.json(data);
  } catch (error) {
    console.error('API error in donki:', error);
    const message = error instanceof Error ? error.message : 'Internal Server Error';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
