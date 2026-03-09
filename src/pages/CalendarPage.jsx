import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar/Sidebar";
import LeadDrawer from "../Leads/LeadDrawer";
import "./CalendarPage.css";

const API_BASE = import.meta?.env?.VITE_API_BASE_URL || "http://localhost:5000";

const WEEK_DAYS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const monthName = (year, monthIndex) => {
  try {
    return new Date(year, monthIndex, 1).toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
  } catch {
    return "";
  }
};

const formatMoney = (n) => {
  try {
    return `₹${Number(n || 0).toLocaleString("en-IN")}`;
  } catch {
    return "₹0";
  }
};

const formatCardDate = (date) => {
  try {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return "";
  }
};

const getTagClass = (stage = "") => {
  try {
    const v = String(stage).toLowerCase();
    if (v.includes("closed")) return "done";
    if (v.includes("proposal")) return "task";
    if (v.includes("qualified")) return "follow";
    return "urgent";
  } catch {
    return "task";
  }
};

export default function CalendarPage() {
  const navigate = useNavigate();

  const today = new Date();
  const todayDate = today.getDate();
  const todayMonth = today.getMonth();
  const todayYear = today.getFullYear();

  const [currentYear, setCurrentYear] = useState(todayYear);
  const [currentMonth, setCurrentMonth] = useState(todayMonth);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [calendarData, setCalendarData] = useState({});
  const [upcoming, setUpcoming] = useState([]);
  const [overdue, setOverdue] = useState([]);
  const [searchText, setSearchText] = useState("");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedLeadId, setSelectedLeadId] = useState(null);

  const fetchCalendarData = async (year, monthIndex) => {
    try {
      setLoading(true);
      setErr("");

      const month = monthIndex + 1;
      const token = localStorage.getItem("nnc_token");

      const res = await fetch(
        `${API_BASE}/api/leads/calendar/month?year=${year}&month=${month}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        }
      );

      const json = await res.json();

      if (!res.ok || !json?.success) {
        throw new Error(json?.message || "Failed to fetch calendar data");
      }

      setCalendarData(json?.data?.calendar || {});
      setUpcoming(Array.isArray(json?.data?.upcoming) ? json.data.upcoming : []);
      setOverdue(Array.isArray(json?.data?.overdue) ? json.data.overdue : []);
    } catch (error) {
      console.error("fetchCalendarData error:", error);
      setErr(error.message || "Failed to fetch calendar data");
      setCalendarData({});
      setUpcoming([]);
      setOverdue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const openLeadDrawer = (leadId) => {
    try {
      if (!leadId) return;
      setSelectedLeadId(leadId);
      setDrawerOpen(true);
    } catch (error) {
      console.error("openLeadDrawer error:", error);
    }
  };

  const closeLeadDrawer = () => {
    try {
      setDrawerOpen(false);
      setSelectedLeadId(null);
    } catch (error) {
      console.error("closeLeadDrawer error:", error);
    }
  };

  const calendarGrid = useMemo(() => {
    try {
      const firstDay = new Date(currentYear, currentMonth, 1).getDay();
      const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();

      const cells = [];

      for (let i = 0; i < firstDay; i += 1) {
        cells.push({ type: "blank", key: `blank-${i}` });
      }

      for (let day = 1; day <= totalDays; day += 1) {
        cells.push({
          type: "day",
          key: `day-${day}`,
          day,
          info: calendarData?.[day] || null,
          isToday:
            day === todayDate &&
            currentMonth === todayMonth &&
            currentYear === todayYear,
        });
      }

      while (cells.length % 7 !== 0) {
        cells.push({ type: "blank", key: `tail-${cells.length}` });
      }

      return cells;
    } catch (error) {
      console.error("calendarGrid error:", error);
      return [];
    }
  }, [currentYear, currentMonth, calendarData, todayDate, todayMonth, todayYear]);

  const filteredUpcoming = useMemo(() => {
    try {
      if (!searchText.trim()) return upcoming;

      const q = searchText.trim().toLowerCase();
      return upcoming.filter((item) => {
        return (
          String(item?.name || "").toLowerCase().includes(q) ||
          String(item?.stage || "").toLowerCase().includes(q) ||
          String(item?.rep || "").toLowerCase().includes(q) ||
          String(item?.business || "").toLowerCase().includes(q)
        );
      });
    } catch (error) {
      console.error("filteredUpcoming error:", error);
      return upcoming;
    }
  }, [searchText, upcoming]);

  const filteredOverdue = useMemo(() => {
    try {
      if (!searchText.trim()) return overdue;

      const q = searchText.trim().toLowerCase();
      return overdue.filter((item) => {
        return (
          String(item?.name || "").toLowerCase().includes(q) ||
          String(item?.stage || "").toLowerCase().includes(q) ||
          String(item?.rep || "").toLowerCase().includes(q) ||
          String(item?.business || "").toLowerCase().includes(q)
        );
      });
    } catch (error) {
      console.error("filteredOverdue error:", error);
      return overdue;
    }
  }, [searchText, overdue]);

  const totalOverdue = filteredOverdue.length;

  const goPrevMonth = () => {
    try {
      if (currentMonth === 0) {
        setCurrentMonth(11);
        setCurrentYear((prev) => prev - 1);
      } else {
        setCurrentMonth((prev) => prev - 1);
      }
    } catch (error) {
      console.error("goPrevMonth error:", error);
    }
  };

  const goNextMonth = () => {
    try {
      if (currentMonth === 11) {
        setCurrentMonth(0);
        setCurrentYear((prev) => prev + 1);
      } else {
        setCurrentMonth((prev) => prev + 1);
      }
    } catch (error) {
      console.error("goNextMonth error:", error);
    }
  };

  const goToToday = () => {
    try {
      setCurrentYear(todayYear);
      setCurrentMonth(todayMonth);
    } catch (error) {
      console.error("goToToday error:", error);
    }
  };

  return (
    <>
      <div className="calLayout">
        <Sidebar />

        <div className="calMain">
          <div className="calTopBar">
            <div className="calTitleRow">
              <h1 className="calPageTitle">Calendar</h1>
              <span className="calAdminBadge">👑 Master Admin</span>
            </div>

            <div className="calTopActions">
              <div className="calSearchWrap">
                <span className="calSearchIcon">⌕</span>
                <input
                  placeholder="Search leads, stage, rep..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                />
              </div>

              <button
                className="calBtn ghost"
                type="button"
                onClick={() => {
                  try {
                    navigate("/documents");
                  } catch (error) {
                    console.error("Navigate documents error:", error);
                  }
                }}
              >
                📎 Upload
              </button>

              <button
                className="calBtn primary"
                type="button"
                onClick={() => {
                  try {
                    navigate("/leads");
                  } catch (error) {
                    console.error("Navigate leads error:", error);
                  }
                }}
              >
                + Add Lead
              </button>
            </div>
          </div>

          <div className="calContent">
            <div className="calBoard">
              <div className="calBoardTop">
                <div className="calMonthNav">
                  <button className="monthArrow" type="button" onClick={goPrevMonth}>
                    ‹
                  </button>
                  <h2>{monthName(currentYear, currentMonth)}</h2>
                  <button className="monthArrow" type="button" onClick={goNextMonth}>
                    ›
                  </button>
                  <button className="calBtn ghost small" type="button" onClick={goToToday}>
                    Today
                  </button>
                </div>

                <div className="calLegend">
                  <span className="legendItem urgent">● Urgent</span>
                  <span className="legendItem task">● Task</span>
                  <span className="legendItem done">● Done</span>
                  <span className="legendItem follow">● Follow-up</span>
                </div>
              </div>

              {loading ? <div className="calState">Loading calendar...</div> : null}
              {err ? <div className="calError">{err}</div> : null}

              <div className="calWeekHeader">
                {WEEK_DAYS.map((day) => (
                  <div key={day} className="calWeekCell">
                    {day}
                  </div>
                ))}
              </div>

              <div className="calGrid">
                {calendarGrid.map((cell) => {
                  if (cell.type === "blank") {
                    return <div key={cell.key} className="calCell blank" />;
                  }

                  const info = cell.info;
                  const leads = info?.leads || [];

                  return (
                    <div
                      key={cell.key}
                      className={`calCell ${cell.isToday ? "today" : ""}`}
                    >
                      <div className="calDate">{cell.day}</div>

                      {info ? (
                        <div className="calDayMeta">
                          <div className="calDayCount">
                            {info.count} lead{info.count > 1 ? "s" : ""}
                          </div>
                          <div className="calDayValue">
                            {formatMoney(info.totalValue)}
                          </div>
                        </div>
                      ) : null}

                      <div className="calMiniList">
                        {leads.slice(0, 3).map((lead) => (
                          <button
                            key={lead.id}
                            type="button"
                            className={`calMiniTag ${getTagClass(lead.stage)} clickable`}
                            title={`${lead.name} • ${lead.stage} • ${formatMoney(lead.value)}`}
                            onClick={() => openLeadDrawer(lead.id)}
                          >
                            {lead.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="calSidePanel">
              <div className="calSideHead">
                <h3>Upcoming</h3>
                <span className="overdueBadge">{totalOverdue} overdue</span>
              </div>

              <div className="sideCardsWrap">
                {filteredOverdue.slice(0, 3).map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className="sideInfoCard overdue clickableCard"
                    onClick={() => openLeadDrawer(item.id)}
                  >
                    <div className="sideInfoTop">Today — Overdue</div>
                    <div className="sideInfoTitle">{item.name}</div>
                    <div className="sideInfoMeta">
                      {item.stage} · {item.rep || "-"}
                    </div>
                  </button>
                ))}

                {filteredUpcoming.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`sideInfoCard ${getTagClass(item.stage)} clickableCard`}
                    onClick={() => openLeadDrawer(item.id)}
                  >
                    <div className="sideInfoDate">{formatCardDate(item.createdAt)}</div>
                    <div className="sideInfoTitle">{item.name}</div>
                    <div className="sideInfoMeta">
                      {item.stage} · {item.rep || "-"}
                    </div>
                  </button>
                ))}

                {!loading && filteredOverdue.length === 0 && filteredUpcoming.length === 0 ? (
                  <div className="sideEmpty">No calendar items found.</div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>

      <LeadDrawer
        open={drawerOpen}
        leadId={selectedLeadId}
        apiBase={API_BASE}
        onClose={closeLeadDrawer}
      />
    </>
  );
}