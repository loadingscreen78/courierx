// Wallet Receipt PDF Generator
import jsPDF from 'jspdf';
import { format } from 'date-fns';
import { Receipt } from './types';
import { formatPaymentMethod, formatCurrency } from './receiptGenerator';

export function generateWalletReceiptPDF(receipt: Receipt): void {
  const doc = new jsPDF();
  
  // Header - Company Logo Area
  doc.setFillColor(79, 70, 229); // Primary color
  doc.rect(0, 0, 210, 45, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('CourierX', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('International Logistics', 20, 33);
  
  // Receipt badge
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(140, 12, 50, 22, 3, 3, 'F');
  doc.setTextColor(79, 70, 229);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('RECEIPT', 165, 26, { align: 'center' });
  
  // Reset text color
  doc.setTextColor(0, 0, 0);
  
  // Receipt details section
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Receipt Number', 20, 60);
  doc.text('Transaction ID', 20, 72);
  doc.text('Date & Time', 20, 84);
  doc.text('Payment Method', 20, 96);
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'bold');
  doc.text(receipt.receiptNumber, 80, 60);
  doc.text(receipt.transactionId, 80, 72);
  doc.text(format(new Date(receipt.date), 'dd MMM yyyy, hh:mm a'), 80, 84);
  doc.text(formatPaymentMethod(receipt.paymentMethod), 80, 96);
  
  // Horizontal divider
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.line(20, 108, 190, 108);
  
  // Customer details
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Customer Details', 20, 120);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text('Name', 20, 132);
  if (receipt.customerEmail) {
    doc.text('Email', 20, 144);
  }
  
  doc.setTextColor(0, 0, 0);
  doc.text(receipt.customerName, 80, 132);
  if (receipt.customerEmail) {
    doc.text(receipt.customerEmail, 80, 144);
  }
  
  // Amount breakdown box
  const boxY = receipt.customerEmail ? 160 : 150;
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(20, boxY, 170, 60, 3, 3, 'F');
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Payment Summary', 30, boxY + 15);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal
  doc.setTextColor(100, 100, 100);
  doc.text('Subtotal', 30, boxY + 30);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(receipt.amount), 160, boxY + 30, { align: 'right' });
  
  // GST
  doc.setTextColor(100, 100, 100);
  doc.text('GST (18%)', 30, boxY + 42);
  doc.setTextColor(0, 0, 0);
  doc.text(formatCurrency(receipt.gstAmount), 160, boxY + 42, { align: 'right' });
  
  // Divider inside box
  doc.setDrawColor(200, 200, 200);
  doc.line(30, boxY + 48, 180, boxY + 48);
  
  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('Total Amount', 30, boxY + 58);
  doc.setTextColor(79, 70, 229);
  doc.text(formatCurrency(receipt.totalAmount), 160, boxY + 58, { align: 'right' });
  
  // Success message
  const successY = boxY + 80;
  doc.setFillColor(220, 252, 231);
  doc.roundedRect(20, successY, 170, 20, 3, 3, 'F');
  doc.setTextColor(22, 163, 74);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('✓ Payment Successful - Wallet Credited', 105, successY + 13, { align: 'center' });
  
  // Company details footer
  const footerY = 240;
  doc.setDrawColor(230, 230, 230);
  doc.line(20, footerY, 190, footerY);
  
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text(receipt.companyDetails.name, 105, footerY + 10, { align: 'center' });
  doc.text(receipt.companyDetails.address, 105, footerY + 16, { align: 'center' });
  doc.text(`GST: ${receipt.companyDetails.gstNumber}`, 105, footerY + 22, { align: 'center' });
  doc.text(`Email: ${receipt.companyDetails.email} | Phone: ${receipt.companyDetails.phone}`, 105, footerY + 28, { align: 'center' });
  
  // Legal note
  doc.setFontSize(7);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a computer-generated receipt and does not require a signature.', 105, 285, { align: 'center' });
  
  // Save the PDF
  doc.save(`CourierX_Receipt_${receipt.receiptNumber}.pdf`);
}

// Download receipt by receipt object
export function downloadReceipt(receipt: Receipt): void {
  generateWalletReceiptPDF(receipt);
}
