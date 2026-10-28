import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { courses } from "../../data/MockData";

function EditCourse() {
  const { id } = useParams();
  const navigate = useNavigate();

  const course = courses.find((item) => String(item.id || item._id) === String(id));

  const [title, setTitle] = useState(course?.title || "");
  const [price, setPrice] = useState(course?.price || "");

  if (!course) {
    return (
      <div className="section">
        <h1>Course not found</h1>
      </div>
    );
  }

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Course updated successfully in mock frontend.");

    navigate("/admin/courses");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        <div className="dashboard-heading">
          <h1>Edit Course</h1>
          <p>Update course information.</p>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>Course Title</label>

          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <label>Price</label>

          <input
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />

          <button className="btn" type="submit">
            Update Course
          </button>
        </form>
      </div>
    </div>
  );
}

export default EditCourse;