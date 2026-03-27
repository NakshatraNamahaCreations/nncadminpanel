import React, { useEffect, useState, useCallback } from "react";
import {
  Crown, RefreshCcw, GitBranch, TrendingUp,
  BarChart2, Activity, Trophy, Users, Zap, Target,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ResponsiveContainer, LineChart, Line, Cell,
} from "recharts";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getBranchReports } from "../../services/branchReportsService";
import "./BranchReports.css";

/* ─── Constants ─────────────────────────────────────────────────── */
const TABS = [
  { key: "overview", label: "Overview",  icon: GitBranch  },
  { key: "funnel",   label: "Funnel",    icon: Activity   },
  { key: "revenue",  label: "Revenue",   icon: BarChart2  },
  { key: "trends",   label: "Trends",    icon: TrendingUp },
];

const BRANCH_COLORS = [
  "#356AE6", "#10b981", "#f59e0b", "#7c3aed",
  "#ef4444", "#0ea5e9", "#f97316", "#14b8a6",
];

const PRIORITY_COLORS = { Hot: "#ef4444", Warm: "#f59e0b", Cold: "#3b82f6" };

const fmt    = new Intl.NumberFormat("en-IN");
const fmtK   = (n) =>
  n >= 1000000 ? `${(n / 1000000).toFixed(1)}M`
  : n >= 100000 ? `${(n / 100000).toFixed(1)}L`
  : n >= 1000   ? `${(n / 1000).toFixed(0)}K`
  : String(n || 0);
const pctBar = (v) => Math.min(Math.max(v || 0, 0), 100);

const DEFAULT_DATA = {
  meta: { year: null, month: null, branchNames: [] },
  summary: {
    totalLeads: 0, totalClosed: 0, totalRevenue: 0,
    reachability: 0, qualification: 0, proposalConv: 0,
    closeRate: 0, revPerEnquiry: 0, avgDealValue: 0,
  },
  branches: [],
  monthlyTrend: [],
  revenueProjection: {
    currentRevenue: 0, optimizedTarget: 0, potentialUplift: 0,
    currentDeals: 0, targetDeals: 0,
  },
};

const now    = new Date();
const YEARS  = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i);
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

/* ─── Root Component ─────────────────────────────────────────────── */
export default function BranchReports() {
  const [tab,     setTab    ] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error,   setError  ] = useState("");
  const [report,  setReport ] = useState(DEFAULT_DATA);
  const [year,    setYear   ] = useState("");
  const [month,   setMonth  ] = useState("");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (year)  params.append("year",  year);
      if (month) params.append("month", month);
      const res = await getBranchReports(params.toString());
      setReport(res?.data || DEFAULT_DATA);
    } catch (e) {
      setError(e?.message || "Failed to load branch reports");
      setReport(DEFAULT_DATA);
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const { summary, branches, monthlyTrend, revenueProjection } = report;

  return (
    <div className="brLayout">
      <Sidebar />

      <main className="brMain">
        {/* ── Topbar ── */}
        <div className="brTopbar">
          <div className="brTopbarLeft">
            <h1 className="brTitle">Branch Reports</h1>
            <span className="brAdminPill"><Crown size={13} /> Master Admin</span>
          </div>

          <div className="brTopbarRight">
            <select
              className="brSelect"
              value={year}
              onChange={e => setYear(e.target.value)}
            >
              <option value="">All Years</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              className="brSelect"
              value={month}
              onChange={e => setMonth(e.target.value)}
            >
              <option value="">All Months</option>
              {MONTHS.map((m, i) => (
                <option key={m} value={i + 1}>{m}</option>
              ))}
            </select>

            <button className="brGhostBtn" onClick={fetchReport}>
              <RefreshCcw size={15} /> Refresh
            </button>
          </div>
        </div>

        {/* ── Tab Row ── */}
        <div className="brTabRow">
          {TABS.map(t => (
            <button
              key={t.key}
              className={`brTabBtn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
            >
              <t.icon size={15} /> {t.label}
            </button>
          ))}
        </div>

        {/* ── Content ── */}
        <div className="brContent">
          {error && <div className="brErrorBanner">{error}</div>}

          {loading ? (
            <div className="brLoader">
              <div className="brSpinner" />
              Loading branch data…
            </div>
          ) : (
            <>
              {tab === "overview" && (
                <OverviewTab
                  summary={summary}
                  branches={branches}
                  revenueProjection={revenueProjection}
                />
              )}
              {tab === "funnel" && <FunnelTab branches={branches} />}
              {tab === "revenue" && <RevenueTab branches={branches} />}
              {tab === "trends" && (
                <TrendsTab
                  monthlyTrend={monthlyTrend}
                  branchNames={report.meta?.branchNames || []}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

/* ─── OVERVIEW TAB ───────────────────────────────────────────────── */
function OverviewTab({ summary, branches, revenueProjection }) {
  return (
    <>
      {/* KPI Strip */}
      <div className="brKpiStrip">
        <KpiCard label="Total Leads"   value={summary.totalLeads}                icon={<Users size={18} />}    color="#356AE6" />
        <KpiCard label="Deals Closed"  value={summary.totalClosed}               icon={<Trophy size={18} />}   color="#10b981" />
        <KpiCard label="Total Revenue" value={`₹${fmtK(summary.totalRevenue)}`}  icon={<Zap size={18} />}      color="#7c3aed" />
        <KpiCard label="Close Rate"    value={`${summary.closeRate}%`}            icon={<Target size={18} />}   color="#f59e0b" />
        <KpiCard label="Avg Deal"      value={`₹${fmtK(summary.avgDealValue)}`}  icon={<TrendingUp size={18} />} color="#0ea5e9" />
        <KpiCard label="Rev / Enquiry" value={`₹${fmtK(summary.revPerEnquiry)}`} icon={<BarChart2 size={18} />}  color="#f97316" />
      </div>

      {/* Conversion Rate Row */}
      <div className="brConvRow">
        {[
          { label: "Reachability",   val: summary.reachability,  color: "#0ea5e9" },
          { label: "Qualification",  val: summary.qualification,  color: "#f59e0b" },
          { label: "Proposal Conv.", val: summary.proposalConv,   color: "#7c3aed" },
          { label: "Close Rate",     val: summary.closeRate,      color: "#10b981" },
        ].map(c => (
          <div key={c.label} className="brConvCard">
            <div className="brConvLabel">{c.label}</div>
            <div className="brConvValue" style={{ color: c.color }}>{c.val}%</div>
            <div className="brConvTrack">
              <div
                className="brConvFill"
                style={{ width: `${pctBar(c.val)}%`, background: c.color }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Branch Cards */}
      <div className="brBranchGrid">
        {branches.map((b, i) => (
          <BranchCard
            key={b.name}
            branch={b}
            color={BRANCH_COLORS[i % BRANCH_COLORS.length]}
          />
        ))}
      </div>

      {/* Revenue Projection */}
      <div className="brProjSection">
        <div className="brSectionHeader">Revenue Projection</div>
        <div className="brProjGrid">
          <ProjItem label="Current Revenue"  value={`₹${fmt.format(revenueProjection.currentRevenue)}`} />
          <ProjItem label="Optimised Target" value={`₹${fmt.format(revenueProjection.optimizedTarget)}`} highlight="green" />
          <ProjItem label="Potential Uplift" value={`+₹${fmt.format(revenueProjection.potentialUplift)}`} highlight="blue" />
          <ProjItem label="Current Deals"    value={`${revenueProjection.currentDeals} deals`} />
          <ProjItem label="Target Deals"     value={`~${revenueProjection.targetDeals} deals`} highlight="green" />
        </div>
      </div>
    </>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div className="brKpiCard">
      <div className="brKpiIcon" style={{ background: `${color}1a`, color }}>{icon}</div>
      <div className="brKpiText">
        <div className="brKpiValue">{value}</div>
        <div className="brKpiLabel">{label}</div>
      </div>
    </div>
  );
}

function BranchCard({ branch, color }) {
  const priorities = Object.entries(branch.byPriority || {}).sort((a, b) => b[1] - a[1]);
  const sources    = Object.entries(branch.bySource    || {}).sort((a, b) => b[1] - a[1]).slice(0, 4);

  return (
    <div className="brBCard" style={{ borderTop: `3px solid ${color}` }}>
      {/* Head */}
      <div className="brBCardHead">
        <div>
          <div className="brBCardName">{branch.name}</div>
          <div className="brBCardSub">
            {branch.enquiries} enquiries &middot; ₹{fmtK(branch.revenue)}
            {branch.allTimeLeads ? ` · ${branch.allTimeLeads} all-time` : ""}
          </div>
        </div>
        {branch.tag && (
          <span className={`brTag ${branch.tag === "Best" ? "tagBest" : "tagWork"}`}>
            {branch.tag}
          </span>
        )}
      </div>

      {/* Funnel bars */}
      <div className="brBFunnel">
        {[
          { label: "Enquiries", v: branch.enquiries, p: 100,                  c: "#356AE6" },
          { label: "Reachable", v: branch.reachable, p: branch.reachability,  c: "#0ea5e9" },
          { label: "Qualified", v: branch.qualified, p: branch.qualification, c: "#f59e0b" },
          { label: "Proposal",  v: branch.proposal,  p: branch.proposalConv,  c: "#7c3aed" },
          { label: "Closed",    v: branch.closed,    p: branch.closeRate,     c: "#10b981" },
        ].map(row => (
          <div className="brBFRow" key={row.label}>
            <span className="brBFLabel">{row.label}</span>
            <div className="brBFTrack">
              <div
                className="brBFFill"
                style={{ width: `${pctBar(row.p)}%`, background: row.c }}
              />
            </div>
            <span className="brBFCount">{row.v}</span>
            <span className="brBFPct" style={{ color: row.c }}>{row.p}%</span>
          </div>
        ))}
      </div>

      {/* Priority pills */}
      {priorities.length > 0 && (
        <div className="brBSection">
          <div className="brBSectionLabel">Priority</div>
          <div className="brBPills">
            {priorities.map(([p, c]) => (
              <span
                key={p}
                className="brBPill"
                style={{
                  background: `${PRIORITY_COLORS[p] || "#64748b"}20`,
                  color: PRIORITY_COLORS[p] || "#64748b",
                  borderColor: `${PRIORITY_COLORS[p] || "#64748b"}40`,
                }}
              >
                {p}: {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && (
        <div className="brBSection">
          <div className="brBSectionLabel">Top Sources</div>
          <div className="brBPills">
            {sources.map(([s, c]) => (
              <span key={s} className="brBPillNeutral">{s}: {c}</span>
            ))}
          </div>
        </div>
      )}

      {/* Top rep */}
      {branch.topRep && (
        <div className="brBRepRow">
          <Trophy size={13} color="#f59e0b" />
          <span className="brBRepName">{branch.topRep}</span>
          <span className="brBRepStat">
            {branch.topRepDeals} deals &middot; ₹{fmtK(branch.topRepRev)}
          </span>
        </div>
      )}

      {/* Note */}
      <div
        className={`brBNote ${
          branch.tag === "Best"       ? "noteBest"
          : branch.tag === "Needs Work" ? "noteWork"
          : "noteNormal"
        }`}
      >
        {branch.note}
      </div>
    </div>
  );
}

function ProjItem({ label, value, highlight }) {
  return (
    <div className={`brProjItem ${highlight || ""}`}>
      <div className="brProjLabel">{label}</div>
      <div className="brProjValue">{value}</div>
    </div>
  );
}

/* ─── FUNNEL TAB ─────────────────────────────────────────────────── */
function FunnelTab({ branches }) {
  const [selected, setSelected] = useState("all");

  const shown = selected === "all"
    ? branches
    : branches.filter(b => b.name === selected);

  return (
    <div>
      <div className="brFilterRow">
        <div className="brSectionHeader" style={{ marginBottom: 0 }}>Pipeline Funnel</div>
        <select
          className="brSelect"
          value={selected}
          onChange={e => setSelected(e.target.value)}
        >
          <option value="all">All Branches</option>
          {branches.map(b => (
            <option key={b.name} value={b.name}>{b.name}</option>
          ))}
        </select>
      </div>

      <div className="brFunnelCards">
        {shown.map(b => {
          const idx   = branches.findIndex(x => x.name === b.name);
          const color = BRANCH_COLORS[idx % BRANCH_COLORS.length];
          return (
            <div key={b.name} className="brFCard">
              {/* Card head */}
              <div className="brFCardHead" style={{ borderLeft: `4px solid ${color}` }}>
                <span className="brFCardName">{b.name}</span>
                <div className="brFCardStats">
                  <span>Win Rate: <strong>{b.winRate}%</strong></span>
                  <span>Rev: <strong>₹{fmtK(b.revenue)}</strong></span>
                </div>
              </div>

              {/* Funnel visual */}
              <div className="brFViz">
                {[
                  { label: "Enquiries", v: b.enquiries, p: 100,                  c: "#356AE6" },
                  { label: "Reachable", v: b.reachable, p: b.reachability,        c: "#0ea5e9" },
                  { label: "Qualified", v: b.qualified, p: b.qualification,       c: "#f59e0b" },
                  { label: "Proposal",  v: b.proposal,  p: b.proposalConv,        c: "#7c3aed" },
                  { label: "Closed",    v: b.closed,    p: b.closeRate,           c: "#10b981" },
                ].map(row => (
                  <div key={row.label} className="brFStep">
                    <div className="brFStepMeta">
                      <span>{row.label}</span>
                      <span style={{ color: row.c }}>{row.v} ({row.p}%)</span>
                    </div>
                    <div className="brFStepBar">
                      <div
                        className="brFStepFill"
                        style={{ width: `${pctBar(row.p)}%`, background: row.c }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {/* Stage table */}
              {Object.keys(b.stageMap || {}).length > 0 && (
                <div className="brStageTable">
                  <div className="brStageHead">
                    <span>Stage</span><span>Count</span><span>Pipeline Value</span>
                  </div>
                  {Object.entries(b.stageMap)
                    .sort((a, b) => b[1].count - a[1].count)
                    .map(([stage, { count, value }]) => (
                      <div key={stage} className="brStageRow">
                        <span>{stage}</span>
                        <span>{count}</span>
                        <span>₹{fmtK(value)}</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── REVENUE TAB ────────────────────────────────────────────────── */
function RevenueTab({ branches }) {
  const chartData = branches.map((b, i) => ({
    name:    b.name,
    Revenue: b.revenue,
    Deals:   b.closed,
    color:   BRANCH_COLORS[i % BRANCH_COLORS.length],
  }));

  const allReps = branches
    .flatMap(b => (b.allReps || []).map(r => ({ ...r, branch: b.name })))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  return (
    <div>
      {/* Revenue Bar Chart */}
      <div className="brChartCard">
        <div className="brChartTitle">Revenue by Branch</div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 10, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: "#64748b" }} />
            <YAxis tickFormatter={v => `₹${fmtK(v)}`} tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip
              formatter={(v, n) => [
                n === "Revenue" ? `₹${fmt.format(v)}` : v, n,
              ]}
              contentStyle={{ borderRadius: 10, fontSize: 13 }}
            />
            <Bar dataKey="Revenue" radius={[6, 6, 0, 0]}>
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Branch breakdown table */}
      <div className="brChartCard brTableCard">
        <div className="brChartTitle">Branch Revenue Breakdown</div>
        <div className="brTableWrap">
          <table className="brTable">
            <thead>
              <tr>
                <th>Branch</th>
                <th>Revenue</th>
                <th>Deals</th>
                <th>Avg Deal</th>
                <th>Close Rate</th>
                <th>Win Rate</th>
                <th>Rev / Enquiry</th>
                <th>Top Rep</th>
              </tr>
            </thead>
            <tbody>
              {branches.map((b, i) => (
                <tr key={b.name}>
                  <td>
                    <span
                      className="brTableDot"
                      style={{ background: BRANCH_COLORS[i % BRANCH_COLORS.length] }}
                    />
                    {b.name}
                  </td>
                  <td className="brTableNum">₹{fmt.format(b.revenue)}</td>
                  <td>{b.closed}</td>
                  <td>₹{fmtK(b.avgDealValue)}</td>
                  <td>
                    <span
                      className={`brPctBadge ${
                        b.closeRate >= 30 ? "good"
                        : b.closeRate >= 15 ? "mid"
                        : "low"
                      }`}
                    >
                      {b.closeRate}%
                    </span>
                  </td>
                  <td>{b.winRate}%</td>
                  <td>₹{fmtK(b.revPerEnquiry)}</td>
                  <td>{b.topRep || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rep Leaderboard */}
      {allReps.length > 0 && (
        <div className="brChartCard">
          <div className="brChartTitle">Top Performers Leaderboard</div>
          <div className="brRepList">
            {allReps.map((r, i) => (
              <div key={`${r.branch}-${r.rep}`} className="brRepItem">
                <div className="brRepRank">
                  {i < 3 ? ["🥇", "🥈", "🥉"][i] : `#${i + 1}`}
                </div>
                <div className="brRepInfo">
                  <div className="brRepName">{r.rep}</div>
                  <div className="brRepBranch">{r.branch}</div>
                </div>
                <div className="brRepStats">
                  <span className="brRepDeals">{r.closed} deals</span>
                  <span className="brRepRev">₹{fmtK(r.revenue)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── TRENDS TAB ─────────────────────────────────────────────────── */
function TrendsTab({ monthlyTrend, branchNames }) {
  if (!monthlyTrend?.length) {
    return (
      <div className="brEmpty">
        No trend data available for the selected period.
      </div>
    );
  }

  return (
    <div>
      {/* Line Chart */}
      <div className="brChartCard">
        <div className="brChartTitle">6-Month Revenue Trend by Branch</div>
        <ResponsiveContainer width="100%" height={340}>
          <LineChart
            data={monthlyTrend}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#64748b" }} />
            <YAxis
              tickFormatter={v => `₹${fmtK(v)}`}
              tick={{ fontSize: 12, fill: "#64748b" }}
            />
            <Tooltip
              formatter={(v, n) => [`₹${fmt.format(v)}`, n]}
              contentStyle={{ borderRadius: 10, fontSize: 13 }}
            />
            <Legend />
            {branchNames.map((name, i) => (
              <Line
                key={name}
                type="monotone"
                dataKey={name}
                stroke={BRANCH_COLORS[i % BRANCH_COLORS.length]}
                strokeWidth={2.5}
                dot={{ r: 4 }}
                activeDot={{ r: 7 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly deals trend */}
      <div className="brChartCard" style={{ marginTop: 12 }}>
        <div className="brChartTitle">Deals Closed per Month</div>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart
            data={monthlyTrend}
            margin={{ top: 10, right: 20, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="month" tick={{ fontSize: 13, fill: "#64748b" }} />
            <YAxis tick={{ fontSize: 12, fill: "#64748b" }} />
            <Tooltip contentStyle={{ borderRadius: 10, fontSize: 13 }} />
            <Legend />
            {branchNames.map((name, i) => (
              <Bar
                key={name}
                dataKey={`${name}_deals`}
                name={name}
                fill={BRANCH_COLORS[i % BRANCH_COLORS.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly breakdown table */}
      <div className="brChartCard brTableCard" style={{ marginTop: 12 }}>
        <div className="brChartTitle">Monthly Breakdown</div>
        <div className="brTableWrap">
          <table className="brTable">
            <thead>
              <tr>
                <th>Month</th>
                {branchNames.map(n => <th key={n}>{n}</th>)}
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              {monthlyTrend.map(row => {
                const total = branchNames.reduce((s, n) => s + (row[n] || 0), 0);
                return (
                  <tr key={`${row.year}-${row.month}`}>
                    <td><strong>{row.month} {row.year}</strong></td>
                    {branchNames.map(n => (
                      <td key={n} className="brTableNum">₹{fmtK(row[n] || 0)}</td>
                    ))}
                    <td className="brTableNum brTableTotal">₹{fmtK(total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
