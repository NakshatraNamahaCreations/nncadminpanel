import { useCallback, useEffect, useRef, useState } from "react";
import { RefreshCcw, Search, Clock, CheckCircle } from "lucide-react";
import { toast } from "../../utils/toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const STATUSES = [
  { key: "present",  label: "Present",  short: "P",  color: "#059669", bg: "#d1fae5" },
  { key: "absent",   label: "Absent",   short: "A",  color: "#dc2626", bg: "#fee2e2" },
  { key: "half-day", label: "Half Day", short: "½",  color: "#d97706", bg: "#fef3c7" },
  { key: "late",     label: "Late",     short: "L",  color: "#7c3aed", bg: "#ede9fe" },
  { key: "leave",    label: "Leave",    short: "Lv", color: "#0891b2", bg: "#cffafe" },
  { key: "holiday",  label: "Holiday",  short: "H",  color: "#64748b", bg: "#f1f5f9" },
];

function todayStr() { return new Date().toISOString().split("T")[0]; }
function authHeader() {
  const t = localStorage.getItem("nnc_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}
function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* Live clock component */
function LiveClock() {
  const [time, setTime] = useState(nowHHMM());
  useEffect(() => {
    const iv = setInterval(() => setTime(nowHHMM()), 10000);
    return () => clearInterval(iv);
  }, []);
  return <span className="att-live-clock"><Clock size={11} /> {time}</span>;
}

export default function DailyTab({ branch }) {
  const [selectedDate, setSelectedDate] = useState(todayStr());
  const [records,      setRecords]      = useState([]);
  const [loading,      setLoading]      = useState(false);
  const [saving,       setSaving]       = useState({});   // { empId: true }
  const [search,       setSearch]       = useState("");
  const [checkinMap,   setCheckinMap]   = useState({});   // { empId: "HH:MM" }
  const [editingTime,  setEditingTime]  = useState({});   // { empId: true } — manual edit mode

  const isToday = selectedDate === todayStr();

  const fetchDaily = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams({ date: selectedDate });
      if (branch) p.set("branch", branch);
      const res  = await fetch(`${API}/api/attendance/daily?${p}`, { headers: authHeader() });
      const json = await res.json();
      if (json.success) {
        setRecords(json.data || []);
        const map = {};
        (json.data || []).forEach(r => {
          if (r.attendance?.checkIn) map[r.employee?._id] = r.attendance.checkIn;
        });
        setCheckinMap(map);
        setEditingTime({});
      } else toast.error(json.message || "Failed to load");
    } catch (err) { toast.error(err.message || "Failed to load"); }
    finally { setLoading(false); }
  }, [selectedDate, branch]);

  useEffect(() => { fetchDaily(); }, [fetchDaily]);

  /* Mark status with one click */
  const markStatus = async (empId, status) => {
    setSaving(s => ({ ...s, [empId]: true }));
    try {
      const body = { employeeId: empId, date: selectedDate, status };
      const ci = checkinMap[empId];
      if (ci) body.checkIn = ci;
      const res  = await fetch(`${API}/api/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (json.success) {
        setRecords(prev => prev.map(r =>
          (r.employee?._id === empId)
            ? { ...r, attendance: { ...(r.attendance || {}), status, checkIn: ci || r.attendance?.checkIn } }
            : r
        ));
      } else toast.error(json.message || "Save failed");
    } catch { toast.error("Save failed"); }
    finally { setSaving(s => { const n={...s}; delete n[empId]; return n; }); }
  };

  /* Save check-in time */
  const saveCheckin = async (empId, time) => {
    if (!time) return;
    setCheckinMap(m => ({ ...m, [empId]: time }));
    setSaving(s => ({ ...s, [empId]: true }));
    try {
      const rec = records.find(r => r.employee?._id === empId);
      const curStatus = rec?.attendance?.status || "present";
      const res = await fetch(`${API}/api/attendance/mark`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ employeeId: empId, date: selectedDate, checkIn: time, status: curStatus }),
      });
      const json = await res.json();
      if (json.success) {
        setRecords(prev => prev.map(r =>
          (r.employee?._id === empId)
            ? { ...r, attendance: { ...(r.attendance || {}), checkIn: time } }
            : r
        ));
      }
    } catch { /* silent */ }
    finally { setSaving(s => { const n={...s}; delete n[empId]; return n; }); }
  };

  /* One-click punch in with current time */
  const punchIn = (empId) => {
    const time = nowHHMM();
    setEditingTime(e => { const n={...e}; delete n[empId]; return n; });
    saveCheckin(empId, time);
    // auto-set status to present if currently absent
    const rec = records.find(r => r.employee?._id === empId);
    if (!rec?.attendance?.status || rec.attendance.status === "absent") {
      markStatus(empId, "present");
    }
  };

  const clearCheckin = (empId) => {
    setCheckinMap(m => { const n={...m}; delete n[empId]; return n; });
    setEditingTime(e => { const n={...e}; delete n[empId]; return n; });
  };

  const handleBulk = async (status) => {
    if (!window.confirm(`Mark ALL employees as "${status}" for ${selectedDate}?`)) return;
    try {
      await fetch(`${API}/api/attendance/mark-bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify({ date: selectedDate, status, branch }),
      });
      toast.success(`All marked as ${status}`);
      fetchDaily();
    } catch { toast.error("Failed"); }
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
      {/* Toolbar */}
      <div className="att-toolbar">
        <input
          type="date"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
          className="att-date-input"
        />
        {isToday && <LiveClock />}
        <div className="att-search-wrap">
          <Search size={13} />
          <input placeholder="Search employee…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <button className="att-refresh-btn" onClick={fetchDaily}>
          <RefreshCcw size={13} className={loading ? "att-spin" : ""} />
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
          <button className="att-bulk-btn present" onClick={() => handleBulk("present")}>All Present</button>
          <button className="att-bulk-btn holiday" onClick={() => handleBulk("holiday")}>All Holiday</button>
        </div>
      </div>

      {/* Status summary */}
      <div className="att-summary-row">
        {STATUSES.slice(0, 5).map(s => (
          <span key={s.key} className="att-sum-chip" style={{ background: s.bg, color: s.color }}>
            <strong>{counts[s.key] || 0}</strong> {s.label}
          </span>
        ))}
        <span className="att-sum-total">Total: {records.length}</span>
      </div>

      {/* Employee list */}
      {loading ? (
        <div className="att-loading"><RefreshCcw size={28} className="att-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="att-empty">
          <div className="att-empty-icon">📋</div>
          <div className="att-empty-text">No employees found</div>
          <div className="att-empty-sub">Add employees in the Employees tab first</div>
        </div>
      ) : (
        <div className="att-emp-list">
          {filtered.map(rec => {
            const emp   = rec.employee || {};
            const att   = rec.attendance || {};
            const empId = emp._id;
            const curStatus = att.status || "absent";
            const isSaving  = !!saving[empId];
            const punchedTime = checkinMap[empId];
            const isEditingT  = !!editingTime[empId];

            return (
              <div key={empId} className="att-emp-row">
                {/* Employee info */}
                <div className="att-emp-info">
                  <div className="att-emp-avatar">
                    {(emp.name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="att-emp-name">{emp.name || "—"}</div>
                    <div className="att-emp-meta">
                      {emp.employeeId && <span className="att-emp-id">{emp.employeeId}</span>}
                      {emp.designation && <span className="att-emp-desig">{emp.designation}</span>}
                    </div>
                  </div>
                </div>

                {/* Status buttons */}
                <div className="att-status-btns">
                  {STATUSES.map(s => (
                    <button
                      key={s.key}
                      className={`att-st-btn${curStatus === s.key ? " active" : ""}`}
                      style={curStatus === s.key ? { background: s.bg, color: s.color, borderColor: s.color } : {}}
                      onClick={() => markStatus(empId, s.key)}
                      disabled={isSaving}
                      title={s.label}
                    >
                      {s.short}
                    </button>
                  ))}
                </div>

                {/* Punch-in area */}
                <div className="att-punch-wrap">
                  {isEditingT ? (
                    /* Manual time edit */
                    <div className="att-punch-edit">
                      <input
                        type="time"
                        className="att-ci-input"
                        defaultValue={punchedTime || ""}
                        autoFocus
                        onBlur={e => {
                          if (e.target.value) saveCheckin(empId, e.target.value);
                          setEditingTime(prev => { const n={...prev}; delete n[empId]; return n; });
                        }}
                        onKeyDown={e => {
                          if (e.key === "Enter") e.target.blur();
                          if (e.key === "Escape") setEditingTime(prev => { const n={...prev}; delete n[empId]; return n; });
                        }}
                      />
                    </div>
                  ) : punchedTime ? (
                    /* Already punched in */
                    <div className="att-punched-badge">
                      <CheckCircle size={12} />
                      <span>{punchedTime}</span>
                      <button
                        className="att-punch-edit-btn"
                        onClick={() => setEditingTime(e => ({ ...e, [empId]: true }))}
                        title="Edit time"
                      >✎</button>
                    </div>
                  ) : (
                    /* Punch In button */
                    <button
                      className="att-punch-btn"
                      onClick={() => punchIn(empId)}
                      disabled={isSaving}
                      title="Record current time as check-in"
                    >
                      <Clock size={12} /> Punch In
                    </button>
                  )}
                  {att.lateMinutes > 0 && (
                    <span className="att-late-tag">{att.lateMinutes}m late</span>
                  )}
                </div>

                {/* Saving spinner */}
                {isSaving && <RefreshCcw size={13} className="att-spin att-saving-spin" />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
