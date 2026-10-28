import React from "react";
import {
  FiPlus,
  FiTrash2,
  FiVideo,
  FiClock,
  FiBookOpen,
  FiHelpCircle,
  FiCheckCircle,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import "./CurriculumBuilder.css";

const DEFAULT_OPTIONS = [
  "First Answer Option",
  "Second Answer Option",
  "Third Answer Option",
  "Fourth Answer Option",
];

export function createEmptyModule(index = 1) {
  return {
    title: `Module ${index}: Fundamentals & Core Architecture`,
    description: "",
    videoUrl: "",
    duration: "20 min",
    quiz: [
      {
        question: "What is the primary concept covered in this module?",
        options: [
          "Core architectural principles and fundamentals",
          "Unrelated legacy syntax and deprecated patterns",
          "Third-party advertising systems",
          "Hardware circuit board design",
        ],
        correctAnswer: 0,
        explanation: "This module covers the core architectural principles.",
      },
    ],
  };
}

export function createEmptyQuestion(qIndex = 1) {
  return {
    question: "",
    options: ["", "", "", ""],
    correctAnswer: 0,
    explanation: "",
  };
}

function CurriculumBuilder({ modules = [], onChange }) {
  // Ensure we always have an array
  const moduleList = Array.isArray(modules) && modules.length > 0 ? modules : [];

  // Update a specific module field
  const updateModule = (modIdx, field, value) => {
    const updated = moduleList.map((m, i) => {
      if (i !== modIdx) return m;
      return { ...m, [field]: value };
    });
    onChange(updated);
  };

  // Add a new module
  const handleAddModule = () => {
    const nextIdx = moduleList.length + 1;
    const newMod = createEmptyModule(nextIdx);
    onChange([...moduleList, newMod]);
  };

  // Remove a module
  const handleRemoveModule = (modIdx) => {
    if (moduleList.length <= 1) {
      if (!window.confirm("Delete this module? A course usually has at least one module.")) {
        return;
      }
    }
    const updated = moduleList.filter((_, i) => i !== modIdx);
    onChange(updated);
  };

  // Add a quiz question to a module
  const handleAddQuestion = (modIdx) => {
    const targetMod = moduleList[modIdx];
    const currentQuiz = Array.isArray(targetMod.quiz) ? targetMod.quiz : [];
    const newQ = createEmptyQuestion(currentQuiz.length + 1);

    updateModule(modIdx, "quiz", [...currentQuiz, newQ]);
  };

  // Update question text or explanation
  const handleUpdateQuestion = (modIdx, qIdx, field, value) => {
    const targetMod = moduleList[modIdx];
    const currentQuiz = Array.isArray(targetMod.quiz) ? [...targetMod.quiz] : [];
    currentQuiz[qIdx] = {
      ...currentQuiz[qIdx],
      [field]: value,
    };
    updateModule(modIdx, "quiz", currentQuiz);
  };

  // Update question option text
  const handleUpdateOption = (modIdx, qIdx, optIdx, optValue) => {
    const targetMod = moduleList[modIdx];
    const currentQuiz = Array.isArray(targetMod.quiz) ? [...targetMod.quiz] : [];
    const currentOptions = Array.isArray(currentQuiz[qIdx]?.options)
      ? [...currentQuiz[qIdx].options]
      : ["", "", "", ""];

    currentOptions[optIdx] = optValue;
    currentQuiz[qIdx] = {
      ...currentQuiz[qIdx],
      options: currentOptions,
    };
    updateModule(modIdx, "quiz", currentQuiz);
  };

  // Set correct answer index for a question
  const handleSetCorrectAnswer = (modIdx, qIdx, optIdx) => {
    const targetMod = moduleList[modIdx];
    const currentQuiz = Array.isArray(targetMod.quiz) ? [...targetMod.quiz] : [];
    currentQuiz[qIdx] = {
      ...currentQuiz[qIdx],
      correctAnswer: optIdx,
    };
    updateModule(modIdx, "quiz", currentQuiz);
  };

  // Remove question
  const handleRemoveQuestion = (modIdx, qIdx) => {
    const targetMod = moduleList[modIdx];
    const currentQuiz = Array.isArray(targetMod.quiz) ? [...targetMod.quiz] : [];
    const filteredQuiz = currentQuiz.filter((_, i) => i !== qIdx);
    updateModule(modIdx, "quiz", filteredQuiz);
  };

  return (
    <div className="curriculum-builder">
      {/* ── Builder Top Header ── */}
      <div className="curriculum-heading">
        <div>
          <h3>Curriculum Modules &amp; Dynamic Quiz Studio</h3>
          <p>
            Add modules, attach video links (YouTube or MP4), and build custom interactive quizzes for each module.
          </p>
        </div>
        <button
          type="button"
          className="add-module-btn"
          onClick={handleAddModule}
        >
          <FiPlus /> Add New Module
        </button>
      </div>

      {moduleList.length === 0 ? (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            background: "#f8fafc",
            borderRadius: 10,
            border: "1px dashed #cbd5e1",
          }}
        >
          <p style={{ color: "#64748b", margin: "0 0 14px" }}>
            No modules added yet. Add your first module with a video link and quiz!
          </p>
          <button
            type="button"
            className="add-module-btn"
            onClick={handleAddModule}
          >
            <FiPlus /> Add First Module
          </button>
        </div>
      ) : (
        moduleList.map((mod, modIdx) => {
          const modTitle = typeof mod === "string" ? mod : mod.title || `Module ${modIdx + 1}`;
          const modVideo = typeof mod === "object" ? mod.videoUrl || "" : "";
          const modDuration = typeof mod === "object" ? mod.duration || "20 min" : "20 min";
          const modDesc = typeof mod === "object" ? mod.description || "" : "";
          const modQuiz = typeof mod === "object" && Array.isArray(mod.quiz) ? mod.quiz : [];

          return (
            <div key={modIdx} className="curriculum-module">
              {/* ── Module Header ── */}
              <div className="module-heading">
                <div style={{ display: "flex", alignItems: "center" }}>
                  <span className="module-index-badge">{modIdx + 1}</span>
                  <h4 style={{ margin: 0, color: "#1e293b", fontSize: 16 }}>
                    {modTitle.trim() ? modTitle : `Module ${modIdx + 1}`}
                  </h4>
                </div>
                <button
                  type="button"
                  className="remove-btn"
                  onClick={() => handleRemoveModule(modIdx)}
                  title="Remove this module"
                >
                  <FiTrash2 /> Remove Module
                </button>
              </div>

              {/* ── Module Title ── */}
              <div className="curriculum-field">
                <label>
                  <FiBookOpen style={{ color: "#059669" }} />
                  Module Title <span style={{ color: "#dc2626" }}>*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder={`e.g. Module ${modIdx + 1}: Introduction to Core Architecture & Setup`}
                  value={modTitle}
                  onChange={(e) => updateModule(modIdx, "title", e.target.value)}
                />
              </div>

              {/* ── Video Link & Duration Grid ── */}
              <div className="lesson-grid">
                <div className="curriculum-field">
                  <label>
                    <FiVideo style={{ color: "#2563eb" }} />
                    Module Video Link (YouTube URL or Video Link)
                  </label>
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    value={modVideo}
                    onChange={(e) => updateModule(modIdx, "videoUrl", e.target.value)}
                  />
                  {modVideo && (
                    <div className="video-link-preview-box">
                      <FiCheckCircle />
                      <span>Video link configured: <strong>{modVideo.slice(0, 45)}...</strong></span>
                    </div>
                  )}
                </div>

                <div className="curriculum-field">
                  <label>
                    <FiClock style={{ color: "#f59e0b" }} />
                    Estimated Duration
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 20 min"
                    value={modDuration}
                    onChange={(e) => updateModule(modIdx, "duration", e.target.value)}
                  />
                </div>
              </div>

              {/* ── Module Description (Optional) ── */}
              <div className="curriculum-field">
                <label>Module Description / Key Takeaways</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of what students will learn in this module..."
                  value={modDesc}
                  onChange={(e) => updateModule(modIdx, "description", e.target.value)}
                />
              </div>

              {/* ── Module Dynamic Quiz Builder ── */}
              <div className="module-quiz-container">
                <div className="quiz-header-bar">
                  <div>
                    <h5>
                      <FiHelpCircle /> Interactive MCQ Quiz Assessment ({modQuiz.length} Questions)
                    </h5>
                    <p className="quiz-header-desc">
                      Create custom dynamic questions for students. Set the choices and choose the correct answer.
                    </p>
                  </div>
                  <button
                    type="button"
                    className="add-quiz-q-btn"
                    onClick={() => handleAddQuestion(modIdx)}
                  >
                    <FiPlus /> Add Question
                  </button>
                </div>

                {modQuiz.length === 0 ? (
                  <div style={{ padding: "12px", textAlign: "center", color: "#64748b", fontSize: 13 }}>
                    No quiz questions added for this module yet. Click <strong>"+ Add Question"</strong> to create a dynamic quiz.
                  </div>
                ) : (
                  modQuiz.map((q, qIdx) => {
                    const options = Array.isArray(q.options) && q.options.length >= 2
                      ? q.options
                      : ["", "", "", ""];
                    const correctAnswer = typeof q.correctAnswer === "number" ? q.correctAnswer : 0;

                    return (
                      <div key={qIdx} className="quiz-question-box">
                        <div className="quiz-question-top">
                          <span className="quiz-q-label">Question {qIdx + 1}</span>
                          <button
                            type="button"
                            className="quiz-remove-q-btn"
                            onClick={() => handleRemoveQuestion(modIdx, qIdx)}
                            title="Remove question"
                          >
                            <FiTrash2 /> Remove
                          </button>
                        </div>

                        {/* Question Input */}
                        <div className="curriculum-field">
                          <label style={{ fontSize: 12 }}>Question Statement</label>
                          <input
                            type="text"
                            placeholder="e.g. What is the main purpose of state management in React?"
                            value={q.question || ""}
                            onChange={(e) =>
                              handleUpdateQuestion(modIdx, qIdx, "question", e.target.value)
                            }
                          />
                        </div>

                        {/* Options List */}
                        <div className="quiz-options-group">
                          <div className="quiz-options-title">
                            <span>Answer Options</span>
                            <small>Click radio button to mark as correct answer</small>
                          </div>

                          {options.map((opt, optIdx) => {
                            const isCorrect = correctAnswer === optIdx;
                            const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C, D

                            return (
                              <div
                                key={optIdx}
                                className={`quiz-option-item ${isCorrect ? "is-correct" : ""}`}
                              >
                                <label className="quiz-option-radio-label">
                                  <input
                                    type="radio"
                                    name={`correct-answer-mod-${modIdx}-q-${qIdx}`}
                                    checked={isCorrect}
                                    onChange={() => handleSetCorrectAnswer(modIdx, qIdx, optIdx)}
                                  />
                                  <span>Choice {optionLetter}</span>
                                </label>
                                <input
                                  type="text"
                                  className="quiz-option-input"
                                  placeholder={`Enter option ${optionLetter} text...`}
                                  value={opt}
                                  onChange={(e) =>
                                    handleUpdateOption(modIdx, qIdx, optIdx, e.target.value)
                                  }
                                />
                                {isCorrect && (
                                  <span className="correct-badge">
                                    <FiCheck /> Correct
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}

export default CurriculumBuilder;
