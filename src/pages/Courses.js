import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiGrid,
  FiList,
  FiBookOpen,
  FiUsers,
  FiStar,
  FiAward,
  FiHelpCircle,
  FiArrowRight,
} from "react-icons/fi";
import CourseCard from "../components/CourseCard";
import { courses as initialCourses, categories } from "../data/MockData";
import { useAuth } from "../context/AuthContext";
import "./Courses.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Courses() {
  const { user } = useAuth();
  const [coursesList, setCoursesList] = useState(initialCourses);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [sort, setSort] = useState("default");
  const [priceRange, setPriceRange] = useState("all");
  const [viewMode, setViewMode] = useState("grid");

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/courses`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.courses) && data.courses.length > 0) {
          const dbCourses = data.courses.map((c) => ({
            id: c._id,
            ...c,
          }));
          // Put DB courses first
          setCoursesList([...dbCourses, ...initialCourses]);
        }
      })
      .catch(() => {});
  }, []);

  // Get enrolled course IDs for the current logged-in student (visitors see all courses)
  const enrolledCourseIds = useMemo(() => {
    const ids = new Set();
    if (!user) return ids;

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
  }, [user]);

  // Exclude courses that the student is already enrolled in
  const availableCourses = useMemo(() => {
    return coursesList.filter((course) => !enrolledCourseIds.has(String(course.id || course._id)));
  }, [coursesList, enrolledCourseIds]);

  // Calculate counts for categories based on available courses
  const categoryCounts = useMemo(() => {
    const counts = { All: availableCourses.length };
    categories.forEach((cat) => {
      counts[cat] = availableCourses.filter((c) => c.category === cat).length;
    });
    return counts;
  }, [availableCourses]);

  // Filter and sort available courses
  const filteredCourses = useMemo(() => {
    let result = availableCourses.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(search.toLowerCase()) ||
        course.instructor.toLowerCase().includes(search.toLowerCase()) ||
        course.description.toLowerCase().includes(search.toLowerCase());

      const matchesCategory =
        category === "All" || course.category === category;

      let matchesPrice = true;
      if (priceRange === "under-2000") {
        matchesPrice = course.price < 2000;
      } else if (priceRange === "2000-3000") {
        matchesPrice = course.price >= 2000 && course.price <= 3000;
      } else if (priceRange === "above-3000") {
        matchesPrice = course.price > 3000;
      }

      return matchesSearch && matchesCategory && matchesPrice;
    });

    if (sort === "rating") {
      result.sort((a, b) => b.rating - a.rating);
    } else if (sort === "popular") {
      result.sort((a, b) => b.students - a.students);
    } else if (sort === "price-low") {
      result.sort((a, b) => a.price - b.price);
    } else if (sort === "price-high") {
      result.sort((a, b) => b.price - a.price);
    }

    return result;
  }, [availableCourses, search, category, sort, priceRange]);

  const resetAllFilters = () => {
    setSearch("");
    setCategory("All");
    setSort("default");
    setPriceRange("all");
  };

  const hasActiveFilters =
    search.trim() !== "" || category !== "All" || priceRange !== "all" || sort !== "default";

  return (
    <div className="courses-page">
      {/* Hero Header */}
      <section className="courses-hero">
        <span className="courses-badge">
          <FiBookOpen style={{ marginRight: 6, verticalAlign: "middle" }} />
          Industry-Leading Curricula
        </span>
        <h1>Explore All Courses</h1>
        <p>
          Master in-demand skills from industry veterans and software architects.
          Build real-world projects and earn verified career credentials.
        </p>

        <div className="courses-hero-stats">
          <div className="hero-stat-pill">
            <FiBookOpen />
            <span>17+ Professional Courses</span>
          </div>
          <div className="hero-stat-pill">
            <FiUsers />
            <span>128K+ Students Enrolled</span>
          </div>
          <div className="hero-stat-pill">
            <FiStar />
            <span>4.8 ★ Learner Satisfaction</span>
          </div>
          <div className="hero-stat-pill">
            <FiAward />
            <span>Verified Certificates</span>
          </div>
        </div>
      </section>

      {/* Main Container */}
      <div className="courses-container">
        {/* Horizontal Category Chips */}
        <div className="category-chips-bar">
          <button
            type="button"
            className={`category-chip ${category === "All" ? "active" : ""}`}
            onClick={() => setCategory("All")}
          >
            <span>All Courses</span>
            <span className="chip-count">{categoryCounts["All"] || 0}</span>
          </button>

          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              className={`category-chip ${category === cat ? "active" : ""}`}
              onClick={() => setCategory(cat)}
            >
              <span>{cat}</span>
              <span className="chip-count">{categoryCounts[cat] || 0}</span>
            </button>
          ))}
        </div>

        {/* Filter & Search Toolbar */}
        <div className="courses-toolbar">
          {/* Search Input */}
          <div className="toolbar-search-wrap">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by course title, topic, or instructor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                className="clear-btn"
                onClick={() => setSearch("")}
                aria-label="Clear search"
              >
                <FiX />
              </button>
            )}
          </div>

          {/* Group of Dropdown Filters */}
          <div className="toolbar-filters-group">
            {/* Category Dropdown (for mobile/tablet) */}
            <select
              className="filter-select"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              aria-label="Filter by category"
            >
              <option value="All">All Categories</option>
              {categories.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>

            {/* Price Filter */}
            <select
              className="filter-select"
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              aria-label="Filter by price"
            >
              <option value="all">All Prices</option>
              <option value="under-2000">Under ₹2,000</option>
              <option value="2000-3000">₹2,000 – ₹3,000</option>
              <option value="above-3000">Above ₹3,000</option>
            </select>

            {/* Sort Options */}
            <select
              className="filter-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              aria-label="Sort courses"
            >
              <option value="default">Sort: Recommended</option>
              <option value="rating">Highest Rated</option>
              <option value="popular">Most Popular</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>

            {/* View Mode Toggle */}
            <div className="view-mode-toggle">
              <button
                type="button"
                className={`view-btn ${viewMode === "grid" ? "active" : ""}`}
                onClick={() => setViewMode("grid")}
                title="Grid View"
                aria-label="Grid View"
              >
                <FiGrid />
              </button>
              <button
                type="button"
                className={`view-btn ${viewMode === "list" ? "active" : ""}`}
                onClick={() => setViewMode("list")}
                title="List View"
                aria-label="List View"
              >
                <FiList />
              </button>
            </div>
          </div>
        </div>

        {/* Results Status & Active Filter Tags Bar */}
        <div className="results-status-bar">
          <div className="results-count">
            Showing <strong>{filteredCourses.length}</strong> of{" "}
            <strong>{availableCourses.length}</strong> available courses
            {enrolledCourseIds.size > 0 && (
              <span className="enrolled-filter-badge" style={{ marginLeft: "10px", fontSize: "12px", color: "#16a34a", background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "3px 10px", borderRadius: "12px", fontWeight: "600" }}>
                ✓ {enrolledCourseIds.size} enrolled course{enrolledCourseIds.size > 1 ? "s" : ""} hidden
              </span>
            )}
          </div>

          {hasActiveFilters && (
            <div className="active-filter-tags">
              {search && (
                <span className="filter-tag">
                  Keyword: "{search}"
                  <button type="button" onClick={() => setSearch("")}>
                    <FiX />
                  </button>
                </span>
              )}

              {category !== "All" && (
                <span className="filter-tag">
                  Category: {category}
                  <button type="button" onClick={() => setCategory("All")}>
                    <FiX />
                  </button>
                </span>
              )}

              {priceRange !== "all" && (
                <span className="filter-tag">
                  Price: {priceRange}
                  <button type="button" onClick={() => setPriceRange("all")}>
                    <FiX />
                  </button>
                </span>
              )}

              <button
                type="button"
                className="clear-all-link"
                onClick={resetAllFilters}
              >
                Reset all filters
              </button>
            </div>
          )}
        </div>

        {/* Courses Display (Grid or List) */}
        {filteredCourses.length > 0 ? (
          <div
            className={
              viewMode === "list" ? "course-list-view" : "course-grid-view"
            }
          >
            {filteredCourses.map((course) => (
              <CourseCard
                key={course.id}
                course={course}
                layout={viewMode}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="courses-empty-card">
            <div className="empty-icon-box">
              <FiSearch />
            </div>
            {enrolledCourseIds.size > 0 && availableCourses.length === 0 ? (
              <>
                <h3>You are enrolled in all available courses! 🎉</h3>
                <p>
                  You've already enrolled in every course we offer. Visit your student dashboard or My Courses to continue learning.
                </p>
                <Link to="/student/courses" className="empty-reset-btn" style={{ textDecoration: "none", display: "inline-block" }}>
                  Go to My Courses
                </Link>
              </>
            ) : (
              <>
                <h3>No courses match your criteria</h3>
                <p>
                  We couldn't find any courses matching your current filters. Try
                  adjusting your keywords or reset your filters to explore all topics.
                </p>
                <button
                  type="button"
                  className="empty-reset-btn"
                  onClick={resetAllFilters}
                >
                  Reset All Filters
                </button>
              </>
            )}
          </div>
        )}

        {/* Bottom Mentorship / Advisory Banner */}
        <div className="courses-advisory-banner">
          <div className="advisory-text">
            <h3>Need Guidance on What to Study First?</h3>
            <p>
              Our academic advisors and lead instructors are here to help you
              tailor a personalized learning syllabus aligned with your career goals.
            </p>
          </div>
          <div className="advisory-action">
            <Link to="/contact" className="btn-contact">
              <FiHelpCircle />
              <span>Talk to an Advisor</span>
              <FiArrowRight />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Courses;