import { NextRequest, NextResponse } from 'next/server';

/**
 * Public pincode lookup — proxies India Post API to avoid CORS.
 * GET /api/public/pincode-lookup?pincode=110001
 * GET /api/public/pincode-lookup?query=Connaught
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const pincode = searchParams.get('pincode');
  const query = searchParams.get('query');

  try {
    if (pincode && /^\d{6}$/.test(pincode)) {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
        next: { revalidate: 86400 }, // cache 24h
      });
      const data = await res.json();
      const result = data?.[0];
      if (result?.Status !== 'Success' || !result?.PostOffice?.length) {
        return NextResponse.json({ success: false, error: 'Pincode not found' });
      }
      const first = result.PostOffice[0];
      return NextResponse.json({
        success: true,
        state: first.State,
        district: first.District,
        postOffices: result.PostOffice.map((po: any) => ({
          name: po.Name,
          pincode: po.Pincode,
          district: po.District,
          state: po.State,
        })),
      });
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
