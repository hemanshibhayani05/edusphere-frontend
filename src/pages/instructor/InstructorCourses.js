import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiSearch,
  FiStar,
  FiUsers,
  FiClock,
  FiPlus,
  FiPackage,
  FiRefreshCw,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import "./InstructorDashboard.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function InstructorCourses() {
  const { user } = useAuth();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const instructorId = user?._id || user?.id || "";
  const instructorName = user?.name || "Instructor";

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
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
            setCourses(data.courses);
          } else if (instructorName && instructorName !== "Instructor") {
            const res2 = await fetch(
              `${API_BASE_URL}/api/courses?instructor=${encodeURIComponent(instructorName)}`
            );
            const data2 = await res2.json();
            if (data2.success && Array.isArray(data2.courses)) {
              setCourses(data2.courses);
            } else {
              setCourses([]);
            }
          } else {
            setCourses([]);
          }
        }
      } catch (err) {
        console.error("Failed to load instructor courses:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, [instructorId, instructorName]);

  const filteredCourses = courses.filter((course) => {
    const titleMatch = (course.title || "").toLowerCase().includes(searchTerm.toLowerCase());
    const descMatch = (course.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSearch = titleMatch || descMatch;
    const matchesCategory =
      selectedCategory === "All" || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="instructor-dashboard-page">
      <Sidebar instructor />

      <main className="instructor-main">
        <div
          className="instructor-hero-banner"
          style={{ padding: "26px 32px", marginBottom: 24 }}
        >
          <div className="instructor-hero-text">
            <h1>My Courses &amp; Curricula</h1>
            <p>
              Courses published by <strong>{instructorName}</strong> on the platform.
            </p>
          </div>
          <div className="instructor-hero-actions">
            <Link to="/instructor/dashboard" className="inst-btn primary">
              <FiPlus /> Add New Course
            </Link>
          </div>
        </div>

        {/* Filter Bar */}
        <div
          style={{
            display: "flex",
            gap: 16,
            marginBottom: 24,
            flexWrap: "wrap",
          }}
        >
          <div style={{ flex: 1, minWidth: 260, position: "relative" }}>
            <input
              type="text"
              placeholder="Search in your courses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: "100%",
                padding: "12px 14px 12px 38px",
                borderRadius: 10,
                border: "1px solid #d1d5db",
                outline: "none",
                background: "#ffffff",
              }}
            />
            <FiSearch
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "#9ca3af",
              }}
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            style={{
              padding: "12px 16px",
              borderRadius: 10,
              border: "1px solid #d1d5db",
              background: "#ffffff",
              outline: "none",
            }}
          >
            <option value="All">All Categories</option>
            <option value="Web Development">Web Development</option>
            <option value="Programming">Programming</option>
            <option value="Data Science">Data Science</option>
            <option value="Machine Learning">Machine Learning</option>
            <option value="Artificial Intelligence">Artificial Intelligence</option>
            <option value="Database">Database</option>
            <option value="Cloud Computing">Cloud Computing</option>
          </select>
        </div>

        {/* Course Cards Grid */}
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "#64748b" }}>
            <FiRefreshCw className="spinning" style={{ fontSize: 24, marginBottom: 10 }} />
            <p>Loading your courses from database...</p>
          </div>
        ) : filteredCourses.length === 0 ? (
          <div className="empty-courses-state" style={{ background: "#ffffff", borderRadius: 16, border: "1px solid #e2e8f0" }}>
            <div className="empty-icon-wrap">
              <FiPackage />
            </div>
            <h3>No courses found</h3>
            <p>
              {searchTerm || selectedCategory !== "All"
                ? "No courses matched your current filter criteria."
                : "You haven't put any courses into the database yet."}
            </p>
            <Link
              to="/instructor/dashboard"
              className="inst-btn primary empty-cta"
              style={{ display: "inline-flex" }}
            >
              <FiPlus /> Add Course Now
            </Link>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 24,
            }}
          >
            {filteredCourses.map((course) => {
              const cId = course._id || course.id;
              return (
                <div
                  key={cId}
                  style={{
                    background: "#ffffff",
                    borderRadius: 16,
                    overflow: "hidden",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <img
                    src={
                      course.image ||
                      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3"
                    }
                    alt={course.title}
                    style={{ width: "100%", height: 180, objectFit: "cover" }}
                    onError={(e) => {
                      e.target.src =
                        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
                    }}
                  />
                  <div
                    style={{
                      padding: 20,
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: "#059669",
                        background: "#ecfdf5",
                        padding: "3px 10px",
                        borderRadius: 9999,
                        width: "fit-content",
                        marginBottom: 10,
                      }}
                    >
                      {course.category}
                    </span>
                    <h3
                      style={{
                        fontSize: 17,
                        marginBottom: 8,
                        color: "#111827",
                      }}
                    >
                      {course.title}
                    </h3>
                    <p
                      style={{
                        color: "#64748b",
                        fontSize: 13,
                        marginBottom: 16,
                        flex: 1,
                      }}
                    >
                      {course.description}
                    </p>

                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        paddingTop: 14,
                        borderTop: "1px solid #f1f5f9",
                        fontSize: 13,
                        color: "#475569",
                      }}
                    >
                      <span>
                        <FiUsers
                          style={{ marginRight: 4, verticalAlign: "middle" }}
                        />
                        {(course.students || 0).toLocaleString()}
                      </span>
                      <span>
                        <FiClock
                          style={{ marginRight: 4, verticalAlign: "middle" }}
                        />
                        {course.duration}
                      </span>
                      <span style={{ color: "#ca8a04", fontWeight: 700 }}>
                        <FiStar
                          style={{ marginRight: 3, verticalAlign: "middle" }}
                        />
                        {course.rating || "5.0"}
                      </span>
                    </div>

                    <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
                      <Link
                        to={`/courses/${cId}`}
                        className="inst-btn secondary"
                        style={{
                          flex: 1,
                          justifyContent: "center",
                          color: "#374151",
                          borderColor: "#d1d5db",
                          padding: "8px 12px",
                          fontSize: 13,
                        }}
                      >
                        Preview
                      </Link>
                      <Link
                        to="/instructor/dashboard"
                        className="inst-btn primary"
                        style={{
                          flex: 1,
                          justifyContent: "center",
                          background: "#059669",
                          color: "#ffffff",
                          padding: "8px 12px",
                          fontSize: 13,
                        }}
                      >
                        Manage
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default InstructorCourses;
