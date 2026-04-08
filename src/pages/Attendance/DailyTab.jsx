import { useCallback, useEffect, useState } from "react";
import { RefreshCcw, Search, Clock } from "lucide-react";
import { toast } from "../../utils/toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUSES = [
  { key: "present",  label: "Present",  color: "#059669", bg: "#d1fae5" },
  { key: "absent",   label: "Absent",   color: "#dc2626", bg: "#fee2e2" },
  { key: "half-day", label: "Half Day", color: "#d97706", bg: "#fef3c7" },
  { key: "late",     label: "Late",     color: "#7c3aed", bg: "#ede9fe" },
  { key: "leave",    label: "Leave",    color: "#0891b2", bg: "#cffafe" },
  { key: "holiday",  label: "Holiday",  color: "#64748b", bg: "#f1f5f9" },
];

const STATUS_MAP = Object.fromEntries(STATUSES.map(s => [s.key, s]));

function todayStr() { return new Date().toISOString().split("T")[0]; }
function authHeader() {
  const t = localStorage.getItem("nnc_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2,"0")}:${String(d.getMinutes()).padStart(2,"0")}`;
}

export default function DailyTab({ branch }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState({});
  const [search,       setSearch]       = useState("");

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ date: selectedDate });
      if (branch) p.set("branch", branch);
      const res  = await fetch(`${API}/api/attendance/daily?${p}`, { headers: authHeader() });
      const json = await res.json();
      if (res.ok && json.success) setRecords(json.data || []);
      else toast.error(json.message || "Failed to load");
    } catch (err) { toast.error(err.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [selectedDate, branch]);

  useEffect(() => { fetchDaily(); }, [fetchDaily]);

  const save = async (empId, status, checkIn) => {
    setSaving(s => ({ ...s, [empId]: true }));
    try {
      const body = { employeeId: empId, date: selectedDate, status };
      if (checkIn) body.checkIn = checkIn;
      const res  = await fetch(`${API}/api/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.message || "Save failed"); return; }
      setRecords(prev => prev.map(r =>
        r.employee?._id === empId
          ? { ...r, attendance: { ...(r.attendance || {}), status, checkIn: checkIn || r.attendance?.checkIn } }
          : r
      ));
    } catch { toast.error("Save failed"); }
    finally { setSaving(s => { const n={...s}; delete n[empId]; return n; }); }
  };

  const handleStatus = (rec, status) => {
    const empId   = rec.employee?._id;
    // Only keep existing checkIn — never auto-fill with current time.
    // If the status clears attendance (absent/leave/holiday), send no checkIn.
    const checkIn = ["absent", "leave", "holiday"].includes(status)
      ? undefined
      : rec.attendance?.checkIn || undefined;
    save(empId, status, checkIn);
  };

  const handleTime = (rec, time) => {
    const empId  = rec.employee?._id;
    const status = rec.attendance?.status || "present";
    save(empId, status, time);
  };

  const handleBulk = async (status) => {
    if (!records.length) return;
    if (!window.confirm(`Mark ALL ${records.length} employees as "${status}"?`)) return;
    try {
      const res = await fetch(`${API}/api/attendance/mark-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ records: records.map(r => ({ employeeId: r.employee?._id, date: selectedDate, status })) }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) { toast.error(json.message || "Failed"); return; }
      toast.success(`All marked as ${status}`);
      fetchDaily();
    } catch { toast.error("Bulk mark failed"); }
  };

  const counts = records.reduce((acc, r) => {
    const s = r.attendance?.status || "absent";
    acc[s] = (acc[s] || 0) + 1;
    return acc;
  }, {});

  const filtered = search
    ? records.filter(r => {
        const q = search.toLowerCase();
        return (r.employee?.name || "").toLowerCase().includes(q) ||
               (r.employee?.employeeId || "").toLowerCase().includes(q);
      })
    : records;

  return (
    <>
      {/* ── Toolbar ── */}
      <div className="att-toolbar">
        <input
          type="date" value={selectedDate} max={todayStr()}
          className="att-date-input"
          onChange={e => { if (e.target.value <= todayStr()) setSelectedDate(e.target.value); }}
        />
        <div className="att-search-wrap">
          <Search size={13} />
          <input placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="att-refresh-btn" onClick={fetchDaily} disabled={loading}>
          <RefreshCcw size={13} className={loading ? "att-spin" : ""} />
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="att-bulk-btn present" onClick={() => handleBulk("present")}>✓ All Present</button>
          <button className="att-bulk-btn holiday" onClick={() => handleBulk("holiday")}>All Holiday</button>
        </div>
      </div>

      {/* ── Summary chips ── */}
      <div className="att-summary-row">
        {STATUSES.slice(0, 5).map(s => (
          <span key={s.key} className="att-sum-chip" style={{ background: s.bg, color: s.color }}>
            <strong>{counts[s.key] || 0}</strong> {s.label}
          </span>
        ))}
        <span className="att-sum-total">Total: {records.length}</span>
      </div>

      {/* ── Table ── */}
      {loading ? (
        <div className="att-loading"><RefreshCcw size={28} className="att-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="att-empty">
          <div className="att-empty-icon">📋</div>
          <div className="att-empty-text">No employees found</div>
        </div>
      ) : (
        <div className="att-daily-table-wrap">
          <table className="att-daily-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Employee</th>
                <th>Status</th>
                <th>Check-in Time</th>
                <th>Late</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rec, idx) => {
                const emp      = rec.employee || {};
                const att      = rec.attendance || {};
                const empId    = emp._id;
                const status   = att.status || "absent";
                const st       = STATUS_MAP[status] || STATUS_MAP.absent;
                const isSaving = !!saving[empId];

                return (
                  <tr key={empId} className={isSaving ? "att-row-saving" : ""}>
                    {/* # */}
                    <td className="att-td-num">{idx + 1}</td>

                    {/* Employee */}
                    <td>
                      <div className="att-td-emp">
                        <div className="att-emp-avatar" style={{ width: 32, height: 32, fontSize: 12 }}>
                          {(emp.name || "?").slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="att-emp-name">{emp.name || "—"}</div>
                          <div className="att-emp-meta">
                            <span className="att-emp-id">{emp.employeeId}</span>
                            {emp.designation && <span className="att-emp-desig">{emp.designation}</span>}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Status + Late row */}
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                        <select
                          className="att-status-select"
                          value={status}
                          disabled={isSaving}
                          style={{ background: st.bg, color: st.color, borderColor: st.color + "66", flex: 1, minWidth: 120 }}
                          onChange={e => handleStatus(rec, e.target.value)}
                        >
                          {STATUSES.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                        {att.lateMinutes > 0 && (() => {
                          const h = Math.floor(att.lateMinutes / 60);
                          const m = att.lateMinutes % 60;
                          return <span className="att-late-tag">{h > 0 ? `${h}h ${m}m` : `${m}m`} late</span>;
                        })()}
                      </div>
                    </td>

                    {/* Check-in time */}
                    <td>
                      <div className="att-td-time">
                        <input
                          type="time"
                          className="att-time-input"
                          value={att.checkIn || ""}
                          disabled={isSaving || status === "absent" || status === "holiday" || status === "leave"}
                          onChange={e => handleTime(rec, e.target.value)}
                        />
                        {(status === "present" || status === "late") && (
                          <button
                            className="att-now-btn"
                            title="Set check-in to now"
                            disabled={isSaving}
                            onClick={() => handleTime(rec, nowHHMM())}
                          >
                            <Clock size={12} /> Now
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Late — desktop only (hidden on mobile, shown inline in status cell) */}
                    <td className="att-late-desktop">
                      {att.lateMinutes > 0 ? (() => {
                        const h = Math.floor(att.lateMinutes / 60);
                        const m = att.lateMinutes % 60;
                        return <span className="att-late-tag">{h > 0 ? `${h}h ${m}m` : `${m}m`} late</span>;
                      })() : <span style={{ color: "#cbd5e1" }}>—</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
