import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiAward,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./InstructorLogin.css";

function InstructorLogin() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {};

    if (!form.email.trim()) {
      newErrors.email = "Instructor email is required.";
    }

    if (!form.password) {
      newErrors.password = "Password is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      // Authenticate via AuthContext
      await login(form.email, form.password, "instructor");

      console.log("Instructor Login Successful!");
      navigate("/instructor/dashboard");
    } catch (err) {
      setErrors({
        auth: err.message || "Invalid instructor credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="instructor-login-page">
      {/* Background decorations */}
      <div className="inst-bg-glow glow-1"></div>
      <div className="inst-bg-glow glow-2"></div>
      <div className="inst-grid-pattern"></div>

      <div className="instructor-card-wrapper">
        <form className="instructor-login-card" onSubmit={handleSubmit} noValidate>
          {/* Top Neon Accent */}
          <div className="instructor-card-accent"></div>

          {/* Icon Emblem */}
          <div className="instructor-icon-container">
            <div className="instructor-login-icon">
              <FiAward />
            </div>
            <span className="instructor-pulse-ring"></span>
          </div>

          {/* Status Badge */}
          <div className="instructor-status-pill">
            <span className="status-indicator"></span>
            <span>INSTRUCTOR PORTAL</span>
          </div>

          {/* Heading */}
          <h1 className="instructor-title">Faculty Portal</h1>
          <p className="instructor-login-subtitle">
            Sign in with your registered instructor account to manage courses.
          </p>

          {/* General Auth Error Alert */}
          {errors.auth && (
            <div className="instructor-error-banner">
              <FiAlertCircle />
              <span>{errors.auth}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="instructor-form-group">
            <label htmlFor="instructor-email">Instructor Email Address</label>
            <div
              className={`instructor-input-wrapper ${
                errors.email ? "input-has-error" : ""
              }`}
            >
              <span className="input-icon">
                <FiMail />
              </span>
              <input
                id="instructor-email"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: "" });
                  }
                }}
                placeholder="instructor@domain.com"
                autoComplete="email"
                required
              />
            </div>
            {errors.email && (
              <span className="field-error-msg">
                <FiAlertCircle /> {errors.email}
              </span>
            )}
          </div>

          {/* Password Input */}
          <div className="instructor-form-group">
            <div className="password-label-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <label htmlFor="instructor-password">Password</label>
              <Link
                to={`/forgot-password?role=instructor${
                  form.email ? `&email=${encodeURIComponent(form.email.trim())}` : ""
                }`}
                style={{ fontSize: "12.5px", color: "#10b981", textDecoration: "none", fontWeight: "600" }}
              >
                Forgot password?
              </Link>
            </div>
            <div
              className={`instructor-input-wrapper ${
                errors.password ? "input-has-error" : ""
              }`}
            >
              <span className="input-icon">
                <FiLock />
              </span>
              <input
                id="instructor-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) {
                    setErrors({ ...errors, password: "" });
                  }
                }}
                placeholder="Enter your password"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="pwd-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Toggle password view"
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {errors.password && (
              <span className="field-error-msg">
                <FiAlertCircle /> {errors.password}
              </span>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="instructor-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner-text">Authenticating...</span>
            ) : (
              <>
                <span>Access Instructor Console</span>
                <FiArrowRight />
              </>
            )}
          </button>

          {/* Return Links */}
          <div className="instructor-footer-links">
            <Link to="/register" className="instructor-secondary-link">
              New faculty member? Register as Instructor &rarr;
            </Link>
            <br />
            <Link to="/login" className="instructor-secondary-link">
              &larr; Standard Login Portal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default InstructorLogin;
