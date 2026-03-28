import { NextRequest, NextResponse } from 'next/server';
import { getStateFromPincode } from '@/lib/pincode-lookup';

/**
 * Public pincode lookup — proxies India Post API to avoid CORS.
 * Falls back to local prefix-based state mapping if India Post is down.
 * GET /api/public/pincode-lookup?pincode=110001
 * GET /api/public/pincode-lookup?query=Connaught
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');
  const query = searchParams.get('query');

  try {
    if (pincode && /^\d{6}$/.test(pincode)) {
      // Try India Post API with timeout
      try {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4000);

        const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
          signal: controller.signal,
          next: { revalidate: 86400 }, // cache 24h
        });
        clearTimeout(timeout);

        const data = await res.json();
        const result = data?.[0];
        if (result?.Status === 'Success' && result?.PostOffice?.length) {
          const first = result.PostOffice[0];
          const allAreas = result.PostOffice.map((po: any) => po.Name);
          const allDistricts = [...new Set(result.PostOffice.map((po: any) => po.District))] as string[];
          return NextResponse.json({
            success: true,
            state: first.State,
            district: first.District,
            areas: allAreas,
            districts: allDistricts,
            postOffices: result.PostOffice.map((po: any) => ({
              name: po.Name,
              pincode: po.Pincode,
              district: po.District,
              state: po.State,
            })),
          });
        }
      } catch (apiErr) {
        console.warn('[pincode-lookup] India Post API failed, using local fallback:', (apiErr as Error).message);
      }

      // Fallback: local prefix-based state resolution
      const state = getStateFromPincode(pincode);
      if (state) {
        return NextResponse.json({
          success: true,
          state,
          district: state,
          areas: [state],
          districts: [state],
          postOffices: [],
          _fallback: true,
        });
      }

      return NextResponse.json({ success: false, error: 'Pincode not found' });
    }

    if (query && query.length >= 3) {
      const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(query)}`, {
        next: { revalidate: 86400 },
      });
      const data = await res.json();
      const result = data?.[0];
      if (result?.Status !== 'Success' || !result?.PostOffice?.length) {
        return NextResponse.json({ success: true, results: [] });
      }
      // Deduplicate by pincode, limit to 20
      const seen = new Set<string>();
      const results: any[] = [];
      for (const po of result.PostOffice) {
        const key = po.Pincode;
        if (!seen.has(key) && results.length < 20) {
          seen.add(key);
          results.push({
            name: po.Name,
            pincode: po.Pincode,
            district: po.District,
            state: po.State,
          });
        }
      }
      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ success: false, error: 'Provide pincode or query param' }, { status: 400 });
  } catch (error) {
    console.error('[pincode-lookup] Error:', error);
    return NextResponse.json({ success: false, error: 'Lookup failed' }, { status: 500 });
  }
}
