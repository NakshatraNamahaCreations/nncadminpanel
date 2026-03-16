import React, { useEffect, useMemo, useState } from "react";
import { Crown, Search, Upload, Plus, RefreshCcw } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getBranchReports } from "../../services/branchReportsService";
import "./BranchReports.css";

const DEFAULT_DATA = {
  summary: {
    reachability: 0,
    qualification: 0,
    proposalConv: 0,
    closeRate: 0,
    revPerEnquiry: 0,
    avgDealValue: 0,
  },
  branches: [],
  revenueProjection: {
    currentRevenue: 0,
    optimizedTarget: 0,
    potentialUplift: 0,
    currentDeals: 0,
    targetDeals: 0,
  },
};

export default function BranchReports() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [report, setReport] = useState(DEFAULT_DATA);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await getBranchReports();
      setReport(response?.data || DEFAULT_DATA);
    } catch (error) {
      console.error("fetchReport error:", error);
      setReport(DEFAULT_DATA);
      setErrorMessage(error?.message || "Failed to load branch reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const filteredBranches = useMemo(() => {
    try {
      if (!searchText.trim()) return report.branches || [];
      const q = searchText.toLowerCase().trim();

      return (report.branches || []).filter((item) =>
        String(item?.name || "")
          .toLowerCase()
          .includes(q)
      );
    } catch (error) {
      console.error("filteredBranches error:", error);
      return report.branches || [];
    }
  }, [report.branches, searchText]);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-IN");
    } catch (error) {
      console.error("currencyFormatter error:", error);
      return { format: (value) => `${value || 0}` };
    }
  }, []);

  return (
    <div className="brLayout">
      <Sidebar />

      <main className="brMain">
        <div className="brTopbar">
          <div className="brTopbarLeft">
            <h1 className="brTitle">Branch Reports</h1>
            <span className="brAdminPill">
              <Crown size={14} />
              Master Admin
            </span>
          </div>

          <div className="brTopbarRight">
            <div className="brSearch">
              <Search size={16} />
              <input
                type="text"
                placeholder="Search leads, docs..."
                value={searchText}
                onChange={(e) => {
                  try {
                    setSearchText(e.target.value);
                  } catch (error) {
                    console.error("search change error:", error);
                  }
                }}
              />
            </div>

            <button
              type="button"
              className="brGhostBtn"
              onClick={() => {
                try {
                  navigate("/documents");
                } catch (error) {
                  console.error("navigate documents error:", error);
                }
              }}
            >
              <Upload size={16} />
              Upload
            </button>

            <button
              type="button"
              className="brGhostBtn"
              onClick={() => {
                try {
                  fetchReport();
                } catch (error) {
                  console.error("refresh report error:", error);
                }
              }}
            >
              <RefreshCcw size={16} />
              Refresh
            </button>

            <button
              type="button"
              className="brPrimaryBtn"
              onClick={() => {
                try {
                  navigate("/leads");
                } catch (error) {
                  console.error("navigate leads error:", error);
                }
              }}
            >
              <Plus size={16} />
              Add Lead
            </button>
          </div>
        </div>

        <div className="brContent">
          {errorMessage ? (
            <div className="brErrorCard">
              <strong>Something went wrong.</strong>
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {loading ? (
            <div className="brLoadingCard">Loading branch reports...</div>
          ) : (
            <>
              <div className="brSummaryGrid">
                <SummaryCard
                  title="REACHABILITY"
                  value={`${report.summary.reachability}%`}
                  target="Target 85%"
                  color="#356AE6"
                  fill={report.summary.reachability}
                />
                <SummaryCard
                  title="QUALIFICATION"
                  value={`${report.summary.qualification}%`}
                  target="Target 70%"
                  color="#f59e0b"
                  fill={report.summary.qualification}
                />
                <SummaryCard
                  title="PROPOSAL CONV."
                  value={`${report.summary.proposalConv}%`}
                  target="Target 60%"
                  color="#7c3aed"
                  fill={report.summary.proposalConv}
                />
                <SummaryCard
                  title="CLOSE RATE"
                  value={`${report.summary.closeRate}%`}
                  target="Target 37%"
                  color="#10b981"
                  fill={report.summary.closeRate}
                />
                <SummaryCard
                  title="REV / ENQUIRY"
                  value={`₹${currencyFormatter.format(report.summary.revPerEnquiry)}`}
                  target="Target ₹1,050"
                  color="#356AE6"
                  fill={78}
                />
                <SummaryCard
                  title="AVG DEAL VALUE"
                  value={`₹${currencyFormatter.format(report.summary.avgDealValue)}`}
                  target="Target ₹15,000"
                  color="#22c55e"
                  fill={83}
                />
              </div>

              <div className="brGrid">
                {filteredBranches.map((branch, index) => (
                  <div className="brBranchCard" key={`${branch.name}-${index}`}>
                    <div className="brBranchHead">
                      <div>
                        <div className="brBranchTitle">
                          {branch.name === "Bangalore"
                            ? "🏙️"
                            : branch.name === "Mumbai"
                            ? "🌆"
                            : branch.name === "Mysore"
                            ? "🏡"
                            : "📍"}{" "}
                          {branch.name}
                        </div>
                        <div className="brBranchSub">
                          {branch.enquiries} enquiries · ₹
                          {currencyFormatter.format(branch.revenue)}
                        </div>
                      </div>

                      {branch.tag ? (
                        <span
                          className={`brTag ${
                            branch.tag === "Best"
                              ? "best"
                              : branch.tag === "Lowest"
                              ? "lowest"
                              : ""
                          }`}
                        >
                          {branch.tag}
                        </span>
                      ) : null}
                    </div>

                    <div className="brMetricList">
                      <MetricBar
                        label="Enquiries"
                        value={branch.enquiries}
                        percent={100}
                        color="#356AE6"
                      />
                      <MetricBar
                        label="Reachable"
                        value={branch.reachable}
                        percent={branch.reachability}
                        color="#356AE6"
                      />
                      <MetricBar
                        label="Qualified"
                        value={branch.qualified}
                        percent={branch.qualification}
                        color="#f59e0b"
                      />
                      <MetricBar
                        label="Proposal"
                        value={branch.proposal}
                        percent={branch.proposalConv}
                        color="#7c3aed"
                      />
                      <MetricBar
                        label="Closed"
                        value={branch.closed}
                        percent={branch.closeRate}
                        color="#10b981"
                      />
                    </div>

                    <div
                      className={`brNote ${
                        branch.tag === "Best"
                          ? "best"
                          : branch.tag === "Lowest"
                          ? "lowest"
                          : "normal"
                      }`}
                    >
                      {branch.tag === "Best" ? "✅ " : branch.tag === "Lowest" ? "⚠️ " : "⚠️ "}
                      {branch.note}
                    </div>
                  </div>
                ))}

                <div className="brProjectionCard">
                  <div className="brBranchHead">
                    <div className="brBranchTitle">💰 Revenue Projection</div>
                    <span className="brTag optimized">Optimised</span>
                  </div>

                  <div className="brProjectionRows">
                    <ProjectionRow
                      label="Current Revenue"
                      value={`₹${currencyFormatter.format(
                        report.revenueProjection.currentRevenue
                      )}`}
                    />
                    <ProjectionRow
                      label="Optimised Target"
                      value={`₹${currencyFormatter.format(
                        report.revenueProjection.optimizedTarget
                      )}`}
                      green
                    />
                    <ProjectionRow
                      label="Potential Uplift"
                      value={`+₹${currencyFormatter.format(
                        report.revenueProjection.potentialUplift
                      )}`}
                      blue
                    />
                    <ProjectionRow
                      label="Current Deals"
                      value={`${report.revenueProjection.currentDeals} deals`}
                    />
                    <ProjectionRow
                      label="Target Deals"
                      value={`~${report.revenueProjection.targetDeals} deals`}
                      green
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}

function SummaryCard({ title, value, target, color, fill }) {
  return (
    <div className="brSummaryCard">
      <div className="brSummaryTitle">{title}</div>
      <div className="brSummaryValue">{value}</div>
      <div className="brSummaryTarget">{target}</div>
      <div className="brSummaryTrack">
        <div
          className="brSummaryFill"
          style={{ width: `${Math.min(fill, 100)}%`, background: color }}
        />
      </div>
    </div>
  );
}

function MetricBar({ label, value, percent, color }) {
  return (
    <div className="brMetricRow">
      <div className="brMetricLabel">{label}</div>
      <div className="brMetricBarWrap">
        <div className="brMetricNumber">{value}</div>
        <div className="brMetricTrack">
          <div
            className="brMetricFill"
            style={{
              width: `${Math.min(percent, 100)}%`,
              background: color,
            }}
          />
        </div>
        <div className="brMetricPercent">{percent}%</div>
      </div>
    </div>
  );
}

function ProjectionRow({ label, value, green, blue }) {
  return (
    <div
      className={`brProjectionRow ${green ? "green" : ""} ${blue ? "blue" : ""}`}
    >
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}