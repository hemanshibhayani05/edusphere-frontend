import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  FiUser,
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
  FiBriefcase,
  FiDollarSign,
  FiPieChart,
  FiTrendingUp,
  FiCreditCard,
  FiDownload,
  FiBarChart2,
} from "react-icons/fi";
import { formatRupees } from "../../utils/adminStats";
import "./Manageinstructors.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function ManageInstructors() {
  const { authFetch } = useAuth();

  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [notification, setNotification] = useState(null);

  // Modal State: ADD INSTRUCTOR
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    department: "Computer Science & Engineering",
  });
  const [showAddPwd, setShowAddPwd] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");

  // Modal State: EDIT INSTRUCTOR
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editInstructor, setEditInstructor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    department: "",
    isActive: true,
    newPassword: "",
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Modal State: INSTRUCTOR FINANCIAL REPORT (10% Admin Commission, 90% Instructor Payout)
  const [payments, setPayments] = useState([]);
  const [payoutsList, setPayoutsList] = useState([]);
  const [reportModalInstructor, setReportModalInstructor] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);

  // Modal State: DISBURSE PAYOUT TO INSTRUCTOR
  const [isDisburseOpen, setIsDisburseOpen] = useState(false);
  const [disburseInstructor, setDisburseInstructor] = useState(null);
  const [disburseMethod, setDisburseMethod] = useState("Bank Transfer (NEFT/RTGS)");
  const [disburseTxRef, setDisburseTxRef] = useState("");
  const [disburseNotes, setDisburseNotes] = useState("");
  const [disburseLoading, setDisburseLoading] = useState(false);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  const handleDisbursePayment = async (e) => {
    e.preventDefault();
    if (!disburseInstructor) return;

    if (disburseInstructor.instructorPayout <= 0) {
      alert("No payout balance available to disburse to this instructor.");
      return;
    }

    setDisburseLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/disburse-payout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instructorId: disburseInstructor._id,
          instructorName: disburseInstructor.name,
          instructorEmail: disburseInstructor.email,
          totalCourseRevenue: disburseInstructor.totalRevenue,
          adminCommissionRate: 10,
          paymentMethod: disburseMethod,
          transactionReference: disburseTxRef.trim() || `UTR${Date.now()}`,
          notes: disburseNotes.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        showNotification(`🎉 Disbursed ${formatRupees(disburseInstructor.instructorPayout)} to ${disburseInstructor.name}! Payout confirmation email delivered.`);
        setIsDisburseOpen(false);
        setDisburseTxRef("");
        setDisburseNotes("");
        fetchInstructors();
      } else {
        alert(data.message || "Failed to process disbursement.");
      }
    } catch (err) {
      console.error("Disbursement error:", err);
      alert("Error contacting server to process disbursement.");
    } finally {
      setDisburseLoading(false);
    }
  };

  // ── 1. READ: Fetch Instructors, Courses, Payments & Payouts with JWT ──
  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const [usersRes, coursesRes, paymentsRes, payoutsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/auth/users`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/api/courses?all=true`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/api/payments`).then((r) => r.json()).catch(() => ({})),
        fetch(`${API_BASE_URL}/api/payments/payouts`).then((r) => r.json()).catch(() => ({})),
      ]);

      const allUsers = usersRes.users || [];
      const allCourses = coursesRes.courses || [];
      const allPayments = paymentsRes.payments || [];
      const allPayouts = payoutsRes.payouts || [];
      setCourses(allCourses);
      setPayments(allPayments);
      setPayoutsList(allPayouts);

      // Filter only users with role "instructor"
      const instructorUsers = allUsers.filter(
        (u) => (u.role || "").toLowerCase() === "instructor"
      );

      const list = instructorUsers.map((inst, idx) => {
        const taughtCourses = allCourses.filter(
          (c) =>
            (c.instructorId && String(c.instructorId) === String(inst._id)) ||
            (c.instructor && c.instructor.toLowerCase() === (inst.name || "").toLowerCase())
        );

        // Match student payments for courses taught by this instructor
        const instPayments = allPayments.filter((p) => {
          const instMatch =
            (p.instructor && p.instructor.toLowerCase() === (inst.name || "").toLowerCase()) ||
            taughtCourses.some(
              (c) =>
                (p.courseId && String(p.courseId) === String(c._id || c.id)) ||
                (p.courseTitle && p.courseTitle.toLowerCase() === (c.title || "").toLowerCase())
            );
          return instMatch && p.paid !== false;
        });

        const totalRevenue = instPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
        const adminCommission = Math.round(totalRevenue * 0.10); // 10% kept by admin
        const instructorPayout = totalRevenue - adminCommission; // 90% given to instructor
        const studentEnrollments = instPayments.length;

        // Check payouts already disbursed to this instructor by Admin
        const instPayouts = allPayouts.filter(
          (pay) =>
            (pay.instructorEmail && inst.email && pay.instructorEmail.toLowerCase() === inst.email.toLowerCase()) ||
            (pay.instructorId && String(pay.instructorId) === String(inst._id))
        );

        const totalDisbursed = instPayouts.reduce((sum, pay) => sum + (Number(pay.netPayoutAmount) || 0), 0);
        const isPaid = totalDisbursed >= instructorPayout && totalDisbursed > 0;
        const lastPayout = instPayouts[0] || null;

        return {
          _id: inst._id || `inst-${idx}`,
          name: inst.name,
          email: inst.email || "N/A",
          phone: inst.phone || "N/A",
          department: inst.department || "Technology",
          isActive: inst.isActive !== false,
          courses: taughtCourses.map((c) => c.title),
          taughtCourseDocs: taughtCourses,
          payments: instPayments,
          totalRevenue,
          adminCommission,
          instructorPayout,
          studentEnrollments,
          instPayouts,
          totalDisbursed,
          isPaid,
          lastPayout,
          createdAt: inst.createdAt,
        };
      });

      setInstructors(list);
    } catch (err) {
      console.error("Error loading instructors:", err);
      showNotification("Could not load instructors.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstructors();
  }, []);

  // ── 2. CREATE: Add Instructor ──
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
          role: "instructor",
          department: addForm.department.trim(),
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showNotification(`🎉 Instructor "${data.user.name}" created successfully!`);
        setIsAddOpen(false);
        setAddForm({
          name: "",
          email: "",
          password: "",
          phone: "",
          department: "Computer Science & Engineering",
        });
        fetchInstructors();
      } else {
        setAddError(data.message || "Failed to create instructor.");
      }
    } catch (err) {
      console.error("Create instructor error:", err);
      setAddError("Network error creating instructor.");
    } finally {
      setAddLoading(false);
    }
  };

  // ── 3. UPDATE: Edit Instructor ──
  const openEditModal = (inst) => {
    setEditInstructor(inst);
    setEditForm({
      name: inst.name,
      email: inst.email,
      phone: inst.phone !== "N/A" ? inst.phone : "",
      department: inst.department,
      isActive: inst.isActive,
      newPassword: "",
    });
    setEditError("");
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditError("");
    if (!editInstructor) return;

    setEditLoading(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        department: editForm.department.trim(),
        isActive: editForm.isActive,
      };
      if (editForm.newPassword && editForm.newPassword.length >= 6) {
        payload.password = editForm.newPassword;
      }

      const res = await authFetch(`${API_BASE_URL}/api/auth/users/${editInstructor._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to update instructor.");
      }

      showNotification(`Instructor "${editForm.name}" updated successfully!`);
      setIsEditOpen(false);
      fetchInstructors();
    } catch (err) {
      console.error("Edit instructor error:", err);
      setEditError(err.message || "Network error updating instructor.");
    } finally {
      setEditLoading(false);
    }
  };

  // ── 4. DELETE: Delete Instructor ──
  const handleDeleteInstructor = async (id, name, email) => {
    if (!window.confirm(`Permanently delete instructor "${name}" (${email})?`)) return;

    try {
      const res = await authFetch(`${API_BASE_URL}/api/auth/users/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete instructor.");
      }

      setInstructors((prev) => prev.filter((i) => i._id !== id));
      showNotification(`Instructor "${name}" deleted.`);
    } catch (err) {
      console.error("Delete instructor error:", err);
      showNotification(err.message || "Failed to delete instructor.", "error");
    }
  };

  // Filtered instructors
  const filteredInstructors = useMemo(() => {
    return instructors.filter((inst) => {
      const matchesDept = deptFilter === "all" || inst.department === deptFilter;
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        inst.name.toLowerCase().includes(q) ||
        inst.email.toLowerCase().includes(q) ||
        inst.phone.includes(q) ||
        (inst.courses && inst.courses.some((c) => c.toLowerCase().includes(q)));

      return matchesDept && matchesSearch;
    });
  }, [instructors, deptFilter, search]);

  const departments = useMemo(() => {
    const set = new Set(instructors.map((i) => i.department).filter(Boolean));
    return Array.from(set);
  }, [instructors]);

  const stats = useMemo(() => {
    const total = instructors.length;
    const totalCoursesTaught = instructors.reduce((acc, i) => acc + (i.courses?.length || 0), 0);
    const active = instructors.filter((i) => i.isActive).length;
    const totalPlatformRev = instructors.reduce((acc, i) => acc + (i.totalRevenue || 0), 0);
    const totalAdminCommission = instructors.reduce((acc, i) => acc + (i.adminCommission || 0), 0);
    const totalTrainerPayout = instructors.reduce((acc, i) => acc + (i.instructorPayout || 0), 0);
    return {
      total,
      totalCoursesTaught,
      active,
      totalPlatformRev,
      totalAdminCommission,
      totalTrainerPayout,
    };
  }, [instructors]);

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        {/* Header */}
        <div className="users-page-header">
          <div className="users-header-info">
            <h1>
              <FiUser style={{ color: "#2563eb" }} /> Manage Instructors &amp; Payouts
            </h1>
            <p>
              View faculty, generate trainer financial reports, and inspect 10% platform commission &amp; instructor disbursements.
            </p>
          </div>

          <div className="users-header-actions">
            <button className="btn-refresh-users" onClick={fetchInstructors} title="Refresh instructors">
              <FiRefreshCw /> Refresh
            </button>
            <button className="btn-create-admin" onClick={() => setIsAddOpen(true)}>
              <FiPlus /> Add New Instructor
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

        {/* Stats Row */}
        <div className="instructors-stats-row">
          <div className="instructor-stat-card">
            <div className="instructor-stat-icon total">
              <FiUser />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.total}</div>
              <div className="stat-label">Registered Instructors</div>
            </div>
          </div>

          <div className="instructor-stat-card">
            <div className="instructor-stat-icon courses">
              <FiBookOpen />
            </div>
            <div className="stat-details">
              <div className="stat-number">{stats.totalCoursesTaught}</div>
              <div className="stat-label">Courses Under Instruction</div>
            </div>
          </div>

          <div className="instructor-stat-card">
            <div className="instructor-stat-icon commission-icon">
              <FiDollarSign />
            </div>
            <div className="stat-details">
              <div className="stat-number" style={{ color: "#059669" }}>
                {formatRupees(stats.totalAdminCommission)}
              </div>
              <div className="stat-label">Admin Commission (10%)</div>
            </div>
          </div>

          <div className="instructor-stat-card">
            <div className="instructor-stat-icon payout-icon">
              <FiCreditCard />
            </div>
            <div className="stat-details">
              <div className="stat-number" style={{ color: "#2563eb" }}>
                {formatRupees(stats.totalTrainerPayout)}
              </div>
              <div className="stat-label">Instructor Payouts (90%)</div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="users-toolbar">
          <div className="users-search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by instructor name, email, department, or course..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="users-filter-pills">
            <button
              className={`filter-pill ${deptFilter === "all" ? "active" : ""}`}
              onClick={() => setDeptFilter("all")}
            >
              All Departments ({stats.total})
            </button>
            {departments.map((dept, idx) => (
              <button
                key={idx}
                className={`filter-pill ${deptFilter === dept ? "active" : ""}`}
                onClick={() => setDeptFilter(dept)}
              >
                {dept}
              </button>
            ))}
          </div>
        </div>

        {/* Table Card */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> Loading instructors...
            </div>
          ) : filteredInstructors.length === 0 ? (
            <div className="no-students">
              <h3>No Instructors Found</h3>
              <p>
                {search
                  ? "No instructors match your search criteria."
                  : "No registered instructors in MongoDB yet. Click \"Add New Instructor\" to create one."}
              </p>
            </div>
          ) : (
            <table style={{ minWidth: 1050 }}>
              <thead>
                <tr>
                  <th style={{ width: 40 }}>#</th>
                  <th>Instructor Details</th>
                  <th>Email &amp; Dept</th>
                  <th>Taught Courses</th>
                  <th>Course Revenue</th>
                  <th>Admin 10% Cut</th>
                  <th>Trainer 90% Payout</th>
                  <th style={{ textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInstructors.map((r, i) => (
                  <tr key={r._id || i}>
                    <td>{i + 1}</td>
                    <td>
                      <div className="user-cell">
                        <div className="user-avatar-circle instructor">
                          {(r.name || "I")[0].toUpperCase()}
                        </div>
                        <div className="user-details">
                          <strong style={{ color: "#0f172a" }}>{r.name}</strong>
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            {r.isActive ? "● Active Faculty" : "● Inactive"}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        {r.email !== "N/A" ? (
                          <a href={`mailto:${r.email}`} style={{ color: "#2563eb", fontWeight: 500 }}>
                            {r.email}
                          </a>
                        ) : (
                          "N/A"
                        )}
                      </div>
                      <span className="inst-dept-badge" style={{ marginTop: 4 }}>{r.department}</span>
                    </td>
                    <td>
                      {r.courses.length === 0 ? (
                        <span style={{ color: "#94a3b8", fontStyle: "italic", fontSize: 13 }}>
                          No courses published
                        </span>
                      ) : (
                        <div style={{ display: "flex", flexWrap: "wrap", gap: 4, maxWidth: 260 }}>
                          {r.courses.map((c, k) => (
                            <span key={k} className="inst-course-pill">
                              • {c}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: 14 }}>
                        {formatRupees(r.totalRevenue)}
                      </strong>
                      <div style={{ fontSize: 11, color: "#64748b" }}>
                        {r.studentEnrollments} student enrollment{r.studentEnrollments !== 1 ? "s" : ""}
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: "#059669", fontSize: 14 }}>
                        {formatRupees(r.adminCommission)}
                      </strong>
                      <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>
                        10% Admin Fee
                      </div>
                    </td>
                    <td>
                      <strong style={{ color: r.isPaid ? "#16a34a" : "#2563eb", fontSize: 14 }}>
                        {formatRupees(r.instructorPayout)}
                      </strong>
                      <div style={{ fontSize: 11, color: r.isPaid ? "#16a34a" : "#2563eb", fontWeight: 600 }}>
                        {r.isPaid ? "✓ 90% Paid" : "90% Net Payable"}
                      </div>
                    </td>
                    <td>
                      <div className="student-actions-cell" style={{ justifyContent: "flex-end" }}>
                        {r.isPaid ? (
                          <span
                            className="badge-paid-indicator"
                            title={`Paid ${formatRupees(r.totalDisbursed)} (UTR: ${r.lastPayout?.transactionReference || "Verified"})`}
                          >
                            <FiCheckCircle /> Paid
                          </span>
                        ) : (
                          <button
                            className="btn-pay-instructor"
                            title="Pay Instructor (90% Disbursement)"
                            onClick={() => {
                              setDisburseInstructor(r);
                              setDisburseTxRef(`UTR-${Date.now().toString().slice(-8)}`);
                              setIsDisburseOpen(true);
                            }}
                          >
                            <FiDollarSign /> Pay
                          </button>
                        )}
                        <button
                          className="btn-report-instructor"
                          title="View Trainer Financial Report"
                          onClick={() => {
                            setReportModalInstructor(r);
                            setIsReportOpen(true);
                          }}
                        >
                          <FiBarChart2 /> Report
                        </button>
                        <button
                          className="btn-edit-student"
                          title="Edit instructor"
                          onClick={() => openEditModal(r)}
                        >
                          <FiEdit3 />
                        </button>
                        <button
                          className="btn-delete-user-action"
                          title="Delete instructor"
                          onClick={() => handleDeleteInstructor(r._id, r.name, r.email)}
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

      {/* TRAINER FINANCIAL REPORT MODAL (10% ADMIN COMMISSION & 90% INSTRUCTOR PAYOUT) */}
      {isReportOpen && reportModalInstructor && (
        <div className="modal-overlay" onClick={() => setIsReportOpen(false)}>
          <div className="modal-dialog report-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>
                  <FiBarChart2 style={{ color: "#2563eb" }} /> Trainer Statement &amp; Payout Report
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  Detailed course sales, 10% platform fee deduction, and net instructor disbursement.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsReportOpen(false)}>
                <FiX />
              </button>
            </div>

            <div className="modal-body" style={{ padding: "20px 24px" }}>
              {/* Trainer Profile Overview Card */}
              <div className="trainer-report-profile-card">
                <div className="trainer-report-avatar">
                  {(reportModalInstructor.name || "I")[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: "0 0 4px", fontSize: 18, color: "#0f172a" }}>
                    {reportModalInstructor.name}
                  </h3>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", fontSize: 13, color: "#64748b" }}>
                    <span><strong>Email:</strong> {reportModalInstructor.email}</span>
                    <span><strong>Department:</strong> {reportModalInstructor.department}</span>
                    <span><strong>Phone:</strong> {reportModalInstructor.phone}</span>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <button
                    className="btn-download-trainer-csv"
                    onClick={() => {
                      if (!reportModalInstructor.payments || reportModalInstructor.payments.length === 0) {
                        alert("No transaction records available to export for this instructor.");
                        return;
                      }
                      const headers = [
                        "Transaction ID",
                        "Student Name",
                        "Student Email",
                        "Course Title",
                        "Date",
                        "Total Paid (INR)",
                        "Admin Commission 10% (INR)",
                        "Instructor Share 90% (INR)",
                        "Payment Method",
                      ];
                      const rows = reportModalInstructor.payments.map((p) => {
                        const amt = Number(p.amount) || 0;
                        const adminCut = Math.round(amt * 0.10);
                        const instCut = amt - adminCut;
                        return [
                          `"${p.paymentId || p._id || ""}"`,
                          `"${p.studentName || ""}"`,
                          `"${p.studentEmail || ""}"`,
                          `"${p.courseTitle || ""}"`,
                          `"${p.enrolledAt ? new Date(p.enrolledAt).toLocaleDateString() : ""}"`,
                          amt,
                          adminCut,
                          instCut,
                          `"${p.paymentMethod || "UPI"}"`,
                        ];
                      });
                      const csvContent =
                        "data:text/csv;charset=utf-8," +
                        [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                      const link = document.createElement("a");
                      link.setAttribute("href", encodeURI(csvContent));
                      link.setAttribute(
                        "download",
                        `Payout_Report_${reportModalInstructor.name.replace(/\s+/g, "_")}_${Date.now()}.csv`
                      );
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <FiDownload /> Download Statement (CSV)
                  </button>
                </div>
              </div>

              {/* Commission & Payout Metric Cards */}
              <div className="trainer-financial-metrics">
                <div className="t-metric-card total-rev">
                  <span className="t-metric-label">Total Student Payments</span>
                  <strong className="t-metric-val">{formatRupees(reportModalInstructor.totalRevenue)}</strong>
                  <span className="t-metric-sub">
                    Collected directly by Admin across {reportModalInstructor.studentEnrollments} student enrollment{reportModalInstructor.studentEnrollments !== 1 ? "s" : ""}
                  </span>
                </div>

                <div className="t-metric-card admin-cut">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="t-metric-label">Admin Commission</span>
                    <span className="t-metric-badge cut">10% Platform Fee</span>
                  </div>
                  <strong className="t-metric-val" style={{ color: "#059669" }}>
                    + {formatRupees(reportModalInstructor.adminCommission)}
                  </strong>
                  <span className="t-metric-sub">
                    Retained by Admin as platform hosting &amp; administration commission
                  </span>
                </div>

                <div className="t-metric-card instructor-payout">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="t-metric-label">Net Payable to Instructor</span>
                    <span className="t-metric-badge payout">90% Payout</span>
                  </div>
                  <strong className="t-metric-val" style={{ color: "#2563eb" }}>
                    {formatRupees(reportModalInstructor.instructorPayout)}
                  </strong>
                  <span className="t-metric-sub">
                    Calculated as (Total Revenue - 10% Commission) to be disbursed
                  </span>
                </div>
              </div>

              {/* Formula Explainer Note */}
              <div className="commission-formula-banner">
                <FiCheckCircle style={{ color: "#059669", fontSize: 18, flexShrink: 0 }} />
                <div style={{ fontSize: 13, color: "#334155" }}>
                  <strong>Platform Payout Model:</strong> Whenever a student enrolls, 100% of the course fee is received by Admin. 
                  Admin retains a <strong>10% Platform Commission</strong> ({formatRupees(reportModalInstructor.adminCommission)}), and the remaining <strong>90% Net Instructor Payout</strong> ({formatRupees(reportModalInstructor.instructorPayout)}) is disbursed to the instructor.
                </div>
              </div>

              {/* Transaction Detail Breakdown Table */}
              <div style={{ marginTop: 20 }}>
                <h4 style={{ margin: "0 0 12px", fontSize: 15, color: "#0f172a", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>Student Enrollments &amp; Commission Breakdown</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#64748b" }}>
                    {reportModalInstructor.payments.length} Transaction{reportModalInstructor.payments.length !== 1 ? "s" : ""}
                  </span>
                </h4>

                {reportModalInstructor.payments.length === 0 ? (
                  <div style={{ padding: "30px 20px", textAlign: "center", background: "#f8fafc", borderRadius: 10, color: "#64748b" }}>
                    No student enrollments or paid transactions recorded yet for courses taught by {reportModalInstructor.name}.
                  </div>
                ) : (
                  <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: 10 }}>
                    <table className="trainer-statement-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Student Details</th>
                          <th>Course Title</th>
                          <th>Paid Amount</th>
                          <th>Admin Cut (10%)</th>
                          <th>Trainer Payout (90%)</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reportModalInstructor.payments.map((p, idx) => {
                          const amt = Number(p.amount) || 0;
                          const adminCut = Math.round(amt * 0.10);
                          const trainerShare = amt - adminCut;
                          return (
                            <tr key={p._id || idx}>
                              <td style={{ fontSize: 12, color: "#64748b", whiteSpace: "nowrap" }}>
                                {p.enrolledAt ? new Date(p.enrolledAt).toLocaleDateString() : "Recent"}
                              </td>
                              <td>
                                <strong style={{ color: "#0f172a", display: "block" }}>
                                  {p.studentName || "Student"}
                                </strong>
                                <span style={{ fontSize: 12, color: "#64748b" }}>
                                  {p.studentEmail}
                                </span>
                              </td>
                              <td style={{ maxWidth: 220 }}>
                                <span style={{ fontWeight: 500, color: "#1e293b" }}>{p.courseTitle}</span>
                              </td>
                              <td>
                                <strong style={{ color: "#0f172a" }}>{formatRupees(amt)}</strong>
                              </td>
                              <td>
                                <span style={{ color: "#059669", fontWeight: 600 }}>
                                  {formatRupees(adminCut)}
                                </span>
                              </td>
                              <td>
                                <span style={{ color: "#2563eb", fontWeight: 700 }}>
                                  {formatRupees(trainerShare)}
                                </span>
                              </td>
                              <td>
                                <span className="payout-status-badge">
                                  ✓ Collected by Admin
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            <div className="modal-actions" style={{ padding: "16px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setIsReportOpen(false)}
              >
                Close Report
              </button>
              <button
                type="button"
                className="btn-modal-submit"
                style={{ background: "#16a34a", display: "inline-flex", alignItems: "center", gap: 6 }}
                onClick={() => {
                  setDisburseInstructor(reportModalInstructor);
                  setDisburseTxRef(`UTR-${Date.now().toString().slice(-8)}`);
                  setIsReportOpen(false);
                  setIsDisburseOpen(true);
                }}
              >
                <FiDollarSign /> Disburse Payout &amp; Send Mail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DISBURSE INSTRUCTOR PAYOUT MODAL */}
      {isDisburseOpen && disburseInstructor && (
        <div className="modal-overlay" onClick={() => setIsDisburseOpen(false)}>
          <div className="modal-dialog" style={{ maxWidth: 560 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h2>
                  <FiDollarSign style={{ color: "#16a34a" }} /> Disburse Payout to Instructor
                </h2>
                <p style={{ margin: "4px 0 0", fontSize: 13, color: "#64748b" }}>
                  Admin pays 90% net earnings to trainer &amp; delivers automated confirmation email.
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setIsDisburseOpen(false)}>
                <FiX />
              </button>
            </div>

            <form onSubmit={handleDisbursePayment}>
              <div className="modal-body">
                {/* Financial Overview Banner */}
                <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 12, padding: "16px 18px", marginBottom: 18 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: "#64748b" }}>Instructor:</span>
                    <strong style={{ color: "#0f172a" }}>{disburseInstructor.name} ({disburseInstructor.email})</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "#64748b" }}>Total Student Payments:</span>
                    <strong style={{ color: "#0f172a" }}>{formatRupees(disburseInstructor.totalRevenue)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, fontSize: 13 }}>
                    <span style={{ color: "#dc2626" }}>Admin 10% Platform Fee:</span>
                    <strong style={{ color: "#dc2626" }}>- {formatRupees(disburseInstructor.adminCommission)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: "1px dashed #cbd5e1" }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#15803d" }}>Net Amount to Pay (90%):</span>
                    <span style={{ fontSize: 22, fontWeight: 800, color: "#15803d" }}>
                      {formatRupees(disburseInstructor.instructorPayout)}
                    </span>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="payout-method">Payment Mode *</label>
                  <div className="modal-input-wrapper">
                    <FiCreditCard className="field-icon" />
                    <select
                      id="payout-method"
                      value={disburseMethod}
                      onChange={(e) => setDisburseMethod(e.target.value)}
                    >
                      <option value="Bank Transfer (NEFT/RTGS)">Direct Bank Transfer (NEFT / RTGS)</option>
                      <option value="UPI Transfer">UPI Transfer (Google Pay / PhonePe / Paytm)</option>
                      <option value="Razorpay Route">Razorpay Route Disbursement</option>
                      <option value="Cheque / DD">Cheque / Demand Draft</option>
                    </select>
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="payout-ref">Bank UTR / Transaction Reference ID</label>
                  <div className="modal-input-wrapper">
                    <FiCheckCircle className="field-icon" />
                    <input
                      id="payout-ref"
                      type="text"
                      placeholder="e.g. UTR1984729184 or UPI Transaction ID"
                      value={disburseTxRef}
                      onChange={(e) => setDisburseTxRef(e.target.value)}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="payout-notes">Disbursement Notes (Included in Instructor Email)</label>
                  <div className="modal-input-wrapper">
                    <FiEdit3 className="field-icon" />
                    <input
                      id="payout-notes"
                      type="text"
                      placeholder="e.g. Faculty earnings disbursement for active course enrollments"
                      value={disburseNotes}
                      onChange={(e) => setDisburseNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: 8, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: "#065f46" }}>
                  <FiMail style={{ fontSize: 18, flexShrink: 0 }} />
                  <span>An official payout statement voucher will automatically be emailed to <strong>{disburseInstructor.email}</strong> upon confirmation.</span>
                </div>

                <div className="modal-actions" style={{ marginTop: 20 }}>
                  <button
                    type="button"
                    className="btn-modal-cancel"
                    onClick={() => setIsDisburseOpen(false)}
                    disabled={disburseLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-submit"
                    style={{ background: "#16a34a" }}
                    disabled={disburseLoading}
                  >
                    {disburseLoading ? "Processing Payout..." : `Pay ${formatRupees(disburseInstructor.instructorPayout)} & Send Email`}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE INSTRUCTOR MODAL */}
      {isAddOpen && (
        <div className="modal-overlay" onClick={() => setIsAddOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiPlus style={{ color: "#2563eb" }} /> Add New Instructor
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
                  <label htmlFor="inst-name">Full Name *</label>
                  <div className="modal-input-wrapper">
                    <FiUser className="field-icon" />
                    <input
                      id="inst-name"
                      type="text"
                      placeholder="e.g. Dr. Rajesh Kumar"
                      value={addForm.name}
                      onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="inst-email">Email Address *</label>
                  <div className="modal-input-wrapper">
                    <FiMail className="field-icon" />
                    <input
                      id="inst-email"
                      type="email"
                      placeholder="e.g. rajesh.instructor@edusphere.com"
                      value={addForm.email}
                      onChange={(e) => setAddForm({ ...addForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="inst-password">Password *</label>
                  <div className="modal-input-wrapper">
                    <FiLock className="field-icon" />
                    <input
                      id="inst-password"
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
                  <label htmlFor="inst-phone">Phone Number</label>
                  <div className="modal-input-wrapper">
                    <FiPhone className="field-icon" />
                    <input
                      id="inst-phone"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={addForm.phone}
                      onChange={(e) => setAddForm({ ...addForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="inst-dept">Academic Department</label>
                  <div className="modal-input-wrapper">
                    <FiBriefcase className="field-icon" />
                    <input
                      id="inst-dept"
                      type="text"
                      placeholder="e.g. Computer Science, AI, Design"
                      value={addForm.department}
                      onChange={(e) => setAddForm({ ...addForm, department: e.target.value })}
                    />
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
                    {addLoading ? "Creating..." : "Create Instructor"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* UPDATE / EDIT INSTRUCTOR MODAL */}
      {isEditOpen && editInstructor && (
        <div className="modal-overlay" onClick={() => setIsEditOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiEdit3 style={{ color: "#4f46e5" }} /> Edit Instructor Profile
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
                  <label htmlFor="edit-inst-name">Full Name *</label>
                  <div className="modal-input-wrapper">
                    <FiUser className="field-icon" />
                    <input
                      id="edit-inst-name"
                      type="text"
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-inst-email">Email Address *</label>
                  <div className="modal-input-wrapper">
                    <FiMail className="field-icon" />
                    <input
                      id="edit-inst-email"
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-inst-phone">Phone Number</label>
                  <div className="modal-input-wrapper">
                    <FiPhone className="field-icon" />
                    <input
                      id="edit-inst-phone"
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-inst-dept">Academic Department</label>
                  <div className="modal-input-wrapper">
                    <FiBriefcase className="field-icon" />
                    <input
                      id="edit-inst-dept"
                      type="text"
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-inst-pwd">Reset Password (Optional)</label>
                  <div className="modal-input-wrapper">
                    <FiLock className="field-icon" />
                    <input
                      id="edit-inst-pwd"
                      type="password"
                      placeholder="Leave blank to keep unchanged"
                      value={editForm.newPassword}
                      onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                      minLength={6}
                    />
                  </div>
                </div>

                <div className="modal-form-group">
                  <label htmlFor="edit-inst-status">Faculty Status</label>
                  <div className="modal-input-wrapper">
                    <select
                      id="edit-inst-status"
                      value={editForm.isActive ? "true" : "false"}
                      onChange={(e) =>
                        setEditForm({ ...editForm, isActive: e.target.value === "true" })
                      }
                    >
                      <option value="true">Active Faculty</option>
                      <option value="false">On Leave / Inactive</option>
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

export default ManageInstructors;