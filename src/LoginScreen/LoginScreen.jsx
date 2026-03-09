import React, { useMemo, useState } from "react";
import "./LoginScreen.css";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/api";
import {
  Crown,
  Building2,
  UserRound,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const ROLES = [
  { key: "master_admin", title: "Master Admin", subtitle: "Full access", icon: Crown },
  { key: "branch_manager", title: "Branch Manager", subtitle: "Branch view", icon: Building2 },
  { key: "sales_rep", title: "Sales Rep", subtitle: "Own leads only", icon: UserRound },
  { key: "viewer", title: "Viewer", subtitle: "Read-only", icon: Eye },
];

export default function LoginScreen() {
  const navigate = useNavigate();

 const [activeRole, setActiveRole] = useState("master_admin");
const [email, setEmail] = useState("admin@nnc.in");
const [password, setPassword] = useState("password123");
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  const stats = useMemo(
    () => [
      { value: "1,022", label: "Total Leads" },
      { value: "₹6.88L", label: "Revenue" },
      { value: "3", label: "Branches" },
    ],
    []
  );

 const onSubmit = async (e) => {
  try {
    e.preventDefault();
    setErrorMessage("");
    setLoading(true);

    if (!email?.trim() || !password?.trim()) {
      setErrorMessage("Email and password are required");
      return;
    }

    const response = await loginAdmin({
      email: email.trim(),
      password: password.trim(),
      role: activeRole,
    });

    const result = response?.data;

    if (!result?.success) {
      throw new Error(result?.message || "Login failed");
    }

    const token = result?.data?.token;
    const user = result?.data?.user;

    if (!token || !user) {
      throw new Error("Invalid login response from server");
    }

    localStorage.setItem("nnc_auth", "true");
    localStorage.setItem("nnc_token", token);
    localStorage.setItem("nnc_role", user.role || "");
    localStorage.setItem("nnc_email", user.email || "");
    localStorage.setItem("nnc_user", JSON.stringify(user));

    navigate("/documents", { replace: true });
  } catch (err) {
    console.error("Login error:", err);
    setErrorMessage(
      err?.response?.data?.message || err?.message || "Login failed"
    );
  } finally {
    setLoading(false);
  }
};

  const nextSlide = () => {
    try {
      setSlide((s) => (s + 1) % 3);
    } catch (error) {
      console.error("nextSlide error:", error);
    }
  };

  const prevSlide = () => {
    try {
      setSlide((s) => (s - 1 + 3) % 3);
    } catch (error) {
      console.error("prevSlide error:", error);
    }
  };

  return (
    <div className="loginWrap">
      <div className="loginCard">
        <div className="loginGrid">
          <div className="leftPanel">
            <div className="leftBg" />
            <div className="leftGlow glow1" />
            <div className="leftGlow glow2" />

            <div className="leftInner">
              <div className="brandRow">
                <div className="brandIcon">NNC</div>
                <div className="brandText">
                  <div className="brandTitle">NNC CRM</div>
                  <div className="brandSub">Website Development Services</div>
                </div>
              </div>

              <div className="hero">
                <h1 className="heroTitle">
                  Your leads.
                  <br />
                  Your pipeline.
                  <br />
                  Your growth.
                </h1>

                <p className="heroDesc">
                  NNC&apos;s complete CRM for managing website development enquiries
                  across Bangalore, Mumbai &amp; Mysore from first contact to project delivery.
                </p>
              </div>

              <div className="statsRow">
                {stats.map((s) => (
                  <div key={s.label} className="statBox">
                    <div className="statValue">{s.value}</div>
                    <div className="statLabel">{s.label}</div>
                  </div>
                ))}
              </div>

              <div className="sliderRow">
                <button type="button" className="circleBtn" onClick={prevSlide}>
                  <ChevronLeft size={18} />
                </button>

                <div className="dots">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`dot ${slide === i ? "active" : ""}`} />
                  ))}
                </div>

                <button type="button" className="circleBtn" onClick={nextSlide}>
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>

          <div className="rightPanel">
            <div className="rightInner">
              <h2 className="rightTitle">Welcome back</h2>
              <p className="rightDesc">
                Sign in to your NNC CRM workspace. Select your access role below.
              </p>

              <div className="roleBlock">
                <div className="blockLabel">Select Your Role</div>

                <div className="roleGrid">
                  {ROLES.map((r) => (
                    <RoleCard
                      key={r.key}
                      role={r}
                      selected={activeRole === r.key}
                      onClick={() => setActiveRole(r.key)}
                    />
                  ))}
                </div>
              </div>

              <form className="formBlock" onSubmit={onSubmit}>
                <div className="field">
                  <label>Email Address</label>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="name@company.com"
                  />
                </div>

                <div className="field">
                  <label>Password</label>
                  <input
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="••••••••"
                  />
                </div>

                {errorMessage ? (
                  <div
                    style={{
                      color: "#dc2626",
                      fontSize: "13px",
                      fontWeight: 600,
                    }}
                  >
                    {errorMessage}
                  </div>
                ) : null}

                <button className="primaryBtn" type="submit" disabled={loading}>
                  {loading ? "Signing in..." : "Sign In to NNC CRM"}
                </button>
              </form>

              <div className="footerNote">
                Use your admin credentials to continue
                <div className="copy">
                  © 2026 NNC Website Services • All rights reserved
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({ role, selected, onClick }) {
  const Icon = role.icon;

  return (
    <button
      type="button"
      className={`roleCard ${selected ? "selected" : ""}`}
      onClick={onClick}
    >
      <div className={`roleIcon ${selected ? "selected" : ""}`}>
        <Icon size={18} />
      </div>

      <div className="roleText">
        <div className="roleTitle">{role.title}</div>
        <div className="roleSub">{role.subtitle}</div>
      </div>
    </button>
  );
}