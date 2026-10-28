import React, { useState, useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiBookOpen,
  FiAward,
  FiUsers,
  FiClock,
  FiArrowRight,
  FiStar,
  FiCheckCircle,
  FiSearch,
  FiTrendingUp,
  FiPlay,
  FiCompass,
  FiShield,
  FiZap,
  FiCode,
  FiDatabase,
  FiCpu,
  FiLayout,
  FiServer,
  FiDollarSign,
} from "react-icons/fi";

import CourseCard from "../components/CourseCard";
import { courses, categories, testimonials } from "../data/MockData";
import "./Home.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const categoryIconMap = {
  "Web Development": <FiLayout />,
  "Full-Stack Development": <FiCode />,
  "Frontend Development": <FiLayout />,
  "Backend Development": <FiServer />,
  "Programming": <FiCode />,
  "Data Science": <FiTrendingUp />,
  "Machine Learning": <FiCpu />,
  "Artificial Intelligence": <FiCpu />,
  "Database": <FiDatabase />,
  "Cloud Computing": <FiServer />,
  "Cyber Security": <FiShield />,
};

const categoryDescriptions = {
  "Web Development": "HTML, CSS, React, Next.js & Modern Web Apps",
  "Programming": "C++, Python, Java, Data Structures & Algorithms",
  "Data Science": "Python, Pandas, Analytics & Visualizations",
  "Artificial Intelligence": "Generative AI, Neural Networks & Deep Learning",
  "Machine Learning": "Predictive Modeling, Scikit-learn & AI Models",
  "Database": "SQL, MongoDB, PostgreSQL & Data Architecture",
  "Cloud Computing": "AWS, Azure, Docker & Kubernetes Deployment",
  "Cyber Security": "Ethical Hacking, Network Security & Protection",
};

const Home = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [coursesList, setCoursesList] = useState(courses);

  const [statsData, setStatsData] = useState({
    totalStudents: 0,
    totalCourses: 0,
    avgRating: 4.9,
    reviewsCount: 0,
    topStudents: [],
  });

  useEffect(() => {
    // 1. Fetch live courses
    fetch(`${API_BASE_URL}/api/courses`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
          const dbCourses = data.courses.map((c) => ({
            id: c._id,
            ...c,
          }));
          setCoursesList([...dbCourses, ...courses]);
        }
      })
      .catch(() => {});

    // 2. Fetch live metrics from MongoDB analytics & courses
    Promise.all([
      fetch(`${API_BASE_URL}/api/reports/analytics`)
        .then((r) => r.json())
        .catch(() => null),
      fetch(`${API_BASE_URL}/api/courses`)
        .then((r) => r.json())
        .catch(() => null),
    ]).then(([analyticsData, coursesRes]) => {
      const enrolledStudentMap = new Map();

      // Read real enrolled students from analytics response
      if (analyticsData && analyticsData.success && Array.isArray(analyticsData.enrolledStudents)) {
        analyticsData.enrolledStudents.forEach((st) => {
          const email = (st.email || st.name || "").toLowerCase().trim();
          if (email && !enrolledStudentMap.has(email)) {
            enrolledStudentMap.set(email, st.initials || "ST");
          }
        });
      }

      // Read any local session enrollments from browser
      try {
        const localList = JSON.parse(
          localStorage.getItem("edusphere_enrollments") || "[]"
        );
        localList.forEach((e) => {
          const email = (e.studentEmail || e.studentName || "").toLowerCase().trim();
          if (email && !enrolledStudentMap.has(email)) {
            const parts = (e.studentName || "Student").trim().split(" ");
            const init =
              parts.length > 1
                ? (parts[0][0] + parts[1][0]).toUpperCase()
                : parts[0].slice(0, 2).toUpperCase();
            enrolledStudentMap.set(email, init);
          }
        });
      } catch (_) {}

      const studentInitials = Array.from(enrolledStudentMap.values());
      const totalEnrolledCount = studentInitials.length;

      // Average rating dynamically calculated from database courses
      const allCourses = coursesRes?.courses || courses;
      const ratings = allCourses
        .map((c) => Number(c.rating || 4.8))
        .filter((r) => !isNaN(r) && r > 0);
      const computedAvg =
        ratings.length > 0
          ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1)
          : "4.9";

      const computedReviews = totalEnrolledCount > 0 ? totalEnrolledCount : 1;

      setStatsData({
        totalStudents: totalEnrolledCount,
        totalCourses: (coursesRes?.courses?.length || 0) + courses.length,
        avgRating: computedAvg,
        reviewsCount: computedReviews,
        topStudents: studentInitials.slice(0, 3), // Show at most 3 avatar bubbles
      });
    });
  }, []);

  const enrolledCourseIds = useMemo(() => {
    const ids = new Set();
    try {
      const list = JSON.parse(
        localStorage.getItem("edusphere_enrollments") || "[]"
      );
      list.forEach((c) => {
        if (c.courseId) ids.add(String(c.courseId));
      });
    } catch (_) {}

    try {
      const saved = localStorage.getItem("enrollment");
      if (saved) {
        const single = JSON.parse(saved);
        if (single.courseId) ids.add(String(single.courseId));
      }
    } catch (_) {}

    return ids;
  }, []);

  // Filter courses by search and active category tab
  const filteredCourses = useMemo(() => {
    return coursesList
      .filter((course) => !enrolledCourseIds.has(String(course.id || course._id)))
      .filter((course) => {
        const matchesSearch =
          course.title.toLowerCase().includes(search.toLowerCase()) ||
          (course.instructor &&
            course.instructor.toLowerCase().includes(search.toLowerCase())) ||
          (course.category &&
            course.category.toLowerCase().includes(search.toLowerCase()));

        const matchesCat =
          activeCategory === "All" ||
          (course.category &&
            course.category.toLowerCase() === activeCategory.toLowerCase());

        return matchesSearch && matchesCat;
      });
  }, [coursesList, enrolledCourseIds, search, activeCategory]);

  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/courses?search=${encodeURIComponent(search.trim())}`);
    } else {
      const coursesEl = document.getElementById("popular-courses");
      if (coursesEl) {
        coursesEl.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  return (
    <div className="home-container">
      {/* ── 1. MODERN HERO SECTION ── */}
      <section className="modern-hero">
        <div className="hero-ambient-glow glow-purple" />
        <div className="hero-ambient-glow glow-blue" />
        <div className="hero-ambient-glow glow-emerald" />
        <div className="hero-grid-mesh" />

        <div className="modern-hero-inner">
          {/* Left Column: Hero Copy & Actions */}
          <div className="hero-content-col">
            <div className="hero-announcement-pill">
              <span className="pill-pulse">NEW</span>
              <span>2026 AI &amp; Full-Stack Career Tracks Now Live</span>
              <FiArrowRight size={14} />
            </div>

            <h1 className="hero-main-title">
              Unlock Your Potential with{" "}
              <span className="gradient-text-hero">Next-Gen Learning</span>
            </h1>

            <p className="hero-subtext">
              Master top in-demand skills in programming, AI, full-stack development, and data science with hands-on projects, expert mentorship, and industry-recognized certificates.
            </p>

            {/* Quick Search */}
            <form className="hero-search-wrapper" onSubmit={handleHeroSearch}>
              <FiSearch className="search-icon" />
              <input
                type="text"
                placeholder="What skill or course do you want to master today?..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button type="submit" className="hero-search-btn">
                Search <FiArrowRight />
              </button>
            </form>

            {/* CTAs */}
            <div className="hero-cta-group">
              <Link to="/courses" className="btn-hero-primary">
                <FiCompass /> Explore All Courses
              </Link>
              <Link to="/register" className="btn-hero-glass">
                <FiZap /> Join for Free
              </Link>
            </div>


          </div>

          {/* Right Column: Hero Visual Showcase */}
          <div className="hero-visual-card">
            {/* Top Floating Badge */}
            <div className="floating-feature-badge badge-top-right">
              <div className="badge-icon-box purple">
                <FiAward />
              </div>
              <div>
                <strong>Accredited Certificate</strong>
                <span>Recognized by top tech firms</span>
              </div>
            </div>

            {/* Main Interactive Showcase Image */}
            <div className="hero-main-preview">
              <img
                src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1000&q=80"
                alt="Students collaborating and learning with EduSphere"
              />
              <div className="preview-overlay-info">
                <div>
                  <span className="preview-tag">Trending Curriculum</span>
                  <h4>
                    {coursesList[0]?.title || "Full-Stack Web & AI Architect"}
                  </h4>
                </div>
                <div className="preview-rating">
                  <FiStar fill="#fde047" /> {statsData.avgRating}
                </div>
              </div>
            </div>

            {/* Bottom Floating Badge */}
            <div className="floating-feature-badge badge-bottom-left">
              <div className="badge-icon-box emerald">
                <FiCheckCircle />
              </div>
              <div>
                <strong>Interactive Coding &amp; Quizzes</strong>
                <span>Real-time practice assessments</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 2. STATS COUNTER STRIP (Fully Dynamic) ── */}
      <section className="stats-counter-strip">
        <div className="stats-counter-grid">
          <div className="stat-strip-item">
            <div className="stat-strip-icon blue">
              <FiBookOpen />
            </div>
            <div className="stat-strip-info">
              <h3>{statsData.totalCourses || coursesList.length}+</h3>
              <p>Specialized Courses</p>
            </div>
          </div>

          <div className="stat-strip-item">
            <div className="stat-strip-icon purple">
              <FiUsers />
            </div>
            <div className="stat-strip-info">
              <h3>
                {statsData.totalStudents.toLocaleString()}
                {statsData.totalStudents > 20 ? "+" : ""}
              </h3>
              <p>Active Enrolled Students</p>
            </div>
          </div>

          <div className="stat-strip-item">
            <div className="stat-strip-icon amber">
              <FiStar />
            </div>
            <div className="stat-strip-info">
              <h3>{statsData.avgRating} ★</h3>
              <p>Average Course Rating</p>
            </div>
          </div>

          <div className="stat-strip-item">
            <div className="stat-strip-icon emerald">
              <FiAward />
            </div>
            <div className="stat-strip-info">
              <h3>94%</h3>
              <p>Career Advancement</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. EXPLORE CATEGORIES ── */}
      <section className="categories-modern-section">
        <div className="modern-section-header">
          <span className="section-pill-tag">
            <FiCompass /> Domains &amp; Specializations
          </span>
          <h2>Explore Top In-Demand Disciplines</h2>
          <p>
            Choose your learning path designed by seasoned tech architects to help you excel in modern engineering and software development.
          </p>
        </div>

        <div className="category-grid" style={{ maxWidth: 1240, margin: "0 auto" }}>
          {categories.slice(0, 8).map((cat) => (
            <Link
              to={`/courses?category=${encodeURIComponent(cat)}`}
              className="category-card-modern"
              key={cat}
            >
              <div className="category-icon-wrapper">
                {categoryIconMap[cat] || <FiBookOpen />}
              </div>
              <h3>{cat}</h3>
              <p>{categoryDescriptions[cat] || "Master this tech stack with hands-on labs."}</p>
              <span className="category-explore-link">
                View Courses <FiArrowRight />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── 4. POPULAR COURSES SHOWCASE ── */}
      <section id="popular-courses" className="popular-courses-section">
        <div className="modern-section-header">
          <span className="section-pill-tag">
            <FiTrendingUp /> Handpicked for You
          </span>
          <h2>Most Popular &amp; Trending Courses</h2>
          <p>
            Enroll in top-rated curricula taught by verified mentors. Gain practical skills that employers are actively hiring for.
          </p>
        </div>

        {/* Category Filters Bar */}
        <div className="courses-filter-bar">
          {["All", "Web Development", "Programming", "Data Science", "Artificial Intelligence"].map(
            (tab) => (
              <button
                key={tab}
                type="button"
                className={`filter-tag-btn ${activeCategory === tab ? "active" : ""}`}
                onClick={() => setActiveCategory(tab)}
              >
                {tab}
              </button>
            )
          )}
        </div>

        {/* Courses Grid */}
        {filteredCourses.length === 0 ? (
          <div className="no-courses" style={{ padding: "60px 20px" }}>
            <FiBookOpen size={48} style={{ color: "#a5b4fc", marginBottom: 12 }} />
            <h3>No courses found in this category</h3>
            <p>Try switching categories or clearing your search term.</p>
          </div>
        ) : (
          <div className="course-grid" style={{ maxWidth: 1240, margin: "0 auto" }}>
            {filteredCourses.slice(0, 8).map((course) => (
              <CourseCard key={course.id || course._id} course={course} />
            ))}
          </div>
        )}

        <div className="view-all-courses-wrap">
          <Link to="/courses" className="btn-view-all-courses">
            View Complete Course Catalog ({coursesList.length} Courses) <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* ── 5. HOW IT WORKS (3-STEP STUDENT JOURNEY) ── */}
      <section className="steps-journey-section">
        <div className="modern-section-header">
          <span className="section-pill-tag">
            <FiZap /> Simple &amp; Effective
          </span>
          <h2>Your 3-Step Journey to Success</h2>
          <p>A proven roadmap designed to turn ambitious students into confident professionals.</p>
        </div>

        <div className="steps-journey-grid">
          <div className="step-card">
            <span className="step-badge-number">01</span>
            <div className="step-icon-wrap indigo">
              <FiCompass />
            </div>
            <h3>Choose Your Course</h3>
            <p>
              Select from beginner-friendly to master-level courses crafted with syllabus roadmaps, modules, and video lessons.
            </p>
          </div>

          <div className="step-card">
            <span className="step-badge-number">02</span>
            <div className="step-icon-wrap emerald">
              <FiPlay />
            </div>
            <h3>Learn with Interactive Labs</h3>
            <p>
              Watch video lectures at your own pace, take custom MCQ quizzes to validate understanding, and take study notes.
            </p>
          </div>

          <div className="step-card">
            <span className="step-badge-number">03</span>
            <div className="step-icon-wrap purple">
              <FiAward />
            </div>
            <h3>Earn Verified Credentials</h3>
            <p>
              Complete lessons, achieve 100% progress, and download official verifiable certificates to showcase on LinkedIn.
            </p>
          </div>
        </div>
      </section>

      {/* ── 6. WHY CHOOSE EDUSPHERE ── */}
      <section className="why-choose-section">
        <div className="modern-section-header">
          <span className="section-pill-tag">
            <FiShield /> Premium Learning Experience
          </span>
          <h2>Why Thousands of Students Choose EduSphere</h2>
          <p>We built EduSphere from the ground up to give learners the highest quality experience.</p>
        </div>

        <div className="why-choose-grid">
          <div className="why-card">
            <div className="why-icon violet">
              <FiUsers />
            </div>
            <h3>Industry Expert Faculty</h3>
            <p>Learn directly from software engineers and mentors who build real-world systems daily.</p>
          </div>

          <div className="why-card">
            <div className="why-icon blue">
              <FiClock />
            </div>
            <h3>Flexible Self-Paced Access</h3>
            <p>Lifetime access to enrolled courses. Revisit videos, quizzes, and notes whenever you want.</p>
          </div>

          <div className="why-card">
            <div className="why-icon amber">
              <FiShield />
            </div>
            <h3>Verified Curriculum</h3>
            <p>Admin-approved courses ensuring high pedagogical standards, zero spam, and current tech stacks.</p>
          </div>

          <div className="why-card">
            <div className="why-icon emerald">
              <FiDollarSign />
            </div>
            <h3>Transparent &amp; Affordable</h3>
            <p>One-time transparent pricing with instant digital tax receipts and zero hidden renewal fees.</p>
          </div>
        </div>
      </section>

      {/* ── 7. STUDENT SUCCESS STORIES ── */}
      <section className="testimonials-modern-section">
        <div className="modern-section-header">
          <span className="section-pill-tag">
            <FiStar /> Real Learner Testimonials
          </span>
          <h2>What Our Students Say</h2>
          <p>Read inspiring success stories from students who launched new careers through EduSphere.</p>
        </div>

        <div className="testimonials-modern-grid">
          {testimonials.map((item, i) => {
            const avatarColors = [
              "linear-gradient(135deg, #6366f1, #8b5cf6)",
              "linear-gradient(135deg, #0ea5e9, #0284c7)",
              "linear-gradient(135deg, #10b981, #059669)",
            ];

            const initials = item.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase();

            return (
              <div className="testimonial-card-modern" key={item.name}>
                <div className="testimonial-stars-row">
                  {[...Array(5)].map((_, idx) => (
                    <FiStar key={idx} fill="#f59e0b" />
                  ))}
                </div>
                <p className="testimonial-quote">"{item.text}"</p>
                <div className="testimonial-author-row">
                  <div
                    className="author-avatar-chip"
                    style={{ background: avatarColors[i % avatarColors.length] }}
                  >
                    {initials}
                  </div>
                  <div className="author-info">
                    <h4>{item.name}</h4>
                    <span>{item.role}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── 8. CONVERSION CALL TO ACTION BANNER ── */}
      <section className="modern-cta-section">
        <div className="cta-banner-card">
          <div className="cta-glow-backdrop" />
          <div className="cta-content-wrapper">
            <span className="cta-badge-tag">
              <FiAward /> Start Your Career Transformation
            </span>
            <h2>Ready to Master the Future of Technology?</h2>
            <p>
              Join thousands of students building real-world projects and acquiring skills that get noticed. Create your free account today.
            </p>
            <div className="cta-buttons-group">
              <Link to="/register" className="btn-cta-primary">
                Get Started Now <FiArrowRight />
              </Link>
              <Link to="/courses" className="btn-cta-outline">
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;