import { NextRequest, NextResponse } from 'next/server';
import { dispatchInvoiceEmail } from '@/lib/email/dispatcher';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { shipmentId, invoiceId } = body;

    if (!shipmentId || !invoiceId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: shipmentId and invoiceId are required' },
        { status: 400 }
      );
    }

    const result = await dispatchInvoiceEmail(shipmentId, invoiceId);

    if (result.errors.length > 0 && !result.userEmailSent && !result.adminEmailSent) {
      return NextResponse.json(
        { success: false, result, error: result.errors.join('; ') },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('[Email] send-invoice route error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
