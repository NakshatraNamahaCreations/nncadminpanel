import React, { useEffect, useMemo, useState } from "react";
import {
  Shield,
  Users,
  Building2,
  IndianRupee,
  Activity,
  Plus,
  Pencil,
  Trash2,
  X,
  UserCog,
  TrendingUp,
  Sparkles,
} from "lucide-react";
import Sidebar from "../../components/Sidebar/Sidebar";
import {
  getMasterAdminDashboard,
  createMasterAdminUser,
  updateMasterAdminUser,
  deleteMasterAdminUser,
} from "../../services/masterAdminService";
import "./MasterAdmin.css";

const initialForm = {
  name: "",
  email: "",
  password: "",
  role: "sales_rep",
  branch: "Bangalore",
  isActive: true,
};

export default function MasterAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [error, setError] = useState("");
  const [dashboard, setDashboard] = useState({
    stats: {
      totalUsers: 0,
      activeBranches: 0,
      monthlyTarget: 0,
      systemHealth: 98,
    },
    users: [],
    branchTargets: [],
    branches: [],
  });

  const [form, setForm] = useState(initialForm);

  const roleBadgeClass = useMemo(() => {
    return {
      master_admin: "maRole master",
      branch_manager: "maRole manager",
      sales_rep: "maRole rep",
      viewer: "maRole viewer",
    };
  }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await getMasterAdminDashboard();
      const data = response?.data || {};

      setDashboard({
        stats: data?.stats || {
          totalUsers: 0,
          activeBranches: 0,
          monthlyTarget: 0,
          systemHealth: 98,
        },
        users: Array.isArray(data?.users) ? data.users : [],
        branchTargets: Array.isArray(data?.branchTargets) ? data.branchTargets : [],
        branches: Array.isArray(data?.branches) ? data.branches : [],
      });
    } catch (err) {
      console.error("fetchDashboard error:", err);
      setError(err?.response?.data?.message || "Failed to load master admin data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      fetchDashboard();
    } catch (err) {
      console.error("Initial master admin load error:", err);
    }
  }, []);

  const formatCurrency = (value) => {
    try {
      return `₹${Number(value || 0).toLocaleString("en-IN")}`;
    } catch (error) {
      console.error("formatCurrency error:", error);
      return "₹0";
    }
  };

  const openAddModal = () => {
    try {
      const firstBranch = dashboard?.branches?.[0] || "Bangalore";

      setEditingUser(null);
      setForm({
        ...initialForm,
        branch: firstBranch,
      });
      setModalOpen(true);
      setError("");
    } catch (error) {
      console.error("openAddModal error:", error);
    }
  };

  const openEditModal = (user) => {
    try {
      setEditingUser(user);
      setForm({
        name: user?.name || "",
        email: user?.email || "",
        password: "",
        role: user?.role || "sales_rep",
        branch: user?.branch || dashboard?.branches?.[0] || "Bangalore",
        isActive: user?.isActive ?? true,
      });
      setModalOpen(true);
      setError("");
    } catch (error) {
      console.error("openEditModal error:", error);
    }
  };

  const closeModal = () => {
    try {
      setModalOpen(false);
      setEditingUser(null);
      setForm(initialForm);
      setError("");
    } catch (error) {
      console.error("closeModal error:", error);
    }
  };

  const handleChange = (e) => {
    try {
      const { name, value, type, checked } = e.target;

      setForm((prev) => ({
        ...prev,
        [name]: type === "checkbox" ? checked : value,
      }));
    } catch (error) {
      console.error("handleChange error:", error);
    }
  };

  const handleSubmit = async (e) => {
    try {
      e.preventDefault();
      setSaving(true);
      setError("");

      if (!form.name.trim()) {
        setError("Name is required");
        setSaving(false);
        return;
      }

      if (!form.email.trim()) {
        setError("Email is required");
        setSaving(false);
        return;
      }

      if (!editingUser && !form.password.trim()) {
        setError("Password is required");
        setSaving(false);
        return;
      }

      if (editingUser?._id) {
        await updateMasterAdminUser(editingUser._id, form);
      } else {
        await createMasterAdminUser(form);
      }

      closeModal();
      fetchDashboard();
    } catch (error) {
      console.error("handleSubmit error:", error);
      setError(error?.response?.data?.message || "Failed to save user");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user) => {
    try {
      if (!user?._id) return;

      const confirmDelete = window.confirm(
        `Are you sure you want to delete ${user?.name || "this user"}?`
      );

      if (!confirmDelete) return;

      await deleteMasterAdminUser(user._id);
      fetchDashboard();
    } catch (error) {
      console.error("handleDelete error:", error);
      setError(error?.response?.data?.message || "Failed to delete user");
    }
  };

  const getRoleLabel = (role) => {
    try {
      if (role === "master_admin") return "master";
      if (role === "branch_manager") return "manager";
      if (role === "sales_rep") return "rep";
      if (role === "viewer") return "viewer";
      return "user";
    } catch (error) {
      console.error("getRoleLabel error:", error);
      return "user";
    }
  };

  return (
    <div className="maLayout">
      <Sidebar />

      <div className="maMain">
        <div className="maTopbar">
          <div className="maTopbarLeft">
            <div className="maTopbarTitle">Master Admin</div>
            <div className="maTopbarChip">
              <Sparkles size={12} />
              Master Admin
            </div>
          </div>

          <button type="button" className="maPrimaryBtn" onClick={openAddModal}>
            <Plus size={16} />
            Add User
          </button>
        </div>

        <div className="maPage">
          <div className="maHero">
            <div className="maHeroTitleWrap">
              <div className="maHeroIcon">
                <Shield size={24} />
              </div>
              <div>
                <h1>Master Admin Panel</h1>
                <p>User management, branch targets, system settings</p>
              </div>
            </div>
          </div>

          {error ? <div className="maAlert">{error}</div> : null}

          <div className="maStatsGrid">
            <div className="maStatCard blue">
              <div className="maStatHead">
                <div className="maStatIcon"><Users size={18} /></div>
              </div>
              <div className="maStatLabel">Total Users</div>
              <div className="maStatValue">{dashboard?.stats?.totalUsers || 0}</div>
            </div>

            <div className="maStatCard green">
              <div className="maStatHead">
                <div className="maStatIcon"><Building2 size={18} /></div>
              </div>
              <div className="maStatLabel">Active Branches</div>
              <div className="maStatValue">{dashboard?.stats?.activeBranches || 0}</div>
            </div>

            <div className="maStatCard orange">
              <div className="maStatHead">
                <div className="maStatIcon"><IndianRupee size={18} /></div>
              </div>
              <div className="maStatLabel">Monthly Target</div>
              <div className="maStatValue">{formatCurrency(dashboard?.stats?.monthlyTarget || 0)}</div>
            </div>

            <div className="maStatCard purple">
              <div className="maStatHead">
                <div className="maStatIcon"><Activity size={18} /></div>
              </div>
              <div className="maStatLabel">System Health</div>
              <div className="maStatValue">{dashboard?.stats?.systemHealth || 98}%</div>
            </div>
          </div>

          <div className="maContentGrid">
            <div className="maCard">
              <div className="maCardHeader">
                <div className="maCardTitle">
                  <UserCog size={16} />
                  <span>User Management</span>
                </div>

                <button type="button" className="maSmallBtn" onClick={openAddModal}>
                  <Plus size={14} />
                  Add User
                </button>
              </div>

              <div className="maTableWrap">
                <table className="maTable">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan="6" className="maEmptyCell">Loading users...</td>
                      </tr>
                    ) : dashboard?.users?.length ? (
                      dashboard.users.map((user, index) => (
                        <tr key={user?._id || index}>
                          <td>
                            <div className="maUserInfo">
                              <div className={`maAvatar avatar${(index % 5) + 1}`}>
                                {(user?.name || "U").slice(0, 2).toUpperCase()}
                              </div>
                              <div className="maUserName">{user?.name || "-"}</div>
                            </div>
                          </td>

                          <td>{user?.email || "-"}</td>

                          <td>
                            <span className={roleBadgeClass[user?.role] || "maRole viewer"}>
                              {getRoleLabel(user?.role)}
                            </span>
                          </td>

                          <td>{user?.branch || "All"}</td>

                          <td>
                            <span className={`maStatus ${user?.isActive ? "active" : "inactive"}`}>
                              {user?.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>

                          <td>
                            <div className="maActionRow">
                              <button
                                type="button"
                                className="maActionBtn edit"
                                onClick={() => openEditModal(user)}
                              >
                                <Pencil size={13} />
                                Edit
                              </button>

                              {user?.role !== "master_admin" && (
                                <button
                                  type="button"
                                  className="maActionBtn delete"
                                  onClick={() => handleDelete(user)}
                                >
                                  <Trash2 size={13} />
                                  Delete
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="maEmptyCell">No users found</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="maCard">
              <div className="maCardHeader">
                <div className="maCardTitle">
                  <TrendingUp size={16} />
                  <span>Branch Revenue Targets</span>
                </div>
              </div>

              <div className="maTargetWrap">
                {dashboard?.branchTargets?.length ? (
                  dashboard.branchTargets.map((item, index) => {
                    const target = Number(item?.target || 0);
                    const achieved = Number(item?.achieved || 0);
                    const percent = target > 0 ? Math.min((achieved / target) * 100, 100) : 0;

                    return (
                      <div className="maTargetItem" key={item?._id || `${item?.branch}-${index}`}>
                        <div className="maTargetTop">
                          <div>
                            <div className="maBranchName">{item?.branch || "-"}</div>
                            <div className="maBranchSub">
                              {Math.round(percent)}% of target achieved
                            </div>
                          </div>

                          <div className="maBranchAmount">
                            {formatCurrency(achieved)} / {formatCurrency(target)} target
                          </div>
                        </div>

                        <div className="maProgressBar">
                          <div
                            className="maProgressFill"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="maEmptyTarget">No branch target data found</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="maModalOverlay" onClick={closeModal}>
          <div className="maModal" onClick={(e) => e.stopPropagation()}>
            <div className="maModalHeader">
              <h3>{editingUser ? "Edit User" : "Add User"}</h3>
              <button type="button" className="maCloseBtn" onClick={closeModal}>
                <X size={18} />
              </button>
            </div>

            <form className="maForm" onSubmit={handleSubmit}>
              <div className="maFormGrid">
                <div className="maField">
                  <label>Name</label>
                  <input
                    type="text"
                    name="name"
                    placeholder="Enter full name"
                    value={form.name}
                    onChange={handleChange}
                  />
                </div>

                <div className="maField">
                  <label>Email</label>
                  <input
                    type="email"
                    name="email"
                    placeholder="Enter email"
                    value={form.email}
                    onChange={handleChange}
                  />
                </div>

                <div className="maField">
                  <label>Password</label>
                  <input
                    type="password"
                    name="password"
                    placeholder={editingUser ? "Leave blank to keep same password" : "Enter password"}
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>

                <div className="maField">
                  <label>Role</label>
                  <select name="role" value={form.role} onChange={handleChange}>
                    <option value="master_admin">Master Admin</option>
                    <option value="branch_manager">Branch Manager</option>
                    <option value="sales_rep">Sales Rep</option>
                    <option value="viewer">Viewer</option>
                  </select>
                </div>

                <div className="maField">
                  <label>Branch</label>
                  <select name="branch" value={form.branch} onChange={handleChange}>
                    {(dashboard?.branches?.length ? dashboard.branches : ["Bangalore", "Mumbai", "Mysore"]).map((branch) => (
                      <option key={branch} value={branch}>
                        {branch}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="maField maStatusField">
                  <label>Status</label>
                  <div className="maCheckboxWrap">
                    <input
                      type="checkbox"
                      name="isActive"
                      checked={form.isActive}
                      onChange={handleChange}
                    />
                    <span>Active User</span>
                  </div>
                </div>
              </div>

              <div className="maFormActions">
                <button type="button" className="maSecondaryBtn" onClick={closeModal}>
                  Cancel
                </button>
                <button type="submit" className="maPrimaryBtn" disabled={saving}>
                  {saving ? "Saving..." : editingUser ? "Update User" : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}