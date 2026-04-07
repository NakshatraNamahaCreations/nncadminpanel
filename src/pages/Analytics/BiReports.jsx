import { useEffect, useState } from "react";
import {
  Brain, AlertTriangle, CheckCircle, DollarSign, Users, Target,
  Zap, ArrowRight, RefreshCw, AlertCircle, XCircle, Activity,
  FileText, Receipt, MessageSquare, TrendingUp, TrendingDown,
  Clock, Phone, Building2, Star, ChevronRight, Flame,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./BiReports.css";

const API  = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const auth = () => { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; };

const f = n => {
  const v = Number(n) || 0;
  if (v >= 10000000) return "₹" + (v / 10000000).toFixed(2) + "Cr";
  if (v >= 100000)   return "₹" + (v / 100000).toFixed(1) + "L";
  if (v >= 1000)     return "₹" + (v / 1000).toFixed(1) + "K";
  return "₹" + v.toLocaleString("en-IN");
};
const pct  = (a, b) => b > 0 ? ((a / b) * 100).toFixed(1) : "0.0";
const abs  = n => Math.abs(Number(n) || 0);
const days = d => Math.floor((Date.now() - new Date(d)) / 86400000);
const name = l => l.name || l.clientName || l.business || l.clientBusiness || "Unknown";

// ── Build all insight sections from raw data ────────────────────────────────
function buildSections(d) {
  const sections = [];
  const L  = d.leads        || {};
  const IN = d.invoices     || {};
  const QT = d.quotations   || {};
  const EN = d.enquiries    || {};

  const repPerf      = d.repPerf      || [];
  const sourcePerf   = d.sourcePerf   || [];
  const stageDistrib = d.stageDistrib || [];
  const staleLeads   = d.staleLeads   || [];
  const lostLeads    = d.lostLeads    || [];
  const unpaidInv    = d.unpaidInvoices || [];
  const pendingQuots = d.pendingQuots || [];
  const unconvEnq    = d.unconvertedEnquiries || [];
  const closedLeads  = d.closedLeads  || [];
  const recentLeads  = d.recentLeads  || [];
  const enquiryBySvc = d.enquiryByService || [];

  // ── 1. BUSINESS PULSE ────────────────────────────────────────────────────
  {
    const points = [], actions = [], highlights = [];
    const collPct = L.collectionPct || 0;

    highlights.push({ label: "Total Revenue", value: f(L.totalValue), color: "emerald" });
    highlights.push({ label: "Collected",     value: f(L.totalCollected), color: "blue" });
    highlights.push({ label: "Pending",       value: f(L.pendingBalance), color: collPct < 50 ? "rose" : "amber" });
    highlights.push({ label: "Conversion",    value: L.convRate + "%", color: L.convRate >= 20 ? "emerald" : "amber" });

    points.push(`${L.total} total leads · ${L.closed} closed · ${L.lost} lost · ${L.total - L.closed - L.lost} still active`);

    if (L.momGrowth > 0) {
      points.push(`This month revenue ${f(L.thisMonthVal)} — up ${L.momGrowth}% from last month (${f(L.lastMonthVal)})`);
    } else if (L.momGrowth < 0) {
      points.push(`This month revenue ${f(L.thisMonthVal)} — down ${abs(L.momGrowth)}% from last month (${f(L.lastMonthVal)})`);
      actions.push("Revenue declining — review what changed in your sales activity this month");
    }

    if (collPct < 50) {
      points.push(`Only ${collPct}% of total revenue collected — ${f(L.pendingBalance)} still uncollected`);
      actions.push("Collection health is poor — prioritise recovering pending amounts before closing new deals");
    } else {
      points.push(`${collPct}% of revenue collected — ${f(L.totalCollected)} in the bank`);
    }

    if (IN.overdueCount > 0) {
      points.push(`${IN.overdueCount} invoice${IN.overdueCount > 1 ? "s" : ""} overdue — ${f(IN.unpaidAmount)} at risk`);
      actions.push(`Chase the ${IN.overdueCount} overdue invoice${IN.overdueCount > 1 ? "s" : ""} immediately`);
    }

    if (QT.negotiating > 0) {
      points.push(`${QT.negotiating} quotation${QT.negotiating > 1 ? "s" : ""} currently under negotiation — ${f(QT.approvedVal)} approved value so far`);
    }

    sections.push({
      id: "pulse", category: "Business Pulse", icon: <Activity size={16}/>,
      verdict: L.momGrowth >= 0
        ? `Business is ${L.momGrowth > 10 ? "growing" : "stable"} — ${f(L.thisMonthVal)} this month`
        : `Revenue dipped ${abs(L.momGrowth)}% this month — needs attention`,
      tone: L.momGrowth >= 0 && collPct >= 50 ? "good" : collPct < 30 ? "bad" : "warn",
      highlights, points, actions,
    });
  }

  // ── 2. CLIENTS & MONEY ───────────────────────────────────────────────────
  {
    const points = [], actions = [], rows = [];

    // Closed leads with balance pending
    const unpaidClients = closedLeads.filter(l => l.balance > 0).slice(0, 6);
    if (unpaidClients.length > 0) {
      points.push(`${unpaidClients.length} closed client${unpaidClients.length > 1 ? "s" : ""} still haven't paid full amount:`);
      unpaidClients.forEach(l => {
        rows.push({
          label: name(l),
          sub:   `Closed deal · ${f(l.balance)} still pending`,
          tag:   l.balance > 50000 ? "High" : "Pending",
          tagColor: l.balance > 50000 ? "rose" : "amber",
          phone: l.phone,
        });
        if (l.balance > 100000) actions.push(`Call ${name(l)} today — ₹${(l.balance/1000).toFixed(0)}K outstanding`);
      });
    } else {
      points.push("All closed clients have paid in full — excellent collection discipline");
    }

    // Overdue invoices
    const overdue = unpaidInv.filter(i => i.isOverdue).slice(0, 5);
    if (overdue.length > 0) {
      points.push(`${overdue.length} overdue invoice${overdue.length > 1 ? "s" : ""}:`);
      overdue.forEach(i => {
        rows.push({
          label: i.clientName || i.clientBusiness || "Unknown",
          sub:   `${i.invoiceNumber} · ${f(i.totalAmount)} · ${i.daysOverdue}d overdue`,
          tag:   i.daysOverdue > 30 ? "Critical" : "Overdue",
          tagColor: i.daysOverdue > 30 ? "rose" : "amber",
        });
      });
      actions.push(`Send payment reminders for all ${overdue.length} overdue invoices today`);
    }

    if (IN.total > 0) {
      points.push(`Invoices: ${IN.total} total · ${IN.paid} paid · ${f(IN.paidAmount)} collected · ${f(IN.unpaidAmount)} pending`);
    }

    sections.push({
      id: "clients", category: "Clients & Money", icon: <DollarSign size={16}/>,
      verdict: unpaidClients.length === 0 && overdue.length === 0
        ? "No outstanding client payments — all settled"
        : `${unpaidClients.length + overdue.length} clients need payment follow-up`,
      tone: unpaidClients.length + overdue.length === 0 ? "good" : overdue.filter(i => i.daysOverdue > 30).length > 0 ? "bad" : "warn",
      points, actions, rows,
    });
  }

  // ── 3. QUOTATIONS ────────────────────────────────────────────────────────
  {
    const points = [], actions = [], rows = [];

    points.push(`${QT.total} quotations raised · ${QT.approved} approved · ${QT.rejected} rejected · ${QT.sent} awaiting response`);
    if (QT.total > 0) points.push(`Quotation conversion rate: ${QT.convRate}% · Approved value: ${f(QT.approvedVal)}`);
    if (QT.draft > 0) {
      points.push(`${QT.draft} quotation${QT.draft > 1 ? "s are" : " is"} still in draft — not sent to client yet`);
      actions.push(`Send the ${QT.draft} pending draft quotation${QT.draft > 1 ? "s" : ""} — every day of delay reduces win chances`);
    }

    if (pendingQuots.length > 0) {
      points.push(`${pendingQuots.length} quotation${pendingQuots.length > 1 ? "s" : ""} sent but no response in 7+ days:`);
      pendingQuots.slice(0, 5).forEach(q => {
        rows.push({
          label: q.clientName || q.clientCompany || "Unknown",
          sub:   `${f(q.total)} · Sent ${q.daysSinceUpdate}d ago · ${q.branch}`,
          tag:   q.daysSinceUpdate > 14 ? "Urgent" : "Follow up",
          tagColor: q.daysSinceUpdate > 14 ? "rose" : "amber",
        });
        if (q.total > 50000) actions.push(`Follow up with ${q.clientName || q.clientCompany} — ${f(q.total)} deal going cold (${q.daysSinceUpdate}d silence)`);
      });
    }

    if (QT.rejected > 0 && QT.total > 0) {
      const rejRate = +pct(QT.rejected, QT.total);
      if (rejRate > 30) {
        points.push(`High rejection rate: ${rejRate}% of quotations rejected — pricing or proposal quality may need review`);
        actions.push("Review your last 5 rejected quotations — find the common objection and fix your proposal template");
      }
    }

    sections.push({
      id: "quotations", category: "Quotations", icon: <FileText size={16}/>,
      verdict: QT.sent > 0
        ? `${QT.sent} quotation${QT.sent > 1 ? "s" : ""} awaiting client decision — ${f(QT.totalValue)} at stake`
        : QT.approved > 0
        ? `${QT.approved} quotations approved — ${f(QT.approvedVal)} won`
        : "No active quotations",
      tone: pendingQuots.length > 3 ? "warn" : QT.rejected > QT.approved ? "bad" : "good",
      points, actions, rows,
    });
  }

  // ── 4. PIPELINE & LEADS ──────────────────────────────────────────────────
  {
    const points = [], actions = [], rows = [];

    // Find biggest leaking stage
    const activeStages = stageDistrib.filter(s => !["closed","won","lost","not interested"].some(c => s.stage?.toLowerCase().includes(c)));
    if (activeStages.length > 0) {
      const biggest = [...activeStages].sort((a, b) => b.count - a.count)[0];
      points.push(`Most leads stuck at "${biggest.stage}" — ${biggest.count} leads, ${f(biggest.value)} in value`);
    }

    // Stale leads
    if (staleLeads.length > 0) {
      const staleVal = staleLeads.reduce((s, l) => s + (l.value || 0), 0);
      points.push(`${staleLeads.length} leads untouched for 30+ days — ${f(staleVal)} sitting idle`);
      staleLeads.slice(0, 4).forEach(l => {
        rows.push({
          label: name(l),
          sub:   `${l.stage} · ${f(l.value)} · Silent ${l.daysSilent}d · ${l.repName || "Unassigned"}`,
          tag:   l.daysSilent > 60 ? "Very Stale" : "Stale",
          tagColor: l.daysSilent > 60 ? "rose" : "amber",
          phone: l.phone,
        });
      });
      if (staleVal > 200000) actions.push(`${f(staleVal)} locked in stale leads — assign someone to call each one this week`);
    }

    // Recent new leads
    const newThis = recentLeads.filter(l => l.daysOld <= 3);
    if (newThis.length > 0) {
      points.push(`${newThis.length} new lead${newThis.length > 1 ? "s" : ""} in the last 3 days: ${newThis.map(l => name(l)).join(", ")}`);
    }

    // Lost leads analysis
    if (lostLeads.length > 0) {
      const lostVal = lostLeads.reduce((s, l) => s + (l.value || 0), 0);
      points.push(`${lostLeads.length} deals lost recently — ${f(lostVal)} in revenue lost`);
      const lostBySrc = {};
      lostLeads.forEach(l => { lostBySrc[l.source || "Unknown"] = (lostBySrc[l.source || "Unknown"] || 0) + 1; });
      const topLostSrc = Object.entries(lostBySrc).sort((a, b) => b[1] - a[1])[0];
      if (topLostSrc) points.push(`Most losses from source: ${topLostSrc[0]} (${topLostSrc[1]} deals lost)`);
    }

    sections.push({
      id: "pipeline", category: "Pipeline & Leads", icon: <Target size={16}/>,
      verdict: staleLeads.length > 5
        ? `Pipeline health is weak — ${staleLeads.length} stale leads need immediate action`
        : `${L.total - L.closed - L.lost} active leads in pipeline · ${L.convRate}% converting`,
      tone: staleLeads.length > 8 ? "bad" : staleLeads.length > 3 ? "warn" : "good",
      points, actions, rows,
    });
  }

  // ── 5. ENQUIRIES ────────────────────────────────────────────────────────
  {
    const points = [], actions = [], rows = [];

    points.push(`${EN.total} total enquiries · ${EN.converted} converted to leads · ${EN.uncontacted} never contacted`);
    if (EN.total > 0) points.push(`Enquiry-to-lead conversion: ${EN.convRate}% · ${EN.thisMonth} new this month`);

    if (EN.uncontacted > 0) {
      points.push(`${EN.uncontacted} enquiries sitting with status "New" — nobody has called them yet`);
      actions.push(`Call the ${EN.uncontacted} uncontacted enquiries today — first contact within 24h dramatically improves win rate`);
    }

    if (unconvEnq.length > 0) {
      points.push(`${unconvEnq.length} enquiries 7+ days old and still not converted to a lead:`);
      unconvEnq.slice(0, 5).forEach(e => {
        rows.push({
          label: e.name || e.company || "Unknown",
          sub:   `${e.source} · ${(e.services || []).slice(0, 2).join(", ") || "No service"} · Waiting ${e.daysWaiting}d`,
          tag:   e.daysWaiting > 14 ? "Cold" : "Pending",
          tagColor: e.daysWaiting > 14 ? "rose" : "amber",
          phone: e.phone,
        });
      });
      actions.push(`Convert or close the ${unconvEnq.length} old enquiries — don't let them rot in the queue`);
    }

    // Top demanded services
    if (enquiryBySvc.length > 0) {
      const top3 = enquiryBySvc.slice(0, 3).map(s => `${s._id} (${s.count})`).join(", ");
      points.push(`Most enquired services: ${top3}`);
    }

    sections.push({
      id: "enquiries", category: "Enquiries", icon: <MessageSquare size={16}/>,
      verdict: EN.uncontacted > 0
        ? `${EN.uncontacted} enquiries never contacted — money being left on the table`
        : unconvEnq.length > 0
        ? `${unconvEnq.length} old enquiries not yet converted — follow up needed`
        : `Enquiry pipeline looks clean · ${EN.convRate}% conversion rate`,
      tone: EN.uncontacted > 3 ? "bad" : unconvEnq.length > 5 ? "warn" : "good",
      points, actions, rows,
    });
  }

  // ── 6. TEAM PERFORMANCE ──────────────────────────────────────────────────
  {
    const points = [], actions = [], rows = [];
    const activeReps = repPerf.filter(r => r.total > 0);

    if (activeReps.length === 0) {
      points.push("No rep data — leads may not be assigned to team members");
      actions.push("Start assigning leads to reps so you can track individual performance");
    } else {
      const sorted     = [...activeReps].sort((a, b) => b.revenue - a.revenue);
      const top        = sorted[0];
      const avgConv    = activeReps.reduce((s, r) => s + r.convRate, 0) / activeReps.length;
      const topRevShare = pct(top.revenue, L.totalValue);

      points.push(`${activeReps.length} active reps · Team conversion avg: ${avgConv.toFixed(1)}%`);
      points.push(`Top performer: ${top.rep} — ${f(top.revenue)} revenue, ${top.convRate}% conversion, ${top.closed} deals closed`);

      if (top.revenue > 0 && +topRevShare > 60) {
        points.push(`Warning: ${top.rep} generates ${topRevShare}% of all revenue — dangerous single-point dependency`);
        actions.push(`Cross-train other reps using ${top.rep}'s approach — don't let one person carry the whole team`);
      }

      activeReps.forEach(r => {
        const verdict = r.convRate >= avgConv * 1.2 ? "Star" : r.convRate >= avgConv * 0.7 ? "Okay" : "Struggling";
        const tagColor = verdict === "Star" ? "emerald" : verdict === "Okay" ? "blue" : "rose";
        rows.push({
          label: r.rep,
          sub:   `${r.total} leads · ${r.closed} closed · ${r.convRate}% conv · ${f(r.revenue)} · ${r.stale} stale`,
          tag:   verdict,
          tagColor,
        });
        if (r.total >= 5 && r.convRate < avgConv * 0.5) {
          points.push(`${r.rep} has ${r.total} leads but only ${r.convRate}% conversion — below half the team average`);
          actions.push(`Review ${r.rep}'s calls and proposals — something is breaking at follow-up stage`);
        }
        if (r.stale >= 3) {
          actions.push(`${r.rep} has ${r.stale} stale leads — they're not following up consistently`);
        }
      });
    }

    sections.push({
      id: "team", category: "Team Performance", icon: <Users size={16}/>,
      verdict: activeReps.length === 0
        ? "No rep assignments found — start tracking team performance"
        : (() => {
            const zeroClosed = activeReps.filter(r => r.closed === 0 && r.total >= 5);
            if (zeroClosed.length) return `${zeroClosed.map(r => r.rep).join(", ")} — leads assigned but zero deals closed`;
            const top = [...activeReps].sort((a, b) => b.revenue - a.revenue)[0];
            return `${top.rep} leading with ${f(top.revenue)} · Team avg ${(activeReps.reduce((s,r)=>s+r.convRate,0)/activeReps.length).toFixed(1)}% conversion`;
          })(),
      tone: activeReps.filter(r => r.closed === 0 && r.total >= 5).length > 0 ? "warn"
          : activeReps.some(r => r.stale >= 5) ? "warn" : "good",
      points, actions, rows,
    });
  }

  // ── 7. SOURCES ──────────────────────────────────────────────────────────
  {
    const points = [], actions = [], rows = [];

    if (sourcePerf.length === 0) {
      points.push("No source data — record where each lead comes from");
    } else {
      const byConv   = [...sourcePerf].sort((a, b) => b.convRate - a.convRate);
      const byRev    = [...sourcePerf].sort((a, b) => b.revenue - a.revenue);
      const byVol    = [...sourcePerf].sort((a, b) => b.total - a.total);
      const bestConv = byConv[0];
      const bestRev  = byRev[0];
      const mostVol  = byVol[0];
      const avgVol   = sourcePerf.reduce((s, x) => s + x.total, 0) / sourcePerf.length;

      if (bestConv) {
        points.push(`Best converting source: ${bestConv.source} at ${bestConv.convRate}% — ${bestConv.closed} wins from ${bestConv.total} leads`);
        if (bestConv.source !== mostVol?.source) {
          actions.push(`${bestConv.source} converts best but isn't your highest volume — invest more there`);
        }
      }
      if (bestRev && bestRev.source !== bestConv?.source) {
        points.push(`Most revenue from: ${bestRev.source} — ${f(bestRev.revenue)}`);
      }
      if (mostVol && mostVol.convRate < 10 && mostVol.total > 10) {
        points.push(`${mostVol.source} gives the most leads (${mostVol.total}) but only ${mostVol.convRate}% convert — low quality`);
        actions.push(`Audit lead quality from ${mostVol.source} — high volume + low conversion = wasted time`);
      }

      // Hidden gems
      const gems = sourcePerf.filter(s => s.convRate > 30 && s.total < avgVol && s.total > 0);
      if (gems.length > 0) {
        gems.forEach(g => {
          points.push(`Hidden gem: ${g.source} converts at ${g.convRate}% but you only get ${g.total} leads from it`);
          actions.push(`Scale up ${g.source} — it's converting at ${g.convRate}% and you're barely using it`);
        });
      }

      sourcePerf.slice(0, 6).forEach(s => {
        rows.push({
          label: s.source,
          sub:   `${s.total} leads · ${s.closed} closed · ${s.convRate}% conv · ${f(s.revenue)}`,
          tag:   s.convRate >= 30 ? "Top" : s.convRate >= 15 ? "Good" : "Low",
          tagColor: s.convRate >= 30 ? "emerald" : s.convRate >= 15 ? "blue" : "rose",
        });
      });
    }

    sections.push({
      id: "sources", category: "Lead Sources", icon: <Zap size={16}/>,
      verdict: sourcePerf.length === 0 ? "No source tracking — add sources to leads"
        : `Best source: ${[...sourcePerf].sort((a,b)=>b.convRate-a.convRate)[0]?.source} at ${[...sourcePerf].sort((a,b)=>b.convRate-a.convRate)[0]?.convRate}% conversion`,
      tone: sourcePerf.some(s => s.convRate > 25) ? "good" : "warn",
      points, actions, rows,
    });
  }

  return sections;
}

// ── Tag pill ────────────────────────────────────────────────────────────────
function Tag({ label, color }) {
  return <span className={`bi-tag bi-tag-${color}`}>{label}</span>;
}

// ── Row item ────────────────────────────────────────────────────────────────
function Row({ row }) {
  return (
    <div className="bi-row">
      <div className="bi-row-info">
        <span className="bi-row-label">{row.label}</span>
        <span className="bi-row-sub">{row.sub}</span>
      </div>
      <div className="bi-row-right">
        {row.tag && <Tag label={row.tag} color={row.tagColor || "amber"} />}
        {row.phone && (
          <a href={`tel:${row.phone}`} className="bi-call-btn" title="Call">
            <Phone size={13} />
          </a>
        )}
      </div>
    </div>
  );
}

// ── Intelligence card ───────────────────────────────────────────────────────
function Card({ section }) {
  const [open, setOpen] = useState(true);
  const toneIcon = {
    good: <CheckCircle size={15} className="tone-good" />,
    warn: <AlertCircle  size={15} className="tone-warn" />,
    bad:  <XCircle      size={15} className="tone-bad"  />,
  }[section.tone];

  return (
    <div className={`bi-card tone-${section.tone}`}>
      {/* Card header */}
      <div className="bi-card-head" onClick={() => setOpen(o => !o)}>
        <div className="bi-card-cat">
          {section.icon}
          <span>{section.category}</span>
        </div>
        <ChevronRight size={16} className={`bi-chevron ${open ? "open" : ""}`} />
      </div>

      {/* Verdict */}
      <div className="bi-verdict">
        {toneIcon}
        <span>{section.verdict}</span>
      </div>

      {open && (
        <>
          {/* Highlight metrics */}
          {section.highlights?.length > 0 && (
            <div className="bi-highlights">
              {section.highlights.map((h, i) => (
                <div key={i} className="bi-hl-item">
                  <span className="bi-hl-label">{h.label}</span>
                  <span className={`bi-hl-val color-${h.color}`}>{h.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Points */}
          {section.points?.length > 0 && (
            <ul className="bi-points">
              {section.points.map((p, i) => (
                <li key={i}><span className="bi-bullet">›</span>{p}</li>
              ))}
            </ul>
          )}

          {/* Named rows */}
          {section.rows?.length > 0 && (
            <div className="bi-rows">
              {section.rows.map((r, i) => <Row key={i} row={r} />)}
            </div>
          )}

          {/* Actions */}
          {section.actions?.length > 0 && (
            <div className="bi-actions">
              <div className="bi-actions-title">What to do</div>
              {section.actions.map((a, i) => (
                <div key={i} className="bi-action">
                  <ArrowRight size={12} />
                  <span>{a}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────
export default function BiReports() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [ts,      setTs]      = useState(null);

  const load = async () => {
    setLoading(true); setError(null);
    try {
      const r = await fetch(`${API}/api/bi/intelligence`, { headers: auth() });
      const j = await r.json();
      if (j.success) { setData(j.data); setTs(new Date()); }
      else setError(j.message || "Failed to load");
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const sections = data ? buildSections(data) : [];
  const L  = data?.leads      || {};
  const IN = data?.invoices    || {};
  const QT = data?.quotations  || {};
  const EN = data?.enquiries   || {};

  return (
    <div className="bi-layout">
      <Sidebar />
      <div className="bi-main">

        {/* Header */}
        <div className="bi-header">
          <div className="bi-header-left">
            <div className="bi-header-icon"><Brain size={20} /></div>
            <div>
              <h1>Business Intelligence</h1>
              <p>Real insights from your leads, invoices, quotations & enquiries</p>
            </div>
          </div>
          <div className="bi-header-right">
            {ts && <span className="bi-ts">Updated {ts.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</span>}
            <button className="bi-refresh" onClick={load} disabled={loading}>
              <RefreshCw size={13} className={loading ? "spinning" : ""} /> Refresh
            </button>
          </div>
        </div>

        {/* Strip */}
        {!loading && data && (
          <div className="bi-strip">
            {[
              { label: "Total Leads",   val: L.total,          color: "" },
              { label: "Deals Closed",  val: L.closed,         color: "indigo" },
              { label: "Conversion",    val: L.convRate + "%",  color: L.convRate >= 20 ? "emerald" : "amber" },
              { label: "Revenue",       val: f(L.totalValue),   color: "emerald" },
              { label: "Collected",     val: f(L.totalCollected), color: "blue" },
              { label: "Pending",       val: f(L.pendingBalance), color: "rose" },
              { label: "Invoices Due",  val: IN.overdueCount || 0, color: IN.overdueCount > 0 ? "rose" : "" },
              { label: "Quotations",    val: QT.sent + " sent", color: QT.sent > 0 ? "amber" : "" },
              { label: "Enquiries",     val: EN.uncontacted + " uncontacted", color: EN.uncontacted > 0 ? "rose" : "" },
            ].map((s, i) => (
              <div key={i} className="bi-strip-item">
                <span className="bi-strip-label">{s.label}</span>
                <span className={`bi-strip-val ${s.color}`}>{s.val}</span>
              </div>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="bi-body">
          {loading && (
            <div className="bi-state">
              <Brain size={38} className="spinning-slow" />
              <p>Reading your leads, invoices, quotations and enquiries…</p>
            </div>
          )}
          {error && (
            <div className="bi-state error">
              <AlertTriangle size={32} />
              <p>{error}</p>
              <button onClick={load}>Retry</button>
            </div>
          )}
          {!loading && !error && sections.length === 0 && (
            <div className="bi-state">
              <Brain size={38} />
              <p>No data found. Add leads and enquiries to start seeing intelligence.</p>
            </div>
          )}
          {!loading && sections.length > 0 && (
            <div className="bi-grid">
              {sections.map(s => <Card key={s.id} section={s} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
