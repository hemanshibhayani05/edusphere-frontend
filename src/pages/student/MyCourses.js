import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import {
  FiPlayCircle,
  FiCheckCircle,
  FiBookOpen,
  FiUser,
  FiClock,
} from "react-icons/fi";
import "./MyCourse.css";

const MyCourses = () => {
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState([]);

  useEffect(() => {
    // Try new multi-enrollment list first
    try {
      const list = JSON.parse(
        localStorage.getItem("edusphere_enrollments") || "[]"
      );
      if (list.length > 0) {
        setEnrollments(list);
        return;
      }
    } catch (_) {}

    // Fallback to legacy single enrollment
    try {
      const saved = localStorage.getItem("enrollment");
      if (saved) setEnrollments([JSON.parse(saved)]);
    } catch (_) {}
  }, []);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-heading">
          <h1>My Courses</h1>
          <p>Continue your learning journey.</p>
        </div>

        {enrollments.length === 0 ? (
          <div className="empty-courses">
            <FiBookOpen size={50} />
            <h2>No Courses Yet</h2>
            <p>
              You haven't enrolled in any courses yet.
              Explore our courses and start learning.
            </p>
            <button className="btn" onClick={() => navigate("/courses")}>
              Browse Courses
            </button>
          </div>
        ) : (
          <div className="my-course-grid">
            {enrollments.map((enrollment) => {
              const progress = enrollment?.progress || 0;
              return (
                <div className="my-course-card" key={enrollment.courseId}>
                  {/* Course Image */}
                  <div className="my-course-image">
                    <img src={enrollment.image} alt={enrollment.courseTitle} />
                    {progress === 100 && (
                      <span className="course-status-badge badge-completed">
                        <FiCheckCircle size={10} /> Completed
                      </span>
                    )}
                  </div>

                  {/* Course Information */}
                  <div className="my-course-body">
                    <h2>{enrollment.courseTitle}</h2>

                    <div className="my-course-meta">
                      {enrollment.instructor && (
                        <span>
                          <FiUser size={12} /> {enrollment.instructor}
                        </span>
                      )}
                      {enrollment.duration && (
                        <span>
                          <FiClock size={12} /> {enrollment.duration}
                        </span>
                      )}
                    </div>

                    {/* Progress */}
                    <div className="progress-section">
                      <div className="progress-header">
                        <span>Course Progress</span>
                        <strong>{progress}%</strong>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="progress-text">
                        {progress === 100
                          ? "Course Completed 🎉"
                          : progress > 0
                          ? `${progress}% completed`
                          : "Keep learning to complete this course!"}
                      </p>
                    </div>

                    {/* Button */}
                    {progress === 100 ? (
                      <button
                        className="completed-btn"
                        onClick={() => navigate("/student/certificates")}
                      >
                        <FiCheckCircle size={14} /> View Certificate
                      </button>
                    ) : (
                      <button
                        className="continue-btn"
                        onClick={() =>
                          navigate(`/student/learn/${enrollment.courseId}`)
                        }
                      >
                        <FiPlayCircle size={14} /> Start Learning
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default MyCourses;