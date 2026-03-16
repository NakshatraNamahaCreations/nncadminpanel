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

const PIE_COLORS = ["#3b82f6", "#f59e0b", "#10b981", "#8b5cf6", "#ef4444"];

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
          totalLeads: Number(payload?.totals || payload?.totals?.totalLeads || 0),
          totalClosed: Number(payload?.totalClosed || payload?.totals?.totalClosed || 0),
          totalRevenue: Number(payload?.totalRevenue || payload?.totals?.totalRevenue || 0),
          avgConversion: Number(payload?.avgConversion || payload?.totals?.avgConversion || 0),
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
    fetchAnalytics();
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
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            data={analytics.revenueByBranch}
                            dataKey="value"
                            nameKey="name"
                            innerRadius={58}
                            outerRadius={95}
                            paddingAngle={3}
                          >
                            {analytics.revenueByBranch.map((entry, index) => (
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
                        {analytics.revenueByBranch.map((item, index) => (
                          <div key={`${item?.name || "branch"}-${index}`} className="anLegendItem">
                            <span
                              className="anLegendDot"
                              style={{ background: PIE_COLORS[index % PIE_COLORS.length] }}
                            />
                            <span>{item?.name || "Unknown"}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="anCard">
                  <div className="anCardHead">
                    <h3>Conversion Rate Trend</h3>
                    <div className="anLegendRight">
                      <span className="anMiniBadge blue">Bangalore</span>
                      <span className="anMiniBadge orange">Mumbai</span>
                      <span className="anMiniBadge green">Mysore</span>
                    </div>
                  </div>

                  <div className="anChartWrap">
                    <ResponsiveContainer width="100%" height={270}>
                      <LineChart data={analytics.conversionRateTrend}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="Bangalore" stroke="#3b82f6" strokeWidth={3} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Mumbai" stroke="#f59e0b" strokeWidth={3} dot={{ r: 3 }} />
                        <Line type="monotone" dataKey="Mysore" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="anGrid anGridBottom">
                  <div className="anCard">
                    <div className="anCardHead">
                      <h3>Lead Source Conversion</h3>
                    </div>

                    <div className="anChartWrap">
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart
                          data={analytics.leadSourceConversion}
                          layout="vertical"
                          margin={{ left: 20, right: 20 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                          <XAxis type="number" />
                          <YAxis type="category" dataKey="source" width={90} />
                          <Tooltip />
                          <Bar dataKey="rate" fill="#2563eb" radius={[0, 8, 8, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
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