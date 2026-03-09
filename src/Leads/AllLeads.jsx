import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";
import LeadDrawer from "../Leads/LeadDrawer";
import "./AllLeads.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const money = (n) => {
  try {
    if (n == null) return "-";
    return `₹${Number(n).toLocaleString("en-IN")}`;
  } catch {
    return "-";
  }
};

const cls = (s = "") => String(s).toLowerCase().replace(/\s+/g, "-");

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

  const BRANCHES = ["All", "Mysore", "Bangalore", "Mumbai"];
  const STAGES = ["All", "Lead Capture", "Reachable", "Qualified", "Proposal", "Closed"];
  const PRIORITIES = ["All", "Hot", "Warm", "Cold"];
  const SOURCES = ["All", "Referral", "WhatsApp", "Website", "Call", "Instagram", "Social", "Form", "Phone"];
  const BANTS = ["All", "0/4", "1/4", "2/4", "3/4", "4/4"];
  const REPS = ["All", "Arjun S", "Divya M", "Karthik R"];

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
    } catch {
      return "";
    }
  }, [filters]);

 const fetchLeads = async () => {
  try {
    setLoading(true);
    setErr("");

    const url = `${API_BASE}/api/leads?${queryParams}`;
    console.log("Fetching leads from:", url);

    const res = await fetch(url);
    console.log("Response status:", res.status);

    const json = await res.json();
    console.log("Response JSON:", json);

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
      fetchLeads();
    } catch (error) {
      console.error(error);
    }
  }, [queryParams]);

  const total = useMemo(() => {
    try {
      return rows.reduce((a, b) => a + (b.value || 0), 0);
    } catch {
      return 0;
    }
  }, [rows]);

  const onLogout = () => {
    try {
      localStorage.removeItem("nnc_auth");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
    }
  };

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
    } catch (e) {
      alert(e.message || "Failed to create lead");
    }
  };

  const clearSearch = () => {
    try {
      setFilters((p) => ({ ...p, q: "" }));
    } catch (error) {
      console.error(error);
    }
  };

  const openLead = (id) => {
    try {
      setSelectedId(id);
      setDrawerOpen(true);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={`leadsLayout ${drawerOpen ? "drawer-open" : ""}`}>
      <Sidebar active="All Leads" />

      <div className="leadsMain">
        <Topbar title="All Leads" roleLabel="Master Admin" onLogout={onLogout} onCreateLead={onCreateLead} />

        <div className="leadsBody">
          <div className="filterCard">
            <div className="filterLeft">
              <div className="filterLabel">FILTER</div>

              <select value={filters.branch} onChange={(e) => setFilters((p) => ({ ...p, branch: e.target.value }))}>
                {BRANCHES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>

              <select value={filters.stage} onChange={(e) => setFilters((p) => ({ ...p, stage: e.target.value }))}>
                {STAGES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>

              <select value={filters.priority} onChange={(e) => setFilters((p) => ({ ...p, priority: e.target.value }))}>
                {PRIORITIES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>

              <select value={filters.source} onChange={(e) => setFilters((p) => ({ ...p, source: e.target.value }))}>
                {SOURCES.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>

              <select value={filters.bant} onChange={(e) => setFilters((p) => ({ ...p, bant: e.target.value }))}>
                {BANTS.map((x) => <option key={x} value={x}>{x}</option>)}
              </select>

              <select value={filters.rep} onChange={(e) => setFilters((p) => ({ ...p, rep: e.target.value }))}>
                {REPS.map((x) => <option key={x} value={x}>{x === "All" ? "All Reps" : x}</option>)}
              </select>

              <div className="searchWrap">
                <span className="searchIcon">⌕</span>
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
              <button className="exportBtn" type="button">↓ Export</button>
            </div>
          </div>

          {loading ? <div style={{ padding: 12 }}>Loading...</div> : null}
          {err ? <div style={{ padding: 12, color: "crimson" }}>{err}</div> : null}

          <div className="tableCard">
            <table className="leadsTable">
              <thead>
                <tr>
                  <th>LEAD / CONTACT</th>
                  <th>BUSINESS</th>
                  <th>BRANCH</th>
                  <th>SOURCE</th>
                  <th>STAGE</th>
                  <th>BANT</th>
                  <th>PRIORITY</th>
                  <th>VALUE</th>
                  <th>DAYS</th>
                  <th>DOCUMENTS</th>
                  <th>REP</th>
                </tr>
              </thead>

              <tbody>
                {!loading && rows.length === 0 ? (
                  <tr>
                    <td colSpan={11} style={{ padding: 16, color: "#666" }}>
                      No leads found.
                    </td>
                  </tr>
                ) : null}

                {rows.map((r) => (
                  <tr key={r.id} className="clickRow" onClick={() => openLead(r.id)}>
                    <td>
                      <div className="leadName">{r.name}</div>
                      <div className="leadPhone">{r.phone}</div>
                    </td>
                    <td>{r.business}</td>
                    <td><span className={`pill branch ${cls(r.branch)}`}>{r.branch}</span></td>
                    <td><span className="pill gray">{r.source}</span></td>
                    <td><span className={`pill stage ${cls(r.stage)}`}>• {r.stage}</span></td>
                    <td>
                      <span className={`bant ${r.bant === "4/4" ? "ok" : r.bant === "1/4" ? "bad" : "mid"}`}>
                        {r.bant}
                      </span>
                    </td>
                    <td><span className={`prio ${cls(r.priority)}`}>{r.priority}</span></td>
                    <td className="value">{money(r.value)}</td>
                    <td>{r.days}</td>
                    <td><span className={`docs ${r.docs > 0 ? "has" : ""}`}>{r.docs} docs</span></td>
                    <td>{r.rep}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <LeadDrawer
        open={drawerOpen}
        leadId={selectedId}
        apiBase={API_BASE}
        onClose={() => setDrawerOpen(false)}
      />
    </div>
  );
}