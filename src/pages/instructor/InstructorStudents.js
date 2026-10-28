import React, { useState, useEffect, useCallback } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  FiUsers,
  FiMessageSquare,
  FiCheckCircle,
  FiClock,
  FiSend,
  FiSearch,
  FiFilter,
  FiTrash2,
  FiBookOpen,
  FiRefreshCw,
  FiHelpCircle,
  FiAlertCircle,
  FiCheck,
} from "react-icons/fi";
import "./InstructorStudents.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function InstructorStudents() {
  const { user } = useAuth();
  const instructorId = user?._id || user?.id || "";
  const instructorName = user?.name || "Instructor";

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all"); // all, pending, answered
  const [searchQuery, setSearchQuery] = useState("");
  const [replyTextMap, setReplyTextMap] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [alertMsg, setAlertMsg] = useState("");

  // Fetch Q&A for this instructor
  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    try {
      let url = `${API_BASE_URL}/api/qna`;
      const params = new URLSearchParams();
      if (instructorId) {
        params.append("instructorId", instructorId);
      }
      if (instructorName && instructorName !== "Instructor") {
        params.append("instructorName", instructorName);
      }
      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const res = await fetch(url);
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      } else {
        // Check local storage for mock/demo
        loadLocalInquiries();
      }
    } catch (err) {
      console.warn("Could not fetch inquiries from API, using fallback:", err);
      loadLocalInquiries();
    } finally {
      setLoading(false);
    }
  }, [instructorId, instructorName]);

  const loadLocalInquiries = () => {
    // Scan localStorage for any qna_course_* items
    const all = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith("qna_course_")) {
        try {
          const list = JSON.parse(localStorage.getItem(key) || "[]");
          if (Array.isArray(list)) all.push(...list);
        } catch (_) {}
      }
    }
    setQuestions(all);
  };

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  // Reply submission
  const handleReplySubmit = async (questionId) => {
    const text = replyTextMap[questionId];
    if (!text || !text.trim()) return;

    setSubmittingId(questionId);
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna/${questionId}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: instructorId,
          authorName: instructorName,
          authorRole: "instructor",
          answerText: text.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.question) {
        setQuestions((prev) =>
          prev.map((q) => (q._id === questionId || q.id === questionId ? data.question : q))
        );
        setReplyTextMap((prev) => ({ ...prev, [questionId]: "" }));
        setAlertMsg("Reply posted successfully to student!");
        setTimeout(() => setAlertMsg(""), 3500);
      } else {
        throw new Error(data.message || "Failed to post reply.");
      }
    } catch (err) {
      // Local fallback
      const updated = questions.map((q) => {
        if (q._id === questionId || q.id === questionId) {
          const newAns = {
            authorId: instructorId,
            authorName: instructorName,
            authorRole: "instructor",
            answerText: text.trim(),
            createdAt: new Date().toISOString(),
          };
          const answers = [...(q.answers || []), newAns];
          return { ...q, status: "answered", answers };
        }
        return q;
      });

      setQuestions(updated);
      setReplyTextMap((prev) => ({ ...prev, [questionId]: "" }));
      setAlertMsg("Reply saved successfully!");
      setTimeout(() => setAlertMsg(""), 3500);
    } finally {
      setSubmittingId(null);
    }
  };

  // Delete question
  const handleDelete = async (questionId) => {
    if (!window.confirm("Are you sure you want to delete this question?")) return;
    try {
      await fetch(`${API_BASE_URL}/api/qna/${questionId}`, { method: "DELETE" });
    } catch (_) {}
    setQuestions((prev) => prev.filter((q) => (q._id || q.id) !== questionId));
  };

  // Filtered list
  const filteredQuestions = questions.filter((q) => {
    const matchesFilter =
      filterStatus === "all"
        ? true
        : filterStatus === "pending"
        ? q.status !== "answered" && (!q.answers || q.answers.length === 0)
        : q.status === "answered" || (q.answers && q.answers.length > 0);

    const matchesSearch =
      !searchQuery.trim() ||
      (q.title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.question || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.studentName || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (q.courseTitle || "").toLowerCase().includes(searchQuery.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  const pendingCount = questions.filter(
    (q) => q.status !== "answered" && (!q.answers || q.answers.length === 0)
  ).length;

  return (
    <div className="dashboard-layout">
      <Sidebar instructor />

      <div className="dashboard-content">
        {/* Top Header */}
        <div className="instructor-students-header">
          <div>
            <h1>Students &amp; Q&amp;A Hub</h1>
            <p>Answer student questions, clarify lesson doubts, and support your enrolled learners.</p>
          </div>
          <button className="btn-refresh-inquiries" onClick={fetchInquiries}>
            <FiRefreshCw /> Refresh List
          </button>
        </div>

        {alertMsg && (
          <div className="instructor-qna-toast">
            <FiCheckCircle /> {alertMsg}
          </div>
        )}

        {/* Stats Row */}
        <div className="qna-stats-cards">
          <div className="qna-stat-card">
            <div className="stat-icon-wrap total">
              <FiMessageSquare />
            </div>
            <div>
              <h3>{questions.length}</h3>
              <p>Total Questions</p>
            </div>
          </div>

          <div className="qna-stat-card">
            <div className="stat-icon-wrap pending">
              <FiClock />
            </div>
            <div>
              <h3>{pendingCount}</h3>
              <p>Awaiting Your Reply</p>
            </div>
          </div>

          <div className="qna-stat-card">
            <div className="stat-icon-wrap resolved">
              <FiCheckCircle />
            </div>
            <div>
              <h3>{questions.length - pendingCount}</h3>
              <p>Answered &amp; Resolved</p>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="qna-controls-bar">
          <div className="qna-search-box">
            <FiSearch />
            <input
              type="text"
              placeholder="Search by student, course, or question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="qna-filter-tabs">
            <button
              className={`filter-tab ${filterStatus === "all" ? "active" : ""}`}
              onClick={() => setFilterStatus("all")}
            >
              All ({questions.length})
            </button>
            <button
              className={`filter-tab ${filterStatus === "pending" ? "active" : ""}`}
              onClick={() => setFilterStatus("pending")}
            >
              Needs Reply ({pendingCount})
            </button>
            <button
              className={`filter-tab ${filterStatus === "answered" ? "active" : ""}`}
              onClick={() => setFilterStatus("answered")}
            >
              Answered ({questions.length - pendingCount})
            </button>
          </div>
        </div>

        {/* Inquiries List */}
        <div className="instructor-inquiries-feed">
          {loading ? (
            <div className="inquiries-loading">Loading student questions...</div>
          ) : filteredQuestions.length === 0 ? (
            <div className="inquiries-empty">
              <FiHelpCircle size={44} />
              <h3>No questions found</h3>
              <p>
                {searchQuery || filterStatus !== "all"
                  ? "Try resetting your search filter."
                  : "Students have not asked any questions in your courses yet."}
              </p>
            </div>
          ) : (
            filteredQuestions.map((q) => {
              const qId = q._id || q.id;
              const isAnswered =
                q.status === "answered" || (q.answers && q.answers.length > 0);

              return (
                <div
                  key={qId}
                  className={`instructor-question-card ${
                    isAnswered ? "resolved-card" : "pending-card"
                  }`}
                >
                  <div className="inquiry-card-header">
                    <div className="inquiry-main-info">
                      <div className="inquiry-badges">
                        <span
                          className={`inquiry-status-pill ${
                            isAnswered ? "answered-pill" : "pending-pill"
                          }`}
                        >
                          {isAnswered ? (
                            <>
                              <FiCheck /> Answered
                            </>
                          ) : (
                            <>
                              <FiClock /> Needs Reply
                            </>
                          )}
                        </span>
                        <span className="inquiry-course-badge">
                          <FiBookOpen /> {q.courseTitle || "Course"}
                        </span>
                        {q.lessonTitle && (
                          <span className="inquiry-lesson-badge">
                            Lesson: {q.lessonTitle}
                          </span>
                        )}
                      </div>
                      <h3 className="inquiry-title">{q.title}</h3>
                    </div>

                    <button
                      className="btn-delete-inquiry"
                      title="Delete question"
                      onClick={() => handleDelete(qId)}
                    >
                      <FiTrash2 />
                    </button>
                  </div>

                  <p className="inquiry-question-content">{q.question}</p>

                  <div className="inquiry-student-meta">
                    <span className="student-name-tag">
                      <strong>Asked by:</strong> {q.studentName || "Student"}
                    </span>
                    {q.studentEmail && (
                      <span className="student-email-tag">({q.studentEmail})</span>
                    )}
                    <span className="inquiry-date">
                      {new Date(q.createdAt || Date.now()).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>

                  {/* Previous Answers */}
                  {q.answers && q.answers.length > 0 && (
                    <div className="inquiry-existing-answers">
                      <h4>Previous Answers ({q.answers.length})</h4>
                      {q.answers.map((ans, idx) => (
                        <div key={idx} className="instructor-ans-bubble">
                          <div className="ans-bubble-head">
                            <span className="ans-author">
                              👨‍🏫 {ans.authorName || instructorName} (Instructor)
                            </span>
                            <span className="ans-time">
                              {new Date(ans.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <p>{ans.answerText}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Instructor Reply Form */}
                  <div className="instructor-reply-section">
                    <label>
                      {isAnswered ? "Post an additional reply / follow-up:" : "Write your response:"}
                    </label>
                    <div className="reply-input-wrap">
                      <textarea
                        rows={3}
                        placeholder={`Reply directly to ${q.studentName || "the student"}...`}
                        value={replyTextMap[qId] || ""}
                        onChange={(e) =>
                          setReplyTextMap((prev) => ({
                            ...prev,
                            [qId]: e.target.value,
                          }))
                        }
                      />
                      <button
                        className="btn-post-reply"
                        disabled={submittingId === qId || !replyTextMap[qId]?.trim()}
                        onClick={() => handleReplySubmit(qId)}
                      >
                        <FiSend /> {submittingId === qId ? "Sending..." : "Send Reply"}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default InstructorStudents;
