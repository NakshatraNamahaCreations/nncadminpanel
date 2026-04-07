import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "../utils/toast";
import {
  RefreshCcw, TrendingUp, Target, Check, X,
  Phone, AlertTriangle, Building2, Users,
  CreditCard, Flame, Zap, Trophy, ArrowRight,
  TrendingDown, ChevronRight, Bell,
} from "lucide-react";
import Sidebar from "../components/Sidebar/Sidebar";
import LeadDrawer from "../Leads/LeadDrawer";
import "./Dashboard.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";
function auth() { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; }

const fmtINR = (n) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(Number(n || 0));
const fmtShort = (n) => {
  const v = Number(n || 0);
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(2)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
};

const todayStr = new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
const monthStr  = new Date().toLocaleDateString("en-IN", { month: "long", year: "numeric" });

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "week",  label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year",  label: "This Year" },
  { key: "all",   label: "All Time" },
];

const FUNNEL = [
  { label: "Enquiries", key: "enquiries", color: "#3b82f6" },
  { label: "Reachable", key: "reachable", color: "#6366f1" },
  { label: "Qualified", key: "qualified", color: "#f59e0b" },
  { label: "Proposal",  key: "proposal",  color: "#8b5cf6" },
  { label: "Closed",    key: "closed",    color: "#10b981" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [dash,       setDash]       = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period,     setPeriod]     = useState("month");
  const [salesData,  setSalesData]  = useState(null);
  const [salesLoad,  setSalesLoad]  = useState(false);
  const [target,     setTarget]     = useState(null);
  const [tModal,     setTModal]     = useState(false);
  const [tForm,      setTForm]      = useState({ targetDeals: "", targetRevenue: "", notes: "" });
  const [tSaving,    setTSaving]    = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerId,   setDrawerId]   = useState(null);

  const fetchDash = useCallback(async (ref = false) => {
    try {
      if (ref) setRefreshing(true); else setLoading(true);
      const res  = await fetch(`${API_BASE}/api/dashboard/summary`, { headers: auth() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      setDash(json?.data || null);
    } catch (e) { toast.error(e?.message || "Failed to load dashboard"); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchSales = useCallback(async (p) => {
    setSalesLoad(true);
    try {
      const res  = await fetch(`${API_BASE}/api/dashboard/sales?period=${p}`, { headers: auth() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message);
      setSalesData(json?.data || null);
    } catch {} finally { setSalesLoad(false); }
  }, []);

  const fetchTarget = useCallback(async () => {
    try {
      const now = new Date();
      const res  = await fetch(`${API_BASE}/api/dashboard/target?year=${now.getFullYear()}&month=${now.getMonth()+1}`, { headers: auth() });
      const json = await res.json();
      if (json?.success && json?.data) setTarget(json.data);
    } catch {}
  }, []);

  useEffect(() => { fetchDash(); fetchTarget(); }, [fetchDash, fetchTarget]);
  useEffect(() => { fetchSales(period); }, [period, fetchSales]);

  const openLead = (id) => { setDrawerId(id); setDrawerOpen(true); };

  const saveTarget = async () => {
    setTSaving(true);
    try {
      const now = new Date();
      const res  = await fetch(`${API_BASE}/api/dashboard/target`, {
        method: "POST", headers: { ...auth(), "Content-Type": "application/json" },
        body: JSON.stringify({ year: now.getFullYear(), month: now.getMonth()+1, targetDeals: Number(tForm.targetDeals)||0, targetRevenue: Number(tForm.targetRevenue)||0, notes: tForm.notes }),
      });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      setTarget(json.data); setTModal(false); toast.success("Target saved!");
    } catch (e) { toast.error(e?.message || "Failed"); } finally { setTSaving(false); }
  };

  const summary        = dash?.summary             || {};
  const funnel         = dash?.funnel              || {};
  const paymentHealth  = dash?.paymentHealth       || {};
  const projectStats   = dash?.projectStats        || {};
  const paymentAlerts  = dash?.paymentAlerts       || [];
  const followupQueue  = dash?.followupQueue       || [];
  const todayFollowups = dash?.todayFollowups      || [];
  const branchPerf     = dash?.branchPerformance   || [];
  const approvalWatch  = dash?.approvalWatchlist   || [];
  const overdueCount   = dash?.overdueCount        || 0;

  const dealsProgress   = target?.targetDeals   > 0 ? Math.min(100, Math.round(((salesData?.closedDeals||0)/target.targetDeals)*100))   : 0;
  const revenueProgress = target?.targetRevenue > 0 ? Math.min(100, Math.round(((salesData?.revenue||0)/target.targetRevenue)*100)) : 0;

  const convRate = salesData?.enquiries > 0 ? Math.round((salesData.closedDeals/salesData.enquiries)*100) : 0;

  // Motivation message
  const motivationMsg = useMemo(() => {
    if (revenueProgress >= 100) return { text: "🎉 Target crushed! You're on fire!", color: "#10b981" };
    if (revenueProgress >= 75)  return { text: "💪 Almost there — one strong push!", color: "#f59e0b" };
    if (revenueProgress >= 50)  return { text: "🔥 Halfway — keep the momentum going!", color: "#f59e0b" };
    if (revenueProgress >= 25)  return { text: "⚡ Good start — pick up the pace!", color: "#6366f1" };
    if (revenueProgress > 0)    return { text: "🚀 Just getting started — chase it!", color: "#6366f1" };
    return { text: "🎯 Set a target and dominate this month!", color: "#6b7280" };
  }, [revenueProgress]);

  if (loading) return (
    <div className="db-layout">
      <Sidebar />
      <div className="db-main" style={{ display:"flex", alignItems:"center", justifyContent:"center" }}>
        <div style={{ textAlign:"center", color:"#6b7280" }}>
          <RefreshCcw size={28} className="db-spin" color="#6366f1" />
          <div style={{ marginTop:10, fontWeight:600 }}>Loading dashboard…</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="db-layout">
      <Sidebar />
      <div className="db-main">

        {/* ── Header ── */}
        <div className="db-header">
          <div>
            <div className="db-header-title">Good {new Date().getHours() < 12 ? "Morning" : new Date().getHours() < 17 ? "Afternoon" : "Evening"} 👋</div>
            <div className="db-header-date">{todayStr}</div>
          </div>
          <div className="db-header-right">
            {target && (
              <div className="db-motivation-pill">
                {motivationMsg.text}
              </div>
            )}
            <button className="db-refresh-btn" onClick={() => { fetchDash(true); fetchSales(period); }} disabled={refreshing}>
              <RefreshCcw size={14} className={refreshing ? "db-spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        <div className="db-content">

        {/* ── Top KPI Strip ── */}
        <div className="db-kpi-strip">
          <KpiCard icon={<Users size={18}/>}       label="Total Leads"       value={summary.totalLeads || 0}             color="blue"   onClick={() => navigate("/leads")} />
          <KpiCard icon={<Flame size={18}/>}        label="Active Pipeline"   value={summary.activeLeads || 0}            color="orange" onClick={() => navigate("/leads")} />
          <KpiCard icon={<Trophy size={18}/>}       label="Deals Closed"      value={salesData?.closedDeals || 0}         color="green"  onClick={() => navigate("/leads")} loading={salesLoad} />
          <KpiCard icon={<TrendingUp size={18}/>}   label="Revenue"           value={fmtShort(salesData?.revenue)}        color="purple" onClick={() => navigate("/analytics")} loading={salesLoad} />
          <KpiCard icon={<CreditCard size={18}/>}   label="Collected"         value={fmtShort(paymentHealth.advanceCollected)} color="teal" onClick={() => navigate("/payment-tracker")} />
          <KpiCard icon={<AlertTriangle size={18}/>} label="Balance Pending"  value={fmtShort(paymentHealth.balancePending)}  color="red"  onClick={() => navigate("/payment-tracker")} />
        </div>

        {/* ── Period tabs + Target ── */}
        <div className="db-sales-bar">
          <div className="db-period-tabs">
            {PERIODS.map(p => (
              <button key={p.key} className={`db-period-tab ${period===p.key?"active":""}`} onClick={() => setPeriod(p.key)}>
                {p.label}
              </button>
            ))}
          </div>
          <button className="db-target-btn" onClick={() => { setTForm({ targetDeals: target?.targetDeals||"", targetRevenue: target?.targetRevenue||"", notes: target?.notes||"" }); setTModal(true); }}>
            <Target size={13}/> {target ? "Edit Target" : "Set Target"}
          </button>
        </div>

        {/* ── Target Progress ── */}
        {target && period === "month" && (
          <div className="db-target-row">
            <TargetBar label="Deals Closed" current={salesData?.closedDeals||0} target={target.targetDeals} pct={dealsProgress} color="#10b981" suffix="deals" />
            <TargetBar label="Revenue"      current={fmtShort(salesData?.revenue)} target={fmtShort(target.targetRevenue)} pct={revenueProgress} color="#6366f1" suffix="" />
          </div>
        )}

        {/* ── Main Body ── */}
        <div className="db-body-grid">

          {/* LEFT — Sales + Funnel + Payments */}
          <div className="db-col-left">

            {/* Sales mini cards */}
            <div className="db-sales-mini">
              <SalesMini label="Enquiries"  value={salesData?.enquiries||0}   icon="💬" color="#3b82f6" loading={salesLoad} />
              <SalesMini label="New Leads"  value={salesData?.newLeads||0}     icon="👥" color="#6366f1" loading={salesLoad} />
              <SalesMini label="Deals Won"  value={salesData?.closedDeals||0}  icon="🤝" color="#10b981" loading={salesLoad} />
              <SalesMini label="Conv. Rate" value={`${convRate}%`}             icon="📊" color="#f59e0b" loading={salesLoad} />
            </div>

            {/* Sales Funnel */}
            <div className="db-card">
              <div className="db-card-head">
                <span className="db-card-title"><Zap size={14} color="#f59e0b"/> Sales Funnel</span>
                <span className="db-badge blue">{funnel.enquiries||0} total</span>
              </div>
              <div className="db-funnel">
                {FUNNEL.map((step, i) => {
                  const val  = funnel[step.key] || 0;
                  const max  = funnel.enquiries  || 1;
                  const pct  = Math.round((val / max) * 100);
                  const prev = i > 0 ? (funnel[FUNNEL[i-1].key] || 0) : val;
                  const drop = i > 0 && prev > 0 ? Math.round((1 - val/prev)*100) : 0;
                  return (
                    <div key={step.key} className="db-funnel-row">
                      <div className="db-funnel-label">{step.label}</div>
                      <div className="db-funnel-track">
                        <div className="db-funnel-fill" style={{ width:`${pct}%`, background: step.color }} />
                      </div>
                      <div className="db-funnel-val">{val}</div>
                      {drop > 0 && <div className="db-funnel-drop"><TrendingDown size={10}/>{drop}%</div>}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Alerts */}
            <div className="db-card">
              <div className="db-card-head">
                <span className="db-card-title"><Bell size={14} color="#ef4444"/> Pending Collections</span>
                <div style={{display:"flex",gap:6}}>
                  <span className="db-badge red">{paymentAlerts.filter(p=>p.isNotPaid).length} not paid</span>
                  <span className="db-badge orange">{paymentAlerts.filter(p=>!p.isNotPaid).length} partial</span>
                </div>
              </div>
              {paymentAlerts.length === 0 ? (
                <div className="db-empty-state">✅ All advances collected!</div>
              ) : (
                <div className="db-list">
                  {paymentAlerts.slice(0,8).map(item => (
                    <div key={String(item.leadId)} className="db-list-row" onClick={() => openLead(item.leadId)}>
                      <div className="db-list-dot" style={{background: item.isNotPaid ? "#ef4444" : "#f59e0b"}} />
                      <div className="db-list-info">
                        <div className="db-list-name">{item.name}</div>
                        <div className="db-list-sub">{item.business || item.repName || "—"} · {item.stage}</div>
                        <div className="db-pay-bar-wrap">
                          <div className="db-pay-bar-track">
                            <div className="db-pay-bar-fill" style={{width:`${item.advancePct||0}%`}} />
                          </div>
                          <span className="db-pay-pct">{item.advancePct||0}% paid</span>
                        </div>
                      </div>
                      <div className="db-list-right">
                        <div className="db-list-amt" style={{color: item.isNotPaid?"#ef4444":"#f59e0b"}}>
                          {fmtShort(item.isNotPaid ? item.totalValue : item.remaining)}
                        </div>
                        <ChevronRight size={13} color="#d1d5db" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT — Follow-ups + Branch + Projects */}
          <div className="db-col-right">

            {/* Today's Follow-ups */}
            <div className="db-card">
              <div className="db-card-head">
                <span className="db-card-title"><Flame size={14} color="#ef4444"/> Today's Follow-ups</span>
                {overdueCount > 0 && <span className="db-badge red">{overdueCount} overdue</span>}
              </div>
              {todayFollowups.length === 0 ? (
                <div className="db-empty-state">No follow-ups due today 🎉</div>
              ) : (
                <div className="db-list">
                  {todayFollowups.slice(0,6).map((item, i) => (
                    <div key={i} className="db-list-row" onClick={() => item.leadId && openLead(item.leadId)} style={{cursor:"pointer"}}>
                      <div className="db-list-dot" style={{background: String(item.priority).toLowerCase()==="hot" ? "#ef4444" : "#f59e0b"}} />
                      <div className="db-list-info">
                        <div className="db-list-name">{item.leadName}</div>
                        <div className="db-list-sub">{item.title} · Day {item.dayIndex||1}</div>
                      </div>
                      <span className="db-badge" style={{background: String(item.priority).toLowerCase()==="hot"?"#fef2f2":"#fffbeb", color: String(item.priority).toLowerCase()==="hot"?"#dc2626":"#b45309"}}>
                        {item.priority}
                      </span>
                    </div>
                  ))}
                  {todayFollowups.length > 6 && (
                    <button className="db-see-more" onClick={() => navigate("/todays-plan")}>
                      +{todayFollowups.length-6} more <ArrowRight size={12}/>
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Approval Watchlist */}
            {approvalWatch.length > 0 && (
              <div className="db-card">
                <div className="db-card-head">
                  <span className="db-card-title">⏳ Awaiting Approval</span>
                  <span className="db-badge orange">{approvalWatch.length}</span>
                </div>
                <div className="db-list">
                  {approvalWatch.slice(0,5).map(item => (
                    <div key={String(item.leadId)} className="db-list-row" onClick={() => openLead(item.leadId)}>
                      <div className="db-list-dot" style={{background: item.daysWaiting>=7?"#ef4444": item.daysWaiting>=3?"#f59e0b":"#10b981"}} />
                      <div className="db-list-info">
                        <div className="db-list-name">{item.name}</div>
                        <div className="db-list-sub">{item.business || "—"}</div>
                      </div>
                      <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:3}}>
                        <span className="db-badge" style={{background:"#fef2f2",color:"#dc2626"}}>{item.daysWaiting}d</span>
                        {item.phone && <a href={`tel:${item.phone}`} className="db-call-link" onClick={e=>e.stopPropagation()}><Phone size={11}/></a>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Branch Performance */}
            <div className="db-card">
              <div className="db-card-head">
                <span className="db-card-title"><Building2 size={14} color="#6366f1"/> Branch Performance</span>
              </div>
              {branchPerf.length === 0 ? (
                <div className="db-empty-state">No branch data</div>
              ) : (
                <div className="db-list" style={{gap:14}}>
                  {branchPerf.map((b,i) => (
                    <div key={i} style={{display:"flex",flexDirection:"column",gap:5,padding:"0 14px"}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <div>
                          <div style={{fontSize:13,fontWeight:700,color:"#111827"}}>{b.name}</div>
                          <div style={{fontSize:11,color:"#6b7280"}}>{b.leads} leads · {b.closed} closed</div>
                        </div>
                        <div style={{fontSize:14,fontWeight:800,color:"#6366f1"}}>{fmtShort(b.revenue)}</div>
                      </div>
                      <div style={{height:6,background:"#f1f5f9",borderRadius:99,overflow:"hidden"}}>
                        <div style={{height:"100%",width:`${b.rate||0}%`,background:"linear-gradient(90deg,#6366f1,#10b981)",borderRadius:99,transition:"width .4s"}} />
                      </div>
                      <div style={{fontSize:10,color:"#9ca3af",fontWeight:700}}>{b.rate||0}% close rate</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Project Status */}
            <div className="db-card">
              <div className="db-card-head">
                <span className="db-card-title">🚀 Project Status</span>
              </div>
              <div className="db-proj-grid">
                <ProjStat label="In Dev"    value={projectStats.inDevelopment||0}  color="#3b82f6" />
                <ProjStat label="Pending"   value={projectStats.pendingApproval||0} color="#f59e0b" />
                <ProjStat label="Overdue"   value={projectStats.overdue||0}         color="#ef4444" />
                <ProjStat label="Completed" value={projectStats.completed||0}       color="#10b981" />
              </div>
            </div>

          </div>
        </div>

        </div>{/* end db-content */}
      </div>

      <LeadDrawer open={drawerOpen} leadId={drawerId} apiBase={API_BASE}
        onClose={() => { setDrawerOpen(false); setDrawerId(null); }}
        onLeadUpdated={() => fetchDash(true)}
      />

      {/* Target Modal */}
      {tModal && (
        <div className="db-overlay" onClick={() => setTModal(false)}>
          <div className="db-modal" onClick={e => e.stopPropagation()}>
            <div className="db-modal-head">
              <div>
                <div style={{fontSize:15,fontWeight:800,color:"#111827",display:"flex",gap:8,alignItems:"center"}}><Target size={15} color="#6366f1"/> Monthly Target</div>
                <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>{monthStr}</div>
              </div>
              <button className="db-modal-close" onClick={() => setTModal(false)}><X size={16}/></button>
            </div>
            <div className="db-modal-body">
              <label>Deals to Close</label>
              <input type="number" placeholder="e.g. 10" value={tForm.targetDeals} onChange={e=>setTForm(f=>({...f,targetDeals:e.target.value}))} />
              <label>Revenue Target (₹)</label>
              <input type="number" placeholder="e.g. 500000" value={tForm.targetRevenue} onChange={e=>setTForm(f=>({...f,targetRevenue:e.target.value}))} />
              <label>Notes (optional)</label>
              <input type="text" placeholder="e.g. Q2 push" value={tForm.notes} onChange={e=>setTForm(f=>({...f,notes:e.target.value}))} />
            </div>
            <div className="db-modal-foot">
              <button className="db-btn-cancel" onClick={() => setTModal(false)}>Cancel</button>
              <button className="db-btn-save" onClick={saveTarget} disabled={tSaving}><Check size={13}/> {tSaving?"Saving…":"Save Target"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ── */
function KpiCard({ icon, label, value, color, onClick, loading }) {
  return (
    <button className={`db-kpi-card db-kpi-${color}`} onClick={onClick}>
      <div className="db-kpi-icon">{icon}</div>
      <div className="db-kpi-val">{loading ? "—" : value}</div>
      <div className="db-kpi-label">{label}</div>
    </button>
  );
}

function SalesMini({ label, value, icon, color, loading }) {
  return (
    <div className="db-sales-mini-card" style={{"--c": color}}>
      <div className="db-sm-icon">{icon}</div>
      <div className="db-sm-val" style={{color}}>{loading ? "—" : value}</div>
      <div className="db-sm-label">{label}</div>
    </div>
  );
}

function TargetBar({ label, current, target, pct, color, suffix }) {
  return (
    <div className="db-tbar">
      <div className="db-tbar-top">
        <span className="db-tbar-label">{label} — {monthStr}</span>
        <span className="db-tbar-val">{current}{suffix ? ` ${suffix}` : ""} / {target}{suffix ? ` ${suffix}` : ""} <span style={{color, fontWeight:800}}>({pct}%)</span></span>
      </div>
      <div className="db-tbar-track">
        <div className="db-tbar-fill" style={{width:`${pct}%`, background: color}} />
        {pct >= 100 && <div className="db-tbar-done">🎉 Done!</div>}
      </div>
    </div>
  );
}

function ProjStat({ label, value, color }) {
  return (
    <div className="db-proj-stat">
      <div className="db-proj-val" style={{color}}>{value}</div>
      <div className="db-proj-label">{label}</div>
    </div>
  );
}
