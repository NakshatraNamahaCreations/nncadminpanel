import { useCallback, useEffect, useRef, useState } from "react";
import {
  Plus, Search, Eye, Edit2, Trash2, Send, RefreshCcw,
  ChevronLeft, ChevronRight, FileText, CheckCircle2, XCircle,
  Clock, AlertCircle, PlusCircle, Minus, Download, MessageSquare,
  GitBranch, ArrowRight, TrendingUp, Receipt,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { toast } from "../../utils/toast";
import nncLogo from "../../assets/nnclogo.png";
import "./QuotationPage.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const isMasterAdmin = () => localStorage.getItem("nnc_role") === "master_admin";
const getUser = () => localStorage.getItem("nnc_name") || "Admin";

const BRANCHES = ["Bangalore", "Mysore", "Mumbai"];

const BRANCH_INFO = {
  Bangalore: { addr: "No. 45, 2nd Floor, HSR Layout, Bengaluru – 560102", phone: "+91 99005 66466" },
  Mysore:    { addr: "Saraswathipuram, Mysuru – 570009",                   phone: "+91 99005 66466" },
  Mumbai:    { addr: "Andheri East, Mumbai – 400069",                      phone: "+91 99005 66466" },
};

const NNC_GSTIN = "29AABCN1234F1Z5";

const STATUS_META = {
  draft:            { label: "Draft",             color: "gray"   },
  sent:             { label: "Sent",              color: "blue"   },
  under_negotiation:{ label: "Negotiating",       color: "amber"  },
  approved:         { label: "Approved",          color: "green"  },
  rejected:         { label: "Rejected",          color: "red"    },
  final:            { label: "Final",             color: "indigo" },
  converted:        { label: "Converted to PI",   color: "teal"   },
  expired:          { label: "Expired",           color: "orange" },
};

const PI_STATUS_META = {
  draft:     { label: "Draft",     color: "gray"  },
  sent:      { label: "Sent",      color: "blue"  },
  paid:      { label: "Paid",      color: "green" },
  cancelled: { label: "Cancelled", color: "red"   },
};

const STATUSES = Object.keys(STATUS_META);
const EMPTY_ITEM = { description: "", qty: 1, rate: 0, amount: 0 };

const EMPTY_FORM = {
  clientName: "", clientPhone: "", clientEmail: "", clientCompany: "",
  clientAddress: "", clientGstin: "",
  senderEmail: "",
  branch: "Bangalore", enquiryId: "", status: "draft",
  lineItems: [{ ...EMPTY_ITEM }],
  discount: 0, tax: 18,
  validUntil: "", notes: "", terms: "",
};

function authHeader() {
  const token = localStorage.getItem("nnc_token");
  return token
    ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
    : { "Content-Type": "application/json" };
}

function fmt(n) {
  return Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0 });
}

function calcTotals(items = [], discount = 0, tax = 0) {
  const subtotal   = items.reduce((s, it) => s + Number(it.amount || 0), 0);
  const discounted = Math.max(0, subtotal - Number(discount));
  const gstAmt     = (discounted * Number(tax)) / 100;
  return { subtotal, gstAmt, total: discounted + gstAmt };
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ────────────────────────────────────────────────────────────────
   ENTERPRISE DOCUMENT COMPONENT (also used for PDF print)
──────────────────────────────────────────────────────────────────*/
function QuotationDocument({ q, isProforma = false }) {
  const bi = BRANCH_INFO[q.branch] || BRANCH_INFO.Bangalore;
  const gstAmt = ((q.subtotal - q.discount) * q.tax) / 100;

  return (
    <div className="qt-doc" id="qt-pdf-target">
      {/* Header */}
      <div className="qt-doc-header">
        <div className="qt-doc-brand">
          <img src={nncLogo} alt="NNC" className="qt-doc-logo" />
          <div>
            <div className="qt-doc-company">Nakshatra Namaha Creations Pvt. Ltd.</div>
            <div className="qt-doc-tagline">Bengaluru · Mysuru · Mumbai</div>
          </div>
        </div>
        <div className="qt-doc-title-block">
          <div className="qt-doc-type">{isProforma ? "PROFORMA INVOICE" : "QUOTATION"}</div>
          <div className="qt-doc-num">{isProforma ? q.proformaNumber : q.quoteNumber}</div>
          {isProforma && q.quoteNumber && (
            <div className="qt-doc-ref">Ref: {q.quoteNumber}</div>
          )}
          {!isProforma && q.revisionNumber > 1 && (
            <div className="qt-doc-rev">Revision {q.revisionNumber}</div>
          )}
        </div>
      </div>

      {/* Bill To / Details */}
      <div className="qt-doc-meta">
        <div className="qt-doc-billto">
          <div className="qt-doc-meta-label">Bill To</div>
          <div className="qt-doc-client-name">{q.clientName}</div>
          {q.clientCompany && <div className="qt-doc-client-co">{q.clientCompany}</div>}
          {q.clientAddress && <div className="qt-doc-client-addr">{q.clientAddress}</div>}
          {q.clientPhone   && <div className="qt-doc-client-contact">📞 {q.clientPhone}</div>}
          {q.clientEmail   && <div className="qt-doc-client-contact">✉ {q.clientEmail}</div>}
          {q.clientGstin   && <div className="qt-doc-client-gstin">GSTIN: {q.clientGstin}</div>}
        </div>
        <div className="qt-doc-details">
          <div className="qt-doc-meta-label">{isProforma ? "Invoice Details" : "Quotation Details"}</div>
          <table className="qt-doc-detail-tbl">
            <tbody>
              <tr><td>Date</td><td>{fmtDate(new Date())}</td></tr>
              {!isProforma && q.validUntil && <tr><td>Valid Until</td><td>{fmtDate(q.validUntil)}</td></tr>}
              {isProforma  && q.deliveryDate && <tr><td>Delivery</td><td>{fmtDate(q.deliveryDate)}</td></tr>}
              {isProforma  && q.paymentTerms && <tr><td>Payment</td><td>{q.paymentTerms}</td></tr>}
              <tr><td>Branch</td><td>{q.branch}</td></tr>
              <tr><td>Our GSTIN</td><td>{NNC_GSTIN}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Items */}
      <table className="qt-doc-items">
        <thead>
          <tr>
            <th className="col-sno">#</th>
            <th className="col-desc">Description</th>
            <th className="col-qty">Qty</th>
            <th className="col-rate">Rate (₹)</th>
            <th className="col-amt">Amount (₹)</th>
          </tr>
        </thead>
        <tbody>
          {(q.lineItems || []).map((item, i) => (
            <tr key={i}>
              <td className="col-sno">{i + 1}</td>
              <td className="col-desc">{item.description || "—"}</td>
              <td className="col-qty">{item.qty}</td>
              <td className="col-rate">{fmt(item.rate)}</td>
              <td className="col-amt">{fmt(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="qt-doc-totals">
        <div />
        <div className="qt-doc-total-rows">
          <div className="qt-doc-total-row"><span>Subtotal</span><span>₹{fmt(q.subtotal)}</span></div>
          {q.discount > 0 && <div className="qt-doc-total-row disc"><span>Discount</span><span>− ₹{fmt(q.discount)}</span></div>}
          {q.tax > 0 && <div className="qt-doc-total-row"><span>GST ({q.tax}%)</span><span>₹{fmt(gstAmt)}</span></div>}
          <div className="qt-doc-total-row grand"><span>Total</span><span>₹{fmt(q.total)}</span></div>
        </div>
      </div>

      {/* Notes / Terms */}
      {q.notes && (
        <div className="qt-doc-box notes-box">
          <div className="qt-doc-box-label">Notes</div>
          <div className="qt-doc-box-body">{q.notes}</div>
        </div>
      )}
      {q.terms && (
        <div className="qt-doc-box terms-box">
          <div className="qt-doc-box-label">Terms &amp; Conditions</div>
          <div className="qt-doc-box-body">{q.terms}</div>
        </div>
      )}

      {/* Signature + Footer */}
      <div className="qt-doc-footer">
        <div className="qt-doc-sig">
          <div className="qt-doc-sig-line" />
          <div className="qt-doc-sig-label">Authorised Signatory</div>
          <div className="qt-doc-sig-co">NNC Nakshatra Namaha Creations</div>
        </div>
        <div className="qt-doc-footer-info">
          <div className="qt-doc-footer-co">NNC Nakshatra Namaha Creations Pvt. Ltd.</div>
          <div className="qt-doc-footer-addr">{bi.addr}</div>
          <div className="qt-doc-footer-phone">{bi.phone} · nakshatranamahacreations.com</div>
          <div className="qt-doc-footer-gstin">GSTIN: {NNC_GSTIN}</div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   MAIN PAGE
──────────────────────────────────────────────────────────────────*/
export default function QuotationPage() {
  const [mode, setMode] = useState("list"); // list | form | view | proforma-view
  const [quotations, setQuotations] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, byStatus: {}, thisMonth: 0, acceptedValue: 0, conversionRate: 0 });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [filters, setFilters] = useState({ status: "", branch: "", q: "", page: 1 });
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [viewingProforma, setViewingProforma] = useState(null);

  // Negotiation panel
  const [negotiationNote, setNegotiationNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  // Revision form
  const [showRevisionForm, setShowRevisionForm] = useState(false);
  const [revFormData, setRevFormData] = useState(null);

  // Convert to Proforma
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [convertData, setConvertData] = useState({ deliveryDate: "", paymentTerms: "50% advance, 50% on delivery" });
  const [converting, setConverting] = useState(false);

  // Enquiry search (for form)
  const [enquirySearch, setEnquirySearch] = useState("");
  const [enquirySuggestions, setEnquirySuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const enquirySearchTimer = useRef(null);

  const pdfRef = useRef(null);

  const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v, page: 1 }));

  /* ─── Fetch list ─── */
  const fetchQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filters.status) p.set("status", filters.status);
      if (filters.branch) p.set("branch", filters.branch);
      if (filters.q)      p.set("q", filters.q);
      p.set("page", filters.page);
      p.set("limit", 20);
      const res  = await fetch(`${API}/api/quotations?${p}`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) { setQuotations(json.data); setTotalCount(json.total); }
    } catch { toast.error("Failed to fetch quotations"); }
    finally { setLoading(false); }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/quotations/stats`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch {}
  }, []);

  useEffect(() => { fetchQuotations(); }, [fetchQuotations]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* ─── Enquiry autocomplete ─── */
  const searchEnquiries = (val) => {
    setEnquirySearch(val);
    clearTimeout(enquirySearchTimer.current);
    if (!val.trim()) { setEnquirySuggestions([]); setShowSuggestions(false); return; }
    enquirySearchTimer.current = setTimeout(async () => {
      try {
        const res  = await fetch(`${API}/api/enquiries?q=${encodeURIComponent(val)}&limit=5`, { headers: authHeader() });
        const json = await res.json();
        if (json.success) { setEnquirySuggestions(json.data || []); setShowSuggestions(true); }
      } catch {}
    }, 300);
  };

  const selectEnquiry = (enq) => {
    setFormData(f => ({
      ...f,
      clientName:    enq.name    || f.clientName,
      clientPhone:   enq.phone   || f.clientPhone,
      clientEmail:   enq.email   || f.clientEmail,
      clientCompany: enq.company || f.clientCompany,
      branch:        enq.branch  || f.branch,
      enquiryId:     enq._id,
      services:      enq.services || [],
    }));
    setEnquirySearch(`${enq.name} — ${enq.phone}`);
    setShowSuggestions(false);
  };

  /* ─── Line item helpers ─── */
  const updateItem = (idx, field, val) => {
    setFormData(f => {
      const items = f.lineItems.map((it, i) => {
        if (i !== idx) return it;
        const updated = { ...it, [field]: val };
        if (field === "qty" || field === "rate") {
          updated.amount = Number(updated.qty || 0) * Number(updated.rate || 0);
        }
        return updated;
      });
      return { ...f, lineItems: items };
    });
  };

  const addItem    = () => setFormData(f => ({ ...f, lineItems: [...f.lineItems, { ...EMPTY_ITEM }] }));
  const removeItem = (idx) => setFormData(f => ({
    ...f, lineItems: f.lineItems.length > 1 ? f.lineItems.filter((_, i) => i !== idx) : f.lineItems,
  }));

  const totals = calcTotals(formData.lineItems, formData.discount, formData.tax);

  /* ─── Save quotation ─── */
  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.clientName.trim()) { toast.error("Client name is required"); return; }
    setSaving(true);
    try {
      const url    = editingId ? `${API}/api/quotations/${editingId}` : `${API}/api/quotations`;
      const method = editingId ? "PUT" : "POST";
      const res    = await fetch(url, { method, headers: authHeader(), body: JSON.stringify(formData) });
      const json   = await res.json();
      if (json.success) {
        toast.success(editingId ? "Quotation updated" : "Quotation created");
        backToList();
        fetchQuotations(); fetchStats();
      } else { toast.error(json.message || "Save failed"); }
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  /* ─── Send email ─── */
  const handleSendEmail = async (id) => {
    setSending(true);
    try {
      const res  = await fetch(`${API}/api/quotations/${id}/send`, { method: "POST", headers: authHeader() });
      const json = await res.json();
      if (json.success) {
        toast.success(json.emailSent ? "Quotation emailed to client" : json.message);
        if (viewing?._id === id) {
          const r2 = await fetch(`${API}/api/quotations/${id}`, { headers: authHeader() });
          const j2 = await r2.json();
          if (j2.success) setViewing(j2.data);
        }
        fetchQuotations(); fetchStats();
      } else toast.error(json.message || "Email failed");
    } catch { toast.error("Email failed"); }
    finally { setSending(false); }
  };

  /* ─── Update status ─── */
  const handleStatusChange = async (id, status) => {
    try {
      const res  = await fetch(`${API}/api/quotations/${id}/status`, {
        method: "PATCH", headers: authHeader(), body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Marked as ${STATUS_META[status]?.label || status}`);
        setViewing(json.data);
        fetchQuotations(); fetchStats();
      } else toast.error(json.message || "Status update failed");
    } catch { toast.error("Status update failed"); }
  };

  /* ─── Add negotiation note ─── */
  const handleAddNote = async () => {
    if (!negotiationNote.trim()) { toast.error("Note cannot be empty"); return; }
    setAddingNote(true);
    try {
      const res  = await fetch(`${API}/api/quotations/${viewing._id}/negotiate`, {
        method: "POST", headers: authHeader(),
        body: JSON.stringify({ note: negotiationNote, by: getUser() }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Note added");
        setViewing(json.data);
        setNegotiationNote("");
        fetchQuotations(); fetchStats();
      } else toast.error(json.message || "Failed to add note");
    } catch { toast.error("Failed to add note"); }
    finally { setAddingNote(false); }
  };

  /* ─── Create revision ─── */
  const handleCreateRevision = async () => {
    if (!revFormData) return;
    setSaving(true);
    try {
      const res  = await fetch(`${API}/api/quotations/${viewing._id}/revise`, {
        method: "POST", headers: authHeader(), body: JSON.stringify(revFormData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Revision ${json.data.revisionNumber} created: ${json.data.quoteNumber}`);
        setShowRevisionForm(false);
        setViewing(json.data);
        fetchQuotations(); fetchStats();
      } else toast.error(json.message || "Revision failed");
    } catch { toast.error("Revision failed"); }
    finally { setSaving(false); }
  };

  /* ─── Convert to Proforma ─── */
  const handleConvertToProforma = async () => {
    setConverting(true);
    try {
      const res  = await fetch(`${API}/api/quotations/${viewing._id}/convert-to-proforma`, {
        method: "POST", headers: authHeader(), body: JSON.stringify(convertData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(`Proforma Invoice ${json.data.proformaNumber} created`);
        setShowConvertForm(false);
        // Refresh the quotation
        const r2 = await fetch(`${API}/api/quotations/${viewing._id}`, { headers: authHeader() });
        const j2 = await r2.json();
        if (j2.success) setViewing(j2.data);
        setViewingProforma(json.data);
        setMode("proforma-view");
        fetchQuotations(); fetchStats();
      } else toast.error(json.message || "Conversion failed");
    } catch { toast.error("Conversion failed"); }
    finally { setConverting(false); }
  };

  /* ─── Send Proforma Email ─── */
  const handleSendProformaEmail = async (piId) => {
    setSending(true);
    try {
      const res  = await fetch(`${API}/api/proforma-invoices/${piId}/send`, { method: "POST", headers: authHeader() });
      const json = await res.json();
      if (json.success) {
        toast.success(json.emailSent ? "Proforma emailed to client" : json.message);
        const r2 = await fetch(`${API}/api/proforma-invoices/${piId}`, { headers: authHeader() });
        const j2 = await r2.json();
        if (j2.success) setViewingProforma(j2.data);
      } else toast.error(json.message || "Email failed");
    } catch { toast.error("Email failed"); }
    finally { setSending(false); }
  };

  /* ─── View Proforma from converted quotation ─── */
  const openProformaFromQuotation = async (proformaId) => {
    try {
      const res  = await fetch(`${API}/api/proforma-invoices/${proformaId}`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) { setViewingProforma(json.data); setMode("proforma-view"); }
      else toast.error("Could not load proforma invoice");
    } catch { toast.error("Failed to load proforma"); }
  };

  /* ─── Delete ─── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this quotation?")) return;
    try {
      const res  = await fetch(`${API}/api/quotations/${id}`, { method: "DELETE", headers: authHeader() });
      const json = await res.json();
      if (json.success) { toast.success("Deleted"); fetchQuotations(); fetchStats(); }
      else toast.error(json.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
  };

  /* ─── Open edit ─── */
  const openEdit = (q) => {
    setFormData({
      clientName:    q.clientName    || "",
      clientPhone:   q.clientPhone   || "",
      clientEmail:   q.clientEmail   || "",
      clientCompany: q.clientCompany || "",
      clientAddress: q.clientAddress || "",
      clientGstin:   q.clientGstin   || "",
      branch:        q.branch        || "Bangalore",
      enquiryId:     q.enquiryId     || "",
      senderEmail:   q.senderEmail   || "",
      status:        q.status        || "draft",
      lineItems:     q.lineItems?.length ? q.lineItems : [{ ...EMPTY_ITEM }],
      discount:      q.discount      ?? 0,
      tax:           q.tax           ?? 18,
      validUntil:    q.validUntil ? q.validUntil.slice(0, 10) : "",
      notes:         q.notes         || "",
      terms:         q.terms         || "",
    });
    setEditingId(q._id);
    setEnquirySearch(q.enquiryId ? "Linked to enquiry" : "");
    setMode("form");
  };

  /* ─── PDF Download ─── */
  const handleDownloadPdf = async () => {
    const el = document.getElementById("qt-pdf-target");
    if (!el) return;
    const { default: html2pdf } = await import("html2pdf.js");
    const doc = viewing || viewingProforma;
    const filename = doc?.quoteNumber || doc?.proformaNumber || "quotation";
    html2pdf()
      .set({
        margin:      [8, 8, 8, 8],
        filename:    `${filename}.pdf`,
        image:       { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF:       { unit: "mm", format: "a4", orientation: "portrait" },
      })
      .from(el)
      .save();
  };

  const backToList = () => {
    setMode("list");
    setEditingId(null);
    setFormData({ ...EMPTY_FORM });
    setViewing(null);
    setViewingProforma(null);
    setShowRevisionForm(false);
    setShowConvertForm(false);
    setNegotiationNote("");
    setEnquirySearch("");
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / 20));
  const sm = (status) => STATUS_META[status] || STATUS_META.draft;

  /* ══════════════════════════════════════════════════════════
     RENDER
  ══════════════════════════════════════════════════════════ */
  return (
    <div className="qt-layout">
      <Sidebar />
      <main className="qt-main">

        {/* ─── Header ─── */}
        <header className="qt-header">
          <div>
            <div className="qt-eyebrow">Sales</div>
            <h1 className="qt-title">
              {mode === "proforma-view" ? "Proforma Invoice" : "Quotations"}
            </h1>
            <p className="qt-subtitle">
              {mode === "list"
                ? `${totalCount} quotation${totalCount !== 1 ? "s" : ""} total`
                : mode === "form"
                  ? editingId ? "Edit quotation" : "New quotation"
                  : mode === "view"
                    ? (viewing?.quoteNumber || "")
                    : (viewingProforma?.proformaNumber || "")}
            </p>
          </div>
          <div className="qt-header-acts">
            {mode !== "list" ? (
              <>
                {(mode === "view" || mode === "proforma-view") && (
                  <button className="qt-btn-dl" onClick={handleDownloadPdf}>
                    <Download size={14} /> Download PDF
                  </button>
                )}
                <button className="qt-btn-sec" onClick={backToList}>← Back</button>
              </>
            ) : (
              <>
                <button className="qt-btn-sec" onClick={() => { fetchQuotations(); fetchStats(); }}>
                  <RefreshCcw size={14} />
                </button>
                <button className="qt-btn-prim" onClick={() => { setFormData({ ...EMPTY_FORM }); setEditingId(null); setMode("form"); }}>
                  <Plus size={15} /> New Quotation
                </button>
              </>
            )}
          </div>
        </header>

        {/* ══ LIST MODE ══ */}
        {mode === "list" && (
          <>
            {/* Stats */}
            <div className="qt-stats">
              <div className="qt-stat-card indigo">
                <div className="qt-stat-label">Total</div>
                <div className="qt-stat-val">{stats.total}</div>
              </div>
              <div className="qt-stat-card blue">
                <div className="qt-stat-label">Sent</div>
                <div className="qt-stat-val">{stats.byStatus?.sent || 0}</div>
              </div>
              <div className="qt-stat-card amber">
                <div className="qt-stat-label">Negotiating</div>
                <div className="qt-stat-val">{stats.byStatus?.under_negotiation || 0}</div>
              </div>
              <div className="qt-stat-card green">
                <div className="qt-stat-label">Won</div>
                <div className="qt-stat-val">{(stats.byStatus?.approved || 0) + (stats.byStatus?.final || 0) + (stats.byStatus?.converted || 0)}</div>
                <div className="qt-stat-sub">₹{fmt(stats.acceptedValue)}</div>
              </div>
              <div className="qt-stat-card violet">
                <div className="qt-stat-label">Conversion</div>
                <div className="qt-stat-val">{stats.conversionRate}%</div>
              </div>
            </div>

            {/* Filters */}
            <div className="qt-filters">
              <div className="qt-search-wrap">
                <Search size={14} className="qt-search-icon" />
                <input
                  className="qt-search"
                  placeholder="Search client, company, quote no..."
                  value={filters.q}
                  onChange={e => setFilter("q", e.target.value)}
                />
              </div>
              <select className="qt-sel" value={filters.status} onChange={e => setFilter("status", e.target.value)}>
                <option value="">All Status</option>
                {STATUSES.map(s => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
              </select>
              <select className="qt-sel" value={filters.branch} onChange={e => setFilter("branch", e.target.value)}>
                <option value="">All Branches</option>
                {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              {(filters.status || filters.branch || filters.q) && (
                <button className="qt-clear-btn" onClick={() => setFilters({ status: "", branch: "", q: "", page: 1 })}>Clear</button>
              )}
            </div>

            {/* Table */}
            <div className="qt-table-section">
              {loading ? (
                <div className="qt-empty"><RefreshCcw size={24} className="qt-spin" /><p>Loading...</p></div>
              ) : quotations.length === 0 ? (
                <div className="qt-empty">
                  <FileText size={36} />
                  <p>No quotations found</p>
                  <button className="qt-btn-prim" onClick={() => setMode("form")}><Plus size={14} /> Create First</button>
                </div>
              ) : (
                <div className="qt-table-wrap">
                  <table className="qt-table">
                    <thead>
                      <tr>
                        <th>Quote #</th>
                        <th>Client</th>
                        <th>Branch</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Valid Until</th>
                        <th>Created</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotations.map(q => {
                        const s = sm(q.status);
                        return (
                          <tr key={q._id}>
                            <td>
                              <span className="qt-quote-num">{q.quoteNumber}</span>
                              {q.isRevision && <span className="qt-rev-badge">R{q.revisionNumber}</span>}
                            </td>
                            <td>
                              <div className="qt-client-name">{q.clientName}</div>
                              {q.clientCompany && <div className="qt-client-co">{q.clientCompany}</div>}
                              {q.clientPhone   && <div className="qt-client-ph">{q.clientPhone}</div>}
                            </td>
                            <td><span className="qt-branch">{q.branch}</span></td>
                            <td><span className="qt-amount">₹{fmt(q.total)}</span></td>
                            <td><span className={`qt-status qt-st-${s.color}`}>{s.label}</span></td>
                            <td>{fmtDate(q.validUntil)}</td>
                            <td>{fmtDate(q.createdAt)}</td>
                            <td>
                              <div className="qt-actions">
                                <button className="qt-btn-icon" title="View" onClick={() => { setViewing(q); setMode("view"); }}>
                                  <Eye size={15} />
                                </button>
                                <button className="qt-btn-icon" title="Edit" onClick={() => openEdit(q)}>
                                  <Edit2 size={15} />
                                </button>
                                {q.clientEmail && (
                                  <button className="qt-btn-icon send" title="Send to client" disabled={sending} onClick={() => handleSendEmail(q._id)}>
                                    <Send size={15} />
                                  </button>
                                )}
                                {isMasterAdmin() && (
                                  <button className="qt-btn-icon danger" title="Delete" onClick={() => handleDelete(q._id)}>
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {totalPages > 1 && (
              <div className="qt-pagination">
                <button className="qt-pg-btn" disabled={filters.page <= 1} onClick={() => setFilter("page", filters.page - 1)}>
                  <ChevronLeft size={15} />
                </button>
                <span className="qt-pg-info">Page {filters.page} / {totalPages}</span>
                <button className="qt-pg-btn" disabled={filters.page >= totalPages} onClick={() => setFilter("page", filters.page + 1)}>
                  <ChevronRight size={15} />
                </button>
              </div>
            )}
          </>
        )}

        {/* ══ FORM MODE ══ */}
        {mode === "form" && (
          <form className="qt-form" onSubmit={handleSave}>
            <div className="qt-form-body">

              {/* Enquiry Search */}
              <div className="qt-form-section">
                <div className="qt-section-title">Link to Enquiry (optional)</div>
                <div className="qt-enquiry-search-wrap" style={{ position: "relative" }}>
                  <Search size={14} className="qt-search-icon" />
                  <input
                    className="qt-search"
                    placeholder="Search enquiry by name, phone, company..."
                    value={enquirySearch}
                    onChange={e => searchEnquiries(e.target.value)}
                    onFocus={() => enquirySuggestions.length > 0 && setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  />
                  {showSuggestions && enquirySuggestions.length > 0 && (
                    <div className="qt-enquiry-dropdown">
                      {enquirySuggestions.map(enq => (
                        <div key={enq._id} className="qt-enquiry-item" onMouseDown={() => selectEnquiry(enq)}>
                          <div className="qt-enq-name">{enq.name} <span className="qt-enq-phone">{enq.phone}</span></div>
                          {enq.company && <div className="qt-enq-co">{enq.company}</div>}
                          <div className="qt-enq-meta">{enq.branch} · {enq.services?.slice(0, 2).join(", ")}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {formData.enquiryId && (
                  <div className="qt-linked-badge">
                    <CheckCircle2 size={13} /> Linked to enquiry
                    <button type="button" className="qt-unlink" onClick={() => { setFormData(f => ({ ...f, enquiryId: "" })); setEnquirySearch(""); }}>
                      ✕ Unlink
                    </button>
                  </div>
                )}
              </div>

              {/* Client Info */}
              <div className="qt-form-section">
                <div className="qt-section-title">Client Information</div>
                <div className="qt-form-grid">
                  <div className="qt-field">
                    <label>Client Name *</label>
                    <input value={formData.clientName} onChange={e => setFormData(f => ({ ...f, clientName: e.target.value }))} placeholder="Full name" required />
                  </div>
                  <div className="qt-field">
                    <label>Phone</label>
                    <input value={formData.clientPhone} onChange={e => setFormData(f => ({ ...f, clientPhone: e.target.value }))} placeholder="+91 98765 43210" />
                  </div>
                  <div className="qt-field">
                    <label>Email</label>
                    <input type="email" value={formData.clientEmail} onChange={e => setFormData(f => ({ ...f, clientEmail: e.target.value }))} placeholder="client@example.com" />
                  </div>
                  <div className="qt-field">
                    <label>Company</label>
                    <input value={formData.clientCompany} onChange={e => setFormData(f => ({ ...f, clientCompany: e.target.value }))} placeholder="Company name" />
                  </div>
                  <div className="qt-field">
                    <label>Your Email (Replies go here) *</label>
                    <input type="email" value={formData.senderEmail} onChange={e => setFormData(f => ({ ...f, senderEmail: e.target.value }))} placeholder="your.email@gmail.com" />
                    <span style={{fontSize:"10px",color:"#94a3b8",marginTop:2}}>Client replies to this email</span>
                  </div>
                  <div className="qt-field">
                    <label>GSTIN</label>
                    <input value={formData.clientGstin} onChange={e => setFormData(f => ({ ...f, clientGstin: e.target.value }))} placeholder="29AABCXXXXX1Z5" />
                  </div>
                  <div className="qt-field">
                    <label>Branch *</label>
                    <select value={formData.branch} onChange={e => setFormData(f => ({ ...f, branch: e.target.value }))}>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="qt-field full">
                    <label>Billing Address</label>
                    <input value={formData.clientAddress} onChange={e => setFormData(f => ({ ...f, clientAddress: e.target.value }))} placeholder="Full billing address" />
                  </div>
                  <div className="qt-field">
                    <label>Valid Until</label>
                    <input type="date" value={formData.validUntil} onChange={e => setFormData(f => ({ ...f, validUntil: e.target.value }))} />
                  </div>
                </div>
              </div>

              {/* Line Items */}
              <div className="qt-form-section">
                <div className="qt-section-title-row">
                  <span className="qt-section-title">Line Items</span>
                  <button type="button" className="qt-add-row-btn" onClick={addItem}><PlusCircle size={14} /> Add Row</button>
                </div>
                <div className="qt-items-table-wrap">
                  <table className="qt-items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Rate (₹)</th>
                        <th>Amount (₹)</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.lineItems.map((item, idx) => (
                        <tr key={idx}>
                          <td>
                            <input className="qt-item-input" placeholder="Service / Product description" value={item.description}
                              onChange={e => updateItem(idx, "description", e.target.value)} />
                          </td>
                          <td>
                            <input className="qt-item-input num" type="number" min="0" step="0.01" value={item.qty}
                              onChange={e => updateItem(idx, "qty", e.target.value)} />
                          </td>
                          <td>
                            <input className="qt-item-input num" type="number" min="0" step="1" value={item.rate}
                              onChange={e => updateItem(idx, "rate", e.target.value)} />
                          </td>
                          <td><span className="qt-item-amount">₹{fmt(item.amount)}</span></td>
                          <td>
                            <button type="button" className="qt-remove-row" onClick={() => removeItem(idx)} disabled={formData.lineItems.length <= 1}>
                              <Minus size={13} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="qt-totals">
                  <div className="qt-totals-left">
                    <div className="qt-field-inline">
                      <label>Discount (₹)</label>
                      <input type="number" min="0" step="1" value={formData.discount} onChange={e => setFormData(f => ({ ...f, discount: e.target.value }))} />
                    </div>
                    <div className="qt-field-inline">
                      <label>GST (%)</label>
                      <input type="number" min="0" max="100" step="0.5" value={formData.tax} onChange={e => setFormData(f => ({ ...f, tax: e.target.value }))} />
                    </div>
                  </div>
                  <div className="qt-totals-right">
                    <div className="qt-total-row"><span>Subtotal</span><span>₹{fmt(totals.subtotal)}</span></div>
                    {Number(formData.discount) > 0 && <div className="qt-total-row discount"><span>Discount</span><span>− ₹{fmt(formData.discount)}</span></div>}
                    {Number(formData.tax) > 0 && <div className="qt-total-row"><span>GST ({formData.tax}%)</span><span>₹{fmt(totals.gstAmt)}</span></div>}
                    <div className="qt-total-row grand"><span>Total</span><span>₹{fmt(totals.total)}</span></div>
                  </div>
                </div>
              </div>

              {/* Notes & Terms */}
              <div className="qt-form-section">
                <div className="qt-section-title">Notes &amp; Terms</div>
                <div className="qt-form-grid">
                  <div className="qt-field full">
                    <label>Notes (visible to client)</label>
                    <textarea rows={3} value={formData.notes} onChange={e => setFormData(f => ({ ...f, notes: e.target.value }))} placeholder="Any special notes for the client..." />
                  </div>
                  <div className="qt-field full">
                    <label>Terms &amp; Conditions</label>
                    <textarea rows={3} value={formData.terms} onChange={e => setFormData(f => ({ ...f, terms: e.target.value }))} placeholder="Payment terms, delivery conditions..." />
                  </div>
                </div>
              </div>
            </div>

            <div className="qt-form-footer">
              <button type="button" className="qt-btn-ghost" onClick={backToList}>Cancel</button>
              <button type="submit" className="qt-btn-prim" disabled={saving}>
                {saving ? <RefreshCcw size={14} className="qt-spin" /> : <CheckCircle2 size={14} />}
                {saving ? "Saving..." : editingId ? "Update Quotation" : "Create Quotation"}
              </button>
            </div>
          </form>
        )}

        {/* ══ VIEW MODE ══ */}
        {mode === "view" && viewing && (
          <div className="qt-view-enterprise">

            {/* Workflow Bar */}
            <div className="qt-workflow-bar">
              <div className="qt-workflow-status">
                <span className={`qt-status qt-st-${sm(viewing.status).color}`}>{sm(viewing.status).label}</span>
                {viewing.isRevision && <span className="qt-rev-badge">Revision {viewing.revisionNumber}</span>}
              </div>
              <div className="qt-workflow-actions">
                {/* Send email */}
                {viewing.clientEmail && viewing.status === "draft" && (
                  <button className="qt-wf-btn blue" disabled={sending} onClick={() => handleSendEmail(viewing._id)}>
                    <Send size={13} /> {sending ? "Sending..." : "Send to Client"}
                  </button>
                )}
                {/* Status transitions */}
                {viewing.status === "sent" && (
                  <>
                    <button className="qt-wf-btn amber" onClick={() => handleStatusChange(viewing._id, "under_negotiation")}>
                      <MessageSquare size={13} /> Under Negotiation
                    </button>
                    <button className="qt-wf-btn green" onClick={() => handleStatusChange(viewing._id, "approved")}>
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button className="qt-wf-btn red" onClick={() => handleStatusChange(viewing._id, "rejected")}>
                      <XCircle size={13} /> Reject
                    </button>
                  </>
                )}
                {viewing.status === "under_negotiation" && (
                  <>
                    <button className="qt-wf-btn green" onClick={() => handleStatusChange(viewing._id, "approved")}>
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button className="qt-wf-btn red" onClick={() => handleStatusChange(viewing._id, "rejected")}>
                      <XCircle size={13} /> Reject
                    </button>
                    <button className="qt-wf-btn purple" onClick={() => { setRevFormData({ ...viewing, lineItems: [...viewing.lineItems] }); setShowRevisionForm(true); }}>
                      <GitBranch size={13} /> Create Revision
                    </button>
                  </>
                )}
                {viewing.status === "approved" && (
                  <>
                    <button className="qt-wf-btn indigo" onClick={() => handleStatusChange(viewing._id, "final")}>
                      <TrendingUp size={13} /> Mark as Final
                    </button>
                    <button className="qt-wf-btn teal" onClick={() => setShowConvertForm(true)}>
                      <Receipt size={13} /> Convert to Proforma
                    </button>
                  </>
                )}
                {viewing.status === "final" && (
                  <button className="qt-wf-btn teal" onClick={() => setShowConvertForm(true)}>
                    <Receipt size={13} /> Convert to Proforma
                  </button>
                )}
                {viewing.status === "converted" && viewing.proformaId && (
                  <button className="qt-wf-btn teal" onClick={() => openProformaFromQuotation(viewing.proformaId)}>
                    <Receipt size={13} /> View Proforma Invoice
                  </button>
                )}
                {(viewing.status === "rejected" || viewing.status === "sent") && (
                  <button className="qt-wf-btn purple" onClick={() => { setRevFormData({ ...viewing, lineItems: [...viewing.lineItems] }); setShowRevisionForm(true); }}>
                    <GitBranch size={13} /> Create Revision
                  </button>
                )}
                <button className="qt-wf-btn gray" onClick={() => openEdit(viewing)}>
                  <Edit2 size={13} /> Edit
                </button>
              </div>
            </div>

            <div className="qt-view-enterprise-body">
              {/* Document Preview */}
              <div className="qt-doc-wrap" ref={pdfRef}>
                <QuotationDocument q={viewing} />
              </div>

              {/* Right Panel */}
              <div className="qt-side-panel">

                {/* Negotiation History */}
                <div className="qt-panel-card">
                  <div className="qt-panel-title"><MessageSquare size={14} /> Negotiation History</div>
                  {(viewing.negotiationHistory || []).length === 0 ? (
                    <div className="qt-panel-empty">No activity yet</div>
                  ) : (
                    <div className="qt-neg-list">
                      {[...viewing.negotiationHistory].reverse().map((entry, i) => (
                        <div key={i} className={`qt-neg-item ${entry.type}`}>
                          <div className="qt-neg-note">{entry.note}</div>
                          <div className="qt-neg-meta">{entry.by} · {fmtDate(entry.at)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="qt-neg-add">
                    <textarea
                      rows={2}
                      placeholder="Add negotiation note..."
                      value={negotiationNote}
                      onChange={e => setNegotiationNote(e.target.value)}
                    />
                    <button className="qt-wf-btn blue" disabled={addingNote} onClick={handleAddNote}>
                      {addingNote ? <RefreshCcw size={12} className="qt-spin" /> : <Plus size={12} />} Add Note
                    </button>
                  </div>
                </div>

                {/* Meta info */}
                <div className="qt-panel-card">
                  <div className="qt-panel-title"><FileText size={14} /> Details</div>
                  <div className="qt-panel-meta">
                    <div><span>Branch</span><span>{viewing.branch}</span></div>
                    {viewing.senderEmail && <div><span>Reply-To</span><span>{viewing.senderEmail}</span></div>}
                    <div><span>Created by</span><span>{viewing.createdBy}</span></div>
                    <div><span>Created</span><span>{fmtDate(viewing.createdAt)}</span></div>
                    {viewing.sentAt     && <div><span>Sent</span><span>{fmtDate(viewing.sentAt)}</span></div>}
                    {viewing.approvedAt && <div><span>Approved</span><span>{fmtDate(viewing.approvedAt)}</span></div>}
                    {viewing.rejectedAt && <div><span>Rejected</span><span>{fmtDate(viewing.rejectedAt)}</span></div>}
                    {viewing.convertedAt && <div><span>Converted</span><span>{fmtDate(viewing.convertedAt)}</span></div>}
                    {viewing.validUntil && <div><span>Valid Until</span><span>{fmtDate(viewing.validUntil)}</span></div>}
                  </div>
                </div>
              </div>
            </div>

            {/* ── Revision Form Modal ── */}
            {showRevisionForm && revFormData && (
              <div className="qt-modal-overlay" onClick={() => setShowRevisionForm(false)}>
                <div className="qt-modal" onClick={e => e.stopPropagation()}>
                  <div className="qt-modal-header">
                    <span><GitBranch size={15} /> Create Revision</span>
                    <button onClick={() => setShowRevisionForm(false)}>✕</button>
                  </div>
                  <div className="qt-modal-body">
                    <p className="qt-modal-hint">Adjust any line items or pricing for the revision. All other client details will be carried over.</p>
                    <div className="qt-items-table-wrap">
                      <table className="qt-items-table">
                        <thead>
                          <tr><th>Description</th><th>Qty</th><th>Rate (₹)</th><th>Amount (₹)</th></tr>
                        </thead>
                        <tbody>
                          {(revFormData.lineItems || []).map((item, idx) => (
                            <tr key={idx}>
                              <td><input className="qt-item-input" value={item.description}
                                onChange={e => {
                                  const items = [...revFormData.lineItems];
                                  items[idx] = { ...items[idx], description: e.target.value };
                                  setRevFormData(f => ({ ...f, lineItems: items }));
                                }} /></td>
                              <td><input className="qt-item-input num" type="number" value={item.qty}
                                onChange={e => {
                                  const items = [...revFormData.lineItems];
                                  items[idx] = { ...items[idx], qty: Number(e.target.value), amount: Number(e.target.value) * Number(items[idx].rate) };
                                  setRevFormData(f => ({ ...f, lineItems: items }));
                                }} /></td>
                              <td><input className="qt-item-input num" type="number" value={item.rate}
                                onChange={e => {
                                  const items = [...revFormData.lineItems];
                                  items[idx] = { ...items[idx], rate: Number(e.target.value), amount: Number(items[idx].qty) * Number(e.target.value) };
                                  setRevFormData(f => ({ ...f, lineItems: items }));
                                }} /></td>
                              <td><span className="qt-item-amount">₹{fmt(item.amount)}</span></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="qt-modal-totals">
                      <div className="qt-field-inline">
                        <label>Discount (₹)</label>
                        <input type="number" value={revFormData.discount} onChange={e => setRevFormData(f => ({ ...f, discount: Number(e.target.value) }))} />
                      </div>
                      <div className="qt-field-inline">
                        <label>GST (%)</label>
                        <input type="number" value={revFormData.tax} onChange={e => setRevFormData(f => ({ ...f, tax: Number(e.target.value) }))} />
                      </div>
                    </div>
                    <div className="qt-field" style={{ marginTop: 12 }}>
                      <label>Notes (optional)</label>
                      <textarea rows={2} value={revFormData.notes || ""} onChange={e => setRevFormData(f => ({ ...f, notes: e.target.value }))} />
                    </div>
                  </div>
                  <div className="qt-modal-footer">
                    <button className="qt-btn-ghost" onClick={() => setShowRevisionForm(false)}>Cancel</button>
                    <button className="qt-btn-prim" disabled={saving} onClick={handleCreateRevision}>
                      {saving ? <RefreshCcw size={13} className="qt-spin" /> : <GitBranch size={13} />}
                      {saving ? "Creating..." : "Create Revision"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Convert to Proforma Modal ── */}
            {showConvertForm && (
              <div className="qt-modal-overlay" onClick={() => setShowConvertForm(false)}>
                <div className="qt-modal" onClick={e => e.stopPropagation()}>
                  <div className="qt-modal-header">
                    <span><Receipt size={15} /> Convert to Proforma Invoice</span>
                    <button onClick={() => setShowConvertForm(false)}>✕</button>
                  </div>
                  <div className="qt-modal-body">
                    <p className="qt-modal-hint">A Proforma Invoice will be created from <strong>{viewing.quoteNumber}</strong> with all line items and pricing.</p>
                    <div className="qt-form-grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className="qt-field">
                        <label>Delivery Date</label>
                        <input type="date" value={convertData.deliveryDate}
                          onChange={e => setConvertData(f => ({ ...f, deliveryDate: e.target.value }))} />
                      </div>
                      <div className="qt-field">
                        <label>Payment Terms</label>
                        <input value={convertData.paymentTerms}
                          onChange={e => setConvertData(f => ({ ...f, paymentTerms: e.target.value }))}
                          placeholder="e.g. 50% advance, 50% on delivery" />
                      </div>
                    </div>
                  </div>
                  <div className="qt-modal-footer">
                    <button className="qt-btn-ghost" onClick={() => setShowConvertForm(false)}>Cancel</button>
                    <button className="qt-btn-teal" disabled={converting} onClick={handleConvertToProforma}>
                      {converting ? <RefreshCcw size={13} className="qt-spin" /> : <Receipt size={13} />}
                      {converting ? "Converting..." : "Create Proforma Invoice"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══ PROFORMA VIEW MODE ══ */}
        {mode === "proforma-view" && viewingProforma && (
          <div className="qt-view-enterprise">
            <div className="qt-workflow-bar">
              <div className="qt-workflow-status">
                <span className={`qt-status qt-st-${PI_STATUS_META[viewingProforma.status]?.color || "gray"}`}>
                  {PI_STATUS_META[viewingProforma.status]?.label || viewingProforma.status}
                </span>
                <span className="qt-pi-ref">From: {viewingProforma.quoteNumber}</span>
              </div>
              <div className="qt-workflow-actions">
                {viewingProforma.clientEmail && viewingProforma.status === "draft" && (
                  <button className="qt-wf-btn blue" disabled={sending} onClick={() => handleSendProformaEmail(viewingProforma._id)}>
                    <Send size={13} /> {sending ? "Sending..." : "Send to Client"}
                  </button>
                )}
              </div>
            </div>

            <div className="qt-view-enterprise-body">
              <div className="qt-doc-wrap">
                <QuotationDocument q={viewingProforma} isProforma />
              </div>
              <div className="qt-side-panel">
                <div className="qt-panel-card">
                  <div className="qt-panel-title"><Receipt size={14} /> Proforma Details</div>
                  <div className="qt-panel-meta">
                    <div><span>Number</span><span>{viewingProforma.proformaNumber}</span></div>
                    <div><span>Branch</span><span>{viewingProforma.branch}</span></div>
                    <div><span>Created by</span><span>{viewingProforma.createdBy}</span></div>
                    <div><span>Created</span><span>{fmtDate(viewingProforma.createdAt)}</span></div>
                    {viewingProforma.deliveryDate && <div><span>Delivery</span><span>{fmtDate(viewingProforma.deliveryDate)}</span></div>}
                    {viewingProforma.paymentTerms && <div><span>Payment</span><span>{viewingProforma.paymentTerms}</span></div>}
                    {viewingProforma.sentAt && <div><span>Sent</span><span>{fmtDate(viewingProforma.sentAt)}</span></div>}
                    {viewingProforma.paidAt && <div><span>Paid</span><span>{fmtDate(viewingProforma.paidAt)}</span></div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
