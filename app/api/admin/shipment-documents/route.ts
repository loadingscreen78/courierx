import { NextRequest, NextResponse } from 'next/server';
import { getServiceRoleClient } from '@/lib/shipment-lifecycle/supabaseAdmin';

// GET /api/admin/shipment-documents?shipmentId=xxx
// Returns shipment_documents rows with fresh signed URLs (admin only)
export async function GET(request: NextRequest) {
  const supabase = getServiceRoleClient();

  // Auth check — must be admin
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(authHeader.slice(7));
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check admin role
  const { data: roles } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', user.id);
  const isAdmin = roles?.some((r: any) => ['admin', 'super_admin', 'warehouse_staff'].includes(r.role));
  if (!isAdmin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const shipmentId = request.nextUrl.searchParams.get('shipmentId');
  if (!shipmentId) {
    return NextResponse.json({ error: 'Missing shipmentId' }, { status: 400 });
  }

  // Fetch document records
  const { data: docs, error: docsError } = await supabase
    .from('shipment_documents')
    .select('id, document_type, file_path, file_name, mime_type, uploaded_at')
    .eq('shipment_id', shipmentId)
    .order('uploaded_at', { ascending: true });

  if (docsError) {
    return NextResponse.json({ error: docsError.message }, { status: 500 });
  }

  if (!docs || docs.length === 0) {
    return NextResponse.json({ documents: [] });
  }

  // Generate signed URLs for each document (1 hour expiry)
  const documents = await Promise.all(
    docs.map(async (doc: any) => {
      // file_path is stored as the storage path (may include bucket prefix)
      let storagePath = doc.file_path as string;

      // Strip bucket name prefix if present
      if (storagePath.startsWith('shipment-documents/')) {
        storagePath = storagePath.replace('shipment-documents/', '');
      }
      // Strip full URL if present
      const storageMatch = storagePath.match(/\/storage\/v1\/object\/(?:public|sign)\/[^/]+\/(.+)/);
      if (storageMatch) {
        storagePath = storageMatch[1];
      }

      const { data: signed, error: signError } = await supabase.storage
        .from('shipment-documents')
        .createSignedUrl(storagePath, 3600);

      return {
        id: doc.id,
        document_type: doc.document_type,
        file_name: doc.file_name,
        mime_type: doc.mime_type,
        file_path: doc.file_path,
        signed_url: signError ? null : signed?.signedUrl,
        uploaded_at: doc.uploaded_at,
      };
    })
  );

  return NextResponse.json({ documents });
}
