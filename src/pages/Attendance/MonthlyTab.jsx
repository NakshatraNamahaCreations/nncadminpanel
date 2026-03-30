import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "../../utils/toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function authHeader() {
  const t = localStorage.getItem("nnc_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function formatDate(year, month, day) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function statusAbbr(status) {
  const m = { present: "P", absent: "A", late: "L", "half-day": "½", leave: "Lv", holiday: "Ho" };
  return m[status] || "";
}

function statusCellClass(status) {
  const m = { present: "att-cell-P", absent: "att-cell-A", late: "att-cell-L", "half-day": "att-cell-HD", leave: "att-cell-Lv", holiday: "att-cell-Ho" };
  return m[status] || "att-cell-empty";
}

export default function MonthlyTab({ branch }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [report, setReport] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchMonthly = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ month, year });
      if (branch) p.set("branch", branch);
      const res  = await fetch(`${API}/api/attendance/monthly?${p}`, { headers: authHeader() });
      const json = await res.json();
      if (res.ok && json.success) setReport(json.data || []);
      else toast.error(json.message || "Failed to load monthly report");
    } catch {
      toast.error("Failed to load monthly report");
    } finally { setLoading(false); }
  }, [month, year, branch]);

  useEffect(() => { fetchMonthly(); }, [fetchMonthly]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  const totalDays = getDaysInMonth(year, month);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

  return (
    <>
      {/* Toolbar */}
      <div className="att-toolbar">
        <div className="att-month-nav">
          <button className="att-month-nav-btn" onClick={prevMonth}><ChevronLeft size={15} /></button>
          <span className="att-month-label">{MONTH_NAMES[month - 1]} {year}</span>
          <button className="att-month-nav-btn" onClick={nextMonth}><ChevronRight size={15} /></button>
        </div>
        {branch && (
          <span style={{ fontSize: 13, fontWeight: 600, color: "#475569", background: "#f1f5f9", padding: "6px 12px", borderRadius: 8 }}>{branch}</span>
        )}
        <div className="att-toolbar-right">
          <button className="att-btn-sec" onClick={fetchMonthly}>
            <RefreshCcw size={13} className={loading ? "att-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Report Table */}
      <div className="att-card">
        <div className="att-card-head">
          <span className="att-card-title">Monthly Report — {MONTH_NAMES[month - 1]} {year}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{report.length} employees</span>
        </div>

        {loading ? (
          <div className="att-loading"><RefreshCcw size={26} className="att-spin" /></div>
        ) : report.length === 0 ? (
          <div className="att-empty">
            <div className="att-empty-text">No data for this period</div>
            <div className="att-empty-sub">Mark attendance in the Daily tab first</div>
          </div>
        ) : (
          <div className="att-monthly-table-wrap">
            <table className="att-monthly-table">
              <thead>
                <tr>
                  <th className="emp-col">Employee</th>
                  {days.map(d => <th key={d}>{d}</th>)}
                  <th title="Present">P</th>
                  <th title="Absent">A</th>
                  <th title="Late">L</th>
                  <th title="Half-Day">½</th>
                </tr>
              </thead>
              <tbody>
                {report.map(row => {
                  const emp = row.employee || {};
                  const daysMap = row.days || {};
                  const summary = row.summary || {};
                  return (
                    <tr key={emp._id || emp.employeeId}>
                      <td className="emp-col">
                        <div className="att-emp-name" style={{ fontSize: 13 }}>{emp.name || "—"}</div>
                        <div className="att-emp-id">{emp.employeeId || ""}</div>
                      </td>
                      {days.map(d => {
                        const dateKey = formatDate(year, month, d);
                        const rec = daysMap[dateKey];
                        const status = (rec && typeof rec === "object" ? rec.status : rec) || "";
                        const abbr = statusAbbr(status);
                        const cls  = statusCellClass(status);
                        return (
                          <td key={d} style={{ padding: "6px 4px" }}>
                            {abbr ? (
                              <span className={`att-cell ${cls}`}>{abbr}</span>
                            ) : (
                              <span className="att-cell att-cell-empty">·</span>
                            )}
                          </td>
                        );
                      })}
                      <td className="att-sum-col att-sum-P">{summary.present || 0}</td>
                      <td className="att-sum-col att-sum-A">{summary.absent || 0}</td>
                      <td className="att-sum-col att-sum-L">{summary.late || 0}</td>
                      <td className="att-sum-col att-sum-H">{summary.halfDay || summary["half-day"] || 0}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Legend */}
        <div style={{ padding: "10px 20px", borderTop: "1px solid #f1f5f9" }}>
          <div className="att-legend">
            <div className="att-legend-item">
              <span className="att-legend-dot att-cell att-cell-P">P</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Present</span>
            </div>
            <div className="att-legend-item">
              <span className="att-legend-dot att-cell att-cell-A">A</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Absent</span>
            </div>
            <div className="att-legend-item">
              <span className="att-legend-dot att-cell att-cell-L">L</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Late</span>
            </div>
            <div className="att-legend-item">
              <span className="att-legend-dot att-cell att-cell-HD">½</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Half-Day</span>
            </div>
            <div className="att-legend-item">
              <span className="att-legend-dot att-cell att-cell-Lv">Lv</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Leave</span>
            </div>
            <div className="att-legend-item">
              <span className="att-legend-dot att-cell att-cell-Ho">Ho</span>
              <span style={{ fontSize: 12, color: "#475569" }}>Holiday</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
