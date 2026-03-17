import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { resetPassword } from "../services/api";
import "./LoginScreen.css";

export default function ResetPassword() {
  const navigate = useNavigate();
  const { token } = useParams();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setErrorMessage("");
      setSuccessMessage("");

      if (!password.trim() || !confirmPassword.trim()) {
        setErrorMessage("Both password fields are required");
        return;
      }

      if (password !== confirmPassword) {
        setErrorMessage("Passwords do not match");
        return;
      }

      if (password.length < 6) {
        setErrorMessage("Password must be at least 6 characters");
        return;
      }

      setLoading(true);

      const response = await resetPassword(token, {
        password: password.trim(),
        confirmPassword: confirmPassword.trim(),
      });

      const result = response?.data;

      if (!result?.success) {
        throw new Error(result?.message || "Password reset failed");
      }

      setSuccessMessage(result?.message || "Password reset successful");

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1500);
    } catch (err) {
      console.error("Reset password error:", err);
      setErrorMessage(
        err?.response?.data?.message ||
          err?.message ||
          "Password reset failed"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loginWrap">
      <div className="loginCard" style={{ maxWidth: "560px" }}>
        <div className="rightPanel" style={{ minHeight: "auto" }}>
          <div className="rightInner">
            <h2 className="rightTitle">Reset Password</h2>
            <p className="rightDesc">
              Enter your new password for the master admin account.
            </p>

            <form className="formBlock" onSubmit={handleSubmit}>
              <div className="field">
                <label>New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="field">
                <label>Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              {errorMessage ? <div className="errorText">{errorMessage}</div> : null}
              {successMessage ? <div className="successText">{successMessage}</div> : null}

              <button className="primaryBtn" type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}