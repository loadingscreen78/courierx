import jsPDF from 'jspdf';

interface BillData {
  billNumber: string;
  createdAt: string;
  partner: {
    businessName: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
    gstNumber?: string | null;
  };
  customer: {
    name: string;
    phone: string;
    email?: string | null;
  };
  breakdown: {
    baseCost: number;
    partnerMargin: number;
    gstAmount: number;
    totalAmount: number;
  };
  paymentMethod: string;
  shipmentId?: string | null;
  // New: only include GST if partner has GST number
  isGstRegistered?: boolean;
}

export const generateCXBCBillPDF = (data: BillData): void => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  let yPos = 20;
  
  // Header - Business Name
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text(data.partner.businessName, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${data.partner.address}, ${data.partner.city}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`${data.partner.state} - ${data.partner.pincode}`, pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Phone: ${data.partner.phone}`, pageWidth / 2, yPos, { align: 'center' });
  
  if (data.partner.gstNumber) {
    yPos += 5;
    doc.text(`GSTIN: ${data.partner.gstNumber}`, pageWidth / 2, yPos, { align: 'center' });
  }
  
  // Divider
  yPos += 10;
  doc.setLineWidth(0.5);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  // Bill Details
  yPos += 10;
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CUSTOMER INVOICE', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 12;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // Bill info in two columns
  doc.text('Bill No:', 20, yPos);
  doc.setFont('helvetica', 'bold');
  doc.text(data.billNumber, 60, yPos);
  
  doc.setFont('helvetica', 'normal');
  doc.text('Date:', 120, yPos);
  doc.text(new Date(data.createdAt).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }), 145, yPos);
  
  // Customer Details Section
  yPos += 15;
  doc.setFillColor(245, 245, 245);
  doc.rect(20, yPos - 5, pageWidth - 40, 25, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.text('Customer Details', 25, yPos);
  
  yPos += 8;
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${data.customer.name}`, 25, yPos);
  
  yPos += 6;
  doc.text(`Phone: ${data.customer.phone}`, 25, yPos);
  
  if (data.customer.email) {
    yPos += 6;
    doc.text(`Email: ${data.customer.email}`, 25, yPos);
  }
  
  // Cost Breakdown
  yPos += 20;
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Breakdown', 20, yPos);
  
  yPos += 10;
  
  // Table header
  doc.setFillColor(52, 73, 94);
  doc.rect(20, yPos - 5, pageWidth - 40, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text('Description', 25, yPos);
  doc.text('Amount', pageWidth - 45, yPos, { align: 'right' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  
  // Table rows
  yPos += 12;
  doc.text('Base Shipping Cost', 25, yPos);
  doc.text(`₹${data.breakdown.baseCost.toLocaleString('en-IN')}`, pageWidth - 25, yPos, { align: 'right' });
  
  yPos += 8;
  doc.text('Service Fee', 25, yPos);
  doc.text(`₹${data.breakdown.partnerMargin.toLocaleString('en-IN')}`, pageWidth - 25, yPos, { align: 'right' });
  
  // Only show GST if partner is GST registered
  const showGst = data.isGstRegistered !== false && data.partner.gstNumber;
  if (showGst) {
    yPos += 8;
    doc.text('GST (18%)', 25, yPos);
    doc.text(`₹${data.breakdown.gstAmount.toLocaleString('en-IN')}`, pageWidth - 25, yPos, { align: 'right' });
  }
  
  // Total
  yPos += 5;
  doc.setLineWidth(0.3);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Amount', 25, yPos);
  
  // Calculate total based on GST status
  const displayTotal = showGst 
    ? data.breakdown.totalAmount 
    : data.breakdown.baseCost + data.breakdown.partnerMargin;
  doc.text(`₹${displayTotal.toLocaleString('en-IN')}`, pageWidth - 25, yPos, { align: 'right' });
  
  // If not GST registered, show note
  if (!showGst) {
    yPos += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(128, 128, 128);
    doc.text('* Non-taxable invoice', 25, yPos);
    doc.setTextColor(0, 0, 0);
  }
  
  // Payment Method
  yPos += 15;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Payment Method: ${data.paymentMethod.toUpperCase()}`, 20, yPos);
  
  // Shipment ID if available
  if (data.shipmentId) {
    yPos += 8;
    doc.text(`Shipment ID: ${data.shipmentId.slice(0, 8).toUpperCase()}`, 20, yPos);
  }
  
  // Footer
  yPos = doc.internal.pageSize.getHeight() - 30;
  doc.setLineWidth(0.3);
  doc.line(20, yPos, pageWidth - 20, yPos);
  
  yPos += 10;
  doc.setFontSize(9);
  doc.setTextColor(128, 128, 128);
  doc.text('Thank you for choosing CourierX!', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text('For support, contact: support@courierx.in', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 5;
  doc.text(`Generated on ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, yPos, { align: 'center' });
  
  // Save the PDF
  doc.save(`${data.billNumber}.pdf`);
};
