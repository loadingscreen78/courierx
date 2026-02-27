import { supabaseServer } from './supabaseServer';
import { sendEmail } from './resend';
import { renderInvoiceEmail } from './templates/invoiceEmail';
import { renderStatusEmail } from './templates/statusEmail';
import { getStatusConfig, ShipmentStatus } from './templates/shared';

export interface NotificationResult {
  userEmailSent: boolean;
  adminEmailSent: boolean;
  errors: string[];
}

const ADMIN_EMAIL = process.env.ADMIN_NOTIFICATION_EMAIL || '';

/**
 * Resolve the user's email address.
 * 1. Check profiles table
 * 2. Fall back to auth.users (via admin API with service role)
 */
async function resolveUserEmail(userId: string): Promise<{
  email: string | null;
  notificationsEnabled: boolean;
}> {
  // Try profiles table first
  const { data: profile, error: profileErr } = await supabaseServer
    .from('profiles')
    .select('email, notifications_email')
    .eq('user_id', userId)
    .single();

  if (profileErr) {
    console.warn(`[Email] Profile lookup failed for ${userId}:`, profileErr.message);
  }

  if (profile?.email) {
    return {
      email: profile.email,
      notificationsEnabled: profile.notifications_email !== false, // default true if null
    };
  }

  // Fall back to auth.users via admin API
  console.log(`[Email] No email in profile, trying auth.users for ${userId}`);
  const { data: authUser, error: authErr } = await supabaseServer.auth.admin.getUserById(userId);

  if (authErr) {
    console.error(`[Email] auth.users lookup failed for ${userId}:`, authErr.message);
    return { email: null, notificationsEnabled: true };
  }

  const authEmail = authUser?.user?.email || null;
  console.log(`[Email] Resolved email from auth.users: ${authEmail}`);

  return {
    email: authEmail,
    notificationsEnabled: profile ? profile.notifications_email !== false : true,
  };
}

export async function dispatchInvoiceEmail(
  shipmentId: string,
  invoiceId: string
): Promise<NotificationResult> {
  const result: NotificationResult = { userEmailSent: false, adminEmailSent: false, errors: [] };

  console.log(`[Email] Dispatching invoice email for shipment=${shipmentId}, invoice=${invoiceId}`);

  // Fetch shipment
  const { data: shipment, error: shipmentErr } = await supabaseServer
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();

  if (shipmentErr || !shipment) {
    console.error(`[Email] Shipment not found: ${shipmentId}`, shipmentErr?.message);
    result.errors.push(`Shipment not found: ${shipmentId}`);
    return result;
  }

  // Fetch invoice
  const { data: invoice, error: invoiceErr } = await supabaseServer
    .from('invoices')
    .select('*')
    .eq('id', invoiceId)
    .single();

  if (invoiceErr || !invoice) {
    console.warn(`[Email] No invoice found for ID ${invoiceId}, skipping invoice email`);
    result.errors.push(`Invoice not found: ${invoiceId}`);
    return result;
  }

  // Resolve user email
  const { email: userEmail, notificationsEnabled } = await resolveUserEmail(shipment.user_id);
  console.log(`[Email] Resolved user email: ${userEmail}, notifications: ${notificationsEnabled}`);

  const html = renderInvoiceEmail({
    invoiceNumber: invoice.invoice_number,
    invoiceDate: new Date(invoice.created_at).toLocaleDateString('en-IN'),
    paymentStatus: invoice.status,
    trackingNumber: shipment.tracking_number || shipmentId,
    shipmentType: shipment.shipment_type as 'medicine' | 'document' | 'gift',
    recipientName: shipment.recipient_name,
    destinationCountry: shipment.destination_country,
    originAddress: shipment.origin_address,
    destinationAddress: shipment.destination_address,
    subtotal: invoice.amount,
    gstAmount: invoice.gst_amount,
    totalAmount: invoice.total_amount,
  });

  const subject = `Invoice ${invoice.invoice_number} - CourierX Shipment`;

  // Send to user if preference allows
  if (userEmail && notificationsEnabled) {
    console.log(`[Email] Sending invoice to user: ${userEmail}`);
    const userResult = await sendEmail({ to: userEmail, subject, html });
    result.userEmailSent = userResult.success;
    if (!userResult.success) {
      console.error(`[Email] User invoice email failed:`, userResult.error);
      result.errors.push(`User email failed: ${userResult.error}`);
    }
  } else if (userEmail && !notificationsEnabled) {
    console.log(`[Email] Skipping user email for ${userEmail} - notifications disabled`);
  } else {
    console.warn(`[Email] No user email found for shipment ${shipmentId}`);
  }

  // Always send to admin
  if (ADMIN_EMAIL) {
    const adminResult = await sendEmail({ to: ADMIN_EMAIL, subject: `[Admin] ${subject}`, html });
    result.adminEmailSent = adminResult.success;
    if (!adminResult.success) {
      result.errors.push(`Admin email failed: ${adminResult.error}`);
    }
  }

  return result;
}

export async function dispatchStatusEmail(
  shipmentId: string,
  newStatus: string
): Promise<NotificationResult> {
  const result: NotificationResult = { userEmailSent: false, adminEmailSent: false, errors: [] };

  if (newStatus === 'draft') {
    return result;
  }

  console.log(`[Email] Dispatching status email for shipment=${shipmentId}, status=${newStatus}`);

  // Fetch shipment
  const { data: shipment, error: shipmentErr } = await supabaseServer
    .from('shipments')
    .select('*')
    .eq('id', shipmentId)
    .single();

  if (shipmentErr || !shipment) {
    console.error(`[Email] Shipment not found: ${shipmentId}`, shipmentErr?.message);
    result.errors.push(`Shipment not found: ${shipmentId}`);
    return result;
  }

  // Resolve user email
  const { email: userEmail, notificationsEnabled } = await resolveUserEmail(shipment.user_id);
  console.log(`[Email] Resolved user email: ${userEmail}, notifications: ${notificationsEnabled}`);

  const statusConfig = getStatusConfig(newStatus as ShipmentStatus);

  const html = renderStatusEmail({
    trackingNumber: shipment.tracking_number || shipmentId,
    recipientName: shipment.recipient_name,
    shipmentType: shipment.shipment_type as 'medicine' | 'document' | 'gift',
    status: newStatus as ShipmentStatus,
    statusLabel: statusConfig.label,
    statusMessage: statusConfig.message,
    statusColor: statusConfig.color,
    timestamp: new Date().toLocaleString('en-IN'),
    destinationCountry: shipment.destination_country,
  });

  const subject = `Shipment ${statusConfig.label} - ${shipment.tracking_number || shipmentId}`;

  // Send to user if preference allows
  if (userEmail && notificationsEnabled) {
    console.log(`[Email] Sending status update to user: ${userEmail}`);
    const userResult = await sendEmail({ to: userEmail, subject, html });
    result.userEmailSent = userResult.success;
    if (!userResult.success) {
      console.error(`[Email] User status email failed:`, userResult.error);
      result.errors.push(`User email failed: ${userResult.error}`);
    } else {
      console.log(`[Email] Status email sent successfully to ${userEmail}`);
    }
  } else if (userEmail && !notificationsEnabled) {
    console.log(`[Email] Skipping user email for ${userEmail} - notifications disabled`);
  } else {
    console.warn(`[Email] No user email found for shipment ${shipmentId}`);
  }

  // Always send to admin
  if (ADMIN_EMAIL) {
    const adminResult = await sendEmail({ to: ADMIN_EMAIL, subject: `[Admin] ${subject}`, html });
    result.adminEmailSent = adminResult.success;
    if (!adminResult.success) {
      result.errors.push(`Admin email failed: ${adminResult.error}`);
    }
  }

  return result;
}