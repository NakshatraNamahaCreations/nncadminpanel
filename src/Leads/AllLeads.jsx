import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";
import LeadDrawer from "../Leads/LeadDrawer";
import { Trash2, Download, Eye, Pencil, X, Search } from "lucide-react";
import "./AllLeads.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const money = (n) => {
  try {
    if (n == null) return "-";
    return `₹${Number(n).toLocaleString("en-IN")}`;
  } catch (error) {
    console.error("money error:", error);
    return "-";
  }
};

const cls = (s = "") => String(s).toLowerCase().replace(/\s+/g, "-");

const EMPTY_EDIT_FORM = {
  _id: "",
  name: "",
  phone: "",
  email: "",
  business: "",
  industry: "",
  location: "",
  requirements: "",
  branch: "Bangalore",
  source: "WhatsApp",
  stage: "Lead Capture",
  priority: "Hot",
  value: 0,
  days: "0d",
  rep: "",
};

export default function AllLeads() {
  const [filters, setFilters] = useState({
    branch: "All",
    stage: "All",
    priority: "All",
    source: "All",
    bant: "All",
    rep: "All",
    q: "",
  });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [exporting, setExporting] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editSaving, setEditSaving] = useState(false);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);

  const [repOptions, setRepOptions] = useState(["All"]);
  const [repsLoading, setRepsLoading] = useState(false);

  const BRANCHES = ["All", "Mysore", "Bangalore", "Mumbai"];
  const STAGES = ["All", "Lead Capture", "Reachable", "Qualified", "Proposal", "Closed"];
  const PRIORITIES = ["All", "Hot", "Warm", "Cold"];
  const SOURCES = ["All", "Referral", "WhatsApp", "Website", "Call", "Instagram", "Social", "Form", "Phone"];
  const BANTS = ["All", "0/4", "1/4", "2/4", "3/4", "4/4"];

  const EDIT_BRANCHES = ["Mysore", "Bangalore", "Mumbai"];
  const EDIT_STAGES = ["Lead Capture", "Reachable", "Qualified", "Proposal", "Closed"];
  const EDIT_PRIORITIES = ["Hot", "Warm", "Cold"];
  const EDIT_SOURCES = ["WhatsApp", "Website", "Call", "Instagram", "Referral"];

  const queryParams = useMemo(() => {
    try {
      const p = new URLSearchParams();
      p.set("branch", filters.branch || "All");
      p.set("stage", filters.stage || "All");
      p.set("priority", filters.priority || "All");
      p.set("source", filters.source || "All");
      p.set("bant", filters.bant || "All");
      p.set("rep", filters.rep || "All");

      if (filters.q && String(filters.q).trim()) {
        p.set("q", String(filters.q).trim());
      }

      return p.toString();
    } catch (error) {
      console.error("queryParams error:", error);
      return "";
    }
  }, [filters]);

  const fetchReps = async () => {
    try {
      setRepsLoading(true);

      const res = await fetch(`${API_BASE}/api/reps`);
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch reps");
      }

      const rawData = Array.isArray(json?.data) ? json.data : Array.isArray(json) ? json : [];

      const names = rawData
        .map((item) => {
          try {
            if (typeof item === "string") return item.trim();
            return (
              item?.name ||
              item?.fullName ||
              item?.repName ||
              item?.employeeName ||
              ""
            ).trim();
          } catch (error) {
            console.error("rep map error:", error);
            return "";
          }
        })
        .filter(Boolean);

      const uniqueNames = ["All", ...Array.from(new Set(names))];

      setRepOptions(uniqueNames);

      setFilters((prev) => {
        if (prev.rep !== "All" && !uniqueNames.includes(prev.rep)) {
          return { ...prev, rep: "All" };
        }
        return prev;
      });
    } catch (error) {
      console.error("fetchReps error:", error);
      setRepOptions(["All"]);
    } finally {
      setRepsLoading(false);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      setErr("");

      const url = `${API_BASE}/api/leads?${queryParams}`;
      const res = await fetch(url);
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch leads");
      }

      const mapped = (json.data || []).map((x) => ({
        id: x._id,
        name: x.name || "-",
        phone: x.phone || "-",
        business: x.business || "-",
        branch: x.branch || "-",
        source: x.source || "-",
        stage: x.stage || "-",
        bant: x.bant || "-",
        priority: x.priority || "-",
        value: Number(x.value || 0),
        days: x.days || "0d",
        docs: Number(x.docs || 0),
        rep: x.rep || "-",
      }));

      setRows(mapped);
    } catch (e) {
      console.error("fetchLeads error:", e);
      setErr(e.message || "Failed to fetch");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      fetchReps();
    } catch (error) {
      console.error("fetchReps useEffect error:", error);
    }
  }, []);

  useEffect(() => {
    try {
      fetchLeads();
    } catch (error) {
      console.error("fetchLeads useEffect error:", error);
    }
  }, [queryParams]);

  const total = useMemo(() => {
    try {
      return rows.reduce((a, b) => a + (b.value || 0), 0);
    } catch (error) {
      console.error("total error:", error);
      return 0;
    }
  }, [rows]);

  const onCreateLead = async (payload) => {
    try {
      const res = await fetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to create lead");
      }

      await fetchLeads();
      await fetchReps();
    } catch (e) {
      console.error("onCreateLead error:", e);
      alert(e.message || "Failed to create lead");
    }
  };

  const handleDeleteLead = async (e, id) => {
    try {
      e.stopPropagation();

      const ok = window.confirm("Are you sure you want to delete this lead?");
      if (!ok) return;

      setDeletingId(id);

      const res = await fetch(`${API_BASE}/api/leads/${id}`, {
        method: "DELETE",
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to delete lead");
      }

      if (selectedId === id) {
        setDrawerOpen(false);
        setSelectedId(null);
      }

      await fetchLeads();
      await fetchReps();
    } catch (error) {
      console.error("handleDeleteLead error:", error);
      alert(error?.message || "Failed to delete lead");
    } finally {
      setDeletingId(null);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);

      const url = `${API_BASE}/api/leads/export/csv?${queryParams}`;
      const res = await fetch(url);

      if (!res.ok) {
        let message = "Failed to export leads";

        try {
          const json = await res.json();
          message = json?.message || message;
        } catch (error) {
          console.error("handleExport parse error:", error);
        }

        throw new Error(message);
      }

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error("handleExport error:", error);
      alert(error?.message || "Failed to export leads");
    } finally {
      setExporting(false);
    }
  };

  const clearSearch = () => {
    try {
      setFilters((p) => ({ ...p, q: "" }));
    } catch (error) {
      console.error("clearSearch error:", error);
    }
  };

  const openLead = (id) => {
    try {
      setSelectedId(id);
      setDrawerOpen(true);
    } catch (error) {
      console.error("openLead error:", error);
    }
  };

  const closeEditModal = () => {
    try {
      setEditOpen(false);
      setEditForm(EMPTY_EDIT_FORM);
    } catch (error) {
      console.error("closeEditModal error:", error);
    }
  };

  const handleViewLead = async (e, id) => {
    try {
      e.stopPropagation();
      setSelectedId(id);
      setDrawerOpen(true);
    } catch (error) {
      console.error("handleViewLead error:", error);
    }
  };

  const handleEditLead = async (e, id) => {
    try {
      e.stopPropagation();
      setEditLoading(true);
      setEditOpen(true);

      const res = await fetch(`${API_BASE}/api/leads/${id}`);
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch lead details");
      }

      const lead = json?.data || {};

      setEditForm({
        _id: lead._id || "",
        name: lead.name || "",
        phone: lead.phone || "",
        email: lead.email || "",
        business: lead.business || "",
        industry: lead.industry || "",
        location: lead.location || "",
        requirements: lead.requirements || "",
        branch: lead.branch || "Bangalore",
        source: lead.source || "WhatsApp",
        stage: lead.stage || "Lead Capture",
        priority: lead.priority || "Hot",
        value: Number(lead.value || 0),
        days: lead.days || "0d",
        rep: lead.rep || "",
      });
    } catch (error) {
      console.error("handleEditLead error:", error);
      alert(error?.message || "Failed to load lead");
      setEditOpen(false);
    } finally {
      setEditLoading(false);
    }
  };

  const handleEditChange = (e) => {
    try {
      const { name, value } = e.target;
      setEditForm((prev) => ({
        ...prev,
        [name]: name === "value" ? Number(value || 0) : value,
      }));
    } catch (error) {
      console.error("handleEditChange error:", error);
    }
  };

  const handleEditSubmit = async (e) => {
    try {
      e.preventDefault();

      if (!String(editForm.name || "").trim()) {
        alert("Name is required");
        return;
      }

      if (!String(editForm.phone || "").trim()) {
        alert("Phone is required");
        return;
      }

      setEditSaving(true);

      const payload = {
        name: editForm.name,
        phone: editForm.phone,
        email: editForm.email,
        business: editForm.business,
        industry: editForm.industry,
        location: editForm.location,
        requirements: editForm.requirements,
        branch: editForm.branch,
        source: editForm.source,
        stage: editForm.stage,
        priority: editForm.priority,
        value: Number(editForm.value || 0),
        days: editForm.days,
        rep: editForm.rep,
      };

      const res = await fetch(`${API_BASE}/api/leads/${editForm._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to update lead");
      }

      closeEditModal();
      await fetchLeads();
      await fetchReps();

      alert("Lead updated successfully");
    } catch (error) {
      console.error("handleEditSubmit error:", error);
      alert(error?.message || "Failed to update lead");
    } finally {
      setEditSaving(false);
    }
  };

  return (
    <div className={`leadsLayout ${drawerOpen ? "drawer-open" : ""}`}>
      <Sidebar active="All Leads" />

      <div className="leadsMain">
        <Topbar title="All Leads" roleLabel="Master Admin" onCreateLead={onCreateLead} />

        <div className="leadsBody">
          <div className="filterCard">
            <div className="filterLeft">
              <div className="filterLabel">FILTER</div>

              <select
                value={filters.branch}
                onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}
              >
                {BRANCHES.map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? "All Branches" : x}
                  </option>
                ))}
              </select>

              <select
                value={filters.stage}
                onChange={(e) => setFilters((p) => ({ ...p, stage: e.target.value }))}
              >
                {STAGES.map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? "All Stages" : x}
                  </option>
                ))}
              </select>

              <select
                value={filters.priority}
                onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}
              >
                {PRIORITIES.map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? "All Priority" : x}
                  </option>
                ))}
              </select>

              <select
                value={filters.source}
                onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))}
              >
                {SOURCES.map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? "All Sources" : x}
                  </option>
                ))}
              </select>

              <select
                value={filters.bant}
                onChange={(e) => setFilters((p) => ({ ...p, bant: e.target.value }))}
              >
                {BANTS.map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? "All BANT" : x}
                  </option>
                ))}
              </select>

              <select
                value={filters.rep}
                onChange={(e) => setFilters((p) => ({ ...p, rep: e.target.value }))}
                disabled={repsLoading}
              >
                {repOptions.map((x) => (
                  <option key={x} value={x}>
                    {x === "All" ? (repsLoading ? "Loading Reps..." : "All Reps") : x}
                  </option>
                ))}
              </select>

              <div className="searchWrap">
                <Search size={14} className="searchIconSvg" />
                <input
                  className="filterSearch"
                  placeholder="Search name / phone / business"
                  value={filters.q}
                  onChange={(e) => setFilters((p) => ({ ...p, q: e.target.value }))}
                />
                {filters.q?.trim() ? (
                  <button className="searchClear" type="button" onClick={clearSearch}>
                    ×
                  </button>
                ) : null}
              </div>
            </div>

            <div className="filterRight">
              <div className="totalText">{money(total)}</div>
              <button
                className="exportBtn"
                type="button"
                onClick={handleExport}
                disabled={exporting}
              >
                <Download size={14} />
                {exporting ? "Exporting..." : "Export"}
              </button>
            </div>
          </div>

          {loading ? <div className="statusBox">Loading leads...</div> : null}
          {err ? <div className="statusBox errorBox">{err}</div> : null}

          <div className="tableCard">
            <div className="tableScroll">
              <table className="leadsTable">
                <thead>
                  <tr>
                    <th>Lead / Contact</th>
                    <th>Business</th>
                    <th>Branch</th>
                    <th>Source</th>
                    <th>Stage</th>
                    <th>BANT</th>
                    <th>Priority</th>
                    <th>Value</th>
                    <th>Days</th>
                    <th>Documents</th>
                    <th>Rep</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>
                  {!loading && rows.length === 0 ? (
                    <tr>
                      <td colSpan={12} className="emptyRow">
                        No leads found.
                      </td>
                    </tr>
                  ) : null}

                  {rows.map((r) => (
                    <tr key={r.id} className="clickRow rowClickable">
                      <td onClick={() => openLead(r.id)}>
                        <div className="leadName">{r.name}</div>
                        <div className="leadPhone">{r.phone}</div>
                      </td>

                      <td onClick={() => openLead(r.id)}>{r.business}</td>

                      <td onClick={() => openLead(r.id)}>
                        <span className={`pill branch ${cls(r.branch)}`}>{r.branch}</span>
                      </td>

                      <td onClick={() => openLead(r.id)}>
                        <span className="pill gray">{r.source}</span>
                      </td>

                      <td onClick={() => openLead(r.id)}>
                        <span className={`pill stage ${cls(r.stage)}`}>{r.stage}</span>
                      </td>

                      <td onClick={() => openLead(r.id)}>
                        <span
                          className={`bant ${
                            r.bant === "4/4" ? "ok" : r.bant === "1/4" || r.bant === "0/4" ? "bad" : "mid"
                          }`}
                        >
                          {r.bant}
                        </span>
                      </td>

                      <td onClick={() => openLead(r.id)}>
                        <span className={`prio ${cls(r.priority)}`}>{r.priority}</span>
                      </td>

                      <td className="value" onClick={() => openLead(r.id)}>
                        {money(r.value)}
                      </td>

                      <td onClick={() => openLead(r.id)}>{r.days}</td>

                      <td onClick={() => openLead(r.id)}>
                        <span className={`docs ${r.docs > 0 ? "has" : ""}`}>{r.docs} docs</span>
                      </td>

                      <td onClick={() => openLead(r.id)}>{r.rep}</td>

                      <td>
                        <div className="leadActions">
                          <button
                            type="button"
                            className="actionBtn viewBtn"
                            onClick={(e) => handleViewLead(e, r.id)}
                          >
                            <Eye size={14} />
                            View
                          </button>

                          <button
                            type="button"
                            className="actionBtn editBtn"
                            onClick={(e) => handleEditLead(e, r.id)}
                          >
                            <Pencil size={14} />
                            Edit
                          </button>

                          <button
                            type="button"
                            className="actionBtn deleteBtn"
                            onClick={(e) => handleDeleteLead(e, r.id)}
                            disabled={deletingId === r.id}
                          >
                            <Trash2 size={14} />
                            {deletingId === r.id ? "..." : "Del"}
                          </button>
                        </div>
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
        onClose={() => setDrawerOpen(false)}
        onLeadUpdated={async () => {
          try {
            await fetchLeads();
            await fetchReps();
          } catch (error) {
            console.error("onLeadUpdated error:", error);
          }
        }}
      />

      {editOpen ? (
        <div className="editModalOverlay" onClick={closeEditModal}>
          <div className="editModalCard" onClick={(e) => e.stopPropagation()}>
            <div className="editModalHeader">
              <h3>Edit Lead</h3>
              <button type="button" className="editCloseBtn" onClick={closeEditModal}>
                <X size={18} />
              </button>
            </div>

            {editLoading ? (
              <div className="editModalLoading">Loading lead details...</div>
            ) : (
              <form className="editLeadForm" onSubmit={handleEditSubmit}>
                <div className="editLeadGrid">
                  <div className="formGroup">
                    <label>Name *</label>
                    <input
                      name="name"
                      value={editForm.name}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label>Phone *</label>
                    <input
                      name="phone"
                      value={editForm.phone}
                      onChange={handleEditChange}
                      required
                    />
                  </div>

                  <div className="formGroup">
                    <label>Email</label>
                    <input
                      name="email"
                      value={editForm.email}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Business</label>
                    <input
                      name="business"
                      value={editForm.business}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Industry</label>
                    <input
                      name="industry"
                      value={editForm.industry}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Location</label>
                    <input
                      name="location"
                      value={editForm.location}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Branch</label>
                    <select
                      name="branch"
                      value={editForm.branch}
                      onChange={handleEditChange}
                    >
                      {EDIT_BRANCHES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Source</label>
                    <select
                      name="source"
                      value={editForm.source}
                      onChange={handleEditChange}
                    >
                      {EDIT_SOURCES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Stage</label>
                    <select
                      name="stage"
                      value={editForm.stage}
                      onChange={handleEditChange}
                    >
                      {EDIT_STAGES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Priority</label>
                    <select
                      name="priority"
                      value={editForm.priority}
                      onChange={handleEditChange}
                    >
                      {EDIT_PRIORITIES.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="formGroup">
                    <label>Value</label>
                    <input
                      type="number"
                      name="value"
                      value={editForm.value}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="formGroup">
                    <label>Days</label>
                    <input
                      name="days"
                      value={editForm.days}
                      onChange={handleEditChange}
                    />
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Rep</label>
                    <select
                      name="rep"
                      value={editForm.rep}
                      onChange={handleEditChange}
                    >
                      <option value="">Select Rep</option>
                      {repOptions
                        .filter((item) => item !== "All")
                        .map((item) => (
                          <option key={item} value={item}>
                            {item}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="formGroup fullWidth">
                    <label>Requirements</label>
                    <textarea
                      name="requirements"
                      value={editForm.requirements}
                      onChange={handleEditChange}
                      rows={4}
                    />
                  </div>
                </div>

                <div className="editModalFooter">
                  <button type="button" className="cancelBtn" onClick={closeEditModal}>
                    Cancel
                  </button>
                  <button type="submit" className="saveBtn" disabled={editSaving}>
                    {editSaving ? "Saving..." : "Update Lead"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}