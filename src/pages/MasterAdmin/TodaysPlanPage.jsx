import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { toast } from "../../utils/toast";
import {
  Phone, ClipboardList, ReceiptIndianRupee, FileText,
  CalendarDays, Rocket, AlertCircle, MessageSquare,
  Eye, RefreshCcw, Trash2, Plus, Search, X,
  Mail, Send, ChevronRight, ChevronLeft, CheckCircle2,
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
      const res  = await fetch(`${apiBase}/api/leads?q=${encodeURIComponent(q)}&limit=10`);
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
  const [activeTab, setActiveTab]   = useState("all");
  const [search, setSearch]         = useState("");
  const [addOpen, setAddOpen]       = useState(false);
  const [addForm, setAddForm]       = useState(EMPTY_ADD);
  const [addSaving, setAddSaving]   = useState(false);
  const [emailOpen, setEmailOpen]   = useState(false);
  const [quickActionId, setQuickActionId] = useState(null);
  const [qaData, setQaData]         = useState({ outcome: "", notes: "", nextDate: "" });
  const [qaSubmitting, setQaSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      setLoading(true); setErr("");
      const res  = await fetch(`${API_BASE}/api/today-plan/dashboard`);
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
    return [
      ...(dashboard.sections?.immediateTasks || []),
      ...(dashboard.sections?.scheduleTasks  || []),
    ];
  }, [dashboard]);

  const filtered = useMemo(() => {
    let tasks = activeTab === "all" ? allTasks : allTasks.filter(t => t.taskType === activeTab);
    if (search.trim()) {
      const q = search.toLowerCase();
      tasks = tasks.filter(t =>
        t.title?.toLowerCase().includes(q) ||
        t.subtitle?.toLowerCase().includes(q) ||
        t.phone?.includes(q) ||
        t.ownerName?.toLowerCase().includes(q)
      );
    }
    return tasks;
  }, [allTasks, activeTab, search]);

  const tabCounts = useMemo(() => {
    const counts = { all: allTasks.length };
    TABS.slice(1).forEach(tab => { counts[tab.key] = allTasks.filter(t => t.taskType === tab.key).length; });
    return counts;
  }, [allTasks]);

  const pendingFiltered = filtered.filter(t => t.status !== "completed");
  const doneFiltered    = filtered.filter(t => t.status === "completed");

  const header  = dashboard?.header  || {};
  const summary = dashboard?.summary || {};

  const handleToggle = async (taskId) => {
    if (String(taskId).startsWith("auto-")) return; // auto-generated — no-op, open lead instead
    try {
      setActionId(taskId);
      const res  = await fetch(`${API_BASE}/api/today-plan/${taskId}/toggle`, { method: "PATCH" });
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
      const res  = await fetch(`${API_BASE}/api/today-plan/${taskId}`, { method: "DELETE" });
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

              {!!header.urgentTasks && (
                <div className="tp-alert-box">
                  <AlertCircle size={15}/>
                  <span>{header.urgentTasks} urgent task{header.urgentTasks > 1 ? "s" : ""} need immediate attention</span>
                </div>
              )}

              {/* ── Content ── */}
              <div className="tp-content">

                {/* Filter bar */}
                <div className="tp-filter-bar">
                  <div className="tp-tabs">
                    {TABS.map(tab => (
                      <button key={tab.key} type="button"
                        className={`tp-tab ${activeTab === tab.key ? "active" : ""}`}
                        onClick={() => setActiveTab(tab.key)}>
                        {tab.label}
                        {tabCounts[tab.key] > 0 && <span className="tp-tab-count">{tabCounts[tab.key]}</span>}
                      </button>
                    ))}
                  </div>
                  <div className="tp-search-wrap">
                    <Search size={13} className="tp-search-icon"/>
                    <input className="tp-search" placeholder="Search name, phone, rep..."
                      value={search} onChange={e => setSearch(e.target.value)}/>
                    {search && <button type="button" className="tp-search-clear" onClick={() => setSearch("")}><X size={13}/></button>}
                  </div>
                </div>

                {/* Task panel */}
                <div className="tp-task-panel">
                  <div className="tp-panel-head">
                    <div className="tp-panel-title">
                      {activeTab === "all" ? "All Tasks" : TABS.find(t => t.key === activeTab)?.label}
                    </div>
                    <div className="tp-panel-counts">
                      <span className="tp-count-badge pending">{pendingFiltered.length} pending</span>
                      {doneFiltered.length > 0 && <span className="tp-count-badge done">{doneFiltered.length} done</span>}
                    </div>
                  </div>

                  {filtered.length === 0 ? (
                    <div className="tp-empty-box">No tasks found{search ? " for your search" : ""}.</div>
                  ) : (
                    <div className="tp-task-list">

                      {/* ── Pending tasks ── */}
                      {pendingFiltered.length > 0 && (
                        <div className="tp-section-header pending">
                          <span className="tp-section-dot" />
                          <span>Pending</span>
                          <span className="tp-section-count">{pendingFiltered.length}</span>
                        </div>
                      )}

                      {pendingFiltered.map(task => {
                        const isAuto   = !!task.isAutoGenerated;
                        const isBusy   = actionId === task._id;
                        const isQAOpen = quickActionId === task._id;
                        const typeIcon = {
                          new_call:"📞", follow_up:"🔁", payment:"💳",
                          proposal:"📄", meeting:"🗓️", onboarding:"🚀",
                        }[task.taskType] || "📌";

                        return (
                          <div key={task._id} className={`tp-row-card tp-prio-${task.priority}`}>
                            <div className="tp-row-main">
                              <span className="tp-row-emoji">{typeIcon}</span>
                              <div className="tp-row-info">
                                <div className="tp-row-name">{task.title}</div>
                                <div className="tp-row-meta">
                                  {task.phone     && <span className="tp-meta-ph">📞 {task.phone}</span>}
                                  {task.subtitle  && <span>{task.subtitle}</span>}
                                  {task.ownerName && <span>👤 {task.ownerName}</span>}
                                  {task.dueLabel && task.dueLabel !== "Today" && <span>⏰ {task.dueLabel}</span>}
                                  {isAuto && <span className="tp-meta-auto-badge">Auto</span>}
                                </div>
                              </div>
                              <div className="tp-row-right">
                                {task.priority === "urgent" && <span className="tp-prio-flag urgent">🔥</span>}
                                {task.priority === "high"   && <span className="tp-prio-flag high">⬆</span>}
                                {task.phone && (
                                  <button type="button" className="tp-icon-btn green" title="Call"
                                    onClick={() => { window.location.href = `tel:${task.phone}`; }}>
                                    <Phone size={12}/>
                                  </button>
                                )}
                                {task.phone && (
                                  <button type="button" className="tp-icon-btn sky" title="WhatsApp"
                                    onClick={() => window.open(`https://wa.me/${task.phone?.replace(/\D/g,"")}`, "_blank")}>
                                    <MessageSquare size={12}/>
                                  </button>
                                )}
                                {!isAuto && (
                                  <button type="button" className="tp-icon-btn red" title="Delete"
                                    onClick={() => handleDelete(task._id)}>
                                    <Trash2 size={12}/>
                                  </button>
                                )}
                                {isAuto ? (
                                  <button type="button"
                                    className={`tp-row-action-btn${isQAOpen ? " cancel" : ""}`}
                                    onClick={() => {
                                      setQuickActionId(isQAOpen ? null : task._id);
                                      if (!isQAOpen) setQaData({ outcome: "", notes: "", nextDate: "" });
                                    }}>
                                    {isQAOpen ? "✕ Cancel" : "⚡ Take Action"}
                                  </button>
                                ) : (
                                  <button type="button" className="tp-row-done-btn"
                                    disabled={isBusy}
                                    onClick={() => handleToggle(task._id)}>
                                    {isBusy
                                      ? <RefreshCcw size={12} className="tp-spin-icon"/>
                                      : <><CheckCircle2 size={12}/> Done</>
                                    }
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Inline Quick Action Panel */}
                            {isAuto && isQAOpen && (
                              <div className="tp-qa-panel">
                                <div className="tp-qa-header">
                                  📋 What happened with <strong>{task.title}</strong>?
                                </div>
                                <div className="tp-qa-outcomes">
                                  {[
                                    { key: "Answered",    icon: "📞" },
                                    { key: "Voicemail",   icon: "📬" },
                                    { key: "No Answer",   icon: "❌" },
                                    { key: "Meeting Set", icon: "🗓️" },
                                  ].map(o => (
                                    <button key={o.key} type="button"
                                      className={`tp-qa-out-btn${qaData.outcome === o.key ? " active" : ""}`}
                                      onClick={() => setQaData(p => ({ ...p, outcome: o.key }))}>
                                      {o.icon} {o.key}
                                    </button>
                                  ))}
                                </div>
                                <textarea className="tp-qa-notes" rows={2}
                                  placeholder="Quick notes (optional)..."
                                  value={qaData.notes}
                                  onChange={e => setQaData(p => ({ ...p, notes: e.target.value }))}/>
                                <div className="tp-qa-footer">
                                  <div className="tp-qa-next">
                                    <label>Next follow-up</label>
                                    <input type="date" value={qaData.nextDate}
                                      onChange={e => setQaData(p => ({ ...p, nextDate: e.target.value }))}/>
                                  </div>
                                  <div className="tp-qa-btns">
                                    <button type="button" className="tp-qa-view-btn" onClick={() => openLead(task)}>
                                      <Eye size={12}/> Profile
                                    </button>
                                    <button type="button" className="tp-qa-log-btn"
                                      disabled={!qaData.outcome || qaSubmitting}
                                      onClick={() => handleQuickLog(task)}>
                                      {qaSubmitting
                                        ? <><RefreshCcw size={12} className="tp-spin-icon"/> Saving…</>
                                        : <><CheckCircle2 size={12}/> Log & Done</>
                                      }
                                    </button>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* ── Completed tasks ── */}
                      {doneFiltered.length > 0 && (
                        <>
                          <div className="tp-section-header done">
                            <span className="tp-section-dot done" />
                            <span>Completed</span>
                            <span className="tp-section-count">{doneFiltered.length}</span>
                          </div>
                          {doneFiltered.map(task => {
                            const isAuto = !!task.isAutoGenerated;
                            const isBusy = actionId === task._id;
                            const typeIcon = {
                              new_call:"📞", follow_up:"🔁", payment:"💳",
                              proposal:"📄", meeting:"🗓️", onboarding:"🚀",
                            }[task.taskType] || "📌";
                            return (
                              <div key={task._id} className="tp-row-card tp-row-done">
                                <div className="tp-row-main">
                                  <CheckCircle2 size={14} style={{ color:"#22c55e", flexShrink:0 }}/>
                                  <div className="tp-row-info">
                                    <div className="tp-row-name done-name">{task.title}</div>
                                    <div className="tp-row-meta">
                                      {task.phone && <span style={{opacity:.6}}>📞 {task.phone}</span>}
                                      {task.ownerName && <span style={{opacity:.6}}>👤 {task.ownerName}</span>}
                                      <span style={{opacity:.5}}>{typeIcon} {task.taskType?.replace(/_/g," ")}</span>
                                    </div>
                                  </div>
                                  {!isAuto && (
                                    <button type="button" className="tp-row-undo-btn"
                                      disabled={isBusy}
                                      onClick={() => handleToggle(task._id)}>
                                      {isBusy ? "…" : "↩ Undo"}
                                    </button>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
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

        </div>
      </div>
    </div>
  );
}
