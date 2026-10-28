import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  FiUsers,
  FiBookOpen,
  FiPlus,
  FiEdit3,
  FiTrash2,
  FiSearch,
  FiRefreshCw,
  FiCheckCircle,
  FiAlertCircle,
  FiX,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
} from "react-icons/fi";
import "./ManageStudents.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const readStorage = (key, fallback) => {
  try {
    const v = JSON.parse(localStorage.getItem(key));
    return v ?? fallback;
  } catch (_) {
    return fallback;
  }
};

const formatDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "N/A";

function ManageStudents() {
  const { authFetch } = useAuth();

  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  // Modal States: CREATE
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    courseId: "",
  });
  const [showAddPwd, setShowAddPwd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Modal States: EDIT
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    isActive: true,
    newPassword: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // ── 1. READ: Fetch Students & Courses ──
  const fetchStudents = async () => {
    setLoading(true);
    try {
      const [usersRes, coursesRes, paymentsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/auth/users`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/api/courses?all=true`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/api/payments`).then((r) => r.json()).catch(() => ({})),
      ]);

      const allUsers = usersRes.users || [];
      const courseList = coursesRes.courses || [];
      const apiPayments = paymentsRes.payments || [];
      setCourses(courseList);

      // Filter only users with role "student"
      const studentUsers = allUsers.filter(
        (u) => (u.role || "student").toLowerCase() === "student"
      );

      // Also get local enrollments and combine with backend database payments/enrollments
      const localEnrollments = readStorage("edusphere_enrollments", []);
      
      // Combine API payments/enrollments and local enrollments
      const enrollments = [
        ...apiPayments.map((p) => ({
          studentEmail: p.studentEmail,
          studentName: p.studentName,
          studentPhone: p.studentPhone,
          courseTitle: p.courseTitle,
          courseId: p.courseId,
          progress: p.progress ?? 0,
          paid: p.paid ?? (p.status === "paid" || p.status === "completed"),
          price: p.amount ?? 0,
          enrolledAt: p.enrolledAt || p.createdAt,
        })),
        ...localEnrollments,
      ];

      // Merge user accounts with enrollment records
      const mergedList = studentUsers.map((st) => {
        const studentEnrollments = enrollments.filter(
          (e) => e.studentEmail && e.studentEmail.toLowerCase() === st.email.toLowerCase()
        );

        // Deduplicate course titles for this student
        const uniqueCourses = [];
        const seenCourses = new Set();
        studentEnrollments.forEach((e) => {
          if (e.courseTitle && !seenCourses.has(e.courseTitle.toLowerCase())) {
            seenCourses.add(e.courseTitle.toLowerCase());
            uniqueCourses.push(e);
          }
        });

        const primaryEnrollment = uniqueCourses[0] || {};
        // Calculate average progress across all enrolled courses, or primary progress
        const avgProgress = uniqueCourses.length > 0
          ? Math.round(uniqueCourses.reduce((sum, item) => sum + (item.progress || 0), 0) / uniqueCourses.length)
          : (primaryEnrollment.progress || 0);

        return {
          _id: st._id,
          name: st.name,
          email: st.email,
          phone: st.phone && st.phone !== "N/A" ? st.phone : (primaryEnrollment.studentPhone || "N/A"),
          isActive: st.isActive !== false,
          createdAt: st.createdAt,
          coursesEnrolled: uniqueCourses.map((e) => e.courseTitle).filter(Boolean),
          primaryCourse: primaryEnrollment.courseTitle || "Not enrolled yet",
          progress: avgProgress,
          paid: primaryEnrollment.paid || false,
          price: primaryEnrollment.price || 0,
        };
      });

      // Also incorporate any enrolled students that might only be in localStorage
      enrollments.forEach((e) => {
        if (
          e.studentEmail &&
          !mergedList.some((m) => m.email.toLowerCase() === e.studentEmail.toLowerCase())
        ) {
          mergedList.push({
            _id: `local-${e.studentEmail}`,
            name: e.studentName || "Student",
            email: e.studentEmail,
            phone: e.studentPhone || "N/A",
            isActive: true,
            createdAt: e.enrolledAt,
            coursesEnrolled: [e.courseTitle].filter(Boolean),
            primaryCourse: e.courseTitle || "N/A",
            progress: e.progress || 0,
            paid: e.paid || false,
            price: e.price || 0,
          });
        }
      });

      setStudents(mergedList);
    } catch (err) {
      console.error("Error fetching students:", err);
      showNotification("Could not load students.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // ── 2. CREATE: Add Student Handler ──
  const handleAddSubmit = async (e) => {
    e.preventDefault();
    setAddError("");

    if (!addForm.name.trim() || !addForm.email.trim() || !addForm.password) {
      setAddError("Name, email, and password are required.");
      return;
    }

    if (addForm.password.length < 6) {
      setAddError("Password must be at least 6 characters.");
      return;
    }

    setAddLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: addForm.name.trim(),
          email: addForm.email.trim(),
          password: addForm.password,
          phone: addForm.phone.trim(),
          role: "student",
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // If course selected, register enrollment in localStorage
        if (addForm.courseId) {
          const selectedCourse = courses.find((c) => String(c._id) === String(addForm.courseId));
          if (selectedCourse) {
            const currentEnrollments = readStorage("edusphere_enrollments", []);
            currentEnrollments.push({
              courseId: selectedCourse._id,
              courseTitle: selectedCourse.title,
              studentEmail: addForm.email.trim().toLowerCase(),
              studentName: addForm.name.trim(),
              studentPhone: addForm.phone.trim(),
              enrolledAt: new Date().toISOString(),
              progress: 0,
              paid: true,
              price: selectedCourse.price || 0,
              paymentMethod: "Admin Enrollment",
            });
            localStorage.setItem("edusphere_enrollments", JSON.stringify(currentEnrollments));
          }
        }

        showNotification(`🎉 Student "${data.user.name}" created successfully!`);
        setIsAddOpen(false);
        setAddForm({ name: "", email: "", password: "", phone: "", courseId: "" });
        fetchStudents();
      } else {
        setAddError(data.message || "Failed to create student.");
      }
    } catch (err) {
      console.error("Create student error:", err);
      setAddError("Network error creating student.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── 3. UPDATE: Edit Student Handler ──
  const openEditModal = (st) => {
    setEditStudent(st);
    setEditForm({
      name: st.name,
      email: st.email,
      phone: st.phone !== "N/A" ? st.phone : "",
      isActive: st.isActive,
      newPassword: "",
    });
    setEditError("");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    if (!editStudent) return;

    setEditLoading(true);
    try {
      // If it's a real MongoDB user
      if (!String(editStudent._id).startsWith("local-")) {
        const payload = {
          name: editForm.name.trim(),
          email: editForm.email.trim(),
          phone: editForm.phone.trim(),
          isActive: editForm.isActive,
        };
        if (editForm.newPassword && editForm.newPassword.length >= 6) {
          payload.password = editForm.newPassword;
        }

        const res = await authFetch(`${API_BASE_URL}/api/auth/users/${editStudent._id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to update student.");
        }
      }

      showNotification(`Student "${editForm.name}" updated successfully!`);
      setIsEditOpen(false);
      fetchStudents();
    } catch (err) {
      console.error("Edit student error:", err);
      setEditError(err.message || "Network error updating student.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── 4. DELETE: Delete Student Handler ──
  const handleDeleteStudent = async (studentId, studentName, email) => {
    if (!window.confirm(`Permanently delete student "${studentName}" (${email})?`)) return;

    try {
      if (!String(studentId).startsWith("local-")) {
        const res = await authFetch(`${API_BASE_URL}/api/auth/users/${studentId}`, {
          method: "DELETE",
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.message || "Failed to delete student.");
        }
      }

      // Also clean up local enrollments
      const currentEnrollments = readStorage("edusphere_enrollments", []);
      const filtered = currentEnrollments.filter(
        (e) => (e.studentEmail || "").toLowerCase() !== email.toLowerCase()
      );
      localStorage.setItem("edusphere_enrollments", JSON.stringify(filtered));

      setStudents((prev) => prev.filter((s) => s._id !== studentId));
      showNotification(`Student "${studentName}" deleted successfully.`);
    } catch (err) {
      console.error("Delete student error:", err);
      showNotification(err.message || "Failed to delete student.", "error");
    }
  };

  // Filtered list
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const isEnrolled = s.coursesEnrolled.length > 0;
      const matchesFilter =
        filter === "all" ||
        (filter === "enrolled" && isEnrolled) ||
        (filter === "active" && s.isActive);

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        s.phone.includes(q) ||
        s.primaryCourse.toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [students, filter, search]);

  const stats = useMemo(() => {
    const total = students.length;
    const enrolled = students.filter((s) => s.coursesEnrolled.length > 0).length;
    const active = students.filter((s) => s.isActive).length;
    return { total, enrolled, active };
  }, [students]);

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        {/* Header */}
        <div className="users-page-header">
          <div className="users-header-info">
            <h1>
              <FiUsers style={{ color: "#2563eb" }} /> Manage Students (CRUD)
            </h1>
            <p>
              Create, view, update, and manage student accounts and their course enrollments.
            </p>
          </div>

          <div className="users-header-actions">
            <button className="btn-refresh-users" onClick={fetchStudents} title="Refresh student data">
              <FiRefreshCw /> Refresh
            </button>
            <button className="btn-create-admin" onClick={() => setIsAddOpen(true)}>
              <FiPlus /> Add New Student
            </button>
          </div>
        </div>

        {/* Notifications */}
        {notification && (
          <div className={`users-alert-banner ${notification.type}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {notification.type === "success" ? <FiCheckCircle /> : <FiAlertCircle />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)}>&times;</button>
          </div>
        )}

        {/* Stats Grid */}
        <div className="students-stats-row">
          <div className="student-stat-card">
            <div className="student-stat-icon total">
              <FiUsers />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Total Registered Students</div>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon enrolled">
              <FiBookOpen />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.enrolled}</div>
              <div className="stat-label">Active Enrollments</div>
            </div>
          </div>

          <div className="student-stat-card">
            <div className="student-stat-icon active">
              <FiCheckCircle />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.active}</div>
              <div className="stat-label">Active Student Accounts</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="users-toolbar">
          <div className="users-search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by student name, email, phone, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="users-filter-pills">
            <button
              className={`filter-pill ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All Students ({stats.total})
            </button>
            <button
              className={`filter-pill ${filter === "enrolled" ? "active" : ""}`}
              onClick={() => setFilter("enrolled")}
            >
              Enrolled ({stats.enrolled})
            </button>
            <button
              className={`filter-pill ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Active ({stats.active})
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> Loading students...
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="no-students">
              <h3>No Students Found</h3>
              <p>
                {search
                  ? "No students match your search criteria."
                  : "No students registered yet. Click \"Add New Student\" to create one."}
              </p>
            </div>
          ) : (
            <table style={{ minWidth: 980 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Student Details</th>
                  <th>Contact Info</th>
                  <th>Enrolled Course(s)</th>
                  <th>Progress</th>
                  <th>Status</th>
                  <th>Joined On</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map((st, i) => (
                  <tr key={st._id || i}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-circle student">
                          {(st.name || "S")[0].toUpperCase()}
                        </div>
                        <div className="user-details">
                          <strong style={{ color: "#0f172a" }}>{st.name}</strong>
                          <span style={{ fontSize: 12, color: "#64748b" }}>{st.email}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        {st.phone !== "N/A" ? (
                          <a href={`tel:${st.phone}`} style={{ color: "#475569" }}>
                            {st.phone}
                          </a>
                        ) : (
                          <span style={{ color: "#94a3b8" }}>—</span>
                        )}
                      </div>
                    </td>
                    <td>
                      {st.coursesEnrolled.length > 0 ? (
                        st.coursesEnrolled.map((c, idx) => (
                          <span
                            key={idx}
                            style={{
                              display: "inline-block",
                              background: "#eff6ff",
                              color: "#1d4ed8",
                              padding: "2px 8px",
                              borderRadius: 4,
                              fontSize: 12,
                              marginRight: 4,
                              marginBottom: 2,
                            }}
                          >
                            {c}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 13 }}>
                          Not enrolled
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div
                          style={{
                            background: "#e2e8f0",
                            borderRadius: 10,
                            height: 6,
                            width: 60,
                            overflow: "hidden",
                          }}
                        >
                          <div
                            style={{
                              width: `${st.progress}%`,
                              height: "100%",
                              background: "#16a34a",
                            }}
                          />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 600 }}>{st.progress}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`student-status-badge ${st.isActive ? "active" : "inactive"}`}>
                        ● {st.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>{formatDate(st.createdAt)}</td>
                    <td>
                      <div className="student-actions-cell">
                        {/* UPDATE Button */}
                        <button
                          className="btn-edit-student"
                          title="Edit student details"
                          onClick={() => openEditModal(st)}
                        >
                          <FiEdit3 /> Edit
                        </button>

                        {/* DELETE Button */}
                        <button
                          className="btn-delete-user-action"
                          title="Delete student permanently"
                          onClick={() => handleDeleteStudent(st._id, st.name, st.email)}
                        >
                          <FiTrash2 />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* CREATE STUDENT MODAL */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiPlus style={{ color: "#2563eb" }} /> Add New Student
              </h2>
              <button className="modal-close-btn" onClick={() => setIsAddOpen(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleAddSubmit}>
              <div className="modal-body">
                {addError && (
                  <div className="users-alert-banner error" style={{ margin: "0 0 16px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiAlertCircle />
                      <span>{addError}</span>
                    </div>
                  </div>
                )}

                <div className="modal-form-group">
                  <label htmlFor="student-name">Full Name *</label>
                  <div className="modal-input-wrapper">
                    <FiUsers className="field-icon" />
                    <input
                      id="student-name"
                      type="text"
                      placeholder="e.g. Priya Patel"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="student-email">Email Address *</label>
                  <div className="modal-input-wrapper">
                    <FiMail className="field-icon" />
                    <input
                      id="student-email"
                      type="email"
                      placeholder="e.g. priya@gmail.com"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="student-password">Initial Password *</label>
                  <div className="modal-input-wrapper">
                    <FiLock className="field-icon" />
                    <input
                      id="student-password"
                      type={showAddPwd ? "text" : "password"}
                      placeholder="Minimum 6 characters"
                      value={addForm.password}
                      onChange={(e) => setAddForm({ ...addForm, password: e.target.value })}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="modal-toggle-pwd"
                      onClick={() => setShowAddPwd(!showAddPwd)}
                    >
                      {showAddPwd ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="student-phone">Phone Number</label>
                  <div className="modal-input-wrapper">
                    <FiPhone className="field-icon" />
                    <input
                      id="student-phone"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="student-course">Assign Course (Optional)</label>
                  <div className="modal-input-wrapper">
                    <FiBookOpen className="field-icon" />
                    <select
                      id="student-course"
                      value={addForm.courseId}
                      onChange={(e) => setAddForm({ ...addForm, courseId: e.target.value })}
                    >
                      <option value="">No Course (Register only)</option>
                      {courses.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.title} (₹{c.price})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setIsAddOpen(false)}
                    disabled={addLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-submit" disabled={addLoading}>
                    {addLoading ? "Creating Student..." : "Create Student Account"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE / EDIT STUDENT MODAL */}
      {isEditOpen && editStudent && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiEdit3 style={{ color: "#4f46e5" }} /> Edit Student Details
              </h2>
              <button className="modal-close-btn" onClick={() => setIsEditOpen(false)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {editError && (
                  <div className="users-alert-banner error" style={{ margin: "0 0 16px 0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiAlertCircle />
                      <span>{editError}</span>
                    </div>
                  </div>
                )}

                <div className="modal-form-group">
                  <label htmlFor="edit-student-name">Full Name *</label>
                  <div className="modal-input-wrapper">
                    <FiUsers className="field-icon" />
                    <input
                      id="edit-student-name"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-student-email">Email Address *</label>
                  <div className="modal-input-wrapper">
                    <FiMail className="field-icon" />
                    <input
                      id="edit-student-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-student-phone">Phone Number</label>
                  <div className="modal-input-wrapper">
                    <FiPhone className="field-icon" />
                    <input
                      id="edit-student-phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-student-pwd">Reset Password (Optional)</label>
                  <div className="modal-input-wrapper">
                    <FiLock className="field-icon" />
                    <input
                      id="edit-student-pwd"
                      type="password"
                      placeholder="Leave blank to keep unchanged"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-student-status">Account Status</label>
                  <div className="modal-input-wrapper">
                    <select
                      id="edit-student-status"
                      value={editForm.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, isActive: e.target.value === "true" })
                      }
                    >
                      <option value="true">Active Account</option>
                      <option value="false">Suspended / Inactive</option>
                    </select>
                  </div>
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setIsEditOpen(false)}
                    disabled={editLoading}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-modal-submit" disabled={editLoading}>
                    {editLoading ? "Saving..." : "Save Changes"}
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

export default ManageStudents;