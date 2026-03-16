import React, { useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCircle2,
  CircleDollarSign,
  FileText,
  Target,
  TrendingUp,
  PhoneCall,
  AlertTriangle,
  Building2,
  RefreshCcw,
  Lightbulb,
  Briefcase,
  Users,
} from "lucide-react";
import Sidebar from "../components/Sidebar/Sidebar";
import Topbar from "../components/Topbar/Topbar";
import { getDashboardData } from "../services/dashboardService";
import "./Dashboard.css";

const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(Number(amount || 0));
  } catch (error) {
    console.error("formatCurrency error:", error);
    return `₹${Number(amount || 0).toLocaleString("en-IN")}`;
  }
};

const formatRelativeTime = (dateString) => {
  try {
    if (!dateString) return "Recently";

    const now = new Date();
    const date = new Date(dateString);
    const diff = Math.floor((now - date) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch (error) {
    console.error("formatRelativeTime error:", error);
    return "Recently";
  }
};

const getActivityDotClass = (type) => {
  switch (type) {
    case "deal_closed":
      return "activity-dot success";
    case "document":
      return "activity-dot primary";
    case "followup_overdue":
      return "activity-dot danger";
    default:
      return "activity-dot warning";
  }
};

const StatCard = ({ title, value, subtitle, icon, borderClass }) => {
  return (
    <div className={`crm-stat-card ${borderClass}`}>
      <div className="crm-stat-icon">{icon}</div>
      <div className="crm-stat-content">
        <p className="crm-stat-title">{title}</p>
        <h3 className="crm-stat-value">{value}</h3>
        <span className="crm-stat-subtitle">{subtitle}</span>
      </div>
    </div>
  );
};

const FunnelRow = ({ label, value, max, className }) => {
  const width = max > 0 ? `${(value / max) * 100}%` : "0%";

  return (
    <div className="funnel-row">
      <div className="funnel-label">{label}</div>
      <div className="funnel-bar-wrap">
        <div className="funnel-bar-bg">
          <div className={`funnel-bar-fill ${className}`} style={{ width }}>
            {value > 0 ? <span className="bar-inline-value">{value}</span> : null}
          </div>
        </div>
      </div>
      <div className="funnel-value">{value}</div>
    </div>
  );
};

export default function Dashboard() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDashboard = async (isRefresh = false) => {
    try {
      setError("");

      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const response = await getDashboardData();
      setDashboard(response?.data || null);
    } catch (err) {
      console.error("fetchDashboard error:", err);
      setError(err?.response?.data?.message || "Unable to load dashboard data.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    try {
      fetchDashboard();
    } catch (error) {
      console.error("Dashboard useEffect error:", error);
    }
  }, []);

  const summary = dashboard?.summary || {};
  const funnel = dashboard?.funnel || {};
  const branchPerformance = dashboard?.branchPerformance || [];
  const recentActivity = dashboard?.recentActivity || [];
  const todayFollowups = dashboard?.todayFollowups || [];
  const insight = dashboard?.insight || "";

  const maxFunnelValue = useMemo(() => {
    try {
      return Math.max(
        funnel.enquiries || 0,
        funnel.reachable || 0,
        funnel.qualified || 0,
        funnel.proposal || 0,
        funnel.closed || 0
      );
    } catch (error) {
      console.error("maxFunnelValue error:", error);
      return 0;
    }
  }, [funnel]);

  return (
    <div className="leadsLayout">
      <Sidebar active="Dashboard" />

      <div className="leadsMain">
        <Topbar title="Dashboard" roleLabel="Master Admin" />

        <div className="dashboardBody">
          {loading ? (
            <div className="crm-loading-card">
              <div className="crm-loader" />
              <p>Loading dashboard...</p>
            </div>
          ) : (
            <>
              <div className="dashboardHeaderRow">
                <div>
                  <h2 className="dashboardPageTitle">Dashboard Overview</h2>
                  <p className="dashboardPageSubtext">
                    Welcome back. Here’s your live CRM performance snapshot.
                  </p>
                </div>

                <button
                  className="crm-refresh-btn"
                  onClick={() => fetchDashboard(true)}
                  disabled={refreshing}
                  type="button"
                >
                  <RefreshCcw size={15} className={refreshing ? "spin" : ""} />
                  {refreshing ? "Refreshing..." : "Refresh"}
                </button>
              </div>

              {error ? (
                <div className="crm-error-box">
                  <AlertTriangle size={18} />
                  <span>{error}</span>
                </div>
              ) : null}

              <div className="crm-stats-grid">
                <StatCard
                  title="Total Enquiries"
                  value={(summary.totalEnquiries || 0).toLocaleString("en-IN")}
                  subtitle={`↑ ${summary.thisMonthEnquiries || 0} this month`}
                  icon={<Users size={20} />}
                  borderClass="blue-border"
                />
                <StatCard
                  title="Deals Closed"
                  value={summary.dealsClosed || 0}
                  subtitle={`↑ ${summary.thisMonthDealsClosed || 0} new this month`}
                  icon={<CheckCircle2 size={20} />}
                  borderClass="green-border"
                />
                <StatCard
                  title="Total Revenue"
                  value={formatCurrency(summary.revenue || 0)}
                  subtitle={`↑ ${formatCurrency(summary.thisMonthRevenue || 0)} this month`}
                  icon={<CircleDollarSign size={20} />}
                  borderClass="orange-border"
                />
                <StatCard
                  title="Conversion Rate"
                  value={`${summary.conversionRate || 0}%`}
                  subtitle="Target: 10%"
                  icon={<Target size={20} />}
                  borderClass="purple-border"
                />
              </div>

              <div className="crm-main-grid">
                <div className="crm-left-column">
                  <div className="crm-card">
                    <div className="crm-card-header">
                      <h3>Sales Funnel — All Branches</h3>
                      <span className="header-badge">
                        {(funnel.enquiries || 0).toLocaleString("en-IN")} leads
                      </span>
                    </div>

                    <div className="crm-funnel-list">
                      <FunnelRow
                        label="Enquiries"
                        value={funnel.enquiries || 0}
                        max={maxFunnelValue}
                        className="bar-blue"
                      />
                      <FunnelRow
                        label="Reachable"
                        value={funnel.reachable || 0}
                        max={maxFunnelValue}
                        className="bar-light-blue"
                      />
                      <FunnelRow
                        label="Qualified"
                        value={funnel.qualified || 0}
                        max={maxFunnelValue}
                        className="bar-orange"
                      />
                      <FunnelRow
                        label="Proposal"
                        value={funnel.proposal || 0}
                        max={maxFunnelValue}
                        className="bar-purple"
                      />
                      <FunnelRow
                        label="Closed"
                        value={funnel.closed || 0}
                        max={maxFunnelValue}
                        className="bar-green"
                      />
                    </div>
                  </div>

                  <div className="crm-card">
                    <div className="crm-card-header">
                      <h3>Recent Activity</h3>
                      <span className="header-link">Live updates</span>
                    </div>

                    <div className="activity-list">
                      {recentActivity.length > 0 ? (
                        recentActivity.map((item, index) => (
                          <div className="activity-item" key={`${item.title}-${index}`}>
                            <div className={getActivityDotClass(item.type)} />
                            <div className="activity-content">
                              <div className="activity-title-row">
                                <p className="activity-title">{item.title}</p>
                                {item.amount > 0 ? (
                                  <span className="activity-amount">
                                    {formatCurrency(item.amount)}
                                  </span>
                                ) : null}
                              </div>

                              <p className="activity-subtitle">{item.subtitle}</p>

                              <div className="activity-meta">
                                <span>{formatRelativeTime(item.time)}</span>
                                <span>•</span>
                                <span>{item.meta || "General"}</span>
                                <span>•</span>
                                <span>{item.by || "User"}</span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No recent activity found.</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="crm-right-column">
                  <div className="crm-card">
                    <div className="crm-card-header">
                      <h3>Branch Performance</h3>
                      <TrendingUp size={18} />
                    </div>

                    <div className="branch-list">
                      {branchPerformance.length > 0 ? (
                        branchPerformance.map((branch, index) => (
                          <div className="branch-item" key={`${branch.name}-${index}`}>
                            <div className="branch-top">
                              <div className="branch-name-wrap">
                                <div className="branch-icon">
                                  <Building2 size={14} />
                                </div>
                                <div>
                                  <h4>{branch.name}</h4>
                                  <p>
                                    Leads {branch.leads} &nbsp; Closed {branch.closed}
                                  </p>
                                </div>
                              </div>

                              <div className="branch-revenue">
                                {formatCurrency(branch.revenue)}
                              </div>
                            </div>

                            <div className="branch-bottom">
                              <div className="branch-rate-bar">
                                <div
                                  className="branch-rate-fill"
                                  style={{ width: `${branch.rate || 0}%` }}
                                />
                              </div>
                              <span>Rate {branch.rate || 0}%</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No branch data found.</div>
                      )}
                    </div>

                    <div className="insight-box">
                      <div className="insight-title">
                        <Lightbulb size={13} />
                        Insight
                      </div>
                      <p>
                        {insight ||
                          "Track which branch closes more leads and compare revenue against conversion rate for better planning."}
                      </p>
                    </div>
                  </div>

                  <div className="crm-card">
                    <div className="crm-card-header">
                      <h3>Today&apos;s Follow-ups</h3>
                      <span className="danger-text">
                        {dashboard?.overdueCount || 0} overdue
                      </span>
                    </div>

                    <div className="followup-list">
                      {todayFollowups.length > 0 ? (
                        todayFollowups.map((item, index) => (
                          <div className="followup-item" key={`${item.leadName}-${index}`}>
                            <div className="followup-main">
                              <div className="followup-title-row">
                                <h4>{item.leadName}</h4>
                                <span
                                  className={`priority-badge ${
                                    String(item.priority).toLowerCase() === "hot"
                                      ? "hot"
                                      : String(item.priority).toLowerCase() === "warm"
                                      ? "warm"
                                      : "cold"
                                  }`}
                                >
                                  {item.priority}
                                </span>
                              </div>
                              <p>{item.title}</p>
                            </div>

                            <div className="followup-meta">
                              <span>
                                <PhoneCall size={13} />
                                Day {item.dayIndex || 1}
                              </span>
                              <span>{item.branch || "General"}</span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="empty-state">No follow-ups due today.</div>
                      )}
                    </div>
                  </div>

                  <div className="crm-card quick-metrics">
                    <div className="quick-metric">
                      <div className="quick-icon blue">
                        <FileText size={18} />
                      </div>
                      <div>
                        <p>Documents</p>
                        <h4>{summary.totalDocuments || 0}</h4>
                      </div>
                    </div>

                    <div className="quick-metric">
                      <div className="quick-icon green">
                        <Briefcase size={18} />
                      </div>
                      <div>
                        <p>Active Reps</p>
                        <h4>{summary.totalReps || 0}</h4>
                      </div>
                    </div>

                    <div className="quick-metric">
                      <div className="quick-icon purple">
                        <Bell size={18} />
                      </div>
                      <div>
                        <p>Admins</p>
                        <h4>{summary.totalAdmins || 0}</h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}