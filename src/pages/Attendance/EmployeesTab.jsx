import { useCallback, useEffect, useState } from "react";
import { Plus, RefreshCcw, Search, Edit2, UserX, Clock, Briefcase, Phone, Mail, X } from "lucide-react";
import { toast } from "../../utils/toast";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";
const BRANCHES = ["Bangalore", "Mysore", "Mumbai"];

const EMPTY_FORM = {
  employeeId: "", name: "", email: "", phone: "", branch: "Bangalore",
  department: "", designation: "", shiftStart: "09:30", shiftEnd: "18:30",
  gracePeriodMin: 15, monthlySalary: "", joinedDate: "",
  employmentType: "permanent",
  // Salary structure
  basicPct: 40, hraPct: 40, daPct: 10,
  pfApplicable: true, pfFixed: "",
  esiApplicable: false, esiFixed: "",
  ptApplicable: true, ptFixed: "",
};

function authHeader() {
  const t = localStorage.getItem("nnc_token");
  return t ? { Authorization: `Bearer ${t}` } : {};
}

function branchBadgeClass(branch) {
  const m = { Bangalore: "att-branch-bangalore", Mysore: "att-branch-mysore", Mumbai: "att-branch-mumbai" };
  return m[branch] || "att-branch-bangalore";
}

function getInitials(name) {
  const parts = String(name || "?").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
}

function fmtSalary(n) {
  const v = Number(n) || 0;
  return `₹${v.toLocaleString("en-IN")}`;
}

export default function EmployeesTab({ branch }) {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [search, setSearch] = useState("");
  const [filterBranch, setFilterBranch] = useState(branch || "");

  const fetchEmployees = useCallback(async () => {
    setLoading(true);
    try {
      const p = new URLSearchParams();
      if (filterBranch) p.set("branch", filterBranch);
      const res  = await fetch(`${API}/api/attendance/employees?${p}`, { headers: authHeader() });
      const json = await res.json();
      if (res.ok && json.success) setEmployees(json.data || []);
      else toast.error(json.message || "Failed to load employees");
    } catch { toast.error("Failed to load employees"); }
    finally { setLoading(false); }
  }, [filterBranch]);

  useEffect(() => { fetchEmployees(); }, [fetchEmployees]);

  /* Sync branch prop */
  useEffect(() => { setFilterBranch(branch || ""); }, [branch]);

  const openAdd = () => {
    setForm({ ...EMPTY_FORM, branch: branch || "Bangalore" });
    setAddOpen(true);
  };
  const openEdit = (emp) => {
    setEditTarget(emp);
    setForm({
      employeeId: emp.employeeId || "",
      name: emp.name || "",
      email: emp.email || "",
      phone: emp.phone || "",
      branch: emp.branch || "Bangalore",
      department: emp.department || "",
      designation: emp.designation || "",
      shiftStart: emp.shiftStart || "09:30",
      shiftEnd: emp.shiftEnd || "18:30",
      gracePeriodMin: emp.gracePeriodMin ?? 15,
      monthlySalary: emp.monthlySalary ?? "",
      joinedDate: emp.joinedDate ? emp.joinedDate.split("T")[0] : "",
      employmentType: emp.employmentType || "permanent",
      basicPct: emp.basicPct ?? 40,
      hraPct:   emp.hraPct   ?? 40,
      daPct:    emp.daPct    ?? 10,
      pfApplicable:  emp.pfApplicable  ?? true,
      pfFixed:       emp.pfFixed       || "",
      esiApplicable: emp.esiApplicable ?? false,
      esiFixed:      emp.esiFixed      || "",
      ptApplicable:  emp.ptApplicable  ?? true,
      ptFixed:       emp.ptFixed       || "",
    });
    setEditOpen(true);
  };

  const handleSave = async () => {
    if (!form.employeeId.trim()) return toast.error("Employee ID is required");
    if (!form.name.trim()) return toast.error("Name is required");
    if (!form.branch) return toast.error("Branch is required");
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return toast.error("Invalid email format");
    if (form.monthlySalary && Number(form.monthlySalary) < 0) return toast.error("Salary cannot be negative");
    if (form.joinedDate && form.joinedDate > new Date().toISOString().split("T")[0]) return toast.error("Joined date cannot be in the future");
    setSaving(true);
    try {
      const isEdit = editOpen && editTarget;
      const method = isEdit ? "PUT" : "POST";
      const url    = isEdit
        ? `${API}/api/attendance/employees/${editTarget._id}`
        : `${API}/api/attendance/employees`;
      const res  = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...authHeader() },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Save failed");
        return;
      }
      toast.success(isEdit ? "Employee updated!" : "Employee added!");
      setAddOpen(false);
      setEditOpen(false);
      setEditTarget(null);
      fetchEmployees();
    } catch { toast.error("Save failed"); }
    finally { setSaving(false); }
  };

  const handleDeactivate = async (id) => {
    if (!window.confirm("Deactivate this employee?")) return;
    try {
      const res  = await fetch(`${API}/api/attendance/employees/${id}`, { method: "DELETE", headers: authHeader() });
      const json = await res.json();
      if (!res.ok || !json.success) {
        toast.error(json.message || "Failed to deactivate");
        return;
      }
      toast.success("Employee deactivated");
      fetchEmployees();
    } catch { toast.error("Failed to deactivate"); }
  };

  const setField = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const filtered = employees.filter(e => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (e.name || "").toLowerCase().includes(q) || (e.employeeId || "").toLowerCase().includes(q) || (e.designation || "").toLowerCase().includes(q);
  });

  const modalOpen = addOpen || editOpen;
  const closeModal = () => { setAddOpen(false); setEditOpen(false); setEditTarget(null); };

  return (
    <>
      {/* Toolbar */}
      <div className="att-toolbar">
        <div className="att-search-wrap">
          <Search size={14} />
          <input placeholder="Search employees…" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="att-select"
          value={filterBranch}
          onChange={e => setFilterBranch(e.target.value)}
          style={{ padding: "8px 12px", borderRadius: 8, border: "1.5px solid #e2e8f0", fontSize: 13 }}
        >
          <option value="">All Branches</option>
          {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
        </select>
        <div className="att-toolbar-right">
          <button className="att-btn-sec" onClick={fetchEmployees}>
            <RefreshCcw size={13} className={loading ? "att-spin" : ""} /> Refresh
          </button>
          <button className="att-btn-prim" onClick={openAdd}>
            <Plus size={14} /> Add Employee
          </button>
        </div>
      </div>

      {/* Employee Cards */}
      {loading ? (
        <div className="att-loading"><RefreshCcw size={28} className="att-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="att-empty">
          <div className="att-empty-text">No employees found</div>
          <div className="att-empty-sub">Add your first employee to get started</div>
        </div>
      ) : (
        <div className="att-emp-grid">
          {filtered.map(emp => (
            <div key={emp._id} className="att-emp-card">
              <div className="att-emp-card-header">
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div className="att-emp-avatar">{getInitials(emp.name)}</div>
                  <div>
                    <div className="att-emp-card-name">{emp.name}</div>
                    <span className="att-emp-card-id">{emp.employeeId}</span>
                  </div>
                </div>
                <span className={`att-branch-badge ${branchBadgeClass(emp.branch)}`}>{emp.branch}</span>
              </div>

              <div className="att-emp-card-info">
                {emp.department && (
                  <div className="att-emp-info-row">
                    <Briefcase size={12} />
                    <span>{emp.department}{emp.designation ? ` · ${emp.designation}` : ""}</span>
                  </div>
                )}
                {emp.phone && (
                  <div className="att-emp-info-row">
                    <Phone size={12} />
                    <span>{emp.phone}</span>
                  </div>
                )}
                {emp.email && (
                  <div className="att-emp-info-row">
                    <Mail size={12} />
                    <span style={{ fontSize: 11 }}>{emp.email}</span>
                  </div>
                )}
                <div className="att-emp-info-row">
                  <Clock size={12} />
                  <span>{emp.shiftStart || "09:30"} – {emp.shiftEnd || "18:30"} (Grace: {emp.gracePeriodMin || 15} min)</span>
                </div>
                {emp.monthlySalary && (
                  <div className="att-emp-salary">{fmtSalary(emp.monthlySalary)} / month</div>
                )}
              </div>

              <div className="att-emp-card-footer">
                <span className={emp.isActive !== false ? "att-status-active" : "att-status-inactive"}>
                  {emp.isActive !== false ? "Active" : "Inactive"}
                </span>
                <span className={`att-emp-type-badge ${emp.employmentType === "probationary" ? "probationary" : "permanent"}`}>
                  {emp.employmentType === "probationary" ? "Probationary" : "Permanent"}
                </span>
                <div className="att-emp-actions">
                  <button className="att-btn-ghost" onClick={() => openEdit(emp)}>
                    <Edit2 size={13} /> Edit
                  </button>
                  {emp.isActive !== false && (
                    <button className="att-btn-ghost danger" onClick={() => handleDeactivate(emp._id)}>
                      <UserX size={13} /> Deactivate
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {modalOpen && (
        <div className="att-modal-overlay" onClick={closeModal}>
          <div className="att-modal" onClick={e => e.stopPropagation()}>
            <div className="att-modal-head">
              <span className="att-modal-title">{editOpen ? "Edit Employee" : "Add Employee"}</span>
              <button className="att-modal-close" onClick={closeModal}><X size={16} /></button>
            </div>
            <div className="att-modal-body">
              <div className="att-form-grid">
                <div className="att-field">
                  <label className="att-label">Employee ID *</label>
                  <input className="att-input" placeholder="EMP001" value={form.employeeId} onChange={e => setField("employeeId", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Full Name *</label>
                  <input className="att-input" placeholder="Full name" value={form.name} onChange={e => setField("name", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Email</label>
                  <input className="att-input" type="email" placeholder="Email address" value={form.email} onChange={e => setField("email", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Phone</label>
                  <input className="att-input" placeholder="Phone number" value={form.phone} onChange={e => setField("phone", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Branch</label>
                  <select className="att-select" value={form.branch} onChange={e => setField("branch", e.target.value)}>
                    {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div className="att-field">
                  <label className="att-label">Department</label>
                  <input className="att-input" placeholder="Department" value={form.department} onChange={e => setField("department", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Designation</label>
                  <input className="att-input" placeholder="Designation" value={form.designation} onChange={e => setField("designation", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Monthly Salary (₹)</label>
                  <input className="att-input" type="number" placeholder="0" value={form.monthlySalary} onChange={e => setField("monthlySalary", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Shift Start</label>
                  <input className="att-input" type="time" value={form.shiftStart} onChange={e => setField("shiftStart", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Shift End</label>
                  <input className="att-input" type="time" value={form.shiftEnd} onChange={e => setField("shiftEnd", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Grace Period (min)</label>
                  <input className="att-input" type="number" min={0} value={form.gracePeriodMin} onChange={e => setField("gracePeriodMin", Number(e.target.value))} />
                </div>
                <div className="att-field">
                  <label className="att-label">Joined Date</label>
                  <input className="att-input" type="date" value={form.joinedDate} onChange={e => setField("joinedDate", e.target.value)} />
                </div>
                <div className="att-field">
                  <label className="att-label">Employment Type</label>
                  <select className="att-input" value={form.employmentType} onChange={e => setField("employmentType", e.target.value)}>
                    <option value="permanent">Permanent (1.5 days paid leave/month)</option>
                    <option value="probationary">Probationary (all leave deducted)</option>
                  </select>
                </div>
              </div>

              {/* Salary Structure */}
              <div className="att-section-divider">Salary Structure</div>
              <div className="att-form-grid">
                <div className="att-field">
                  <label className="att-label">Basic % of Gross</label>
                  <input className="att-input" type="number" min={0} max={100} value={form.basicPct} onChange={e => setField("basicPct", Number(e.target.value))} />
                </div>
                <div className="att-field">
                  <label className="att-label">HRA % of Basic</label>
                  <input className="att-input" type="number" min={0} max={100} value={form.hraPct} onChange={e => setField("hraPct", Number(e.target.value))} />
                </div>
                <div className="att-field">
                  <label className="att-label">DA % of Basic</label>
                  <input className="att-input" type="number" min={0} max={100} value={form.daPct} onChange={e => setField("daPct", Number(e.target.value))} />
                </div>
              </div>

              {/* Statutory deductions */}
              <div className="att-section-divider">Statutory Deductions</div>
              <div className="att-stat-grid">
                {/* PF */}
                <div className="att-stat-row">
                  <label className="att-stat-toggle">
                    <input type="checkbox" checked={!!form.pfApplicable} onChange={e => setField("pfApplicable", e.target.checked)} />
                    <span>PF Applicable</span>
                  </label>
                  {form.pfApplicable && (
                    <div className="att-stat-input-wrap">
                      <input className="att-input" type="number" min={0} placeholder="Auto (12% of Basic, max ₹1800)" value={form.pfFixed} onChange={e => setField("pfFixed", e.target.value)} />
                      <span className="att-stat-hint">Leave 0 for auto (12% of Basic, max ₹1800)</span>
                    </div>
                  )}
                </div>

                {/* ESI */}
                <div className="att-stat-row">
                  <label className="att-stat-toggle">
                    <input type="checkbox" checked={!!form.esiApplicable} onChange={e => setField("esiApplicable", e.target.checked)} />
                    <span>ESI Applicable</span>
                  </label>
                  {form.esiApplicable && (
                    <div className="att-stat-input-wrap">
                      <input className="att-input" type="number" min={0} placeholder="Auto (0.75% of Gross, if ≤₹21000)" value={form.esiFixed} onChange={e => setField("esiFixed", e.target.value)} />
                      <span className="att-stat-hint">Leave 0 for auto (0.75% of Gross if salary ≤ ₹21,000)</span>
                    </div>
                  )}
                </div>

                {/* PT */}
                <div className="att-stat-row">
                  <label className="att-stat-toggle">
                    <input type="checkbox" checked={!!form.ptApplicable} onChange={e => setField("ptApplicable", e.target.checked)} />
                    <span>Professional Tax (PT) Applicable</span>
                  </label>
                  {form.ptApplicable && (
                    <div className="att-stat-input-wrap">
                      <input className="att-input" type="number" min={0} placeholder="Auto (₹200 if Gross > ₹15000)" value={form.ptFixed} onChange={e => setField("ptFixed", e.target.value)} />
                      <span className="att-stat-hint">Leave 0 for auto (₹200 if gross &gt; ₹15,000 — Karnataka)</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Live preview */}
              {form.monthlySalary > 0 && (
                <div className="att-sal-preview">
                  <div className="att-sal-preview-title">Salary Preview (on ₹{Number(form.monthlySalary).toLocaleString("en-IN")} gross)</div>
                  <div className="att-sal-preview-grid">
                    {(() => {
                      const gross = Number(form.monthlySalary) || 0;
                      const basic = Math.round(gross * (Number(form.basicPct) || 40) / 100);
                      const hra   = Math.round(basic * (Number(form.hraPct)   || 40) / 100);
                      const da    = Math.round(basic * (Number(form.daPct)    || 10) / 100);
                      const special = Math.max(0, gross - basic - hra - da);
                      const pf  = form.pfApplicable  ? (Number(form.pfFixed)  || Math.min(Math.round(basic * 0.12), 1800)) : 0;
                      const esi = form.esiApplicable ? (Number(form.esiFixed) || (gross <= 21000 ? Math.round(gross * 0.0075) : 0)) : 0;
                      const pt  = form.ptApplicable  ? (Number(form.ptFixed)  || (gross > 15000 ? 200 : 0)) : 0;
                      const net = gross - pf - esi - pt;
                      return (
                        <>
                          <div className="att-sal-item earn"><span>Basic</span><span>₹{basic.toLocaleString("en-IN")}</span></div>
                          <div className="att-sal-item earn"><span>HRA</span><span>₹{hra.toLocaleString("en-IN")}</span></div>
                          <div className="att-sal-item earn"><span>DA</span><span>₹{da.toLocaleString("en-IN")}</span></div>
                          <div className="att-sal-item earn"><span>Special Allowance</span><span>₹{special.toLocaleString("en-IN")}</span></div>
                          {pf  > 0 && <div className="att-sal-item ded"><span>PF (Employee)</span><span>- ₹{pf.toLocaleString("en-IN")}</span></div>}
                          {esi > 0 && <div className="att-sal-item ded"><span>ESI</span><span>- ₹{esi.toLocaleString("en-IN")}</span></div>}
                          {pt  > 0 && <div className="att-sal-item ded"><span>Prof. Tax</span><span>- ₹{pt.toLocaleString("en-IN")}</span></div>}
                          <div className="att-sal-item net"><span>Net Salary</span><span>₹{net.toLocaleString("en-IN")}</span></div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="att-modal-foot">
              <button className="att-btn-sec" onClick={closeModal}>Cancel</button>
              <button className="att-btn-prim" onClick={handleSave} disabled={saving}>
                {saving ? "Saving…" : editOpen ? "Update Employee" : "Add Employee"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
