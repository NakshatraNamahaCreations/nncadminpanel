import { useState, useEffect, useCallback } from "react";
import {
  ReceiptText, RefreshCw, Download, TrendingUp,
  IndianRupee, Users, FileCheck, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "../../utils/toast";
import Sidebar from "../../components/Sidebar/Sidebar";
import "./GstReport.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";
function auth() {
  const t = localStorage.getItem("nnc_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

const fmtINR = (n) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n || 0);

const fmtDate = (v) => {
  if (!v) return "—";
  try { return new Date(v).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }); }
  catch { return "—"; }
};

const MONTH_LABELS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function parseMonth(str) { // "YYYY-MM"
  const [y, m] = str.split("-").map(Number);
  return { year: y, mon: m };
}
function toMonthStr(year, mon) {
  return `${year}-${String(mon).padStart(2, "0")}`;
}

export default function GstReport() {
  const now = new Date();
  const [month, setMonth] = useState(toMonthStr(now.getFullYear(), now.getMonth() + 1));
  const [loading, setLoading] = useState(false);
  const [data, setData]       = useState(null);
  const [tab, setTab]         = useState("gst"); // "gst" | "nongst"

  const { year, mon } = parseMonth(month);
  const monthLabel = `${MONTH_LABELS[mon - 1]} ${year}`;

  const changeMonth = (delta) => {
    let nm = mon + delta, ny = year;
    if (nm > 12) { nm = 1; ny++; }
    if (nm < 1)  { nm = 12; ny--; }
    setMonth(toMonthStr(ny, nm));
  };

  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const res  = await fetch(`${API_BASE}/api/gst-report?month=${month}`, { headers: auth() });
      const json = await res.json();
      if (!res.ok || !json?.success) throw new Error(json?.message || "Failed");
      setData(json);
    } catch (e) {
      toast.error(e?.message || "Failed to fetch GST report");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const summary     = data?.summary     || {};
  const gstLeads    = data?.gstLeads    || [];
  const nonGstLeads = data?.nonGstLeads || [];

  const exportCsv = (rows, filename) => {
    if (!rows.length) { toast.warning("No data to export"); return; }
    const skip = ["_id"];
    const keys = Object.keys(rows[0]).filter(k => !skip.includes(k));
    const csv  = [keys.join(","), ...rows.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(","))].join("\n");
    const a    = document.createElement("a");
    a.href     = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = filename; a.click();
  };

  return (
    <div className="gst-layout">
      <Sidebar />
      <div className="gst-main">

        {/* ── Top bar ── */}
        <div className="gst-topbar">
          <div className="gst-topbar-left">
            <div className="gst-icon-wrap"><ReceiptText size={20} color="#fff" /></div>
            <div>
              <div className="gst-page-title">GST Report</div>
              <div className="gst-page-sub">Monthly tax summary based on payments received</div>
            </div>
          </div>

          <div className="gst-topbar-right">
            {/* Month navigator */}
            <div className="gst-month-nav">
              <button className="gst-nav-btn" onClick={() => changeMonth(-1)}><ChevronLeft size={16} /></button>
              <div className="gst-month-label">{monthLabel}</div>
              <button className="gst-nav-btn" onClick={() => changeMonth(1)} disabled={month >= toMonthStr(now.getFullYear(), now.getMonth() + 1)}>
                <ChevronRight size={16} />
              </button>
            </div>

            <input
              type="month"
              value={month}
              max={toMonthStr(now.getFullYear(), now.getMonth() + 1)}
              onChange={e => e.target.value && setMonth(e.target.value)}
              className="gst-month-input"
            />

            <button className="gst-refresh-btn" onClick={fetchReport} disabled={loading}>
              <RefreshCw size={14} className={loading ? "gst-spin" : ""} />
              {loading ? "Loading…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* ── Summary cards ── */}
        <div className="gst-cards">
          <SumCard
            icon={<IndianRupee size={18} />}
            label="GST Payable"
            value={fmtINR(summary.totalGstPayable)}
            sub={`18% of taxable amount`}
            color="blue"
          />
          <SumCard
            icon={<TrendingUp size={18} />}
            label="Taxable Amount"
            value={fmtINR(summary.totalGstTaxable)}
            sub="Payment received (excl. GST)"
            color="green"
          />
          <SumCard
            icon={<FileCheck size={18} />}
            label="Total GST Invoiced"
            value={fmtINR(summary.totalGstInvoiced)}
            sub="Taxable + GST"
            color="purple"
          />
          <SumCard
            icon={<IndianRupee size={18} />}
            label="Non-GST Payments"
            value={fmtINR(summary.totalNonGstAmount)}
            sub="No tax applicable"
            color="amber"
          />
          <SumCard
            icon={<Users size={18} />}
            label="GST Clients"
            value={summary.gstLeadCount || 0}
            sub={`Non-GST: ${summary.nonGstLeadCount || 0}`}
            color="indigo"
          />
        </div>

        {/* ── GST breakdown bar ── */}
        {(summary.totalGstInvoiced > 0 || summary.totalNonGstAmount > 0) && (
          <div className="gst-breakdown-card">
            <div className="gst-breakdown-label">Payment Mix — {monthLabel}</div>
            <div className="gst-breakdown-bar-wrap">
              {(() => {
                const total = (summary.totalGstInvoiced || 0) + (summary.totalNonGstAmount || 0);
                const gstPct = total > 0 ? ((summary.totalGstInvoiced / total) * 100).toFixed(1) : 0;
                const nonPct = total > 0 ? (100 - gstPct).toFixed(1) : 0;
                return (
                  <>
                    <div className="gst-breakdown-bar">
                      <div className="gst-bar-gst"   style={{ width: `${gstPct}%` }} />
                      <div className="gst-bar-nongst" style={{ width: `${nonPct}%` }} />
                    </div>
                    <div className="gst-breakdown-legend">
                      <span className="gst-legend-dot blue" /> GST payments {gstPct}% ({fmtINR(summary.totalGstInvoiced)})
                      &nbsp;&nbsp;
                      <span className="gst-legend-dot amber" /> Non-GST {nonPct}% ({fmtINR(summary.totalNonGstAmount)})
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {/* ── Tabs ── */}
        <div className="gst-tab-bar">
          <button className={`gst-tab ${tab === "gst" ? "active" : ""}`} onClick={() => setTab("gst")}>
            GST Payments
            <span className="gst-tab-badge blue">{gstLeads.length}</span>
          </button>
          <button className={`gst-tab ${tab === "nongst" ? "active" : ""}`} onClick={() => setTab("nongst")}>
            Non-GST Payments
            <span className="gst-tab-badge amber">{nonGstLeads.length}</span>
          </button>

          <div className="gst-tab-spacer" />

          <button
            className="gst-export-btn"
            onClick={() => tab === "gst"
              ? exportCsv(gstLeads, `gst-payments-${month}.csv`)
              : exportCsv(nonGstLeads, `non-gst-payments-${month}.csv`)
            }
          >
            <Download size={13} /> Export CSV
          </button>
        </div>

        {/* ── Table ── */}
        <div className="gst-table-card">
          {tab === "gst" ? (
            gstLeads.length === 0
              ? <EmptyState label="No GST payments received" sub={`No leads with GST have a payment recorded for ${monthLabel}`} />
              : (
                <div className="gst-table-scroll">
                  <table className="gst-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Client</th>
                        <th>Business / Company</th>
                        <th>Branch</th>
                        <th>GST Rate</th>
                        <th>Payment (Taxable)</th>
                        <th>GST Amount</th>
                        <th>Total Bill</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gstLeads.map((l, i) => (
                        <tr key={l._id || i}>
                          <td className="gst-td-num">{i + 1}</td>
                          <td>
                            <div className="gst-client-name">{l.name}</div>
                            <div className="gst-client-phone">{l.phone}</div>
                          </td>
                          <td>{l.company || "—"}</td>
                          <td><span className="gst-branch-pill">{l.branch}</span></td>
                          <td><span className="gst-rate-pill">{l.gstRate}%</span></td>
                          <td className="gst-td-amt">{fmtINR(l.paymentReceived)}</td>
                          <td className="gst-td-gst">{fmtINR(l.gstAmount)}</td>
                          <td className="gst-td-amt">{fmtINR(l.totalBill)}</td>
                          <td className="gst-td-date">{fmtDate(l.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="gst-tfoot-row">
                        <td colSpan={5} className="gst-tfoot-label">Month Total</td>
                        <td className="gst-td-amt">{fmtINR(summary.totalGstTaxable)}</td>
                        <td className="gst-td-gst gst-tfoot-gst">{fmtINR(summary.totalGstPayable)}</td>
                        <td className="gst-td-amt">{fmtINR(summary.totalGstInvoiced)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
          ) : (
            nonGstLeads.length === 0
              ? <EmptyState label="No non-GST payments received" sub={`No leads without GST have a payment for ${monthLabel}`} />
              : (
                <div className="gst-table-scroll">
                  <table className="gst-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Client</th>
                        <th>Business / Company</th>
                        <th>Branch</th>
                        <th>Payment Received</th>
                        <th>Payment Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {nonGstLeads.map((l, i) => (
                        <tr key={l._id || i}>
                          <td className="gst-td-num">{i + 1}</td>
                          <td>
                            <div className="gst-client-name">{l.name}</div>
                            <div className="gst-client-phone">{l.phone}</div>
                          </td>
                          <td>{l.company || "—"}</td>
                          <td><span className="gst-branch-pill">{l.branch}</span></td>
                          <td className="gst-td-amt">{fmtINR(l.paymentReceived)}</td>
                          <td className="gst-td-date">{fmtDate(l.paymentDate)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="gst-tfoot-row">
                        <td colSpan={4} className="gst-tfoot-label">Month Total</td>
                        <td className="gst-td-amt">{fmtINR(summary.totalNonGstAmount)}</td>
                        <td />
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
          )}
        </div>

      </div>
    </div>
  );
}

function SumCard({ icon, label, value, sub, color }) {
  return (
    <div className={`gst-sum-card gst-sum-${color}`}>
      <div className="gst-sum-icon">{icon}</div>
      <div className="gst-sum-body">
        <div className="gst-sum-label">{label}</div>
        <div className="gst-sum-value">{value}</div>
        <div className="gst-sum-sub">{sub}</div>
      </div>
    </div>
  );
}

function EmptyState({ label, sub }) {
  return (
    <div className="gst-empty">
      <ReceiptText size={40} color="#d1d5db" />
      <div className="gst-empty-label">{label}</div>
      <div className="gst-empty-sub">{sub}</div>
    </div>
  );
}
