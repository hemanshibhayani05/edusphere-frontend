import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/Sidebar";
import { categories } from "../../data/MockData";

function AddCourse() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    title: "",
    instructor: "",
    category: "Web Development",
    price: "",
    description: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();

    alert("Course added successfully in mock frontend.");

    navigate("/admin/courses");
  };

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        <div className="dashboard-heading">
          <h1>Add Course</h1>
          <p>Create a new course.</p>
        </div>

        <form className="admin-form" onSubmit={handleSubmit}>
          <label>Course Title</label>
          <input
            required
            value={form.title}
            onChange={(e) =>
              setForm({ ...form, title: e.target.value })
            }
          />

          <label>Instructor</label>
          <input
            required
            value={form.instructor}
            onChange={(e) =>
              setForm({ ...form, instructor: e.target.value })
            }
          />

          <label>Category</label>
          <select
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value })
            }
          >
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>

          <label>Price</label>
          <input
            type="number"
            required
            value={form.price}
            onChange={(e) =>
              setForm({ ...form, price: e.target.value })
            }
          />

          <label>Description</label>
          <textarea
            rows="5"
            required
            value={form.description}
            onChange={(e) =>
              setForm({ ...form, description: e.target.value })
            }
          />

          <button className="btn" type="submit">
            Add Course
          </button>
        </form>
      </div>
    </div>
  );
}

export default AddCourse;