import jsPDF from 'jspdf';

interface WalletInvoiceData {
  invoiceNumber: string;
  createdAt: string;
  partner: {
    businessName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    gstNumber?: string | null;
    panNumber: string;
  };
  transaction: {
    description: string;
    amount: number;
    type: 'debit' | 'credit';
    referenceId?: string | null;
  };
  courierX: {
    name: string;
    address: string;
    gstNumber: string;
    panNumber: string;
  };
}

export const generateCXBCWalletInvoicePDF = (data: WalletInvoiceData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;
  
  // CourierX Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('CourierX Private Limited', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(data.courierX.address, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`GSTIN: ${data.courierX.gstNumber}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`PAN: ${data.courierX.panNumber}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Divider
  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  // Invoice Title
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('TAX INVOICE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Invoice info in two columns
  doc.text('Invoice No:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(data.invoiceNumber, 60, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', 120, yPos);
  doc.text(new Date(data.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }), 145, yPos);
  
  // Bill To Section
  yPos += 15;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPos - 5, pageWidth - 40, 35, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Bill To:', 25, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(data.partner.businessName, 25, yPos);
  
  yPos += 6;
  doc.text(`${data.partner.address}, ${data.partner.city}`, 25, yPos);
  
  yPos += 6;
  doc.text(`${data.partner.state} - ${data.partner.pincode}`, 25, yPos);
  
  yPos += 6;
  if (data.partner.gstNumber) {
    doc.text(`GSTIN: ${data.partner.gstNumber}`, 25, yPos);
  } else {
    doc.text(`PAN: ${data.partner.panNumber}`, 25, yPos);
  }
  
  // Transaction Details
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Transaction Details', 20, yPos);
  
  yPos += 10;
  
  // Table header
  doc.setFillColor(52, 73, 94);
  doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('Description', 25, yPos);
  doc.text('HSN/SAC', 100, yPos);
  doc.text('Amount', pageWidth - 45, yPos, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Calculate amounts
  const baseAmount = data.transaction.amount;
  const cgstRate = 9;
  const sgstRate = 9;
  const cgstAmount = baseAmount * (cgstRate / 100);
  const sgstAmount = baseAmount * (sgstRate / 100);
  const totalAmount = baseAmount + cgstAmount + sgstAmount;
  
  // Table rows
  yPos += 12;
  doc.text(data.transaction.description, 25, yPos);
  doc.text('996812', 100, yPos);
  doc.text(`₹${baseAmount.toLocaleString('en-IN')}`, pageWidth - 25, yPos, { align: 'right' });
  
  yPos += 10;
  doc.text(`CGST @ ${cgstRate}%`, 25, yPos);
  doc.text('', 100, yPos);
  doc.text(`₹${cgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 25, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text(`SGST @ ${sgstRate}%`, 25, yPos);
  doc.text('', 100, yPos);
  doc.text(`₹${sgstAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 25, yPos, { align: 'right' });
  
  // Total
  yPos += 5;
  doc.setLineWidth(0.3);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount', 25, yPos);
  doc.text(`₹${totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, pageWidth - 25, yPos, { align: 'right' });
  
  // Reference
  if (data.transaction.referenceId) {
    yPos += 15;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Reference: ${data.transaction.referenceId.slice(0, 8).toUpperCase()}`, 20, yPos);
  }
  
  // Footer
  yPos = doc.internal.pageSize.getHeight() - 40;
  doc.setLineWidth(0.3);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('This is a computer generated invoice.', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('For support: partners@courierx.in', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Save the PDF
  doc.save(`${data.invoiceNumber}.pdf`);
};

// Default CourierX company details
export const COURIERX_DETAILS = {
  name: 'CourierX Private Limited',
  address: '123 Tech Park, Whitefield, Bangalore, Karnataka 560066',
  gstNumber: '29AABCC1234D1ZV',
  panNumber: 'AABCC1234D',
};
