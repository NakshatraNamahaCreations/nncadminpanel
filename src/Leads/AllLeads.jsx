import React, { useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "../utils/toast";
import Sidebar from "../components/Sidebar/Sidebar";
import LeadDrawer from "../Leads/LeadDrawer";
import { Trash2, Download, Eye, Pencil, X, Search, CalendarPlus, Plus } from "lucide-react";
import { ShimmerLeadList, BtnSpinner } from "../components/ui/Shimmer";
import "./AllLeads.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const money = (n) => {
  try {
    if (n == null || n === 0) return "—";
    return `₹${Number(n).toLocaleString("en-IN")}`;
  } catch { return "—"; }
};

const cls = (s = "") => String(s).toLowerCase().replace(/\s+/g, "-");

const getAgo = (dateValue) => {
  try {
    if (!dateValue) return "—";
    const days = Math.floor((Date.now() - new Date(dateValue).getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "1d ago";
    return `${days}d ago`;
  } catch { return "—"; }
};

const initials = (name = "") => {
  try {
    return String(name).trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "?";
  } catch { return "?"; }
};

const STAGE_COLOR = {
  "Lead Capture": { bg: "#eaf1ff", color: "#2457e6" },
  Reachable:      { bg: "#e8faef", color: "#0a9b52" },
  Qualified:      { bg: "#fff4df", color: "#de8a00" },
  Proposal:       { bg: "#f2eaff", color: "#7c3aed" },
  Closed:         { bg: "#e7f7ef", color: "#0c9f61" },
};

const PRIO_COLOR = { Hot: "#ef4444", Warm: "#f59e0b", Cold: "#64748b" };

const EMPTY_EDIT_FORM = {
  _id: "", name: "", phone: "", email: "", business: "",
  industry: "", location: "", requirements: "",
  branch: "Bangalore", source: "WhatsApp",
  stage: "Lead Capture", priority: "Hot", value: "", days: "0d", rep: "",
  advanceReceived: "", advanceReceivedDate: "", agreedTimeline: "",
};

/* Format a Date/ISO string → "YYYY-MM-DD" for <input type="date"> */
const toDateInput = (val) => {
  if (!val) return "";
  try {
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split("T")[0];
  } catch { return ""; }
};

/* Add N days to a date and return a readable string */
const addDays = (dateVal, days) => {
  if (!dateVal || !days) return "";
  try {
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return "";
    d.setDate(d.getDate() + Number(days));
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return ""; }
};

const BRANCHES     = ["All", "Mysore", "Bangalore", "Mumbai"];
const STAGES       = ["All", "Lead Capture", "Reachable", "Qualified", "Proposal", "Closed"];
const PRIORITIES   = ["All", "Hot", "Warm", "Cold"];
const SOURCES      = ["All", "Referral", "WhatsApp", "Website", "Call", "Instagram", "Social", "Form", "Phone"];
const EDIT_BRANCHES  = ["Mysore", "Bangalore", "Mumbai"];
const EDIT_STAGES    = ["Lead Capture", "Reachable", "Qualified", "Proposal", "Closed"];
const EDIT_PRIORITIES = ["Hot", "Warm", "Cold"];
const EDIT_SOURCES   = ["WhatsApp", "Website", "Call", "Instagram", "Referral"];

export default function AllLeads() {
  const [searchParams] = useSearchParams();
  const [filters, setFilters] = useState(() => ({
    branch: "All", priority: "All", source: "All", bant: "All", rep: "All", q: "",
    stage: searchParams.get("stage") || "All",
  }));
  const [rows, setRows]               = useState([]);
  const [loading, setLoading]         = useState(false);
  const [err, setErr]                 = useState("");
  const [selectedId, setSelectedId]   = useState(null);
  const [drawerOpen, setDrawerOpen]   = useState(false);
  const [deletingId, setDeletingId]   = useState(null);
  const [exporting, setExporting]     = useState(false);
  const [planningId, setPlanningId]   = useState(null);
  const [editOpen, setEditOpen]       = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving]   = useState(false);
  const [editForm, setEditForm]       = useState(EMPTY_EDIT_FORM);
  const [addOpen, setAddOpen]         = useState(false);
  const [addSaving, setAddSaving]     = useState(false);
  const [advancePeriod, setAdvancePeriod] = useState("month");
  const [repOptions, setRepOptions]   = useState(["All"]);
  const [repsLoading, setRepsLoading] = useState(false);

  const nowLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 16);
  };

  const [addForm, setAddForm] = useState({
    name: "", phone: "", email: "", business: "", industry: "", location: "", requirements: "",
    branch: "Bangalore", source: "WhatsApp", stage: "Lead Capture", priority: "Hot", value: "", rep: "",
    leadDateTime: nowLocal(),
  });

  const queryParams = useMemo(() => {
    const p = new URLSearchParams();
    p.set("branch",   filters.branch);
    p.set("stage",    filters.stage);
    p.set("priority", filters.priority);
    p.set("source",   filters.source);
    p.set("bant",     filters.bant);
    p.set("rep",      filters.rep);
    if (filters.q?.trim()) p.set("q", filters.q.trim());
    return p.toString();
  }, [filters]);

  const fetchReps = async () => {
    try {
      setRepsLoading(true);
      const res  = await fetch(`${API_BASE}/api/reps`);
      const json = await res.json();
      if (!res.ok || !json?.success) return;
      const rawData = Array.isArray(json?.data) ? json.data : [];
      const names   = rawData.map(item => (typeof item === "string" ? item : item?.name || item?.repName || "").trim()).filter(Boolean);
      const unique  = ["All", ...Array.from(new Set(names))];
      setRepOptions(unique);
      setFilters(p => p.rep !== "All" && !unique.includes(p.rep) ? { ...p, rep: "All" } : p);
    } catch (e) {
      console.error("fetchReps error:", e);
      setRepOptions(["All"]);
    } finally {
      setRepsLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setErr("");
      const res  = await fetch(`${API_BASE}/api/leads?${queryParams}`);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to fetch leads");
      setRows((json.data || []).map(x => ({
        id:              x._id,
        name:            x.name            || "—",
        phone:           x.phone           || "—",
        business:        x.business        || "—",
        branch:          x.branch          || "—",
        source:          x.source          || "—",
        stage:           x.stage           || "—",
        bant:            x.bant            || "—",
        priority:        x.priority        || "—",
        value:           Number(x.value    || 0),
        advanceReceived: x.advanceReceived != null ? Number(x.advanceReceived) : null,
        advanceReceivedDate: x.advanceReceivedDate || null,
        createdAt:       x.createdAt       || null,
        days:            x.days            || "0d",
        docs:            Number(x.docs     || 0),
        rep:             x.rep             || "—",
      })));
    } catch (e) {
      console.error("fetchLeads error:", e);
      setErr(e.message || "Failed to fetch");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchReps(); }, []);
  useEffect(() => { fetchLeads(); }, [queryParams]);

  const total = useMemo(() => rows.reduce((a, b) => a + (b.value || 0), 0), [rows]);

  const advanceTotal = useMemo(() => {
    const now          = new Date();
    const startOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek  = new Date(startOfDay); startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return rows
      .filter(r => {
        if (!(r.advanceReceived > 0)) return false;
        const dateValue = r.advanceReceivedDate;
        if (!dateValue) return false;
        const d = new Date(dateValue);
        if (advancePeriod === "today") return d >= startOfDay;
        if (advancePeriod === "week")  return d >= startOfWeek;
        if (advancePeriod === "month") return d >= startOfMonth;
        return true;
      })
      .reduce((a, b) => a + (b.advanceReceived || 0), 0);
  }, [rows, advancePeriod]);

  const addLeadToTodayPlan = async (e, row) => {
    try {
      e.stopPropagation();
      setPlanningId(row.id);
      const res  = await fetch(`${API_BASE}/api/today-plan/from-lead/${row.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskType: "new_call", priority: row.priority === "Hot" ? "urgent" : "medium", section: "call_immediately", dueLabel: "ASAP", subtitle: row.business, plannedDate: new Date().toISOString() }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      toast.success(json?.message || "Added to today's plan");
    } catch (e) { toast.error(e?.message || "Failed"); }
    finally { setPlanningId(null); }
  };

  const handleDeleteLead = async (e, id) => {
    try {
      e.stopPropagation();
      if (!window.confirm("Delete this lead?")) return;
      setDeletingId(id);
      const res  = await fetch(`${API_BASE}/api/leads/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to delete");
      if (selectedId === id) { setDrawerOpen(false); setSelectedId(null); }
      await fetchLeads();
    } catch (e) { toast.error(e?.message || "Failed to delete"); }
    finally { setDeletingId(null); }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const res = await fetch(`${API_BASE}/api/leads/export/csv?${queryParams}`);
      if (!res.ok) throw new Error("Failed to export");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch (e) { toast.error(e?.message || "Failed to export"); }
    finally { setExporting(false); }
  };

  const closeEditModal = () => { setEditOpen(false); setEditForm(EMPTY_EDIT_FORM); };
  const closeAddModal  = () => {
    setAddOpen(false);
    setAddForm({ name: "", phone: "", email: "", business: "", industry: "", location: "", requirements: "", branch: "Bangalore", source: "WhatsApp", stage: "Lead Capture", priority: "Hot", value: "", rep: "", leadDateTime: nowLocal() });
  };

  const handleEditLead = async (e, id) => {
    try {
      e.stopPropagation();
      setEditLoading(true); setEditOpen(true);
      const res  = await fetch(`${API_BASE}/api/leads/${id}`);
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to load");
      const l = json?.data || {};
      setEditForm({
        _id:                 l._id                || "",
        name:                l.name               || "",
        phone:               l.phone              || "",
        email:               l.email              || "",
        business:            l.business           || "",
        industry:            l.industry           || "",
        location:            l.location           || "",
        requirements:        l.requirements       || "",
        branch:              l.branch             || "Bangalore",
        source:              l.source             || "WhatsApp",
        stage:               l.stage              || "Lead Capture",
        priority:            l.priority           || "Hot",
        value:               l.value > 0          ? Number(l.value) : "",
        days:                l.days               || "0d",
        rep:                 l.rep                || "",
        advanceReceived:     l.advanceReceived > 0 ? Number(l.advanceReceived) : "",
        advanceReceivedDate: toDateInput(l.advanceReceivedDate),
        agreedTimeline:      l.agreedTimeline > 0  ? Number(l.agreedTimeline) : "",
      });
    } catch (e) { toast.error(e?.message || "Failed to load lead"); setEditOpen(false); }
    finally { setEditLoading(false); }
  };

  const handleEditSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!editForm.name?.trim()) { toast.warning("Name is required"); return; }
      if (!editForm.phone?.trim()) { toast.warning("Phone is required"); return; }
      setEditSaving(true);
      const res  = await fetch(`${API_BASE}/api/leads/${editForm._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name:                editForm.name,
          phone:               editForm.phone,
          email:               editForm.email,
          business:            editForm.business,
          industry:            editForm.industry,
          location:            editForm.location,
          requirements:        editForm.requirements,
          branch:              editForm.branch,
          source:              editForm.source,
          stage:               editForm.stage,
          priority:            editForm.priority,
          value:               Number(editForm.value || 0),
          days:                editForm.days,
          rep:                 editForm.rep,
          advanceReceived:     editForm.advanceReceived !== "" ? Number(editForm.advanceReceived) : 0,
          advanceReceivedDate: editForm.advanceReceivedDate || null,
          agreedTimeline:      editForm.agreedTimeline !== "" ? Number(editForm.agreedTimeline) : 0,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to update");
      closeEditModal(); await fetchLeads(); await fetchReps();
      toast.success("Lead updated successfully");
    } catch (e) { toast.error(e?.message || "Failed to update"); }
    finally { setEditSaving(false); }
  };

  const handleAddSubmit = async (e) => {
    try {
      e.preventDefault();
      if (!addForm.name?.trim())  { toast.warning("Name is required");  return; }
      if (!addForm.phone?.trim()) { toast.warning("Phone is required"); return; }
      if (!addForm.email?.trim()) { toast.warning("Email is required"); return; }
      setAddSaving(true);
      const token = localStorage.getItem("nnc_token");
      const res   = await fetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ ...addForm, value: addForm.value !== "" ? Number(addForm.value) : 0, createdAt: addForm.leadDateTime ? new Date(addForm.leadDateTime).toISOString() : new Date().toISOString() }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed to create");
      closeAddModal(); await fetchLeads(); await fetchReps();
    } catch (e) { toast.error(e?.message || "Failed to create lead"); }
    finally { setAddSaving(false); }
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className={`alLayout ${drawerOpen ? "drawer-open" : ""}`}>
      <Sidebar active="All Leads" />

      <div className="alMain">

        {/* ── Top bar ── */}
        <div className="alTopBar">
          <div className="alTopLeft">
            <div className="alTitle">All Leads</div>
            <span className="alCount">{rows.length}</span>
          </div>

          <div className="alTopRight">
            {/* Search */}
            <div className="alSearchWrap">
              <Search size={13} className="alSearchIcon" />
              <input
                className="alSearch"
                placeholder="Search name, phone, business..."
                value={filters.q}
                onChange={e => setFilters(p => ({ ...p, q: e.target.value }))}
              />
              {filters.q && <button type="button" className="alSearchClear" onClick={() => setFilters(p => ({ ...p, q: "" }))}><X size={12}/></button>}
            </div>

            {/* Advance pill */}
            <div className="alAdvancePill">
              <span className="alAdvanceLabel">Advance</span>
              <span className="alAdvanceAmt">{money(advanceTotal)}</span>
              <select className="alAdvancePeriod" value={advancePeriod} onChange={e => setAdvancePeriod(e.target.value)}>
                <option value="today">Today</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="all">All</option>
              </select>
            </div>

            <button className="alBtn ghost" type="button" onClick={handleExport} disabled={exporting}>
              {exporting ? <BtnSpinner variant="dark" /> : <Download size={13}/>}
              {exporting ? "Exporting…" : "Export"}
            </button>
            <button className="alBtn primary" type="button" onClick={() => setAddOpen(true)}>
              <Plus size={13}/> Add Lead
            </button>
          </div>
        </div>

        {/* ── Stage tabs + compact filters ── */}
        <div className="alFilterRow">
          {/* Stage pills */}
          <div className="alStagePills">
            {STAGES.map(s => {
              const active = filters.stage === s;
              const c = STAGE_COLOR[s];
              return (
                <button key={s} type="button"
                  className={`alStagePill ${active ? "active" : ""}`}
                  style={active && c ? { background: c.bg, color: c.color, borderColor: c.color + "55" } : {}}
                  onClick={() => setFilters(p => ({ ...p, stage: s }))}>
                  {s === "All" ? "All Stages" : s}
                </button>
              );
            })}
          </div>

          {/* Compact dropdowns */}
          <div className="alDropdowns">
            <select className="alDrop" value={filters.branch}   onChange={e => setFilters(p => ({ ...p, branch:   e.target.value }))}>
              {BRANCHES.map(x   => <option key={x} value={x}>{x === "All" ? "All Branches" : x}</option>)}
            </select>
            <select className="alDrop" value={filters.priority} onChange={e => setFilters(p => ({ ...p, priority: e.target.value }))}>
              {PRIORITIES.map(x => <option key={x} value={x}>{x === "All" ? "All Priority" : x}</option>)}
            </select>
            <select className="alDrop" value={filters.source}   onChange={e => setFilters(p => ({ ...p, source:   e.target.value }))}>
              {SOURCES.map(x    => <option key={x} value={x}>{x === "All" ? "All Sources"   : x}</option>)}
            </select>
            <select className="alDrop" value={filters.rep}      onChange={e => setFilters(p => ({ ...p, rep:      e.target.value }))} disabled={repsLoading}>
              {repOptions.map(x => <option key={x} value={x}>{x === "All" ? "All Reps" : x}</option>)}
            </select>
          </div>
        </div>

        {/* ── States ── */}
        {loading && <div className="alListWrap"><ShimmerLeadList rows={10} /></div>}
        {err     && <div className="alState error">{err}</div>}

        {/* ── Lead list ── */}
        {!loading && !err && (
          <div className="alListWrap">
            {/* Summary row */}
            <div className="alSummaryRow">
              <span>{rows.length} lead{rows.length !== 1 ? "s" : ""}</span>
              {total > 0 && <span>· {money(total)} total value</span>}
            </div>

            {rows.length === 0 ? (
              <div className="alEmpty">No leads found{filters.q ? ` for "${filters.q}"` : ""}.</div>
            ) : (
              <div className="alList">
                {rows.map(r => {
                  const sc = STAGE_COLOR[r.stage] || {};
                  const pc = PRIO_COLOR[r.priority] || "#94a3b8";
                  return (
                    <div key={r.id} className="alRow" onClick={() => { setSelectedId(r.id); setDrawerOpen(true); }}>

                      {/* Avatar */}
                      <div className="alAvatar" style={{ background: sc.bg || "#f1f5f9", color: sc.color || "#475569" }}>
                        {initials(r.name)}
                      </div>

                      {/* Name + phone */}
                      <div className="alRowMain">
                        <div className="alRowName">{r.name}</div>
                        <div className="alRowPhone">{r.phone}</div>
                      </div>

                      {/* Business */}
                      <div className="alRowBiz">{r.business}</div>

                      {/* Stage pill */}
                      <span className="alRowStage" style={{ background: sc.bg || "#f1f5f9", color: sc.color || "#64748b" }}>
                        {r.stage}
                      </span>

                      {/* Priority dot */}
                      <span className="alRowPrio" style={{ color: pc }}>● {r.priority}</span>

                      {/* Value */}
                      <div className="alRowValue">{money(r.value)}</div>

                      {/* Rep + age */}
                      <div className="alRowMeta">
                        <div className="alRowRep">{r.rep}</div>
                        <div className="alRowAgo">{getAgo(r.createdAt)}</div>
                      </div>

                      {/* Actions */}
                      <div className="alRowActions" onClick={e => e.stopPropagation()}>
                        <button type="button" className="alAct view" title="View" onClick={e => { e.stopPropagation(); setSelectedId(r.id); setDrawerOpen(true); }}><Eye size={14}/></button>
                        <button type="button" className="alAct edit" title="Edit" onClick={e => handleEditLead(e, r.id)}><Pencil size={14}/></button>
                        <button type="button" className="alAct plan" title="Add to Today's Plan" onClick={e => addLeadToTodayPlan(e, r)} disabled={planningId === r.id}><CalendarPlus size={14}/></button>
                        <button type="button" className="alAct del"  title="Delete" onClick={e => handleDeleteLead(e, r.id)} disabled={deletingId === r.id}><Trash2 size={14}/></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Lead Drawer ── */}
      <LeadDrawer
        open={drawerOpen}
        leadId={selectedId}
        apiBase={API_BASE}
        onClose={() => { setDrawerOpen(false); setSelectedId(null); }}
        onLeadUpdated={async () => { await fetchLeads(); await fetchReps(); }}
      />

      {/* ── Edit Modal ── */}
      {editOpen && (
        <div className="alModalOverlay" onClick={closeEditModal}>
          <div className="alModalCard" onClick={e => e.stopPropagation()}>
            <div className="alModalHeader">
              <h3>Edit Lead</h3>
              <button type="button" className="alModalClose" onClick={closeEditModal}><X size={18}/></button>
            </div>
            {editLoading ? <div className="alModalLoading">Loading...</div> : (
              <form className="alModalForm" onSubmit={handleEditSubmit}>
                <div className="alModalGrid">
                  <div className="fg"><label>Name *</label><input name="name" value={editForm.name} onChange={e => setEditForm(p => ({ ...p, name: e.target.value }))} required/></div>
                  <div className="fg"><label>Phone *</label><input name="phone" value={editForm.phone} onChange={e => setEditForm(p => ({ ...p, phone: e.target.value }))} required/></div>
                  <div className="fg"><label>Email</label><input name="email" value={editForm.email} onChange={e => setEditForm(p => ({ ...p, email: e.target.value }))}/></div>
                  <div className="fg"><label>Business</label><input name="business" value={editForm.business} onChange={e => setEditForm(p => ({ ...p, business: e.target.value }))}/></div>
                  <div className="fg"><label>Industry</label><input name="industry" value={editForm.industry} onChange={e => setEditForm(p => ({ ...p, industry: e.target.value }))}/></div>
                  <div className="fg"><label>Location</label><input name="location" value={editForm.location} onChange={e => setEditForm(p => ({ ...p, location: e.target.value }))}/></div>
                  <div className="fg"><label>Branch</label><select value={editForm.branch} onChange={e => setEditForm(p => ({ ...p, branch: e.target.value }))}>{EDIT_BRANCHES.map(x => <option key={x}>{x}</option>)}</select></div>
                  <div className="fg"><label>Source</label><select value={editForm.source} onChange={e => setEditForm(p => ({ ...p, source: e.target.value }))}>{EDIT_SOURCES.map(x => <option key={x}>{x}</option>)}</select></div>
                  <div className="fg"><label>Stage</label><select value={editForm.stage} onChange={e => setEditForm(p => ({ ...p, stage: e.target.value }))}>{EDIT_STAGES.map(x => <option key={x}>{x}</option>)}</select></div>
                  <div className="fg"><label>Priority</label><select value={editForm.priority} onChange={e => setEditForm(p => ({ ...p, priority: e.target.value }))}>{EDIT_PRIORITIES.map(x => <option key={x}>{x}</option>)}</select></div>
                  <div className="fg"><label>Total Amount Agreed (₹)</label><input type="number" value={editForm.value} onChange={e => setEditForm(p => ({ ...p, value: e.target.value }))}/></div>
                  <div className="fg"><label>Rep</label><select value={editForm.rep} onChange={e => setEditForm(p => ({ ...p, rep: e.target.value }))}><option value="">Select Rep</option>{repOptions.filter(x => x !== "All").map(x => <option key={x}>{x}</option>)}</select></div>
                  <div className="fg"><label>Advance Received (₹)</label><input type="number" value={editForm.advanceReceived} onChange={e => setEditForm(p => ({ ...p, advanceReceived: e.target.value }))}/></div>
                  <div className="fg"><label>Advance Received Date</label><input type="date" value={editForm.advanceReceivedDate} onChange={e => setEditForm(p => ({ ...p, advanceReceivedDate: e.target.value }))}/></div>
                  <div className="fg"><label>Remaining Balance (₹)</label><input type="number" readOnly value={editForm.value !== "" && editForm.advanceReceived !== "" ? Math.max(0, Number(editForm.value) - Number(editForm.advanceReceived)) : ""} className="alReadOnly"/></div>
                  <div className="fg"><label>Agreed Timeline (days)</label><input type="number" min="0" value={editForm.agreedTimeline} onChange={e => setEditForm(p => ({ ...p, agreedTimeline: e.target.value }))}/></div>
                  {editForm.advanceReceivedDate && editForm.agreedTimeline ? (
                    <div className="fg alFinalPayRow">
                      <label>Final Payment Date</label>
                      <div className="alFinalPayDate">{addDays(editForm.advanceReceivedDate, editForm.agreedTimeline)}</div>
                    </div>
                  ) : null}
                  <div className="fg full"><label>Requirements</label><textarea value={editForm.requirements} onChange={e => setEditForm(p => ({ ...p, requirements: e.target.value }))} rows={3}/></div>
                </div>
                <div className="alModalFooter">
                  <button type="button" className="alBtn ghost" onClick={closeEditModal}>Cancel</button>
                  <button type="submit" className="alBtn primary" disabled={editSaving}>
                    {editSaving && <BtnSpinner />} {editSaving ? "Saving…" : "Update Lead"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Add Modal ── */}
      {addOpen && (
        <div className="alModalOverlay" onClick={closeAddModal}>
          <div className="alModalCard" onClick={e => e.stopPropagation()}>
            <div className="alModalHeader">
              <h3>Add New Lead</h3>
              <button type="button" className="alModalClose" onClick={closeAddModal}><X size={18}/></button>
            </div>
            <form className="alModalForm" onSubmit={handleAddSubmit}>
              <div className="alModalGrid">
                <div className="fg"><label>Name *</label><input name="name" value={addForm.name} onChange={e => setAddForm(p => ({ ...p, name: e.target.value }))} required/></div>
                <div className="fg"><label>Phone *</label><input name="phone" value={addForm.phone} onChange={e => setAddForm(p => ({ ...p, phone: e.target.value }))} required/></div>
                <div className="fg"><label>Email *</label><input type="email" name="email" value={addForm.email} onChange={e => setAddForm(p => ({ ...p, email: e.target.value }))} required/></div>
                <div className="fg"><label>Business</label><input value={addForm.business} onChange={e => setAddForm(p => ({ ...p, business: e.target.value }))}/></div>
                <div className="fg"><label>Industry</label><input value={addForm.industry} onChange={e => setAddForm(p => ({ ...p, industry: e.target.value }))}/></div>
                <div className="fg"><label>Location</label><input value={addForm.location} onChange={e => setAddForm(p => ({ ...p, location: e.target.value }))}/></div>
                <div className="fg"><label>Branch</label><select value={addForm.branch} onChange={e => setAddForm(p => ({ ...p, branch: e.target.value }))}>{EDIT_BRANCHES.map(x => <option key={x}>{x}</option>)}</select></div>
                <div className="fg"><label>Source</label><select value={addForm.source} onChange={e => setAddForm(p => ({ ...p, source: e.target.value }))}>{EDIT_SOURCES.map(x => <option key={x}>{x}</option>)}</select></div>
                <div className="fg"><label>Stage</label><select value={addForm.stage} onChange={e => setAddForm(p => ({ ...p, stage: e.target.value }))}>{EDIT_STAGES.map(x => <option key={x}>{x}</option>)}</select></div>
                <div className="fg"><label>Priority</label><select value={addForm.priority} onChange={e => setAddForm(p => ({ ...p, priority: e.target.value }))}>{EDIT_PRIORITIES.map(x => <option key={x}>{x}</option>)}</select></div>
                <div className="fg"><label>Value (₹)</label><input type="number" value={addForm.value} onChange={e => setAddForm(p => ({ ...p, value: e.target.value }))}/></div>
                <div className="fg"><label>Rep</label><select value={addForm.rep} onChange={e => setAddForm(p => ({ ...p, rep: e.target.value }))}><option value="">Select Rep</option>{repOptions.filter(x => x !== "All").map(x => <option key={x}>{x}</option>)}</select></div>
                <div className="fg full"><label>Requirements</label><textarea value={addForm.requirements} onChange={e => setAddForm(p => ({ ...p, requirements: e.target.value }))} rows={3}/></div>
                <div className="fg full"><label>Lead Date &amp; Time</label><input type="datetime-local" value={addForm.leadDateTime} onChange={e => setAddForm(p => ({ ...p, leadDateTime: e.target.value }))}/></div>
              </div>
              <div className="alModalFooter">
                <button type="button" className="alBtn ghost" onClick={closeAddModal}>Cancel</button>
                <button type="submit" className="alBtn primary" disabled={addSaving}>
                  {addSaving && <BtnSpinner />} {addSaving ? "Creating…" : "Create Lead"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
