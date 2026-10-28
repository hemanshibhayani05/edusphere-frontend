import React from "react";
import { Link } from "react-router-dom";
import { FiStar, FiUsers, FiClock, FiArrowRight } from "react-icons/fi";

function CourseCard({ course, layout = "grid" }) {
  // Extract instructor initials (e.g. "Ananya Sharma" -> "AS")
  const getInitials = (name = "") => {
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase() || "ED";
  };

  const isList = layout === "list";

  return (
    <div className={`enhanced-course-card ${isList ? "list-mode" : ""}`}>
      {/* Media Image Wrap */}
      <div className="card-media-wrap">
        <img
          src={course.image}
          alt={course.title}
          onError={(e) => {
            e.target.src =
              "https://images.unsplash.com/photo-1516321318423-f06f85e504b3";
          }}
        />
        <span className="media-badge-top-left">{course.category}</span>
        {course.duration && (
          <span className="media-badge-top-right">
            <FiClock /> {course.duration}
          </span>
        )}
      </div>

      {/* Content Body */}
      <div className="card-content">
        {/* Instructor Row */}
        <div className="card-instructor-row">
          <div className="instructor-mini-avatar">
            {getInitials(course.instructor)}
          </div>
          <span className="instructor-mini-name">{course.instructor}</span>
        </div>

        {/* Title */}
        <h3 className="card-title">
          <Link to={`/courses/${course.id}`}>{course.title}</Link>
        </h3>

        {/* Description */}
        <p className="card-description">{course.description}</p>

        {/* In list mode, show modules preview */}
        {isList && course.modules && course.modules.length > 0 && (
          <div className="list-modules-row">
            {course.modules.slice(0, 4).map((mod, idx) => (
              <span key={idx} className="module-pill">
                &bull; {typeof mod === "string" ? mod : mod?.title || `Module ${idx + 1}`}
              </span>
            ))}
            {course.modules.length > 4 && (
              <span className="module-pill">
                +{course.modules.length - 4} more
              </span>
            )}
          </div>
        )}

        {/* Metrics Row */}
        <div className="card-metrics-row">
          <div className="metric-rating">
            <FiStar />
            <span>{course.rating}</span>
          </div>

          <div className="metric-students">
            <FiUsers />
            <span>{course.students ? course.students.toLocaleString() : "1,200+"} learners</span>
          </div>
        </div>

        {/* Bottom Price & CTA */}
        <div className="card-bottom-row">
          <div className="card-price-block">
            <span className="price-label">Lifetime Access</span>
            <span className="price-val">₹{course.price ? course.price.toLocaleString() : "1,999"}</span>
          </div>

          <Link to={`/courses/${course.id}`} className="card-action-btn">
            <span>View Course</span>
            <FiArrowRight />
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CourseCard;