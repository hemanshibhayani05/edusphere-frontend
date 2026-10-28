import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  FiShield,
  FiMail,
  FiLock,
  FiEye,
  FiEyeOff,
  FiArrowRight,
  FiAlertCircle,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./AdminLogin.css";

function AdminLogin() {
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
      newErrors.email = "Admin email is required.";
    }

    if (!form.password) {
      newErrors.password = "Admin password is required.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      // Authenticate via AuthContext
      await login(form.email, form.password, "admin");

      navigate("/admin/dashboard");
    } catch (err) {
      setErrors({
        auth: err.message || "Invalid administrator credentials.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="admin-bg-glow glow-1"></div>
      <div className="admin-bg-glow glow-2"></div>
      <div className="admin-grid-pattern"></div>

      <div className="admin-card-wrapper">
        <form className="admin-login-card" onSubmit={handleSubmit} noValidate>
          <div className="admin-card-accent"></div>

          <div className="admin-icon-container">
            <div className="admin-login-icon">
              <FiShield />
            </div>
            <span className="admin-pulse-ring"></span>
          </div>

          <div className="admin-status-pill">
            <span className="status-indicator"></span>
            <span>ADMINISTRATIVE PORTAL</span>
          </div>

          <h1 className="admin-title">Admin Console</h1>
          <p className="admin-login-subtitle">
            Enter your registered administrator credentials to access system controls.
          </p>

          {errors.auth && (
            <div className="admin-error-banner">
              <FiAlertCircle />
              <span>{errors.auth}</span>
            </div>
          )}

          {/* Email Input */}
          <div className="admin-form-group">
            <label htmlFor="admin-email">Admin Email Address</label>
            <div
              className={`admin-input-wrapper ${
                errors.email ? "input-has-error" : ""
              }`}
            >
              <span className="input-icon">
                <FiMail />
              </span>
              <input
                id="admin-email"
                type="email"
                value={form.email}
                onChange={(e) => {
                  setForm({ ...form, email: e.target.value });
                  if (errors.email) {
                    setErrors({ ...errors, email: "" });
                  }
                }}
                placeholder="admin@domain.com"
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
          <div className="admin-form-group">
            <div className="password-label-row">
              <label htmlFor="admin-password">Secure Password</label>
            </div>
            <div
              className={`admin-input-wrapper ${
                errors.password ? "input-has-error" : ""
              }`}
            >
              <span className="input-icon">
                <FiLock />
              </span>
              <input
                id="admin-password"
                type={showPassword ? "text" : "password"}
                value={form.password}
                onChange={(e) => {
                  setForm({ ...form, password: e.target.value });
                  if (errors.password) {
                    setErrors({ ...errors, password: "" });
                  }
                }}
                placeholder="Enter admin password"
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
            className="admin-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="btn-spinner-text">Authenticating...</span>
            ) : (
              <>
                <span>Access Admin Console</span>
                <FiArrowRight />
              </>
            )}
          </button>

          {/* Return Links */}
          <div className="admin-footer-links">
            <Link to="/register" className="admin-secondary-link">
              Need an admin account? Register with Admin role &rarr;
            </Link>
            <br />
            <Link to="/login" className="admin-secondary-link">
              &larr; Standard Login Portal
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;