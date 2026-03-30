import { useCallback, useEffect, useState } from "react";
import {
  Plus, Search, Eye, Edit2, ArrowRightCircle, Trash2,
  ChevronLeft, ChevronRight, RefreshCcw, MessageSquare,
  Calendar, TrendingUp, Clock, Activity, Download,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { toast } from "../../utils/toast";
import "./EnquiriesPage.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const isMasterAdmin = () => localStorage.getItem("nnc_role") === "master_admin";

/* ── Constants ────────────────────────────────────────── */
const SERVICES = [
  { label: "Website Dev",               icon: "🌐" },
  { label: "Mobile App Dev",            icon: "📱" },
  { label: "Social Media Promotions",   icon: "📣" },
  { label: "Animation 2D/3D",           icon: "🎬" },
  { label: "Google Ads",                icon: "🎯" },
  { label: "SEO",                       icon: "🔍" },
  { label: "Corporate Ad Film",         icon: "🎥" },
  { label: "Logo & Branding",           icon: "✏️" },
  { label: "E-Commerce",                icon: "🛒" },
  { label: "Photography/Videography",   icon: "📷" },
  { label: "Custom Software",           icon: "💻" },
  { label: "UI/UX Design",             icon: "🎨" },
];

const SOURCES = [
  "Walk-In", "Referral", "Website", "Phone Call",
  "WhatsApp", "Instagram", "Google Ads", "JustDial",
];

const LANDING_PAGES = [
  { label: "Home Page",               value: "Home Page" },
  { label: "Contact Page",            value: "Contact Page" },
  { label: "Mobile App Dev Page",     value: "Mobile App Dev Page" },
  { label: "Website Dev Page",        value: "Website Dev Page" },
  { label: "Web Application Dev Page",value: "Web Application Dev Page" },
  { label: "Corporate Website Dev Page", value: "Corporate Website Dev Page" },
  { label: "E-Commerce Dev Page",     value: "E-Commerce Dev Page" },
  { label: "Custom CRM Dev Page",     value: "Custom CRM Dev Page" },
  { label: "SEO Page",                value: "SEO Page" },
  { label: "Digital Marketing Page",  value: "Digital Marketing Page" },
  { label: "Animation Page",          value: "Animation Page" },
  { label: "Graphic Design Page",     value: "Graphic Design Page" },
  { label: "Corporate Video Page",    value: "Corporate Video Page" },
  { label: "Progressive Web App Page",value: "Progressive Web App Page" },
  { label: "Landing Page Dev Page",   value: "Landing Page Dev Page" },
];

const STATUSES = ["new", "contacted", "follow-up", "quoted", "won", "lost"];
const BRANCHES = ["Bangalore", "Mysore", "Mumbai"];

const EMPTY_FORM = {
  name: "", phone: "", email: "", company: "", services: [],
  source: "Walk-In", budgetMin: "", budgetMax: "", requirements: "",
  branch: "Bangalore", assignedTo: "", status: "new", followUpDate: "",
};

function getStatusClass(status) {
  const map = {
    new: "enq-st-new",
    contacted: "enq-st-contacted",
    "follow-up": "enq-st-follow-up",
    quoted: "enq-st-quoted",
    won: "enq-st-won",
    lost: "enq-st-lost",
  };
  return map[status] || "enq-st-new";
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════ */
export default function EnquiriesPage() {
  const [mode, setMode] = useState("list"); // list | form | view
  const [enquiries, setEnquiries] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0, byStatus: {}, byService: [], conversionRate: 0, newThisMonth: 0, todayFollowUps: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filters, setFilters] = useState({ branch: "", status: "", source: "", service: "", landingPage: "", q: "", dateRange: "", page: 1 });
  const [exporting, setExporting] = useState(false);
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [viewingEnquiry, setViewingEnquiry] = useState(null);
  const [noteForm, setNoteForm] = useState({ action: "", note: "" });
  const [savingNote, setSavingNote] = useState(false);

  /* ── Auth header ── */
  function authHeader() {
    const token = localStorage.getItem("nnc_token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  /* ── Build query params from filters ── */
  function buildParams(extra = {}) {
    const p = new URLSearchParams();
    if (filters.branch)      p.set("branch",      filters.branch);
    if (filters.status)      p.set("status",      filters.status);
    if (filters.source)      p.set("source",      filters.source);
    if (filters.service)     p.set("service",     filters.service);
    if (filters.landingPage) p.set("landingPage", filters.landingPage);
    if (filters.q)           p.set("q",           filters.q);
    if (filters.dateRange)   p.set("dateRange",   filters.dateRange);
    Object.entries(extra).forEach(([k, v]) => p.set(k, v));
    return p;
  }

  /* ── Fetch enquiries ── */
  const fetchEnquiries = useCallback(async () => {
    setLoading(true);
    try {
      const p = buildParams({ page: filters.page });
      const res  = await fetch(`${API}/api/enquiries?${p}`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) { setEnquiries(json.data || []); setTotalCount(json.total || 0); }
      else toast.error(json.message || "Failed to load enquiries");
    } catch {
      toast.error("Failed to load enquiries");
    } finally { setLoading(false); }
  }, [filters]);

  /* ── Export CSV ── */
  const handleExport = async () => {
    setExporting(true);
    try {
      const p = buildParams();
      const res = await fetch(`${API}/api/enquiries/export?${p}`, { headers: authHeader() });
      if (!res.ok) { toast.error("Export failed"); setExporting(false); return; }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href     = url;
      a.download = `enquiries-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported successfully!");
    } catch {
      toast.error("Export failed");
    } finally { setExporting(false); }
  };

  /* ── Fetch stats ── */
  const fetchStats = useCallback(async () => {
    try {
      const res  = await fetch(`${API}/api/enquiries/stats`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) setStats(json.data || stats);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchEnquiries(); }, [fetchEnquiries]);
  useEffect(() => { fetchStats(); }, [fetchStats]);

  /* ── Open helpers ── */
  const openNew = () => {
    setFormData({ ...EMPTY_FORM });
    setEditingId(null);
    setMode("form");
  };

  const openEdit = (enq) => {
    setFormData({
      name: enq.name || "",
      phone: enq.phone || "",
      email: enq.email || "",
      company: enq.company || "",
      services: Array.isArray(enq.services) ? enq.services : [],
      source: enq.source || "Walk-In",
      budgetMin: enq.budgetMin ?? "",
      budgetMax: enq.budgetMax ?? "",
      requirements: enq.requirements || "",
      branch: enq.branch || "Bangalore",
      assignedTo: enq.assignedTo || "",
      status: enq.status || "new",
      followUpDate: enq.followUpDate ? enq.followUpDate.split("T")[0] : "",
    });
    setEditingId(enq._id);
    setMode("form");
  };

  const openView = (enq) => {
    setViewingEnquiry(enq);
    setNoteForm({ action: "", note: "" });
    setMode("view");
  };

  /* ── Save ── */
  const handleSave = async () => {
    if (!formData.name.trim()) return toast.error("Name is required");
    if (!formData.phone.trim()) return toast.error("Phone is required");
    if (!formData.branch) return toast.error("Branch is required");

    setSaving(true);
    try {
      const method = editingId ? "PUT" : "POST";
      const url    = editingId ? `${API}/api/enquiries/${editingId}` : `${API}/api/enquiries`;
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(formData),
      });
      const json = await res.json();
      if (json.success) {
        toast.success(editingId ? "Enquiry updated!" : "Enquiry created!");

        /* Sync follow-up date to calendar */
        if (formData.followUpDate) {
          const savedEnquiry = json.data;
          const prevDate = editingId
            ? enquiries.find(e => e._id === editingId)?.followUpDate
            : null;
          const prevDateStr = prevDate ? new Date(prevDate).toISOString().split("T")[0] : "";
          if (formData.followUpDate !== prevDateStr) {
            fetch(`${API}/api/calendar-events`, {
              method: "POST",
              headers: { "Content-Type": "application/json", ...authHeader() },
              body: JSON.stringify({
                enquiryId: savedEnquiry?._id || editingId,
                type: "enquiry_followup",
                date: formData.followUpDate,
                title: `Follow-up: ${formData.name}`,
                notes: `Enquiry follow-up for ${formData.name} (${formData.phone})${formData.company ? " — " + formData.company : ""}`,
              }),
            }).catch(() => {});
          }
        }

        setMode("list");
        fetchEnquiries();
        fetchStats();
      } else {
        toast.error(json.message || "Save failed");
      }
    } catch {
      toast.error("Save failed");
    } finally { setSaving(false); }
  };

  /* ── Delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this enquiry?")) return;
    try {
      const res  = await fetch(`${API}/api/enquiries/${id}`, { method: "DELETE", headers: authHeader() });
      const json = await res.json();
      if (json.success) { toast.success("Deleted"); fetchEnquiries(); fetchStats(); }
      else toast.error(json.message || "Delete failed");
    } catch { toast.error("Delete failed"); }
  };

  /* ── Convert ── */
  const handleConvert = async (id) => {
    if (!window.confirm("Convert this enquiry to a lead?")) return;
    try {
      const res  = await fetch(`${API}/api/enquiries/${id}/convert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Enquiry converted to lead!");
        fetchEnquiries();
        fetchStats();
        if (viewingEnquiry && viewingEnquiry._id === id) {
          setViewingEnquiry(prev => ({ ...prev, convertedToLead: true }));
        }
      } else toast.error(json.message || "Conversion failed");
    } catch { toast.error("Conversion failed"); }
  };

  /* ── Add activity ── */
  const addActivity = async (enquiryId) => {
    if (!noteForm.action.trim()) return toast.error("Action is required");
    setSavingNote(true);
    try {
      const res  = await fetch(`${API}/api/enquiries/${enquiryId}/activity`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(noteForm),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Activity logged!");
        setNoteForm({ action: "", note: "" });
        const updated = json.data;
        setViewingEnquiry(updated);
      } else toast.error(json.message || "Failed to add note");
    } catch { toast.error("Failed to add note"); }
    finally { setSavingNote(false); }
  };

  /* ── Filter change ── */
  const setFilter = (key, val) => setFilters(f => ({ ...f, [key]: val, page: 1 }));
  const clearFilters = () => setFilters({ branch: "", status: "", source: "", service: "", landingPage: "", q: "", dateRange: "", page: 1 });

  /* ── Form field change ── */
  const setField = (key, val) => setFormData(f => ({ ...f, [key]: val }));
  const toggleService = (label) => {
    setFormData(f => {
      const arr = f.services.includes(label) ? f.services.filter(s => s !== label) : [...f.services, label];
      return { ...f, services: arr };
    });
  };

  /* ── Pagination ── */
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  // Clamp page if it exceeds totalPages (e.g. after filtering reduces results)
  useEffect(() => {
    if (filters.page > totalPages) {
      setFilters(f => ({ ...f, page: totalPages }));
    }
  }, [totalPages, filters.page]);

  /* ════════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════════ */
  return (
    <div className="enq-layout">
      <Sidebar />
      <div className="enq-main">
        {mode === "list" && (
          <>
            {/* Hero header */}
            <div className="enq-header">
              <div>
                <div className="enq-eyebrow">NNC CRM</div>
                <div className="enq-title">Enquiry Management</div>
                <div className="enq-subtitle">Track and convert enquiries to clients</div>
              </div>
              <div className="enq-header-acts">
                <button className="enq-btn-sec" onClick={handleExport} disabled={exporting}>
                  <Download size={14} className={exporting ? "enq-spin" : ""} />
                  {exporting ? "Exporting…" : "Export CSV"}
                </button>
                <button className="enq-btn-sec" onClick={fetchEnquiries}>
                  <RefreshCcw size={14} className={loading ? "enq-spin" : ""} />
                  Refresh
                </button>
                <button className="enq-btn-prim" onClick={openNew}>
                  <Plus size={15} /> New Enquiry
                </button>
              </div>
            </div>

            {/* KPI Strip */}
            <div className="enq-kpi-strip">
              <div className="enq-kpi-item">
                <div className="enq-kpi-icon"><MessageSquare size={20} /></div>
                <div className="enq-kpi-text">
                  <div className="enq-kpi-val">{stats.total}</div>
                  <div className="enq-kpi-label">Total Enquiries</div>
                </div>
              </div>
              <div className="enq-kpi-item">
                <div className="enq-kpi-icon"><Calendar size={20} /></div>
                <div className="enq-kpi-text">
                  <div className="enq-kpi-val">{stats.newThisMonth}</div>
                  <div className="enq-kpi-label">New This Month</div>
                </div>
              </div>
              <div className="enq-kpi-item">
                <div className="enq-kpi-icon"><Clock size={20} /></div>
                <div className="enq-kpi-text">
                  <div className="enq-kpi-val">{stats.todayFollowUps}</div>
                  <div className="enq-kpi-label">Today's Follow-ups</div>
                </div>
              </div>
              <div className="enq-kpi-item">
                <div className="enq-kpi-icon"><TrendingUp size={20} /></div>
                <div className="enq-kpi-text">
                  <div className="enq-kpi-val">{stats.conversionRate}%</div>
                  <div className="enq-kpi-label">Conversion Rate</div>
                </div>
              </div>
            </div>

            {/* Filter bar */}
            <div className="enq-filter-bar">
              {/* Date range quick filters */}
              <div className="enq-date-range-group">
                {[
                  { key: "",      label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "week",  label: "This Week" },
                  { key: "month", label: "This Month" },
                  { key: "year",  label: "This Year" },
                ].map(dr => (
                  <button
                    key={dr.key}
                    className={`enq-dr-btn${filters.dateRange === dr.key ? " active" : ""}`}
                    onClick={() => setFilter("dateRange", dr.key)}
                  >
                    {dr.label}
                  </button>
                ))}
              </div>

              <div className="enq-filter-selects">
                <select value={filters.branch} onChange={e => setFilter("branch", e.target.value)}>
                  <option value="">All Branches</option>
                  {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                <select value={filters.status} onChange={e => setFilter("status", e.target.value)}>
                  <option value="">All Statuses</option>
                  {STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
                <select value={filters.source} onChange={e => { setFilter("source", e.target.value); if (e.target.value !== "Website") setFilter("landingPage", ""); }}>
                  <option value="">All Sources</option>
                  {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filters.service} onChange={e => setFilter("service", e.target.value)}>
                  <option value="">All Services</option>
                  {SERVICES.map(s => <option key={s.label} value={s.label}>{s.icon} {s.label}</option>)}
                </select>
                <select
                  value={filters.landingPage}
                  onChange={e => { setFilter("landingPage", e.target.value); if (e.target.value) setFilter("source", "Website"); }}
                  title="Filter by website landing page"
                >
                  <option value="">All Landing Pages</option>
                  {LANDING_PAGES.map(p => <option key={p.value} value={p.value}>🌐 {p.label}</option>)}
                </select>
                <div className="enq-search-wrap">
                  <Search size={14} />
                  <input
                    placeholder="Search name, phone, company…"
                    value={filters.q}
                    onChange={e => setFilter("q", e.target.value)}
                  />
                </div>
                <button className="enq-filter-clear" onClick={clearFilters}>Clear All</button>
              </div>
            </div>

            {/* Table */}
            <div className="enq-table-section">
              <div className="enq-table-card">
                <div className="enq-table-head">
                  <span>
                    <span className="enq-table-head-title">
                      {filters.dateRange === "today" ? "Today's Enquiries"
                        : filters.dateRange === "week"  ? "This Week's Enquiries"
                        : filters.dateRange === "month" ? "This Month's Enquiries"
                        : filters.dateRange === "year"  ? "This Year's Enquiries"
                        : "All Enquiries"}
                    </span>
                    <span className="enq-table-head-count">({totalCount})</span>
                  </span>
                  <button
                    className="enq-export-inline"
                    onClick={handleExport}
                    disabled={exporting}
                    title="Export current view as CSV"
                  >
                    <Download size={13} /> {exporting ? "Exporting…" : "Export CSV"}
                  </button>
                </div>
                {loading ? (
                  <div className="enq-loading"><RefreshCcw size={28} className="enq-spin" /></div>
                ) : enquiries.length === 0 ? (
                  <div className="enq-empty">
                    <div className="enq-empty-icon"><MessageSquare size={40} /></div>
                    <div className="enq-empty-text">No enquiries found</div>
                    <div className="enq-empty-sub">Try adjusting filters or add a new enquiry</div>
                  </div>
                ) : (
                  <div className="enq-table-wrap">
                    <table className="enq-table">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Name / Phone</th>
                          <th>Company</th>
                          <th>Services</th>
                          <th>Source</th>
                          <th>Branch</th>
                          <th>Assigned To</th>
                          <th>Follow-up</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {enquiries.map((enq, idx) => (
                          <tr key={enq._id}>
                            <td>{(filters.page - 1) * 20 + idx + 1}</td>
                            <td>
                              <div className="enq-name">{enq.name}</div>
                              <div className="enq-phone">{enq.phone}</div>
                            </td>
                            <td><span className="enq-company">{enq.company || "—"}</span></td>
                            <td>
                              <div className="enq-svc-badges">
                                {(enq.services || []).slice(0, 2).map(s => (
                                  <span key={s} className="enq-svc-badge">{s}</span>
                                ))}
                                {(enq.services || []).length > 2 && (
                                  <span className="enq-svc-more">+{enq.services.length - 2} more</span>
                                )}
                                {(!enq.services || enq.services.length === 0) && <span style={{ color: "#94a3b8", fontSize: 12 }}>—</span>}
                              </div>
                            </td>
                            <td>
                              <div style={{ display:"flex", flexDirection:"column", gap:3 }}>
                                <span>{enq.source || "—"}</span>
                                {enq.source === "Website" && enq.landingPage && (
                                  <span
                                    className="enq-landing-badge"
                                    title={enq.landingPage}
                                    onClick={() => setFilter("landingPage", enq.landingPage)}
                                    style={{ cursor:"pointer" }}
                                  >
                                    🌐 {enq.landingPage}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td>{enq.branch || "—"}</td>
                            <td>{enq.assignedTo || "—"}</td>
                            <td>{fmtDate(enq.followUpDate)}</td>
                            <td>
                              <span className={`enq-status ${getStatusClass(enq.status)}`}>
                                {enq.status || "new"}
                              </span>
                            </td>
                            <td>
                              <div className="enq-actions">
                                <button className="enq-btn-icon" title="View" onClick={() => openView(enq)}>
                                  <Eye size={15} />
                                </button>
                                <button className="enq-btn-icon" title="Edit" onClick={() => openEdit(enq)}>
                                  <Edit2 size={15} />
                                </button>
                                <button
                                  className="enq-btn-icon convert"
                                  title={enq.convertedToLead ? "Already converted" : "Convert to lead"}
                                  disabled={!!enq.convertedToLead}
                                  onClick={() => handleConvert(enq._id)}
                                >
                                  <ArrowRightCircle size={15} />
                                </button>
                                {isMasterAdmin() && (
                                  <button className="enq-btn-icon danger" title="Delete" onClick={() => handleDelete(enq._id)}>
                                    <Trash2 size={15} />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="enq-pagination">
                    <span className="enq-page-info">Page {filters.page} of {totalPages}</span>
                    <button
                      className="enq-page-btn"
                      disabled={filters.page <= 1}
                      onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <button
                      className="enq-page-btn"
                      disabled={filters.page >= totalPages}
                      onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ─── FORM VIEW ──────────────────────────────── */}
        {mode === "form" && (
          <div className="enq-form-view">
            {/* Form header */}
            <div className="enq-form-subheader">
              <button className="enq-back-btn" onClick={() => setMode("list")}>
                <ChevronLeft size={15} /> Back
              </button>
              <div>
                <div className="enq-form-heading">{editingId ? "Edit Enquiry" : "New Enquiry"}</div>
                <div className="enq-form-subheading">Fill in the client details and service requirements</div>
              </div>
              <div style={{ marginLeft: "auto" }}>
                <button className="enq-save-btn" disabled={saving} onClick={handleSave} style={{ padding: "10px 24px" }}>
                  {saving ? "Saving…" : editingId ? "Update Enquiry" : "Create Enquiry"}
                </button>
              </div>
            </div>

            <div className="enq-form-2col">
              {/* Left column: main content */}
              <div className="enq-form-left">
                {/* Contact Information */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">
                    <span className="enq-card-icon">👤</span> Contact Information
                  </div>
                  <div className="enq-form-card-body">
                    <div className="enq-form-grid">
                      <div className="enq-field">
                        <label className="enq-label">Full Name <span className="enq-req">*</span></label>
                        <input className="enq-input" value={formData.name} onChange={e => setField("name", e.target.value)} placeholder="e.g. Rahul Sharma" />
                      </div>
                      <div className="enq-field">
                        <label className="enq-label">Phone <span className="enq-req">*</span></label>
                        <input className="enq-input" value={formData.phone} onChange={e => setField("phone", e.target.value)} placeholder="+91 9900000000" />
                      </div>
                      <div className="enq-field">
                        <label className="enq-label">Email Address</label>
                        <input className="enq-input" type="email" value={formData.email} onChange={e => setField("email", e.target.value)} placeholder="email@company.com" />
                      </div>
                      <div className="enq-field">
                        <label className="enq-label">Company / Business</label>
                        <input className="enq-input" value={formData.company} onChange={e => setField("company", e.target.value)} placeholder="Company name" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">
                    <span className="enq-card-icon">🛠️</span> Services Required
                    {formData.services.length > 0 && (
                      <span className="enq-svc-count">{formData.services.length} selected</span>
                    )}
                  </div>
                  <div className="enq-form-card-body">
                    <div className="enq-services-grid">
                      {SERVICES.map(svc => (
                        <label
                          key={svc.label}
                          className={`enq-svc-check ${formData.services.includes(svc.label) ? "checked" : ""}`}
                          onClick={() => toggleService(svc.label)}
                        >
                          <span className="enq-svc-icon">{svc.icon}</span>
                          <span className="enq-svc-check-label">{svc.label}</span>
                          {formData.services.includes(svc.label) && (
                            <span className="enq-svc-tick">✓</span>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Requirements */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">
                    <span className="enq-card-icon">📝</span> Requirements & Notes
                  </div>
                  <div className="enq-form-card-body">
                    <textarea
                      className="enq-textarea"
                      style={{ width: "100%", boxSizing: "border-box" }}
                      rows={5}
                      value={formData.requirements}
                      onChange={e => setField("requirements", e.target.value)}
                      placeholder="Describe what the client is looking for — project scope, timeline, specific features, references, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Right column: sidebar */}
              <div className="enq-form-sidebar">
                {/* Assignment & Status */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">
                    <span className="enq-card-icon">⚙️</span> Assignment
                  </div>
                  <div className="enq-form-card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="enq-field">
                      <label className="enq-label">Branch <span className="enq-req">*</span></label>
                      <select className="enq-select" value={formData.branch} onChange={e => setField("branch", e.target.value)}>
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                      </select>
                    </div>
                    <div className="enq-field">
                      <label className="enq-label">Assigned To</label>
                      <input className="enq-input" value={formData.assignedTo} onChange={e => setField("assignedTo", e.target.value)} placeholder="Sales person name" />
                    </div>
                    <div className="enq-field">
                      <label className="enq-label">Source</label>
                      <select className="enq-select" value={formData.source} onChange={e => setField("source", e.target.value)}>
                        {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">
                    <span className="enq-card-icon">📊</span> Status
                  </div>
                  <div className="enq-form-card-body">
                    <div className="enq-status-pills">
                      {STATUSES.map(s => (
                        <button
                          key={s}
                          type="button"
                          className={`enq-status-pill ${getStatusClass(s)}${formData.status === s ? " pill-active" : ""}`}
                          onClick={() => setField("status", s)}
                        >
                          {s.charAt(0).toUpperCase() + s.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Budget & Follow-up */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">
                    <span className="enq-card-icon">💰</span> Budget & Timeline
                  </div>
                  <div className="enq-form-card-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="enq-budget-row">
                      <div className="enq-field" style={{ flex: 1 }}>
                        <label className="enq-label">Min (₹)</label>
                        <input className="enq-input" type="number" value={formData.budgetMin} onChange={e => setField("budgetMin", e.target.value)} placeholder="0" />
                      </div>
                      <div className="enq-budget-dash">–</div>
                      <div className="enq-field" style={{ flex: 1 }}>
                        <label className="enq-label">Max (₹)</label>
                        <input className="enq-input" type="number" value={formData.budgetMax} onChange={e => setField("budgetMax", e.target.value)} placeholder="0" />
                      </div>
                    </div>
                    <div className="enq-field">
                      <label className="enq-label">Follow-up Date</label>
                      <input className="enq-input" type="date" value={formData.followUpDate} onChange={e => setField("followUpDate", e.target.value)} />
                      {formData.followUpDate && (
                        <div className="enq-followup-hint">
                          <Calendar size={11} /> Will be added to Calendar
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="enq-form-sidebar-actions">
                  <button className="enq-save-btn" disabled={saving} onClick={handleSave} style={{ width: "100%" }}>
                    {saving ? "Saving…" : editingId ? "Update Enquiry" : "Create Enquiry"}
                  </button>
                  <button className="enq-cancel-btn" onClick={() => setMode("list")} style={{ width: "100%" }}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── DETAIL VIEW ──────────────────────────────── */}
        {mode === "view" && viewingEnquiry && (
          <div className="enq-form-view">
            <div className="enq-detail-topbar">
              <div className="enq-detail-topbar-left">
                <button className="enq-back-btn" onClick={() => setMode("list")}>
                  <ChevronLeft size={15} /> Back
                </button>
                <div>
                  <div className="enq-detail-name">{viewingEnquiry.name}</div>
                  <div className="enq-detail-phone">{viewingEnquiry.phone}</div>
                </div>
                <span className={`enq-status ${getStatusClass(viewingEnquiry.status)}`}>
                  {viewingEnquiry.status}
                </span>
              </div>
              <div className="enq-detail-acts">
                <button
                  className="enq-convert-btn"
                  disabled={!!viewingEnquiry.convertedToLead}
                  onClick={() => handleConvert(viewingEnquiry._id)}
                >
                  <ArrowRightCircle size={15} />
                  {viewingEnquiry.convertedToLead ? "Converted" : "Convert to Lead"}
                </button>
                <button className="enq-btn-sec" onClick={() => openEdit(viewingEnquiry)}>
                  <Edit2 size={14} /> Edit
                </button>
              </div>
            </div>

            <div className="enq-detail-body">
              <div className="enq-detail-cols">
                {/* Left: all fields */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">Enquiry Details</div>
                  <div className="enq-form-card-body">
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Company</div>
                      <div className="enq-detail-field-val">{viewingEnquiry.company || "—"}</div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Email</div>
                      <div className="enq-detail-field-val">{viewingEnquiry.email || "—"}</div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Services</div>
                      <div className="enq-svc-badges" style={{ marginTop: 4 }}>
                        {(viewingEnquiry.services || []).map(s => (
                          <span key={s} className="enq-svc-badge">{s}</span>
                        ))}
                        {(!viewingEnquiry.services || viewingEnquiry.services.length === 0) && <span style={{ color: "#94a3b8" }}>—</span>}
                      </div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Source</div>
                      <div className="enq-detail-field-val">{viewingEnquiry.source || "—"}</div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Branch</div>
                      <div className="enq-detail-field-val">{viewingEnquiry.branch || "—"}</div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Budget</div>
                      <div className="enq-detail-field-val">
                        {viewingEnquiry.budgetMin || viewingEnquiry.budgetMax
                          ? `₹${viewingEnquiry.budgetMin || 0} – ₹${viewingEnquiry.budgetMax || 0}`
                          : "—"}
                      </div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Assigned To</div>
                      <div className="enq-detail-field-val">{viewingEnquiry.assignedTo || "—"}</div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Follow-up Date</div>
                      <div className="enq-detail-field-val">{fmtDate(viewingEnquiry.followUpDate)}</div>
                    </div>
                    <div className="enq-detail-field">
                      <div className="enq-detail-field-label">Created</div>
                      <div className="enq-detail-field-val">{fmtDate(viewingEnquiry.createdAt)}</div>
                    </div>
                    {viewingEnquiry.requirements && (
                      <div className="enq-detail-field">
                        <div className="enq-detail-field-label">Requirements</div>
                        <div className="enq-detail-field-val" style={{ whiteSpace: "pre-wrap" }}>{viewingEnquiry.requirements}</div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: Activity Log */}
                <div className="enq-form-card">
                  <div className="enq-form-card-title">Activity Log</div>
                  <div className="enq-form-card-body">
                    {(viewingEnquiry.activityLog && viewingEnquiry.activityLog.length > 0) ? (
                      <div className="enq-activity-timeline">
                        {[...(viewingEnquiry.activityLog)].reverse().map((log, i) => (
                          <div key={i} className="enq-activity-item">
                            <div className="enq-activity-dot">
                              <Activity size={12} color="#7c3aed" />
                            </div>
                            <div className="enq-activity-content">
                              <div className="enq-activity-action">{log.action}</div>
                              {log.note && <div className="enq-activity-note">{log.note}</div>}
                              <div className="enq-activity-meta">
                                {log.by && <span>{log.by} · </span>}
                                {fmtDate(log.date || log.createdAt)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ color: "#94a3b8", fontSize: 13, textAlign: "center", padding: "20px 0" }}>
                        No activity yet
                      </div>
                    )}

                    {/* Add Note Form */}
                    <div className="enq-add-note-form">
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#334155", marginBottom: 4 }}>Add Activity Note</div>
                      <div className="enq-field">
                        <label className="enq-label">Action</label>
                        <input
                          className="enq-input"
                          placeholder="e.g. Called, Sent Proposal, Follow-up done…"
                          value={noteForm.action}
                          onChange={e => setNoteForm(n => ({ ...n, action: e.target.value }))}
                        />
                      </div>
                      <div className="enq-field">
                        <label className="enq-label">Note</label>
                        <textarea
                          className="enq-textarea"
                          rows={3}
                          placeholder="Additional notes…"
                          value={noteForm.note}
                          onChange={e => setNoteForm(n => ({ ...n, note: e.target.value }))}
                          style={{ width: "100%", boxSizing: "border-box" }}
                        />
                      </div>
                      <button
                        className="enq-note-save-btn"
                        disabled={savingNote}
                        onClick={() => addActivity(viewingEnquiry._id)}
                      >
                        {savingNote ? "Saving…" : "Save Note"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
