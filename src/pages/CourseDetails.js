import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  FiStar,
  FiUsers,
  FiClock,
  FiCheck,
  FiPlay,
  FiFileText,
  FiSmartphone,
  FiAward,
  FiGlobe,
  FiChevronDown,
  FiShield,
  FiArrowRight,
  FiVideo,
  FiHelpCircle,
  FiCheckCircle,
} from "react-icons/fi";
import { courses } from "../data/MockData";
import { useAuth } from "../context/AuthContext";
import "./CourseDetails.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function CourseDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [openModules, setOpenModules] = useState({ 0: true });
  const [videoModalOpen, setVideoModalOpen] = useState(false);

  // Try finding in mockData first for instantaneous render of sample courses
  const [course, setCourse] = useState(() => {
    return courses.find((item) => String(item.id) === String(id));
  });
  const [loading, setLoading] = useState(!course);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/api/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.course) {
          const raw = data.course;
          const formatted = {
            id: raw._id || raw.id,
            title: raw.title,
            description: raw.description || "Comprehensive hands-on training program.",
            category: raw.category || "General",
            instructor: raw.instructor || "EduSphere Faculty",
            instructorId: raw.instructorId,
            price: Number(raw.price) || 0,
            duration: raw.duration || "3 Months",
            rating: raw.rating || 5.0,
            students: raw.students || 0,
            image:
              raw.image ||
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
            syllabus: raw.syllabus || "",
            requirements: raw.requirements || "",
            modules:
              Array.isArray(raw.modules) && raw.modules.length > 0
                ? raw.modules
                : raw.syllabus && raw.syllabus.trim()
                ? raw.syllabus
                    .split("\n")
                    .map((s) => s.trim().replace(/^[-•*]\s*/, ""))
                    .filter(Boolean)
                : [
                    "Introduction & Fundamentals",
                    "Core Concepts & Architecture",
                    "Hands-on Project Implementation",
                    "Testing, Optimization & Deployment",
                  ],
          };
          setCourse(formatted);
        }
      })
      .catch((err) => {
        console.warn("Could not fetch course by id:", err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const [isEnrolled, setIsEnrolled] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsEnrolled(false);
      return;
    }
    try {
      const saved = localStorage.getItem("edusphere_enrollments");
      if (saved) {
        const list = JSON.parse(saved);
        if (Array.isArray(list) && list.some((e) => String(e.courseId) === String(id))) {
          setIsEnrolled(true);
        }
      }
    } catch (_) {}
  }, [id, user]);

  if (loading) {
    return (
      <div className="course-details-page" style={{ padding: "100px 20px", textAlign: "center" }}>
        <h2>Loading Course Details...</h2>
        <p style={{ color: "#64748b", marginTop: 10 }}>Fetching course from the catalog.</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-details-page" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h2>Course Not Found</h2>
        <p style={{ color: "#64748b", margin: "14px 0 24px" }}>
          The requested course could not be located in our catalog.
        </p>
        <Link to="/courses" className="btn">
          Back to All Courses
        </Link>
      </div>
    );
  }

  const toggleModule = (index) => {
    setOpenModules((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleEnroll = () => {
    if (!user) {
      navigate("/login");
      return;
    }
    navigate(`/enroll/${course.id}`);
  };

  // Extract initials
  const getInitials = (name = "") => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "ED";
  };

  const originalPrice = course.price ? course.price * 2 : 4999;

  return (
    <div className="course-details-page">
      {/* Top Banner Section */}
      <section className="details-banner">
        <div className="details-banner-container">
          {/* Breadcrumb Navigation */}
          <nav className="details-breadcrumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/courses">Courses</Link>
            <span>/</span>
            <Link to="/courses">{course.category}</Link>
            <span>/</span>
            <span className="current">{course.title}</span>
          </nav>

          <div className="details-banner-content">
            <div className="banner-badges-row">
              <span className="badge-category-pill">{course.category}</span>
              <span className="badge-bestseller">Bestseller</span>
            </div>

            <h1 className="details-title">{course.title}</h1>
            <p className="details-subtitle">{course.description}</p>

            <div className="details-meta-row">
              <span className="meta-rating-badge">
                <FiStar /> {course.rating} ★★★★★
              </span>

              <span className="meta-students-count">
                <FiUsers /> {course.students.toLocaleString()} students enrolled
              </span>

              <span className="meta-instructor-link">
                Created by <strong>{course.instructor}</strong>
              </span>

              <span className="meta-item-tag">
                <FiGlobe /> English (US)
              </span>

              <span className="meta-item-tag">
                <FiClock /> Last updated Sept 2026
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Main 2-Column Body */}
      <div className="details-body-container">
        <div className="details-main-grid">
          {/* Left Column: Learning Objectives, Syllabus, Instructor */}
          <div className="details-left-column">
            {/* "What You'll Learn" Box */}
            <div className="learn-box-card">
              <h2>What you'll learn in this course</h2>
              <div className="learn-points-grid">
                <div className="learn-point">
                  <FiCheck />
                  <span>Build complete real-world applications using modern industry practices.</span>
                </div>
                <div className="learn-point">
                  <FiCheck />
                  <span>Master core architectural fundamentals and modern ecosystem patterns.</span>
                </div>
                <div className="learn-point">
                  <FiCheck />
                  <span>Develop career-ready portfolios that stand out to technical interviewers.</span>
                </div>
                <div className="learn-point">
                  <FiCheck />
                  <span>Write clean, maintainable code with high performance standards.</span>
                </div>
                <div className="learn-point">
                  <FiCheck />
                  <span>Integrate databases, external APIs, and production deployment pipelines.</span>
                </div>
                <div className="learn-point">
                  <FiCheck />
                  <span>Obtain an industry-recognized certificate with a shareable verification link.</span>
                </div>
              </div>
            </div>

            {/* Course Content / Syllabus Accordion */}
            <div className="curriculum-card">
              <div className="curriculum-header">
                <h2>Course Curriculum</h2>
                <span className="curriculum-stats-summary">
                  {course.modules.length} Modules &bull; 34 Lectures &bull; {course.duration} Total Length
                </span>
              </div>

              <div className="modules-accordion-list">
                {course.modules.map((moduleItem, index) => {
                  const isOpen = Boolean(openModules[index]);
                  const modTitle =
                    typeof moduleItem === "string"
                      ? moduleItem
                      : moduleItem?.title || `Module ${index + 1}`;
                  const hasVideo =
                    typeof moduleItem === "object" && Boolean(moduleItem?.videoUrl);
                  const quizCount =
                    typeof moduleItem === "object" && Array.isArray(moduleItem?.quiz)
                      ? moduleItem.quiz.length
                      : 0;
                  const modDuration =
                    typeof moduleItem === "object" && moduleItem?.duration
                      ? moduleItem.duration
                      : "25m";

                  return (
                    <div
                      key={index}
                      className={`module-item ${isOpen ? "open" : ""}`}
                    >
                      <button
                        type="button"
                        className="module-trigger-btn"
                        onClick={() => toggleModule(index)}
                        aria-expanded={isOpen}
                      >
                        <div className="module-title-wrap">
                          <span className="module-number-pill">{index + 1}</span>
                          <span>{modTitle}</span>
                        </div>

                        <div className="module-meta-right">
                          <span>
                            {hasVideo ? "1 Video" : "Lecture"}
                            {quizCount > 0 ? ` + ${quizCount} Quiz Qs` : ""} &bull;{" "}
                            {modDuration}
                          </span>
                          <FiChevronDown className="module-accordion-chevron" />
                        </div>
                      </button>

                      {isOpen && (
                        <div className="module-lessons-drawer">
                          <div className="lesson-row">
                            <div className="lesson-row-left">
                              <FiPlay />
                              <span>
                                {hasVideo
                                  ? `Video Lecture: ${modTitle}`
                                  : `1. Core Overview & Key Concepts`}
                              </span>
                            </div>
                            <span>{modDuration}</span>
                          </div>

                          {quizCount > 0 && (
                            <div className="lesson-row">
                              <div className="lesson-row-left">
                                <FiFileText style={{ color: "#6366f1" }} />
                                <span>Module Knowledge Check Quiz</span>
                              </div>
                              <span style={{ color: "#6366f1", fontWeight: 600 }}>
                                {quizCount} MCQ Questions
                              </span>
                            </div>
                          )}

                          {typeof moduleItem === "object" && moduleItem?.description && (
                            <div
                              style={{
                                padding: "8px 12px",
                                fontSize: 13,
                                color: "#64748b",
                                borderTop: "1px dashed #e2e8f0",
                              }}
                            >
                              {moduleItem.description}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Requirements Section */}
            <div className="requirements-card">
              <h2>Prerequisites &amp; Requirements</h2>
              <ul className="requirements-list">
                {course.requirements && course.requirements.trim() ? (
                  course.requirements
                    .split("\n")
                    .map((r) => r.trim().replace(/^[-•*]\s*/, ""))
                    .filter(Boolean)
                    .map((reqItem, idx) => <li key={idx}>{reqItem}</li>)
                ) : (
                  <>
                    <li>A computer with Windows, macOS, or Linux with internet access.</li>
                    <li>No previous advanced background needed; we teach from foundational fundamentals.</li>
                    <li>Curiosity and passion to learn practical skills by building real code.</li>
                  </>
                )}
              </ul>
            </div>

            {/* Meet Your Instructor Profile */}
            <div className="instructor-profile-card">
              <h2>Meet Your Instructor</h2>
              <div className="instructor-header-row">
                <div className="instructor-avatar-big">
                  {getInitials(course.instructor)}
                </div>
                <div className="instructor-title-info">
                  <h3>{course.instructor}</h3>
                  <p>Senior Technical Instructor &bull; Industry Architect</p>
                </div>
              </div>

              <div className="instructor-stats-chips">
                <span>
                  <FiStar style={{ color: "#ca8a04" }} /> 4.8 Instructor Rating
                </span>
                <span>
                  <FiUsers style={{ color: "#2563eb" }} /> {course.students.toLocaleString()} Students
                </span>
                <span>
                  <FiVideo style={{ color: "#059669" }} /> 4 Masterclasses
                </span>
              </div>

              <p className="instructor-bio">
                {course.instructor} is an experienced software engineer and tech educator with over
                8 years of experience engineering high-scale distributed systems and mentoring
                aspiring developers. Their courses emphasize project-based, practical software craftsmanship.
              </p>
            </div>
          </div>

          {/* Right Column: Sticky Enrollment Box */}
          <div className="details-right-column">
            <div className="sticky-enroll-card">
              {/* Media Preview Wrap */}
              <div className="preview-media-container">
                <img src={course.image} alt={course.title} />
                <button
                  type="button"
                  className="play-overlay-button"
                  onClick={() => setVideoModalOpen(true)}
                  aria-label="Preview Course Video"
                >
                  <FiPlay style={{ marginLeft: 3 }} />
                </button>
                <span className="preview-badge-bottom">Preview This Course</span>
              </div>

              {/* Card Body */}
              <div className="enroll-card-main">
                <div className="price-container">
                  <span className="main-price-val">₹{course.price.toLocaleString()}</span>
                  <span className="original-price-val">₹{originalPrice.toLocaleString()}</span>
                  <span className="discount-badge">50% OFF</span>
                </div>

                <div className="urgency-note">
                  ⏳ Limited-time discounted enrollment tuition
                </div>

                {isEnrolled ? (
                  <div className="details-already-enrolled-box">
                    <div className="details-enrolled-badge">
                      <FiCheckCircle /> You have already enrolled in this course
                    </div>
                    <button
                      type="button"
                      className="enroll-action-btn go-learning-btn"
                      onClick={() => navigate(`/student/learn/${course.id}`)}
                    >
                      <span>Continue Learning</span>
                      <FiArrowRight />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    className="enroll-action-btn"
                    onClick={handleEnroll}
                  >
                    <span>Enroll in Course</span>
                    <FiArrowRight />
                  </button>
                )}

                <p className="guarantee-note">
                  <FiShield style={{ verticalAlign: "middle", marginRight: 4, color: "#16a34a" }} />
                  30-Day Money-Back Guarantee &bull; Full Lifetime Access
                </p>

                {/* Features Checklist */}
                <div className="course-features-block">
                  <h4>This course includes:</h4>
                  <ul className="features-list">
                    <li className="feature-item">
                      <FiVideo />
                      <span>{course.duration} on-demand video lectures</span>
                    </li>
                    <li className="feature-item">
                      <FiFileText />
                      <span>15+ Downloadable resources &amp; cheat sheets</span>
                    </li>
                    <li className="feature-item">
                      <FiSmartphone />
                      <span>Access on Mobile, Tablet, and Desktop</span>
                    </li>
                    <li className="feature-item">
                      <FiAward />
                      <span>Verified Certificate of Completion</span>
                    </li>
                    <li className="feature-item">
                      <FiHelpCircle />
                      <span>Direct mentor Q&amp;A support access</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Preview Modal */}
      {videoModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
          onClick={() => setVideoModalOpen(false)}
        >
          <div
            style={{
              background: "#0f172a",
              borderRadius: 16,
              maxWidth: 700,
              width: "100%",
              padding: 24,
              color: "#ffffff",
              boxShadow: "0 20px 50px rgba(0,0,0,0.5)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 18 }}>Course Preview: {course.title}</h3>
              <button
                style={{ background: "none", border: "none", color: "#ffffff", fontSize: 22, cursor: "pointer" }}
                onClick={() => setVideoModalOpen(false)}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                width: "100%",
                height: 350,
                background: "#000000",
                borderRadius: 10,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
                color: "#94a3b8",
              }}
            >
              <FiPlay style={{ fontSize: 48, color: "#6366f1" }} />
              <span style={{ fontSize: 15 }}>Sample Lecture: Introduction to {course.title}</span>
              <span style={{ fontSize: 12, opacity: 0.7 }}>High Definition Video &bull; 1080p</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default CourseDetails;