import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "../../utils/toast";
import {
  Phone, ClipboardList, ReceiptIndianRupee, FileText,
  CalendarDays, Rocket, AlertCircle, MessageSquare,
  Eye, RefreshCcw, Trash2, Plus, Search, X,
  Mail, Send, ChevronRight, ChevronLeft, CheckCircle2, Check,
  ReceiptText, User, ChevronDown,
  CreditCard, BadgeCheck, Building2, Filter,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import LeadDrawer from "../../Leads/LeadDrawer";
import "./TodaysPlanPage.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

/* ─── Config ───────────────────────────────────────────────── */
const TABS = [
  { key: "all",        label: "All" },
  { key: "new_call",   label: "New Calls" },
  { key: "follow_up",  label: "Follow-ups" },
  { key: "payment",    label: "Payments" },
  { key: "proposal",   label: "Proposals" },
  { key: "meeting",    label: "Meetings" },
  { key: "onboarding", label: "Onboarding" },
];
const PRIORITY_COLOR = { urgent: "red", high: "orange", medium: "blue", low: "gray" };
const EMPTY_ADD = {
  title: "", subtitle: "", taskType: "follow_up",
  priority: "medium", dueLabel: "Today", phone: "", notes: "",
};

const EMAIL_TEMPLATES = [
  {
    key: "initiation",
    label: "Project Initiation",
    desc: "Notify client that development has begun",
    icon: "🚀",
    iconCls: "blue",
    badge: "Auto email",
    badgeCls: "blue",
    fields: ["startDate", "timeline"],
  },
  {
    key: "completion",
    label: "Project Completed",
    desc: "Website is ready — invite client for demo review",
    icon: "✅",
    iconCls: "green",
    badge: "Auto email",
    badgeCls: "green",
    fields: ["completionDate", "demoLink"],
  },
  {
    key: "mom",
    label: "Meeting MOM",
    desc: "Send minutes of meeting after a call or demo",
    icon: "📋",
    iconCls: "purple",
    badge: "With MOM",
    badgeCls: "purple",
    fields: ["meetingDate", "attendees", "summary", "actionItems"],
  },
  {
    key: "followup",
    label: "Follow-up 1 / 3",
    desc: "Gentle reminder — no response after 8+ days",
    icon: "🔔",
    iconCls: "slate",
    badge: "F/U 1",
    badgeCls: "blue",
    followupNumber: 1,
    fields: [],
  },
  {
    key: "followup2",
    label: "Follow-up 2 / 3",
    desc: "Second follow-up — important tone",
    icon: "🔔",
    iconCls: "amber",
    badge: "F/U 2",
    badgeCls: "amber",
    followupNumber: 2,
    fields: [],
  },
  {
    key: "followup3",
    label: "Follow-up 3 / 3",
    desc: "Final follow-up — urgent tone",
    icon: "🔔",
    iconCls: "red",
    badge: "F/U 3",
    badgeCls: "red",
    followupNumber: 3,
    fields: [],
  },
  {
    key: "custom",
    label: "Custom Email",
    desc: "Write your own subject & message body",
    icon: "✏️",
    iconCls: "slate",
    badge: "Custom",
    badgeCls: "slate",
    fields: ["subject", "body"],
  },
  {
    key: "payment_reminder1",
    label: "Payment Reminder 1/3",
    desc: "Gentle reminder — payment due soon",
    icon: "💳",
    iconCls: "blue",
    badge: "Pay R1",
    badgeCls: "blue",
    payStage: 1,
    fields: ["amountDue", "dueDate", "invoiceNumber"],
  },
  {
    key: "payment_reminder2",
    label: "Payment Reminder 2/3",
    desc: "Firm notice — payment overdue",
    icon: "⚠️",
    iconCls: "amber",
    badge: "Pay R2",
    badgeCls: "amber",
    payStage: 2,
    fields: ["amountDue", "dueDate", "invoiceNumber"],
  },
  {
    key: "payment_reminder3",
    label: "Payment Reminder 3/3",
    desc: "Critical — final payment notice",
    icon: "🚨",
    iconCls: "red",
    badge: "Pay R3",
    badgeCls: "red",
    payStage: 3,
    fields: ["amountDue", "dueDate", "invoiceNumber"],
  },
  {
    key: "payment_receipt",
    label: "Payment Receipt",
    desc: "Confirm payment received — sends PDF invoice",
    icon: "🧾",
    iconCls: "green",
    badge: "Invoice PDF",
    badgeCls: "green",
    fields: ["amountPaid", "remainingAmount", "receiptNumber", "paymentDate"],
  },
  {
    key: "document_request",
    label: "Document Request",
    desc: "Ask client to share logo, domain, hosting & content",
    icon: "📂",
    iconCls: "purple",
    badge: "Onboarding",
    badgeCls: "purple",
    fields: ["serviceType"],
  },
];

const initials = (name = "") =>
  name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "?";

/* ─── Email Modal component ─────────────────────────────────── */
function EmailModal({ onClose, apiBase }) {
  const [step, setStep]               = useState(1);  // 1=client, 2=template, 3=compose
  const [clientSearch, setClientSearch] = useState("");
  const [clients, setClients]         = useState([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedTpl, setSelectedTpl] = useState(null);
  const [sending, setSending]         = useState(false);
  const [sent, setSent]               = useState(false);

  // Form state for compose step
  const [form, setForm] = useState({
    startDate: new Date().toISOString().slice(0, 10),
    timeline: "8",
    completionDate: new Date().toISOString().slice(0, 10),
    demoLink: "",
    meetingDate: new Date().toISOString().slice(0, 10),
    attendees: "",
    summary: "",
    actionItems: [""],
    subject: "",
    body: "",
    // payment fields
    amountDue: "",
    dueDate: new Date().toISOString().slice(0, 10),
    invoiceNumber: "",
    amountPaid: "",
    remainingAmount: "",
    receiptNumber: "",
    paymentDate: new Date().toISOString().slice(0, 10),
    // onboarding
    serviceType: "website",
  });

  const searchTimer = useRef(null);

  const searchClients = useCallback(async (q) => {
    try {
      setLoadingClients(true);
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${apiBase}/api/leads?q=${encodeURIComponent(q)}&limit=10`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      setClients(Array.isArray(json?.data?.leads) ? json.data.leads : Array.isArray(json?.data) ? json.data : []);
    } catch {
      setClients([]);
    } finally {
      setLoadingClients(false);
    }
  }, [apiBase]);

  // Initial load + debounced search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { searchClients(clientSearch); }, 300);
    return () => clearTimeout(searchTimer.current);
  }, [clientSearch, searchClients]);

  const tpl = selectedTpl ? EMAIL_TEMPLATES.find(t => t.key === selectedTpl) : null;

  const buildPreviewSubject = () => {
    if (!tpl) return "";
    const biz = selectedClient?.business || selectedClient?.company || selectedClient?.name || "";
    const map = {
      initiation:        `🚀 We've Started Your Website Development — NNC`,
      completion:        `✅ Your Website Is Ready for Review — NNC`,
      mom:               `📋 MOM — ${biz} — NNC`,
      followup:          `🔔 Follow-up 1/3 — Awaiting Your Approval — NNC`,
      followup2:         `🔔 Follow-up 2/3 — Awaiting Your Approval — NNC`,
      followup3:         `🔔 Follow-up 3/3 — Awaiting Your Approval — NNC`,
      custom:            form.subject || "(no subject)",
      payment_reminder1: `💳 Payment Reminder — Stage 1/3: Gentle Reminder — NNC`,
      payment_reminder2: `⚠️ Payment Reminder — Stage 2/3: Important Notice — NNC`,
      payment_reminder3: `🚨 Payment Reminder — Stage 3/3: Final Notice — NNC`,
      payment_receipt:   `🧾 Payment Received — Thank You! Receipt #${form.receiptNumber || ""} — NNC`,
      document_request:  `📂 Action Required: Share Your Project Documents — NNC`,
    };
    return map[tpl.key] || "";
  };

  const buildPreviewBody = () => {
    if (!tpl) return "";
    const name = selectedClient?.name || "Valued Client";
    const biz  = selectedClient?.business || selectedClient?.company || "";
    const map = {
      initiation:        `Dear ${name}, we've officially kicked off your website development${biz ? ` for ${biz}` : ""}. Start date: ${form.startDate}. Timeline: ${form.timeline} business days.`,
      completion:        `Dear ${name}, your website${biz ? ` for ${biz}` : ""} is complete as of ${form.completionDate}. We're ready for a demo review. ${form.demoLink ? `Demo link: ${form.demoLink}` : ""}`,
      mom:               `Dear ${name}, please find the MOM for our meeting on ${form.meetingDate}. Attendees: ${form.attendees || "—"}. Summary: ${form.summary || "—"}`,
      followup:          `Dear ${name}, this is a gentle follow-up regarding your website approval. Please share your feedback at your earliest convenience.`,
      followup2:         `Dear ${name}, we're following up again regarding your website approval. Your prompt response helps us meet the go-live date.`,
      followup3:         `Dear ${name}, this is our final follow-up. Without your approval we cannot proceed further. Please contact us immediately.`,
      custom:            form.body || "",
      payment_reminder1: `Dear ${name}, this is a gentle reminder that a payment of ₹${form.amountDue || "—"} is due on ${form.dueDate}${biz ? ` for ${biz}` : ""}. Please arrange payment at your earliest convenience.`,
      payment_reminder2: `Dear ${name}, this is an important notice regarding an outstanding payment of ₹${form.amountDue || "—"} that was due on ${form.dueDate}. Please clear the dues immediately.`,
      payment_reminder3: `Dear ${name}, this is our final notice regarding the overdue payment of ₹${form.amountDue || "—"} that was due on ${form.dueDate}. Urgent action is required.`,
      payment_receipt:   `Dear ${name}, we confirm receipt of ₹${form.amountPaid || "—"} on ${form.paymentDate}. ${form.remainingAmount ? `Balance remaining: ₹${form.remainingAmount}.` : "Account is fully cleared."} Invoice PDF is attached.`,
      document_request:  `Dear ${name}, we need your project documents to begin development${biz ? ` for ${biz}` : ""}. Please share your logo, domain details, hosting credentials, and content.`,
    };
    return map[tpl.key] || "";
  };

  const canGoNext = () => {
    if (step === 1) return !!selectedClient;
    if (step === 2) return !!selectedTpl;
    return false;
  };

  const handleSend = async () => {
    if (!selectedClient || !tpl) return;
    if (!selectedClient.email) { toast.warning("This client has no email address."); return; }

    setSending(true);
    try {
      const isFollowup     = tpl.key.startsWith("followup");
      const isPayReminder  = tpl.key.startsWith("payment_reminder");
      const apiType = isFollowup ? "followup"
        : isPayReminder ? "payment_reminder"
        : tpl.key;
      const body = {
        type: apiType,
        ...(isFollowup    && { followupNumber: tpl.followupNumber }),
        ...(isPayReminder && { stage: tpl.payStage, amountDue: Number(form.amountDue), dueDate: form.dueDate, invoiceNumber: form.invoiceNumber }),
        ...(tpl.key === "initiation"      && { startDate: form.startDate }),
        ...(tpl.key === "completion"      && { completionDate: form.completionDate, demoLink: form.demoLink }),
        ...(tpl.key === "mom"             && { meetingDate: form.meetingDate, attendees: form.attendees, summary: form.summary, actionItems: form.actionItems.filter(a => a.trim()) }),
        ...(tpl.key === "custom"          && { subject: form.subject, body: form.body }),
        ...(tpl.key === "payment_receipt" && { amountPaid: Number(form.amountPaid), remainingAmount: Number(form.remainingAmount) || 0, receiptNumber: form.receiptNumber, paymentDate: form.paymentDate }),
        ...(tpl.key === "document_request" && { serviceType: form.serviceType }),
      };

      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${apiBase}/api/leads/${selectedClient._id}/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to send");
      setSent(true);
    } catch (e) {
      toast.error(e?.message || "Failed to send email");
    } finally {
      setSending(false);
    }
  };

  const resetAndClose = () => { setSent(false); setStep(1); setSelectedClient(null); setSelectedTpl(null); onClose(); };

  const stepLabel = ["Select Client", "Choose Template", "Compose & Send"];

  return (
    <div className="em-overlay" onClick={resetAndClose}>
      <div className="em-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="em-header">
          <div className="em-header-left">
            <div className="em-header-icon"><Mail size={16}/></div>
            <div>
              <p className="em-header-title">Send Email</p>
              <p className="em-header-sub">Automated &amp; custom client communications</p>
            </div>
          </div>
          <button className="em-close" onClick={resetAndClose}>×</button>
        </div>

        {/* Step indicator */}
        {!sent && (
          <div className="em-steps">
            {[1, 2, 3].map((n, i) => (
              <div key={n} className="em-step">
                <div className={`em-step-circle ${step > n ? "done" : step === n ? "active" : ""}`}>
                  {step > n ? <CheckCircle2 size={14}/> : n}
                </div>
                <span className={`em-step-label ${step > n ? "done" : step === n ? "active" : ""}`}>
                  {stepLabel[i]}
                </span>
                {n < 3 && <div className={`em-step-line ${step > n ? "done" : ""}`}/>}
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="em-body">
          {/* ── Success screen ── */}
          {sent && (
            <div className="em-success">
              <div className="em-success-icon">✓</div>
              <div className="em-success-title">Email Sent!</div>
              <div className="em-success-sub">
                {tpl?.label} was sent to{" "}
                <strong>{selectedClient?.name}</strong>{" "}
                at {selectedClient?.email}
              </div>
              <button className="em-send-another-btn" onClick={() => {
                setSent(false); setStep(1); setSelectedClient(null); setSelectedTpl(null);
                setForm({ startDate: new Date().toISOString().slice(0,10), timeline:"8", completionDate: new Date().toISOString().slice(0,10), demoLink:"", meetingDate: new Date().toISOString().slice(0,10), attendees:"", summary:"", actionItems:[""], subject:"", body:"" });
              }}>
                Send Another Email
              </button>
            </div>
          )}

          {/* ── Step 1: Client search ── */}
          {!sent && step === 1 && (
            <>
              <div className="em-search-wrap">
                <Search size={14} className="em-search-icon"/>
                <input
                  className="em-search-input"
                  placeholder="Search client by name, phone, or business..."
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  autoFocus
                />
              </div>

              {loadingClients && <div className="em-search-hint">Searching...</div>}

              {!loadingClients && clients.length === 0 && clientSearch && (
                <div className="em-no-results">No clients found for "{clientSearch}"</div>
              )}

              {!loadingClients && clients.length === 0 && !clientSearch && (
                <div className="em-search-hint">Type a name, phone, or business to search clients</div>
              )}

              <div className="em-client-results">
                {clients.map(c => (
                  <div
                    key={c._id}
                    className={`em-client-card ${selectedClient?._id === c._id ? "selected" : ""}`}
                    onClick={() => setSelectedClient(c)}
                  >
                    <div className="em-client-avatar">{initials(c.name)}</div>
                    <div className="em-client-info">
                      <div className="em-client-name">{c.name}</div>
                      <div className="em-client-meta">
                        {c.business && <span>🏢 {c.business}</span>}
                        {c.phone    && <span>📞 {c.phone}</span>}
                        {c.email
                          ? <span>✉️ {c.email}</span>
                          : <span className="em-no-email">⚠ No email</span>
                        }
                        {c.stage && <span>• {c.stage}</span>}
                      </div>
                    </div>
                    {selectedClient?._id === c._id && (
                      <div className="em-client-check">✓</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── Step 2: Template selection ── */}
          {!sent && step === 2 && (
            <div className="em-template-grid">
              {EMAIL_TEMPLATES.map(t => (
                <div
                  key={t.key}
                  className={`em-tpl-card ${selectedTpl === t.key ? "selected" : ""}`}
                  onClick={() => setSelectedTpl(t.key)}
                >
                  <div className={`em-tpl-icon ${t.iconCls}`}>{t.icon}</div>
                  <div className="em-tpl-label">{t.label}</div>
                  <div className="em-tpl-desc">{t.desc}</div>
                  <span className={`em-tpl-badge ${t.badgeCls}`}>{t.badge}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── Step 3: Compose ── */}
          {!sent && step === 3 && tpl && (
            <div className="em-compose">

              {/* Client + template summary */}
              <div className="em-compose-client">
                <div className="em-compose-client-avatar">{initials(selectedClient?.name)}</div>
                <div>
                  <div className="em-compose-client-name">{selectedClient?.name}</div>
                  <div className="em-compose-client-email">{selectedClient?.email || "No email"}</div>
                </div>
                <span className={`em-compose-tpl-badge em-tpl-badge ${tpl.badgeCls}`}>{tpl.label}</span>
              </div>

              {/* Dynamic fields */}
              {tpl.key === "initiation" && (
                <div className="em-field-row">
                  <div className="em-field">
                    <label>Project Start Date</label>
                    <input type="date" value={form.startDate}
                      onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))}/>
                  </div>
                  <div className="em-field">
                    <label>Development Timeline (days)</label>
                    <input type="number" min="1" placeholder="e.g. 8"
                      value={form.timeline}
                      onChange={e => setForm(p => ({ ...p, timeline: e.target.value }))}/>
                  </div>
                </div>
              )}

              {tpl.key === "completion" && (
                <>
                  <div className="em-field">
                    <label>Completion Date</label>
                    <input type="date" value={form.completionDate}
                      onChange={e => setForm(p => ({ ...p, completionDate: e.target.value }))}/>
                  </div>
                  <div className="em-field">
                    <label>Demo / Preview Link (optional)</label>
                    <input type="url" placeholder="https://your-demo-link.com"
                      value={form.demoLink}
                      onChange={e => setForm(p => ({ ...p, demoLink: e.target.value }))}/>
                  </div>
                </>
              )}

              {tpl.key === "mom" && (
                <>
                  <div className="em-field-row">
                    <div className="em-field">
                      <label>Meeting Date</label>
                      <input type="date" value={form.meetingDate}
                        onChange={e => setForm(p => ({ ...p, meetingDate: e.target.value }))}/>
                    </div>
                    <div className="em-field">
                      <label>Attendees</label>
                      <input placeholder="e.g. Ravi, Client CEO, Priya"
                        value={form.attendees}
                        onChange={e => setForm(p => ({ ...p, attendees: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="em-field">
                    <label>Discussion Summary</label>
                    <textarea rows={3} placeholder="What was discussed in the meeting..."
                      value={form.summary}
                      onChange={e => setForm(p => ({ ...p, summary: e.target.value }))}/>
                  </div>
                  <div className="em-field">
                    <label>Action Items</label>
                    <div className="em-action-items">
                      {form.actionItems.map((item, idx) => (
                        <div key={idx} className="em-action-item">
                          <input
                            placeholder={`Action item ${idx + 1}...`}
                            value={item}
                            onChange={e => setForm(p => {
                              const a = [...p.actionItems];
                              a[idx] = e.target.value;
                              return { ...p, actionItems: a };
                            })}
                          />
                          {form.actionItems.length > 1 && (
                            <button className="em-action-rm" type="button"
                              onClick={() => setForm(p => ({ ...p, actionItems: p.actionItems.filter((_, i) => i !== idx) }))}>
                              ×
                            </button>
                          )}
                        </div>
                      ))}
                      <button className="em-add-action-btn" type="button"
                        onClick={() => setForm(p => ({ ...p, actionItems: [...p.actionItems, ""] }))}>
                        + Add Action Item
                      </button>
                    </div>
                  </div>
                </>
              )}

              {tpl.key === "custom" && (
                <>
                  <div className="em-field">
                    <label>Email Subject *</label>
                    <input placeholder="e.g. Update on your website project"
                      value={form.subject}
                      onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}/>
                  </div>
                  <div className="em-field">
                    <label>Message Body *</label>
                    <textarea rows={6}
                      placeholder={`Dear ${selectedClient?.name || "Client"},\n\n(Write your message here...)\n\nWarm regards,\nNNC Team`}
                      value={form.body}
                      onChange={e => setForm(p => ({ ...p, body: e.target.value }))}/>
                  </div>
                </>
              )}

              {/* Payment Reminder fields */}
              {tpl.key.startsWith("payment_reminder") && (
                <>
                  <div className="em-field-row">
                    <div className="em-field">
                      <label>Amount Due (₹) *</label>
                      <input type="number" min="0" placeholder="e.g. 25000"
                        value={form.amountDue}
                        onChange={e => setForm(p => ({ ...p, amountDue: e.target.value }))}/>
                    </div>
                    <div className="em-field">
                      <label>Due Date *</label>
                      <input type="date" value={form.dueDate}
                        onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="em-field">
                    <label>Invoice / Reference Number (optional)</label>
                    <input placeholder="e.g. NNC-2026-001"
                      value={form.invoiceNumber}
                      onChange={e => setForm(p => ({ ...p, invoiceNumber: e.target.value }))}/>
                  </div>
                </>
              )}

              {/* Payment Receipt fields */}
              {tpl.key === "payment_receipt" && (
                <>
                  <div className="em-field-row">
                    <div className="em-field">
                      <label>Amount Paid (₹) *</label>
                      <input type="number" min="0" placeholder="e.g. 15000"
                        value={form.amountPaid}
                        onChange={e => setForm(p => ({ ...p, amountPaid: e.target.value }))}/>
                    </div>
                    <div className="em-field">
                      <label>Balance Remaining (₹)</label>
                      <input type="number" min="0" placeholder="0 if fully cleared"
                        value={form.remainingAmount}
                        onChange={e => setForm(p => ({ ...p, remainingAmount: e.target.value }))}/>
                    </div>
                  </div>
                  <div className="em-field-row">
                    <div className="em-field">
                      <label>Receipt / Invoice Number</label>
                      <input placeholder="e.g. NNC-REC-001"
                        value={form.receiptNumber}
                        onChange={e => setForm(p => ({ ...p, receiptNumber: e.target.value }))}/>
                    </div>
                    <div className="em-field">
                      <label>Payment Date</label>
                      <input type="date" value={form.paymentDate}
                        onChange={e => setForm(p => ({ ...p, paymentDate: e.target.value }))}/>
                    </div>
                  </div>
                  <div style={{ background:"#f0fdf4", border:"1px solid #bbf7d0", borderRadius:10, padding:"10px 14px" }}>
                    <p style={{ margin:0, fontSize:12, color:"#059669", fontWeight:700 }}>
                      📎 A PDF invoice will be automatically generated and attached to this email.
                    </p>
                  </div>
                </>
              )}

              {/* Document Request fields */}
              {tpl.key === "document_request" && (
                <>
                  <div className="em-field">
                    <label>Service Type</label>
                    <select value={form.serviceType}
                      onChange={e => setForm(p => ({ ...p, serviceType: e.target.value }))}
                      style={{ width:"100%", padding:"8px 10px", border:"1px solid #e5e7eb", borderRadius:8, fontSize:13 }}>
                      <option value="website">Website</option>
                      <option value="ecommerce">E-Commerce Store</option>
                    </select>
                  </div>
                  <div style={{ background:"#faf5ff", border:"1px solid #ddd6fe", borderRadius:10, padding:"12px 14px" }}>
                    <p style={{ margin:0, fontSize:13, color:"#7c3aed", fontWeight:700, marginBottom:4 }}>
                      📂 Document checklist will be sent automatically
                    </p>
                    <p style={{ margin:0, fontSize:12, color:"#64748b", lineHeight:1.6 }}>
                      Client will receive a branded email listing all required materials: logo, domain, hosting credentials, social media handles, content, and brand guidelines.
                      {form.serviceType === "ecommerce" && " Product catalogue and payment gateway details will also be included."}
                    </p>
                  </div>
                </>
              )}

              {/* No extra fields for follow-up types */}
              {(tpl.key.startsWith("followup")) && (
                <div style={{ background:"#f8fafc", border:"1px solid #e5e7eb", borderRadius:10, padding:"12px 14px" }}>
                  <p style={{ margin:0, fontSize:13, color:"#334155", fontWeight:700, marginBottom:6 }}>
                    {tpl.icon} {tpl.label} will be sent automatically
                  </p>
                  <p style={{ margin:0, fontSize:12, color:"#64748b", lineHeight:1.6 }}>
                    {tpl.followupNumber === 1 && "A gentle, professional reminder that their website is ready and awaiting approval."}
                    {tpl.followupNumber === 2 && "A firmer follow-up noting the delay, urging them to share feedback or schedule a demo."}
                    {tpl.followupNumber === 3 && "A final, urgent message making clear that action is required to proceed."}
                  </p>
                  {selectedClient?.projectCompletionDate && (
                    <p style={{ margin:"8px 0 0", fontSize:11, color:"#94a3b8", fontWeight:700 }}>
                      Project completed: {new Date(selectedClient.projectCompletionDate).toLocaleDateString("en-IN")}
                    </p>
                  )}
                </div>
              )}

              {/* Preview band */}
              <div className="em-preview-band">
                <div className="em-preview-title">Email Preview</div>
                <div className="em-preview-to">To: <span>{selectedClient?.email || "No email"}</span></div>
                <div className="em-preview-subj">{buildPreviewSubject()}</div>
                <div className="em-preview-body">{buildPreviewBody().slice(0, 180)}{buildPreviewBody().length > 180 ? "…" : ""}</div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        {!sent && (
          <div className="em-footer">
            <div className="em-footer-left">
              {step > 1 && (
                <button className="em-back-btn" onClick={() => setStep(s => s - 1)}>
                  <ChevronLeft size={14}/> Back
                </button>
              )}
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button className="em-back-btn" onClick={resetAndClose}>Cancel</button>
              {step < 3 ? (
                <button className="em-next-btn" disabled={!canGoNext()} onClick={() => setStep(s => s + 1)}>
                  Next <ChevronRight size={14}/>
                </button>
              ) : (
                <button
                  className="em-send-btn"
                  disabled={sending || !selectedClient?.email
                    || (tpl?.key === "custom" && (!form.subject || !form.body))
                    || (tpl?.key?.startsWith("payment_reminder") && !form.amountDue)
                    || (tpl?.key === "payment_receipt" && !form.amountPaid)
                  }
                  onClick={handleSend}
                >
                  <Send size={14}/>
                  {sending ? "Sending..." : "Send Email"}
                </button>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}


/* ─── Main page ─────────────────────────────────────────────── */
export default function TodaysPlanPage() {
  const [dashboard, setDashboard]   = useState(null);
  const [loading, setLoading]       = useState(false);
  const [err, setErr]               = useState("");
  const [actionId, setActionId]     = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [callPriorityFilter, setCallPriorityFilter] = useState("");
  const [callRepFilter, setCallRepFilter]     = useState("");
  const [activeTab, setActiveTab]   = useState("all");
  const [search, setSearch]         = useState("");
  const [addOpen, setAddOpen]       = useState(false);
  const [addForm, setAddForm]       = useState(EMPTY_ADD);
  const [addSaving, setAddSaving]   = useState(false);
  const [emailOpen, setEmailOpen]   = useState(false);
  const [quickActionId, setQuickActionId] = useState(null);
  const [qaData, setQaData]         = useState({ outcome: "", notes: "", nextDate: "" });
  const [qaSubmitting, setQaSubmitting] = useState(false);
  const [priorityFilter, setPriorityFilter] = useState("");

  // Quick View Modal state
  const [qvOpen, setQvOpen]         = useState(false);
  const [qvTask, setQvTask]         = useState(null);
  const [qvLead, setQvLead]         = useState(null);
  const [qvInvoices, setQvInvoices] = useState([]);
  const [qvQuotations, setQvQuotations] = useState([]);
  const [qvSelQuote, setQvSelQuote] = useState("");
  const [qvLoading, setQvLoading]   = useState(false);
  const [qvPayStatus, setQvPayStatus] = useState("");
  const [qvSelectedInvoice, setQvSelectedInvoice] = useState("");
  const [qvSaving, setQvSaving]     = useState(false);
  const [qvFollowupType, setQvFollowupType] = useState(""); // payment | meeting | proposal | invoice
  const [qvMeetingNotes, setQvMeetingNotes] = useState("");
  const [qvMeetingNext,  setQvMeetingNext]  = useState("");
  const [qvMeetingDate,  setQvMeetingDate]  = useState("");
  const QV_DONE_KEY = `tp_done_ids_${new Date().toISOString().slice(0,10)}`; // e.g. tp_done_ids_2026-03-30
  const [qvDoneIds, setQvDoneIds] = useState(() => {
    try {
      const saved = localStorage.getItem(QV_DONE_KEY);
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });

  // Persist done IDs to localStorage so they survive page refresh
  useEffect(() => {
    try { localStorage.setItem(QV_DONE_KEY, JSON.stringify([...qvDoneIds])); } catch {}
  }, [qvDoneIds]);

  const fetchDashboard = async () => {
    try {
      setLoading(true); setErr("");
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${API_BASE}/api/today-plan/dashboard`, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (res.status === 401) {
        ["nnc_token","nnc_auth","nnc_user","nnc_role","nnc_email","nnc_modules"].forEach(k => localStorage.removeItem(k));
        window.location.href = "/";
        return;
      }
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to fetch");
      setDashboard(json?.data || null);
    } catch (e) {
      setErr(e?.message || "Failed to fetch today's plan");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboard(); }, []);

  const allTasks = useMemo(() => {
    if (!dashboard) return [];
    const combined = [
      ...(dashboard.sections?.immediateTasks || []),
      ...(dashboard.sections?.scheduleTasks  || []),
    ];
    // Deduplicate by _id — same task can appear in both sections
    const seen = new Set();
    return combined.filter(t => {
      if (seen.has(t._id)) return false;
      seen.add(t._id);
      return true;
    });
  }, [dashboard]);

  const filtered = useMemo(() => {
    // new_call and follow_up are already shown in the Today's Calls grid above — exclude from task list
    const CALL_TYPES = new Set(["new_call", "follow_up"]);
    let tasks = activeTab === "all"
      ? allTasks.filter(t => !CALL_TYPES.has(t.taskType))
      : allTasks.filter(t => t.taskType === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.subtitle?.toLowerCase().includes(q) ||
        t.phone?.includes(q) ||
        t.ownerName?.toLowerCase().includes(q)
      );
    }
    if (priorityFilter) tasks = tasks.filter(t => t.priority === priorityFilter);
    return tasks;
  }, [allTasks, activeTab, search, priorityFilter]);

  const tabCounts = useMemo(() => {
    const CALL_TYPES = new Set(["new_call", "follow_up"]);
    const counts = { all: allTasks.filter(t => !CALL_TYPES.has(t.taskType)).length };
    TABS.slice(1).forEach(tab => { counts[tab.key] = allTasks.filter(t => t.taskType === tab.key).length; });
    return counts;
  }, [allTasks]);

  // Dedicated calls section — calls with phone numbers
  const todaysCallsAll = useMemo(() =>
    allTasks.filter(t => (t.taskType === "new_call" || t.taskType === "follow_up") && t.phone && t.status !== "completed"),
  [allTasks]);
  const todaysCalls = useMemo(() => {
    let c = todaysCallsAll;
    if (callPriorityFilter) c = c.filter(t => t.priority === callPriorityFilter);
    if (callRepFilter)      c = c.filter(t => (t.ownerName || "").toLowerCase().includes(callRepFilter.toLowerCase()));
    return c;
  }, [todaysCallsAll, callPriorityFilter, callRepFilter]);
  const callReps = useMemo(() => [...new Set(todaysCallsAll.map(t => t.ownerName).filter(Boolean))], [todaysCallsAll]);
  const todaysCallsDone = useMemo(() =>
    allTasks.filter(t => (t.taskType === "new_call" || t.taskType === "follow_up") && t.phone && t.status === "completed"),
  [allTasks]);

  const pendingFiltered = filtered.filter(t => t.status !== "completed");
  const doneFiltered    = filtered.filter(t => t.status === "completed");

  const header  = dashboard?.header  || {};
  const summary = dashboard?.summary || {};

  const handleToggle = async (taskId) => {
    if (String(taskId).startsWith("auto-")) return; // auto-generated — no-op, open lead instead
    try {
      setActionId(taskId);
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${API_BASE}/api/today-plan/${taskId}/toggle`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message);
      await fetchDashboard();
    } catch (e) { toast.error(e?.message || "Failed to update"); }
    finally { setActionId(""); }
  };

  const handleDelete = async (taskId) => {
    if (String(taskId).startsWith("auto-")) return; // auto-generated — cannot delete
    if (!window.confirm("Delete this task?")) return;
    try {
      setActionId(taskId);
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${API_BASE}/api/today-plan/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message);
      await fetchDashboard();
    } catch (e) { toast.error(e?.message || "Failed to delete"); }
    finally { setActionId(""); }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    if (!addForm.title.trim()) { toast.warning("Title is required"); return; }
    try {
      setAddSaving(true);
      const token = localStorage.getItem("nnc_token");
      const res = await fetch(`${API_BASE}/api/today-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...addForm, section: "follow_up_today", plannedDate: new Date().toISOString() }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to add task");
      setAddOpen(false); setAddForm(EMPTY_ADD);
      await fetchDashboard();
    } catch (e) { toast.error(e?.message || "Failed to add task"); }
    finally { setAddSaving(false); }
  };

  const openLead = (task) => {
    if (!task?.leadId) return;
    setSelectedLeadId(task.leadId);
    setDrawerOpen(true);
  };

  const openQuickView = async (task) => {
    if (!task?.leadId) { toast.error("No lead linked"); return; }
    setQvTask(task);
    setQvLead(null);
    setQvInvoices([]);
    setQvQuotations([]);
    setQvSelQuote("");
    setQvPayStatus("");
    setQvSelectedInvoice("");
    setQvFollowupType("");
    setQvMeetingNotes("");
    setQvMeetingNext("");
    setQvMeetingDate("");
    setQvOpen(true);
    setQvLoading(true);
    try {
      const token = localStorage.getItem("nnc_token");
      const authH = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };
      const [leadRes, invRes, qtRes] = await Promise.all([
        fetch(`${API_BASE}/api/leads/${task.leadId}`, { headers: authH }),
        fetch(`${API_BASE}/api/invoices?limit=50`, { headers: authH }),
        fetch(`${API_BASE}/api/quotations?limit=50`, { headers: authH }),
      ]);
      const leadJson = await leadRes.json();
      const invJson  = await invRes.json();
      const qtJson   = await qtRes.json().catch(() => ({ data: [] }));
      const lead = leadJson?.data || leadJson?.lead || null;
      setQvLead(lead);
      setQvPayStatus(lead?.paymentStatus || "");
      // Filter invoices by client name match
      const allInv = Array.isArray(invJson?.data) ? invJson.data
        : Array.isArray(invJson?.invoices) ? invJson.invoices : [];
      const clientName = (lead?.name || task.title || "").toLowerCase();
      const matched = allInv.filter(inv =>
        inv.clientName?.toLowerCase().includes(clientName.split(" ")[0]) ||
        inv.leadId === task.leadId
      );
      setQvInvoices(matched.length > 0 ? matched : allInv.slice(0, 20));
      // Filter quotations by phone or name
      const allQt = Array.isArray(qtJson?.data) ? qtJson.data : [];
      const phone = lead?.phone?.replace(/\D/g,"") || "";
      const matchedQt = allQt.filter(q =>
        (phone && q.clientPhone?.replace(/\D/g,"") === phone) ||
        (lead?.name && q.clientName?.toLowerCase() === lead.name?.toLowerCase())
      );
      setQvQuotations(matchedQt.length > 0 ? matchedQt : allQt.slice(0, 10));
    } catch { toast.error("Failed to load lead details"); }
    finally { setQvLoading(false); }
  };

  const handleQvSave = async () => {
    if (!qvTask?.leadId) return;
    setQvSaving(true);
    try {
      const token = localStorage.getItem("nnc_token");
      const updateBody = {};
      if (qvFollowupType === "payment")  updateBody.paymentStatus = qvPayStatus;
      if (qvFollowupType === "meeting")  updateBody.lastMeetingOutcome = qvPayStatus;
      if (qvFollowupType === "proposal") updateBody.proposalDecision = qvPayStatus;
      if (qvFollowupType === "invoice")  updateBody.paymentStatus = qvPayStatus;

      if (Object.keys(updateBody).length > 0) {
        const res = await fetch(`${API_BASE}/api/leads/${qvTask.leadId}`, {
          method: "PUT",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(updateBody),
        });
        const json = await res.json();
        if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to update");
      }

      const typeLabel = { payment:"Payment", meeting:"Meeting", proposal:"Proposal", invoice:"Invoice" }[qvFollowupType] || "Follow-up";
      toast.success(`${typeLabel} follow-up marked as done ✓`);
      if (qvTask?._id) setQvDoneIds(prev => new Set([...prev, qvTask._id]));
      setQvOpen(false);
    } catch (e) { toast.error(e?.message || "Failed to save"); }
    finally { setQvSaving(false); }
  };

  const handleQuickLog = async (task) => {
    if (!task.leadId) { toast.error("No lead linked to this task"); return; }
    try {
      setQaSubmitting(true);
      const token = localStorage.getItem("nnc_token");
      const authH = token ? { Authorization: `Bearer ${token}` } : {};

      // Mark today's followup(s) as done + log note
      await fetch(`${API_BASE}/api/leads/${task.leadId}/followup-done`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authH },
        body: JSON.stringify({ outcome: qaData.outcome, notes: qaData.notes }),
      });

      // Schedule next follow-up if date chosen
      if (qaData.nextDate) {
        // 1. Add follow-up entry to the lead
        await fetch(`${API_BASE}/api/leads/${task.leadId}/followups`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authH },
          body: JSON.stringify({
            title: `Follow-up (after ${qaData.outcome})`,
            channel: "Call",
            status: "Pending",
            dueDate: qaData.nextDate,
          }),
        });

        // 2. Create a calendar event so it appears in the Calendar page
        fetch(`${API_BASE}/api/calendar-events`, {
          method: "POST",
          headers: { "Content-Type": "application/json", ...authH },
          body: JSON.stringify({
            leadId: task.leadId,
            type: "call_followup",
            date: qaData.nextDate,
            title: `Follow-up: ${task.title}`,
            notes: `Outcome: ${qaData.outcome}${qaData.notes ? " — " + qaData.notes : ""}`,
          }),
        }).catch(() => {});
      }

      toast.success("Logged & marked done! Calendar updated.");
      setQuickActionId(null);
      setQaData({ outcome: "", notes: "", nextDate: "" });
      await fetchDashboard();
    } catch {
      toast.error("Failed to log action");
    } finally {
      setQaSubmitting(false);
    }
  };

  const statCards = [
    { label: "New Calls",   value: summary.newCalls   || 0, accent: "red",    icon: <Phone size={16}/> },
    { label: "Follow-ups",  value: summary.followUps  || 0, accent: "blue",   icon: <ClipboardList size={16}/> },
    { label: "Payments",    value: summary.payments   || 0, accent: "yellow", icon: <ReceiptIndianRupee size={16}/> },
    { label: "Proposals",   value: summary.proposals  || 0, accent: "purple", icon: <FileText size={16}/> },
    { label: "Meetings",    value: summary.meetings   || 0, accent: "cyan",   icon: <CalendarDays size={16}/> },
    { label: "Onboarding",  value: summary.onboarding || 0, accent: "green",  icon: <Rocket size={16}/> },
  ];

  const TAB_MAP = { "New Calls":"new_call","Follow-ups":"follow_up","Payments":"payment","Proposals":"proposal","Meetings":"meeting","Onboarding":"onboarding" };

  return (
    <div className="tp-layout">
      <Sidebar active="TodaysPlanPage" />

      <div className="tp-main">
        <div className="tp-page">

          {/* ── Hero band ── */}
          <div className="tp-hero-band">
            <div className="tp-hero-band-left">
              <div className="tp-hero-eyebrow">Daily Action Plan</div>
              <h1 className="tp-title">Today's Plan</h1>
              <p className="tp-date">{header.dateLabel || new Date().toDateString()}</p>
              <div className="tp-hero-progress">
                <div className="tp-progress-track">
                  <div className="tp-progress-fill" style={{ width: `${header.completionPercent || 0}%` }}/>
                </div>
                <div className="tp-hero-score">
                  {header.completedTasks || 0}<span>/{header.totalTasks || 0} done</span>
                </div>
              </div>
            </div>
            <div className="tp-hero-band-right">
              <button className="tp-mail-btn" type="button" onClick={() => setEmailOpen(true)}>
                <Mail size={15}/> Send Email
              </button>
              <button className="tp-add-btn" type="button" onClick={() => setAddOpen(true)}>
                <Plus size={15}/> Add Task
              </button>
              <button className="tp-refresh-btn" type="button" onClick={fetchDashboard}>
                <RefreshCcw size={15}/> Refresh
              </button>
            </div>
          </div>

          {loading && <div className="statusBox">Loading today's plan...</div>}
          {err     && <div className="statusBox errorBox">{err}</div>}

          {!loading && !err && (
            <>
              {/* ── Stat cards ── */}
              <div className="tp-card-grid">
                {statCards.map(c => (
                  <div key={c.label} className={`tp-stat-card ${c.accent}`}
                    onClick={() => setActiveTab(TAB_MAP[c.label] || "all")}>
                    <div className="tp-stat-icon">{c.icon}</div>
                    <div className="tp-stat-value">{c.value}</div>
                    <div className="tp-stat-label">{c.label}</div>
                  </div>
                ))}
              </div>

              {/* ── Today's Calls ── */}
              {(todaysCalls.length > 0 || todaysCallsDone.length > 0) && (
                <div className="tp-calls-section">
                  <div className="tp-calls-header">
                    <div className="tp-calls-header-left">
                      <Phone size={18} className="tp-calls-icon"/>
                      <h2 className="tp-calls-title">Today's Calls</h2>
                      <span className="tp-calls-count">{todaysCalls.length} pending</span>
                      {todaysCallsDone.length > 0 && (
                        <span className="tp-calls-count done">{todaysCallsDone.length} done</span>
                      )}
                    </div>
                    <div className="tp-calls-filters">
                      <select className="tp-calls-filter-sel" value={callPriorityFilter} onChange={e => setCallPriorityFilter(e.target.value)}>
                        <option value="">All Priority</option>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      {callReps.length > 1 && (
                        <select className="tp-calls-filter-sel" value={callRepFilter} onChange={e => setCallRepFilter(e.target.value)}>
                          <option value="">All Reps</option>
                          {callReps.map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      )}
                      {(callPriorityFilter || callRepFilter) && (
                        <button className="tp-calls-filter-clear" onClick={() => { setCallPriorityFilter(""); setCallRepFilter(""); }}>
                          <X size={12}/> Clear
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="tp-calls-grid">
                    {todaysCalls.map(task => {
                      const isAuto  = !!task.isAutoGenerated;
                      const isDone  = qvDoneIds.has(task._id);
                      return (
                        <div key={`call-${task._id}`} className={`tp-call-card tp-prio-${task.priority}${isDone ? " qv-call-done" : ""}`}>
                          <div className="tp-call-card-top">
                            <div
                              className={`tp-checkbox${isAuto ? " disabled" : ""}${isDone ? " checked" : ""}`}
                              onClick={() => !isAuto && !isDone && handleToggle(task._id)}
                            >
                              <span className="tp-checkmark">{isDone && <Check size={13}/>}</span>
                            </div>
                            <div className="tp-call-info">
                              <div className="tp-call-name">{task.title}</div>
                              <div className="tp-call-meta">
                                {task.subtitle && <span>{task.subtitle}</span>}
                                {task.ownerName && <span>{task.ownerName}</span>}
                              </div>
                            </div>
                            {isDone
                              ? <span className="tp-call-prio-flag done">DONE</span>
                              : task.priority === "urgent"
                                ? <span className="tp-call-prio-flag urgent">URGENT</span>
                                : task.priority === "high"
                                  ? <span className="tp-call-prio-flag high">HIGH</span>
                                  : null
                            }
                          </div>
                          <div className="tp-call-card-bottom">
                            <a href={`tel:${task.phone}`} className={`tp-call-phone-btn${isDone ? " frozen" : ""}`}>
                              <Phone size={14}/> {task.phone}
                            </a>
                            <button type="button" className={`tp-call-wa-btn${isDone ? " frozen" : ""}`}
                              onClick={() => !isDone && window.open(`https://wa.me/${task.phone?.replace(/\D/g,"")}`, "_blank")}>
                              <MessageSquare size={14}/> WhatsApp
                            </button>
                            {task.leadId && (
                              isDone
                                ? <span className="tp-call-profile-btn done-badge"><CheckCircle2 size={12}/> Done</span>
                                : <button type="button" className="tp-call-profile-btn" onClick={() => openQuickView(task)}>
                                    <Eye size={12}/> View
                                  </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                    {todaysCallsDone.map(task => (
                      <div key={`call-done-${task._id}`} className="tp-call-card is-call-done">
                        <div className="tp-call-card-top">
                          <div className="tp-checkbox checked"
                            onClick={() => !task.isAutoGenerated && handleToggle(task._id)}>
                            <span className="tp-checkmark"><Check size={13}/></span>
                          </div>
                          <div className="tp-call-info">
                            <div className="tp-call-name">{task.title}</div>
                            <div className="tp-call-meta">
                              {task.phone && <span>{task.phone}</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!header.urgentTasks && (
                <div className="tp-alert-box">
                  <AlertCircle size={15}/>
                  <span>{header.urgentTasks} urgent task{header.urgentTasks > 1 ? "s" : ""} need immediate attention</span>
                </div>
              )}

            </>
          )}

          {/* ── Lead Drawer ── */}
          <LeadDrawer
            open={drawerOpen}
            leadId={selectedLeadId}
            apiBase={API_BASE}
            onClose={() => { setDrawerOpen(false); setSelectedLeadId(null); }}
            onLeadUpdated={fetchDashboard}
          />

          {/* ── Add Task Modal ── */}
          {addOpen && (
            <div className="tp-modal-overlay" onClick={() => setAddOpen(false)}>
              <div className="tp-modal-card" onClick={e => e.stopPropagation()}>
                <div className="tp-modal-header">
                  <h3><Plus size={15}/> Add Task</h3>
                  <button type="button" className="tp-modal-close" onClick={() => setAddOpen(false)}>×</button>
                </div>
                <form onSubmit={handleAddSubmit} className="tp-modal-form">
                  <div className="tp-modal-grid">
                    <div className="tp-form-group tp-full">
                      <label>Title *</label>
                      <input value={addForm.title} onChange={e => setAddForm(p => ({ ...p, title: e.target.value }))} placeholder="e.g. Call MR GURUNATH" required/>
                    </div>
                    <div className="tp-form-group tp-full">
                      <label>Description</label>
                      <input value={addForm.subtitle} onChange={e => setAddForm(p => ({ ...p, subtitle: e.target.value }))} placeholder="Brief note about this task"/>
                    </div>
                    <div className="tp-form-group">
                      <label>Type</label>
                      <select value={addForm.taskType} onChange={e => setAddForm(p => ({ ...p, taskType: e.target.value }))}>
                        <option value="follow_up">Follow-up</option>
                        <option value="new_call">New Call</option>
                        <option value="payment">Payment</option>
                        <option value="proposal">Proposal</option>
                        <option value="meeting">Meeting</option>
                        <option value="onboarding">Onboarding</option>
                      </select>
                    </div>
                    <div className="tp-form-group">
                      <label>Priority</label>
                      <select value={addForm.priority} onChange={e => setAddForm(p => ({ ...p, priority: e.target.value }))}>
                        <option value="urgent">Urgent</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                    </div>
                    <div className="tp-form-group">
                      <label>Phone</label>
                      <input value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} placeholder="10-digit number"/>
                    </div>
                    <div className="tp-form-group">
                      <label>Due Label</label>
                      <input value={addForm.dueLabel} onChange={e => setAddForm(p => ({ ...p, dueLabel: e.target.value }))} placeholder="e.g. 10:30 AM, ASAP"/>
                    </div>
                    <div className="tp-form-group tp-full">
                      <label>Notes</label>
                      <textarea rows={3} value={addForm.notes} onChange={e => setAddForm(p => ({ ...p, notes: e.target.value }))} placeholder="Any additional notes..."/>
                    </div>
                  </div>
                  <div className="tp-modal-footer">
                    <button type="button" className="tp-cancel-btn" onClick={() => setAddOpen(false)}>Cancel</button>
                    <button type="submit" className="tp-save-btn" disabled={addSaving}>
                      {addSaving ? "Adding..." : "Add Task"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ── Email Modal ── */}
          {emailOpen && (
            <EmailModal
              apiBase={API_BASE}
              onClose={() => setEmailOpen(false)}
            />
          )}

          {/* ── Quick View Modal ── */}
          {qvOpen && (
            <div className="qv-overlay" onClick={() => setQvOpen(false)}>
              <div className="qv-modal" onClick={e => e.stopPropagation()}>

                {/* Header */}
                <div className="qv-header">
                  <div className="qv-header-left">
                    <div className="qv-avatar">{(qvTask?.title || "?").charAt(0).toUpperCase()}</div>
                    <div>
                      <div className="qv-title">{qvTask?.title}</div>
                      <div className="qv-subtitle">{qvTask?.subtitle} {qvTask?.ownerName && `· ${qvTask.ownerName}`}</div>
                    </div>
                  </div>
                  <div className="qv-header-right">
                    <span className={`qv-prio-badge ${qvTask?.priority}`}>{qvTask?.priority?.toUpperCase()}</span>
                    {qvFollowupType && (
                      <button className="qv-back-btn" onClick={() => setQvFollowupType("")}>← Back</button>
                    )}
                    <button className="qv-close" onClick={() => setQvOpen(false)}>×</button>
                  </div>
                </div>

                {qvLoading ? (
                  <div className="qv-loading"><RefreshCcw size={20} className="tp-spin-icon"/> Loading details...</div>
                ) : !qvFollowupType ? (

                  /* ── STEP 1: Choose followup type ── */
                  <div className="qv-body">
                    <div className="qv-choose-title">What type of follow-up is this?</div>
                    <div className="qv-type-grid">
                      <button className="qv-type-card payment" onClick={() => setQvFollowupType("payment")}>
                        <div className="qv-type-icon">💳</div>
                        <div className="qv-type-label">Payment Follow-up</div>
                        <div className="qv-type-desc">Check payment status, amounts due &amp; received</div>
                      </button>
                      <button className="qv-type-card meeting" onClick={() => setQvFollowupType("meeting")}>
                        <div className="qv-type-icon">🗓️</div>
                        <div className="qv-type-label">Meeting Follow-up</div>
                        <div className="qv-type-desc">Log meeting outcome, next steps &amp; MOM</div>
                      </button>
                      <button className="qv-type-card proposal" onClick={() => setQvFollowupType("proposal")}>
                        <div className="qv-type-icon">📄</div>
                        <div className="qv-type-label">Proposal Follow-up</div>
                        <div className="qv-type-desc">Review quotation status &amp; client decision</div>
                      </button>
                      <button className="qv-type-card invoice" onClick={() => setQvFollowupType("invoice")}>
                        <div className="qv-type-icon">🧾</div>
                        <div className="qv-type-label">Invoice Follow-up</div>
                        <div className="qv-type-desc">Verify invoice details &amp; payment confirmation</div>
                      </button>
                    </div>
                    {/* Client mini info */}
                    {qvLead && (
                      <div className="qv-mini-client">
                        <span>👤 {qvLead.name}</span>
                        {qvLead.phone && <a href={`tel:${qvLead.phone}`}>📞 {qvLead.phone}</a>}
                        {qvLead.stage && <span className="qv-stage-badge">{qvLead.stage}</span>}
                      </div>
                    )}
                  </div>

                ) : (

                  /* ── STEP 2: Followup detail ── */
                  <div className="qv-body">

                    {/* Client strip */}
                    {qvLead && (
                      <div className="qv-client-strip">
                        <div className="qv-cs-name">{qvLead.name}</div>
                        <div className="qv-cs-meta">
                          {qvLead.phone    && <a href={`tel:${qvLead.phone}`}>📞 {qvLead.phone}</a>}
                          {qvLead.email    && <span>✉ {qvLead.email}</span>}
                          {qvLead.business && <span>🏢 {qvLead.business}</span>}
                          {qvLead.stage    && <span className="qv-stage-badge">{qvLead.stage}</span>}
                        </div>
                      </div>
                    )}

                    {/* ── PAYMENT FOLLOWUP ── */}
                    {qvFollowupType === "payment" && (
                      <>
                        <div className="qv-section">
                          <div className="qv-section-title">💳 Payment Status</div>
                          <div className="qv-field">
                            <label>Update Payment Status</label>
                            <select className="qv-select" value={qvPayStatus} onChange={e => setQvPayStatus(e.target.value)}>
                              <option value="">— Select Status —</option>
                              <option value="Pending">🟡 Pending</option>
                              <option value="Partial">🟠 Partial Received</option>
                              <option value="Advance Received">🔵 Advance Received</option>
                              <option value="Completed">🟢 Fully Paid</option>
                              <option value="Overdue">🔴 Overdue</option>
                            </select>
                          </div>
                          {qvLead && (
                            <div className="qv-pay-summary">
                              <div className="qv-pay-row"><span>Agreed Total</span><span>₹{Number(qvLead.agreedAmount||0).toLocaleString("en-IN")}</span></div>
                              <div className="qv-pay-row green"><span>Advance Received</span><span>₹{Number(qvLead.advanceReceived||0).toLocaleString("en-IN")}</span></div>
                              <div className="qv-pay-row red"><span>Balance Due</span><span>₹{Math.max(0,Number(qvLead.agreedAmount||0)-Number(qvLead.advanceReceived||0)).toLocaleString("en-IN")}</span></div>
                            </div>
                          )}
                        </div>
                        {qvInvoices.length > 0 && (
                          <div className="qv-section">
                            <div className="qv-section-title">🧾 Related Invoices</div>
                            <select className="qv-select" value={qvSelectedInvoice} onChange={e => setQvSelectedInvoice(e.target.value)}>
                              <option value="">— Select Invoice —</option>
                              {qvInvoices.map(inv => (
                                <option key={inv._id} value={inv._id}>
                                  {inv.invoiceNumber || inv._id?.slice(-6)} — ₹{Number(inv.totalAmount||inv.total||0).toLocaleString("en-IN")} — {inv.status||"Draft"}
                                </option>
                              ))}
                            </select>
                            {qvSelectedInvoice && (() => { const inv = qvInvoices.find(i=>i._id===qvSelectedInvoice); if(!inv) return null; return (
                              <div className="qv-invoice-detail">
                                <div className="qv-inv-row"><span>Invoice #</span><span>{inv.invoiceNumber||"—"}</span></div>
                                <div className="qv-inv-row"><span>Amount</span><span className="qv-amount">₹{Number(inv.totalAmount||inv.total||0).toLocaleString("en-IN")}</span></div>
                                <div className="qv-inv-row"><span>Status</span><span className={`qv-inv-status ${(inv.status||"").toLowerCase()}`}>{inv.status||"Draft"}</span></div>
                                {inv.dueDate && <div className="qv-inv-row"><span>Due Date</span><span>{new Date(inv.dueDate).toLocaleDateString("en-IN")}</span></div>}
                              </div>
                            );})()}
                          </div>
                        )}
                      </>
                    )}

                    {/* ── MEETING FOLLOWUP ── */}
                    {qvFollowupType === "meeting" && (
                      <div className="qv-section">
                        <div className="qv-section-title">🗓️ Meeting Details</div>
                        {qvLead && (
                          <div className="qv-info-grid">
                            {qvLead.stage         && <div className="qv-info-item"><span>Current Stage</span><span className="qv-stage-badge">{qvLead.stage}</span></div>}
                            {qvLead.agreedAmount  && <div className="qv-info-item"><span>Agreed Amount</span><span className="qv-amount">₹{Number(qvLead.agreedAmount).toLocaleString("en-IN")}</span></div>}
                            {qvLead.nextFollowUp  && <div className="qv-info-item"><span>Last Follow-up</span><span>{new Date(qvLead.nextFollowUp).toLocaleDateString("en-IN")}</span></div>}
                            {qvLead.notes         && <div className="qv-info-item" style={{flexDirection:"column",gap:4,alignItems:"flex-start"}}><span>Notes</span><span style={{color:"#374151",marginTop:4,lineHeight:1.5}}>{qvLead.notes}</span></div>}
                          </div>
                        )}
                        <div className="qv-field" style={{marginTop:12}}>
                          <label>Outcome / Update Status</label>
                          <select className="qv-select" value={qvPayStatus} onChange={e => setQvPayStatus(e.target.value)}>
                            <option value="">— Select Outcome —</option>
                            <option value="Meeting Done">✅ Meeting Done</option>
                            <option value="Demo Given">🖥️ Demo Given</option>
                            <option value="Rescheduled">📅 Rescheduled</option>
                            <option value="No Show">❌ No Show</option>
                            <option value="Interested">🔥 Interested</option>
                            <option value="Not Interested">👎 Not Interested</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ── PROPOSAL FOLLOWUP ── */}
                    {qvFollowupType === "proposal" && (
                      <div className="qv-section">
                        <div className="qv-section-title">📄 Proposal / Quotation Status</div>
                        {qvQuotations.length === 0 ? (
                          <div className="qv-no-invoices">No quotations found for this client</div>
                        ) : (
                          <>
                            <div className="qv-field">
                              <label>Select Quotation</label>
                              <select className="qv-select" value={qvSelQuote} onChange={e => setQvSelQuote(e.target.value)}>
                                <option value="">— Select —</option>
                                {qvQuotations.map(q => (
                                  <option key={q._id} value={q._id}>
                                    {q.quoteNumber} — ₹{Number(q.total||0).toLocaleString("en-IN")} — {q.status}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {qvSelQuote && (() => { const q = qvQuotations.find(x=>x._id===qvSelQuote); if(!q) return null; return (
                              <div className="qv-invoice-detail">
                                <div className="qv-inv-row"><span>Quote #</span><span style={{fontFamily:"monospace",fontWeight:700,color:"#7c3aed"}}>{q.quoteNumber}</span></div>
                                <div className="qv-inv-row"><span>Client</span><span>{q.clientName}</span></div>
                                <div className="qv-inv-row"><span>Total</span><span className="qv-amount">₹{Number(q.total||0).toLocaleString("en-IN")}</span></div>
                                {q.discount > 0 && <div className="qv-inv-row"><span>Discount</span><span style={{color:"#16a34a"}}>−₹{Number(q.discount||0).toLocaleString("en-IN")}</span></div>}
                                <div className="qv-inv-row"><span>Status</span><span className={`qv-inv-status ${(q.status||"").toLowerCase()}`}>{q.status}</span></div>
                                {q.validUntil && <div className="qv-inv-row"><span>Valid Until</span><span>{new Date(q.validUntil).toLocaleDateString("en-IN")}</span></div>}
                                {(q.lineItems||[]).length > 0 && (
                                  <div style={{marginTop:8,borderTop:"1px solid #f1f5f9",paddingTop:8}}>
                                    {q.lineItems.map((it,i) => (
                                      <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:12,padding:"3px 0",color:"#475569"}}>
                                        <span>{it.description}</span>
                                        <span style={{fontWeight:700}}>₹{Number(it.amount||0).toLocaleString("en-IN")}</span>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );})()}
                          </>
                        )}
                        <div className="qv-field" style={{marginTop:12}}>
                          <label>Client Decision</label>
                          <select className="qv-select" value={qvPayStatus} onChange={e => setQvPayStatus(e.target.value)}>
                            <option value="">— Select —</option>
                            <option value="Approved">✅ Approved</option>
                            <option value="Under Negotiation">🔄 Under Negotiation</option>
                            <option value="Revision Requested">✏️ Revision Requested</option>
                            <option value="Rejected">❌ Rejected</option>
                            <option value="Pending">⏳ Pending Response</option>
                          </select>
                        </div>
                      </div>
                    )}

                    {/* ── INVOICE FOLLOWUP ── */}
                    {qvFollowupType === "invoice" && (
                      <div className="qv-section">
                        <div className="qv-section-title">🧾 Invoice Details</div>
                        {qvInvoices.length === 0 ? (
                          <div className="qv-no-invoices">No invoices found for this client</div>
                        ) : (
                          <>
                            <div className="qv-field">
                              <label>Select Invoice</label>
                              <select className="qv-select" value={qvSelectedInvoice} onChange={e => setQvSelectedInvoice(e.target.value)}>
                                <option value="">— Select Invoice —</option>
                                {qvInvoices.map(inv => (
                                  <option key={inv._id} value={inv._id}>
                                    {inv.invoiceNumber||inv._id?.slice(-6)} — ₹{Number(inv.totalAmount||inv.total||0).toLocaleString("en-IN")} — {inv.status||"Draft"}
                                  </option>
                                ))}
                              </select>
                            </div>
                            {qvSelectedInvoice && (() => { const inv = qvInvoices.find(i=>i._id===qvSelectedInvoice); if(!inv) return null; return (
                              <div className="qv-invoice-detail">
                                <div className="qv-inv-row"><span>Invoice #</span><span style={{fontWeight:800}}>{inv.invoiceNumber||"—"}</span></div>
                                <div className="qv-inv-row"><span>Client</span><span>{inv.clientName||"—"}</span></div>
                                <div className="qv-inv-row"><span>Amount</span><span className="qv-amount">₹{Number(inv.totalAmount||inv.total||0).toLocaleString("en-IN")}</span></div>
                                <div className="qv-inv-row"><span>Status</span><span className={`qv-inv-status ${(inv.status||"").toLowerCase()}`}>{inv.status||"Draft"}</span></div>
                                {inv.dueDate && <div className="qv-inv-row"><span>Due Date</span><span style={{color: new Date(inv.dueDate) < new Date() ? "#dc2626":"#374151"}}>{new Date(inv.dueDate).toLocaleDateString("en-IN")}</span></div>}
                                {inv.paidAmount && <div className="qv-inv-row"><span>Paid</span><span className="qv-amount-green">₹{Number(inv.paidAmount).toLocaleString("en-IN")}</span></div>}
                              </div>
                            );})()}
                          </>
                        )}
                        <div className="qv-field" style={{marginTop:12}}>
                          <label>Payment Confirmation</label>
                          <select className="qv-select" value={qvPayStatus} onChange={e => setQvPayStatus(e.target.value)}>
                            <option value="">— Select —</option>
                            <option value="Paid">✅ Paid — Confirmed</option>
                            <option value="Partial">🟠 Partial Payment Done</option>
                            <option value="Pending">🟡 Still Pending</option>
                            <option value="Overdue">🔴 Overdue — Escalate</option>
                          </select>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* Footer */}
                <div className="qv-footer">
                  <button className="qv-btn-ghost" onClick={() => { setQvOpen(false); openLead(qvTask); }}>
                    <Eye size={13}/> Full Profile
                  </button>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="qv-btn-ghost" onClick={() => setQvOpen(false)}>Cancel</button>
                    {qvFollowupType && (
                      <button className="qv-btn-save" disabled={qvSaving || !qvPayStatus} onClick={handleQvSave}>
                        {qvSaving ? <><RefreshCcw size={13} className="tp-spin-icon"/> Saving…</> : <><BadgeCheck size={13}/> Save &amp; Done</>}
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
