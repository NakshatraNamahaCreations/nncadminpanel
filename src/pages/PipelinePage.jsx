import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";
import "./PipelinePage.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const STAGES = [
  "Lead Capture",
  "Reachable",
  "Qualified",
  "Proposal",
  "Closed",
];

const BRANCHES = ["All", "Bangalore", "Mumbai", "Mysore"];
const REPS = ["All Reps", "Arjun S", "Divya M", "Karthik R", "Neha P", "Rahul M"];

const money = (n) => {
  try {
    if (n == null) return "₹0";
    return `₹${Number(n).toLocaleString("en-IN")}`;
  } catch {
    return "₹0";
  }
};

const stageClass = (v = "") => {
  try {
    return String(v).toLowerCase().replace(/\s+/g, "-");
  } catch {
    return "";
  }
};

const getStageHeading = (stage) => {
  try {
    if (stage === "Qualified") return "Qualification";
    if (stage === "Closed") return "Closed Won";
    return stage;
  } catch {
    return stage;
  }
};

const getAgoText = (dateValue) => {
  try {
    if (!dateValue) return "Just now";

    const now = new Date();
    const d = new Date(dateValue);
    const diffMs = now - d;

    const mins = Math.floor(diffMs / (1000 * 60));
    const hrs = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days === 1) return "Yesterday";
    return `${days}d ago`;
  } catch {
    return "Just now";
  }
};

const getIndustryLine = (lead) => {
  try {
    const parts = [];
    if (lead.business) parts.push(lead.business);
    if (lead.branch) parts.push(lead.branch);
    return parts.join(" · ") || "-";
  } catch {
    return "-";
  }
};

const getBantProgressWidth = (bant) => {
  try {
    const num = Number(String(bant || "0/4").split("/")[0] || 0);
    return `${Math.max(0, Math.min(100, (num / 4) * 100))}%`;
  } catch {
    return "0%";
  }
};

const getStageTag = (lead) => {
  try {
    if (lead.stage === "Lead Capture") return "New";
    if (lead.stage === "Reachable") return "Contacted";
    if (lead.stage === "Qualified") return "BANT";
    if (lead.stage === "Proposal") return "Day 2";
    if (lead.stage === "Closed") return "Won";
    return lead.stage || "New";
  } catch {
    return "New";
  }
};

const getSourceTag = (lead) => {
  try {
    return lead.source || "Source";
  } catch {
    return "Source";
  }
};

export default function PipelinePage() {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [search, setSearch] = useState("");
  const [activeBranch, setActiveBranch] = useState("All");
  const [activeRep, setActiveRep] = useState("All Reps");

  const [pipeline, setPipeline] = useState({
    "Lead Capture": [],
    Reachable: [],
    Qualified: [],
    Proposal: [],
    Closed: [],
  });

  const fetchPipeline = async () => {
    try {
      setLoading(true);
      setErr("");

      const res = await fetch(`${API_BASE}/api/leads/pipeline-data/all`);
      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch pipeline data");
      }

      setPipeline({
        "Lead Capture": json?.data?.["Lead Capture"] || [],
        Reachable: json?.data?.Reachable || [],
        Qualified: json?.data?.Qualified || [],
        Proposal: json?.data?.Proposal || [],
        Closed: json?.data?.Closed || [],
      });
    } catch (error) {
      console.error("fetchPipeline error:", error);
      setErr(error.message || "Failed to fetch pipeline data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      fetchPipeline();
    } catch (error) {
      console.error(error);
    }
  }, []);

  const filteredPipeline = useMemo(() => {
    try {
      const q = String(search || "").trim().toLowerCase();
      const result = {};

      STAGES.forEach((stage) => {
        const arr = pipeline?.[stage] || [];

        result[stage] = arr.filter((lead) => {
          const matchesBranch =
            activeBranch === "All" ? true : String(lead.branch || "") === activeBranch;

          const matchesRep =
            activeRep === "All Reps" ? true : String(lead.rep || "") === activeRep;

          const haystack = [
            lead.name,
            lead.phone,
            lead.business,
            lead.source,
            lead.rep,
            lead.branch,
          ]
            .join(" ")
            .toLowerCase();

          const matchesSearch = !q ? true : haystack.includes(q);

          return matchesBranch && matchesRep && matchesSearch;
        });
      });

      return result;
    } catch (error) {
      console.error("filteredPipeline error:", error);
      return pipeline;
    }
  }, [pipeline, search, activeBranch, activeRep]);

  const totalOpen = useMemo(() => {
    try {
      return STAGES.reduce((sum, stage) => {
        return sum + (filteredPipeline?.[stage]?.length || 0);
      }, 0);
    } catch {
      return 0;
    }
  }, [filteredPipeline]);

  const totalValue = useMemo(() => {
    try {
      return STAGES.reduce((sum, stage) => {
        const stageTotal = (filteredPipeline?.[stage] || []).reduce((a, b) => {
          return a + Number(b.value || 0);
        }, 0);
        return sum + stageTotal;
      }, 0);
    } catch {
      return 0;
    }
  }, [filteredPipeline]);

  const onLogout = () => {
    try {
      localStorage.removeItem("nnc_auth");
      localStorage.removeItem("nnc_token");
      localStorage.removeItem("nnc_role");
      localStorage.removeItem("nnc_email");
      localStorage.removeItem("nnc_user");
      window.location.href = "/";
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateLead = async (payload) => {
    try {
      const token = localStorage.getItem("nnc_token");

      const response = await fetch(`${API_BASE}/api/leads`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result?.success) {
        throw new Error(result?.message || "Failed to create lead");
      }

      await fetchPipeline();
      alert("Lead created successfully");
    } catch (error) {
      console.error("handleCreateLead error:", error);
      alert(error?.message || "Failed to create lead");
      throw error;
    }
  };

  return (
    <div className="pipelineLayoutNew">
      <Sidebar active="Pipeline" />

      <div className="pipelineMainNew">
        <Topbar
          title="Pipeline"
          roleLabel="Master Admin"
          onLogout={onLogout}
          onCreateLead={handleCreateLead}
          showUpload={false}
          showAddLead={true}
          showLogout={true}
          addLeadLabel="Add Lead"
        >
          <input
            className="docsSearch"
            type="text"
            placeholder="Search leads, pipeline..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </Topbar>

        <div className="pipelineFilterBar">
          <div className="pipelineFilterLeft">
            <div className="branchTabs">
              {BRANCHES.map((branch) => (
                <button
                  key={branch}
                  type="button"
                  className={`branchTab ${activeBranch === branch ? "active" : ""}`}
                  onClick={() => setActiveBranch(branch)}
                >
                  {branch}
                </button>
              ))}
            </div>

            <select
              className="repSelect"
              value={activeRep}
              onChange={(e) => setActiveRep(e.target.value)}
            >
              {REPS.map((rep) => (
                <option key={rep} value={rep}>
                  {rep}
                </option>
              ))}
            </select>
          </div>

          <div className="pipelineFilterRight">
            <span>{totalOpen} open</span>
            <span>·</span>
            <span>{money(totalValue)} value</span>
          </div>
        </div>

        <div className="pipelineBoardWrap">
          {loading ? <div className="pipelineInfoState">Loading pipeline...</div> : null}
          {err ? <div className="pipelineInfoError">{err}</div> : null}

          <div className="pipelineBoardNew">
            {STAGES.map((stage) => {
              const leads = filteredPipeline?.[stage] || [];

              return (
                <div key={stage} className={`kanbanColumn ${stageClass(stage)}`}>
                  <div className={`kanbanHeader ${stageClass(stage)}`}>
                    <span className="kanbanHeaderTitle">
                      {getStageHeading(stage).toUpperCase()}
                    </span>
                    <span className="kanbanHeaderCount">{leads.length}</span>
                  </div>

                  <div className="kanbanColumnBody">
                    {leads.length === 0 ? (
                      <div className="kanbanEmptyCard">No leads</div>
                    ) : null}

                    {leads.map((lead) => (
                      <div className="pipelineLeadCard" key={lead.id || lead._id}>
                        <div className="leadCardHeader">
                          <div className="leadCardName">{lead.name || "-"}</div>
                        </div>

                        <div className="leadCardSubline">{getIndustryLine(lead)}</div>

                        <div className="leadCardTags">
                          <span className={`miniTag stageTag ${stageClass(lead.stage)}`}>
                            {getStageTag(lead)}
                          </span>
                          <span className="miniTag sourceTag">{getSourceTag(lead)}</span>
                        </div>

                        <div className="leadCardBantRow">
                          <span className="bantLabel">BANT</span>
                          <span className="bantValue">{lead.bant || "0/4"}</span>
                        </div>

                        <div className="bantProgressTrack">
                          <div
                            className={`bantProgressFill ${stageClass(lead.stage)}`}
                            style={{ width: getBantProgressWidth(lead.bant) }}
                          />
                        </div>

                        <div className="leadCardFooter">
                          <div className="leadValue">{money(lead.value)}</div>
                          <div className="leadAgo">{getAgoText(lead.createdAt)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}