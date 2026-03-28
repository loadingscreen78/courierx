import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

/**
 * Guest coupon validation — no auth required.
 * Only validates coupons marked as guest_eligible.
 */
export async function POST(request: NextRequest) {
  try {
    const { code, amount } = await request.json();
    if (!code || amount === undefined) {
      return NextResponse.json({ valid: false, error: 'Coupon code and amount are required' }, { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Look up coupon — must be active AND guest_eligible
    const { data: coupon, error } = await supabase
      .from('promo_coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .eq('guest_eligible', true)
      .maybeSingle();

    if (error || !coupon) {
      return NextResponse.json({ valid: false, error: 'Invalid coupon code or not available for guest bookings' });
    }

    // Check expiry
    if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
      return NextResponse.json({ valid: false, error: 'This coupon has expired' });
    }

    // Check usage limit
    if (coupon.max_uses) {
      const { count } = await supabase
        .from('coupon_usage')
        .select('*', { count: 'exact', head: true })
        .eq('coupon_id', coupon.id);
      if (count !== null && count >= coupon.max_uses) {
        return NextResponse.json({ valid: false, error: 'This coupon has reached its usage limit' });
      }
    }

    // Check minimum amount
    if (coupon.min_recharge_amount && Number(amount) < coupon.min_recharge_amount) {
      return NextResponse.json({ valid: false, error: `Minimum order amount is ₹${coupon.min_recharge_amount}` });
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
