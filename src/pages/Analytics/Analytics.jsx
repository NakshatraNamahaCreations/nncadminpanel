import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Upload,
  Plus,
  Crown,
  TrendingUp,
  Users,
  CircleDollarSign,
  Target,
  RefreshCcw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import Sidebar from "../../components/Sidebar/Sidebar";
import { getAnalytics } from "../../services/analyticsService";
import "./Analytics.css";

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"];

const DEFAULT_ANALYTICS = {
  totals: {
    totalLeads: 0,
    totalClosed: 0,
    totalRevenue: 0,
    avgConversion: 0,
  },
  monthlyEnquiriesVsClosed: [],
  revenueByBranch: [],
  conversionRateTrend: [],
  leadSourceConversion: [],
  avgDaysPerStage: [],
  topReps: [],
};

export default function Analytics() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [analytics, setAnalytics] = useState(DEFAULT_ANALYTICS);

  const normalizeAnalyticsResponse = (response) => {
    try {
      const payload = response?.data || response || {};

      return {
        totals: {
          totalLeads: Number(payload?.totals?.totalLeads || 0),
          totalClosed: Number(payload?.totals?.totalClosed || 0),
          totalRevenue: Number(payload?.totals?.totalRevenue || 0),
          avgConversion: Number(payload?.totals?.avgConversion || 0),
        },
        monthlyEnquiriesVsClosed: Array.isArray(payload?.monthlyEnquiriesVsClosed)
          ? payload.monthlyEnquiriesVsClosed
          : [],
        revenueByBranch: Array.isArray(payload?.revenueByBranch)
          ? payload.revenueByBranch
          : [],
        conversionRateTrend: Array.isArray(payload?.conversionRateTrend)
          ? payload.conversionRateTrend
          : [],
        leadSourceConversion: Array.isArray(payload?.leadSourceConversion)
          ? payload.leadSourceConversion
          : [],
        avgDaysPerStage: Array.isArray(payload?.avgDaysPerStage)
          ? payload.avgDaysPerStage
          : [],
        topReps: Array.isArray(payload?.topReps) ? payload.topReps : [],
      };
    } catch (error) {
      console.error("normalizeAnalyticsResponse error:", error);
      return DEFAULT_ANALYTICS;
    }
  };

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMessage("");

      const response = await getAnalytics();
      const normalized = normalizeAnalyticsResponse(response);
      setAnalytics(normalized);
    } catch (error) {
      console.error("Fetch analytics error:", error);
      setAnalytics(DEFAULT_ANALYTICS);
      setErrorMessage(error?.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      fetchAnalytics();
    } catch (error) {
      console.error("useEffect fetchAnalytics error:", error);
    }
  }, []);

  const currencyFormatter = useMemo(() => {
    try {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      });
    } catch (error) {
      console.error("currencyFormatter error:", error);
      return {
        format: (value) => `₹${value || 0}`,
      };
    }
  }, []);

  const filteredTopReps = useMemo(() => {
    try {
      if (!searchText.trim()) return analytics.topReps;

      const q = searchText.toLowerCase().trim();
      return analytics.topReps.filter((rep) =>
        String(rep?.name || "")
          .toLowerCase()
          .includes(q)
      );
    } catch (error) {
      console.error("filteredTopReps error:", error);
      return analytics.topReps;
    }
  }, [analytics.topReps, searchText]);

  const trendKeys = useMemo(() => {
    try {
      if (!analytics.conversionRateTrend.length) return [];
      return Object.keys(analytics.conversionRateTrend[0]).filter((key) => key !== "month");
    } catch (error) {
      console.error("trendKeys error:", error);
      return [];
    }
  }, [analytics.conversionRateTrend]);

  const validRevenueByBranch = useMemo(() => {
    try {
      return (analytics.revenueByBranch || []).filter(
        (item) => Number(item?.value || 0) > 0
      );
    } catch (error) {
      console.error("validRevenueByBranch error:", error);
      return [];
    }
  }, [analytics.revenueByBranch]);

  const sourceChartData = useMemo(() => {
    try {
      return (analytics.leadSourceConversion || []).map((item, index) => ({
        ...item,
        fill: PIE_COLORS[index % PIE_COLORS.length],
      }));
    } catch (error) {
      console.error("sourceChartData error:", error);
      return [];
    }
  }, [analytics.leadSourceConversion]);

  const hasTrendData = useMemo(() => {
    try {
      if (!analytics.conversionRateTrend.length || !trendKeys.length) return false;

      return analytics.conversionRateTrend.some((row) =>
        trendKeys.some((key) => Number(row?.[key] || 0) > 0)
      );
    } catch (error) {
      console.error("hasTrendData error:", error);
      return false;
    }
  }, [analytics.conversionRateTrend, trendKeys]);

  const hasAnyChartData = useMemo(() => {
    try {
      return (
        analytics.monthlyEnquiriesVsClosed.length > 0 ||
        analytics.revenueByBranch.length > 0 ||
        analytics.conversionRateTrend.length > 0 ||
        analytics.leadSourceConversion.length > 0 ||
        analytics.avgDaysPerStage.length > 0 ||
        analytics.topReps.length > 0
      );
    } catch (error) {
      console.error("hasAnyChartData error:", error);
      return false;
    }
  }, [analytics]);

  return (
    <div className="anLayout">
      <Sidebar />

      <div className="anMain">
        {loading ? (
          <div className="anPage">
            <div className="anLoadingCard">Loading analytics...</div>
          </div>
        ) : (
          <div className="anPage">
            <div className="anTopbar">
              <div className="anTopbarLeft">
                <h1 className="anTitle">Analytics</h1>
                <span className="anAdminPill">
                  <Crown size={14} />
                  Master Admin
                </span>
              </div>

              <div className="anTopbarRight">
                <div className="anSearch">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search rep name..."
                    value={searchText}
                    onChange={(e) => {
                      try {
                        setSearchText(e.target.value);
                      } catch (error) {
                        console.error("Search input error:", error);
                      }
                    }}
                  />
                </div>

                <button
                  type="button"
                  className="anGhostBtn"
                  onClick={() => {
                    try {
                      navigate("/documents");
                    } catch (error) {
                      console.error("Navigate documents error:", error);
                    }
                  }}
                >
                  <Upload size={16} />
                  Upload
                </button>

                <button
                  type="button"
                  className="anGhostBtn"
                  onClick={() => {
                    try {
                      fetchAnalytics();
                    } catch (error) {
                      console.error("Refresh error:", error);
                    }
                  }}
                >
                  <RefreshCcw size={16} />
                  Refresh
                </button>

                <button
                  type="button"
                  className="anPrimaryBtn"
                  onClick={() => {
                    try {
                      navigate("/leads");
                    } catch (error) {
                      console.error("Navigate leads error:", error);
                    }
                  }}
                >
                  <Plus size={16} />
                  Add Lead
                </button>
              </div>
            </div>

            {errorMessage ? (
              <div className="anErrorCard">
                <strong>Something went wrong.</strong>
                <span>{errorMessage}</span>
              </div>
            ) : null}

            <div className="anStatsGrid">
              <StatCard
                icon={<Users size={18} />}
                label="Total Leads"
                value={analytics.totals.totalLeads}
              />
              <StatCard
                icon={<Target size={18} />}
                label="Closed Deals"
                value={analytics.totals.totalClosed}
              />
              <StatCard
                icon={<CircleDollarSign size={18} />}
                label="Revenue"
                value={currencyFormatter.format(analytics.totals.totalRevenue)}
              />
              <StatCard
                icon={<TrendingUp size={18} />}
                label="Avg Conversion"
                value={`${analytics.totals.avgConversion}%`}
              />
            </div>

            {!hasAnyChartData ? (
              <div className="anEmptyCard">No analytics data available right now.</div>
            ) : (
              <>
                <div className="anGrid anGridTop">
                  <div className="anCard">
                    <div className="anCardHead">
                      <h3>Monthly Enquiries vs Closed</h3>
                    </div>

                    <div className="anChartWrap">
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={analytics.monthlyEnquiriesVsClosed}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="enquiries" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                          <Bar dataKey="closed" fill="#10b981" radius={[6, 6, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="anCard">
                    <div className="anCardHead">
                      <h3>Revenue by Branch</h3>
                    </div>

                    <div className="anChartWrap">
                      {validRevenueByBranch.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                              <Pie
                                data={validRevenueByBranch}
                                dataKey="value"
                                nameKey="name"
                                innerRadius={58}
                                outerRadius={95}
                                paddingAngle={3}
                              >
                                {validRevenueByBranch.map((entry, index) => (
                                  <Cell
                                    key={`cell-${entry?.name || "branch"}-${index}`}
                                    fill={PIE_COLORS[index % PIE_COLORS.length]}
                                  />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value) => currencyFormatter.format(value)} />
                            </PieChart>
                          </ResponsiveContainer>

                          <div className="anLegendRow">
                            {validRevenueByBranch.map((item, index) => (
                              <div key={`${item?.name || "branch"}-${index}`} className="anLegendItem">
                                <span
                                  className="anLegendDot"
                                  style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                                />
                                <span>
                                  {item?.name || "Unknown"} — {currencyFormatter.format(item?.value || 0)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="anChartEmpty">
                          <div className="anChartEmptyIcon">📊</div>
                          <div className="anChartEmptyTitle">No branch revenue yet</div>
                          <div className="anChartEmptyText">
                            Revenue chart will appear when lead values are available branch-wise.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="anCard">
                  <div className="anCardHead">
                    <h3>Conversion Rate Trend</h3>
                    <div className="anLegendRight">
                      {trendKeys.map((key, index) => (
                        <span
                          key={key}
                          className={`anMiniBadge ${
                            index % 3 === 0 ? "blue" : index % 3 === 1 ? "orange" : "green"
                          }`}
                        >
                          {key}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="anChartWrap">
                    {hasTrendData ? (
                      <ResponsiveContainer width="100%" height={290}>
                        <LineChart
                          data={analytics.conversionRateTrend}
                          margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
                          <Tooltip formatter={(value) => `${value}%`} />
                          {trendKeys.map((key, index) => (
                            <Line
                              key={key}
                              type="monotone"
                              dataKey={key}
                              stroke={PIE_COLORS[index % PIE_COLORS.length]}
                              strokeWidth={3}
                              dot={{ r: 4 }}
                              activeDot={{ r: 6 }}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="anChartEmpty">
                        <div className="anChartEmptyIcon">📈</div>
                        <div className="anChartEmptyTitle">No conversion trend yet</div>
                        <div className="anChartEmptyText">
                          This chart will appear once branch-wise lead conversions are available.
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="anGrid anGridBottom">
                  <div className="anCard">
                    <div className="anCardHead">
                      <h3>Lead Source Conversion</h3>
                    </div>

                    <div className="anSourceList">
                      {sourceChartData.length > 0 ? (
                        sourceChartData.map((item, index) => (
                          <div className="anSourceRow" key={`${item?.source || "source"}-${index}`}>
                            <div className="anSourceTop">
                              <div className="anSourceName">{item?.source || "Unknown"}</div>
                              <div className="anSourceMeta">
                                <span>{item?.rate || 0}%</span>
                                <small>{item?.total || 0} leads</small>
                              </div>
                            </div>

                            <div className="anSourceBarTrack">
                              <div
                                className="anSourceBarFill"
                                style={{
                                  width: `${Math.min(Number(item?.rate || 0), 100)}%`,
                                  background: item.fill,
                                }}
                              />
                            </div>

                            <div className="anSourceBottom">
                              <span>Converted: {item?.converted || 0}</span>
                              <span>Revenue: {currencyFormatter.format(item?.revenue || 0)}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="anChartEmpty">
                          <div className="anChartEmptyIcon">🎯</div>
                          <div className="anChartEmptyTitle">No source conversion yet</div>
                          <div className="anChartEmptyText">
                            Add more leads and update their stages to see source performance.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="anCard">
                    <div className="anCardHead">
                      <h3>Avg Days per Stage</h3>
                    </div>

                    <div className="anChartWrap">
                      <ResponsiveContainer width="100%" height={280}>
                        <AreaChart data={analytics.avgDaysPerStage}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="stage" />
                          <YAxis />
                          <Tooltip />
                          <Area
                            type="monotone"
                            dataKey="days"
                            stroke="#10b981"
                            fill="#d1fae5"
                            strokeWidth={3}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                <div className="anCard">
                  <div className="anCardHead">
                    <h3>Top Sales Reps</h3>
                  </div>

                  <div className="anRepGrid">
                    {filteredTopReps.length > 0 ? (
                      filteredTopReps.map((rep, index) => (
                        <div className="anRepCard" key={`${rep?.name || "rep"}-${index}`}>
                          <div className="anRepTop">
                            <div className="anRepAvatar">
                              {String(rep?.name || "U").slice(0, 2).toUpperCase()}
                            </div>

                            <div>
                              <div className="anRepName">{rep?.name || "Unknown"}</div>
                              <div className="anRepSub">Sales Representative</div>
                            </div>
                          </div>

                          <div className="anRepStats">
                            <div>
                              <span>Leads</span>
                              <strong>{rep?.totalLeads || 0}</strong>
                            </div>
                            <div>
                              <span>Closed</span>
                              <strong>{rep?.closedDeals || 0}</strong>
                            </div>
                            <div>
                              <span>Revenue</span>
                              <strong>{currencyFormatter.format(rep?.revenue || 0)}</strong>
                            </div>
                            <div>
                              <span>Conv.</span>
                              <strong>{rep?.conversion || 0}%</strong>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="anEmpty">No rep performance data available</div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div className="anStatCard">
      <div className="anStatIcon">{icon}</div>
      <div>
        <div className="anStatLabel">{label}</div>
        <div className="anStatValue">{value}</div>
      </div>
    </div>
  );
}