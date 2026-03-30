import { useCallback, useEffect, useState } from "react";
import {
  Plus, ChevronLeft, ChevronRight, Trash2, Pencil,
  CheckCircle2, Clock, Building2, X, Check,
  TrendingDown, Wallet, Users, Zap, Wifi,
  Wrench, MoreHorizontal, RefreshCcw, AlertTriangle,
  Bell,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { toast } from "../../utils/toast";
import { ShimmerKpiGrid, ShimmerTable, BtnSpinner } from "../../components/ui/Shimmer";
import "./ExpenseTracker.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";
function auth() { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; }

const CATEGORIES = [
  { key: "rent",        label: "Rent",         icon: Building2,    color: "#3b82f6", bg: "#dbeafe" },
  { key: "salary",      label: "Salaries",      icon: Users,        color: "#8b5cf6", bg: "#ede9fe" },
  { key: "electricity", label: "Electricity",   icon: Zap,          color: "#f59e0b", bg: "#fef3c7" },
  { key: "internet",    label: "Internet",      icon: Wifi,         color: "#06b6d4", bg: "#cffafe" },
  { key: "maintenance", label: "Maintenance",   icon: Wrench,       color: "#ef4444", bg: "#fee2e2" },
  { key: "other",       label: "Other",         icon: MoreHorizontal, color: "#64748b", bg: "#f1f5f9" },
];

const BRANCHES = ["Mysore", "Bangalore", "Mumbai", "General"];

const PAYMENT_METHODS = [
  { key: "bank_transfer", label: "Bank Transfer" },
  { key: "upi",           label: "UPI" },
  { key: "cash",          label: "Cash" },
  { key: "cheque",        label: "Cheque" },
  { key: "auto_debit",    label: "Auto Debit" },
  { key: "other",         label: "Other" },
];

const BRANCH_COLORS = {
  Mysore:    { color: "#7c3aed", bg: "#ede9fe" },
  Bangalore: { color: "#2563eb", bg: "#dbeafe" },
  Mumbai:    { color: "#059669", bg: "#d1fae5" },
  General:   { color: "#d97706", bg: "#fef3c7" },
};

const fmt = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

const fmtFull = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));

const MONTH_NAMES = ["January","February","March","April","May","June",
                     "July","August","September","October","November","December"];

const catInfo = (key) => CATEGORIES.find(c => c.key === key) || CATEGORIES[5];

const BLANK_FORM = {
  category: "rent", subcategory: "", branch: "Mysore",
  amount: "", date: new Date().toISOString().split("T")[0],
  description: "", paidBy: "", paymentMethod: "bank_transfer",
  status: "pending", isRecurring: false, notes: "",
};

export default function ExpenseTracker() {
  const now = new Date();
  const [viewYear,  setViewYear]  = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1);

  const [summary,   setSummary]   = useState(null);
  const [expenses,  setExpenses]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [catFilter, setCatFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");

  const [modalOpen, setModalOpen] = useState(false);
  const [editId,    setEditId]    = useState(null);
  const [form,      setForm]      = useState(BLANK_FORM);
  const [saving,    setSaving]    = useState(false);
  const [deleting,  setDeleting]  = useState("");

  /* ── Rent alerts ── */
  const [rentStatus,  setRentStatus]  = useState([]);
  const [rentLoading, setRentLoading] = useState(false);
  /* rent config editor */
  const [rentEditBranch, setRentEditBranch] = useState(null); // branch being edited
  const [rentEditForm,   setRentEditForm]   = useState({ amount: "", dueDay: "1", notes: "" });
  const [rentEditSaving, setRentEditSaving] = useState(false);

  /* ── fetch ── */
  const fetchRentStatus = useCallback(async () => {
    setRentLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/expenses/rent-status?year=${viewYear}&month=${viewMonth}`, { headers: auth() });
      const json = await res.json();
      if (json.success) setRentStatus(json.data || []);
    } catch (_) {}
    finally { setRentLoading(false); }
  }, [viewYear, viewMonth]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const base = `year=${viewYear}&month=${viewMonth}`;
      const [sumRes, expRes] = await Promise.all([
        fetch(`${API_BASE}/api/expenses/summary?${base}`, { headers: auth() }),
        fetch(`${API_BASE}/api/expenses?${base}`, { headers: auth() }),
      ]);
      const [sumJson, expJson] = await Promise.all([sumRes.json(), expRes.json()]);
      if (sumJson.success) setSummary(sumJson.data);
      if (expJson.success) setExpenses(expJson.data || []);
    } catch (e) {
      toast.error("Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, [viewYear, viewMonth]);

  useEffect(() => { fetchAll(); fetchRentStatus(); }, [fetchAll, fetchRentStatus]);

  /* ── month navigation ── */
  const prevMonth = () => {
    if (viewMonth === 1) { setViewMonth(12); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 12) { setViewMonth(1); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  /* ── form helpers ── */
  const openAdd = () => {
    setEditId(null);
    setForm({ ...BLANK_FORM, date: `${viewYear}-${String(viewMonth).padStart(2,"0")}-01` });
    setModalOpen(true);
  };
  const openEdit = (exp) => {
    setEditId(exp._id);
    setForm({
      category:      exp.category      || "other",
      subcategory:   exp.subcategory   || "",
      branch:        exp.branch        || "General",
      amount:        exp.amount        || "",
      date:          exp.date ? exp.date.split("T")[0] : "",
      description:   exp.description   || "",
      paidBy:        exp.paidBy        || "",
      paymentMethod: exp.paymentMethod || "bank_transfer",
      status:        exp.status        || "pending",
      isRecurring:   !!exp.isRecurring,
      notes:         exp.notes         || "",
    });
    setModalOpen(true);
  };

  const setF = (key, val) => setForm(f => ({ ...f, [key]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.date) { toast.warning("Amount and date are required"); return; }
    setSaving(true);
    try {
      const url    = editId ? `${API_BASE}/api/expenses/${editId}` : `${API_BASE}/api/expenses`;
      const method = editId ? "PUT" : "POST";
      const res    = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({ ...form, amount: Number(form.amount) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      toast.success(editId ? "Expense updated!" : "Expense added!");
      setModalOpen(false);
      fetchAll();
      fetchRentStatus();
    } catch (e) {
      toast.error(e.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this expense?")) return;
    setDeleting(id);
    try {
      const res  = await fetch(`${API_BASE}/api/expenses/${id}`, { method: "DELETE", headers: auth() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success("Deleted");
      fetchAll();
      fetchRentStatus();
    } catch (e) {
      toast.error(e.message || "Failed to delete");
    } finally {
      setDeleting("");
    }
  };

  const toggleStatus = async (exp) => {
    const newStatus = exp.status === "paid" ? "pending" : "paid";
    try {
      const res  = await fetch(`${API_BASE}/api/expenses/${exp._id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({ status: newStatus }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setExpenses(prev => prev.map(e => e._id === exp._id ? { ...e, status: newStatus } : e));
      fetchAll();
      fetchRentStatus();
    } catch (e) {
      toast.error(e.message || "Failed");
    }
  };

  /* ── rent config edit ── */
  const openRentEdit = (rs) => {
    setRentEditBranch(rs.branch);
    setRentEditForm({ amount: rs.configuredAmount, dueDay: rs.dueDay || 1, notes: rs.notes || "" });
  };
  const saveRentConfig = async () => {
    setRentEditSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/expenses/rent-config/${rentEditBranch}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({
          amount: Number(rentEditForm.amount),
          dueDay: Number(rentEditForm.dueDay),
          notes:  rentEditForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed");
      toast.success(`Rent updated for ${rentEditBranch}!`);
      setRentEditBranch(null);
      fetchRentStatus();
    } catch (e) {
      toast.error(e.message || "Failed to save");
    } finally {
      setRentEditSaving(false);
    }
  };

  /* ── quick pay rent ── */
  const openQuickRentPay = (rs) => {
    setEditId(null);
    setForm({
      ...BLANK_FORM,
      category:    "rent",
      branch:      rs.branch,
      amount:      rs.configuredAmount,
      description: `Rent — ${rs.branch} Office`,
      date:        `${viewYear}-${String(viewMonth).padStart(2,"0")}-01`,
      status:      "paid",
    });
    setModalOpen(true);
  };

  /* ── derived ── */
  const filtered = expenses.filter(e => {
    if (catFilter !== "all" && e.category !== catFilter) return false;
    if (branchFilter !== "all" && e.branch !== branchFilter) return false;
    return true;
  });

  const totalExpenses = summary?.total   || 0;
  const totalPaid     = summary?.paid    || 0;
  const totalPending  = summary?.pending || 0;

  const byCat = summary?.byCategory || {};
  const byBranch = summary?.byBranch || {};

  return (
    <div className="et-layout">
      <Sidebar />
      <div className="et-main">

        {/* ── Header ── */}
        <div className="et-hero">
          <div>
            <div className="et-hero-eyebrow">Finance</div>
            <h1 className="et-hero-title">Expense Tracker</h1>
            <p className="et-hero-sub">Track rent, salaries, and all office bills across branches</p>
          </div>
          <div className="et-hero-actions">
            <button type="button" className="et-refresh-btn" onClick={fetchAll} title="Refresh">
              <RefreshCcw size={14}/>
            </button>
            <button type="button" className="et-add-btn" onClick={openAdd}>
              <Plus size={15}/> Add Expense
            </button>
          </div>
        </div>

        <div className="et-body">

          {/* ── Month navigator ── */}
          <div className="et-month-nav">
            <button type="button" className="et-month-arr" onClick={prevMonth}><ChevronLeft size={16}/></button>
            <div className="et-month-label">{MONTH_NAMES[viewMonth - 1]} {viewYear}</div>
            <button type="button" className="et-month-arr" onClick={nextMonth}><ChevronRight size={16}/></button>
          </div>

          {/* ── Rent Alerts ── always visible, not gated by loading ── */}
          <div className="et-rent-alerts">
            <div className="et-rent-alerts-head">
              <Bell size={14} color="#dc2626"/>
              <span>Rent Alerts — {MONTH_NAMES[viewMonth - 1]} {viewYear}</span>
            </div>
            <div className="et-rent-cards">
              {rentLoading ? (
                <div className="et-rent-skeleton"/>
              ) : rentStatus.length === 0 ? (
                <div style={{ fontSize:12, color:"#94a3b8", padding:"8px 0" }}>Loading rent status…</div>
              ) : rentStatus.map(rs => {
                const bc = BRANCH_COLORS[rs.branch] || BRANCH_COLORS.General;
                return (
                  <div
                    key={rs.branch}
                    className={`et-rent-card${rs.isPaid ? " paid" : " unpaid"}`}
                    style={{ borderLeftColor: rs.isPaid ? "#16a34a" : "#dc2626" }}
                  >
                    {/* Status banner */}
                    <div className={`et-rent-banner${rs.isPaid ? " paid" : " unpaid"}`}>
                      {rs.isPaid
                        ? <><CheckCircle2 size={12}/> Paid</>
                        : <><AlertTriangle size={12}/> Unpaid</>}
                    </div>

                    {/* Office info */}
                    <div className="et-rent-card-body">
                      <div className="et-rent-office-icon" style={{ background: bc.bg, color: bc.color }}>
                        <Building2 size={18}/>
                      </div>
                      <div className="et-rent-office-info">
                        <div className="et-rent-office-name">{rs.branch} Office</div>
                        <div className="et-rent-due">
                          Due: <strong>
                            {new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(rs.configuredAmount)}
                          </strong>
                          {rs.dueDay && <span className="et-rent-dueday"> · {rs.dueDay === 1 ? "1st" : rs.dueDay === 2 ? "2nd" : rs.dueDay === 3 ? "3rd" : `${rs.dueDay}th`} of month</span>}
                        </div>
                        {rs.isPaid && rs.paidAmount > 0 && (
                          <div className="et-rent-paid-amt">
                            Paid: {new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(rs.paidAmount)}
                          </div>
                        )}
                        {!rs.isPaid && rs.shortfall > 0 && (
                          <div className="et-rent-shortfall">
                            Shortfall: ₹{rs.shortfall.toLocaleString("en-IN")}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="et-rent-actions">
                      {!rs.isPaid && (
                        <button
                          type="button"
                          className="et-rent-pay-btn"
                          onClick={() => openQuickRentPay(rs)}
                        >
                          <Check size={11}/> Mark Paid
                        </button>
                      )}
                      <button
                        type="button"
                        className="et-rent-edit-btn"
                        onClick={() => openRentEdit(rs)}
                        title="Edit rent amount"
                      >
                        <Pencil size={11}/>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {loading ? (
            <div style={{ padding: "20px 20px 0", display: "flex", flexDirection: "column", gap: 16 }}>
              <ShimmerKpiGrid count={4} cols={4} />
              <ShimmerTable rows={7} cells={6} />
            </div>
          ) : (
            <>
              {/* ── Summary cards ── */}
              <div className="et-summary-grid">
                <div className="et-sum-card total">
                  <div className="et-sum-icon"><TrendingDown size={18}/></div>
                  <div className="et-sum-val">{fmt(totalExpenses)}</div>
                  <div className="et-sum-label">Total Expenses</div>
                  <div className="et-sum-sub">{summary?.count || 0} entries</div>
                </div>
                <div className="et-sum-card paid">
                  <div className="et-sum-icon"><CheckCircle2 size={18}/></div>
                  <div className="et-sum-val">{fmt(totalPaid)}</div>
                  <div className="et-sum-label">Paid</div>
                  <div className="et-sum-sub">
                    {totalExpenses > 0 ? Math.round((totalPaid / totalExpenses) * 100) : 0}% of total
                  </div>
                </div>
                <div className="et-sum-card pending">
                  <div className="et-sum-icon"><Clock size={18}/></div>
                  <div className="et-sum-val">{fmt(totalPending)}</div>
                  <div className="et-sum-label">Pending</div>
                  <div className="et-sum-sub">yet to be paid</div>
                </div>
                <div className="et-sum-card rent">
                  <div className="et-sum-icon"><Building2 size={18}/></div>
                  <div className="et-sum-val">{fmt(byCat.rent?.total || 0)}</div>
                  <div className="et-sum-label">Total Rent</div>
                  <div className="et-sum-sub">all 3 offices</div>
                </div>
              </div>

              {/* ── Category breakdown ── */}
              <div className="et-section-title">By Category</div>
              <div className="et-cat-grid">
                {CATEGORIES.map(cat => {
                  const d = byCat[cat.key] || {};
                  const Icon = cat.icon;
                  return (
                    <div key={cat.key} className="et-cat-card" style={{ borderTopColor: cat.color }}>
                      <div className="et-cat-head">
                        <div className="et-cat-icon" style={{ background: cat.bg, color: cat.color }}>
                          <Icon size={16}/>
                        </div>
                        <div className="et-cat-name">{cat.label}</div>
                        <div className="et-cat-count">{d.count || 0}</div>
                      </div>
                      <div className="et-cat-val" style={{ color: cat.color }}>{fmt(d.total || 0)}</div>
                      {(d.pending || 0) > 0 && (
                        <div className="et-cat-pending">₹{(d.pending || 0).toLocaleString("en-IN")} pending</div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Per-office breakdown ── */}
              <div className="et-section-title">By Office</div>
              <div className="et-branch-grid">
                {["Mysore", "Bangalore", "Mumbai"].map(br => {
                  const d     = byBranch[br] || {};
                  const bc    = BRANCH_COLORS[br];
                  const brExp = expenses.filter(e => e.branch === br);
                  const brRent    = brExp.filter(e => e.category === "rent").reduce((s,e) => s + e.amount, 0);
                  const brElec    = brExp.filter(e => e.category === "electricity").reduce((s,e) => s + e.amount, 0);
                  const brNet     = brExp.filter(e => e.category === "internet").reduce((s,e) => s + e.amount, 0);
                  return (
                    <div key={br} className="et-branch-card" style={{ borderTopColor: bc.color }}>
                      <div className="et-branch-head">
                        <div className="et-branch-icon" style={{ background: bc.bg, color: bc.color }}>
                          <Building2 size={18}/>
                        </div>
                        <div>
                          <div className="et-branch-name">{br} Office</div>
                          <div className="et-branch-count">{d.count || 0} expenses</div>
                        </div>
                        <div className="et-branch-total" style={{ color: bc.color }}>{fmt(d.total || 0)}</div>
                      </div>
                      <div className="et-branch-breakdown">
                        {brRent > 0 && (
                          <div className="et-branch-row">
                            <span><Building2 size={11}/> Rent</span>
                            <span>{fmt(brRent)}</span>
                          </div>
                        )}
                        {brElec > 0 && (
                          <div className="et-branch-row">
                            <span><Zap size={11}/> Electricity</span>
                            <span>{fmt(brElec)}</span>
                          </div>
                        )}
                        {brNet > 0 && (
                          <div className="et-branch-row">
                            <span><Wifi size={11}/> Internet</span>
                            <span>{fmt(brNet)}</span>
                          </div>
                        )}
                        {!brRent && !brElec && !brNet && (
                          <div className="et-branch-empty">No entries this month</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── Expense list ── */}
              <div className="et-list-section">
                <div className="et-list-head">
                  <div className="et-section-title" style={{ margin: 0 }}>All Expenses</div>
                  <div className="et-filters">
                    <select className="et-filter-sel" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
                      <option value="all">All Categories</option>
                      {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
                    </select>
                    <select className="et-filter-sel" value={branchFilter} onChange={e => setBranchFilter(e.target.value)}>
                      <option value="all">All Branches</option>
                      {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="et-empty">
                    <Wallet size={32} color="#cbd5e1"/>
                    <div>No expenses found</div>
                    <div className="et-empty-sub">Add an expense to get started</div>
                  </div>
                ) : (
                  <div className="et-table-wrap">
                    <table className="et-table">
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Description</th>
                          <th>Branch</th>
                          <th>Date</th>
                          <th>Method</th>
                          <th>Amount</th>
                          <th>Status</th>
                          <th></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(exp => {
                          const cat = catInfo(exp.category);
                          const CatIcon = cat.icon;
                          const bc  = BRANCH_COLORS[exp.branch] || BRANCH_COLORS.General;
                          return (
                            <tr key={exp._id} className={exp.status === "paid" ? "et-row-paid" : ""}>
                              <td>
                                <div className="et-row-cat">
                                  <span className="et-row-cat-icon" style={{ background: cat.bg, color: cat.color }}>
                                    <CatIcon size={12}/>
                                  </span>
                                  <div>
                                    <div className="et-row-cat-name">{cat.label}</div>
                                    {exp.subcategory && <div className="et-row-sub">{exp.subcategory}</div>}
                                  </div>
                                </div>
                              </td>
                              <td>
                                <div className="et-row-desc">{exp.description || "—"}</div>
                                {exp.notes && <div className="et-row-notes">{exp.notes}</div>}
                              </td>
                              <td>
                                <span className="et-branch-pill" style={{ background: bc.bg, color: bc.color }}>
                                  {exp.branch}
                                </span>
                              </td>
                              <td className="et-row-date">
                                {new Date(exp.date).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}
                              </td>
                              <td className="et-row-method">
                                {PAYMENT_METHODS.find(m => m.key === exp.paymentMethod)?.label || exp.paymentMethod}
                              </td>
                              <td className="et-row-amount">{fmtFull(exp.amount)}</td>
                              <td>
                                <button
                                  type="button"
                                  className={`et-status-btn ${exp.status}`}
                                  onClick={() => toggleStatus(exp)}
                                  title="Click to toggle"
                                >
                                  {exp.status === "paid"
                                    ? <><CheckCircle2 size={11}/> Paid</>
                                    : <><Clock size={11}/> Pending</>}
                                </button>
                              </td>
                              <td>
                                <div className="et-row-actions">
                                  <button type="button" className="et-icon-btn edit" onClick={() => openEdit(exp)} title="Edit">
                                    <Pencil size={12}/>
                                  </button>
                                  <button
                                    type="button"
                                    className="et-icon-btn del"
                                    onClick={() => handleDelete(exp._id)}
                                    disabled={deleting === exp._id}
                                    title="Delete"
                                  >
                                    <Trash2 size={12}/>
                                  </button>
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
            </>
          )}
        </div>
      </div>

      {/* ── Add / Edit Modal ── */}
      {modalOpen && (
        <div className="et-overlay" onClick={() => setModalOpen(false)}>
          <div className="et-modal" onClick={e => e.stopPropagation()}>
            <div className="et-modal-head">
              <div className="et-modal-title">
                {editId ? "Edit Expense" : "Add Expense"}
              </div>
              <button type="button" className="et-modal-close" onClick={() => setModalOpen(false)}>
                <X size={16}/>
              </button>
            </div>

            <form className="et-modal-body" onSubmit={handleSubmit}>
              {/* Category */}
              <div className="et-form-group">
                <label>Category *</label>
                <div className="et-cat-picker">
                  {CATEGORIES.map(cat => {
                    const Icon = cat.icon;
                    return (
                      <button
                        key={cat.key}
                        type="button"
                        className={`et-cat-pick-btn${form.category === cat.key ? " active" : ""}`}
                        style={form.category === cat.key ? { background: cat.bg, borderColor: cat.color, color: cat.color } : {}}
                        onClick={() => setF("category", cat.key)}
                      >
                        <Icon size={13}/>
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Subcategory (for salary: employee name) */}
              {form.category === "salary" && (
                <div className="et-form-group">
                  <label>Employee Name</label>
                  <input className="et-input" placeholder="e.g. Ravi Kumar" value={form.subcategory}
                    onChange={e => setF("subcategory", e.target.value)}/>
                </div>
              )}

              {/* Branch — not required for salary/general */}
              <div className="et-form-row">
                <div className="et-form-group">
                  <label>Branch / Office *</label>
                  <select className="et-input" value={form.branch} onChange={e => setF("branch", e.target.value)}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="et-form-group">
                  <label>Date *</label>
                  <input type="date" className="et-input" value={form.date}
                    onChange={e => setF("date", e.target.value)} required/>
                </div>
              </div>

              {/* Amount */}
              <div className="et-form-row">
                <div className="et-form-group">
                  <label>Amount (₹) *</label>
                  <input type="number" className="et-input" placeholder="0" min="0" value={form.amount}
                    onChange={e => setF("amount", e.target.value)} required/>
                </div>
                <div className="et-form-group">
                  <label>Payment Method</label>
                  <select className="et-input" value={form.paymentMethod} onChange={e => setF("paymentMethod", e.target.value)}>
                    {PAYMENT_METHODS.map(m => <option key={m.key} value={m.key}>{m.label}</option>)}
                  </select>
                </div>
              </div>

              {/* Description + Paid By */}
              <div className="et-form-row">
                <div className="et-form-group">
                  <label>Description</label>
                  <input className="et-input" placeholder="Brief description" value={form.description}
                    onChange={e => setF("description", e.target.value)}/>
                </div>
                <div className="et-form-group">
                  <label>Paid By</label>
                  <input className="et-input" placeholder="Name" value={form.paidBy}
                    onChange={e => setF("paidBy", e.target.value)}/>
                </div>
              </div>

              {/* Status + Recurring */}
              <div className="et-form-row">
                <div className="et-form-group">
                  <label>Status</label>
                  <div className="et-status-toggle">
                    <button
                      type="button"
                      className={`et-status-opt${form.status === "pending" ? " active pending" : ""}`}
                      onClick={() => setF("status", "pending")}
                    >
                      <Clock size={12}/> Pending
                    </button>
                    <button
                      type="button"
                      className={`et-status-opt${form.status === "paid" ? " active paid" : ""}`}
                      onClick={() => setF("status", "paid")}
                    >
                      <CheckCircle2 size={12}/> Paid
                    </button>
                  </div>
                </div>
                <div className="et-form-group">
                  <label>Recurring</label>
                  <button
                    type="button"
                    className={`et-recurring-btn${form.isRecurring ? " active" : ""}`}
                    onClick={() => setF("isRecurring", !form.isRecurring)}
                  >
                    {form.isRecurring ? "Yes — Monthly" : "No — One-time"}
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="et-form-group">
                <label>Notes</label>
                <textarea className="et-input et-textarea" rows={2} placeholder="Any additional notes…"
                  value={form.notes} onChange={e => setF("notes", e.target.value)}/>
              </div>

              <div className="et-modal-foot">
                <button type="button" className="et-btn-cancel" onClick={() => setModalOpen(false)}>Cancel</button>
                <button type="submit" className="et-btn-save" disabled={saving}>
                  {saving ? <BtnSpinner /> : <Check size={13}/>}
                  {saving ? "Saving…" : (editId ? "Update" : "Add Expense")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Edit Rent Config Modal ── */}
      {rentEditBranch && (
        <div className="et-overlay" onClick={() => setRentEditBranch(null)}>
          <div className="et-modal" style={{ maxWidth: 380 }} onClick={e => e.stopPropagation()}>
            <div className="et-modal-head">
              <div>
                <div className="et-modal-title">Edit Rent — {rentEditBranch} Office</div>
                <div style={{ fontSize:11, color:"#94a3b8", marginTop:2 }}>
                  Changes apply from next save onward
                </div>
              </div>
              <button type="button" className="et-modal-close" onClick={() => setRentEditBranch(null)}>
                <X size={16}/>
              </button>
            </div>
            <div className="et-modal-body">
              <div className="et-form-group">
                <label>Monthly Rent Amount (₹) *</label>
                <input
                  type="number"
                  className="et-input"
                  min="0"
                  placeholder="e.g. 33000"
                  value={rentEditForm.amount}
                  onChange={e => setRentEditForm(f => ({ ...f, amount: e.target.value }))}
                />
              </div>
              <div className="et-form-group">
                <label>Due Day of Month (1–28)</label>
                <input
                  type="number"
                  className="et-input"
                  min="1"
                  max="28"
                  placeholder="1"
                  value={rentEditForm.dueDay}
                  onChange={e => setRentEditForm(f => ({ ...f, dueDay: e.target.value }))}
                />
              </div>
              <div className="et-form-group">
                <label>Notes (landlord, bank details, etc.)</label>
                <textarea
                  className="et-input et-textarea"
                  rows={2}
                  placeholder="e.g. HDFC A/C 123456, contact: 9876543210"
                  value={rentEditForm.notes}
                  onChange={e => setRentEditForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <div className="et-modal-foot">
              <button type="button" className="et-btn-cancel" onClick={() => setRentEditBranch(null)}>Cancel</button>
              <button
                type="button"
                className="et-btn-save"
                onClick={saveRentConfig}
                disabled={rentEditSaving || !rentEditForm.amount}
              >
                <Check size={13}/> {rentEditSaving ? "Saving…" : "Save Rent Config"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
