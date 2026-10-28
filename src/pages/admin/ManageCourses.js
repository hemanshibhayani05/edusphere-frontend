import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  FiBookOpen,
  FiShield,
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiAlertTriangle,
  FiTrash2,
  FiEye,
  FiRefreshCw,
  FiPlus,
  FiX,
  FiUser,
  FiDollarSign,
  FiVideo,
  FiExternalLink,
  FiCopy,
  FiCheck,
  FiPlay,
  FiHelpCircle,
  FiCalendar,
  FiLayers,
  FiChevronDown,
  FiChevronUp,
  FiInfo,
} from "react-icons/fi";
import "./ManageCourses.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function ManageCourses() {
  const { user: currentUser } = useAuth();

  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [notification, setNotification] = useState(null);

  // Preview Course Modal State
  const [previewCourse, setPreviewCourse] = useState(null);
  const [modalTab, setModalTab] = useState("curriculum"); // "curriculum" | "overview" | "security"
  const [activeVideoPlayer, setActiveVideoPlayer] = useState(null); // "intro" or "mod_${idx}"
  const [expandedQuizzes, setExpandedQuizzes] = useState({});
  const [copiedId, setCopiedId] = useState(null);

  // Reject Modal
  const [rejectingCourse, setRejectingCourse] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/courses?all=true&admin=true`);
      const data = await res.json();
      if (data.success && Array.isArray(data.courses)) {
        setCourses(data.courses);
        // If there are pending courses, switch to pending tab by default
        const hasPending = data.courses.some((c) => (c.status || "pending") === "pending" && !c.isApproved);
        if (hasPending && activeTab === "all") {
          setActiveTab("pending");
        }
      }
    } catch (err) {
      console.error("Failed to fetch courses:", err);
      showNotification("Could not connect to backend server.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const showNotification = (message, type = "success") => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  // ── Video & Link Helpers ──────────────────────────────────────────────────
  const extractYouTubeId = (url) => {
    if (!url || typeof url !== "string") return null;
    const str = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i
    );
    return match ? match[1] : null;
  };

  const isDirectVideo = (url) => {
    if (!url || typeof url !== "string") return false;
    return /\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(url.trim());
  };

  const handleCopyLink = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleOpenPreview = (course) => {
    setPreviewCourse(course);
    setModalTab("curriculum");
    if (course.videoUrl) {
      setActiveVideoPlayer("intro");
    } else if (Array.isArray(course.modules)) {
      const idx = course.modules.findIndex((m) => typeof m === "object" && m && m.videoUrl);
      setActiveVideoPlayer(idx >= 0 ? `mod_${idx}` : null);
    } else {
      setActiveVideoPlayer(null);
    }
    setExpandedQuizzes({});
    setCopiedId(null);
  };

  const toggleQuizAccordion = (index) => {
    setExpandedQuizzes((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return "N/A";
      return d.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "N/A";
    }
  };

  const getQuestionOptions = (options) => {
    if (Array.isArray(options)) return options;
    if (typeof options === "string") {
      const split = options.split("\n").map((s) => s.trim()).filter(Boolean);
      return split.length > 0 ? split : [options];
    }
    return [];
  };

  const renderVideoPlayer = (videoUrl, title = "Course Video Preview") => {
    if (!videoUrl) return null;
    const ytId = extractYouTubeId(videoUrl);
    if (ytId) {
      return (
        <div className="admin-video-embed-wrapper">
          <iframe
            src={`https://www.youtube.com/embed/${ytId}?rel=0`}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    if (isDirectVideo(videoUrl)) {
      return (
        <div className="admin-video-embed-wrapper direct-video">
          <video controls src={videoUrl} preload="metadata">
            Your browser does not support HTML5 video.
          </video>
        </div>
      );
    }
    return (
      <div className="admin-external-video-banner">
        <FiExternalLink style={{ fontSize: 20, color: "#2563eb", flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <strong style={{ fontSize: 13, color: "#1e293b", display: "block" }}>External Video Resource</strong>
          <span style={{ fontSize: 12, color: "#64748b", wordBreak: "break-all" }}>{videoUrl}</span>
        </div>
        <a
          href={videoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-open-ext-link"
        >
          <FiExternalLink /> Open Video
        </a>
      </div>
    );
  };

  // Approve course
  const handleApprove = async (courseId, courseTitle) => {
    if (
      !window.confirm(
        `Approve course "${courseTitle}"? It will become immediately LIVE to all students on the website.`
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}/approve`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({ adminEmail: currentUser?.email || "Admin" }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c._id === courseId
              ? { ...c, status: "approved", isApproved: true, isPublished: true }
              : c
          )
        );
        showNotification(`✅ Approved! "${courseTitle}" is now live on the public website.`);
      } else {
        showNotification(data.message || "Failed to approve course.", "error");
      }
    } catch (err) {
      console.error("Approval error:", err);
      showNotification("Network error approving course.", "error");
    }
  };

  // Reject course submit
  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!rejectingCourse) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${rejectingCourse._id}/reject`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "x-user-role": "admin",
        },
        body: JSON.stringify({ reason: rejectReason }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCourses((prev) =>
          prev.map((c) =>
            c._id === rejectingCourse._id
              ? { ...c, status: "rejected", isApproved: false, isPublished: false, rejectionReason: rejectReason }
              : c
          )
        );
        showNotification(`Course "${rejectingCourse.title}" was rejected and hidden from website.`);
        setRejectingCourse(null);
        setRejectReason("");
      } else {
        showNotification(data.message || "Failed to reject course.", "error");
      }
    } catch (err) {
      console.error("Rejection error:", err);
      showNotification("Network error rejecting course.", "error");
    }
  };

  // Delete course
  const handleDelete = async (courseId, courseTitle) => {
    if (!window.confirm(`Permanently delete "${courseTitle}" from database?`)) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/courses/${courseId}`, {
        method: "DELETE",
        headers: { "x-user-role": "admin" },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setCourses((prev) => prev.filter((c) => c._id !== courseId));
        showNotification(`Course "${courseTitle}" deleted successfully.`);
      } else {
        showNotification(data.message || "Failed to delete course.", "error");
      }
    } catch (err) {
      console.error("Delete error:", err);
      showNotification("Network error deleting course.", "error");
    }
  };

  // Filtered courses
  const filteredCourses = useMemo(() => {
    return courses.filter((c) => {
      const courseStatus = c.status || (c.isApproved ? "approved" : "pending");
      const matchesTab =
        activeTab === "all" ||
        (activeTab === "pending" && (courseStatus === "pending" || !c.isApproved)) ||
        (activeTab === "approved" && (courseStatus === "approved" || c.isApproved)) ||
        (activeTab === "rejected" && courseStatus === "rejected");

      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (c.title && c.title.toLowerCase().includes(q)) ||
        (c.instructor && c.instructor.toLowerCase().includes(q)) ||
        (c.category && c.category.toLowerCase().includes(q));

      return matchesTab && matchesSearch;
    });
  }, [courses, activeTab, search]);

  const stats = useMemo(() => {
    const total = courses.length;
    const pending = courses.filter((c) => (c.status || "pending") === "pending" && !c.isApproved).length;
    const approved = courses.filter((c) => c.status === "approved" || c.isApproved).length;
    const rejected = courses.filter((c) => c.status === "rejected").length;
    return { total, pending, approved, rejected };
  }, [courses]);

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        {/* Header */}
        <div className="users-page-header">
          <div className="users-header-info">
            <h1>
              <FiShield style={{ color: "#4f46e5" }} /> Course Moderation &amp; Approvals
            </h1>
            <p>
              Review instructor-submitted courses to prevent malicious content, spam, and cyber threats before courses go live.
            </p>
          </div>

          <div className="users-header-actions">
            <button className="btn-refresh-users" onClick={fetchCourses} title="Refresh courses">
              <FiRefreshCw /> Refresh
            </button>
            <Link to="/admin/courses/add" className="btn-create-admin">
              <FiPlus /> Add Course Directly
            </Link>
          </div>
        </div>

        {/* Security Alert Banner */}
        <div className="courses-security-banner">
          <div className="security-badge-icon">
            <FiShield />
          </div>
          <div className="security-banner-text">
            <h3>Cyber Crime Prevention &amp; Content Verification Active</h3>
            <p>
              When instructors upload courses from their dashboards, courses are quarantined in <strong>"Pending Approval"</strong> state. They are strictly hidden from students until an administrator inspects and approves them.
            </p>
          </div>
        </div>

        {/* Notification Toast */}
        {notification && (
          <div className={`users-alert-banner ${notification.type}`}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {notification.type === "success" ? <FiCheckCircle /> : <FiAlertTriangle />}
              <span>{notification.message}</span>
            </div>
            <button onClick={() => setNotification(null)}>&times;</button>
          </div>
        )}

        {/* Filter Tabs & Search */}
        <div className="users-toolbar">
          <div className="courses-tabs-row" style={{ margin: 0 }}>
            <button
              className={`course-tab-btn ${activeTab === "pending" ? "active" : ""}`}
              onClick={() => setActiveTab("pending")}
            >
              <FiClock /> Pending Approval{" "}
              {stats.pending > 0 && <span className="tab-badge pending">{stats.pending}</span>}
            </button>
            <button
              className={`course-tab-btn ${activeTab === "approved" ? "active" : ""}`}
              onClick={() => setActiveTab("approved")}
            >
              <FiCheckCircle /> Approved &amp; Live ({stats.approved})
            </button>
            <button
              className={`course-tab-btn ${activeTab === "rejected" ? "active" : ""}`}
              onClick={() => setActiveTab("rejected")}
            >
              <FiXCircle /> Rejected ({stats.rejected})
            </button>
            <button
              className={`course-tab-btn ${activeTab === "all" ? "active" : ""}`}
              onClick={() => setActiveTab("all")}
            >
              All Courses ({stats.total})
            </button>
          </div>

          <div className="users-search-box" style={{ maxWidth: 300 }}>
            <input
              type="text"
              placeholder="Search by course or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Course Table */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> Loading courses from database...
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="no-students">
              <h3>No Courses Found</h3>
              <p>
                {activeTab === "pending"
                  ? "🎉 Excellent! No pending courses awaiting approval right now."
                  : "No courses match the selected tab or search criteria."}
              </p>
            </div>
          ) : (
            <table style={{ minWidth: 950 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course Title</th>
                  <th>Instructor</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Moderation Status</th>
                  <th style={{ textAlign: "right" }}>Review Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourses.map((c, i) => {
                  const status = c.status || (c.isApproved ? "approved" : "pending");
                  const isPending = status === "pending" || !c.isApproved;
                  const isApproved = status === "approved" || c.isApproved;

                  return (
                    <tr key={c._id || i}>
                      <td>{i + 1}</td>
                      <td>
                        <div style={{ display: "flex", flexDirection: "column" }}>
                          <strong style={{ color: "#0f172a", fontSize: 14 }}>{c.title}</strong>
                          <span style={{ fontSize: 12, color: "#64748b" }}>
                            {Array.isArray(c.modules) ? c.modules.length : 0} modules • {c.duration || "3 Months"}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <FiUser style={{ color: "#64748b" }} />
                          <span>{c.instructor}</span>
                        </div>
                      </td>
                      <td>{c.category}</td>
                      <td>
                        <strong>₹{c.price}</strong>
                      </td>
                      <td>
                        {isPending && (
                          <span className="course-approval-badge pending">
                            <FiClock /> Pending Admin Review
                          </span>
                        )}
                        {isApproved && (
                          <span className="course-approval-badge approved">
                            <FiCheckCircle /> Live on Website
                          </span>
                        )}
                        {status === "rejected" && (
                          <span
                            className="course-approval-badge rejected"
                            title={c.rejectionReason ? `Reason: ${c.rejectionReason}` : "Rejected"}
                          >
                            <FiXCircle /> Rejected
                          </span>
                        )}
                      </td>
                      <td>
                        <div className="user-actions-cell" style={{ justifyContent: "flex-end" }}>
                          {/* Preview Details */}
                          <button
                            className="btn-refresh-users"
                            style={{ padding: "5px 10px", fontSize: 12 }}
                            title="Preview Course Details & Videos"
                            onClick={() => handleOpenPreview(c)}
                          >
                            <FiEye /> View Details
                          </button>

                          {/* Approve Button */}
                          {isPending && (
                            <button
                              className="btn-approve-action"
                              title="Approve and Publish course live to students"
                              onClick={() => handleApprove(c._id, c.title)}
                            >
                              <FiCheckCircle /> Approve &amp; Publish
                            </button>
                          )}

                          {/* Reject Button */}
                          {isPending && (
                            <button
                              className="btn-reject-action"
                              title="Reject course for security or quality reasons"
                              onClick={() => {
                                setRejectingCourse(c);
                                setRejectReason("");
                              }}
                            >
                              <FiXCircle /> Reject
                            </button>
                          )}

                          {/* If already approved, allow unpublishing/rejecting if flagged */}
                          {isApproved && (
                            <button
                              className="btn-reject-action"
                              title="Revoke / Unpublish from website"
                              onClick={() => {
                                setRejectingCourse(c);
                                setRejectReason("");
                              }}
                            >
                              Revoke
                            </button>
                          )}

                          {/* Delete */}
                          <button
                            className="btn-delete-user-action"
                            title="Delete course"
                            onClick={() => handleDelete(c._id, c.title)}
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

      {/* ── COURSE PREVIEW & VIDEO INSPECTION MODAL ── */}
      {previewCourse && (
        <div className="modal-overlay" onClick={() => setPreviewCourse(null)}>
          <div
            className="modal-dialog course-preview-modal-dialog"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header course-preview-header">
              <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                <div className="preview-header-icon">
                  <FiBookOpen />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h2 className="preview-header-title">{previewCourse.title}</h2>
                  <div className="preview-header-sub">
                    <span>
                      by <strong>{previewCourse.instructor}</strong>
                    </span>
                    <span>•</span>
                    <span className="preview-header-cat">{previewCourse.category}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                {(!previewCourse.isApproved || previewCourse.status === "pending") && (
                  <span className="course-approval-badge pending">
                    <FiClock /> Pending Review
                  </span>
                )}
                {(previewCourse.isApproved || previewCourse.status === "approved") && (
                  <span className="course-approval-badge approved">
                    <FiCheckCircle /> Live on Catalog
                  </span>
                )}
                {previewCourse.status === "rejected" && (
                  <span className="course-approval-badge rejected">
                    <FiXCircle /> Rejected
                  </span>
                )}
                <button
                  className="modal-close-btn"
                  onClick={() => setPreviewCourse(null)}
                  title="Close Preview"
                >
                  <FiX />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body course-preview-body">
              {/* Hero Banner Card */}
              <div className="preview-hero-card">
                <div className="preview-hero-media">
                  <img
                    src={
                      previewCourse.image ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60"
                    }
                    alt={previewCourse.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src =
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60";
                    }}
                  />
                  <div className="preview-media-badge">₹{previewCourse.price}</div>
                </div>

                <div className="preview-hero-content">
                  <div className="preview-hero-meta-grid">
                    <div className="meta-box">
                      <FiClock className="meta-icon" />
                      <div>
                        <span className="meta-label">Duration</span>
                        <strong>{previewCourse.duration || "3 Months"}</strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <FiDollarSign className="meta-icon" />
                      <div>
                        <span className="meta-label">Course Price</span>
                        <strong>₹{previewCourse.price}</strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <FiLayers className="meta-icon" />
                      <div>
                        <span className="meta-label">Curriculum</span>
                        <strong>
                          {Array.isArray(previewCourse.modules) ? previewCourse.modules.length : 0} Modules
                        </strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <FiVideo className="meta-icon" />
                      <div>
                        <span className="meta-label">Lesson Videos</span>
                        <strong>
                          {Array.isArray(previewCourse.modules)
                            ? previewCourse.modules.filter(
                                (m) => typeof m === "object" && m && m.videoUrl
                              ).length + (previewCourse.videoUrl ? 1 : 0)
                            : previewCourse.videoUrl
                            ? 1
                            : 0} Configured
                        </strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <FiCalendar className="meta-icon" />
                      <div>
                        <span className="meta-label">Submitted On</span>
                        <strong>
                          {formatDate(previewCourse.submittedAt || previewCourse.createdAt)}
                        </strong>
                      </div>
                    </div>

                    <div className="meta-box">
                      <FiUser className="meta-icon" />
                      <div>
                        <span className="meta-label">Instructor</span>
                        <strong title={previewCourse.instructorId || ""}>
                          {previewCourse.instructor}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Rejection Alert if rejected */}
                  {previewCourse.status === "rejected" && previewCourse.rejectionReason && (
                    <div className="preview-rejection-banner">
                      <FiAlertTriangle />
                      <div>
                        <strong>Rejection Reason:</strong> {previewCourse.rejectionReason}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Course-level Promo Video (if exists) */}
              {previewCourse.videoUrl && (
                <div className="course-intro-video-card">
                  <div className="intro-video-header">
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <FiVideo style={{ color: "#4f46e5", fontSize: 18 }} />
                      <h4 style={{ margin: 0, color: "#1e293b", fontSize: 14 }}>
                        Course Introduction &amp; Trailer Video Link
                      </h4>
                    </div>

                    <div className="intro-video-actions">
                      <button
                        type="button"
                        className="btn-link-action"
                        onClick={() => handleCopyLink(previewCourse.videoUrl, "intro_link")}
                      >
                        {copiedId === "intro_link" ? (
                          <FiCheck style={{ color: "#16a34a" }} />
                        ) : (
                          <FiCopy />
                        )}
                        <span>{copiedId === "intro_link" ? "Copied Link!" : "Copy Link"}</span>
                      </button>

                      <a
                        href={previewCourse.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-link-action"
                      >
                        <FiExternalLink />
                        <span>Open Video</span>
                      </a>

                      <button
                        type="button"
                        className={`btn-link-action play-btn ${
                          activeVideoPlayer === "intro" ? "active" : ""
                        }`}
                        onClick={() =>
                          setActiveVideoPlayer(activeVideoPlayer === "intro" ? null : "intro")
                        }
                      >
                        <FiPlay />
                        <span>
                          {activeVideoPlayer === "intro" ? "Hide Player" : "Watch Video"}
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="intro-video-url-pill">
                    <FiVideo />
                    <span className="url-text">{previewCourse.videoUrl}</span>
                  </div>

                  {activeVideoPlayer === "intro" && (
                    <div style={{ marginTop: 12 }}>
                      {renderVideoPlayer(
                        previewCourse.videoUrl,
                        `${previewCourse.title} - Intro Video`
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Interactive Navigation Tabs */}
              <div className="preview-tabs-row">
                <button
                  type="button"
                  className={`preview-tab-btn ${modalTab === "curriculum" ? "active" : ""}`}
                  onClick={() => setModalTab("curriculum")}
                >
                  <FiBookOpen /> Curriculum &amp; Video Links (
                  {Array.isArray(previewCourse.modules) ? previewCourse.modules.length : 0})
                </button>
                <button
                  type="button"
                  className={`preview-tab-btn ${modalTab === "overview" ? "active" : ""}`}
                  onClick={() => setModalTab("overview")}
                >
                  <FiInfo /> Description &amp; Requirements
                </button>
                <button
                  type="button"
                  className={`preview-tab-btn ${modalTab === "security" ? "active" : ""}`}
                  onClick={() => setModalTab("security")}
                >
                  <FiShield /> Moderation &amp; Verification Audit
                </button>
              </div>

              {/* TAB 1: CURRICULUM MODULES & VIDEO LINKS */}
              {modalTab === "curriculum" && (
                <div className="preview-tab-content">
                  {Array.isArray(previewCourse.modules) && previewCourse.modules.length > 0 ? (
                    <div className="preview-modules-list">
                      {previewCourse.modules.map((mod, modIdx) => {
                        const isObj = typeof mod === "object" && mod !== null;
                        const title = isObj ? mod.title || `Module ${modIdx + 1}` : mod;
                        const videoUrl = isObj ? mod.videoUrl || "" : "";
                        const duration = isObj ? mod.duration || "20 min" : "20 min";
                        const description = isObj ? mod.description || "" : "";
                        const quiz = isObj && Array.isArray(mod.quiz) ? mod.quiz : [];
                        const isVideoActive = activeVideoPlayer === `mod_${modIdx}`;
                        const isQuizExpanded = !!expandedQuizzes[modIdx];

                        return (
                          <div key={modIdx} className="preview-module-card">
                            {/* Module Header */}
                            <div className="preview-module-header">
                              <div className="preview-module-title-box">
                                <span className="preview-module-badge">{modIdx + 1}</span>
                                <div>
                                  <h4 className="preview-module-title">{title}</h4>
                                  {description && (
                                    <p className="preview-module-desc">{description}</p>
                                  )}
                                </div>
                              </div>
                              <span className="preview-duration-pill">
                                <FiClock /> {duration}
                              </span>
                            </div>

                            {/* ── VIDEO LINK ROW ── */}
                            <div className="preview-video-section">
                              {videoUrl ? (
                                <div className="preview-video-box">
                                  <div className="preview-video-top">
                                    <div className="preview-video-info">
                                      <FiVideo className="video-camera-icon" />
                                      <div className="preview-video-text">
                                        <span className="video-label">Module Video Link:</span>
                                        <a
                                          href={videoUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="preview-video-link"
                                          title="Click to open video link in new window"
                                        >
                                          {videoUrl}
                                        </a>
                                      </div>
                                    </div>

                                    <div className="preview-video-actions">
                                      <button
                                        type="button"
                                        className="btn-video-chip"
                                        onClick={() =>
                                          handleCopyLink(videoUrl, `mod_link_${modIdx}`)
                                        }
                                        title="Copy video link to clipboard"
                                      >
                                        {copiedId === `mod_link_${modIdx}` ? (
                                          <>
                                            <FiCheck style={{ color: "#16a34a" }} /> Copied!
                                          </>
                                        ) : (
                                          <>
                                            <FiCopy /> Copy Link
                                          </>
                                        )}
                                      </button>

                                      <a
                                        href={videoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn-video-chip"
                                        title="Open video in new tab"
                                      >
                                        <FiExternalLink /> Open
                                      </a>

                                      <button
                                        type="button"
                                        className={`btn-video-chip play-chip ${
                                          isVideoActive ? "active" : ""
                                        }`}
                                        onClick={() =>
                                          setActiveVideoPlayer(
                                            isVideoActive ? null : `mod_${modIdx}`
                                          )
                                        }
                                      >
                                        <FiPlay />{" "}
                                        {isVideoActive ? "Close Player" : "Watch Video"}
                                      </button>
                                    </div>
                                  </div>

                                  {/* Inline Video Player Preview */}
                                  {isVideoActive && (
                                    <div className="preview-video-player-container">
                                      <div className="player-title-bar">
                                        <span>
                                          <FiVideo /> Now Previewing: <strong>{title}</strong>
                                        </span>
                                        <button
                                          type="button"
                                          onClick={() => setActiveVideoPlayer(null)}
                                          title="Close Player"
                                        >
                                          <FiX />
                                        </button>
                                      </div>
                                      {renderVideoPlayer(videoUrl, title)}
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <div className="preview-no-video-box">
                                  <FiAlertTriangle style={{ color: "#d97706" }} />
                                  <span>No video link attached to this module by instructor.</span>
                                </div>
                              )}
                            </div>

                            {/* ── QUIZ SECTION ── */}
                            {quiz.length > 0 && (
                              <div className="preview-quiz-section">
                                <button
                                  type="button"
                                  className="preview-quiz-toggle"
                                  onClick={() => toggleQuizAccordion(modIdx)}
                                >
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <FiHelpCircle style={{ color: "#4f46e5" }} />
                                    <span>
                                      Module Knowledge Check Quiz ({quiz.length} Questions)
                                    </span>
                                  </div>
                                  {isQuizExpanded ? <FiChevronUp /> : <FiChevronDown />}
                                </button>

                                {isQuizExpanded && (
                                  <div className="preview-quiz-list">
                                    {quiz.map((q, qIdx) => {
                                      const options = getQuestionOptions(q.options);
                                      return (
                                        <div key={qIdx} className="preview-quiz-item">
                                          <div className="quiz-q-title">
                                            <span className="quiz-q-num">Q{qIdx + 1}.</span>
                                            <span>{q.question}</span>
                                          </div>
                                          <div className="quiz-options-grid">
                                            {options.map((opt, oIdx) => {
                                              const isCorrect = oIdx === Number(q.correctAnswer);
                                              return (
                                                <div
                                                  key={oIdx}
                                                  className={`quiz-opt-card ${
                                                    isCorrect ? "correct" : ""
                                                  }`}
                                                >
                                                  <span className="opt-letter">
                                                    {String.fromCharCode(65 + oIdx)}.
                                                  </span>
                                                  <span className="opt-text">{opt}</span>
                                                  {isCorrect && (
                                                    <span className="correct-badge">
                                                      <FiCheck /> Correct Answer
                                                    </span>
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                          {q.explanation && (
                                            <div className="quiz-explanation">
                                              <strong>Explanation:</strong> {q.explanation}
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="preview-empty-curriculum">
                      <FiBookOpen style={{ fontSize: 32, color: "#94a3b8", marginBottom: 8 }} />
                      <p>No structured modules found for this course.</p>
                      {previewCourse.syllabus && (
                        <div style={{ marginTop: 12, textAlign: "left", whiteSpace: "pre-line" }}>
                          <strong>Raw Syllabus Text:</strong>
                          <p style={{ color: "#475569", fontSize: 13, marginTop: 4 }}>
                            {previewCourse.syllabus}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: COURSE DESCRIPTION & PREREQUISITES */}
              {modalTab === "overview" && (
                <div className="preview-tab-content">
                  <div className="preview-info-card">
                    <h4 className="info-card-title">Course Description</h4>
                    <p className="preview-description-text">
                      {previewCourse.description || "No description provided."}
                    </p>
                  </div>

                  <div className="preview-info-card" style={{ marginTop: 16 }}>
                    <h4 className="info-card-title">Prerequisites &amp; Requirements</h4>
                    {previewCourse.requirements ? (
                      <div className="prereq-list">
                        {previewCourse.requirements
                          .split("\n")
                          .map((r) => r.trim().replace(/^[-•*]\s*/, ""))
                          .filter(Boolean)
                          .map((req, rIdx) => (
                            <div key={rIdx} className="prereq-item">
                              <FiCheck className="prereq-check" />
                              <span>{req}</span>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p style={{ color: "#64748b", fontStyle: "italic", fontSize: 13 }}>
                        No specific prerequisites listed for this course.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: MODERATION AUDIT & INSTRUCTOR DETAILS */}
              {modalTab === "security" && (
                <div className="preview-tab-content">
                  <div className="preview-audit-grid">
                    <div className="audit-card">
                      <span className="audit-label">Current Moderation Status</span>
                      <strong className="audit-value">
                        {previewCourse.status === "approved" || previewCourse.isApproved
                          ? "Approved & Live on Website"
                          : previewCourse.status === "rejected"
                          ? "Rejected / Quarantined"
                          : "Pending Administrator Approval"}
                      </strong>
                    </div>

                    <div className="audit-card">
                      <span className="audit-label">Course ID</span>
                      <code className="audit-code">{previewCourse._id || "N/A"}</code>
                    </div>

                    <div className="audit-card">
                      <span className="audit-label">Instructor Name</span>
                      <strong className="audit-value">{previewCourse.instructor}</strong>
                    </div>

                    <div className="audit-card">
                      <span className="audit-label">Instructor ID</span>
                      <code className="audit-code">{previewCourse.instructorId || "N/A"}</code>
                    </div>

                    <div className="audit-card">
                      <span className="audit-label">Submission Timestamp</span>
                      <strong className="audit-value">
                        {formatDate(previewCourse.submittedAt || previewCourse.createdAt)}
                      </strong>
                    </div>

                    <div className="audit-card">
                      <span className="audit-label">Approved By</span>
                      <strong className="audit-value">
                        {previewCourse.approvedBy || "Not yet approved"}
                      </strong>
                    </div>
                  </div>

                  <div className="preview-security-checklist">
                    <h4 style={{ margin: "0 0 10px", fontSize: 14, color: "#1e1b4b" }}>
                      Cyber Crime &amp; Quality Prevention Checklist
                    </h4>
                    <div className="checklist-items">
                      <div className="check-item">
                        <FiCheckCircle style={{ color: "#16a34a" }} />
                        <span>All embedded videos and external links reviewed for security and phishing risks.</span>
                      </div>
                      <div className="check-item">
                        <FiCheckCircle style={{ color: "#16a34a" }} />
                        <span>Curriculum contains substantive educational material and valid quizzes.</span>
                      </div>
                      <div className="check-item">
                        <FiCheckCircle style={{ color: "#16a34a" }} />
                        <span>Instructor identity matches platform records.</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="modal-actions course-preview-actions">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setPreviewCourse(null)}
              >
                Close Details
              </button>

              <div style={{ display: "flex", gap: 10 }}>
                {/* If course is pending review */}
                {(!previewCourse.isApproved || previewCourse.status === "pending") && (
                  <>
                    <button
                      type="button"
                      className="btn-reject-action"
                      style={{ padding: "10px 16px", fontSize: 13 }}
                      onClick={() => {
                        const target = previewCourse;
                        setPreviewCourse(null);
                        setRejectingCourse(target);
                        setRejectReason("");
                      }}
                    >
                      <FiXCircle /> Reject Course
                    </button>
                    <button
                      type="button"
                      className="btn-approve-action"
                      style={{ padding: "10px 18px", fontSize: 13 }}
                      onClick={() => {
                        const id = previewCourse._id;
                        const title = previewCourse.title;
                        setPreviewCourse(null);
                        handleApprove(id, title);
                      }}
                    >
                      <FiCheckCircle /> Approve &amp; Publish Live
                    </button>
                  </>
                )}

                {/* If already approved, allow revoking */}
                {(previewCourse.isApproved || previewCourse.status === "approved") && (
                  <button
                    type="button"
                    className="btn-reject-action"
                    style={{ padding: "10px 16px", fontSize: 13 }}
                    onClick={() => {
                      const target = previewCourse;
                      setPreviewCourse(null);
                      setRejectingCourse(target);
                      setRejectReason("");
                    }}
                  >
                    <FiXCircle /> Revoke / Unpublish
                  </button>
                )}

                {/* If rejected, allow re-approving */}
                {previewCourse.status === "rejected" && (
                  <button
                    type="button"
                    className="btn-approve-action"
                    style={{ padding: "10px 18px", fontSize: 13 }}
                    onClick={() => {
                      const id = previewCourse._id;
                      const title = previewCourse.title;
                      setPreviewCourse(null);
                      handleApprove(id, title);
                    }}
                  >
                    <FiCheckCircle /> Re-Approve Course
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* REJECT MODAL */}
      {rejectingCourse && (
        <div className="modal-overlay" onClick={() => setRejectingCourse(null)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <FiXCircle style={{ color: "#dc2626" }} /> Reject Course
              </h2>
              <button className="modal-close-btn" onClick={() => setRejectingCourse(null)}>
                <FiX />
              </button>
            </div>
            <form onSubmit={handleRejectSubmit}>
              <div className="modal-body">
                <p style={{ color: "#475569", fontSize: 14, marginBottom: 16 }}>
                  Rejecting <strong>"{rejectingCourse.title}"</strong> will prevent it from appearing on the website. The instructor will see the reason provided below.
                </p>

                <div className="modal-form-group">
                  <label htmlFor="rejection-reason">Reason for Rejection *</label>
                  <textarea
                    id="rejection-reason"
                    rows={4}
                    style={{
                      width: "100%",
                      padding: 10,
                      borderRadius: 8,
                      border: "1px solid #cbd5e1",
                      fontFamily: "inherit",
                      fontSize: 14,
                      outline: "none",
                    }}
                    placeholder="e.g. Unverified external download links, incomplete curriculum, or violation of content guidelines."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    required
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn-modal-cancel" onClick={() => setRejectingCourse(null)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-reject-action" style={{ padding: "10px 18px", fontSize: 14 }}>
                    Confirm Rejection
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

export default ManageCourses;