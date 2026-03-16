import React, { useEffect, useMemo, useState } from "react";
import { Crown, Search, Upload, Plus, Trophy } from "lucide-react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getLeaderboard } from "../../services/leaderboardService";
import "./Leaderboard.css";

const DEFAULT_DATA = {
  title: "Rep Leaderboard",
  filterLabel: "This Month",
  topThree: [],
  recentActivity: [],
  performanceBreakdown: [],
};

export default function Leaderboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [leaderboard, setLeaderboard] = useState(DEFAULT_DATA);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await getLeaderboard();
      setLeaderboard(response?.data || DEFAULT_DATA);
    } catch (error) {
      console.error("fetchLeaderboard error:", error);
      setLeaderboard(DEFAULT_DATA);
      setErrorMessage(error?.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const filteredPerformance = useMemo(() => {
    try {
      if (!searchText.trim()) return leaderboard.performanceBreakdown || [];
      const q = searchText.toLowerCase().trim();

      return (leaderboard.performanceBreakdown || []).filter((item) => {
        return (
          String(item?.rep || "")
            .toLowerCase()
            .includes(q) ||
          String(item?.branch || "")
            .toLowerCase()
            .includes(q)
        );
      });
    } catch (error) {
      console.error("filteredPerformance error:", error);
      return leaderboard.performanceBreakdown || [];
    }
  }, [leaderboard.performanceBreakdown, searchText]);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-IN");
    } catch (error) {
      return {
        format: (value) => `${value || 0}`,
      };
    }
  }, []);

  return (
    <div className="lbLayout">
      <Sidebar />

      <div className="lbMain">
        <div className="lbPage">
          <div className="lbTopbar">
            <div className="lbTopbarLeft">
              <h1 className="lbTitle">Rep Leaderboard</h1>
              <span className="lbAdminPill">
                <Crown size={14} />
                Master Admin
              </span>
            </div>

            <div className="lbTopbarRight">
              <div className="lbSearch">
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
                className="lbGhostBtn"
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
                className="lbPrimaryBtn"
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

          {errorMessage ? (
            <div className="lbErrorCard">
              <strong>Something went wrong.</strong>
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {loading ? (
            <div className="lbLoadingCard">Loading leaderboard...</div>
          ) : (
            <>
              <div className="lbGridTop">
                <div className="lbCard">
                  <div className="lbCardHead">
                    <div className="lbCardTitleRow">
                      <Trophy size={18} />
                      <h3>{leaderboard.title || "Rep Leaderboard"}</h3>
                    </div>
                    <span className="lbMonthPill">
                      {leaderboard.filterLabel || "This Month"}
                    </span>
                  </div>

                  <div className="lbTopList">
                    {(leaderboard.topThree || []).length > 0 ? (
                      leaderboard.topThree.map((item) => (
                        <div className="lbTopItem" key={`${item.name}-${item.rank}`}>
                          <div className="lbRank">{item.rank}</div>

                          <div
                            className="lbAvatar"
                            style={{ background: item.color || "#3b82f6" }}
                          >
                            {item.initials}
                          </div>

                          <div className="lbTopInfo">
                            <div className="lbTopName">{item.name}</div>
                            <div className="lbTopBranch">{item.branch}</div>

                            <div className="lbProgressTrack">
                              <div
                                className="lbProgressFill"
                                style={{
                                  width: `${Math.min(item.closed * 4, 100)}%`,
                                  background: item.color || "#3b82f6",
                                }}
                              />
                            </div>
                          </div>

                          <div className="lbTopMetrics">
                            <div className="lbMetricBlock">
                              <strong>{item.closed}</strong>
                              <span>Closed</span>
                            </div>
                            <div className="lbMetricBlock">
                              <strong>₹{formatCompactINR(item.revenue)}</strong>
                              <span>Revenue</span>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="lbEmpty">No leaderboard data available</div>
                    )}
                  </div>
                </div>

                <div className="lbCard">
                  <div className="lbCardHead">
                    <h3>Activity Log — Today</h3>
                  </div>

                  <div className="lbActivityList">
                    {(leaderboard.recentActivity || []).length > 0 ? (
                      leaderboard.recentActivity.map((item, index) => (
                        <div className="lbActivityItem" key={`${item.rep}-${index}`}>
                          <span
                            className="lbActivityDot"
                            style={{ background: item.color || "#3b82f6" }}
                          />
                          <div className="lbActivityContent">
                            <div className="lbActivityText">
                              <strong>{item.rep}</strong> {item.text}
                              {item.meta ? <span> · {item.meta}</span> : null}
                            </div>
                            <div className="lbActivityTime">{item.timeAgo}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="lbEmpty">No recent activity</div>
                    )}
                  </div>
                </div>
              </div>

              <div className="lbCard">
                <div className="lbCardHead">
                  <h3>Performance Breakdown</h3>
                </div>

                <div className="lbTableWrap">
                  <table className="lbTable">
                    <thead>
                      <tr>
                        <th>Rep</th>
                        <th>Branch</th>
                        <th>Leads</th>
                        <th>Contacted</th>
                        <th>Qualified</th>
                        <th>Proposals</th>
                        <th>Closed</th>
                        <th>Close Rate</th>
                        <th>Revenue</th>
                        <th>Docs Uploaded</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPerformance.length > 0 ? (
                        filteredPerformance.map((row, index) => (
                          <tr key={`${row.rep}-${index}`}>
                            <td>
                              <div className="lbRepCell">
                                <div className="lbMiniAvatar">
                                  {String(row.rep || "U")
                                    .split(" ")
                                    .map((p) => p[0])
                                    .join("")
                                    .slice(0, 2)
                                    .toUpperCase()}
                                </div>
                                <span>{row.rep}</span>
                              </div>
                            </td>
                            <td>{row.branch}</td>
                            <td>{row.leads}</td>
                            <td>{row.contacted}</td>
                            <td>{row.qualified}</td>
                            <td>{row.proposals}</td>
                            <td>{row.closed}</td>
                            <td>
                              <span className="lbRateBadge">{row.closeRate}%</span>
                            </td>
                            <td className="lbRevenueCell">
                              ₹{currencyFormatter.format(row.revenue || 0)}
                            </td>
                            <td>{row.docsUploaded}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="10" className="lbEmptyTd">
                            No matching leaderboard rows found
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function formatCompactINR(value) {
  try {
    const number = Number(value || 0);
    if (number >= 10000000) return `${(number / 10000000).toFixed(1)}Cr`;
    if (number >= 100000) return `${(number / 100000).toFixed(1)}L`;
    if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
    return `${number}`;
  } catch (error) {
    return "0";
  }
}