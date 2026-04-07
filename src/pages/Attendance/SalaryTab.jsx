import { useCallback, useEffect, useState } from "react";
import {
  RefreshCcw, ChevronLeft, ChevronRight, Eye, Download, Check, X,
} from "lucide-react";
import { toast } from "../../utils/toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BRANCHES = ["Bangalore", "Mysore", "Mumbai"];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function authHeader() {
  const t = localStorage.getItem("nnc_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function fmtINR(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function SalaryTab({ branch }) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [salaryRecords, setSalaryRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [filterBranch, setFilterBranch] = useState(branch || "");

  const fetchSalary = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ month, year });
      if (filterBranch) p.set("branch", filterBranch);
      const res  = await fetch(`${API}/api/attendance/salary?${p}`, { headers: authHeader() });
      const json = await res.json();
      if (res.ok && json.success) setSalaryRecords(json.data || []);
      else toast.error(json.message || "Failed to load salary data");
    } catch { toast.error("Failed to load salary data"); }
    finally { setLoading(false); }
  }, [month, year, filterBranch]);

  useEffect(() => { fetchSalary(); }, [fetchSalary]);
  useEffect(() => { setFilterBranch(branch || ""); }, [branch]);

  const generateBulk = async () => {
    if (!window.confirm(`Generate salaries for all employees for ${MONTH_NAMES[month - 1]} ${year}?`)) return;
    setGenerating(true);
    try {
      const res  = await fetch(`${API}/api/attendance/salary/generate-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ month, year, branch: filterBranch }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Generation failed");
        return;
      }
      const { generated = [], errors = [] } = json.data || {};
      if (errors.length > 0) {
        toast.error(`${generated.length} generated, ${errors.length} failed: ${errors.map(e => e.name || e.employeeId).join(", ")}`);
      } else {
        toast.success(`${generated.length} salaries generated!`);
      }
      fetchSalary();
    } catch { toast.error("Generation failed"); }
    finally { setGenerating(false); }
  };

  const generateSingle = async (employeeId) => {
    try {
      const res  = await fetch(`${API}/api/attendance/salary/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ employeeId, month, year }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Generation failed");
        return;
      }
      toast.success("Salary generated!");
      fetchSalary();
    } catch { toast.error("Generation failed"); }
  };

  const markPaid = async (id) => {
    try {
      const res  = await fetch(`${API}/api/attendance/salary/${id}/paid`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to update");
        return;
      }
      toast.success("Marked as paid!");
      fetchSalary();
    } catch { toast.error("Failed to update payment status"); }
  };

  const downloadSlip = async (id, empName) => {
    try {
      const res = await fetch(`${API}/api/attendance/salary/${id}/slip-pdf`, { headers: authHeader() });
      if (!res.ok) {
        // Try to parse JSON error from backend
        let errMsg = "Failed to download slip";
        try {
          const contentType = res.headers.get("content-type") || "";
          if (contentType.includes("application/json")) {
            const json = await res.json();
            errMsg = json.message || errMsg;
          }
        } catch { /* ignore parse error */ }
        toast.error(errMsg);
        return;
      }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url;
      a.download = `salary-slip-${empName || id}-${MONTH_NAMES[month - 1]}-${year}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { toast.error("Failed to download slip"); }
  };

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <>
      {/* Toolbar */}
      <div className="att-toolbar">
        <div className="att-period-nav">
          <button className="att-period-nav-btn" onClick={prevMonth}><ChevronLeft size={14} /></button>
          <span className="att-period-label">{MONTH_NAMES[month - 1]} {year}</span>
          <button className="att-period-nav-btn" onClick={nextMonth}><ChevronRight size={14} /></button>
        </div>
        <select
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }}
          value={filterBranch}
          onChange={e => setFilterBranch(e.target.value)}
        >
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="att-toolbar-right">
          <button className="att-btn-sec" onClick={fetchSalary}>
            <RefreshCcw size={13} className={loading ? "att-spin" : ""} /> Refresh
          </button>
          <button className="att-btn-prim" onClick={generateBulk} disabled={generating}>
            {generating ? <RefreshCcw size={13} className="att-spin" /> : <Check size={13} />}
            {generating ? "Generating…" : "Generate All Salaries"}
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="att-card">
        <div className="att-card-head">
          <span className="att-card-title">Salary — {MONTH_NAMES[month - 1]} {year}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>{salaryRecords.length} records</span>
        </div>

        {/* Summary strip */}
        {!loading && salaryRecords.length > 0 && (() => {
          const totalGross       = salaryRecords.reduce((s, r) => s + (r.grossSalary || 0), 0);
          const totalPFEmployee  = salaryRecords.reduce((s, r) => s + (r.pfEmployee || 0), 0);
          const totalPFEmployer  = salaryRecords.reduce((s, r) => s + (r.pfEmployer || 0), 0);
          const totalESI         = salaryRecords.reduce((s, r) => s + (r.esi || 0), 0);
          const totalPT          = salaryRecords.reduce((s, r) => s + (r.professionalTax || 0), 0);
          const totalDeduct      = salaryRecords.reduce((s, r) => s + (r.totalDeduction || 0), 0);
          const totalNet         = salaryRecords.reduce((s, r) => s + (r.netSalary || 0), 0);
          const pendingNet       = salaryRecords.filter(r => r.status !== "paid").reduce((s, r) => s + (r.netSalary || 0), 0);
          const paidNet          = salaryRecords.filter(r => r.status === "paid").reduce((s, r) => s + (r.netSalary || 0), 0);
          // Total PF liability = employee + employer (company must remit both)
          const totalPFLiability = totalPFEmployee + totalPFEmployer;
          return (
            <div className="att-sal-summary-strip">
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">Gross Payroll</span>
                <span className="att-sal-sum-val blue">{fmtINR(totalGross)}</span>
              </div>
              <div className="att-sal-sum-divider" />
              {/* PF block */}
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">PF — Employee (deducted)</span>
                <span className="att-sal-sum-val red">{fmtINR(totalPFEmployee)}</span>
              </div>
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">PF — Employer (company pays)</span>
                <span className="att-sal-sum-val orange">{fmtINR(totalPFEmployer)}</span>
              </div>
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">Total PF Remittance</span>
                <span className="att-sal-sum-val purple">{fmtINR(totalPFLiability)}</span>
              </div>
              <div className="att-sal-sum-divider" />
              {totalESI > 0 && (
                <div className="att-sal-sum-item">
                  <span className="att-sal-sum-label">ESI (Employee)</span>
                  <span className="att-sal-sum-val red">{fmtINR(totalESI)}</span>
                </div>
              )}
              {totalPT > 0 && (
                <div className="att-sal-sum-item">
                  <span className="att-sal-sum-label">Professional Tax</span>
                  <span className="att-sal-sum-val red">{fmtINR(totalPT)}</span>
                </div>
              )}
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">Total Deductions</span>
                <span className="att-sal-sum-val red">{fmtINR(totalDeduct)}</span>
              </div>
              <div className="att-sal-sum-divider" />
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">Net Amount to Pay</span>
                <span className="att-sal-sum-val green">{fmtINR(totalNet)}</span>
              </div>
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">Pending</span>
                <span className="att-sal-sum-val amber">{fmtINR(pendingNet)}</span>
              </div>
              <div className="att-sal-sum-item">
                <span className="att-sal-sum-label">Paid</span>
                <span className="att-sal-sum-val teal">{fmtINR(paidNet)}</span>
              </div>
            </div>
          );
        })()}

        {loading ? (
          <div className="att-loading"><RefreshCcw size={26} className="att-spin" /></div>
        ) : salaryRecords.length === 0 ? (
          <div className="att-empty">
            <div className="att-empty-text">No salary records for this period</div>
            <div className="att-empty-sub">Click "Generate All Salaries" to create salary records</div>
          </div>
        ) : (
          <div className="att-table-wrap">
            <table className="att-table att-salary-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Branch</th>
                  <th>Department</th>
                  <th>P</th>
                  <th>A</th>
                  <th>L</th>
                  <th>H-D</th>
                  <th>Gross (₹)</th>
                  <th>Deduction (₹)</th>
                  <th>Net Salary (₹)</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {salaryRecords.map(rec => {
                  const isPaid = rec.status === "paid";
                  return (
                    <tr key={rec._id}>
                      <td>
                        <div className="att-emp-name">{rec.employeeName || "—"}</div>
                        <div className="att-emp-id">{rec.employeeCode || ""}</div>
                      </td>
                      <td style={{ fontSize: 12 }}>{rec.branch || "—"}</td>
                      <td style={{ fontSize: 12, color: "#64748b" }}>{rec.department || "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#065f46" }}>{rec.presentDays ?? "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#991b1b" }}>{rec.absentDays ?? "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#b45309" }}>{rec.lateDays ?? "—"}</td>
                      <td style={{ textAlign: "center", fontWeight: 700, color: "#9a3412" }}>{rec.halfDays ?? "—"}</td>
                      <td className="att-gross">{fmtINR(rec.grossSalary)}</td>
                      <td className="att-deduct">{fmtINR(rec.totalDeduction)}</td>
                      <td className="att-net">{fmtINR(rec.netSalary)}</td>
                      <td>
                        <span className={`att-salary-st ${isPaid ? "att-salary-st-paid" : "att-salary-st-pending"}`}>
                          {isPaid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            className="att-icon-btn"
                            title="Preview Slip"
                            onClick={() => { setSelectedRecord(rec); setPreviewOpen(true); }}
                          >
                            <Eye size={14} />
                          </button>
                          <button
                            className="att-icon-btn"
                            title="Download PDF"
                            onClick={() => downloadSlip(rec._id, rec.employeeName)}
                          >
                            <Download size={14} />
                          </button>
                          {!isPaid && (
                            <button
                              className="att-icon-btn green"
                              title="Mark Paid"
                              onClick={() => markPaid(rec._id)}
                            >
                              <Check size={14} />
                            </button>
                          )}
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

      {/* Salary Slip Preview Modal */}
      {previewOpen && selectedRecord && (
        <SlipModal
          record={selectedRecord}
          month={month}
          year={year}
          onClose={() => { setPreviewOpen(false); setSelectedRecord(null); }}
          onDownload={() => downloadSlip(selectedRecord._id, selectedRecord.employee?.name)}
        />
      )}
    </>
  );
}

/* ── Salary Slip Modal ───────────────────────────────────── */
function SlipModal({ record, month, year, onClose, onDownload }) {
  const MONTH_NAMES_FULL = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  function fmtINR(n) {
    const v = Number(n) || 0;
    return `₹${v.toLocaleString("en-IN")}`;
  }

  // All employee info is stored directly on the SalaryRecord
  const empName      = record.employeeName  || "—";
  const empCode      = record.employeeCode  || "—";
  const empBranch    = record.branch        || "—";
  const empDept      = record.department    || "—";
  const empDesig     = record.designation   || "—";

  const gross          = Number(record.grossSalary)        || 0;
  const basic          = Number(record.basicSalary)        || Math.round(gross * 0.40);
  const hra            = Number(record.hra)                || Math.round(basic * 0.40);
  const da             = Number(record.da)                 || Math.round(basic * 0.10);
  const specialAllow   = gross - basic - hra - da;
  const absentDeduct   = Number(record.absentDeduction)    || 0;
  const halfDeduct     = Number(record.halfDayDeduction)   || 0;
  const leaveDeduct    = Number(record.leaveDeduction)     || 0;
  const excessLeave    = Number(record.excessLeaveDays)    || 0;
  const leaveEntitle   = Number(record.monthlyLeaveEntitlement) || 1.5;
  const pfEmployee     = Number(record.pfEmployee)         || 0;
  const esiAmount      = Number(record.esi)                || 0;
  const professionalTx = Number(record.professionalTax)    || 0;
  const totalDeduct    = Number(record.totalDeduction)     || 0;
  const net            = Number(record.netSalary)          || 0;
  const calDays        = Number(record.daysInMonth)        || new Date(year, month, 0).getDate();
  const daysAttended   = (record.presentDays || 0) + (record.lateDays || 0) + (record.halfDays || 0);

  return (
    <div className="att-modal-overlay" onClick={onClose}>
      <div className="att-modal att-modal-lg att-slip" onClick={e => e.stopPropagation()}>
        <div className="att-modal-head">
          <span className="att-modal-title">Salary Slip</span>
          <button className="att-modal-close" onClick={onClose}><X size={16} /></button>
        </div>

        <div className="att-modal-body">
          {/* Company header */}
          <div className="att-slip-header">
            <div className="att-slip-company">Nakshatra Namaha Creations</div>
            <div className="att-slip-branch">{empBranch} Branch</div>
            <div className="att-slip-title">SALARY SLIP</div>
            <div className="att-slip-period">{MONTH_NAMES_FULL[month - 1]} {year}</div>
          </div>

          {/* Employee details */}
          <div className="att-slip-emp-details" style={{ marginTop: 16 }}>
            <div className="att-slip-emp-field">
              <div className="att-slip-emp-label">Employee Name</div>
              <div className="att-slip-emp-val">{empName}</div>
            </div>
            <div className="att-slip-emp-field">
              <div className="att-slip-emp-label">Employee ID</div>
              <div className="att-slip-emp-val">{empCode}</div>
            </div>
            <div className="att-slip-emp-field">
              <div className="att-slip-emp-label">Department</div>
              <div className="att-slip-emp-val">{empDept}</div>
            </div>
            <div className="att-slip-emp-field">
              <div className="att-slip-emp-label">Designation</div>
              <div className="att-slip-emp-val">{empDesig}</div>
            </div>
            <div className="att-slip-emp-field">
              <div className="att-slip-emp-label">Branch</div>
              <div className="att-slip-emp-val">{empBranch}</div>
            </div>
            <div className="att-slip-emp-field">
              <div className="att-slip-emp-label">Pay Period</div>
              <div className="att-slip-emp-val">{MONTH_NAMES_FULL[month - 1]} {year}</div>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="att-slip-section-label">Attendance Summary</div>
          <div className="att-slip-att-grid">
            <div className="att-slip-att-cell">
              <span className="att-slip-att-val">{calDays}</span>
              <span className="att-slip-att-lbl">Days in Month</span>
            </div>
            <div className="att-slip-att-cell">
              <span className="att-slip-att-val">{record.totalWorkingDays ?? "—"}</span>
              <span className="att-slip-att-lbl">Working Days</span>
            </div>
            <div className="att-slip-att-cell" style={{ color: "#059669" }}>
              <span className="att-slip-att-val">{daysAttended}</span>
              <span className="att-slip-att-lbl">Days Attended</span>
            </div>
            <div className="att-slip-att-cell" style={{ color: "#991b1b" }}>
              <span className="att-slip-att-val">{record.absentDays ?? "—"}</span>
              <span className="att-slip-att-lbl">Absent</span>
            </div>
            <div className="att-slip-att-cell" style={{ color: "#065f46" }}>
              <span className="att-slip-att-val">{record.presentDays ?? "—"}</span>
              <span className="att-slip-att-lbl">Present (Full)</span>
            </div>
            <div className="att-slip-att-cell" style={{ color: "#b45309" }}>
              <span className="att-slip-att-val">{record.lateDays ?? "—"}</span>
              <span className="att-slip-att-lbl">Late</span>
            </div>
            <div className="att-slip-att-cell" style={{ color: "#9a3412" }}>
              <span className="att-slip-att-val">{record.halfDays ?? "—"}</span>
              <span className="att-slip-att-lbl">Half-Day</span>
            </div>
            <div className="att-slip-att-cell" style={{ color: "#5b21b6" }}>
              <span className="att-slip-att-val">{record.leaveDays ?? "—"}</span>
              <span className="att-slip-att-lbl">Leave</span>
            </div>
          </div>

          {/* Earnings */}
          <div className="att-slip-section-label" style={{ marginTop: 14 }}>Earnings</div>
          <table className="att-slip-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr><th>Component</th><th style={{ textAlign: "right" }}>Amount</th></tr>
            </thead>
            <tbody>
              <tr><td>Basic Salary (40%)</td><td style={{ textAlign: "right" }}>{fmtINR(basic)}</td></tr>
              <tr><td>HRA — House Rent Allowance</td><td style={{ textAlign: "right" }}>{fmtINR(hra)}</td></tr>
              <tr><td>DA — Dearness Allowance</td><td style={{ textAlign: "right" }}>{fmtINR(da)}</td></tr>
              <tr><td>Special Allowance</td><td style={{ textAlign: "right" }}>{fmtINR(specialAllow)}</td></tr>
              <tr className="total-row">
                <td style={{ fontWeight: 800 }}>Gross Salary</td>
                <td style={{ textAlign: "right", color: "#1d4ed8", fontWeight: 800 }}>{fmtINR(gross)}</td>
              </tr>
            </tbody>
          </table>

          {/* Deductions */}
          <div className="att-slip-section-label" style={{ marginTop: 14 }}>Deductions</div>
          <table className="att-slip-table" style={{ marginBottom: 0 }}>
            <thead>
              <tr><th>Description</th><th style={{ textAlign: "right" }}>Amount</th></tr>
            </thead>
            <tbody>
              {/* Absent */}
              {absentDeduct > 0 && (
                <tr>
                  <td>Absent Deduction ({record.absentDays} days)</td>
                  <td style={{ textAlign: "right", color: "#dc2626" }}>- {fmtINR(absentDeduct)}</td>
                </tr>
              )}
              {/* Half-day */}
              {halfDeduct > 0 && (
                <tr>
                  <td>Half-Day Deduction ({record.halfDays} days)</td>
                  <td style={{ textAlign: "right", color: "#dc2626" }}>- {fmtINR(halfDeduct)}</td>
                </tr>
              )}
              {/* Leave — show entitlement, deduct only excess */}
              <tr>
                <td>
                  Leave Used: {record.leaveDays || 0} day{(record.leaveDays || 0) !== 1 ? "s" : ""}
                  <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>
                    (Entitlement: {leaveEntitle} days/mo — 1 Casual + 0.5 Sick)
                  </span>
                  {excessLeave > 0 && (
                    <span style={{ fontSize: 11, color: "#dc2626", marginLeft: 6 }}>
                      · {excessLeave} excess day{excessLeave !== 1 ? "s" : ""} deducted
                    </span>
                  )}
                </td>
                <td style={{ textAlign: "right", color: leaveDeduct > 0 ? "#dc2626" : "#059669", fontWeight: 700 }}>
                  {leaveDeduct > 0 ? `- ${fmtINR(leaveDeduct)}` : "₹0"}
                </td>
              </tr>
              {/* Late — info only, no deduction */}
              {(record.totalLateMinutes || 0) > 0 && (
                <tr style={{ background: "#fffbeb" }}>
                  <td style={{ color: "#92400e" }}>
                    Late Arrivals: {record.lateDays} day{record.lateDays !== 1 ? "s" : ""} ({record.totalLateMinutes} min total)
                    <span style={{ fontSize: 11, color: "#64748b", marginLeft: 6 }}>— Info only, no deduction</span>
                  </td>
                  <td style={{ textAlign: "right", color: "#64748b", fontSize: 12 }}>₹0</td>
                </tr>
              )}
              {/* Statutory */}
              {pfEmployee > 0 && (
                <tr style={{ background: "#fff5f5" }}>
                  <td>
                    PF — Employee Contribution (12% of Basic)
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>deducted from salary</span>
                  </td>
                  <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 700 }}>- {fmtINR(pfEmployee)}</td>
                </tr>
              )}
              {(Number(record.pfEmployer) || 0) > 0 && (
                <tr style={{ background: "#fffbeb" }}>
                  <td>
                    PF — Employer Contribution (12% of Basic)
                    <span style={{ fontSize: 10, color: "#94a3b8", marginLeft: 6 }}>paid by company</span>
                  </td>
                  <td style={{ textAlign: "right", color: "#d97706", fontWeight: 700 }}>{fmtINR(Number(record.pfEmployer) || 0)}</td>
                </tr>
              )}
              {esiAmount > 0 && (
                <tr style={{ background: "#fff5f5" }}>
                  <td>ESI Employee Contribution (0.75% of Gross)</td>
                  <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 700 }}>- {fmtINR(esiAmount)}</td>
                </tr>
              )}
              {professionalTx > 0 && (
                <tr style={{ background: "#fff5f5" }}>
                  <td>Professional Tax</td>
                  <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 700 }}>- {fmtINR(professionalTx)}</td>
                </tr>
              )}
              <tr className="total-row">
                <td style={{ fontWeight: 800 }}>Total Deductions</td>
                <td style={{ textAlign: "right", color: "#dc2626", fontWeight: 800 }}>- {fmtINR(totalDeduct)}</td>
              </tr>
            </tbody>
          </table>

          {/* Net salary */}
          <div className="att-slip-net-box">
            <span className="att-slip-net-label">Net Salary Payable</span>
            <span className="att-slip-net-val">{fmtINR(net)}</span>
          </div>

          <div style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", marginTop: 12 }}>
            Status: <strong style={{ color: record.status === "paid" ? "#059669" : "#d97706" }}>
              {record.status === "paid" ? "PAID" : "PENDING"}
            </strong>
            {record.paidDate && (
              <span style={{ marginLeft: 8 }}>· Paid on {new Date(record.paidDate).toLocaleDateString("en-IN")}</span>
            )}
          </div>
        </div>

        <div className="att-modal-foot">
          <button className="att-btn-sec" onClick={onClose}>Close</button>
          <button className="att-btn-prim" onClick={onDownload}>
            <Download size={13} /> Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}
