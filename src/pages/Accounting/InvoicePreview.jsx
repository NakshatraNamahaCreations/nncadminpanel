import { useRef } from "react";
import html2pdf from "html2pdf.js";
import nncLogo from "../../assets/nnclogo.png";
import "./InvoicePreview.css";

export const OFFICES = {
  Mysore: {
    name: "Nakshatra Namaha Creations",
    address: "No. 472, Kantharaj Urs Road, Saraswathipuram",
    city: "Mysore", state: "Karnataka", pincode: "570009",
    phone: "+91 97408 75291",
    email: "info@nakshatranamaha.com",
    gstin: "29AABCN1234A1ZX",
  },
  Bangalore: {
    name: "Nakshatra Namaha Creations",
    address: "No. 123, 3rd Floor, Residency Road, Richmond Town",
    city: "Bangalore", state: "Karnataka", pincode: "560025",
    phone: "+91 97408 75291",
    email: "bangalore@nakshatranamaha.com",
    gstin: "29AABCN1234A1ZY",
  },
  Mumbai: {
    name: "Nakshatra Namaha Creations",
    address: "Office 402, 4th Floor, Veera Desai Road, Andheri West",
    city: "Mumbai", state: "Maharashtra", pincode: "400058",
    phone: "+91 97408 75291",
    email: "mumbai@nakshatranamaha.com",
    gstin: "27AABCN1234A1ZX",
  },
};

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" });
}
function fmtNum(n) {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n) || 0);
}

export default function InvoicePreview({ invoice, offices: officesProp, onBack }) {
  const paperRef   = useRef(null);
  const officesMap = officesProp || OFFICES;
  const office     = officesMap[invoice.officeLocation] || officesMap.Bangalore || Object.values(officesMap)[0];
  const isProforma = invoice.type === "proforma";

  /* UPI QR — uses public qrserver.com API, no npm required */
  const upi = invoice.bankDetails?.upiId;
  const qrData = upi
    ? `upi://pay?pa=${upi}&pn=${encodeURIComponent(office.name)}&am=${invoice.totalAmount}&tn=${invoice.invoiceNumber}&cu=INR`
    : null;
  const qrUrl = qrData
    ? `https://api.qrserver.com/v1/create-qr-code/?size=150x150&bgcolor=ffffff&color=0f172a&qzone=1&data=${encodeURIComponent(qrData)}`
    : null;

  /* Print → browser print (whole page) */
  const handlePrint = () => window.print();

  /* Download → html2pdf targets only the invoice paper element */
  const handleDownload = async () => {
    const element = paperRef.current;
    if (!element) return;
    const filename = `${invoice.invoiceNumber} - ${invoice.clientName}.pdf`;
    await html2pdf()
      .set({
        filename,
        margin: [5, 8, 5, 8],
        image: { type: "png" },
        html2canvas: {
          scale: 4,
          useCORS: true,
          logging: false,
          allowTaint: true,
          letterRendering: true,
          dpi: 300,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: false },
      })
      .from(element)
      .save();
  };

  const bankOk = invoice.bankDetails?.accountNumber || invoice.bankDetails?.upiId;

  return (
    <div className="ip-page">

      {/* ── Sticky action toolbar (hidden on print) ── */}
      <div className="ip-actions no-print">
        <div className="ip-act-left">
          <button type="button" className="ip-back-btn" onClick={onBack}>← Back</button>
          <span className="ip-toolbar-title">{invoice.invoiceNumber}</span>
        </div>
        <div className="ip-act-right">
          <span className={`ip-inv-type-badge ${isProforma ? "prf" : "tax"}`}>
            {isProforma ? "Proforma Invoice" : "Tax Invoice"}
          </span>
          <button type="button" className="ip-dl-btn" onClick={handleDownload}>
            ⬇&nbsp; Download PDF
          </button>
          <button type="button" className="ip-print-btn" onClick={handlePrint}>
            🖨&nbsp; Print
          </button>
        </div>
      </div>

      {/* ── Scrollable paper area ── */}
      <div className="ip-paper-scroll">
        <div className="ip-paper" ref={paperRef}>

          {/* Accent stripe */}
          <div className="ip-accent-bar" />

          {/* ── Header ── */}
          <div className="ip-header">
            <div className="ip-company-col">
              <img src={nncLogo} alt="NNC"
                style={{ height: "20px", width: "20px", display: "block", objectFit: "contain", flexShrink: 0 }} />
              <div className="ip-company-name">{office.name}</div>
              <div className="ip-company-line">{office.address}</div>
              <div className="ip-company-line">{office.city}, {office.state} — {office.pincode}</div>
              <div className="ip-company-line">📞 {office.phone} &nbsp;|&nbsp; ✉ {office.email}</div>
              <div className="ip-company-line">GSTIN: <strong>{office.gstin}</strong></div>
            </div>
            <div className="ip-meta-col">
              <div className={`ip-inv-title ${isProforma ? "" : "tax-color"}`}>
                {isProforma ? "PROFORMA INVOICE" : "TAX INVOICE"}
              </div>
              <table className="ip-meta-tbl">
                <tbody>
                  <tr>
                    <td>Invoice No.</td>
                    <td>{invoice.invoiceNumber}</td>
                  </tr>
                  <tr>
                    <td>Date</td>
                    <td>{fmtDate(invoice.invoiceDate)}</td>
                  </tr>
                  {isProforma && invoice.validUntil && (
                    <tr>
                      <td>Valid Until</td>
                      <td>{fmtDate(invoice.validUntil)}</td>
                    </tr>
                  )}
                  {!isProforma && invoice.dueDate && (
                    <tr>
                      <td>Due Date</td>
                      <td>{fmtDate(invoice.dueDate)}</td>
                    </tr>
                  )}
                  {invoice.proformaNumber && (
                    <tr>
                      <td>Against Proforma</td>
                      <td>{invoice.proformaNumber}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Bill To / Place of Supply ── */}
          <div className="ip-parties">
            <div className="ip-bill-to">
              <div className="ip-sec-label">Bill To</div>
              <div className="ip-client-name">{invoice.clientName}</div>
              {invoice.clientBusiness && <div className="ip-client-biz">{invoice.clientBusiness}</div>}
              {invoice.clientAddress  && <div className="ip-client-line">{invoice.clientAddress}</div>}
              {(invoice.clientCity || invoice.clientState) && (
                <div className="ip-client-line">
                  {[invoice.clientCity, invoice.clientState, invoice.clientPincode].filter(Boolean).join(", ")}
                </div>
              )}
              {invoice.clientPhone && <div className="ip-client-line">📞 {invoice.clientPhone}</div>}
              {invoice.clientEmail && <div className="ip-client-line">✉ {invoice.clientEmail}</div>}
              {invoice.clientGST   && <div className="ip-client-line">GSTIN: <strong>{invoice.clientGST}</strong></div>}
              {invoice.clientPAN   && <div className="ip-client-line">PAN: {invoice.clientPAN}</div>}
            </div>
            <div className="ip-supply-col">
              <div className="ip-sec-label">Place of Supply</div>
              <div className="ip-supply-state">{invoice.clientState || office.state}</div>
              {Number(invoice.igstAmt) > 0 && (
                <div className="ip-igst-note">Inter-state · IGST applicable</div>
              )}
            </div>
          </div>

          {/* ── Line items ── */}
          <div className="ip-items-tbl-wrap">
          <table className="ip-items-tbl">
            <thead>
              <tr>
                <th className="ip-th-num">#</th>
                <th>Description of Services / Goods</th>
                <th className="ip-th-center">HSN / SAC</th>
                <th className="ip-th-center">Qty</th>
                <th className="ip-th-right">Rate (₹)</th>
                <th className="ip-th-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).map((item, i) => (
                <tr key={i}>
                  <td className="ip-td-center" style={{ fontWeight: 700, color: "#94a3b8" }}>{i + 1}</td>
                  <td className="ip-td-desc">{item.description}</td>
                  <td className="ip-td-center">{item.hsn || "9983"}</td>
                  <td className="ip-td-center">{item.quantity}</td>
                  <td className="ip-td-right">{fmtNum(item.rate)}</td>
                  <td className="ip-td-right" style={{ fontSize: 13 }}>{fmtNum(item.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>{/* ip-items-tbl-wrap */}

          {/* ── Totals ── */}
          <div className="ip-totals-wrap">
            <div className="ip-totals-box">
              <div className="ip-tot-row">
                <span>Sub Total</span>
                <span>₹ {fmtNum(invoice.subtotal)}</span>
              </div>
              {Number(invoice.discountAmt) > 0 && (
                <div className="ip-tot-row">
                  <span>Discount {invoice.discountPct > 0 ? `(${invoice.discountPct}%)` : ""}</span>
                  <span style={{ color: "#dc2626" }}>− ₹ {fmtNum(invoice.discountAmt)}</span>
                </div>
              )}
              <div className="ip-tot-row">
                <span>Taxable Amount</span>
                <span>₹ {fmtNum(invoice.taxableAmount)}</span>
              </div>
              {Number(invoice.cgstAmt) > 0 && (
                <div className="ip-tot-row">
                  <span>CGST @ {invoice.cgstPct}%</span>
                  <span>₹ {fmtNum(invoice.cgstAmt)}</span>
                </div>
              )}
              {Number(invoice.sgstAmt) > 0 && (
                <div className="ip-tot-row">
                  <span>SGST @ {invoice.sgstPct}%</span>
                  <span>₹ {fmtNum(invoice.sgstAmt)}</span>
                </div>
              )}
              {Number(invoice.igstAmt) > 0 && (
                <div className="ip-tot-row">
                  <span>IGST @ {invoice.igstPct}%</span>
                  <span>₹ {fmtNum(invoice.igstAmt)}</span>
                </div>
              )}
              <div className="ip-tot-row grand">
                <span>Total Amount</span>
                <span>₹ {fmtNum(invoice.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* ── Amount in words ── */}
          <div className="ip-words">
            <strong>Amount in Words:</strong>&nbsp; {invoice.amountInWords}
          </div>

          {/* ── Bank details + QR ── */}
          {bankOk && (
            <div className="ip-bank-qr">
              <div className="ip-bank">
                <div className="ip-sec-label">Bank Details — Payment Instructions</div>
                {invoice.bankDetails?.accountName   && <div className="ip-bank-row"><span>Account Name</span><span>{invoice.bankDetails.accountName}</span></div>}
                {invoice.bankDetails?.accountNumber && <div className="ip-bank-row"><span>Account No.</span><span><strong style={{ fontFamily: "'Courier New', monospace" }}>{invoice.bankDetails.accountNumber}</strong></span></div>}
                {invoice.bankDetails?.ifscCode      && <div className="ip-bank-row"><span>IFSC Code</span><span><strong style={{ fontFamily: "'Courier New', monospace" }}>{invoice.bankDetails.ifscCode}</strong></span></div>}
                {invoice.bankDetails?.bankName      && (
                  <div className="ip-bank-row">
                    <span>Bank &amp; Branch</span>
                    <span>{invoice.bankDetails.bankName}{invoice.bankDetails.branchName ? `, ${invoice.bankDetails.branchName}` : ""}</span>
                  </div>
                )}
                {invoice.bankDetails?.upiId && (
                  <div className="ip-bank-row">
                    <span>UPI ID</span>
                    <span><strong style={{ fontFamily: "'Courier New', monospace" }}>{invoice.bankDetails.upiId}</strong></span>
                  </div>
                )}
              </div>
              {qrUrl && (
                <div className="ip-qr-col">
                  <img src={qrUrl} alt="Scan to Pay" className="ip-qr-img" />
                  <div className="ip-qr-label">Scan &amp; Pay</div>
                  <div className="ip-qr-upi">{invoice.bankDetails.upiId}</div>
                </div>
              )}
            </div>
          )}

          {/* ── Terms ── */}
          {invoice.termsAndConditions && (
            <div className="ip-terms">
              <div className="ip-sec-label">Terms &amp; Conditions</div>
              <pre className="ip-terms-text">{invoice.termsAndConditions}</pre>
            </div>
          )}

          {/* ── Notes ── */}
          {invoice.notes && (
            <div className="ip-notes">
              <div className="ip-sec-label">Notes</div>
              <div className="ip-notes-text">{invoice.notes}</div>
            </div>
          )}

          {/* ── Signature ── */}
          <div className="ip-sig-row">
            <div className="ip-sig-block">
              <div className="ip-sig-company">For {office.name}</div>
              <div className="ip-sig-line" />
              <div className="ip-sig-label">Authorised Signatory</div>
            </div>
            <div className="ip-stamp-block">
              <div className="ip-stamp-circle">
                <span>Company</span>
                <span>Seal</span>
              </div>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="ip-footer-note">
            This is a computer-generated document. {isProforma ? "This proforma invoice is not a demand for payment." : "Thank you for your business."}
            &nbsp;· Generated by NNC CRM
          </div>

        </div>{/* end ip-paper */}
      </div>{/* end ip-paper-scroll */}
    </div>
  );
}
