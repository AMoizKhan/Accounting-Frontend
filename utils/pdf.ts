import { jsPDF } from "jspdf";
import type { Bill, Invoice } from "@/types";

export function downloadInvoicePdf(doc: Invoice, companyName: string) {
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text("Invoice", 14, 18);
  pdf.setFontSize(10);
  pdf.text(companyName || "Company", 14, 26);
  pdf.text(`# ${doc.number}`, 14, 34);
  pdf.text(`Date: ${new Date(doc.date).toLocaleDateString()}`, 14, 40);
  pdf.text(`Customer: ${doc.customerName || "—"}`, 14, 46);
  pdf.text(`Status: ${doc.status}`, 14, 52);
  let y = 62;
  pdf.text("Items", 14, y);
  y += 6;
  for (const row of doc.items || []) {
    const line = `${row.description || "—"}  qty ${row.quantity} @ ${row.unitPrice}  tax ${row.taxRate}%`;
    pdf.text(line, 14, y);
    y += 6;
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
  }
  y += 4;
  pdf.text(`Subtotal: ${doc.subtotal?.toFixed(2)}`, 14, y);
  y += 6;
  pdf.text(`Tax: ${doc.taxTotal?.toFixed(2)}`, 14, y);
  y += 6;
  pdf.text(`Total: ${doc.total?.toFixed(2)}`, 14, y);
  pdf.save(`invoice-${doc.number}.pdf`);
}

export function downloadBillPdf(doc: Bill, companyName: string) {
  const pdf = new jsPDF();
  pdf.setFontSize(16);
  pdf.text("Bill", 14, 18);
  pdf.setFontSize(10);
  pdf.text(companyName || "Company", 14, 26);
  pdf.text(`# ${doc.number}`, 14, 34);
  pdf.text(`Date: ${new Date(doc.date).toLocaleDateString()}`, 14, 40);
  pdf.text(`Vendor: ${doc.supplierName || "—"}`, 14, 46);
  pdf.text(`Status: ${doc.status}`, 14, 52);
  let y = 62;
  pdf.text("Items", 14, y);
  y += 6;
  for (const row of doc.items || []) {
    const line = `${row.description || "—"}  qty ${row.quantity} @ ${row.unitPrice}  tax ${row.taxRate}%`;
    pdf.text(line, 14, y);
    y += 6;
    if (y > 270) {
      pdf.addPage();
      y = 20;
    }
  }
  y += 4;
  pdf.text(`Subtotal: ${doc.subtotal?.toFixed(2)}`, 14, y);
  y += 6;
  pdf.text(`Tax: ${doc.taxTotal?.toFixed(2)}`, 14, y);
  y += 6;
  pdf.text(`Total: ${doc.total?.toFixed(2)}`, 14, y);
  pdf.save(`bill-${doc.number}.pdf`);
}
