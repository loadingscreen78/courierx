import { NextRequest, NextResponse } from 'next/server';
import { runSimulationWorker } from '@/lib/shipment-lifecycle/simulationWorker';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate CRON_SECRET header
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 },
      );
    }

    // 2. Run simulation worker
    const result = await runSimulationWorker();

    // 3. Return 200 with SimulationResult
    return NextResponse.json({ success: true, ...result }, { status: 200 });
  } catch (error) {
    console.error('[cron/simulation-worker] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
