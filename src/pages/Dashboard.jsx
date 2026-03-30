import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../utils/toast";
import {
  RefreshCcw, AlertTriangle, Phone, Mail, TrendingUp,
  Building2, Lightbulb, FileText, Users, Bell,
  Target, ChevronDown, ChevronRight, X, Check,
  CalendarDays, TrendingDown,
} from "lucide-react";
import Sidebar from "../components/Sidebar/Sidebar";
import LeadDrawer from "../Leads/LeadDrawer";
import { ShimmerKpiGrid, ShimmerTable } from "../components/ui/Shimmer";
import "./Dashboard.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const fmt = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));

const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

const today = new Date().toLocaleDateString("en-IN", {
  weekday: "long", day: "numeric", month: "long", year: "numeric",
});

const SALES_PERIODS = [
  { key: "all",    label: "All Time" },
  { key: "today",  label: "Today" },
  { key: "week",   label: "This Week" },
  { key: "month",  label: "This Month" },
  { key: "year",   label: "This Year" },
  { key: "custom", label: "Custom" },
];

const FUNNEL_STEPS = [
  { label: "Enquiries", key: "enquiries", color: "#3b82f6",  width: 100 },
  { label: "Reachable", key: "reachable", color: "#6366f1",  width: 84  },
  { label: "Qualified", key: "qualified", color: "#f59e0b",  width: 66  },
  { label: "Proposal",  key: "proposal",  color: "#8b5cf6",  width: 50  },
  { label: "Closed",    key: "closed",    color: "#10b981",  width: 36  },
];

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError]         = useState("");
  const [sendingEmail, setSendingEmail] = useState("");
  const [drawerLeadId, setDrawerLeadId] = useState(null);
  const [drawerOpen, setDrawerOpen]     = useState(false);

  /* ── Sales overview ── */
  const [salesPeriod, setSalesPeriod]   = useState("month");
  const [salesFrom, setSalesFrom]       = useState("");
  const [salesTo, setSalesTo]           = useState("");
  const [salesData, setSalesData]       = useState(null);
  const [salesLoading, setSalesLoading] = useState(false);

  /* ── Monthly target ── */
  const [target, setTarget]             = useState(null);
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [targetForm, setTargetForm]     = useState({ targetDeals: "", targetRevenue: "", notes: "" });
  const [targetSaving, setTargetSaving] = useState(false);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      setError("");
      if (isRefresh) setRefreshing(true); else setLoading(true);
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${API_BASE}/api/dashboard/summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      setDashboard(json?.data || null);
    } catch (err) {
      setError(err?.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const fetchSales = useCallback(async (period, from, to) => {
    setSalesLoading(true);
    try {
      let url = `${API_BASE}/api/dashboard/sales?period=${period}`;
      if (period === "custom" && from && to) url += `&from=${from}&to=${to}`;
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      setSalesData(json?.data || null);
    } catch (e) {
      toast.error(e?.message || "Failed to fetch sales data");
    } finally {
      setSalesLoading(false);
    }
  }, []);

  const fetchTarget = useCallback(async () => {
    try {
      const now = new Date();
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${API_BASE}/api/dashboard/target?year=${now.getFullYear()}&month=${now.getMonth() + 1}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json?.success && json?.data) setTarget(json.data);
    } catch (_) {}
  }, []);

  useEffect(() => { fetchDashboard(); fetchTarget(); }, [fetchDashboard, fetchTarget]);
  useEffect(() => {
    if (salesPeriod !== "custom") fetchSales(salesPeriod);
  }, [salesPeriod, fetchSales]);

  const handleSendFollowup = async (leadId, followupNumber) => {
    setSendingEmail(leadId);
    try {
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${API_BASE}/api/leads/${leadId}/send-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ type: "followup", followupNumber }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message);
      toast.success(`Follow-up ${followupNumber}/3 email sent!`);
      fetchDashboard(true);
    } catch (e) {
      toast.error(e?.message || "Failed to send email");
    } finally {
      setSendingEmail("");
    }
  };

  const handleSaveTarget = async () => {
    setTargetSaving(true);
    try {
      const now = new Date();
      const token = localStorage.getItem("nnc_token");
      const res  = await fetch(`${API_BASE}/api/dashboard/target`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          year:  now.getFullYear(),
          month: now.getMonth() + 1,
          targetDeals:   Number(targetForm.targetDeals)   || 0,
          targetRevenue: Number(targetForm.targetRevenue) || 0,
          notes: targetForm.notes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      setTarget(json.data);
      setTargetModalOpen(false);
      toast.success("Monthly target saved!");
    } catch (e) {
      toast.error(e?.message || "Failed to save target");
    } finally {
      setTargetSaving(false);
    }
  };

  const navigate = useNavigate();

  const openLead = (leadId) => {
    setDrawerLeadId(leadId);
    setDrawerOpen(true);
  };

  const summary   = dashboard?.summary        || {};
  const funnel    = dashboard?.funnel         || {};
  const projectStats  = dashboard?.projectStats   || {};
  const paymentHealth = dashboard?.paymentHealth  || {};
  const approvalWatchlist = dashboard?.approvalWatchlist || [];
  const followupQueue     = dashboard?.followupQueue     || [];
  const paymentAlerts     = dashboard?.paymentAlerts     || [];
  const todayFollowups    = dashboard?.todayFollowups    || [];
  const branchPerf        = dashboard?.branchPerformance || [];
  const insight           = dashboard?.insight           || "";
  const overdueCount      = dashboard?.overdueCount      || 0;

  /* funnel conversion rates */
  const funnelConvRates = useMemo(() => {
    const enq = funnel.enquiries || 0;
    const pct = (v) => enq > 0 ? Math.round((v / enq) * 100) : 0;
    return {
      reachable: pct(funnel.reachable || 0),
      qualified: pct(funnel.qualified || 0),
      proposal:  pct(funnel.proposal  || 0),
      closed:    pct(funnel.closed    || 0),
    };
  }, [funnel]);

  /* target progress */
  const dealsProgress    = target?.targetDeals   > 0 ? Math.min(100, Math.round(((salesData?.closedDeals || 0) / target.targetDeals)   * 100)) : 0;
  const revenueProgress  = target?.targetRevenue > 0 ? Math.min(100, Math.round(((salesData?.revenue    || 0) / target.targetRevenue)  * 100)) : 0;

  const currentMonthLabel = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

  return (
    <div className="db-layout">
      <Sidebar active="Dashboard" />

      <div className="db-main">
        {/* ── Hero band ── */}
        <div className="db-hero">
          <div className="db-hero-left">
            <div className="db-hero-eyebrow">Business Command Center</div>
            <h1 className="db-hero-title">Dashboard</h1>
            <p className="db-hero-date">{today}</p>
            <div className="db-hero-pills">
              <span className="db-pill"><span className="db-pill-dot blue"/>{projectStats.inDevelopment || 0} In Development</span>
              <span className="db-pill"><span className="db-pill-dot orange"/>{projectStats.pendingApproval || 0} Pending Approval</span>
              <span className="db-pill"><span className="db-pill-dot red"/>{projectStats.overdue || 0} Overdue</span>
              <span className="db-pill"><span className="db-pill-dot yellow"/>{paymentHealth.partialCount || 0} Partial Payments</span>
            </div>
          </div>
          <div className="db-hero-right">
            <button className="db-refresh-btn" onClick={() => fetchDashboard(true)} disabled={refreshing} type="button">
              <RefreshCcw size={14} className={refreshing ? "db-spin" : ""}/>
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>
        </div>

        <div className="db-body">
          {error && <div className="db-error"><AlertTriangle size={16}/> {error}</div>}

          {loading ? (
            <div className="db-body">
              <ShimmerKpiGrid count={4} cols={4} />
              <div style={{ marginTop: 18 }}>
                <ShimmerKpiGrid count={4} cols={4} />
              </div>
              <div style={{ marginTop: 18 }}>
                <ShimmerTable rows={6} cells={5} />
              </div>
            </div>
          ) : (
            <>
              {/* ── Sales Overview ── */}
              <div className="db-sales-overview">
                <div className="db-so-header">
                  <div className="db-so-title">
                    <TrendingUp size={16} color="#3b82f6"/>
                    Sales Overview
                  </div>
                  <div className="db-so-tabs">
                    {SALES_PERIODS.map(p => (
                      <button
                        key={p.key}
                        type="button"
                        className={`db-so-tab${salesPeriod === p.key ? " active" : ""}`}
                        onClick={() => setSalesPeriod(p.key)}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                {salesPeriod === "custom" && (
                  <div className="db-so-custom">
                    <label className="db-so-custom-label">From</label>
                    <input type="date" className="db-so-date" value={salesFrom} onChange={e => setSalesFrom(e.target.value)}/>
                    <label className="db-so-custom-label">To</label>
                    <input type="date" className="db-so-date" value={salesTo}   onChange={e => setSalesTo(e.target.value)}/>
                    <button
                      type="button"
                      className="db-so-apply"
                      onClick={() => salesFrom && salesTo && fetchSales("custom", salesFrom, salesTo)}
                      disabled={!salesFrom || !salesTo || salesLoading}
                    >
                      {salesLoading ? "Loading…" : "Apply"}
                    </button>
                  </div>
                )}

                <div className="db-so-cards">
                  <div className="db-so-card teal" onClick={() => navigate("/enquiries")} style={{ cursor:"pointer" }}>
                    <div className="db-so-card-icon">💬</div>
                    <div className="db-so-card-val">{salesLoading ? "—" : (salesData?.enquiries ?? "—")}</div>
                    <div className="db-so-card-label">Enquiries</div>
                    <div className="db-so-card-sub">{salesData?.period || "—"}</div>
                  </div>
                  <div className="db-so-card blue" onClick={() => navigate("/leads")} style={{ cursor:"pointer" }}>
                    <div className="db-so-card-icon">👥</div>
                    <div className="db-so-card-val">{salesLoading ? "—" : (salesData?.newLeads ?? "—")}</div>
                    <div className="db-so-card-label">New Leads</div>
                    <div className="db-so-card-sub">{salesData?.period || "—"}</div>
                  </div>
                  <div className="db-so-card green" onClick={() => navigate("/leads?stage=Closed")} style={{ cursor:"pointer" }}>
                    <div className="db-so-card-icon">🤝</div>
                    <div className="db-so-card-val">{salesLoading ? "—" : (salesData?.closedDeals ?? "—")}</div>
                    <div className="db-so-card-label">Deals Closed</div>
                    <div className="db-so-card-sub">
                      {target?.targetDeals > 0
                        ? `${dealsProgress}% of ${target.targetDeals} target`
                        : "No target set"}
                    </div>
                  </div>
                  <div className="db-so-card violet" onClick={() => navigate("/analytics")} style={{ cursor:"pointer" }}>
                    <div className="db-so-card-icon">💰</div>
                    <div className="db-so-card-val">{salesLoading ? "—" : fmtShort(salesData?.revenue)}</div>
                    <div className="db-so-card-label">Revenue Generated</div>
                    <div className="db-so-card-sub">
                      {target?.targetRevenue > 0
                        ? `${revenueProgress}% of ${fmtShort(target.targetRevenue)} target`
                        : "No target set"}
                    </div>
                  </div>
                  <div className="db-so-card orange" onClick={() => navigate("/analytics")} style={{ cursor:"pointer" }}>
                    <div className="db-so-card-icon">📊</div>
                    <div className="db-so-card-val">
                      {salesLoading || !salesData ? "—"
                        : salesData.enquiries > 0
                          ? `${Math.round((salesData.closedDeals / salesData.enquiries) * 100)}%`
                          : "0%"}
                    </div>
                    <div className="db-so-card-label">Conversion Rate</div>
                    <div className="db-so-card-sub">enquiries → closed</div>
                  </div>
                </div>

                {/* Target progress bars (only visible when target set & month selected) */}
                {target && (salesPeriod === "month") && (
                  <div className="db-so-target-row">
                    <div className="db-so-target-item">
                      <div className="db-so-target-meta">
                        <span className="db-so-target-lbl">Deals Target — {currentMonthLabel}</span>
                        <span className="db-so-target-num">
                          {salesData?.closedDeals || 0} / {target.targetDeals}
                          <span className={`db-so-target-pct${dealsProgress >= 100 ? " done" : ""}`}> ({dealsProgress}%)</span>
                        </span>
                      </div>
                      <div className="db-so-prog-bg">
                        <div
                          className="db-so-prog-fill green"
                          style={{ width: `${dealsProgress}%` }}
                        />
                      </div>
                    </div>
                    <div className="db-so-target-item">
                      <div className="db-so-target-meta">
                        <span className="db-so-target-lbl">Revenue Target — {currentMonthLabel}</span>
                        <span className="db-so-target-num">
                          {fmtShort(salesData?.revenue)} / {fmtShort(target.targetRevenue)}
                          <span className={`db-so-target-pct${revenueProgress >= 100 ? " done" : ""}`}> ({revenueProgress}%)</span>
                        </span>
                      </div>
                      <div className="db-so-prog-bg">
                        <div
                          className="db-so-prog-fill violet"
                          style={{ width: `${revenueProgress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── Revenue health ── */}
              <div className="db-rev-grid">
                <div className="db-rev-card blue" onClick={() => navigate("/leads")} style={{ cursor:"pointer" }}>
                  <div className="db-rev-icon">💰</div>
                  <div className="db-rev-label">Total Agreed Value</div>
                  <div className="db-rev-value">{fmtShort(paymentHealth.totalAgreed)}</div>
                  <div className="db-rev-sub">across all active projects</div>
                </div>
                <div className="db-rev-card green" onClick={() => navigate("/payment-tracker")} style={{ cursor:"pointer" }}>
                  <div className="db-rev-icon">✅</div>
                  <div className="db-rev-label">Advance Collected</div>
                  <div className="db-rev-value">{fmtShort(paymentHealth.advanceCollected)}</div>
                  <div className="db-rev-sub">{paymentHealth.fullyPaidCount || 0} fully paid clients</div>
                </div>
                <div className="db-rev-card red" onClick={() => navigate("/payment-tracker")} style={{ cursor:"pointer" }}>
                  <div className="db-rev-icon">⏳</div>
                  <div className="db-rev-label">Balance Pending</div>
                  <div className="db-rev-value">{fmtShort(paymentHealth.balancePending)}</div>
                  <div className="db-rev-sub">{paymentHealth.partialCount || 0} partial · {paymentHealth.unpaidCount || 0} unpaid</div>
                </div>
                <div className="db-rev-card violet" onClick={() => navigate("/payment-tracker")} style={{ cursor:"pointer" }}>
                  <div className="db-rev-icon">📅</div>
                  <div className="db-rev-label">Collected This Month</div>
                  <div className="db-rev-value">{fmtShort(paymentHealth.thisMonthCollected)}</div>
                  <div className="db-rev-sub">{fmt(summary.thisMonthRevenue || 0)} revenue</div>
                </div>
              </div>

              {/* ── Project pipeline strip ── */}
              <div className="db-proj-strip">
                <div className="db-proj-mini indev" onClick={() => navigate("/leads?stage=Closed")}>
                  <div className="db-proj-mini-num">{projectStats.inDevelopment || 0}</div>
                  <div className="db-proj-mini-lbl">In Development</div>
                </div>
                <div className="db-proj-mini pending" onClick={() => navigate("/leads?stage=Closed")}>
                  <div className="db-proj-mini-num">{projectStats.pendingApproval || 0}</div>
                  <div className="db-proj-mini-lbl">Pending Approval</div>
                </div>
                <div className="db-proj-mini overdue" onClick={() => navigate("/leads?stage=Closed")}>
                  <div className="db-proj-mini-num">{projectStats.overdue || 0}</div>
                  <div className="db-proj-mini-lbl">Overdue Projects</div>
                </div>
                <div className="db-proj-mini onhold" onClick={() => navigate("/leads?stage=Closed")}>
                  <div className="db-proj-mini-num">{projectStats.onHold || 0}</div>
                  <div className="db-proj-mini-lbl">On Hold / Restarted</div>
                </div>
                <div className="db-proj-mini done" onClick={() => navigate("/leads?stage=Closed")}>
                  <div className="db-proj-mini-num">{projectStats.completed || 0}</div>
                  <div className="db-proj-mini-lbl">Completed</div>
                </div>
              </div>

              {/* ── Main grid ── */}
              <div className="db-grid">

                {/* LEFT column */}
                <div className="db-col">

                  {/* Approval Watchlist */}
                  <div className="db-card">
                    <div className="db-card-head">
                      <h3>Awaiting Client Approval</h3>
                      <span className="db-card-badge orange">{approvalWatchlist.length} clients</span>
                    </div>
                    {approvalWatchlist.length === 0 ? (
                      <div className="db-empty">All projects approved — great work!</div>
                    ) : (
                      <div className="db-watch-list">
                        {approvalWatchlist.map(item => (
                          <div key={String(item.leadId)} className="db-watch-row" onClick={() => openLead(item.leadId)} style={{ cursor: "pointer" }}>
                            <div>
                              <div className="db-watch-name">{item.name}</div>
                              <div className="db-watch-biz">{item.business || item.repName || "—"}</div>
                            </div>
                            <div className={`db-watch-days ${item.daysWaiting >= 7 ? "urgent" : item.daysWaiting >= 3 ? "warn" : "ok"}`}>
                              {item.daysWaiting}d waiting
                            </div>
                            <span className={`db-watch-status ${item.approvalStatus}`}>
                              {item.approvalStatus === "on_hold" ? "On Hold" : item.approvalStatus === "restarted" ? "Restarted" : "Pending"}
                            </span>
                            <div className="db-watch-actions" onClick={e => e.stopPropagation()}>
                              {item.phone && (
                                <button className="db-icon-btn phone" title="Call" onClick={() => { window.location.href = `tel:${item.phone}`; }}>
                                  <Phone size={12}/>
                                </button>
                              )}
                              {item.email && (
                                <button className="db-icon-btn mail" title="Send follow-up email"
                                  onClick={() => handleSendFollowup(item.leadId, Math.min((item.emailLogsCount || 0) + 1, 3))}
                                  disabled={sendingEmail === String(item.leadId)}>
                                  <Mail size={12}/>
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Follow-up Queue */}
                  <div className="db-card">
                    <div className="db-card-head">
                      <h3>Auto Follow-up Queue</h3>
                      <span className="db-card-badge red">8+ days · no update</span>
                    </div>
                    {followupQueue.length === 0 ? (
                      <div className="db-empty">No clients in follow-up queue.</div>
                    ) : (
                      <div className="db-fq-list">
                        {followupQueue.map(item => (
                          <div key={String(item.leadId)} className="db-fq-row">
                            <div onClick={() => openLead(item.leadId)} style={{ cursor: "pointer" }}>
                              <div className="db-fq-name">{item.name}</div>
                              <div className="db-fq-biz">{item.business || item.repName || "—"}</div>
                            </div>
                            <div className="db-fq-days">{item.daysSinceStart}<br/><span>days</span></div>
                            {item.followupsSent < 3 ? (
                              <button className="db-fq-send-btn" disabled={sendingEmail === String(item.leadId)}
                                onClick={() => handleSendFollowup(item.leadId, item.nextFollowup)}>
                                {sendingEmail === String(item.leadId) ? "Sending..." : `Send F/U ${item.nextFollowup}/3`}
                              </button>
                            ) : (
                              <div className="db-fq-sent">All 3 sent</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Branch performance */}
                  <div className="db-card">
                    <div className="db-card-head">
                      <h3>Branch Performance</h3>
                      <TrendingUp size={15} color="#64748b"/>
                    </div>
                    <div style={{ padding: "10px 14px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      {branchPerf.length === 0 ? (
                        <div className="db-empty">No branch data.</div>
                      ) : branchPerf.map((b, i) => (
                        <div key={i} style={{ display:"flex", flexDirection:"column", gap:"5px" }}>
                          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                            <div style={{ display:"flex", gap:"8px", alignItems:"center" }}>
                              <div style={{ width:28, height:28, borderRadius:8, background:"#f8fafc", border:"1px solid #e5e7eb", display:"flex", alignItems:"center", justifyContent:"center", color:"#2563eb" }}>
                                <Building2 size={13}/>
                              </div>
                              <div>
                                <div style={{ fontSize:13, fontWeight:800, color:"#111827" }}>{b.name}</div>
                                <div style={{ fontSize:11, color:"#64748b" }}>{b.leads} leads · {b.closed} closed</div>
                              </div>
                            </div>
                            <div style={{ fontSize:13, fontWeight:800, color:"#1d4ed8" }}>{fmtShort(b.revenue)}</div>
                          </div>
                          <div style={{ height:5, background:"#e5e7eb", borderRadius:999, overflow:"hidden" }}>
                            <div style={{ height:"100%", width:`${b.rate || 0}%`, background:"linear-gradient(90deg,#3b82f6,#10b981)", borderRadius:999 }}/>
                          </div>
                          <div style={{ fontSize:10, color:"#94a3b8", fontWeight:700 }}>Close rate {b.rate || 0}%</div>
                        </div>
                      ))}
                      {insight && (
                        <div style={{ marginTop:8, padding:"10px 12px", background:"#eff6ff", border:"1px solid #dbeafe", borderRadius:10 }}>
                          <div style={{ fontSize:10, fontWeight:800, color:"#2563eb", textTransform:"uppercase", letterSpacing:".5px", display:"flex", gap:5, alignItems:"center", marginBottom:4 }}>
                            <Lightbulb size={11}/> Insight
                          </div>
                          <p style={{ margin:0, fontSize:12, color:"#334155", lineHeight:1.5 }}>{insight}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT column */}
                <div className="db-col">

                  {/* Today's follow-ups */}
                  <div className="db-card">
                    <div className="db-card-head">
                      <h3>Today's Follow-ups</h3>
                      {overdueCount > 0 && <span className="db-card-badge red">{overdueCount} overdue</span>}
                    </div>
                    {todayFollowups.length === 0 ? (
                      <div className="db-empty">No follow-ups due today.</div>
                    ) : (
                      <div className="db-followup-list">
                        {todayFollowups.map((item, i) => (
                          <div key={i} className="db-followup-item">
                            <div className="db-followup-top">
                              <div className="db-followup-name">{item.leadName}</div>
                              <span className={`db-followup-badge ${String(item.priority).toLowerCase() === "hot" ? "hot" : "warm"}`}>
                                {item.priority}
                              </span>
                            </div>
                            <div className="db-followup-title">{item.title}</div>
                            <div className="db-followup-meta">
                              <span><Phone size={10}/> {item.branch || "—"}</span>
                              <span>Day {item.dayIndex || 1}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Payment alerts — split by committed-not-paid vs partial */}
                  <div className="db-card">
                    <div className="db-card-head">
                      <h3>Advance Collection Status</h3>
                      <div style={{ display:"flex", gap:6 }}>
                        <span className="db-card-badge red">{paymentAlerts.filter(p => p.isNotPaid).length} not paid</span>
                        <span className="db-card-badge orange">{paymentAlerts.filter(p => !p.isNotPaid).length} partial</span>
                      </div>
                    </div>

                    {paymentAlerts.length === 0 ? (
                      <div className="db-empty">All advances collected!</div>
                    ) : (
                      <div className="db-pay-list">

                        {/* ── Committed but ZERO advance ── */}
                        {paymentAlerts.filter(p => p.isNotPaid).length > 0 && (
                          <div className="db-pay-section-hd red">
                            <AlertTriangle size={11}/> Committed — No Advance Paid
                          </div>
                        )}
                        {paymentAlerts.filter(p => p.isNotPaid).map(item => (
                          <div key={String(item.leadId)} className="db-pay-row not-paid" onClick={() => openLead(item.leadId)}>
                            <div className="db-pay-info">
                              <div className="db-pay-name">{item.name}</div>
                              <div className="db-pay-biz">{item.business || item.repName || "—"}</div>
                              <div className="db-pay-meta-row">
                                <span className="db-pay-stage">{item.stage}</span>
                                {item.daysSinceLead != null && (
                                  <span className={`db-pay-age ${item.daysSinceLead >= 30 ? "old" : item.daysSinceLead >= 14 ? "warn" : ""}`}>
                                    {item.daysSinceLead}d as lead
                                  </span>
                                )}
                              </div>
                              <div className="db-pay-bar">
                                <div className="db-pay-fill" style={{ width: "0%" }}/>
                              </div>
                            </div>
                            <div className="db-pay-right">
                              <div className="db-pay-rem red">{fmtShort(item.totalValue)}</div>
                              <div className="db-pay-pct">0% paid</div>
                            </div>
                          </div>
                        ))}

                        {/* ── Partially paid ── */}
                        {paymentAlerts.filter(p => !p.isNotPaid).length > 0 && (
                          <div className="db-pay-section-hd orange">
                            Partial Payments
                          </div>
                        )}
                        {paymentAlerts.filter(p => !p.isNotPaid).map(item => (
                          <div key={String(item.leadId)} className="db-pay-row" onClick={() => openLead(item.leadId)}>
                            <div className="db-pay-info">
                              <div className="db-pay-name">{item.name}</div>
                              <div className="db-pay-biz">{item.business || item.repName || "—"}</div>
                              <div className="db-pay-meta-row">
                                <span className="db-pay-stage">{item.stage}</span>
                                {item.daysSinceLead != null && (
                                  <span className={`db-pay-age ${item.daysSinceLead >= 30 ? "old" : item.daysSinceLead >= 14 ? "warn" : ""}`}>
                                    {item.daysSinceLead}d as lead
                                  </span>
                                )}
                              </div>
                              <div className="db-pay-bar">
                                <div className="db-pay-fill" style={{ width: `${item.advancePct}%` }}/>
                              </div>
                            </div>
                            <div className="db-pay-right">
                              <div className="db-pay-rem">−{fmtShort(item.remaining)}</div>
                              <div className="db-pay-pct">{item.advancePct}% paid</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sales Funnel — redesigned */}
                  <div className="db-card">
                    <div className="db-card-head">
                      <h3>Sales Funnel</h3>
                      <div style={{ display:"flex", gap:8, alignItems:"center" }}>
                        <span className="db-card-badge blue">{funnel.enquiries || 0} total leads</span>
                        <button
                          type="button"
                          className="db-target-btn"
                          onClick={() => {
                            setTargetForm({
                              targetDeals:   target?.targetDeals   || "",
                              targetRevenue: target?.targetRevenue || "",
                              notes:         target?.notes         || "",
                            });
                            setTargetModalOpen(true);
                          }}
                        >
                          <Target size={12}/>
                          {target ? "Edit Target" : "Set Target"}
                        </button>
                      </div>
                    </div>

                    {/* Funnel visualization */}
                    <div className="db-funnel-v2">
                      {FUNNEL_STEPS.map((step, i) => {
                        const val  = funnel[step.key] || 0;
                        const prev = i === 0 ? val : (funnel[FUNNEL_STEPS[i-1].key] || 0);
                        const dropPct = prev > 0 ? Math.round((1 - val / prev) * 100) : 0;
                        return (
                          <div key={step.key} className="db-funnel-step">
                            <div
                              className="db-funnel-bar"
                              style={{
                                width: `${step.width}%`,
                                background: step.color,
                              }}
                            >
                              <span className="db-funnel-bar-label">{step.label}</span>
                              <span className="db-funnel-bar-val">{val}</span>
                            </div>
                            {i > 0 && dropPct > 0 && (
                              <div className="db-funnel-drop">
                                <TrendingDown size={10}/> {dropPct}% drop
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Conversion summary */}
                    <div className="db-funnel-rates">
                      {[
                        { label: "Reachable",  pct: funnelConvRates.reachable, color: "#6366f1" },
                        { label: "Qualified",  pct: funnelConvRates.qualified,  color: "#f59e0b" },
                        { label: "Closed",     pct: funnelConvRates.closed,     color: "#10b981" },
                      ].map(r => (
                        <div key={r.label} className="db-funnel-rate-pill" style={{ borderColor: r.color + "44", color: r.color }}>
                          <span style={{ fontWeight:800 }}>{r.pct}%</span> {r.label}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick stats */}
                  <div className="db-card">
                    <div className="db-quick-row">
                      <div className="db-quick-item">
                        <div className="db-quick-icon blue"><FileText size={16}/></div>
                        <div className="db-quick-val">{summary.totalDocuments || 0}</div>
                        <div className="db-quick-label">Documents</div>
                      </div>
                      <div className="db-quick-item">
                        <div className="db-quick-icon green"><Users size={16}/></div>
                        <div className="db-quick-val">{summary.totalReps || 0}</div>
                        <div className="db-quick-label">Active Reps</div>
                      </div>
                      <div className="db-quick-item">
                        <div className="db-quick-icon purple"><Bell size={16}/></div>
                        <div className="db-quick-val">{summary.conversionRate || 0}%</div>
                        <div className="db-quick-label">Close Rate</div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Lead Drawer */}
      <LeadDrawer
        open={drawerOpen}
        leadId={drawerLeadId}
        apiBase={API_BASE}
        onClose={() => { setDrawerOpen(false); setDrawerLeadId(null); }}
        onLeadUpdated={() => fetchDashboard(true)}
      />

      {/* ── Set Target Modal ── */}
      {targetModalOpen && (
        <div className="db-target-overlay" onClick={() => setTargetModalOpen(false)}>
          <div className="db-target-modal" onClick={e => e.stopPropagation()}>
            <div className="db-target-modal-head">
              <div>
                <div className="db-target-modal-title">
                  <Target size={16} color="#3b82f6"/> Monthly Target
                </div>
                <div className="db-target-modal-sub">{currentMonthLabel}</div>
              </div>
              <button type="button" className="db-target-close" onClick={() => setTargetModalOpen(false)}>
                <X size={16}/>
              </button>
            </div>
            <div className="db-target-modal-body">
              <label className="db-target-label">Deals to Close (count)</label>
              <input
                type="number"
                className="db-target-input"
                placeholder="e.g. 10"
                min="0"
                value={targetForm.targetDeals}
                onChange={e => setTargetForm(f => ({ ...f, targetDeals: e.target.value }))}
              />
              <label className="db-target-label">Revenue Target (₹)</label>
              <input
                type="number"
                className="db-target-input"
                placeholder="e.g. 500000"
                min="0"
                value={targetForm.targetRevenue}
                onChange={e => setTargetForm(f => ({ ...f, targetRevenue: e.target.value }))}
              />
              <label className="db-target-label">Notes (optional)</label>
              <input
                type="text"
                className="db-target-input"
                placeholder="e.g. Q1 push — focus on enterprise"
                value={targetForm.notes}
                onChange={e => setTargetForm(f => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="db-target-modal-foot">
              <button type="button" className="db-target-cancel" onClick={() => setTargetModalOpen(false)}>Cancel</button>
              <button type="button" className="db-target-save" onClick={handleSaveTarget} disabled={targetSaving}>
                <Check size={13}/> {targetSaving ? "Saving…" : "Save Target"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
