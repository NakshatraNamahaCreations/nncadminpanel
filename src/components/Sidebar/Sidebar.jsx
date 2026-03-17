import React, { useMemo } from "react";
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
  LogOut,
  Sparkles,
  CreditCard,
} from "lucide-react";
import nncLogo from "../../assets/nnclogo.png"; // adjust path if needed
import "./Sidebar.css";

export default function Sidebar() {
  const nav = useNavigate();
  const location = useLocation();

  const storedUser = useMemo(() => {
    try {
      const user = localStorage.getItem("nnc_user");
      return user ? JSON.parse(user) : null;
    } catch (error) {
      console.error("Parse user error:", error);
      return null;
    }
  }, []);

  const userName = storedUser?.name || "Master Admin";
  const userRole = storedUser?.role || "master_admin";

  const initials = useMemo(() => {
    try {
      if (!userName) return "MA";
      const parts = userName.trim().split(" ").filter(Boolean);
      if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
      return `${parts[0]?.[0] || ""}${parts[1]?.[0] || ""}`.toUpperCase();
    } catch (error) {
      console.error("Initials error:", error);
      return "MA";
    }
  }, [userName]);

  const roleLabelMap = {
    master_admin: "Master Admin",
    branch_manager: "Branch Manager",
    sales_rep: "Sales Rep",
    viewer: "Viewer",
  };

  const userRoleLabel = roleLabelMap[userRole] || "Admin";

  const menuSections = [
    {
      title: "Overview",
      items: [
        {
          label: "Dashboard",
          path: "/dashboard",
          icon: <LayoutDashboard size={18} />,
        },
      ],
    },
    {
      title: "Sales",
      items: [
        {
          label: "Pipeline",
          path: "/pipeline",
          icon: <KanbanSquare size={18} />,
        },
        {
          label: "All Leads",
          path: "/leads",
          icon: <Users size={18} />,
        },
        {
          label: "Calendar",
          path: "/calendar",
          icon: <CalendarDays size={18} />,
        },
      ],
    },
    {
      title: "Documents",
      items: [
        {
          label: "Documents",
          path: "/documents",
          icon: <FileText size={18} />,
        },
      ],
    },
    {
      title: "Analytics",
      items: [
        {
          label: "Analytics",
          path: "/analytics",
          icon: <BarChart3 size={18} />,
        },
        {
          label: "Leaderboard",
          path: "/leaderboard",
          icon: <Trophy size={18} />,
        },
        {
          label: "Branch Reports",
          path: "/branch-reports",
          icon: <Building2 size={18} />,
        },
        {
          label: "Payment Tracker",
          path: "/payment-tracker",
          icon: <CreditCard size={18} />,
        },
         {
          label: "Setting",
          path: "/settings",
          icon: <CreditCard size={18} />,
        },
      ],
    },
  ];

  const isActive = (path) => {
    try {
      return location.pathname === path;
    } catch (error) {
      console.error("isActive error:", error);
      return false;
    }
  };

  const goTo = (path) => {
    try {
      nav(path);
    } catch (error) {
      console.error(`Navigation error for ${path}:`, error);
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
        onClick={() => goTo("/dashboard")}
        style={{ cursor: "pointer" }}
      >
        <div className="sbTopGlow" />
        <div className="sbTopGlow2" />

        <div className="sbBrandRow">
          <div className="sbLogoWrap">
            <img src={nncLogo} alt="NNC Logo" className="sbLogoImage" />
          </div>

          <div className="sbBrandText">
            <div className="sbTitle">NNC CRM</div>
            <div className="sbSub">Website Services Dashboard</div>
          </div>
        </div>

        <div className="sbMiniPill">
          <Sparkles size={11} />
          <span>Premium Panel</span>
        </div>
      </div>

      <div className="sbContent">
        {menuSections.map((section) => (
          <div className="sbGroup" key={section.title}>
            <div className="sbGroupTitle">{section.title}</div>

            <div className="sbGroupItems">
              {section.items.map((item) => (
                <Item
                  key={item.path}
                  icon={item.icon}
                  label={item.label}
                  active={isActive(item.path)}
                  onClick={() => goTo(item.path)}
                />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="sbBottomWrap">
        <div className="sbProfileCard">
          <div className="sbBottom">
            <div className="sbAvatar">{initials}</div>

            <div className="sbUser">
              <div className="sbUserName">{userName}</div>
              <div className="sbUserSub">{userRoleLabel}</div>
            </div>

            <div className="sbTag">LIVE</div>
          </div>
        </div>

        <button type="button" className="sbLogoutBtn" onClick={handleLogout}>
          <span className="sbLogoutIcon">
            <LogOut size={15} />
          </span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}

function Item({ label, badge, active, onClick, icon }) {
  try {
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
  } catch (error) {
    console.error("Sidebar item render error:", error);
    return null;
  }
}