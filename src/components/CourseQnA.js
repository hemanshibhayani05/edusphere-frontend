import React, { useState, useEffect } from "react";
import {
  FiMessageSquare,
  FiSend,
  FiCheckCircle,
  FiClock,
  FiUser,
  FiChevronDown,
  FiChevronUp,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./CourseQnA.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function CourseQnA({ course, currentLesson }) {
  const { user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAskForm, setShowAskForm] = useState(false);
  const [title, setTitle] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [expandedId, setExpandedId] = useState(null);

  const courseId = course?._id || course?.id;

  // Fetch Q&A questions for this course
  const fetchQuestions = async () => {
    if (!courseId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/qna?courseId=${courseId}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.questions)) {
        setQuestions(data.questions);
      }
    } catch (err) {
      console.warn("Could not fetch Q&A questions from API, loading local fallback:", err);
      // Fallback to local storage if offline or api fails
      const local = JSON.parse(localStorage.getItem(`qna_course_${courseId}`) || "[]");
      setQuestions(local);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, [courseId]);

  const handleAskSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !questionText.trim()) return;

    setSubmitting(true);
    setMsg("");

    const payload = {
      courseId: String(courseId),
      courseTitle: course?.title || "Course",
      lessonId: currentLesson?.id ? String(currentLesson.id) : "",
      lessonTitle: currentLesson?.title || "",
      instructorId: course?.instructorId || "",
      instructorName: course?.instructor || "Instructor",
      studentId: user?._id || user?.id || "",
      studentName: user?.name || "Student",
      studentEmail: user?.email || "",
      title: title.trim(),
      question: questionText.trim(),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/qna`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (data.success && data.question) {
        setQuestions((prev) => [data.question, ...prev]);
        setTitle("");
        setQuestionText("");
        setShowAskForm(false);
        setMsg("Your question has been posted to the instructor!");
        setTimeout(() => setMsg(""), 4000);
      } else {
        throw new Error(data.message || "Failed to post question.");
      }
    } catch (err) {
      // Local fallback
      const fallbackItem = {
        _id: "q_" + Date.now(),
        ...payload,
        status: "pending",
        answers: [],
        createdAt: new Date().toISOString(),
      };
      const updated = [fallbackItem, ...questions];
      setQuestions(updated);
      localStorage.setItem(`qna_course_${courseId}`, JSON.stringify(updated));
      setTitle("");
      setQuestionText("");
      setShowAskForm(false);
      setMsg("Your question has been posted to the instructor!");
      setTimeout(() => setMsg(""), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="course-qna-container">
      <div className="course-qna-header">
        <div>
          <h3 className="qna-section-title">
            <FiMessageSquare /> Student &amp; Instructor Discussion
          </h3>
          <p className="qna-section-sub">
            Ask questions about this lesson or course, and get verified answers directly from {course?.instructor || "your instructor"}.
          </p>
        </div>
        <button
          className="btn-ask-question"
          onClick={() => setShowAskForm((prev) => !prev)}
        >
          {showAskForm ? "Close Form" : "Ask a Question"}
        </button>
      </div>

      {msg && (
        <div className="qna-alert success">
          <FiCheckCircle /> {msg}
        </div>
      )}

      {showAskForm && (
        <form className="ask-question-form" onSubmit={handleAskSubmit}>
          <h4>Post Your Question to Instructor</h4>
          {currentLesson && (
            <div className="current-lesson-tag">
              Asking regarding: <strong>{currentLesson.title}</strong>
            </div>
          )}

          <div className="qna-input-group">
            <label>Question Summary / Topic</label>
            <input
              type="text"
              placeholder="e.g., Why do we use useEffect with an empty dependency array?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="qna-input-group">
            <label>Detailed Explanation</label>
            <textarea
              rows={4}
              placeholder="Describe your question or where you're getting stuck in detail..."
              value={questionText}
              onChange={(e) => setQuestionText(e.target.value)}
              required
            />
          </div>

          <div className="qna-form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={() => setShowAskForm(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit-qna"
              disabled={submitting || !title.trim() || !questionText.trim()}
            >
              <FiSend /> {submitting ? "Posting..." : "Submit Question"}
            </button>
          </div>
        </form>
      )}

      <div className="qna-questions-list">
        {loading ? (
          <div className="qna-loading">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="qna-empty-state">
            <FiMessageSquare size={36} />
            <p>No questions asked yet for this course.</p>
            <span className="empty-sub">
              Be the first to ask {course?.instructor || "your instructor"} a question!
            </span>
          </div>
        ) : (
          questions.map((q) => {
            const isAnswered = q.status === "answered" || (q.answers && q.answers.length > 0);
            const isExpanded = expandedId === (q._id || q.id);

            return (
              <div
                key={q._id || q.id}
                className={`qna-card ${isAnswered ? "card-answered" : "card-pending"}`}
              >
                <div
                  className="qna-card-top"
                  onClick={() => setExpandedId(isExpanded ? null : (q._id || q.id))}
                >
                  <div className="qna-title-area">
                    <span
                      className={`qna-badge ${
                        isAnswered ? "badge-answered" : "badge-pending"
                      }`}
                    >
                      {isAnswered ? (
                        <>
                          <FiCheckCircle /> Answered ({q.answers?.length || 1})
                        </>
                      ) : (
                        <>
                          <FiClock /> Awaiting Instructor Reply
                        </>
                      )}
                    </span>
                    <h4 className="qna-item-title">{q.title}</h4>
                    {q.lessonTitle && (
                      <span className="qna-lesson-chip">
                        Lesson: {q.lessonTitle}
                      </span>
                    )}
                  </div>

                  <div className="qna-meta-right">
                    <span className="qna-author">
                      <FiUser /> {q.studentName || "Student"}
                    </span>
                    <button className="qna-expand-btn" type="button">
                      {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
                    </button>
                  </div>
                </div>

                <p className="qna-body-text">{q.question}</p>

                {/* Answers / Instructor Replies */}
                {isExpanded && (
                  <div className="qna-replies-tray">
                    <h5 className="replies-tray-heading">
                      Instructor &amp; Mentor Responses
                    </h5>
                    {q.answers && q.answers.length > 0 ? (
                      q.answers.map((ans, idx) => (
                        <div key={idx} className="instructor-reply-box">
                          <div className="instructor-reply-header">
                            <span className="reply-author-name">
                              👨‍🏫 {ans.authorName || course?.instructor || "Instructor"}
                            </span>
                            <span className="reply-role-tag">
                              Verified Instructor
                            </span>
                            <span className="reply-time">
                              {new Date(ans.createdAt || Date.now()).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="reply-content">{ans.answerText}</p>
                        </div>
                      ))
                    ) : (
                      <div className="no-reply-yet">
                        <FiAlertCircle /> Your instructor has received this question and will post an answer here soon.
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default CourseQnA;
