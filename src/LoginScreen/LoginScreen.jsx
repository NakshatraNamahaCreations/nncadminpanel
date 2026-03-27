import { useMemo, useState } from "react";
import "./LoginScreen.css";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../services/api";
import {
  Crown,
  Building2,
  UserRound,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Mail,
  ShieldCheck,
  KeyRound,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

const API = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

const ROLES = [
  { key: "master_admin", title: "Master Admin", subtitle: "Full access", icon: Crown },
  { key: "branch_manager", title: "Branch Manager", subtitle: "Branch view", icon: Building2 },
  { key: "sales_rep", title: "Sales Rep", subtitle: "Own leads only", icon: UserRound },
  { key: "viewer", title: "Viewer", subtitle: "Read-only", icon: Eye },
];

export default function LoginScreen() {
  const navigate = useNavigate();

 const [activeRole, setActiveRole] = useState("master_admin");
const [email, setEmail] = useState("");
const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [slide, setSlide] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // ── Forgot password flow ──────────────────────────────────────────────
  const [fpOpen,    setFpOpen]    = useState(false);   // modal open
  const [fpStep,    setFpStep]    = useState(1);        // 1=email 2=otp 3=new-pass 4=done
  const [fpEmail,   setFpEmail]   = useState("");
  const [fpOtp,     setFpOtp]     = useState("");
  const [fpPass,    setFpPass]    = useState("");
  const [fpPass2,   setFpPass2]   = useState("");
  const [fpLoading, setFpLoading] = useState(false);
  const [fpMsg,     setFpMsg]     = useState("");
  const [fpErr,     setFpErr]     = useState("");

  const openFp = () => { setFpOpen(true); setFpStep(1); setFpEmail(""); setFpOtp(""); setFpPass(""); setFpPass2(""); setFpMsg(""); setFpErr(""); };
  const closeFp = () => setFpOpen(false);

  const fpSendOtp = async () => {
    if (!fpEmail.trim()) return setFpErr("Enter your email address");
    setFpLoading(true); setFpErr("");
    try {
      const r = await fetch(`${API}/api/auth/forgot-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: fpEmail.trim() }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      setFpMsg(j.message);
      setFpStep(2);
    } catch(e) { setFpErr(e.message || "Failed to send OTP"); }
    finally { setFpLoading(false); }
  };

  const fpVerifyOtp = async () => {
    if (fpOtp.trim().length !== 6) return setFpErr("Enter the 6-digit OTP");
    setFpLoading(true); setFpErr("");
    try {
      const r = await fetch(`${API}/api/auth/verify-otp`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: fpEmail.trim(), otp: fpOtp.trim() }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      setFpStep(3);
    } catch(e) { setFpErr(e.message || "Invalid OTP"); }
    finally { setFpLoading(false); }
  };

  const fpResetPass = async () => {
    if (fpPass.trim().length < 6) return setFpErr("Password must be at least 6 characters");
    if (fpPass !== fpPass2) return setFpErr("Passwords do not match");
    setFpLoading(true); setFpErr("");
    try {
      const r = await fetch(`${API}/api/auth/reset-password`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ email: fpEmail.trim(), otp: fpOtp.trim(), newPassword: fpPass.trim() }) });
      const j = await r.json();
      if (!j.success) throw new Error(j.message);
      setFpStep(4);
    } catch(e) { setFpErr(e.message || "Failed to reset password"); }
    finally { setFpLoading(false); }
  };

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
    if (user.modules != null) {
      localStorage.setItem("nnc_modules", JSON.stringify(user.modules));
    } else {
      localStorage.removeItem("nnc_modules");
    }

    navigate("/todays-plan", { replace: true });
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
                  <ChevronLeft size={13} />
                </button>

                <div className="dots">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className={`dot ${slide === i ? "active" : ""}`} />
                  ))}
                </div>

                <button type="button" className="circleBtn" onClick={nextSlide}>
                  <ChevronRight size={13} />
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
                  <div className="fieldLabelRow">
                    <label>Password</label>
                    <button type="button" className="forgotLink" onClick={openFp}>Forgot password?</button>
                  </div>
                  <div className="passwordWrap">
                    <input
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="eyeBtn"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
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

      {/* ── Forgot Password Modal ── */}
      {fpOpen && (
        <div className="fpOverlay" onClick={closeFp}>
          <div className="fpModal" onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div className="fpHeader">
              {fpStep < 4 && fpStep > 1 && (
                <button className="fpBack" onClick={() => { setFpStep(s => s-1); setFpErr(""); }}>
                  <ArrowLeft size={16}/>
                </button>
              )}
              <div className="fpHeaderText">
                <div className="fpTitle">
                  {fpStep === 1 && "Forgot Password"}
                  {fpStep === 2 && "Enter OTP"}
                  {fpStep === 3 && "New Password"}
                  {fpStep === 4 && "Password Reset!"}
                </div>
                <div className="fpSub">
                  {fpStep === 1 && "We'll send a 6-digit OTP to nn.creations7@gmail.com"}
                  {fpStep === 2 && `OTP sent to nn.creations7@gmail.com`}
                  {fpStep === 3 && "Choose a strong new password"}
                  {fpStep === 4 && "You can now log in with your new password"}
                </div>
              </div>
              <button className="fpClose" onClick={closeFp}>✕</button>
            </div>

            {/* Steps */}
            <div className="fpBody">

              {fpStep === 1 && (
                <>
                  <div className="fpIconWrap"><Mail size={28} color="#2563eb"/></div>
                  <div className="fpField">
                    <label>Your Email Address</label>
                    <input type="email" placeholder="admin@nnc.in" value={fpEmail} onChange={e => { setFpEmail(e.target.value); setFpErr(""); }}/>
                  </div>
                  {fpErr && <div className="fpErr">{fpErr}</div>}
                  <button className="fpBtn" onClick={fpSendOtp} disabled={fpLoading}>
                    {fpLoading ? "Sending…" : "Send OTP"}
                  </button>
                </>
              )}

              {fpStep === 2 && (
                <>
                  <div className="fpIconWrap"><ShieldCheck size={28} color="#2563eb"/></div>
                  {fpMsg && <div className="fpSuccess">{fpMsg}</div>}
                  <div className="fpField">
                    <label>6-Digit OTP</label>
                    <input
                      type="text" maxLength={6} placeholder="● ● ● ● ● ●"
                      value={fpOtp} onChange={e => { setFpOtp(e.target.value.replace(/\D/g,"")); setFpErr(""); }}
                      className="fpOtpInput"
                    />
                  </div>
                  {fpErr && <div className="fpErr">{fpErr}</div>}
                  <button className="fpBtn" onClick={fpVerifyOtp} disabled={fpLoading}>
                    {fpLoading ? "Verifying…" : "Verify OTP"}
                  </button>
                  <button className="fpResend" onClick={() => { setFpStep(1); setFpOtp(""); setFpErr(""); }}>Resend OTP</button>
                </>
              )}

              {fpStep === 3 && (
                <>
                  <div className="fpIconWrap"><KeyRound size={28} color="#2563eb"/></div>
                  <div className="fpField">
                    <label>New Password</label>
                    <input type="password" placeholder="Min. 6 characters" value={fpPass} onChange={e => { setFpPass(e.target.value); setFpErr(""); }}/>
                  </div>
                  <div className="fpField">
                    <label>Confirm New Password</label>
                    <input type="password" placeholder="Repeat password" value={fpPass2} onChange={e => { setFpPass2(e.target.value); setFpErr(""); }}/>
                  </div>
                  {fpErr && <div className="fpErr">{fpErr}</div>}
                  <button className="fpBtn" onClick={fpResetPass} disabled={fpLoading}>
                    {fpLoading ? "Resetting…" : "Reset Password"}
                  </button>
                </>
              )}

              {fpStep === 4 && (
                <div className="fpDone">
                  <CheckCircle2 size={52} color="#16a34a"/>
                  <div className="fpDoneTitle">Password Updated!</div>
                  <div className="fpDoneSub">Your password has been reset. Use your new password to sign in.</div>
                  <button className="fpBtn" onClick={closeFp}>Back to Login</button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
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