import React, { useState } from "react";
import Sidebar from "../../components/Sidebar/Sidebar";
import Topbar from "../../components/Topbar/Topbar";
import { changePassword } from "../../services/settingsService";
import "./Settings.css";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export default function Settings() {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({
    type: "",
    text: "",
  });

  const handleChange = (e) => {
    try {
      const { name, value } = e.target;
      setForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    } catch (error) {
      console.error("handleChange error:", error);
    }
  };

  const validateForm = () => {
    try {
      if (!form.currentPassword.trim()) {
        return "Current password is required";
      }

      if (!form.newPassword.trim()) {
        return "New password is required";
      }

      if (form.newPassword.trim().length < 6) {
        return "New password must be at least 6 characters";
      }

      if (!form.confirmPassword.trim()) {
        return "Confirm password is required";
      }

      if (form.newPassword !== form.confirmPassword) {
        return "New password and confirm password do not match";
      }

      if (form.currentPassword === form.newPassword) {
        return "New password must be different from current password";
      }

      return "";
    } catch (error) {
      console.error("validateForm error:", error);
      return "Validation failed";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setMessage({ type: "", text: "" });

      const validationError = validateForm();

      if (validationError) {
        setMessage({
          type: "error",
          text: validationError,
        });
        return;
      }

      setLoading(true);

      const response = await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });

      setMessage({
        type: "success",
        text: response?.message || "Password changed successfully",
      });

      setForm(initialForm);
    } catch (error) {
      console.error("handleSubmit error:", error);

      setMessage({
        type: "error",
        text:
          error?.response?.data?.message ||
          error?.message ||
          "Failed to change password",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="settings-layout">
      <Sidebar />

      <div className="settings-main">
        <Topbar />

        <div className="settings-content">
          <div className="settings-card">
            <div className="settings-card-header">
              <h2>Settings</h2>
              <p>Update your account password securely.</p>
            </div>

            <div className="settings-section">
              <h3>Change Password</h3>

              {message.text ? (
                <div
                  className={`settings-alert ${
                    message.type === "success" ? "success" : "error"
                  }`}
                >
                  {message.text}
                </div>
              ) : null}

              <form className="settings-form" onSubmit={handleSubmit}>
                <div className="settings-form-group">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    name="currentPassword"
                    type="password"
                    placeholder="Enter current password"
                    value={form.currentPassword}
                    onChange={handleChange}
                    autoComplete="current-password"
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    name="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={form.newPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>

                <div className="settings-form-group">
                  <label htmlFor="confirmPassword">Confirm New Password</label>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>

                <button
                  type="submit"
                  className="settings-submit-btn"
                  disabled={loading}
                >
                  {loading ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}