import { useEffect, useState } from "react";
import { X, Upload, ExternalLink, FileText, Image, RefreshCcw } from "lucide-react";
import { toast } from "../../utils/toast";

const API  = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
function auth() { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; }

const money  = (n) => n ? `₹${Number(n).toLocaleString("en-IN")}` : "₹0";
const fmtDate = (v) => v ? new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const MODE_COLOR = { NEFT:"#3b82f6", RTGS:"#8b5cf6", UPI:"#10b981", Cheque:"#f59e0b", Cash:"#64748b", IMPS:"#ef4444", Wire:"#0ea5e9" };
const INV_STATUS_COLOR = { draft:"#94a3b8", sent:"#3b82f6", approved:"#10b981", converted:"#8b5cf6", paid:"#059669", cancelled:"#ef4444" };

export default function ClientHistoryDrawer({ clientId, onClose }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState({});
  const [editing, setEditing]   = useState({});  // { [payId]: { transactionId, remarks } }

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/api/payment-tracker/clients/${clientId}/history`, { headers: auth() });
      const json = await res.json();
      if (json.success) setData(json);
      else toast.error(json.message || "Failed to load");
    } catch { toast.error("Failed to load"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (clientId) fetchHistory(); }, [clientId]);

  const uploadFile = async (paymentId, type, file) => {
    const key = `${paymentId}-${type}`;
    setUploading(u => ({ ...u, [key]: true }));
    try {
      const fd = new FormData(); fd.append("file", file);
      const endpoint = type === "proof" ? "upload-proof" : "upload-invoice";
      const res  = await fetch(`${API}/api/payment-tracker/payments/${paymentId}/${endpoint}`, {
        method: "POST", headers: auth(), body: fd,
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.message || "Upload failed"); return; }
      toast.success(type === "proof" ? "Payment proof uploaded" : "Invoice uploaded");
      fetchHistory();
    } catch { toast.error("Upload failed"); }
    finally { setUploading(u => { const n={...u}; delete n[key]; return n; }); }
  };

  const saveEdits = async (paymentId) => {
    const ed = editing[paymentId];
    if (!ed) return;
    try {
      const res  = await fetch(`${API}/api/payment-tracker/payments/${paymentId}`, {
        method: "PATCH",
        headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify(ed),
      });
      const json = await res.json();
      if (!json.success) { toast.error(json.message || "Save failed"); return; }
      toast.success("Saved");
      setEditing(e => { const n={...e}; delete n[paymentId]; return n; });
      fetchHistory();
    } catch { toast.error("Save failed"); }
  };

  if (!clientId) return null;

  return (
    <div className="chd-overlay" onClick={onClose}>
      <div className="chd-drawer" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="chd-header">
          <div>
            <div className="chd-title">{data?.client?.client || "Payment History"}</div>
            {data?.client && (
              <div className="chd-subtitle">{data.client.project || ""} · {data.client.city || ""}</div>
            )}
          </div>
          <button className="chd-close" onClick={onClose}><X size={18} /></button>
        </div>

        {loading ? (
          <div className="chd-loading"><RefreshCcw size={24} className="chd-spin" /></div>
        ) : data && (
          <div className="chd-body">

            {/* Summary strip */}
            <div className="chd-summary">
              <div className="chd-sum-card">
                <div className="chd-sum-label">Total Value</div>
                <div className="chd-sum-val blue">{money(data.client.totalValue)}</div>
              </div>
              <div className="chd-sum-card">
                <div className="chd-sum-label">Received</div>
                <div className="chd-sum-val green">{money(data.client.received)}</div>
              </div>
              <div className="chd-sum-card">
                <div className="chd-sum-label">Balance</div>
                <div className="chd-sum-val red">{money((data.client.totalValue || 0) - (data.client.received || 0))}</div>
              </div>
            </div>

            {/* ── Linked Invoices ── */}
            <div className="chd-section-title">
              <FileText size={14} /> Invoices from CRM
            </div>
            {data.invoices?.length === 0 ? (
              <div className="chd-empty-note">No invoices generated from CRM for this client.</div>
            ) : (
              <div className="chd-invoice-list">
                {data.invoices.map(inv => (
                  <div key={inv._id} className="chd-invoice-row">
                    <div className="chd-inv-left">
                      <span className="chd-inv-num">{inv.invoiceNumber}</span>
                      <span className="chd-inv-type" style={{ background: inv.type === "tax" ? "#dbeafe" : "#fef3c7", color: inv.type === "tax" ? "#1d4ed8" : "#92400e" }}>
                        {inv.type === "tax" ? "Tax Invoice" : "Proforma"}
                      </span>
                      <span className="chd-inv-status" style={{ color: INV_STATUS_COLOR[inv.status] || "#64748b" }}>
                        {inv.status}
                      </span>
                    </div>
                    <div className="chd-inv-right">
                      <span className="chd-inv-amt">{money(inv.finalizedAmount || inv.totalAmount || inv.quotedAmount)}</span>
                      <span className="chd-inv-date">{fmtDate(inv.invoiceDate)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ── Payment History ── */}
            <div className="chd-section-title" style={{ marginTop: 20 }}>
              💳 Payment Transactions
            </div>
            {data.payments?.length === 0 ? (
              <div className="chd-empty-note">No payments recorded yet.</div>
            ) : (
              <div className="chd-payment-list">
                {data.payments.map(pay => {
                  const isEditing = !!editing[pay._id];
                  const ed = editing[pay._id] || {};
                  return (
                    <div key={pay._id} className="chd-pay-card">
                      {/* Pay card header */}
                      <div className="chd-pay-header">
                        <div className="chd-pay-left">
                          <span className="chd-pay-amt">{money(pay.amount)}</span>
                          <span className="chd-pay-mode" style={{ background: MODE_COLOR[pay.mode] + "22", color: MODE_COLOR[pay.mode] }}>
                            {pay.mode}
                          </span>
                          <span className="chd-pay-date">{fmtDate(pay.date)}</span>
                        </div>
                        {pay.tds && (
                          <span className="chd-pay-tds">TDS ₹{pay.tdsAmt?.toLocaleString("en-IN")}</span>
                        )}
                      </div>

                      {/* Account */}
                      {pay.account && (
                        <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#1d4ed8", background: "#dbeafe", padding: "3px 8px", borderRadius: 5, marginBottom: 6, width: "fit-content" }}>
                          🏦 {pay.account.name}{pay.account.bankName ? ` · ${pay.account.bankName}` : ""}
                        </div>
                      )}

                      {/* Transaction ID + Remarks */}
                      {isEditing ? (
                        <div className="chd-pay-edit">
                          <input
                            className="chd-input"
                            placeholder="Transaction ID / UTR"
                            value={ed.transactionId ?? pay.transactionId ?? ""}
                            onChange={e => setEditing(prev => ({ ...prev, [pay._id]: { ...prev[pay._id], transactionId: e.target.value } }))}
                          />
                          <input
                            className="chd-input"
                            placeholder="Remarks"
                            value={ed.remarks ?? pay.remarks ?? ""}
                            onChange={e => setEditing(prev => ({ ...prev, [pay._id]: { ...prev[pay._id], remarks: e.target.value } }))}
                          />
                          <div className="chd-edit-btns">
                            <button className="chd-btn-save" onClick={() => saveEdits(pay._id)}>Save</button>
                            <button className="chd-btn-cancel" onClick={() => setEditing(e => { const n={...e}; delete n[pay._id]; return n; })}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="chd-pay-meta" onClick={() => setEditing(e => ({ ...e, [pay._id]: {} }))}>
                          {pay.transactionId
                            ? <span className="chd-txn-id">Txn: {pay.transactionId}</span>
                            : <span className="chd-txn-placeholder">+ Add Transaction ID</span>}
                          {pay.remarks && <span className="chd-pay-remarks">{pay.remarks}</span>}
                        </div>
                      )}

                      {/* Linked CRM invoice */}
                      {pay.invoiceId && (
                        <div className="chd-pay-linked-inv">
                          <FileText size={11} /> Linked: {pay.invoiceId.invoiceNumber} ({pay.invoiceId.type})
                        </div>
                      )}

                      {/* Attachments */}
                      <div className="chd-attachments">
                        {/* Payment proof */}
                        <div className="chd-attach-item">
                          {pay.paymentProof ? (
                            <a className="chd-attach-view" href={`${API}/uploads/payment-proofs/${pay.paymentProof}`} target="_blank" rel="noreferrer">
                              <Image size={12} /> View Proof
                            </a>
                          ) : (
                            <label className="chd-upload-btn" title="Upload payment screenshot">
                              {uploading[`${pay._id}-proof`]
                                ? <RefreshCcw size={11} className="chd-spin" />
                                : <><Upload size={11} /> Payment Proof</>}
                              <input type="file" accept="image/*,application/pdf" hidden
                                onChange={e => e.target.files[0] && uploadFile(pay._id, "proof", e.target.files[0])} />
                            </label>
                          )}
                        </div>

                        {/* Invoice */}
                        <div className="chd-attach-item">
                          {pay.uploadedInvoicePath ? (
                            <a className="chd-attach-view" href={`${API}/uploads/payment-invoices/${pay.uploadedInvoicePath}`} target="_blank" rel="noreferrer">
                              <ExternalLink size={12} /> View Invoice
                            </a>
                          ) : !pay.invoiceId && (
                            <label className="chd-upload-btn" title="Upload invoice">
                              {uploading[`${pay._id}-invoice`]
                                ? <RefreshCcw size={11} className="chd-spin" />
                                : <><Upload size={11} /> Upload Invoice</>}
                              <input type="file" accept="image/*,application/pdf" hidden
                                onChange={e => e.target.files[0] && uploadFile(pay._id, "invoice", e.target.files[0])} />
                            </label>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
