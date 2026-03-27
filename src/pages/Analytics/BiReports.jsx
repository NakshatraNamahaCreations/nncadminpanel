import { useCallback, useEffect, useState } from "react";
import {
  Shield, AlertTriangle, TrendingUp, Receipt, DollarSign,
  Target, Settings, Save, X, ChevronRight, RefreshCcw,
  Info, ArrowUp, ArrowDown, Minus, Zap, Send, Mail,
} from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, AreaChart, Area, LineChart, Line,
  ComposedChart, ReferenceLine, Cell, PieChart, Pie,
} from "recharts";
import Sidebar from "../../components/Sidebar/Sidebar";
import { ShimmerKpiGrid, ShimmerTable } from "../../components/ui/Shimmer";
import "./BiReports.css";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
function auth() { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; }

// ── Formatters ────────────────────────────────────────────────────────────────
function fmtINR(n) {
  const v = Number(n) || 0;
  if (v >= 10000000) return `₹${(v / 10000000).toFixed(1)}Cr`;
  if (v >= 100000)   return `₹${(v / 100000).toFixed(1)}L`;
  if (v >= 1000)     return `₹${(v / 1000).toFixed(1)}K`;
  return `₹${v.toLocaleString("en-IN")}`;
}
function fmtFull(n) { return `₹${(Number(n) || 0).toLocaleString("en-IN")}`; }
function pctColor(v) { return v >= 80 ? "g" : v >= 50 ? "a" : "r"; }
function sign(v) { return v > 0 ? "+" : ""; }

// ── Palette ───────────────────────────────────────────────────────────────────
const C = {
  blue:"#2563eb", green:"#16a34a", amber:"#d97706",
  red:"#dc2626",  purple:"#7c3aed", teal:"#0d9488",
  slate:"#475569", indigo:"#4f46e5",
};

// ── Custom Recharts Tooltip ───────────────────────────────────────────────────
function CT({ active, payload, label, currency }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bi-ct">
      <div className="bi-ct-label">{label}</div>
      {payload.map((p, i) => p.value != null && (
        <div key={i} className="bi-ct-row">
          <span className="bi-ct-dot" style={{ background: p.color }} />
          <span className="bi-ct-name">{p.name}</span>
          <strong className="bi-ct-val">
            {currency || p.name?.startsWith("₹") ? fmtFull(p.value) : p.value?.toLocaleString("en-IN")}
          </strong>
        </div>
      ))}
    </div>
  );
}

// ── Trend badge ───────────────────────────────────────────────────────────────
function Trend({ v }) {
  if (v == null) return <span className="bi-trend neutral"><Minus size={12}/> —</span>;
  const cls = v > 0 ? "up" : v < 0 ? "down" : "neutral";
  const Icon = v > 0 ? ArrowUp : v < 0 ? ArrowDown : Minus;
  return <span className={`bi-trend ${cls}`}><Icon size={12}/> {Math.abs(v)}%</span>;
}

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = { funded:"funded", partial:"partial", critical:"critical", underfunded:"critical" };
  const labelMap = { funded:"Funded", partial:"Partial", critical:"Critical", underfunded:"Underfunded" };
  return <span className={`bi-fund-status ${map[status]||"partial"}`}>{labelMap[status]||status}</span>;
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, trend, color = "blue", icon: Icon }) {
  return (
    <div className={`bi-kpi bi-kpi-${color}`}>
      <div className="bi-kpi-top">
        <span className="bi-kpi-label">{label}</span>
        {Icon && <Icon size={16} />}
      </div>
      <div className="bi-kpi-value">{value}</div>
      <div className="bi-kpi-sub">
        {sub}
        {trend != null && <Trend v={trend} />}
      </div>
    </div>
  );
}

// ── Income Statement row ──────────────────────────────────────────────────────
function ISRow({ label, amount, ytd, indent = 0, bold, green, red, borderTop }) {
  const cls = ["bi-is-row",
    bold ? "bi-is-bold" : "",
    green ? "bi-is-green" : "",
    red ? "bi-is-red" : "",
    borderTop ? "bi-is-btop" : "",
  ].filter(Boolean).join(" ");
  return (
    <div className={cls} style={{ paddingLeft: indent * 16 + 8 }}>
      <span className="bi-is-label">{label}</span>
      <span className="bi-is-val">{fmtFull(amount)}</span>
      <span className="bi-is-ytd">{fmtFull(ytd)}</span>
    </div>
  );
}

// ── Fund card ─────────────────────────────────────────────────────────────────
function FundCard({ fund }) {
  const iconMap = {
    shield: Shield, alert: AlertTriangle, receipt: Receipt, trending: TrendingUp,
  };
  const Icon = iconMap[fund.icon] || Shield;
  const pct = Math.min(100, fund.fundedPct);
  const barColor = fund.status === "funded" ? C.green : fund.status === "partial" ? C.amber : C.red;
  return (
    <div className="bi-fund-card">
      <div className="bi-fund-header">
        <div className="bi-fund-icon"><Icon size={20}/></div>
        <div className="bi-fund-meta">
          <div className="bi-fund-name">{fund.name}</div>
          <div className="bi-fund-desc">{fund.description}</div>
        </div>
        <StatusPill status={fund.status}/>
      </div>
      <div className="bi-fund-bar-wrap">
        <div className="bi-fund-bar" style={{ width: `${pct}%`, background: barColor }}/>
      </div>
      <div className="bi-fund-nums">
        <div>
          <div className="bi-fund-num-label">Current Balance</div>
          <div className="bi-fund-num">{fmtFull(fund.balance)}</div>
        </div>
        <div className="bi-fund-pct">{pct}%</div>
        <div style={{textAlign:"right"}}>
          <div className="bi-fund-num-label">Target</div>
          <div className="bi-fund-num">{fmtFull(fund.target)}</div>
        </div>
      </div>
      <div className="bi-fund-contrib">
        Monthly contribution needed: <strong>{fmtFull(fund.monthlyContrib)}</strong>
      </div>
      <div className="bi-fund-purpose"><Info size={12}/> {fund.purpose}</div>
    </div>
  );
}

// ── Config Modal ──────────────────────────────────────────────────────────────
function ConfigModal({ cfg, onClose, onSave }) {
  const [form, setForm] = useState({ ...cfg });
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      await fetch(`${API}/api/bi/config`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify(form),
      });
      onSave();
      onClose();
    } finally { setSaving(false); }
  }

  function field(key, label, min, max, step = 1, prefix = "") {
    return (
      <div className="bi-cfg-field">
        <label>{label}</label>
        <div className="bi-cfg-input-wrap">
          {prefix && <span className="bi-cfg-prefix">{prefix}</span>}
          <input type="number" min={min} max={max} step={step}
            value={form[key] ?? ""}
            onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
          />
        </div>
      </div>
    );
  }

  function fundField(key, label) {
    return (
      <div className="bi-cfg-field">
        <label>{label}</label>
        <div className="bi-cfg-input-wrap">
          <span className="bi-cfg-prefix">₹</span>
          <input type="number" min={0} step={1000}
            value={form[key] ?? ""}
            onChange={e => setForm(f => ({ ...f, [key]: Number(e.target.value) }))}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="bi-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bi-modal">
        <div className="bi-modal-header">
          <span>Financial Configuration</span>
          <button className="bi-modal-close" onClick={onClose}><X size={16}/></button>
        </div>
        <div className="bi-modal-body">
          <div className="bi-cfg-section">
            <div className="bi-cfg-section-title">Tax Settings</div>
            {field("taxRatePercent", "Income Tax Rate (%)", 0, 60, 1, "%")}
          </div>
          <div className="bi-cfg-section">
            <div className="bi-cfg-section-title">Reserve Fund Targets</div>
            {field("bufferMonths",   "Operating Buffer (months of opex)",  1,  12, 1, "×")}
            {field("emergencyPct",   "Emergency Fund (% of annual rev)",   0,  30, 1, "%")}
            {field("growthFundPct",  "Growth Fund (% of net profit)",      0,  50, 1, "%")}
          </div>
          <div className="bi-cfg-section">
            <div className="bi-cfg-section-title">Fund Current Balances</div>
            {fundField("bufferBalance",    "Operating Buffer Balance")}
            {fundField("emergencyBalance", "Emergency Fund Balance")}
            {fundField("taxReserveBalance","Tax Reserve Balance")}
            {fundField("growthBalance",    "Growth Fund Balance")}
          </div>
        </div>
        <div className="bi-modal-footer">
          <button className="bi-btn-cancel" onClick={onClose}>Cancel</button>
          <button className="bi-btn-save" onClick={save} disabled={saving}>
            <Save size={14}/> {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════════════════════════
const TABS = ["P&L Statement","Unit Economics","Reserve Funds","Scenario Planner","12-Month Trend"];

export default function Analytics() {
  const now = new Date();
  const [year,  setYear]  = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [tab,   setTab]   = useState(0);
  const [data,  setData]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [err,   setErr]   = useState("");
  const [cfgOpen, setCfgOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [reportMsg, setReportMsg] = useState("");

  const MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  const fetchAll = useCallback(async () => {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/api/bi/dashboard?year=${year}&month=${month}`, { headers: auth() });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      setData(j.data);
    } catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [year, month]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sendReport = useCallback(async () => {
    setSending(true); setReportMsg("");
    try {
      const r = await fetch(`${API}/api/bi/report/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth() },
        body: JSON.stringify({ to: "nn.creations7@gmail.com" }),
      });
      const j = await r.json();
      setReportMsg(j.success ? "Report sent!" : (j.message || "Failed"));
    } catch { setReportMsg("Failed to send"); }
    finally { setSending(false); setTimeout(() => setReportMsg(""), 4000); }
  }, []);

  if (loading) return (
    <div className="bi-page">
      <Sidebar/>
      <div className="bi-main" style={{ padding: "24px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <ShimmerKpiGrid count={4} cols={4} />
        <ShimmerKpiGrid count={4} cols={4} />
        <ShimmerTable rows={6} cells={5} />
      </div>
    </div>
  );
  if (err) return (
    <div className="bi-page">
      <Sidebar/>
      <div className="bi-main"><div className="bi-err">{err}</div></div>
    </div>
  );
  if (!data) return null;

  const { incomeStatement: IS, ytd, mom, target, unitEconomics: UE,
          orderBreakdown: OB, dealBuckets, funds, fundSummary,
          trendSeries, scenarios, pipelineValue, pipelineCount } = data;

  // ── Expense pie data ──────────────────────────────────────────────────────
  const expPieData = Object.entries(IS.expByCat)
    .filter(([,v]) => v > 0)
    .map(([k, v], i) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v,
      fill: [C.blue, C.purple, C.amber, C.green, C.red, C.teal][i % 6] }));

  // ── Project profit waterfall data ────────────────────────────────────────
  const waterfallData = [
    { name: "Project Revenue",  value: OB.avgDealRevenue,       fill: C.green },
    { name: "Service Costs",    value: -OB.fixedCostAllocation, fill: C.amber },
    { name: "Net Profit/Project", value: OB.netProfitPerDeal,   fill: OB.netProfitPerDeal >= 0 ? C.blue : C.red },
  ].filter(d => d.value !== 0);

  // ── Reserve allocation from each deal ─────────────────────────────────────
  const dealAllocData = [
    { name: "Buffer", value: OB.bufferAlloc,   fill: C.blue   },
    { name: "Emergency", value: OB.emergencyAlloc, fill: C.amber },
    { name: "Tax",    value: OB.taxAlloc,      fill: C.purple },
    { name: "Growth", value: OB.growthAlloc,   fill: C.green  },
  ].filter(d => d.value > 0);

  return (
    <div className="bi-page">
      <Sidebar/>
      <div className="bi-main">

        {/* ── Header ── */}
        <div className="bi-header">
          <div className="bi-header-left">
            <h1 className="bi-title">Business Intelligence</h1>
            <p className="bi-subtitle">Real P&amp;L · Unit Economics · Reserve Funds · Scenario Planning</p>
          </div>
          <div className="bi-header-right">
            <select className="bi-sel" value={month} onChange={e => setMonth(Number(e.target.value))}>
              {MN.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
            </select>
            <select className="bi-sel" value={year} onChange={e => setYear(Number(e.target.value))}>
              {[2023,2024,2025,2026].map(y => <option key={y}>{y}</option>)}
            </select>
            <button
              className="bi-report-btn"
              title="Send BI Report to nn.creations7@gmail.com"
              onClick={sendReport}
              disabled={sending}
            >
              {sending ? <RefreshCcw size={14} className="bi-spin"/> : <Send size={14}/>}
              {sending ? "Sending…" : "Send Report"}
            </button>
            {reportMsg && <span className={`bi-report-msg ${reportMsg === "Report sent!" ? "ok" : "err"}`}><Mail size={12}/> {reportMsg}</span>}
            <button className="bi-icon-btn" title="Configure" onClick={() => setCfgOpen(true)}><Settings size={16}/></button>
            <button className="bi-icon-btn" title="Refresh"   onClick={fetchAll}><RefreshCcw size={16}/></button>
          </div>
        </div>

        {/* ── Executive Summary Strip ── */}
        <div className="bi-exec-strip">
          <div className="bi-exec-pill">
            <span className="bi-exec-label">Revenue</span>
            <span className="bi-exec-val">{fmtINR(IS.revenue)}</span>
            <Trend v={mom.revPct}/>
          </div>
          <div className="bi-exec-sep"/>
          <div className="bi-exec-pill">
            <span className="bi-exec-label">Operating Profit</span>
            <span className="bi-exec-val" style={{color: IS.ebitda >= 0 ? C.green : C.red}}>{fmtINR(IS.ebitda)}</span>
            <span className="bi-exec-badge">{IS.netMarginPct}%</span>
          </div>
          <div className="bi-exec-sep"/>
          <div className="bi-exec-pill">
            <span className="bi-exec-label">EBITDA</span>
            <span className="bi-exec-val" style={{color: IS.ebitda >= 0 ? C.green : C.red}}>{fmtINR(IS.ebitda)}</span>
          </div>
          <div className="bi-exec-sep"/>
          <div className="bi-exec-pill">
            <span className="bi-exec-label">Net Profit</span>
            <span className="bi-exec-val" style={{color: IS.netProfit >= 0 ? C.green : C.red}}>{fmtINR(IS.netProfit)}</span>
            <span className="bi-exec-badge">{IS.netMarginPct}%</span>
          </div>
          <div className="bi-exec-sep"/>
          <div className="bi-exec-pill">
            <span className="bi-exec-label">Break-Even</span>
            <span className="bi-exec-val">{UE.breakEvenDeals} deals</span>
          </div>
          <div className="bi-exec-sep"/>
          <div className="bi-exec-pill">
            <span className="bi-exec-label">Deals Closed</span>
            <span className="bi-exec-val">{UE.closedCountMonth} this month</span>
          </div>
          <div className="bi-exec-sep"/>
          <div className={`bi-exec-pill bi-pace-${target.paceStatus}`}>
            <span className="bi-exec-label">vs Target</span>
            <span className="bi-exec-val">{target.targetAchieved}%</span>
            <span className="bi-exec-badge">{target.paceStatus === "on_track" ? "On Track" : target.paceStatus === "behind" ? "Behind" : "No Target"}</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="bi-tabs">
          {TABS.map((t, i) => (
            <button key={i} className={`bi-tab${tab === i ? " active" : ""}`} onClick={() => setTab(i)}>{t}</button>
          ))}
        </div>

        <div className="bi-body">

          {/* ══════════════════════════ TAB 0: P&L Statement ══════════════════════ */}
          {tab === 0 && (
            <div className="bi-tab-content">
              <div className="bi-row2">

                {/* Income Statement */}
                <div className="bi-card bi-is-card">
                  <div className="bi-card-h">
                    <span>Income Statement — {MN[month-1]} {year}</span>
                    <span className="bi-card-h-sub">YTD column = Jan–{MN[month-1]} {year}</span>
                  </div>
                  <div className="bi-is-header">
                    <span/>
                    <span>This Month</span>
                    <span>YTD</span>
                  </div>
                  <ISRow label="Revenue (Client Advances)"      amount={IS.revenue}       ytd={ytd.revenue}       bold />
                  <div className="bi-is-spacer"/>
                  <ISRow label="Service Operating Costs"        amount={-IS.opex}         ytd={-ytd.opex}         bold />
                  {Object.entries(IS.expByCat).filter(([,v])=>v>0).map(([k,v]) => {
                    const CAT_LABELS = {
                      salary:"Employee Salaries", rent:"Office Rent",
                      electricity:"Electricity", internet:"Internet / Software",
                      maintenance:"Maintenance", other:"Other Expenses",
                    };
                    return (
                      <ISRow key={k}
                        label={CAT_LABELS[k] || (k.charAt(0).toUpperCase()+k.slice(1))}
                        amount={-v} ytd={0} indent={1} />
                    );
                  })}
                  <ISRow label="Operating Profit (EBITDA)"      amount={IS.ebitda}        ytd={ytd.ebitda}        bold borderTop green={IS.ebitda>=0} red={IS.ebitda<0} />
                  <div className="bi-is-sub">Operating Margin: <strong>{IS.netMarginPct}%</strong></div>
                  <div className="bi-is-spacer"/>
                  <ISRow label={`Tax Provision (${data.config.taxRatePercent}%)`}
                                                               amount={-IS.taxProvision} ytd={-ytd.taxProvision} indent={1} />
                  <ISRow label="Net Profit"                    amount={IS.netProfit}     ytd={ytd.netProfit}     bold borderTop green={IS.netProfit>=0} red={IS.netProfit<0} />
                  <div className="bi-is-sub">Net Margin: <strong>{IS.netMarginPct}%</strong></div>
                </div>

                {/* Expense breakdown pie + KPIs */}
                <div className="bi-col-right">
                  <div className="bi-kpi-grid">
                    <KPI label="Gross Margin"   value={`${IS.grossMarginPct}%`}      color="green"  icon={TrendingUp} trend={null} sub="Revenue after direct costs"/>
                    <KPI label="Net Margin"     value={`${IS.netMarginPct}%`}        color={IS.netMarginPct>=10?"green":IS.netMarginPct>=0?"amber":"red"} icon={DollarSign} sub="After tax &amp; all costs"/>
                    <KPI label="vs Target"      value={`${target.targetAchieved}%`}  color={target.targetAchieved>=80?"green":target.targetAchieved>=50?"amber":"red"} icon={Target} sub={`${fmtFull(target.monthlyTarget)} target`}/>
                    <KPI label="Pipeline"       value={fmtINR(pipelineValue)}        color="indigo" icon={Zap} sub={`${pipelineCount} open deals`}/>
                  </div>

                  {expPieData.length > 0 && (
                    <div className="bi-card" style={{marginTop:16}}>
                      <div className="bi-card-h"><span>Expense Breakdown</span></div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={expPieData} dataKey="value" nameKey="name"
                            cx="50%" cy="50%" outerRadius={75} paddingAngle={3}>
                            {expPieData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
                          </Pie>
                          <Tooltip formatter={v => fmtFull(v)}/>
                          <Legend wrapperStyle={{fontSize:11}}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="bi-exp-total">
                        Total OpEx: <strong>{fmtFull(IS.opex)}</strong>
                        {mom.opexPct != null && <Trend v={mom.opexPct}/>}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Profit distribution this month */}
              {IS.netProfit > 0 && (
                <div className="bi-card" style={{marginTop:16}}>
                  <div className="bi-card-h"><span>This Month's Profit Distribution</span></div>
                  <div className="bi-profit-dist">
                    {[
                      { label:"Buffer Fund",    amount: funds.find(f=>f.id==="buffer")?.monthlyContrib    || 0, color:C.blue   },
                      { label:"Emergency Fund", amount: funds.find(f=>f.id==="emergency")?.monthlyContrib || 0, color:C.amber  },
                      { label:"Tax Reserve",    amount: IS.taxProvision,                                         color:C.purple },
                      { label:"Growth Fund",    amount: funds.find(f=>f.id==="growth")?.monthlyContrib    || 0, color:C.green  },
                      { label:"Owner / Retained", amount: fundSummary.ownerTakeHome,                            color:C.teal   },
                    ].map(item => (
                      <div key={item.label} className="bi-dist-row">
                        <div className="bi-dist-bar-wrap">
                          <div className="bi-dist-bar"
                            style={{ width:`${Math.max(2,Math.round(item.amount/IS.netProfit*100))}%`,
                                     background:item.color }}/>
                        </div>
                        <span className="bi-dist-label">{item.label}</span>
                        <span className="bi-dist-val">{fmtFull(item.amount)}</span>
                        <span className="bi-dist-pct">
                          {Math.round(item.amount/IS.netProfit*100)}%
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════ TAB 1: Unit Economics ════════════════════ */}
          {tab === 1 && (
            <div className="bi-tab-content">
              {/* Top KPIs */}
              <div className="bi-kpi-grid4">
                <KPI label="Avg Project Revenue"    value={fmtINR(UE.avgDealRev)}        color="blue"   icon={DollarSign} sub="Per closed project (YTD avg)"/>
                <KPI label="Net Profit / Project"   value={fmtINR(OB.netProfitPerDeal)}  color={OB.netProfitPerDeal>=0?"green":"red"} icon={TrendingUp} sub="After all service costs"/>
                <KPI label="Operating Margin"       value={`${IS.netMarginPct}%`}         color={IS.netMarginPct>=20?"green":IS.netMarginPct>=5?"amber":"red"} icon={Zap} sub="Net profit as % of revenue"/>
                <KPI label="Break-Even Projects"    value={UE.breakEvenDeals}             color="amber"  icon={Target} sub={`Need ${UE.breakEvenDeals} projects/month to cover costs`}/>
              </div>

              <div className="bi-row2" style={{marginTop:16}}>
                {/* Waterfall: profit per deal */}
                <div className="bi-card">
                  <div className="bi-card-h"><span>Profit Breakdown per Average Project</span></div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={waterfallData} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                      <XAxis dataKey="name" tick={{fontSize:11,fill:"#64748b"}}/>
                      <YAxis tickFormatter={v=>fmtINR(v)} tick={{fontSize:11,fill:"#64748b"}}/>
                      <Tooltip content={<CT currency/>}/>
                      <Bar dataKey="value" name="₹ Amount" radius={[4,4,0,0]}>
                        {waterfallData.map((d,i) => <Cell key={i} fill={d.fill}/>)}
                      </Bar>
                      <ReferenceLine y={0} stroke="#cbd5e1"/>
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="bi-ue-note">
                    Based on {UE.closedCountYTD} projects closed YTD · Service cost split: ₹{(UE.avgMonthlyOpex/1000).toFixed(1)}K/month ÷ closed projects
                  </div>
                </div>

                {/* Break-even analysis */}
                <div className="bi-card">
                  <div className="bi-card-h"><span>Break-Even Analysis</span></div>
                  <div className="bi-be-grid">
                    <div className="bi-be-row">
                      <span>Total Monthly Service Costs (Salary + Rent + Other)</span>
                      <strong style={{color:C.red}}>{fmtFull(UE.avgMonthlyOpex)}</strong>
                    </div>
                    <div className="bi-be-row">
                      <span>Avg Project Revenue</span>
                      <strong>{fmtFull(UE.avgDealRev)}</strong>
                    </div>
                    <div className="bi-be-row bi-be-row-bold">
                      <span>Break-Even Projects / Month</span>
                      <strong style={{color:C.amber}}>{UE.breakEvenDeals}</strong>
                    </div>
                    <div className="bi-be-row bi-be-row-bold">
                      <span>Break-Even Revenue / Month</span>
                      <strong style={{color:C.amber}}>{fmtFull(UE.breakEvenRevenue)}</strong>
                    </div>
                    <div className="bi-be-divider"/>
                    <div className="bi-be-row">
                      <span>Projects Closed This Month</span>
                      <strong style={{color: UE.closedCountMonth >= UE.breakEvenDeals ? C.green : C.red}}>
                        {UE.closedCountMonth} / {UE.breakEvenDeals} needed
                      </strong>
                    </div>
                    <div className="bi-be-row">
                      <span>Profitability Status</span>
                      <strong style={{color: UE.closedCountMonth >= UE.breakEvenDeals ? C.green : C.red}}>
                        {UE.closedCountMonth >= UE.breakEvenDeals ? "Profitable this month" : `${UE.breakEvenDeals - UE.closedCountMonth} more projects needed`}
                      </strong>
                    </div>
                  </div>

                  {/* Reserve allocation per order */}
                  {dealAllocData.length > 0 && (
                    <>
                      <div className="bi-card-h" style={{marginTop:16}}><span>Reserve Allocations per Deal</span></div>
                      <div className="bi-be-grid">
                        {[
                          { label:"Buffer Fund", val: OB.bufferAlloc },
                          { label:"Emergency Fund", val: OB.emergencyAlloc },
                          { label:"Tax Reserve", val: OB.taxAlloc },
                          { label:"Growth Fund", val: OB.growthAlloc },
                        ].map(r => (
                          <div key={r.label} className="bi-be-row">
                            <span>{r.label}</span>
                            <strong>{fmtFull(r.val)}</strong>
                          </div>
                        ))}
                        <div className="bi-be-divider"/>
                        <div className="bi-be-row bi-be-row-bold">
                          <span>Net per Deal after reserves</span>
                          <strong style={{color:C.green}}>
                            {fmtFull(OB.netProfitPerDeal - OB.bufferAlloc - OB.emergencyAlloc - OB.taxAlloc - OB.growthAlloc)}
                          </strong>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Deal size distribution */}
              {dealBuckets.length > 0 && (
                <div className="bi-card" style={{marginTop:16}}>
                  <div className="bi-card-h"><span>Project Value Distribution (last 12 months)</span></div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={dealBuckets} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                      <XAxis dataKey="range" tick={{fontSize:11,fill:"#64748b"}}/>
                      <YAxis yAxisId="l" tick={{fontSize:11,fill:"#64748b"}}/>
                      <YAxis yAxisId="r" orientation="right" tickFormatter={v=>fmtINR(v)} tick={{fontSize:11,fill:"#64748b"}}/>
                      <Tooltip content={<CT/>}/>
                      <Bar yAxisId="l" dataKey="count" name="# Deals" fill={C.indigo} radius={[3,3,0,0]}/>
                      <Bar yAxisId="r" dataKey="total" name="₹ Total" fill={C.teal}   radius={[3,3,0,0]}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          )}

          {/* ══════════════════════════ TAB 2: Reserve Funds ═════════════════════ */}
          {tab === 2 && (
            <div className="bi-tab-content">
              {/* Summary bar */}
              <div className="bi-fund-summary">
                <div className="bi-fund-sum-item">
                  <div className="bi-fund-sum-label">Total Reserved</div>
                  <div className="bi-fund-sum-val">{fmtFull(fundSummary.totalBalance)}</div>
                </div>
                <div className="bi-fund-sum-sep"/>
                <div className="bi-fund-sum-item">
                  <div className="bi-fund-sum-label">Total Target</div>
                  <div className="bi-fund-sum-val">{fmtFull(fundSummary.totalTarget)}</div>
                </div>
                <div className="bi-fund-sum-sep"/>
                <div className="bi-fund-sum-item">
                  <div className="bi-fund-sum-label">Monthly Contribution</div>
                  <div className="bi-fund-sum-val">{fmtFull(fundSummary.totalMonthlyContrib)}</div>
                  <div className="bi-fund-sum-sub">from this month's profit</div>
                </div>
                <div className="bi-fund-sum-sep"/>
                <div className="bi-fund-sum-item">
                  <div className="bi-fund-sum-label">Owner Take-Home</div>
                  <div className="bi-fund-sum-val" style={{color:C.green}}>{fmtFull(fundSummary.ownerTakeHome)}</div>
                  <div className="bi-fund-sum-sub">after all allocations</div>
                </div>
              </div>

              {/* Fund cards */}
              <div className="bi-fund-grid">
                {funds.map(f => <FundCard key={f.id} fund={f}/>)}
              </div>

              {/* Explainer */}
              <div className="bi-card bi-explainer">
                <div className="bi-card-h"><span>Why These Funds?</span></div>
                <div className="bi-explainer-grid">
                  <div className="bi-exp-item">
                    <Shield size={18} color={C.blue}/>
                    <div>
                      <strong>Operating Buffer</strong>
                      <p>Covers rent, salaries, utilities for {data.config.bufferMonths} months if revenue drops. Prevents emergency borrowing at high interest.</p>
                    </div>
                  </div>
                  <div className="bi-exp-item">
                    <AlertTriangle size={18} color={C.amber}/>
                    <div>
                      <strong>Emergency / Accident Fund</strong>
                      <p>Equipment breakdown, server crash, legal dispute, fire/theft. Do NOT touch for regular expenses. Replenish after use.</p>
                    </div>
                  </div>
                  <div className="bi-exp-item">
                    <Receipt size={18} color={C.purple}/>
                    <div>
                      <strong>Tax Reserve</strong>
                      <p>Advance tax is due quarterly. Build this from day 1. Missing advance tax deadlines attracts 1% per month interest under Section 234C.</p>
                    </div>
                  </div>
                  <div className="bi-exp-item">
                    <TrendingUp size={18} color={C.green}/>
                    <div>
                      <strong>Growth / Investment Fund</strong>
                      <p>Hire talent, upgrade equipment, run marketing campaigns. Dedicated fund prevents raiding operating cash for growth.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ══════════════════════════ TAB 3: Scenario Planner ═════════════════ */}
          {tab === 3 && (
            <div className="bi-tab-content">
              <div className="bi-scenario-grid">
                {scenarios.map((sc, si) => {
                  const colors = [C.red, C.blue, C.green];
                  const labels = ["Conservative (-20%)", "Base Case", "Optimistic (+25%)"];
                  const totalProfit = sc.totalProfit;
                  return (
                    <div key={sc.name} className={`bi-sc-card bi-sc-${sc.name}`}>
                      <div className="bi-sc-header" style={{borderColor: colors[si]}}>
                        <span className="bi-sc-label">{labels[si]}</span>
                        <span className="bi-sc-growth">×{sc.growthFactor.toFixed(2)}</span>
                      </div>
                      <div className="bi-sc-kpis">
                        <div className="bi-sc-kpi">
                          <div className="bi-sc-kpi-label">3-Month Revenue</div>
                          <div className="bi-sc-kpi-val" style={{color:colors[si]}}>{fmtINR(sc.totalRev)}</div>
                        </div>
                        <div className="bi-sc-kpi">
                          <div className="bi-sc-kpi-label">3-Month Net Profit</div>
                          <div className="bi-sc-kpi-val" style={{color: totalProfit>=0 ? C.green : C.red}}>{fmtINR(totalProfit)}</div>
                        </div>
                      </div>
                      <table className="bi-sc-table">
                        <thead>
                          <tr><th>Month</th><th>Revenue</th><th>EBITDA</th><th>Net</th></tr>
                        </thead>
                        <tbody>
                          {sc.months.map((m, mi) => (
                            <tr key={mi}>
                              <td>{m.label}</td>
                              <td>{fmtINR(m.revenue)}</td>
                              <td style={{color: m.ebitda>=0?C.green:C.red}}>{fmtINR(m.ebitda)}</td>
                              <td style={{color: m.netProfit>=0?C.green:C.red}}>{fmtINR(m.netProfit)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  );
                })}
              </div>

              {/* Scenario comparison chart */}
              <div className="bi-card" style={{marginTop:16}}>
                <div className="bi-card-h"><span>3-Month Net Profit — Scenario Comparison</span></div>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={scenarios[0].months.map((_, mi) => ({
                      label: scenarios[0].months[mi].label,
                      Conservative: scenarios[0].months[mi].netProfit,
                      Base:         scenarios[1].months[mi].netProfit,
                      Optimistic:   scenarios[2].months[mi].netProfit,
                    }))}
                    barCategoryGap="20%"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                    <XAxis dataKey="label" tick={{fontSize:11,fill:"#64748b"}}/>
                    <YAxis tickFormatter={v=>fmtINR(v)} tick={{fontSize:11,fill:"#64748b"}}/>
                    <Tooltip content={<CT currency/>}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <ReferenceLine y={0} stroke="#cbd5e1"/>
                    <Bar dataKey="Conservative" fill={C.red}   radius={[3,3,0,0]}/>
                    <Bar dataKey="Base"         fill={C.blue}  radius={[3,3,0,0]}/>
                    <Bar dataKey="Optimistic"   fill={C.green} radius={[3,3,0,0]}/>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bi-sc-note">
                <Info size={14}/> Scenarios use your last 12-month average + linear trend. COGS, tax rate, and opex come from your Financial Configuration. Update them via <button className="bi-link" onClick={()=>setCfgOpen(true)}>Settings</button>.
              </div>
            </div>
          )}

          {/* ══════════════════════════ TAB 4: 12-Month Trend ════════════════════ */}
          {tab === 4 && (
            <div className="bi-tab-content">
              {/* Revenue + Gross Profit + Net Profit area chart */}
              <div className="bi-card">
                <div className="bi-card-h"><span>Revenue · Gross Profit · Net Profit (12 Months)</span></div>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendSeries}>
                    <defs>
                      <linearGradient id="gRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.blue}  stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={C.blue}  stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="gGP" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor={C.green} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={C.green} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                    <XAxis dataKey="label" tick={{fontSize:11,fill:"#64748b"}}/>
                    <YAxis tickFormatter={v=>fmtINR(v)} tick={{fontSize:11,fill:"#64748b"}}/>
                    <Tooltip content={<CT currency/>}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <Area type="monotone" dataKey="revenue"     name="Revenue ₹"       stroke={C.blue}   fill="url(#gRev)" strokeWidth={2}/>
                    <Area type="monotone" dataKey="grossProfit" name="Gross Profit ₹"  stroke={C.green}  fill="url(#gGP)"  strokeWidth={2}/>
                    <Line type="monotone" dataKey="netProfit"   name="Net Profit ₹"    stroke={C.amber}  strokeWidth={2} dot={{r:3}}/>
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* OpEx trend */}
              <div className="bi-card" style={{marginTop:16}}>
                <div className="bi-card-h"><span>EBITDA vs Operating Expenses (12 Months)</span></div>
                <ResponsiveContainer width="100%" height={240}>
                  <ComposedChart data={trendSeries}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/>
                    <XAxis dataKey="label" tick={{fontSize:11,fill:"#64748b"}}/>
                    <YAxis tickFormatter={v=>fmtINR(v)} tick={{fontSize:11,fill:"#64748b"}}/>
                    <Tooltip content={<CT currency/>}/>
                    <Legend wrapperStyle={{fontSize:11}}/>
                    <Bar  dataKey="opex"   name="OpEx ₹"   fill={C.red}   radius={[3,3,0,0]} opacity={0.7}/>
                    <Line dataKey="ebitda" name="EBITDA ₹" stroke={C.amber} strokeWidth={2} dot={{r:3}}/>
                    <ReferenceLine y={0} stroke="#cbd5e1"/>
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly table */}
              <div className="bi-card" style={{marginTop:16}}>
                <div className="bi-card-h"><span>Monthly Financial Summary</span></div>
                <div className="bi-trend-table-wrap">
                  <table className="bi-trend-table">
                    <thead>
                      <tr>
                        <th>Month</th>
                        <th>Revenue</th>
                        <th>COGS</th>
                        <th>Gross Profit</th>
                        <th>OpEx</th>
                        <th>EBITDA</th>
                        <th>Net Profit</th>
                        <th>Margin</th>
                      </tr>
                    </thead>
                    <tbody>
                      {trendSeries.map((t, i) => {
                        const margin = t.revenue > 0 ? Math.round(t.netProfit/t.revenue*100) : 0;
                        return (
                          <tr key={i}>
                            <td>{t.label} {t.year}</td>
                            <td>{fmtINR(t.revenue)}</td>
                            <td style={{color:C.red}}>{fmtINR(t.cogs)}</td>
                            <td style={{color: t.grossProfit>=0?C.green:C.red}}>{fmtINR(t.grossProfit)}</td>
                            <td style={{color:C.amber}}>{fmtINR(t.opex)}</td>
                            <td style={{color: t.ebitda>=0?C.green:C.red}}>{fmtINR(t.ebitda)}</td>
                            <td style={{color: t.netProfit>=0?C.green:C.red}}>{fmtINR(t.netProfit)}</td>
                            <td><span className={`bi-margin-badge ${pctColor(Math.max(0,margin))}`}>{margin}%</span></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      {cfgOpen && (
        <ConfigModal cfg={data.config} onClose={() => setCfgOpen(false)} onSave={fetchAll}/>
      )}
    </div>
  );
}
