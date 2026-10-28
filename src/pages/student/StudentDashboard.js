import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiClock,
  FiCheckCircle,
  FiAward,
  FiTrendingUp,
  FiCalendar,
  FiPlayCircle,
  FiCreditCard,
} from "react-icons/fi";

import Sidebar from "../../components/Sidebar";
import DashboardCard from "../../components/DashboardCard";
import { useAuth } from "../../context/AuthContext";
import "./StudentDashboard.css";

function StudentDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [dashboardData, setDashboardData] = useState({
    enrolledCourses: 0,
    inProgress: 0,
    completed: 0,
    certificates: 0,
    courses: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Read enrollments from localStorage (same source used by Enrollment & MyCourses pages)
    try {
      let enrollments = JSON.parse(
        localStorage.getItem("edusphere_enrollments") || "[]"
      );

      // Fallback: legacy single enrollment
      if (enrollments.length === 0) {
        const legacy = localStorage.getItem("enrollment");
        if (legacy) {
          enrollments = [JSON.parse(legacy)];
        }
      }

      // Deduplicate courses by id/title
      const uniqueEnrollments = [];
      const seenTitles = new Set();
      for (const e of enrollments) {
        const titleKey = (e.courseTitle || "").toLowerCase().trim();
        if (titleKey && !seenTitles.has(titleKey)) {
          seenTitles.add(titleKey);
          uniqueEnrollments.push(e);
        }
      }

      const totalEnrolled = uniqueEnrollments.length;
      const completedCourses = uniqueEnrollments.filter(
        (e) => (e.progress || 0) >= 100
      );
      const inProgressCourses = uniqueEnrollments.filter(
        (e) => (e.progress || 0) > 0 && (e.progress || 0) < 100
      );

      setDashboardData({
        enrolledCourses: totalEnrolled,
        inProgress: inProgressCourses.length || (totalEnrolled > 0 ? totalEnrolled - completedCourses.length : 0),
        completed: completedCourses.length,
        certificates: completedCourses.length,
        courses: uniqueEnrollments,
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content">
          <div className="dashboard-loading">
            <div className="dash-spinner" />
            <p>Loading dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        {/* ── Welcome Header ── */}
        <div className="dashboard-heading">
          <div className="dash-welcome">
            <h1>Welcome back, {user?.name || "Student"}! 👋</h1>
            <p>Continue your learning journey. Here's your progress overview.</p>
          </div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="dashboard-grid">
          <DashboardCard
            title="Enrolled Courses"
            value={dashboardData.enrolledCourses}
            icon={<FiBookOpen />}
          />
          <DashboardCard
            title="In Progress"
            value={dashboardData.inProgress}
            icon={<FiClock />}
          />
          <DashboardCard
            title="Completed"
            value={dashboardData.completed}
            icon={<FiCheckCircle />}
          />
          <DashboardCard
            title="Certificates"
            value={dashboardData.certificates}
            icon={<FiAward />}
          />
        </div>

        {/* ── Course Progress Section ── */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2><FiTrendingUp /> Course Progress</h2>
            {dashboardData.courses.length > 0 && (
              <button
                className="view-all-btn"
                onClick={() => navigate("/student/courses")}
              >
                View All Courses →
              </button>
            )}
          </div>

          {dashboardData.courses.length === 0 ? (
            <div className="dash-empty-state">
              <FiBookOpen size={48} />
              <h3>No courses enrolled yet</h3>
              <p>
                Start your learning journey by exploring our wide range of
                courses.
              </p>
              <button
                className="dash-explore-btn"
                onClick={() => navigate("/courses")}
              >
                <FiPlayCircle /> Explore Courses
              </button>
            </div>
          ) : (
            <div className="dash-courses-list">
              {dashboardData.courses.map((course, index) => {
                const progress = course.progress || 0;
                const enrollDate = course.enrolledAt
                  ? new Date(course.enrolledAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "N/A";

                return (
                  <div className="dash-course-item" key={course.courseId || index}>
                    <div className="dash-course-img">
                      {course.image ? (
                        <img src={course.image} alt={course.courseTitle} />
                      ) : (
                        <div className="dash-course-placeholder">
                          <FiBookOpen size={24} />
                        </div>
                      )}
                    </div>

                    <div className="dash-course-info">
                      <h4>{course.courseTitle}</h4>
                      <div className="dash-course-meta">
                        <span>
                          <FiCalendar size={12} /> Enrolled: {enrollDate}
                        </span>
                        {course.instructor && (
                          <span>👨‍🏫 {course.instructor}</span>
                        )}
                        {course.duration && (
                          <span><FiClock size={12} /> {course.duration}</span>
                        )}
                      </div>

                      <div className="dash-progress-wrap">
                        <div className="dash-progress-bar">
                          <div
                            className="dash-progress-fill"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className="dash-progress-pct">{progress}%</span>
                      </div>
                    </div>

                    <button
                      className="dash-course-action"
                      onClick={() =>
                        progress === 100
                          ? navigate("/student/certificates")
                          : navigate(`/student/learn/${course.courseId}`)
                      }
                    >
                      {progress === 100 ? (
                        <><FiAward /> Certificate</>
                      ) : (
                        <><FiPlayCircle /> Start Learning</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Payment History Quick Preview ── */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>
              <FiCreditCard /> Payment History
            </h2>
            <button
              className="view-all-btn"
              onClick={() => navigate("/student/payments")}
            >
              View Full History →
            </button>
          </div>

          {dashboardData.courses.length === 0 ? (
            <div className="dash-empty-state" style={{ padding: "30px 20px" }}>
              <FiCreditCard size={36} />
              <h3>No Transactions Recorded</h3>
              <p>Your enrollment payment invoices and receipts will appear here.</p>
            </div>
          ) : (
            <div className="dash-activity-list">
              {dashboardData.courses.slice(0, 4).map((item, idx) => {
                const isUPI = (item.paymentMethod || "").toLowerCase().includes("upi");
                const isCard = (item.paymentMethod || "").toLowerCase().includes("card");

                return (
                  <div className="dash-activity-item" key={item.paymentId || idx}>
                    <div
                      className="dash-activity-dot"
                      style={{
                        background: "linear-gradient(135deg, #10b981, #059669)",
                        boxShadow: "0 0 0 3px rgba(16, 185, 129, 0.2)",
                      }}
                    />
                    <div className="dash-activity-content">
                      <p>
                        Payment for <strong>{item.courseTitle}</strong>
                      </p>
                      <span style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center", marginTop: "3px" }}>
                        <span>
                          {item.enrolledAt
                            ? new Date(item.enrolledAt).toLocaleDateString("en-IN", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })
                            : "Recently"}
                        </span>
                        <span>•</span>
                        <span style={{ fontFamily: "monospace", color: "#64748b" }}>
                          ID: {item.paymentId || `pay_DEMO${idx + 101}`}
                        </span>
                        <span>•</span>
                        <span style={{ color: "#4f46e5", fontWeight: 600 }}>
                          {isUPI ? "⚡ UPI" : isCard ? "💳 Card" : "🏦 Online"}
                        </span>
                      </span>
                    </div>
                    <span className="dash-activity-badge" style={{ fontSize: 13, fontWeight: 800 }}>
                      ₹{(item.price || 0).toLocaleString()} Paid
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Recent Activity ── */}
        {dashboardData.courses.length > 0 && (
          <div className="dashboard-section">
            <div className="section-header">
              <h2><FiCalendar /> Recent Activity</h2>
            </div>
            <div className="dash-activity-list">
              {dashboardData.courses.slice(0, 5).map((course, i) => (
                <div className="dash-activity-item" key={i}>
                  <div className="dash-activity-dot" />
                  <div className="dash-activity-content">
                    <p>
                      Enrolled in <strong>{course.courseTitle}</strong>
                    </p>
                    <span>
                      {course.enrolledAt
                        ? new Date(course.enrolledAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "Recently"}
                    </span>
                  </div>
                  <span className="dash-activity-badge">
                    ₹{(course.price || 0).toLocaleString()} paid
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentDashboard;