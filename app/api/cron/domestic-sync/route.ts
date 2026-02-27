import { NextRequest, NextResponse } from 'next/server';
import { runDomesticSync } from '@/lib/shipment-lifecycle/backgroundSync';
import { detectStuckShipments } from '@/lib/shipment-lifecycle/stuckShipmentDetector';

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

    // 2. Run domestic sync
    const result = await runDomesticSync();

    // 3. Detect stuck shipments (DOMESTIC leg > 48 hours)
    const stuckResult = await detectStuckShipments();

    // 4. Return 200 with SyncResult + stuck detection
    return NextResponse.json(
      { success: true, ...result, stuckShipments: stuckResult },
      { status: 200 },
    );
  } catch (error) {
    console.error('[cron/domestic-sync] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 },
    );
  }
}
