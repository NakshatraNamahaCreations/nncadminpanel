import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  KanbanSquare,
  Users,
  CalendarDays,
  FileText,
  BarChart3,
  Trophy,
  Building2,
  ShieldCheck,
  LogOut,
  Sparkles,
} from "lucide-react";
import "./Sidebar.css";

export default function Sidebar() {
  const nav = useNavigate();
  const location = useLocation();

  const storedUser = (() => {
    try {
      const user = localStorage.getItem("nnc_user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Parse user error:", error);
      return null;
    }
  })();

  const userName = storedUser?.name || "Master Admin";
  const userRole = storedUser?.role || "master_admin";

  const initials = (() => {
    try {
      if (!userName) return "MA";
      const parts = userName.trim().split(" ").filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
    } catch (error) {
      console.error("Initials error:", error);
      return "MA";
    }
  })();

  const roleLabelMap = {
    master_admin: "Master Admin",
    branch_manager: "Branch Manager",
    sales_rep: "Sales Rep",
    viewer: "Viewer",
  };

  const userRoleLabel = roleLabelMap[userRole] || "Admin";

  const isActive = (paths) => {
    try {
      return paths.includes(location.pathname);
    } catch (error) {
      console.error("isActive error:", error);
      return false;
    }
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("nnc_auth");
      localStorage.removeItem("nnc_token");
      localStorage.removeItem("nnc_role");
      localStorage.removeItem("nnc_email");
      localStorage.removeItem("nnc_user");
      nav("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <aside className="sb">
      <div
        className="sbTop"
        onClick={() => {
          try {
            nav("/pipeline");
          } catch (error) {
            console.error("Navigate to pipeline error:", error);
          }
        }}
        style={{ cursor: "pointer" }}
      >
        <div className="sbTopGlow" />
        <div className="sbBrandRow">
          <div className="sbLogoWrap">
            <div className="sbLogo">NNC</div>
          </div>

          <div className="sbBrandText">
            <div className="sbTitle">NNC CRM</div>
            <div className="sbSub">Website Services Dashboard</div>
          </div>
        </div>

        <div className="sbMiniPill">
          <Sparkles size={12} />
          <span>Premium</span>
        </div>
      </div>

      <div className="sbScroll">
        <div className="sbGroup">
          <div className="sbGroupTitle">OVERVIEW</div>
          <Item
            icon={<LayoutDashboard size={17} />}
            label="Dashboard"
            active={isActive(["/dashboard"])}
            onClick={() => {
              try {
                nav("/dashboard");
              } catch (error) {
                console.error("Navigate to dashboard error:", error);
              }
            }}
          />
        </div>

        <div className="sbGroup">
          <div className="sbGroupTitle">SALES</div>
          <Item
            icon={<KanbanSquare size={17} />}
            label="Pipeline"
            active={isActive(["/pipeline"])}
            onClick={() => {
              try {
                nav("/pipeline");
              } catch (error) {
                console.error("Navigate to pipeline error:", error);
              }
            }}
          />
          <Item
            icon={<Users size={17} />}
            label="All Leads"
            active={isActive(["/leads"])}
            onClick={() => {
              try {
                nav("/leads");
              } catch (error) {
                console.error("Navigate to leads error:", error);
              }
            }}
          />
          <Item
            icon={<CalendarDays size={17} />}
            label="Calendar"
            active={isActive(["/calendar"])}
            onClick={() => {
              try {
                nav("/calendar");
              } catch (error) {
                console.error("Navigate to calendar error:", error);
              }
            }}
          />
        </div>

        <div className="sbGroup">
          <div className="sbGroupTitle">DOCUMENTS</div>
          <Item
            icon={<FileText size={17} />}
            label="Documents"
            active={isActive(["/documents"])}
            onClick={() => {
              try {
                nav("/documents");
              } catch (error) {
                console.error("Navigate to documents error:", error);
              }
            }}
          />
        </div>

        <div className="sbGroup">
          <div className="sbGroupTitle">ANALYTICS</div>
          <Item
            icon={<BarChart3 size={17} />}
            label="Analytics"
            active={isActive(["/analytics"])}
            onClick={() => {
              try {
                nav("/analytics");
              } catch (error) {
                console.error("Navigate to analytics error:", error);
              }
            }}
          />
          <Item
            icon={<Trophy size={17} />}
            label="Leaderboard"
            active={isActive(["/leaderboard"])}
            onClick={() => {
              try {
                nav("/leaderboard");
              } catch (error) {
                console.error("Navigate to leaderboard error:", error);
              }
            }}
          />
          <Item
            icon={<Building2 size={17} />}
            label="Branch Reports"
            active={isActive(["/branch-reports"])}
            onClick={() => {
              try {
                nav("/branch-reports");
              } catch (error) {
                console.error("Navigate to branch reports error:", error);
              }
            }}
          />
        </div>

        <div className="sbGroup">
          <div className="sbGroupTitle">ADMIN</div>
          <Item
            icon={<ShieldCheck size={17} />}
            label="Master Admin"
            active={isActive(["/admin", "/master-admin"])}
            onClick={() => {
              try {
                nav("/master-admin");
              } catch (error) {
                console.error("Navigate to master admin error:", error);
              }
            }}
          />
        </div>
      </div>

      <div className="sbBottomWrap">
        <div className="sbProfileCard">
          <div className="sbBottom">
            <div className="sbAvatar">{initials}</div>

            <div className="sbUser">
              <div className="sbUserName">{userName}</div>
              <div className="sbUserSub">{userRoleLabel}</div>
            </div>

            <span className="sbTag">
              {userRole === "master_admin" ? "MASTER" : "USER"}
            </span>
          </div>
        </div>

        <button type="button" className="sbLogoutBtn" onClick={handleLogout}>
          <span className="sbLogoutIcon">
            <LogOut size={16} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function Item({ label, badge, active, onClick, icon }) {
  return (
    <button
      type="button"
      className={`sbItem ${active ? "active" : ""}`}
      onClick={onClick}
    >
      <span className="sbIconWrap">
        <span className="sbIcon">{icon}</span>
      </span>

      <span className="sbLabel">{label}</span>

      {badge ? <span className="sbBadge">{badge}</span> : null}

      {active ? <span className="sbActiveDot" /> : null}
    </button>
  );
}