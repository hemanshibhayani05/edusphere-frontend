import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiAward,
  FiDownload,
  FiX,
  FiBookOpen,
  FiCalendar,
  FiUser,
  FiCheckCircle,
  FiShare2,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import "./Certificates.css";

function Certificates() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completedCourses, setCompletedCourses] = useState([]);
  const [selectedCert, setSelectedCert] = useState(null);
  const certRef = useRef(null);

  useEffect(() => {
    try {
      let enrollments = JSON.parse(
        localStorage.getItem("edusphere_enrollments") || "[]"
      );

      // Fallback to legacy single enrollment
      if (enrollments.length === 0) {
        const legacy = localStorage.getItem("enrollment");
        if (legacy) {
          enrollments = [JSON.parse(legacy)];
        }
      }

      // Filter only completed courses (progress >= 100)
      const completed = enrollments.filter((e) => (e.progress || 0) >= 100);
      setCompletedCourses(completed);
    } catch (_) {}
  }, []);

  const generateCertId = (courseId, enrolledAt) => {
    const hash = btoa(`${courseId}-${enrolledAt || Date.now()}`).slice(0, 12);
    return `EDUSPH-${hash.toUpperCase()}`;
  };

  const getCompletionDate = (enrollment) => {
    // Use enrolledAt as base, assume completion is recent
    if (enrollment.completedAt) {
      return new Date(enrollment.completedAt).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    return new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const handleDownload = () => {
    if (!certRef.current) return;
    // Use browser print to generate PDF
    const printWindow = window.open("", "_blank");
    const certHtml = certRef.current.innerHTML;
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificate - ${selectedCert.courseTitle}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700;800&family=Inter:wght@400;500;600;700&display=swap');
            body { margin: 0; padding: 20px; font-family: 'Inter', sans-serif; }
            .cert-document { 
              width: 900px; margin: 0 auto; padding: 60px;
              border: 3px solid #6366f1; border-radius: 12px;
              background: linear-gradient(135deg, #fafbff 0%, #f5f3ff 50%, #eef2ff 100%);
              position: relative; overflow: hidden;
            }
            .cert-watermark {
              position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
              font-size: 200px; font-weight: 800; color: rgba(99,102,241,0.04);
              font-family: 'Playfair Display', serif; pointer-events: none;
            }
            .cert-header { text-align: center; margin-bottom: 40px; position: relative; z-index: 1; }
            .cert-logo-text { font-size: 28px; font-weight: 800; color: #4f46e5;
              font-family: 'Playfair Display', serif; letter-spacing: 2px; }
            .cert-title { font-size: 42px; font-weight: 700; color: #1e293b;
              font-family: 'Playfair Display', serif; margin: 20px 0 8px; }
            .cert-subtitle { font-size: 16px; color: #64748b; }
            .cert-body { text-align: center; position: relative; z-index: 1; }
            .cert-presented { font-size: 14px; color: #94a3b8; text-transform: uppercase;
              letter-spacing: 3px; margin-bottom: 12px; }
            .cert-student-name { font-size: 36px; font-weight: 700; color: #4f46e5;
              font-family: 'Playfair Display', serif; margin-bottom: 20px;
              border-bottom: 2px solid #c7d2fe; display: inline-block; padding-bottom: 8px; }
            .cert-desc { font-size: 16px; color: #475569; max-width: 600px;
              margin: 0 auto 12px; line-height: 1.7; }
            .cert-course-name { font-size: 22px; font-weight: 700; color: #1e293b;
              margin: 20px 0; }
            .cert-footer { display: flex; justify-content: space-between; align-items: flex-end;
              margin-top: 50px; padding-top: 30px; border-top: 1px solid #e0e7ff;
              position: relative; z-index: 1; }
            .cert-footer-col { text-align: center; }
            .cert-footer-label { font-size: 11px; color: #94a3b8; text-transform: uppercase;
              letter-spacing: 1px; margin-bottom: 6px; }
            .cert-footer-value { font-size: 14px; color: #1e293b; font-weight: 600; }
            .cert-seal { width: 70px; height: 70px; border-radius: 50%;
              background: linear-gradient(135deg, #6366f1, #4f46e5);
              display: flex; align-items: center; justify-content: center;
              color: white; font-size: 28px; margin: 0 auto; }
            @media print {
              body { padding: 0; }
              .cert-document { border: 3px solid #6366f1; box-shadow: none; }
            }
          </style>
        </head>
        <body>${certHtml}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 500);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-heading">
          <h1>My Certificates</h1>
          <p>Certificates you have earned by completing courses.</p>
        </div>

        {completedCourses.length === 0 ? (
          <div className="cert-empty-state">
            <div className="cert-empty-icon">
              <FiAward size={52} />
            </div>
            <h3>No Certificates Yet</h3>
            <p>
              Complete a course to earn your certificate. Keep learning and
              your certificates will appear here!
            </p>
            <button
              className="cert-explore-btn"
              onClick={() => navigate("/student/courses")}
            >
              <FiBookOpen /> Go to My Courses
            </button>
          </div>
        ) : (
          <div className="cert-grid">
            {completedCourses.map((course, idx) => {
              const certId = generateCertId(course.courseId, course.enrolledAt);
              const completionDate = getCompletionDate(course);

              return (
                <div className="cert-card" key={course.courseId || idx}>
                  {/* Mini Certificate Preview */}
                  <div className="cert-card-preview">
                    <div className="cert-card-border">
                      <div className="cert-card-seal">
                        <FiAward size={28} />
                      </div>
                      <p className="cert-card-label">Certificate of Completion</p>
                      <h3 className="cert-card-name">{user?.name || "Student"}</h3>
                      <div className="cert-card-divider" />
                      <p className="cert-card-course">{course.courseTitle}</p>
                    </div>
                  </div>

                  {/* Card Info */}
                  <div className="cert-card-body">
                    <div className="cert-card-meta">
                      <span>
                        <FiCalendar size={13} /> {completionDate}
                      </span>
                      <span>
                        <FiCheckCircle size={13} /> Completed
                      </span>
                    </div>
                    {course.instructor && (
                      <p className="cert-card-instructor">
                        <FiUser size={13} /> Instructor: {course.instructor}
                      </p>
                    )}
                    <p className="cert-card-id">ID: {certId}</p>

                    <button
                      className="cert-view-btn"
                      onClick={() =>
                        setSelectedCert({
                          ...course,
                          certId,
                          completionDate,
                        })
                      }
                    >
                      <FiAward /> View Certificate
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Certificate Modal ── */}
        {selectedCert && (
          <div className="cert-modal-overlay" onClick={() => setSelectedCert(null)}>
            <div
              className="cert-modal"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="cert-modal-header">
                <h2>Certificate of Completion</h2>
                <div className="cert-modal-actions">
                  <button
                    className="cert-download-btn"
                    onClick={handleDownload}
                  >
                    <FiDownload /> Download  Certificate
                  </button>
                  <button
                    className="cert-close-btn"
                    onClick={() => setSelectedCert(null)}
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              {/* Certificate Document */}
              <div className="cert-document-wrap" ref={certRef}>
                <div className="cert-document">
                  <div className="cert-watermark">E</div>

                  {/* Header */}
                  <div className="cert-header">
                    <p className="cert-logo-text">EduSphere</p>
                    <h1 className="cert-title">Certificate of Completion</h1>
                    <p className="cert-subtitle">
                      This is to certify that
                    </p>
                  </div>

                  {/* Body */}
                  <div className="cert-body">
                    <p className="cert-presented">Proudly Presented To</p>
                    <h2 className="cert-student-name">
                      {user?.name || "Student"}
                    </h2>
                    <p className="cert-desc">
                      has successfully completed the course
                    </p>
                    <h3 className="cert-course-name">
                      "{selectedCert.courseTitle}"
                    </h3>
                    <p className="cert-desc">
                      {selectedCert.instructor &&
                        `taught by ${selectedCert.instructor}, `}
                      demonstrating dedication and commitment to learning.
                      {selectedCert.duration &&
                        ` The course comprised ${selectedCert.duration} of content.`}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="cert-footer">
                    <div className="cert-footer-col">
                      <p className="cert-footer-label">Date of Completion</p>
                      <p className="cert-footer-value">
                        {selectedCert.completionDate}
                      </p>
                    </div>

                    <div className="cert-footer-col">
                      <div className="cert-seal">🏆</div>
                    </div>

                    <div className="cert-footer-col">
                      <p className="cert-footer-label">Certificate ID</p>
                      <p className="cert-footer-value">
                        {selectedCert.certId}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Certificates;
