import React from "react";

function CourseProgress({ title, progress }) {
  return (
    <div className="progress-card">
      <div className="progress-header">
        <strong>{title}</strong>
        <span>{progress}%</span>
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default CourseProgress;