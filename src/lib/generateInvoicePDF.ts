import jsPDF from 'jspdf';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type Invoice = Database['public']['Tables']['invoices']['Row'];

export const generateInvoicePDF = (invoice: Invoice): void => {
  const doc = new jsPDF();
  
  // Header
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CourierX', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('International Logistics', 20, 32);
  
  // Invoice title
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('INVOICE', 150, 25);
  
  // Invoice details box
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Invoice No: ${invoice.invoice_number}`, 150, 35);
  doc.text(`Date: ${format(new Date(invoice.created_at), 'dd MMM yyyy')}`, 150, 42);
  doc.text(`Status: ${invoice.status.toUpperCase()}`, 150, 49);
  
  // Horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 60, 190, 60);
  
  // Description section
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Description', 20, 75);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const descriptionLines = doc.splitTextToSize(invoice.description, 170);
  doc.text(descriptionLines, 20, 85);
  
  // Amount breakdown
  const startY = 110;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Amount Details', 20, startY);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  
  // Table headers
  doc.text('Item', 20, startY + 15);
  doc.text('Amount', 160, startY + 15);
  
  doc.setLineWidth(0.3);
  doc.line(20, startY + 18, 190, startY + 18);
  
  // Base amount
  doc.text('Subtotal', 20, startY + 28);
  doc.text(`₹${Number(invoice.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 160, startY + 28);
  
  // GST amount
  doc.text('GST (18%)', 20, startY + 38);
  doc.text(`₹${Number(invoice.gst_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 160, startY + 38);
  
  // Total line
  doc.setLineWidth(0.5);
  doc.line(20, startY + 45, 190, startY + 45);
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount', 20, startY + 55);
  doc.text(`₹${Number(invoice.total_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 160, startY + 55);
  
  // Payment status
  if (invoice.status === 'paid' && invoice.paid_at) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Paid on: ${format(new Date(invoice.paid_at), 'dd MMM yyyy, hh:mm a')}`, 20, startY + 70);
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer-generated invoice.', 20, 270);
  doc.text('For queries, contact support@courierx.com', 20, 276);
  
  // Save the PDF
  doc.save(`${invoice.invoice_number}.pdf`);
};

export const generateAllInvoicesPDF = (invoices: Invoice[]): void => {
  if (invoices.length === 0) return;
  
  const doc = new jsPDF();
  
  // Title page
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('CourierX', 105, 50, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('Invoice Summary', 105, 65, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, 105, 80, { align: 'center' });
  doc.text(`Total Invoices: ${invoices.length}`, 105, 90, { align: 'center' });
  
  // Summary table
  let y = 120;
  
  // Headers
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice No', 20, y);
  doc.text('Date', 70, y);
  doc.text('Status', 110, y);
  doc.text('Amount', 150, y);
  
  doc.setLineWidth(0.5);
  doc.line(20, y + 3, 190, y + 3);
  
  doc.setFont('helvetica', 'normal');
  y += 12;
  
  invoices.forEach((invoice, index) => {
    if (y > 260) {
      doc.addPage();
      y = 30;
    }
    
    doc.text(invoice.invoice_number, 20, y);
    doc.text(format(new Date(invoice.created_at), 'dd MMM yyyy'), 70, y);
    doc.text(invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1), 110, y);
    doc.text(`₹${Number(invoice.total_amount).toLocaleString('en-IN')}`, 150, y);
    
    y += 10;
  });
  
  // Total
  doc.setLineWidth(0.5);
  doc.line(20, y, 190, y);
  y += 8;
  
  doc.setFont('helvetica', 'bold');
  const total = invoices.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  doc.text('Grand Total', 20, y);
  doc.text(`₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, 150, y);
  
  doc.save(`CourierX_Invoices_${format(new Date(), 'yyyyMMdd')}.pdf`);
};
