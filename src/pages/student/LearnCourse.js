import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courses } from "../../data/MockData";
import Sidebar from "../../components/Sidebar";
import {
  FiPlayCircle,
  FiCheckCircle,
  FiLock,
  FiClock,
  FiBookOpen,
  FiArrowLeft,
  FiAward,
  FiFileText,
  FiExternalLink,
  FiYoutube,
  FiHelpCircle,
  FiCheck,
  FiX,
  FiRotateCcw,
} from "react-icons/fi";
import CourseQnA from "../../components/CourseQnA";
import "./LearnCourse.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

// YouTube Video Mapping for Course Modules
const COURSE_VIDEOS = {
  1: [
    "w7ejDZ8SWv8", // Introduction to React
    "bMknfKXIFA8", // Components and Props
    "O6P86uwfdR0", // State and Hooks
    "Law7wfdg_fq", // React Router
    "dGcsHMXbSOA", // API Integration
  ],
  2: [
    "TlB_eWDSMt4", // Node.js Basics
    "L72fhGm1TF3", // Express.js
    "vjf774RKrLc", // REST APIs
    "mbsmsi7l3r4", // Authentication
    "ofme2o29eVY", // Database Integration
  ],
  3: [
    "UB1O30fR-EE", // HTML Fundamentals
    "1Rs2ND1ryYc", // CSS Styling
    "srvUrASNj0s", // Responsive Design
    "W6NZfCO5SIk", // JavaScript
    "5fb2aPlgoys", // DOM Manipulation
  ],
  4: [
    "ofme2o29eVY", // Database Layer
    "L72fhGm1TF3", // Express.js
    "w7ejDZ8SWv8", // React.js
    "TlB_eWDSMt4", // Node.js
    "7CqJlxBYj-M", // MERN Project
  ],
  5: [
    "kqtD5dpn9C8", // Python Basics
    "v5MR5JnKcZI", // Variables
    "BVfCwPY31lM", // Functions
    "Jeznw_Jvgvg", // OOP
    "8ext9G7xspg", // Projects
  ],
  6: [
    "i_LwzRVP7bg", // ML Introduction
    "r-uOLxNrNk8", // Data Preparation
    "nk2CQITm_uu", // Regression
    "zM4VZR0px8E", // Classification
    "85dtiMz9tSo", // Model Evaluation
  ],
};

// MCQ Quiz Questions Bank
const QUIZ_BANK = {
  1: [
    {
      question: "What is the primary purpose of React Hooks?",
      options: [
        "To perform direct DOM mutations",
        "To use state and lifecycle features in functional components",
        "To connect React directly to a backend database",
        "To write CSS styles inside JavaScript files"
      ],
      correctAnswer: 1
    },
    {
      question: "Which hook is used for performing side effects in functional components?",
      options: [
        "useState()",
        "useReducer()",
        "useEffect()",
        "useContext()"
      ],
      correctAnswer: 2
    },
    {
      question: "How is data passed down from a parent component to a child component in React?",
      options: [
        "State",
        "Props",
        "Redux Store",
        "LocalStorage"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the Virtual DOM in React?",
      options: [
        "A lightweight in-memory representation of the real DOM",
        "A browser extension for debugging React apps",
        "A database running inside the client browser",
        "A CSS library built into React core"
      ],
      correctAnswer: 0
    }
  ],
  2: [
    {
      question: "Where does Node.js execute JavaScript code?",
      options: [
        "Inside web browser engines only",
        "In the V8 JavaScript engine outside the browser",
        "Inside Apache HTTP Web Server",
        "Inside Python virtual environment"
      ],
      correctAnswer: 1
    },
    {
      question: "Which Express method defines a route to handle HTTP GET requests?",
      options: [
        "app.post()",
        "app.get()",
        "app.listen()",
        "app.fetch()"
      ],
      correctAnswer: 1
    },
    {
      question: "Which middleware in Express parses incoming JSON request bodies?",
      options: [
        "express.json()",
        "express.static()",
        "express.urlencoded()",
        "express.router()"
      ],
      correctAnswer: 0
    }
  ],
  3: [
    {
      question: "Which HTML tag is used to create a hyperlink to another page?",
      options: [
        "<link>",
        "<a>",
        "<button>",
        "<href>"
      ],
      correctAnswer: 1
    },
    {
      question: "Which CSS layout box model provides 1-dimensional flex alignment?",
      options: [
        "Grid",
        "Flexbox",
        "Float",
        "Table"
      ],
      correctAnswer: 1
    },
    {
      question: "Which keyword declares a block-scoped reassignable variable in JS?",
      options: [
        "var",
        "let",
        "const",
        "static"
      ],
      correctAnswer: 1
    }
  ],
  default: [
    {
      question: "What is the key advantage of modular software design?",
      options: [
        "Makes code longer and harder to read",
        "Improves reusability, maintainability, and code organization",
        "Removes the need for software testing",
        "Speeds up wifi connection"
      ],
      correctAnswer: 1
    },
    {
      question: "What does API stand for in web development?",
      options: [
        "Automated Program Interface",
        "Application Programming Interface",
        "Advanced Processing Integration",
        "Array Performance Index"
      ],
      correctAnswer: 1
    },
    {
      question: "Which tool is used for Version Control in modern development?",
      options: [
        "Docker",
        "Git",
        "Webpack",
        "Postman"
      ],
      correctAnswer: 1
    },
    {
      question: "What is the primary purpose of database indexing?",
      options: [
        "To encrypt password fields",
        "To speed up data retrieval queries",
        "To compress image files",
        "To host HTML code"
      ],
      correctAnswer: 1
    }
  ]
};

const getLessonVideoId = (courseId, idx) => {
  const list = COURSE_VIDEOS[courseId] || COURSE_VIDEOS[1];
  return list[idx % list.length] || "w7ejDZ8SWv8";
};

const getQuizQuestions = (courseId) => {
  return QUIZ_BANK[courseId] || QUIZ_BANK.default;
};

/* ─────────────────────────────────────────────────────────────
   INTERACTIVE MCQ QUIZ COMPONENT (Dynamic & Custom Quizzes)
───────────────────────────────────────────────────────────── */
function McqQuiz({ courseId, lesson, course, onComplete }) {
  // Use instructor's custom quiz questions if defined on lesson or course, else fallback
  const questions =
    Array.isArray(lesson?.questions) && lesson.questions.length > 0
      ? lesson.questions
      : Array.isArray(course?.quiz) && course.quiz.length > 0
      ? course.quiz
      : getQuizQuestions(courseId);

  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Reset quiz state when switching to a different lesson
  useEffect(() => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
  }, [lesson?.id]);

  const handleSelect = (qIdx, oIdx) => {
    if (submitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [qIdx]: oIdx,
    }));
  };

  const handleSubmit = () => {
    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });
    setScore(correctCount);
    setSubmitted(true);

    // If score >= 50%, mark lesson completed!
    if (correctCount >= Math.ceil(questions.length / 2)) {
      onComplete(lesson.id);
    }
  };

  const handleReset = () => {
    setUserAnswers({});
    setSubmitted(false);
    setScore(0);
  };

  const percentage = Math.round((score / questions.length) * 100);
  const passed = score >= Math.ceil(questions.length / 2);

  return (
    <div className="mcq-quiz-container">
      <div className="mcq-quiz-header">
        <div className="mcq-title-box">
          <span className="mcq-badge">📝 MCQ Knowledge Check</span>
          <h2>{lesson.title}</h2>
        </div>
        <div className="mcq-meta-row">
          <span>Questions: <strong>{questions.length}</strong></span>
          <span>Passing Score: <strong>50%</strong></span>
        </div>
      </div>

      {submitted ? (
        <div className={`mcq-results-card ${passed ? "passed" : "failed"}`}>
          <div className="mcq-score-circle">
            <span className="score-num">{score} / {questions.length}</span>
            <span className="score-pct">{percentage}% Correct</span>
          </div>

          <h3 className="score-status-title">
            {passed ? "🎉 Quiz Passed! Excellent Job!" : "❌ Quiz Not Passed"}
          </h3>
          <p className="score-subtext">
            You answered <strong>{score}</strong> out of <strong>{questions.length}</strong> questions correctly ({percentage}% score).
          </p>

          <div className="mcq-review-section">
            <h4>Answers Review &amp; Explanations:</h4>
            <div className="review-items-list">
              {questions.map((q, qIdx) => {
                const isCorrect = userAnswers[qIdx] === q.correctAnswer;
                const userOpt = q.options[userAnswers[qIdx]];
                const correctOpt = q.options[q.correctAnswer];

                return (
                  <div key={qIdx} className={`review-item ${isCorrect ? "correct" : "incorrect"}`}>
                    <div className="review-q-header">
                      <span className="review-q-num">Q{qIdx + 1}.</span>
                      <span className="review-q-title">{q.question}</span>
                      <span className={`review-badge ${isCorrect ? "badge-right" : "badge-wrong"}`}>
                        {isCorrect ? "✓ Correct" : "✗ Incorrect"}
                      </span>
                    </div>

                    <div className="review-ans-row">
                      <div className="ans-box your-ans">
                        <span>Your Answer:</span>
                        <strong>{userOpt !== undefined ? userOpt : "Not Answered"}</strong>
                      </div>
                      {!isCorrect && (
                        <div className="ans-box right-ans">
                          <span>Correct Answer:</span>
                          <strong>{correctOpt}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mcq-actions-row">
            <button className="retake-quiz-btn" onClick={handleReset}>
              <FiRotateCcw /> Retake Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="mcq-questions-list">
          {questions.map((q, qIdx) => (
            <div key={qIdx} className="mcq-question-card">
              <h4 className="q-title">
                <span className="q-num">Q{qIdx + 1}.</span> {q.question}
              </h4>
              <div className="mcq-options-list">
                {q.options.map((opt, oIdx) => {
                  const isSelected = userAnswers[qIdx] === oIdx;
                  return (
                    <button
                      key={oIdx}
                      type="button"
                      className={`mcq-opt-btn ${isSelected ? "selected" : ""}`}
                      onClick={() => handleSelect(qIdx, oIdx)}
                    >
                      <span className="opt-badge">
                        {String.fromCharCode(65 + oIdx)}
                      </span>
                      <span className="opt-text">{opt}</span>
                      {isSelected && <FiCheck className="opt-check-icon" />}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          <div className="mcq-submit-container">
            <button
              type="button"
              className="mcq-submit-btn"
              disabled={Object.keys(userAnswers).length === 0}
              onClick={handleSubmit}
            >
              <FiCheckCircle /> Submit Quiz ({Object.keys(userAnswers).length} of {questions.length} Answered)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN LEARN COURSE PAGE
───────────────────────────────────────────────────────────── */
function LearnCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(() => {
    return courses.find((c) => String(c.id) === String(id));
  });
  const [loading, setLoading] = useState(!course);

  // Extract YouTube ID from link or ID
  const extractYouTubeId = (urlOrId) => {
    if (!urlOrId || typeof urlOrId !== "string") return null;
    const str = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(str)) return str;
    const match = str.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/i
    );
    return match ? match[1] : null;
  };

  // Build lesson structure from modules
  const buildLessons = (courseId, modules, courseData) => {
    const list =
      Array.isArray(modules) && modules.length > 0
        ? modules
        : [
            "Course Overview & Fundamentals",
            "Core Concepts & Architecture",
            "Hands-on Practical Implementation",
            "Advanced Techniques & Best Practices",
            "Project Evaluation & Certification",
          ];

    let lessonList = [];
    let lessonCounter = 1;

    list.forEach((mod, idx) => {
      const isObj = typeof mod === "object" && mod !== null;
      const modTitle = isObj ? mod.title || `Module ${idx + 1}` : mod;
      const modVideoUrl = isObj ? mod.videoUrl || "" : "";
      const modDuration = isObj ? mod.duration || "20 min" : "20 min";
      const customQuiz =
        isObj && Array.isArray(mod.quiz) && mod.quiz.length > 0 ? mod.quiz : null;

      const ytId = extractYouTubeId(modVideoUrl) || getLessonVideoId(courseId, idx);

      // Add Video Lesson for this module
      lessonList.push({
        id: lessonCounter++,
        moduleIndex: idx + 1,
        title: modTitle,
        duration: modDuration,
        type: "video",
        videoUrl: modVideoUrl,
        videoId: ytId,
        completed: false,
      });

      // If module has custom quiz questions created by the instructor:
      if (customQuiz) {
        lessonList.push({
          id: lessonCounter++,
          moduleIndex: idx + 1,
          title: `${modTitle} - Knowledge Check Quiz`,
          duration: `${Math.max(5, customQuiz.length * 2)} min`,
          type: "quiz",
          questions: customQuiz, // Instructor's custom quiz!
          completed: false,
        });
      }
    });

    // Check if course has a course-level quiz
    const courseLevelQuiz =
      Array.isArray(courseData?.quiz) && courseData.quiz.length > 0
        ? courseData.quiz
        : null;
    if (courseLevelQuiz) {
      lessonList.push({
        id: lessonCounter++,
        moduleIndex: list.length + 1,
        title: "Comprehensive Course Assessment Quiz",
        duration: `${Math.max(10, courseLevelQuiz.length * 2)} min`,
        type: "quiz",
        questions: courseLevelQuiz,
        completed: false,
      });
    }

    // If no quizzes were added (e.g. legacy course with simple string modules):
    const hasAnyQuiz = lessonList.some((l) => l.type === "quiz");
    if (!hasAnyQuiz) {
      lessonList.push({
        id: lessonCounter++,
        moduleIndex: list.length + 1,
        title: "Course Mastery MCQ Quiz",
        duration: "10 min",
        type: "quiz",
        questions: getQuizQuestions(courseId),
        completed: false,
      });
    }

    return lessonList;
  };

  const [lessons, setLessons] = useState([]);
  const [activeLesson, setActiveLesson] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [notes, setNotes] = useState("");

  // Fetch course from backend if not already in mockData
  useEffect(() => {
    let isMounted = true;
    const foundMock = courses.find((c) => String(c.id) === String(id));
    if (foundMock) {
      setCourse(foundMock);
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          if (data.success && data.course) {
            const raw = data.course;
            setCourse({
              id: raw._id || raw.id,
              title: raw.title,
              modules: Array.isArray(raw.modules) && raw.modules.length > 0 ? raw.modules : [
                "Course Overview & Fundamentals",
                "Core Concepts & Architecture",
                "Practical Lab & Implementation",
                "Final Assessment & Review"
              ],
              ...raw
            });
          }
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (course) {
      // Load saved progress
      const savedProgress = localStorage.getItem(`learn_progress_${id}`);
      if (savedProgress) {
        try {
          const parsed = JSON.parse(savedProgress);
          const defaultLessons = buildLessons(course.id, course.modules, course);
          const merged = defaultLessons.map((l, i) => ({
            ...l,
            completed: parsed.lessons?.[i]?.completed || false,
          }));
          setLessons(merged);
          setActiveLesson(parsed.activeLesson || 0);
          setNotes(parsed.notes || "");
        } catch (_) {
          setLessons(buildLessons(course.id, course.modules, course));
          setActiveLesson(0);
        }
      } else {
        const built = buildLessons(course.id, course.modules, course);
        setLessons(built);
        setActiveLesson(0);
      }
    }
  }, [course, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Save progress to localStorage whenever lessons change
  useEffect(() => {
    if (lessons.length > 0) {
      localStorage.setItem(
        `learn_progress_${id}`,
        JSON.stringify({ lessons, activeLesson, notes })
      );

      // Update enrollment progress
      updateEnrollmentProgress();
    }
  }, [lessons, activeLesson, notes]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateEnrollmentProgress = () => {
    try {
      const enrollments = JSON.parse(
        localStorage.getItem("edusphere_enrollments") || "[]"
      );
      const idx = enrollments.findIndex((e) => String(e.courseId) === String(id));
      if (idx !== -1) {
        const completedCount = lessons.filter((l) => l.completed).length;
        const progress = Math.round((completedCount / lessons.length) * 100);
        enrollments[idx].progress = progress;
        localStorage.setItem(
          "edusphere_enrollments",
          JSON.stringify(enrollments)
        );
      }
    } catch (_) {}
  };

  const toggleLessonComplete = (lessonId) => {
    setLessons((prev) =>
      prev.map((l) =>
        l.id === lessonId ? { ...l, completed: !l.completed } : l
      )
    );
  };

  const handleSelectLesson = (idx) => {
    setActiveLesson(idx);
    setIsPlaying(true);
  };

  const completedCount = lessons.filter((l) => l.completed).length;
  const progressPct =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
          <div style={{ color: "#6366f1", fontSize: "1.1rem", fontWeight: "600" }}>Loading course content...</div>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="dashboard-layout">
        <Sidebar />
        <div className="dashboard-content">
          <div className="learn-not-found">
            <FiBookOpen size={48} />
            <h2>Course Not Found</h2>
            <p>The course you're looking for doesn't exist.</p>
            <button onClick={() => navigate("/student/courses")}>
              ← Back to My Courses
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentLesson = lessons[activeLesson] || lessons[0];
  const videoId = currentLesson?.videoId || "w7ejDZ8SWv8";

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content learn-page">
        {/* ── Top Bar ── */}
        <div className="learn-topbar">
          <button
            className="learn-back-btn"
            onClick={() => navigate("/student/courses")}
          >
            <FiArrowLeft /> Back to My Courses
          </button>
          <div className="learn-progress-summary">
            <span>{completedCount}/{lessons.length} lessons completed</span>
            <div className="learn-topbar-progress">
              <div
                className="learn-topbar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <strong>{progressPct}%</strong>
          </div>
        </div>

        {/* ── Main Content ── */}
        <div className="learn-container">
          {/* ── Video / MCQ Quiz Main Area ── */}
          <div className="learn-main">

            {currentLesson?.type === "quiz" ? (
              /* MCQ Quiz Interface */
              <McqQuiz
                courseId={course.id}
                lesson={currentLesson}
                course={course}
                onComplete={(lessonId) => {
                  toggleLessonComplete(lessonId);
                }}
              />
            ) : (
              /* Embedded Video Player (YouTube or Custom URL) */
              <>
                <div className="learn-video-area">
                  {isPlaying ? (
                    <div className="learn-video-iframe-wrap">
                      {currentLesson?.videoId ? (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${currentLesson.videoId}?autoplay=1&rel=0&enablejsapi=1`}
                          title={currentLesson?.title || "Course Lesson Video"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="learn-youtube-iframe"
                        />
                      ) : currentLesson?.videoUrl && /\.(mp4|webm|ogg)($|\?)/i.test(currentLesson.videoUrl) ? (
                        <video
                          src={currentLesson.videoUrl}
                          controls
                          autoPlay
                          className="learn-youtube-iframe"
                          style={{ width: "100%", height: "100%", objectFit: "contain", background: "#000" }}
                        />
                      ) : currentLesson?.videoUrl ? (
                        <iframe
                          src={currentLesson.videoUrl}
                          title={currentLesson?.title || "Course Lesson Video"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="learn-youtube-iframe"
                        />
                      ) : (
                        <iframe
                          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&enablejsapi=1`}
                          title={currentLesson?.title || "Course Lesson Video"}
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                          allowFullScreen
                          className="learn-youtube-iframe"
                        />
                      )}
                    </div>
                  ) : (
                    <div className="learn-video-placeholder">
                      <img src={course.image} alt={course.title} />
                      <div className="learn-video-overlay">
                        <button
                          className="learn-play-btn"
                          onClick={() => setIsPlaying(true)}
                          title="Start Learning"
                        >
                          <FiPlayCircle size={64} />
                        </button>
                        <p className="start-learn-title">
                          {currentLesson ? currentLesson.title : "Select a lesson to start"}
                        </p>
                        <button
                          className="start-learn-badge-btn"
                          onClick={() => setIsPlaying(true)}
                        >
                          <FiPlayCircle /> Start Learning &amp; Play Video
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Video Bar */}
                {currentLesson && (
                  <div className="yt-direct-link-bar">
                    <span className="yt-bar-info">
                      <FiYoutube className="yt-icon" /> Now Playing: <strong>{currentLesson.title}</strong>
                    </span>
                    {currentLesson.videoUrl ? (
                      <a
                        href={currentLesson.videoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="yt-external-btn"
                      >
                        <FiExternalLink /> Open Video Source
                      </a>
                    ) : (
                      <a
                        href={`https://www.youtube.com/watch?v=${videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="yt-external-btn"
                      >
                        <FiExternalLink /> Open on YouTube
                      </a>
                    )}
                  </div>
                )}
              </>
            )}

            {/* Lesson Info */}
            <div className="learn-lesson-info">
              <div className="learn-lesson-header">
                <div>
                  <span className="learn-lesson-label">
                    {currentLesson?.type === "quiz" ? "📝 MCQ Quiz Assessment" : "🎬 YouTube Video Lesson"}
                  </span>
                  <h2>{currentLesson?.title || course.title}</h2>
                  <p className="learn-course-subtitle">
                    {course.title} · by {course.instructor}
                  </p>
                </div>
                {currentLesson && (
                  <button
                    className={`learn-mark-btn ${currentLesson.completed ? "completed" : ""}`}
                    onClick={() => toggleLessonComplete(currentLesson.id)}
                  >
                    <FiCheckCircle />
                    {currentLesson.completed ? "Completed" : "Mark Complete"}
                  </button>
                )}
              </div>

              {/* Navigation Buttons */}
              <div className="learn-nav-btns">
                <button
                  className="learn-prev-btn"
                  disabled={activeLesson === 0}
                  onClick={() => handleSelectLesson(Math.max(0, activeLesson - 1))}
                >
                  ← Previous Lesson
                </button>
                <button
                  className="learn-next-btn"
                  disabled={activeLesson >= lessons.length - 1}
                  onClick={() => handleSelectLesson(Math.min(lessons.length - 1, activeLesson + 1))}
                >
                  Next Lesson →
                </button>
              </div>

              {/* Notes Section */}
              <div className="learn-notes-section">
                <h3><FiFileText /> Your Study Notes</h3>
                <textarea
                  placeholder="Type your study notes here..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
              </div>

              {/* Student Q&A Section */}
              <CourseQnA course={course} currentLesson={currentLesson} />
            </div>
          </div>

          {/* ── Sidebar: Lesson List ── */}
          <div className="learn-sidebar">
            <div className="learn-sidebar-header">
              <h3><FiBookOpen /> Course Content</h3>
              <span className="learn-sidebar-count">
                {completedCount}/{lessons.length}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="learn-sidebar-progress">
              <div
                className="learn-sidebar-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Completion Badge */}
            {progressPct === 100 && (
              <div className="learn-complete-badge">
                <FiAward size={18} />
                <span>Course Completed! 🎉</span>
              </div>
            )}

            {/* Lessons List */}
            <div className="learn-lesson-list">
              {lessons.map((lesson, idx) => (
                <div
                  key={lesson.id}
                  className={`learn-lesson-item ${
                    activeLesson === idx ? "active" : ""
                  } ${lesson.completed ? "done" : ""}`}
                  onClick={() => handleSelectLesson(idx)}
                >
                  <div className="learn-lesson-status">
                    {lesson.completed ? (
                      <FiCheckCircle className="status-done" />
                    ) : activeLesson === idx ? (
                      lesson.type === "quiz" ? (
                        <FiHelpCircle className="status-playing" />
                      ) : (
                        <FiPlayCircle className="status-playing" />
                      )
                    ) : (
                      <span className="status-num">{idx + 1}</span>
                    )}
                  </div>
                  <div className="learn-lesson-details">
                    <span className="learn-lesson-name">{lesson.title}</span>
                    <span className="learn-lesson-meta">
                      {lesson.type === "quiz" ? "📝 MCQ Quiz" : "🎬 Video"} ·{" "}
                      {lesson.duration}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LearnCourse;
