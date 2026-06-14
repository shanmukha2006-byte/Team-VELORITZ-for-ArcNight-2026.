import { NextResponse } from 'next/server';
import { getHazardLogs, insertHazardLog } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const logs = await getHazardLogs();
    return NextResponse.json(logs);
  } catch (error) {
    console.error('API error in GET history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { stress_index, risk_summary, vulnerable_sector, source } = body;

    if (stress_index === undefined || !risk_summary || !vulnerable_sector || !source) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    await insertHazardLog({
      stress_index: Number(stress_index),
      risk_summary,
      vulnerable_sector,
      source
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error in POST history:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
