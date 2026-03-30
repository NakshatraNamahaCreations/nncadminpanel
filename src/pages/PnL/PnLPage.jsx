import { useCallback, useEffect, useMemo, useState } from "react";
import {
  TrendingUp, TrendingDown, ChevronLeft, ChevronRight, RefreshCcw,
  Target, Zap, ArrowUpRight, ArrowDownRight, AlertTriangle,
  CheckCircle2, Building2, Users, Activity, Flame,
  BarChart2, PieChart, X, Check,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import { toast } from "../../utils/toast";
import "./PnLPage.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";
function auth() { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; }

const MONTH_NAMES  = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT  = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const EXP_CATS = [
  { key: "rent",        label: "Rent",        color: "#3b82f6", bg: "#dbeafe" },
  { key: "salary",      label: "Salaries",    color: "#8b5cf6", bg: "#ede9fe" },
  { key: "electricity", label: "Electricity", color: "#f59e0b", bg: "#fef3c7" },
  { key: "internet",    label: "Internet",    color: "#06b6d4", bg: "#cffafe" },
  { key: "maintenance", label: "Maintenance", color: "#ef4444", bg: "#fee2e2" },
  { key: "other",       label: "Other",       color: "#64748b", bg: "#f1f5f9" },
];

const cr = (n) => {
  const v = Math.abs(Number(n || 0));
  const s = Number(n) < 0 ? "−" : "";
  if (v >= 10000000) return `${s}₹${(v / 10000000).toFixed(2)} Cr`;
  if (v >= 100000)   return `${s}₹${(v / 100000).toFixed(2)} L`;
  if (v >= 1000)     return `${s}₹${(v / 1000).toFixed(1)}K`;
  return `${s}₹${v.toLocaleString("en-IN")}`;
};

const full = (n) =>
  new Intl.NumberFormat("en-IN", { style:"currency", currency:"INR", maximumFractionDigits:0 }).format(Number(n||0));

/* SVG Circular progress */
function CircleGauge({ pct = 0, size = 140, stroke = 12, color = "#10b981", bg = "#e2e8f0", children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:"rotate(-90deg)", flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={bg}  strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:"stroke-dasharray .6s ease" }}/>
      <foreignObject x={stroke/2} y={stroke/2} width={size-stroke} height={size-stroke}>
        <div style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
          transform:"rotate(90deg)" }}>
          {children}
        </div>
      </foreignObject>
    </svg>
  );
}

const PACE_CONFIG = {
  ahead:     { label:"Ahead of Target",  color:"#10b981", bg:"#d1fae5", icon:CheckCircle2 },
  on_track:  { label:"On Track",         color:"#f59e0b", bg:"#fef3c7", icon:Activity      },
  behind:    { label:"Behind Target",    color:"#dc2626", bg:"#fee2e2", icon:AlertTriangle  },
  no_target: { label:"No Target Set",    color:"#64748b", bg:"#f1f5f9", icon:Target        },
};

export default function PnLPage() {
  const now = new Date();
  const [navYear,  setNavYear]  = useState(now.getFullYear());
  const [navMonth, setNavMonth] = useState(now.getMonth() + 1);
  const [db,       setDb]       = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [view,     setView]     = useState("monthly"); // monthly | daily | yearly for breakdown
  const [bdData,   setBdData]   = useState(null);
  const [bdLoading,setBdLoading]= useState(false);
  /* target edit modal */
  const [targetModal, setTargetModal] = useState(false);
  const [targetInput, setTargetInput] = useState("");
  const [targetSaving,setTargetSaving]= useState(false);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API_BASE}/api/pnl/dashboard?year=${navYear}&month=${navMonth}`, { headers: auth() });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      setDb(json.data);
    } catch (e) { toast.error(e.message || "Failed to load P&L"); }
    finally { setLoading(false); }
  }, [navYear, navMonth]);

  const fetchBreakdown = useCallback(async () => {
    setBdLoading(true);
    try {
      let url = `${API_BASE}/api/pnl?view=${view}&year=${navYear}`;
      if (view === "daily") url += `&month=${navMonth}`;
      const res  = await fetch(url, { headers: auth() });
      const json = await res.json();
      if (json.success) setBdData(json.data);
    } catch (_) {}
    finally { setBdLoading(false); }
  }, [view, navYear, navMonth]);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  useEffect(() => { fetchBreakdown(); }, [fetchBreakdown]);

  const prevMonth = () => {
    if (navMonth === 1) { setNavMonth(12); setNavYear(y=>y-1); }
    else setNavMonth(m=>m-1);
  };
  const nextMonth = () => {
    if (navMonth === 12) { setNavMonth(1); setNavYear(y=>y+1); }
    else setNavMonth(m=>m+1);
  };

  const saveTarget = async () => {
    setTargetSaving(true);
    try {
      const res  = await fetch(`${API_BASE}/api/dashboard/target`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({ year: navYear, month: navMonth, targetRevenue: Number(targetInput) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message);
      toast.success("Target saved!");
      setTargetModal(false);
      fetchDashboard();
    } catch (e) { toast.error(e.message); }
    finally { setTargetSaving(false); }
  };

  const d = db || {};
  const trend    = d.trend      || [];
  const dailyPace= d.dailyPace  || [];
  const topClients = d.topClients || [];
  const expByCat = d.expByCat   || {};

  const isProfit = (d.pnl || 0) >= 0;
  const pace = PACE_CONFIG[d.paceStatus || "no_target"];
  const PaceIcon = pace.icon;

  /* chart scales */
  const trendMax = useMemo(() =>
    Math.max(1, ...trend.map(t => Math.max(t.revenue, t.expenses))), [trend]);
  const dailyMax = useMemo(() =>
    Math.max(1, ...dailyPace.map(t => Math.max(t.cumRevenue, t.targetLine || 0))), [dailyPace]);

  const breakdown = bdData?.breakdown || [];
  const bdTotals  = bdData?.totals    || {};
  const bdMax = useMemo(() =>
    Math.max(1, ...breakdown.map(b => Math.max(b.revenue, b.expenses))), [breakdown]);

  return (
    <div className="pnl-layout">
      <Sidebar/>
      <div className="pnl-main">

        {/* ── Hero ── */}
        <div className="pnl-hero">
          <div className="pnl-hero-left">
            <div className="pnl-hero-eyebrow">Finance Intelligence</div>
            <h1 className="pnl-hero-title">Profit &amp; Loss</h1>
            <div className="pnl-hero-period">
              <button type="button" className="pnl-arr" onClick={prevMonth}><ChevronLeft size={14}/></button>
              <span>{MONTH_NAMES[navMonth-1]} {navYear}</span>
              <button type="button" className="pnl-arr" onClick={nextMonth}><ChevronRight size={14}/></button>
            </div>
          </div>
          <div className="pnl-hero-right">
            <button type="button" className="pnl-target-hero-btn"
              onClick={() => { setTargetInput(d.monthlyTarget || ""); setTargetModal(true); }}>
              <Target size={13}/> {d.monthlyTarget > 0 ? `Target: ${cr(d.monthlyTarget)}` : "Set Monthly Target"}
            </button>
            <button type="button" className="pnl-refresh-btn" onClick={() => { fetchDashboard(); fetchBreakdown(); }}>
              <RefreshCcw size={13} className={loading ? "pnl-spin" : ""}/>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="pnl-loading"><div className="pnl-loader"/>Loading intelligence…</div>
        ) : (
          <div className="pnl-body">

            {/* ═══════════════════════════════════════════════
                ROW 1 — Target tracker + KPIs
            ═══════════════════════════════════════════════ */}
            <div className="pnl-row1">

              {/* Target tracker card */}
              <div className="pnl-target-card">
                <div className="pnl-target-top">
                  <div>
                    <div className="pnl-card-eyebrow">Monthly Revenue Target</div>
                    <div className="pnl-target-goal">
                      {d.monthlyTarget > 0 ? cr(d.monthlyTarget) : "No target set"}
                    </div>
                  </div>
                  <div className={`pnl-pace-badge`} style={{ background: pace.bg, color: pace.color }}>
                    <PaceIcon size={11}/>
                    {pace.label}
                  </div>
                </div>

                <div className="pnl-target-main">
                  <CircleGauge
                    pct={d.targetProgress || 0}
                    size={148}
                    stroke={14}
                    color={d.targetProgress >= 100 ? "#10b981" : d.targetProgress >= 70 ? "#f59e0b" : "#ef4444"}
                    bg="#e2e8f0"
                  >
                    <div style={{ textAlign:"center" }}>
                      <div className="pnl-gauge-pct">{d.targetProgress || 0}%</div>
                      <div className="pnl-gauge-sub">achieved</div>
                    </div>
                  </CircleGauge>

                  <div className="pnl-target-stats">
                    <div className="pnl-ts-row">
                      <span className="pnl-ts-label">Collected</span>
                      <span className="pnl-ts-val green">{cr(d.revenue)}</span>
                    </div>
                    <div className="pnl-ts-row">
                      <span className="pnl-ts-label">Remaining</span>
                      <span className="pnl-ts-val red">{d.monthlyTarget > 0 ? cr(Math.max(0, d.monthlyTarget - d.revenue)) : "—"}</span>
                    </div>
                    <div className="pnl-ts-divider"/>
                    <div className="pnl-ts-row">
                      <span className="pnl-ts-label">Days elapsed</span>
                      <span className="pnl-ts-val">{d.daysElapsed} / {d.daysInMonth}</span>
                    </div>
                    <div className="pnl-ts-row">
                      <span className="pnl-ts-label">Daily run rate</span>
                      <span className="pnl-ts-val">{cr(d.dailyRunRate)}/day</span>
                    </div>
                    <div className="pnl-ts-row">
                      <span className="pnl-ts-label">Need daily</span>
                      <span className={`pnl-ts-val ${d.requiredDailyRate > d.dailyRunRate ? "red" : "green"}`}>
                        {d.requiredDailyRate > 0 ? `${cr(d.requiredDailyRate)}/day` : "—"}
                      </span>
                    </div>
                    <div className="pnl-ts-divider"/>
                    <div className="pnl-ts-row">
                      <span className="pnl-ts-label">Projected EOMonth</span>
                      <span className={`pnl-ts-val bold ${d.projectedRevenue >= (d.monthlyTarget||0) ? "green" : "red"}`}>
                        {cr(d.projectedRevenue)}
                      </span>
                    </div>
                    {d.paceGap !== 0 && d.monthlyTarget > 0 && (
                      <div className="pnl-pace-gap" style={{ color: d.paceGap >= 0 ? "#10b981" : "#dc2626" }}>
                        {d.paceGap >= 0 ? "▲" : "▼"} {cr(Math.abs(d.paceGap))} {d.paceGap >= 0 ? "ahead" : "behind"} pace
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress bar */}
                <div className="pnl-target-bar-wrap">
                  <div className="pnl-target-bar-bg">
                    <div
                      className="pnl-target-bar-fill"
                      style={{
                        width: `${d.targetProgress || 0}%`,
                        background: d.targetProgress >= 100 ? "#10b981" : d.targetProgress >= 70 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                    {/* Today marker */}
                    {d.monthlyTarget > 0 && (
                      <div
                        className="pnl-target-bar-today"
                        style={{ left: `${Math.round((d.daysElapsed / d.daysInMonth) * 100)}%` }}
                        title="Today"
                      />
                    )}
                  </div>
                  <div className="pnl-target-bar-labels">
                    <span>₹0</span>
                    {d.monthlyTarget > 0 && <span>{cr(d.monthlyTarget)}</span>}
                  </div>
                </div>
              </div>

              {/* KPI column */}
              <div className="pnl-kpi-col">
                <div className="pnl-kpi-card revenue">
                  <div className="pnl-kpi-icon-wrap"><TrendingUp size={18}/></div>
                  <div>
                    <div className="pnl-kpi-val">{cr(d.revenue)}</div>
                    <div className="pnl-kpi-lbl">Revenue Collected</div>
                    {d.momRevGrowth !== null && (
                      <div className={`pnl-mom ${d.momRevGrowth >= 0 ? "up" : "dn"}`}>
                        {d.momRevGrowth >= 0 ? "▲" : "▼"} {Math.abs(d.momRevGrowth)}% vs last month
                      </div>
                    )}
                  </div>
                </div>

                <div className="pnl-kpi-card expenses">
                  <div className="pnl-kpi-icon-wrap"><TrendingDown size={18}/></div>
                  <div>
                    <div className="pnl-kpi-val">{cr(d.expenses)}</div>
                    <div className="pnl-kpi-lbl">Total Expenses</div>
                    {d.momExpChange !== null && (
                      <div className={`pnl-mom ${d.momExpChange <= 0 ? "up" : "dn"}`}>
                        {d.momExpChange >= 0 ? "▲" : "▼"} {Math.abs(d.momExpChange)}% vs last month
                      </div>
                    )}
                  </div>
                </div>

                <div className={`pnl-kpi-card pnl-net ${isProfit ? "profit" : "loss"}`}>
                  <div className="pnl-kpi-icon-wrap">
                    {isProfit ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                  </div>
                  <div>
                    <div className="pnl-kpi-val">{cr(Math.abs(d.pnl))}</div>
                    <div className="pnl-kpi-lbl">Net {isProfit ? "Profit" : "Loss"}</div>
                    <div className="pnl-kpi-margin">{isProfit ? "+" : ""}{d.profitMargin}% margin</div>
                  </div>
                </div>

                <div className="pnl-kpi-card burn">
                  <div className="pnl-kpi-icon-wrap"><Flame size={18}/></div>
                  <div>
                    <div className="pnl-kpi-val">{cr(d.burnRate)}/mo</div>
                    <div className="pnl-kpi-lbl">Burn Rate</div>
                    <div className="pnl-kpi-sub-txt">
                      {d.runway === "∞" ? "∞ runway" : `~${d.runway}x revenue covers it`}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                ROW 2 — Pulse metrics bar
            ═══════════════════════════════════════════════ */}
            <div className="pnl-pulse-row">
              {[
                { label:"Daily Velocity", val: cr(d.dailyRunRate), sub:"avg revenue/day", color:"#2563eb" },
                { label:"Projected Month", val: cr(d.projectedRevenue), sub:"at current pace", color: d.projectedRevenue >= (d.monthlyTarget||0) ? "#10b981" : "#ef4444" },
                { label:"Pipeline Value", val: cr(d.pipelineValue), sub:`${d.pipelineCount || 0} open deals`, color:"#7c3aed" },
                { label:"Expense Ratio", val: d.revenue > 0 ? `${Math.round((d.expenses/d.revenue)*100)}%` : "—", sub:"expenses / revenue", color: (d.expenses/d.revenue) > 0.7 ? "#ef4444" : "#f59e0b" },
                { label:"Days Remaining", val: d.daysRemaining, sub:`of ${d.daysInMonth} days`, color:"#0891b2" },
              ].map(m => (
                <div key={m.label} className="pnl-pulse-item">
                  <div className="pnl-pulse-val" style={{ color: m.color }}>{m.val}</div>
                  <div className="pnl-pulse-label">{m.label}</div>
                  <div className="pnl-pulse-sub">{m.sub}</div>
                </div>
              ))}
            </div>

            {/* ═══════════════════════════════════════════════
                ROW 3 — 6-month trend chart + Expense breakdown
            ═══════════════════════════════════════════════ */}
            <div className="pnl-row3">
              {/* 6-month trend */}
              <div className="pnl-card pnl-trend-card">
                <div className="pnl-card-head">
                  <BarChart2 size={14} color="#3b82f6"/>
                  <span>6-Month Revenue vs Expenses</span>
                </div>
                <div className="pnl-trend-legend">
                  <span><span className="pnl-dot blue"/>Revenue</span>
                  <span><span className="pnl-dot red"/>Expenses</span>
                  <span><span className="pnl-dot green"/>Profit</span>
                  <span><span className="pnl-dot redx"/>Loss</span>
                </div>
                <div className="pnl-trend-chart">
                  {trend.map((t, i) => {
                    const revH = trendMax > 0 ? (t.revenue  / trendMax) * 100 : 0;
                    const expH = trendMax > 0 ? (t.expenses / trendMax) * 100 : 0;
                    const pos  = t.pnl >= 0;
                    const isCur = i === trend.length - 1;
                    return (
                      <div key={t.label} className={`pnl-trend-col${isCur ? " current" : ""}`}>
                        <div className="pnl-trend-pnl" style={{ color: pos ? "#10b981" : "#dc2626", fontSize:9, fontWeight:800, textAlign:"center", marginBottom:2 }}>
                          {t.revenue > 0 || t.expenses > 0 ? (pos ? "+" : "−") + cr(Math.abs(t.pnl)) : ""}
                        </div>
                        <div className="pnl-trend-bars">
                          <div className="pnl-trend-bar rev" style={{ height:`${Math.max(revH,revH>0?3:0)}%` }} title={`Revenue: ${full(t.revenue)}`}/>
                          <div className="pnl-trend-bar exp" style={{ height:`${Math.max(expH,expH>0?3:0)}%` }} title={`Expenses: ${full(t.expenses)}`}/>
                        </div>
                        <div className="pnl-trend-label">{t.label}</div>
                        <div className={`pnl-trend-dot ${pos ? "profit":"loss"}`}/>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Expense breakdown */}
              <div className="pnl-card pnl-exp-card">
                <div className="pnl-card-head">
                  <PieChart size={14} color="#7c3aed"/>
                  <span>Expense Breakdown</span>
                  <span className="pnl-card-sub-val">{cr(d.expenses)} total</span>
                </div>
                <div className="pnl-exp-list">
                  {EXP_CATS.map(cat => {
                    const amt = expByCat[cat.key] || 0;
                    const pct = d.expenses > 0 ? Math.round((amt / d.expenses) * 100) : 0;
                    if (!amt) return null;
                    return (
                      <div key={cat.key} className="pnl-exp-row">
                        <div className="pnl-exp-dot" style={{ background: cat.color }}/>
                        <div className="pnl-exp-name">{cat.label}</div>
                        <div className="pnl-exp-bar-wrap">
                          <div className="pnl-exp-bar" style={{ width:`${pct}%`, background: cat.color }}/>
                        </div>
                        <div className="pnl-exp-pct">{pct}%</div>
                        <div className="pnl-exp-amt">{cr(amt)}</div>
                      </div>
                    );
                  })}
                  {d.expenses === 0 && <div className="pnl-empty-msg">No expenses recorded</div>}
                </div>
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                ROW 4 — Daily pace chart + Top clients
            ═══════════════════════════════════════════════ */}
            <div className="pnl-row4">
              {/* Daily cumulative pace */}
              <div className="pnl-card pnl-pace-card">
                <div className="pnl-card-head">
                  <Activity size={14} color="#059669"/>
                  <span>Revenue Pace — Day by Day</span>
                  <span className="pnl-card-sub-val">{MONTH_NAMES[navMonth-1]} {navYear}</span>
                </div>
                {dailyPace.length === 0 ? (
                  <div className="pnl-empty-msg">No collections recorded this month</div>
                ) : (
                  <div className="pnl-pace-wrap">
                    <div className="pnl-pace-chart">
                      {dailyPace.map((dp) => {
                        const cumH   = (dp.cumRevenue / dailyMax) * 100;
                        const tgtH   = d.monthlyTarget > 0 ? (dp.targetLine / Math.max(dailyMax, d.monthlyTarget)) * 100 : 0;
                        const dayRev = dp.revenue;
                        return (
                          <div key={dp.day} className="pnl-pace-col" title={`Day ${dp.day}: ${full(dp.cumRevenue)} cumulative`}>
                            <div className="pnl-pace-bars">
                              {d.monthlyTarget > 0 && (
                                <div className="pnl-pace-target-line" style={{ bottom:`${tgtH}%` }}/>
                              )}
                              <div
                                className={`pnl-pace-bar${dayRev > 0 ? " active" : ""}`}
                                style={{ height:`${Math.max(cumH, cumH > 0 ? 2 : 0)}%` }}
                              />
                            </div>
                            {dp.day % 5 === 0 || dp.day === 1 ? (
                              <div className="pnl-pace-day">{dp.day}</div>
                            ) : <div className="pnl-pace-day"/>}
                          </div>
                        );
                      })}
                    </div>
                    {d.monthlyTarget > 0 && (
                      <div className="pnl-pace-legend">
                        <span><span className="pnl-dot blue"/>Cumulative revenue</span>
                        <span><span className="pnl-dot dashed"/>Target pace line</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Top revenue clients */}
              <div className="pnl-card pnl-clients-card">
                <div className="pnl-card-head">
                  <Users size={14} color="#7c3aed"/>
                  <span>Top Revenue Contributors</span>
                  <span className="pnl-card-sub-val">{MONTH_NAMES[navMonth-1]}</span>
                </div>
                {topClients.length === 0 ? (
                  <div className="pnl-empty-msg">No payments collected this month</div>
                ) : (
                  <div className="pnl-clients-list">
                    {topClients.map((c, i) => {
                      const pct = d.revenue > 0 ? Math.round((c.amount / d.revenue) * 100) : 0;
                      return (
                        <div key={i} className="pnl-client-row">
                          <div className="pnl-client-rank">#{i+1}</div>
                          <div className="pnl-client-info">
                            <div className="pnl-client-name">{c.name}</div>
                            <div className="pnl-client-meta">
                              {c.business && <span>{c.business}</span>}
                              {c.branch   && <span>· {c.branch}</span>}
                            </div>
                            <div className="pnl-client-bar-wrap">
                              <div className="pnl-client-bar" style={{ width:`${pct}%` }}/>
                            </div>
                          </div>
                          <div className="pnl-client-amt">
                            <div>{cr(c.amount)}</div>
                            <div className="pnl-client-pct">{pct}%</div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* ═══════════════════════════════════════════════
                ROW 5 — Breakdown table (Daily / Monthly / Yearly)
            ═══════════════════════════════════════════════ */}
            <div className="pnl-card pnl-bd-section">
              <div className="pnl-bd-head">
                <div className="pnl-card-head" style={{ marginBottom:0 }}>
                  <BarChart2 size={14} color="#64748b"/>
                  <span>Detailed Breakdown</span>
                </div>
                <div className="pnl-bd-tabs">
                  {["daily","monthly","yearly"].map(v => (
                    <button key={v} type="button"
                      className={`pnl-bd-tab${view===v?" active":""}`}
                      onClick={() => setView(v)}>
                      {v.charAt(0).toUpperCase()+v.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              {bdLoading ? (
                <div className="pnl-loading" style={{ padding:32 }}><div className="pnl-loader"/>Loading…</div>
              ) : (
                <div className="pnl-bd-table-wrap">
                  <table className="pnl-bd-table">
                    <thead>
                      <tr>
                        <th>{view==="daily"?"Day":view==="monthly"?"Month":"Year"}</th>
                        <th>Revenue</th>
                        <th>Expenses</th>
                        <th>Rent</th>
                        <th>Salaries</th>
                        <th>Utilities</th>
                        <th>Net P&amp;L</th>
                        <th>Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {breakdown.map(b => {
                        const pos = b.pnl >= 0;
                        const hasData = b.revenue > 0 || b.expenses > 0;
                        const utilities = (b.expByCat?.electricity||0)+(b.expByCat?.internet||0)+(b.expByCat?.maintenance||0);
                        return (
                          <tr key={b.key} className={!hasData?"pnl-empty-row":""}>
                            <td className="pnl-td-period">{view==="monthly" ? MONTH_NAMES[b.key-1] : b.label}</td>
                            <td className="pnl-td-rev">{b.revenue>0?full(b.revenue):"—"}</td>
                            <td className="pnl-td-exp">{b.expenses>0?full(b.expenses):"—"}</td>
                            <td className="pnl-td-sm">{b.expByCat?.rent>0?cr(b.expByCat.rent):"—"}</td>
                            <td className="pnl-td-sm">{b.expByCat?.salary>0?cr(b.expByCat.salary):"—"}</td>
                            <td className="pnl-td-sm">{utilities>0?cr(utilities):"—"}</td>
                            <td>{hasData?<span className={`pnl-td-pnl ${pos?"profit":"loss"}`}>{pos?"+":"−"}{full(Math.abs(b.pnl))}</span>:"—"}</td>
                            <td>{hasData?<span className={`pnl-pill ${pos?"profit":"loss"}`}>{pos?"+":""}{b.margin}%</span>:"—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                    {bdTotals.revenue > 0 || bdTotals.expenses > 0 ? (
                      <tfoot>
                        <tr>
                          <td>Total</td>
                          <td className="pnl-td-rev">{full(bdTotals.revenue||0)}</td>
                          <td className="pnl-td-exp">{full(bdTotals.expenses||0)}</td>
                          <td className="pnl-td-sm">{cr(bdTotals.expByCat?.rent||0)}</td>
                          <td className="pnl-td-sm">{cr(bdTotals.expByCat?.salary||0)}</td>
                          <td className="pnl-td-sm">{cr((bdTotals.expByCat?.electricity||0)+(bdTotals.expByCat?.internet||0)+(bdTotals.expByCat?.maintenance||0))}</td>
                          <td><span className={`pnl-td-pnl ${bdTotals.pnl>=0?"profit":"loss"}`}>{bdTotals.pnl>=0?"+":"−"}{full(Math.abs(bdTotals.pnl||0))}</span></td>
                          <td><span className={`pnl-pill ${bdTotals.margin>=0?"profit":"loss"}`}>{bdTotals.margin>=0?"+":""}{bdTotals.margin||0}%</span></td>
                        </tr>
                      </tfoot>
                    ) : null}
                  </table>
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* ── Target Modal ── */}
      {targetModal && (
        <div className="pnl-overlay" onClick={() => setTargetModal(false)}>
          <div className="pnl-modal" onClick={e => e.stopPropagation()}>
            <div className="pnl-modal-head">
              <div>
                <div className="pnl-modal-title"><Target size={16} color="#059669"/> Monthly Revenue Target</div>
                <div className="pnl-modal-sub">{MONTH_NAMES[navMonth-1]} {navYear}</div>
              </div>
              <button type="button" className="pnl-modal-close" onClick={() => setTargetModal(false)}><X size={15}/></button>
            </div>
            <div className="pnl-modal-body">
              <label className="pnl-modal-label">Target Revenue (₹)</label>
              <input
                type="number"
                className="pnl-modal-input"
                placeholder="e.g. 5,00,00,000 for ₹5 Crore"
                value={targetInput}
                onChange={e => setTargetInput(e.target.value)}
                autoFocus
              />
              <div className="pnl-modal-hint">
                {targetInput > 0 && `= ${cr(targetInput)}`}
              </div>
              <div className="pnl-quick-targets">
                {[5000000, 10000000, 25000000, 50000000].map(v => (
                  <button key={v} type="button" className={`pnl-quick-btn${Number(targetInput)===v?" active":""}`}
                    onClick={() => setTargetInput(v)}>
                    {cr(v)}
                  </button>
                ))}
              </div>
            </div>
            <div className="pnl-modal-foot">
              <button type="button" className="pnl-modal-cancel" onClick={() => setTargetModal(false)}>Cancel</button>
              <button type="button" className="pnl-modal-save" onClick={saveTarget} disabled={targetSaving||!targetInput}>
                <Check size={13}/> {targetSaving ? "Saving…" : "Set Target"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
