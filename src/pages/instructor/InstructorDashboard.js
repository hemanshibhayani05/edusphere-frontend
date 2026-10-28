import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import {
  FiUsers,
  FiBookOpen,
  FiAward,
  FiDollarSign,
  FiPlus,
  FiTrendingUp,
  FiExternalLink,
  FiCheckCircle,
  FiX,
  FiRefreshCw,
  FiPackage,
  FiEdit3,
  FiTrash2,
  FiAlertCircle,
  FiShield,
  FiClock,
  FiLayers,
  FiList,
  FiCheckSquare,
  FiVideo,
  FiCreditCard,
} from "react-icons/fi";
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Area,
  AreaChart,
} from "recharts";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import CurriculumBuilder, { createEmptyModule } from "./CurriculumBuilder";
import "./InstructorDashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// Build 6-month enrollment trend from courses
function buildTrend(courses) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  const total = courses.reduce((a, c) => a + (c.students || 0), 0);
  const base = total / 6 || 0;
  return months.map((m, i) => ({
    month: m,
    students: Math.round(base * (0.5 + i * 0.12)),
    earnings: Math.round(
      courses.reduce((a, c) => a + (c.price || 0) * (c.students || 0), 0) *
      ((0.5 + i * 0.12) / 6)
    ),
  }));
}

const EMPTY_COURSE = {
  title: "",
  category: "Web Development",
  price: "",
  duration: "3 Months",
  description: "",
  videoUrl: "",
  syllabus: "",
  requirements: "",
  modules: [createEmptyModule(1)],
  quiz: [],
};

function InstructorDashboard() {
  const { user } = useAuth();
  const instructorId = user?._id || user?.id || "";
  const instructorName = user?.name || "Instructor";
  const userRole = (user?.role || "").toLowerCase();
  const isInstructor = userRole === "instructor";

  // ── state ──
  const [courseList, setCourseList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCourse, setEditCourse] = useState(null);
  const [newCourse, setNewCourse] = useState(EMPTY_COURSE);
  const [now, setNow] = useState(new Date());
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [pulse, setPulse] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [apiError, setApiError] = useState("");
  const [payoutStats, setPayoutStats] = useState({ totalReceived: 0, count: 0 });

  // ── load payouts received from admin ──
  const loadPayouts = useCallback(async () => {
    try {
      const query = new URLSearchParams();
      if (user?.email) query.append("instructorEmail", user.email);
      if (instructorId) query.append("instructorId", instructorId);

      const res = await fetch(`${API_BASE_URL}/api/payments/payouts?${query.toString()}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.payouts)) {
        const totalReceived = data.payouts.reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0);
        setPayoutStats({ totalReceived, count: data.payouts.length });
      }
    } catch (_) {}
  }, [user?.email, instructorId]);

  useEffect(() => {
    loadPayouts();
  }, [loadPayouts]);

  // ── load courses ──
  const loadCourses = useCallback(async () => {
    setLoading(true);
    setApiError("");
    try {
      let url = `${API_BASE_URL}/api/courses`;
      if (instructorId) {
        url += `?instructorId=${encodeURIComponent(instructorId)}`;
      } else if (instructorName && instructorName !== "Instructor") {
        url += `?instructor=${encodeURIComponent(instructorName)}`;
      }

      const res = await fetch(url);
      const data = await res.json();

      if (data.success && Array.isArray(data.courses)) {
        if (data.courses.length > 0) {
          setCourseList(data.courses);
        } else if (instructorName && instructorName !== "Instructor") {
          // Fallback check by instructor name
          const res2 = await fetch(
            `${API_BASE_URL}/api/courses?instructor=${encodeURIComponent(instructorName)}`
          );
          const data2 = await res2.json();
          if (data2.success && Array.isArray(data2.courses)) {
            setCourseList(data2.courses);
          } else {
            setCourseList([]);
          }
        } else {
          setCourseList([]);
        }
      } else {
        setCourseList([]);
      }
    } catch (err) {
      console.error("Error loading courses:", err);
      setApiError("Failed to connect to backend server. Make sure server is running on port 5001.");
      setCourseList([]);
    } finally {
      setLoading(false);
      setLastUpdated(new Date());
      setPulse(true);
      setTimeout(() => setPulse(false), 600);
    }
  }, [instructorId, instructorName]);

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  // ── real-time clock ──
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ── auto-refresh every 30 s ──
  useEffect(() => {
    const timer = setInterval(loadCourses, 30000);
    return () => clearInterval(timer);
  }, [loadCourses]);

  // ── derived stats ──
  const totalStudents = courseList.reduce((a, c) => a + (c.students || 0), 0);
  const totalRevenue = courseList.reduce(
    (a, c) => a + (c.price || 0) * (c.students || 0),
    0
  );
  const avgRating =
    courseList.length > 0
      ? (
        courseList.reduce((a, c) => a + (c.rating || 5), 0) / courseList.length
      ).toFixed(1)
      : null;

  const trend = buildTrend(courseList);

  // ── open add modal ──
  const openAddModal = () => {
    if (!isInstructor) {
      alert("Access Restricted: Only instructors can create courses.");
      return;
    }
    setEditCourse(null);
    setNewCourse({
      ...EMPTY_COURSE,
      modules: [createEmptyModule(1)],
    });
    setShowModal(true);
  };

  // ── open edit modal ──
  const openEditModal = (course) => {
    if (!isInstructor) {
      alert("Access Restricted: Only instructors can edit courses.");
      return;
    }
    setEditCourse(course);

    let initialModules = [];
    if (Array.isArray(course.modules) && course.modules.length > 0) {
      initialModules = course.modules.map((m, idx) => {
        if (typeof m === "string") {
          return {
            title: m,
            description: "",
            videoUrl: "",
            duration: "20 min",
            quiz: [],
          };
        }
        return {
          title: m.title || `Module ${idx + 1}`,
          description: m.description || "",
          videoUrl: m.videoUrl || "",
          duration: m.duration || "20 min",
          quiz: Array.isArray(m.quiz) ? m.quiz : [],
        };
      });
    } else if (course.syllabus && course.syllabus.trim()) {
      initialModules = course.syllabus
        .split("\n")
        .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
        .filter(Boolean)
        .map((title, idx) => ({
          title,
          description: "",
          videoUrl: "",
          duration: "20 min",
          quiz: [],
        }));
    } else {
      initialModules = [createEmptyModule(1)];
    }

    setNewCourse({
      title: course.title || "",
      category: course.category || "Web Development",
      price: course.price !== undefined ? course.price : "",
      duration: course.duration || "3 Months",
      description: course.description || "",
      videoUrl: course.videoUrl || "",
      syllabus: course.syllabus || initialModules.map((m) => m.title).join("\n"),
      requirements: course.requirements || "",
      modules: initialModules,
      quiz: Array.isArray(course.quiz) ? course.quiz : [],
    });
    setShowModal(true);
  };

  // ── submit course (CREATE / UPDATE) ──
  const handleSubmitCourse = async (e) => {
    e.preventDefault();
    if (!newCourse.title.trim()) return;

    if (!isInstructor) {
      alert("Access Denied: Only instructors can perform CRUD operations on courses.");
      return;
    }

    try {
      setSaving(true);

      const moduleTitles = (newCourse.modules || []).map((m) =>
        typeof m === "string" ? m : m.title
      );
      const generatedSyllabus = moduleTitles.filter(Boolean).join("\n");

      const payload = {
        title: newCourse.title.trim(),
        category: newCourse.category,
        price: Number(newCourse.price) || 0,
        duration: newCourse.duration.trim() || "3 Months",
        description: newCourse.description.trim(),
        videoUrl: (newCourse.videoUrl || "").trim(),
        syllabus: generatedSyllabus || newCourse.syllabus.trim(),
        requirements: newCourse.requirements.trim(),
        modules: newCourse.modules,
        quiz: newCourse.quiz || [],
      };

      if (editCourse) {
        // UPDATE COURSE
        const targetId = editCourse._id || editCourse.id;
        const token = localStorage.getItem("edusphere_token");
        const res = await fetch(`${API_BASE_URL}/api/courses/${targetId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-user-role": "instructor",
            "x-user-id": instructorId,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to update course.");
        }
      } else {
        // CREATE NEW COURSE
        const token = localStorage.getItem("edusphere_token");
        const res = await fetch(`${API_BASE_URL}/api/courses`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            "x-user-role": "instructor",
            "x-user-id": instructorId,
          },
          body: JSON.stringify({
            ...payload,
            instructor: instructorName,
            instructorId: instructorId,
          }),
        });

        const data = await res.json();
        if (!data.success) {
          throw new Error(data.message || "Failed to create course.");
        }
        if (data.requiresApproval) {
          alert(
            "🛡️ Security Notice: Your course has been submitted for Admin Verification. To protect learners from cybercrime and unverified content, an Administrator will inspect and approve your course before it goes live on the website."
          );
        }
      }

      setShowModal(false);
      await loadCourses();
    } catch (err) {
      alert(err.message || "Operation failed.");
    } finally {
      setSaving(false);
    }
  };

  // ── delete course ──
  const handleDelete = async (courseId) => {
    if (!isInstructor) {
      alert("Access Denied: Only instructors can delete courses.");
      return;
    }

    try {
      const token = localStorage.getItem("edusphere_token");
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: "DELETE",
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          "x-user-role": "instructor",
          "x-user-id": instructorId,
        },
      });

      const data = await res.json();
      if (!data.success) {
        throw new Error(data.message || "Failed to delete course.");
      }

      setDeleteConfirm(null);
      await loadCourses();
    } catch (err) {
      alert(err.message || "Could not delete course.");
    }
  };

  const hasCourses = courseList.length > 0;

  const timeStr = now.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const dateStr = now.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="instructor-dashboard-page">
      <Sidebar instructor />

      <main className="instructor-main">
        {/* Role Enforcement Warning if non-instructor visits */}
        {!isInstructor && (
          <div
            style={{
              background: "#fffbeb",
              border: "1px solid #fde68a",
              color: "#92400e",
              padding: "14px 20px",
              borderRadius: 12,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 12,
              fontWeight: 500,
            }}
          >
            <FiShield style={{ fontSize: 22, color: "#d97706", flexShrink: 0 }} />
            <div>
              <strong>Role Restriction:</strong> You are currently signed in as{" "}
              <strong>{user?.name || "User"}</strong> with role{" "}
              <span
                style={{
                  background: "#fef3c7",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontWeight: 700,
                  textTransform: "capitalize",
                }}
              >
                {userRole || "Guest"}
              </span>
              . Only users with the <strong>instructor</strong> role are authorized to manage courses.
            </div>
          </div>
        )}

        {apiError && (
          <div
            style={{
              background: "#fef2f2",
              border: "1px solid #fecaca",
              color: "#991b1b",
              padding: "12px 18px",
              borderRadius: 10,
              marginBottom: 20,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <FiAlertCircle />
            <span>{apiError}</span>
          </div>
        )}

        {/* ── Hero Banner ── */}
        <div className="instructor-hero-banner">
          <div className="instructor-hero-text">
            <span className="instructor-badge-tag">
              Faculty &bull; {user?.department || "Computer Science Department"}
            </span>
            <h1>Welcome back, {instructorName} 👋</h1>
            <p>
              {hasCourses ? (
                <>
                  Your curricula reached over{" "}
                  <strong>{totalStudents.toLocaleString()}</strong> students this term.
                  Review cohorts, manage lessons, and inspect your published courses.
                </>
              ) : (
                "You haven't put any courses yet. Start creating your first course!"
              )}
            </p>
            {/* live data  */}
            <div className="live-indicator">
              <span className={`live-dot ${pulse ? "pulse" : ""}`} />
              <span className="live-label">Live &bull; {timeStr}</span>
              <span className="live-date">{dateStr}</span>
            </div>
          </div>

          <div className="instructor-hero-actions">
            {isInstructor && (
              <button className="inst-btn primary" onClick={openAddModal}>
                <FiPlus /> Create New Course
              </button>
            )}
            <Link to="/courses" className="inst-btn secondary">
              <FiExternalLink /> Public Catalog
            </Link>
            <button
              className="inst-btn refresh-btn"
              onClick={loadCourses}
              title="Refresh courses"
            >
              <FiRefreshCw className={pulse || loading ? "spinning" : ""} />
            </button>
          </div>
        </div>

        {/* ── Stats Grid ── */}
        <div className="instructor-stats-grid">
          <div className="instructor-stat-card">
            <div className="stat-icon-wrap students">
              <FiUsers />
            </div>
            <div className="stat-info">
              <span>Total Active Learners</span>
              <h3>{hasCourses ? totalStudents.toLocaleString() : "0"}</h3>
              <div className="stat-trend">
                {hasCourses ? (
                  <>
                    <FiTrendingUp /> Enrolled in your courses
                  </>
                ) : (
                  "No enrolments yet"
                )}
              </div>
            </div>
          </div>

          <div className="instructor-stat-card">
            <div className="stat-icon-wrap courses">
              <FiBookOpen />
            </div>
            <div className="stat-info">
              <span>Published Courses</span>
              <h3>{courseList.length}</h3>
              <div className="stat-trend" style={{ color: "#2563eb" }}>
                {hasCourses ? "Active & Published" : "No courses yet"}
              </div>
            </div>
          </div>



          <Link to="/instructor/payments" className="instructor-stat-card" style={{ textDecoration: "none", cursor: "pointer", border: "1px solid #bfdbfe", background: "#f8fafc" }}>
            <div className="stat-icon-wrap" style={{ background: "#dbeafe", color: "#1d4ed8" }}>
              <FiCreditCard />
            </div>
            <div className="stat-info">
              <span style={{ color: "#1e40af", fontWeight: 600 }}>Received From Admin (90%)</span>
              <h3 style={{ color: "#16a34a" }}>₹{payoutStats.totalReceived.toLocaleString()}</h3>
              <div className="stat-trend" style={{ color: "#2563eb", fontWeight: 600 }}>
                {payoutStats.count > 0 ? `${payoutStats.count} Payouts Settled →` : "View Payments Hub →"}
              </div>
            </div>
          </Link>
        </div>

        {/* ── Dynamic Chart ── */}
        {hasCourses && (
          <div className="instructor-charts-row full-width">
            <div className="inst-chart-card main-chart">
              <div className="chart-header">
                <div>
                  <h2>Enrollment &amp; Reach Dynamics</h2>
                  <p>Estimated monthly learner adoption</p>
                </div>
                <span className="chart-period-badge">Real-Time Data</span>
              </div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trend}>
                    <defs>
                      <linearGradient id="grad1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#059669" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="students"
                      stroke="#059669"
                      strokeWidth={2.5}
                      fill="url(#grad1)"
                      name="Enrolled Students"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ── Courses Table or Empty State ── */}
        <div className="instructor-courses-card">
          <div className="section-top-row">
            <h2>Your Curricula &amp; Published Courses</h2>
            {isInstructor && (
              <button
                className="inst-btn primary"
                style={{ padding: "8px 16px", fontSize: 13 }}
                onClick={openAddModal}
              >
                <FiPlus /> Add Course
              </button>
            )}
          </div>

          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#64748b" }}>
              <FiRefreshCw className="spinning" style={{ fontSize: 24, marginBottom: 8 }} />
              <p>Fetching real-time courses...</p>
            </div>
          ) : hasCourses ? (
            <div className="inst-table-wrap">
              <table className="inst-table">
                <thead>
                  <tr>
                    <th>Course Details</th>
                    <th>Category</th>
                    <th>Duration</th>
                    <th>Enrollments</th>
                    <th>Rating</th>
                    <th>Price</th>
                    <th>Status</th>
                    {isInstructor && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {courseList.map((course) => {
                    const cId = course._id || course.id;
                    return (
                      <tr key={cId}>
                        <td>
                          <div className="course-cell">
                            <img
                              src={course.image}
                              alt={course.title}
                              onError={(e) => {
                                e.target.src =
                                  "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
                              }}
                            />
                            <div>
                              <strong>{course.title}</strong>
                              <small>ID: #{String(cId).slice(-6)}</small>
                            </div>
                          </div>
                        </td>
                        <td>{course.category}</td>
                        <td>{course.duration}</td>
                        <td>
                          <span className="enroll-count">
                            {(course.students || 0).toLocaleString()} students
                          </span>
                        </td>
                        <td>
                          <span style={{ color: "#ca8a04", fontWeight: 700 }}>
                            ★ {course.rating || "5.0"}
                          </span>
                        </td>
                        <td>
                          <strong>₹{course.price}</strong>
                        </td>
                        <td>
                          {course.status === "pending" || !course.isApproved ? (
                            <span
                              className="badge-status"
                              style={{
                                background: "#fef3c7",
                                color: "#b45309",
                                border: "1px solid #fde68a",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                display: "inline-block",
                              }}
                              title="Awaiting Admin Security Approval before appearing on website"
                            >
                              ⏳ Pending Review
                            </span>
                          ) : course.status === "rejected" ? (
                            <span
                              className="badge-status"
                              style={{
                                background: "#fee2e2",
                                color: "#dc2626",
                                border: "1px solid #fca5a5",
                                padding: "4px 8px",
                                borderRadius: "4px",
                                fontSize: "12px",
                                fontWeight: "600",
                                display: "inline-block",
                              }}
                              title={
                                course.rejectionReason
                                  ? `Reason: ${course.rejectionReason}`
                                  : "Course rejected by Admin"
                              }
                            >
                              ❌ Rejected
                            </span>
                          ) : (
                            <span className="badge-status active">
                              ✅ Live on Website
                            </span>
                          )}
                        </td>
                        {isInstructor && (
                          <td>
                            <div className="action-btns">
                              <Link
                                to={`/courses/${cId}`}
                                className="table-action-btn"
                              >
                                Preview
                              </Link>
                              <button
                                className="table-action-btn edit"
                                onClick={() => openEditModal(course)}
                                title="Edit course"
                              >
                                <FiEdit3 />
                              </button>
                              <button
                                className="table-action-btn delete"
                                onClick={() => setDeleteConfirm(cId)}
                                title="Delete course"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* ── BEAUTIFUL EMPTY STATE (When no course is putted) ── */
            <div className="empty-courses-state">
              <div className="empty-icon-wrap">
                <FiPackage />
              </div>
              <h3>No courses putted yet</h3>
              <p>
                This instructor has not published any courses to the database yet.
                Create your first curriculum to make it available to learners worldwide!
              </p>
              <div className="empty-actions">
                {isInstructor ? (
                  <button
                    className="inst-btn primary empty-cta"
                    onClick={openAddModal}
                  >
                    <FiPlus /> Create Your First Course
                  </button>
                ) : (
                  <p style={{ color: "#64748b", fontStyle: "italic" }}>
                    Sign in with an instructor account to publish courses.
                  </p>
                )}
                <Link to="/courses" className="inst-btn secondary empty-cta">
                  <FiExternalLink /> Browse Public Catalog
                </Link>
              </div>

              <div className="empty-steps">
                <div className="empty-step">
                  <span className="step-num">1</span>
                  <p>Click "Create New Course" button</p>
                </div>
                <div className="empty-step-arrow">→</div>
                <div className="empty-step">
                  <span className="step-num">2</span>
                  <p>Fill in title, category, &amp; price</p>
                </div>
                <div className="empty-step-arrow">→</div>
                <div className="empty-step">
                  <span className="step-num">3</span>
                  <p>Published instantly to the platform!</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Add / Edit Course Modal ── */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal-content course-form-modal-large"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div className="modal-header-text">
                <span className="modal-badge-chip">
                  <FiBookOpen /> Curriculum Studio
                </span>
                <h3>{editCourse ? "Edit Course Curriculum" : "Create New Course"}</h3>
                <p className="modal-header-subtitle">
                  Fill in all course details, pricing, duration, syllabus modules, and requirements.
                </p>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowModal(false)}
                title="Close modal"
              >
                <FiX />
              </button>
            </div>

            <form className="modal-form course-large-form" onSubmit={handleSubmitCourse}>
              <div className="course-form-scrollable">
                {/* ── Section 1: Basic Information ── */}
                <div className="form-section-card">
                  <div className="form-section-title">
                    <span className="section-index">1</span>
                    <div>
                      <h4>Course Information &amp; Classification</h4>
                      <small>Core identification, domain category, duration, and pricing</small>
                    </div>
                  </div>

                  {/* 1. Course Title */}
                  <div className="form-group full-width">
                    <label htmlFor="course-title">
                      Course Title <span className="req-star">*</span>
                    </label>
                    <div className="input-with-icon">
                      <FiBookOpen className="input-icon" />
                      <input
                        id="course-title"
                        type="text"
                        required
                        placeholder="e.g. Modern Full-Stack Web Development Bootcamp"
                        value={newCourse.title}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, title: e.target.value })
                        }
                      />
                    </div>
                  </div>

                  {/* Row: Category (5), Duration (4), Price (3) */}
                  <div className="form-grid-three">
                    {/* 5. Category */}
                    <div className="form-group">
                      <label htmlFor="course-category">
                        Category <span className="req-star">*</span>
                      </label>
                      <div className="input-with-icon">
                        <FiLayers className="input-icon" />
                        <select
                          id="course-category"
                          value={newCourse.category}
                          onChange={(e) =>
                            setNewCourse({ ...newCourse, category: e.target.value })
                          }
                        >
                          <option value="Web Development">Web Development</option>
                          <option value="Full-Stack Development">Full-Stack Development</option>
                          <option value="Frontend Development">Frontend Development</option>
                          <option value="Backend Development">Backend Development</option>
                          <option value="Programming">Programming</option>
                          <option value="Data Science">Data Science</option>
                          <option value="Machine Learning">Machine Learning</option>
                          <option value="Artificial Intelligence">Artificial Intelligence</option>
                          <option value="Cloud Computing">Cloud Computing</option>
                          <option value="Cyber Security">Cyber Security</option>
                          <option value="Database">Database Systems</option>
                          <option value="Mobile Development">Mobile App Development</option>
                          <option value="UI/UX Design">UI/UX Design</option>
                        </select>
                      </div>
                    </div>

                    {/* 4. Duration */}
                    <div className="form-group">
                      <label htmlFor="course-duration">
                        Duration <span className="req-star">*</span>
                      </label>
                      <div className="input-with-icon">
                        <FiClock className="input-icon" />
                        <input
                          id="course-duration"
                          type="text"
                          required
                          placeholder="e.g. 3 Months"
                          value={newCourse.duration}
                          onChange={(e) =>
                            setNewCourse({ ...newCourse, duration: e.target.value })
                          }
                        />
                      </div>
                    </div>

                    {/* 3. Price */}
                    <div className="form-group">
                      <label htmlFor="course-price">
                        Price (₹) <span className="req-star">*</span>
                      </label>
                      <div className="input-with-icon">
                        <span className="currency-symbol">₹</span>
                        <input
                          id="course-price"
                          type="number"
                          min="0"
                          placeholder="e.g. 2499"
                          value={newCourse.price}
                          onChange={(e) =>
                            setNewCourse({ ...newCourse, price: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── Section 2: Course Description ── */}
                <div className="form-section-card">
                  <div className="form-section-title">
                    <span className="section-index">2</span>
                    <div>
                      <h4>Course Description</h4>
                      <small>Summary of curriculum goals, learning outcomes, and course structure</small>
                    </div>
                  </div>

                  {/* 2. Course Description */}
                  <div className="form-group full-width">
                    <label htmlFor="course-description">
                      Course Description <span className="req-star">*</span>
                    </label>
                    <textarea
                      id="course-description"
                      rows={4}
                      required
                      placeholder="Write a comprehensive description of what students will learn, project outcomes, and the skills they will build in this curriculum..."
                      value={newCourse.description}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, description: e.target.value })
                      }
                    />
                  </div>

                  {/* Course Intro Video Link */}
                  <div className="form-group full-width" style={{ marginTop: 14 }}>
                    <label htmlFor="course-video-url">
                      <FiVideo style={{ color: "#2563eb", marginRight: 6 }} /> Course Introduction / Preview Video Link
                    </label>
                    <div className="input-with-icon">
                      <FiVideo className="input-icon" />
                      <input
                        id="course-video-url"
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=... or direct MP4 link"
                        value={newCourse.videoUrl}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, videoUrl: e.target.value })
                        }
                      />
                    </div>
                    <small style={{ color: "#64748b", marginTop: 4, display: "block", fontSize: 12 }}>
                      Optional course promo/overview video. Video links for specific curriculum lessons can be added in Section 3 below.
                    </small>
                  </div>
                </div>

                {/* ── Section 3: Curriculum Syllabus, Video Links & Dynamic Quizzes ── */}
                <div className="form-section-card">
                  <div className="form-section-title">
                    <span className="section-index">3</span>
                    <div>
                      <h4>Curriculum Modules, Video Links &amp; Dynamic Quizzes</h4>
                      <small>Add structured modules, attach video links (YouTube or MP4), and build custom quizzes</small>
                    </div>
                  </div>

                  <CurriculumBuilder
                    modules={newCourse.modules}
                    onChange={(updatedModules) =>
                      setNewCourse({ ...newCourse, modules: updatedModules })
                    }
                  />

                  {/* 7. Requirements */}
                  <div className="form-group" style={{ marginTop: 20 }}>
                    <div className="label-with-hint">
                      <label htmlFor="course-requirements">
                        <FiCheckSquare style={{ color: "#2563eb" }} /> Requirements (Prerequisites)
                      </label>
                      <span className="field-hint">One prerequisite per line</span>
                    </div>
                    <textarea
                      id="course-requirements"
                      rows={4}
                      placeholder={`• Basic computer fundamentals & internet access\n• Familiarity with basic HTML and CSS syntax\n• Laptop or PC with Windows, macOS, or Linux\n• Enthusiasm to learn hands-on practical coding`}
                      value={newCourse.requirements}
                      onChange={(e) =>
                        setNewCourse({ ...newCourse, requirements: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>

              {/* ── Modal Footer ── */}
              <div className="modal-actions-bar">
                <div className="modal-info-note">
                  <FiShield className="note-icon" />
                  <span>The course will be published live in the platform catalog.</span>
                </div>
                <div className="modal-action-buttons">
                  <button
                    type="button"
                    className="inst-btn secondary modal-cancel-btn"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="inst-btn primary modal-submit-btn"
                    disabled={saving}
                  >
                    <FiCheckCircle />
                    {saving
                      ? "Saving..."
                      : editCourse
                      ? "Save Changes"
                      : "Publish Course"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteConfirm(null)}
        >
          <div
            className="modal-content delete-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="delete-icon">
              <FiAlertCircle />
            </div>
            <h3>Delete Course?</h3>
            <p>
              This action cannot be undone. The course will be permanently
              removed and cannot be restored.
            </p>
            <div className="modal-actions" style={{ justifyContent: "center" }}>
              <button
                className="inst-btn secondary"
                style={{ color: "#374151", borderColor: "#d1d5db" }}
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="inst-btn primary"
                style={{ background: "#dc2626", color: "#fff" }}
                onClick={() => handleDelete(deleteConfirm)}
              >
                <FiTrash2 /> Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default InstructorDashboard;
