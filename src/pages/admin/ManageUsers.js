import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  FiUsers,
  FiShield,
  FiUserCheck,
  FiBookOpen,
  FiSearch,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiMail,
  FiLock,
  FiPhone,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import "./ManageUsers.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function ManageUsers() {
  const { user: currentUser, authFetch } = useAuth();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  // Modal State for creating an admin/user
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin",
    department: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState("");

  // Fetch users from backend
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/users`);
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.users || []);
      } else {
        showNotification(data.message || "Failed to load users.", "error");
      }
    } catch (err) {
      console.error("Error loading users:", err);
      showNotification("Could not connect to backend server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  // Promote / Change role handler
  const handleRoleChange = async (userId, targetRole, userName) => {
    const isPromotingToAdmin = targetRole === "admin";
    const confirmMsg = isPromotingToAdmin
      ? `Are you sure you want to promote "${userName}" to Administrator? They will have full administrative privileges.`
      : `Change role of "${userName}" to ${targetRole.toUpperCase()}?`;

    if (!window.confirm(confirmMsg)) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/users/${userId}/role`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: targetRole }),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        if (res.status === 404) {
          throw new Error("Please restart your backend terminal (Ctrl + C, then npm start) to activate new routes.");
        }
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      if (res.ok && data.success) {
        setUsers((prev) =>
          prev.map((u) => (u._id === userId ? { ...u, role: targetRole } : u))
        );
        showNotification(
          `🎉 Success! ${userName} is now an ${targetRole.toUpperCase()}.`
        );
      } else {
        showNotification(data.message || "Failed to update role.", "error");
      }
    } catch (err) {
      console.error("Role update error:", err);
      showNotification(err.message || "Network error updating role.", "error");
    }
  };

  // Delete user handler
  const handleDeleteUser = async (userId, userName) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete user "${userName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/users/${userId}`, {
        method: "DELETE",
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        if (res.status === 404) {
          throw new Error("Please restart your backend terminal (Ctrl + C, then npm start) to activate new routes.");
        }
        throw new Error(`Server returned ${res.status} ${res.statusText}`);
      }

      if (res.ok && data.success) {
        setUsers((prev) => prev.filter((u) => u._id !== userId));
        showNotification(`User "${userName}" has been deleted.`);
      } else {
        showNotification(data.message || "Failed to delete user.", "error");
      }
    } catch (err) {
      console.error("Delete user error:", err);
      showNotification(err.message || "Network error deleting user.", "error");
    }
  };

  // Create new Admin / User form submit
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError("");

    if (!createForm.name.trim() || !createForm.email.trim() || !createForm.password) {
      setCreateError("Name, email, and password are required.");
      return;
    }

    if (createForm.password.length < 6) {
      setCreateError("Password must be at least 6 characters long.");
      return;
    }

    setCreateLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });

      let data = {};
      try {
        data = await res.json();
      } catch (_) {
        if (res.status === 404) {
          throw new Error("Backend route not found. Please restart your backend terminal (Ctrl + C, then npm start).");
        }
        throw new Error(`Server error (${res.status} ${res.statusText})`);
      }

      if (res.ok && data.success) {
        setUsers((prev) => [data.user, ...prev]);
        setIsModalOpen(false);
        setCreateForm({
          name: "",
          email: "",
          password: "",
          phone: "",
          role: "admin",
          department: "",
        });
        showNotification(`🎉 New ${data.user.role.toUpperCase()} "${data.user.name}" created successfully!`);
      } else {
        setCreateError(data.message || "Failed to create user.");
      }
    } catch (err) {
      console.error("Create user error:", err);
      setCreateError(err.message || "Network error creating user.");
    } finally {
      setCreateLoading(false);
    }
  };

  // Filtered users calculation
  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const userRole = (u.role || "").toLowerCase();
      const matchesRole = roleFilter === "all" || userRole === roleFilter;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (u.name && u.name.toLowerCase().includes(q)) ||
        (u.email && u.email.toLowerCase().includes(q)) ||
        (u.phone && u.phone.includes(q));

      return matchesRole && matchesSearch;
    });
  }, [users, roleFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = users.length;
    const admins = users.filter((u) => (u.role || "").toLowerCase() === "admin").length;
    const instructors = users.filter((u) => (u.role || "").toLowerCase() === "instructor").length;
    const students = users.filter((u) => (u.role || "").toLowerCase() === "student").length;
    return { total, admins, instructors, students };
  }, [users]);

  // Format date helper
  const formatDate = (iso) => {
    if (!iso) return "N/A";
    return new Date(iso).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Get initials for user avatar
  const getInitials = (name) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        {/* Page Header */}
        <div className="users-page-header">
          <div className="users-header-info">
            <h1>
              <FiShield style={{ color: "#7c3aed" }} /> User &amp; Role Management
            </h1>
            <p>
              View registered users, promote users to Administrator, or create new administrative accounts.
            </p>
          </div>

          <div className="users-header-actions">
            <button
              className="btn-refresh-users"
              onClick={fetchUsers}
              title="Refresh users list"
            >
              <FiRefreshCw /> Refresh
            </button>
            <button
              className="btn-create-admin"
              onClick={() => {
                setCreateError("");
                setIsModalOpen(true);
              }}
            >
              <FiPlus /> Create New Admin
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`users-alert-banner ${notification.type}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {notification.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)}>&times;</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="users-stats-grid">
          <div className="user-stat-card">
            <div className="stat-icon-wrapper total">
              <FiUsers />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Registered Users</div>
            </div>
          </div>

          <div className="user-stat-card">
            <div className="stat-icon-wrapper admin">
              <FiShield />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.admins}</div>
              <div className="stat-label">System Administrators</div>
            </div>
          </div>

          <div className="user-stat-card">
            <div className="stat-icon-wrapper instructor">
              <FiUserCheck />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.instructors}</div>
              <div className="stat-label">Instructors</div>
            </div>
          </div>

          <div className="user-stat-card">
            <div className="stat-icon-wrapper student">
              <FiBookOpen />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.students}</div>
              <div className="stat-label">Students</div>
            </div>
          </div>
        </div>

        {/* Toolbar: Search and Filter Pills */}
        <div className="users-toolbar">
          <div className="users-search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="users-filter-pills">
            <button
              className={`filter-pill ${roleFilter === "all" ? "active" : ""}`}
              onClick={() => setRoleFilter("all")}
            >
              All Users ({stats.total})
            </button>
            <button
              className={`filter-pill ${roleFilter === "admin" ? "active" : ""}`}
              onClick={() => setRoleFilter("admin")}
            >
              Admins ({stats.admins})
            </button>
            <button
              className={`filter-pill ${roleFilter === "instructor" ? "active" : ""}`}
              onClick={() => setRoleFilter("instructor")}
            >
              Instructors ({stats.instructors})
            </button>
            <button
              className={`filter-pill ${roleFilter === "student" ? "active" : ""}`}
              onClick={() => setRoleFilter("student")}
            >
              Students ({stats.students})
            </button>
          </div>
        </div>

        {/* Users Table */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> Loading users from MongoDB...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-students">
              <h3>No Users Found</h3>
              <p>
                {searchQuery
                  ? "No users matched your search criteria."
                  : "No registered users in this category."}
              </p>
            </div>
          ) : (
            <table style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>User Details</th>
                  <th>Email Address</th>
                  <th>Phone</th>
                  <th>Current Role</th>
                  <th>Joined On</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, i) => {
                  const role = (u.role || "student").toLowerCase();
                  const isCurrent = currentUser?.email && u.email && currentUser.email.toLowerCase() === u.email.toLowerCase();
                  const isAdmin = role === "admin";

                  return (
                    <tr key={u._id || i}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="user-cell">
                          <div className={`user-avatar-circle ${role}`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="user-details">
                            <span className="user-name-text">
                              {u.name}
                              {isCurrent && <span className="you-badge">You</span>}
                            </span>
                            {u.department && (
                              <span style={{ fontSize: 12, color: "#94a3b8" }}>
                                {u.department}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {u.email ? (
                          <a href={`mailto:${u.email}`} style={{ color: "#4f46e5", fontWeight: 500 }}>
                            {u.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </td>
                      <td>{u.phone || "—"}</td>
                      <td>
                        <span className={`role-badge ${role}`}>
                          {role === "admin" && <FiShield />}
                          {role === "instructor" && <FiUserCheck />}
                          {role === "student" && <FiBookOpen />}
                          {role}
                        </span>
                      </td>
                      <td>{formatDate(u.createdAt)}</td>
                      <td>
                        <div className="user-actions-cell" style={{ justifyContent: "flex-end" }}>
                          {/* Quick Make Admin Button (for non-admins) */}
                          {!isAdmin && (
                            <button
                              className="btn-make-admin-action"
                              title="Promote this user to Admin"
                              onClick={() => handleRoleChange(u._id, "admin", u.name)}
                            >
                              <FiShield /> Make Admin
                            </button>
                          )}

                          {/* Role Selector dropdown for flexible reassignment */}
                          <select
                            className="role-select-inline"
                            value={role}
                            disabled={isCurrent}
                            title={isCurrent ? "You cannot modify your own role" : "Change user role"}
                            onChange={(e) => handleRoleChange(u._id, e.target.value, u.name)}
                          >
                            <option value="admin">Admin</option>
                            <option value="instructor">Instructor</option>
                            <option value="student">Student</option>
                          </select>

                          {/* Delete User */}
                          <button
                            className="btn-delete-user-action"
                            title={isCurrent ? "You cannot delete your own account" : "Delete user"}
                            disabled={isCurrent}
                            onClick={() => handleDeleteUser(u._id, u.name)}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE NEW ADMIN MODAL */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiShield style={{ color: "#7c3aed" }} /> Create New Administrator
              </h2>
              <button
                className="modal-close-btn"
                onClick={() => setIsModalOpen(false)}
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit}>
              <div className="modal-body">
                {createError && (
                  <div className="users-alert-banner error" style={{ margin: "0 0 16px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiAlertCircle />
                      <span>{createError}</span>
                    </div>
                  </div>
                )}

                {/* Name */}
                <div className="modal-form-group">
                  <label htmlFor="create-admin-name">Full Name *</label>
                  <div className="modal-input-wrapper">
                    <FiUsers className="field-icon" />
                    <input
                      id="create-admin-name"
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={createForm.name}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, name: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="modal-form-group">
                  <label htmlFor="create-admin-email">Email Address *</label>
                  <div className="modal-input-wrapper">
                    <FiMail className="field-icon" />
                    <input
                      id="create-admin-email"
                      type="email"
                      placeholder="e.g. admin.rahul@edusphere.com"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, email: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="modal-form-group">
                  <label htmlFor="create-admin-password">Password *</label>
                  <div className="modal-input-wrapper">
                    <FiLock className="field-icon" />
                    <input
                      id="create-admin-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, password: e.target.value })
                      }
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="modal-toggle-pwd"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                {/* Phone */}
                <div className="modal-form-group">
                  <label htmlFor="create-admin-phone">Phone Number (Optional)</label>
                  <div className="modal-input-wrapper">
                    <FiPhone className="field-icon" />
                    <input
                      id="create-admin-phone"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={createForm.phone}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, phone: e.target.value })
                      }
                    />
                  </div>
                </div>

                {/* Role Selection */}
                <div className="modal-form-group">
                  <label htmlFor="create-admin-role">System Role *</label>
                  <div className="modal-input-wrapper">
                    <FiShield className="field-icon" />
                    <select
                      id="create-admin-role"
                      value={createForm.role}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, role: e.target.value })
                      }
                    >
                      <option value="admin">Administrator (Full Admin Access)</option>
                      <option value="instructor">Instructor (Course Creator)</option>
                      <option value="student">Student (Learner)</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setIsModalOpen(false)}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-submit"
                    disabled={createLoading}
                  >
                    {createLoading ? "Creating..." : "Create Account"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ManageUsers;
