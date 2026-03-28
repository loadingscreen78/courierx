import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

/**
 * Guest coupon validation — no auth required.
 * Only validates public/guest-eligible coupons.
 */
export async function POST(request: NextRequest) {
  try {
    const { code, amount } = await request.json();
    if (!code || amount === undefined) {
      return NextResponse.json({ valid: false, error: 'Coupon code and amount are required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Look up coupon directly — guest coupons must be active, not expired, and have uses remaining
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid or expired coupon code' });
    }

    // Check expiry
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.max_uses && coupon.times_used >= coupon.max_uses) {
      return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit' });
    }

    // Check minimum amount
    if (coupon.min_amount && Number(amount) < coupon.min_amount) {
      return NextResponse.json({ valid: false, error: `Minimum order amount is ₹${coupon.min_amount}` });
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = Math.round(Number(amount) * (coupon.discount_value / 100));
      if (coupon.max_discount) discountAmount = Math.min(discountAmount, coupon.max_discount);
    } else {
      discountAmount = Math.min(coupon.discount_value, Number(amount));
    }

    return NextResponse.json({
      valid: true,
      discountAmount,
      discountType: coupon.discount_type,
      discountValue: coupon.discount_value,
    });
  } catch (error) {
    console.error('[coupons/validate-guest] Error:', error);
    return NextResponse.json({ valid: false, error: 'Failed to validate coupon' }, { status: 500 });
  }
}
