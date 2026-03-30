import { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import LeadDrawer from "../../Leads/LeadDrawer";
import { Download, Eye, Search, X, RefreshCcw } from "lucide-react";
import "./PaymentTracker.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";
function auth() { const t = localStorage.getItem("nnc_token"); return t ? { Authorization: `Bearer ${t}` } : {}; }

const money = (n) => {
  if (n == null || n === 0) return "₹0";
  return `₹${Number(n).toLocaleString("en-IN")}`;
};

const fmtDate = (v) => {
  if (!v) return "-";
  try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "-"; }
};

const getPayStatus = (value, advance) => {
  const v = Number(value || 0), a = Number(advance || 0);
  if (v === 0) return "no-value";
  if (a >= v)  return "paid";
  if (a > 0)   return "partial";
  return "unpaid";
};

const STATUS_LABEL = { paid: "Paid", partial: "Partial", unpaid: "Unpaid", "no-value": "-" };

const cls = (s = "") => String(s).toLowerCase().replace(/\s+/g, "-");

const BRANCHES   = ["All", "Mysore", "Bangalore", "Mumbai"];
const STAGES     = ["All", "Lead Capture", "Reachable", "Qualified", "Proposal", "Closed"];
const PAY_STATUS = ["All", "Paid", "Partial", "Unpaid"];

export default function PaymentTracker() {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [err, setErr]           = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [repOptions, setRepOptions] = useState(["All"]);

  const [filters, setFilters] = useState({
    branch: "All", stage: "All", payStatus: "All", rep: "All", q: "",
  });

  const fetchLeads = async () => {
    try {
      setLoading(true); setErr("");
      const p = new URLSearchParams();
      if (filters.branch !== "All") p.set("branch", filters.branch);
      if (filters.stage  !== "All") p.set("stage",  filters.stage);
      if (filters.rep    !== "All") p.set("rep",     filters.rep);
      if (filters.q.trim())         p.set("q",       filters.q.trim());

      const res  = await fetch(`${API_BASE}/api/leads?${p}`, { headers: auth() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");

      const mapped = (json.data || []).map((x) => ({
        id:               x._id,
        name:             x.name || "-",
        phone:            x.phone || "-",
        business:         x.business || "-",
        branch:           x.branch || "-",
        stage:            x.stage || "-",
        rep:              x.rep || "-",
        value:            Number(x.value || 0),
        advanceReceived:  Number(x.advanceReceived || 0),
        remaining:        Math.max(0, Number(x.value || 0) - Number(x.advanceReceived || 0)),
        onboardedDate:    x.onboardedDate || null,
        projectCompleted: Boolean(x.projectCompleted),
        createdAt:        x.createdAt || null,
        payStatus:        getPayStatus(x.value, x.advanceReceived),
      }));

      setRows(mapped);
    } catch (e) {
      setErr(e.message || "Failed to fetch"); setRows([]);
    } finally { setLoading(false); }
  };

  const fetchReps = async () => {
    try {
      const res  = await fetch(`${API_BASE}/api/reps`, { headers: auth() });
      const json = await res.json();
      if (!res.ok || !json?.success) return;
      const names = (Array.isArray(json.data) ? json.data : [])
        .map((r) => (typeof r === "string" ? r : r?.name || "").trim())
        .filter(Boolean);
      setRepOptions(["All", ...Array.from(new Set(names))]);
    } catch { setRepOptions(["All"]); }
  };

  useEffect(() => { fetchReps(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchLeads(); }, [filters.branch, filters.stage, filters.rep, filters.q]);

  const filtered = useMemo(() => {
    if (filters.payStatus === "All") return rows;
    const target = filters.payStatus.toLowerCase();
    return rows.filter((r) => STATUS_LABEL[r.payStatus]?.toLowerCase() === target);
  }, [rows, filters.payStatus]);

  const totals = useMemo(() => ({
    agreed:    filtered.reduce((a, b) => a + b.value, 0),
    advance:   filtered.reduce((a, b) => a + b.advanceReceived, 0),
    remaining: filtered.reduce((a, b) => a + b.remaining, 0),
    paid:      filtered.filter((r) => r.payStatus === "paid").length,
    partial:   filtered.filter((r) => r.payStatus === "partial").length,
    unpaid:    filtered.filter((r) => r.payStatus === "unpaid").length,
  }), [filtered]);

  const handleExport = () => {
    try {
      setExporting(true);
      const headers = ["Name","Phone","Business","Branch","Stage","Rep","Total Amount","Advance","Remaining","Pay Status","Onboarded","Project Done"];
      const csv = [headers.join(","), ...filtered.map((r) =>
        [r.name, r.phone, r.business, r.branch, r.stage, r.rep,
         r.value, r.advanceReceived, r.remaining,
         STATUS_LABEL[r.payStatus] || "-", fmtDate(r.onboardedDate), r.projectCompleted ? "Yes" : "No",
        ].map((v) => `"${v}"`).join(",")
      )].join("\n");
      const a = document.createElement("a");
      a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
      a.download = `payments-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
    } finally { setExporting(false); }
  };

  return (
    <div className="ptLayout">
      <Sidebar />
      <div className="ptMain">
        <div className="ptBody">

          {/* ── Summary cards ── */}
          <div className="ptSummaryRow">
            {[
              { label: "Total Agreed",      val: money(totals.agreed),    accent: "blue"   },
              { label: "Advance Received",  val: money(totals.advance),   accent: "green"  },
              { label: "Remaining Balance", val: money(totals.remaining), accent: "red"    },
              { label: "Fully Paid",        val: totals.paid,             accent: "teal"   },
              { label: "Partial",           val: totals.partial,          accent: "orange" },
              { label: "Unpaid",            val: totals.unpaid,           accent: "gray"   },
            ].map((c) => (
              <div key={c.label} className={`ptSumCard ${c.accent}`}>
                <div className="ptSumLabel">{c.label}</div>
                <div className="ptSumValue">{c.val}</div>
              </div>
            ))}
          </div>

          {/* ── Filter bar ── */}
          <div className="ptFilterCard">
            <div className="ptFilterLeft">
              <div className="ptFilterLabel">FILTER</div>

              <select value={filters.branch} onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}>
                {BRANCHES.map((x) => <option key={x}>{x === "All" ? "All Branches" : x}</option>)}
              </select>

              <select value={filters.stage} onChange={(e) => setFilters((p) => ({ ...p, stage: e.target.value }))}>
                {STAGES.map((x) => <option key={x} value={x}>{x === "All" ? "All Stages" : x}</option>)}
              </select>

              <select value={filters.payStatus} onChange={(e) => setFilters((p) => ({ ...p, payStatus: e.target.value }))}>
                {PAY_STATUS.map((x) => <option key={x} value={x}>{x === "All" ? "Pay Status" : x}</option>)}
              </select>

              <select value={filters.rep} onChange={(e) => setFilters((p) => ({ ...p, rep: e.target.value }))}>
                {repOptions.map((x) => <option key={x} value={x}>{x === "All" ? "All Reps" : x}</option>)}
              </select>

              <div className="ptSearchWrap">
                <Search size={13} className="ptSearchIcon" />
                <input
                  className="ptSearch"
                  placeholder="Search name / phone / business"
                  value={filters.q}
                  onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                />
                {filters.q && (
                  <button type="button" className="ptSearchClear" onClick={() => setFilters((p) => ({ ...p, q: "" }))}>
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            <div className="ptFilterRight">
              <button type="button" className="ptRefreshBtn" onClick={fetchLeads} disabled={loading}>
                <RefreshCcw size={13} /> Refresh
              </button>
              <button type="button" className="ptExportBtn" onClick={handleExport} disabled={exporting}>
                <Download size={13} /> {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>

          {loading && <div className="ptStatusBox">Loading payments...</div>}
          {err     && <div className="ptStatusBox ptErrorBox">{err}</div>}

          {/* ── Table ── */}
          <div className="ptTableCard">
            <div className="ptTableScroll">
              <table className="ptTable">
                <thead>
                  <tr>
                    <th>Lead / Contact</th>
                    <th>Business</th>
                    <th>Branch</th>
                    <th>Stage</th>
                    <th>Rep</th>
                    <th>Total Amount</th>
                    <th>Advance Rec'd</th>
                    <th>Remaining</th>
                    <th>Pay Status</th>
                    <th>Onboarded</th>
                    <th>Project</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {!loading && filtered.length === 0 && (
                    <tr><td colSpan={12} className="ptEmpty">No records found.</td></tr>
                  )}
                  {filtered.map((r) => (
                    <tr key={r.id} className="ptRow" onClick={() => { setSelectedId(r.id); setDrawerOpen(true); }}>
                      <td>
                        <div className="ptLeadName">{r.name}</div>
                        <div className="ptLeadPhone">{r.phone}</div>
                      </td>
                      <td className="ptTrunc">{r.business}</td>
                      <td><span className={`ptPill branch ${cls(r.branch)}`}>{r.branch}</span></td>
                      <td><span className={`ptPill stage ${cls(r.stage)}`}>{r.stage}</span></td>
                      <td>{r.rep}</td>
                      <td className="ptAmtTotal">{money(r.value)}</td>
                      <td className="ptAmtAdv">
                        {r.advanceReceived > 0 ? money(r.advanceReceived) : <span className="ptDash">-</span>}
                      </td>
                      <td className={`ptAmtRem ${r.remaining > 0 ? "has" : ""}`}>
                        {r.remaining > 0 ? money(r.remaining) : <span className="ptDash">₹0</span>}
                      </td>
                      <td>
                        {r.payStatus !== "no-value"
                          ? <span className={`ptPayBadge ${r.payStatus}`}>{STATUS_LABEL[r.payStatus]}</span>
                          : <span className="ptDash">-</span>}
                      </td>
                      <td>{fmtDate(r.onboardedDate)}</td>
                      <td>
                        <span className={`ptProjectBadge ${r.projectCompleted ? "done" : "open"}`}>
                          {r.projectCompleted ? "✓ Done" : "Active"}
                        </span>
                      </td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <button type="button" className="ptViewBtn"
                          onClick={() => { setSelectedId(r.id); setDrawerOpen(true); }}>
                          <Eye size={13} /> View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>

      <LeadDrawer
        open={drawerOpen}
        leadId={selectedId}
        apiBase={API_BASE}
        onClose={() => { setDrawerOpen(false); setSelectedId(null); }}
        onLeadUpdated={fetchLeads}
      />
    </div>
  );
}
