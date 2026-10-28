import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiAward,
  FiMail,
  FiPhone,
  FiLock,
  FiEye,
  FiEyeOff,
  FiBook,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiRefreshCw,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

// Generate 6-character random alphanumeric captcha code
const generateCaptchaCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789";
  let result = "";
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "student",
    department: "Web & Software Development",
    terms: false,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  // Captcha State
  const [captchaCode, setCaptchaCode] = useState(() => generateCaptchaCode());
  const [userCaptcha, setUserCaptcha] = useState("");

  const refreshCaptcha = () => {
    setCaptchaCode(generateCaptchaCode());
    setUserCaptcha("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!form.phone.trim()) {
      setError("Please enter your phone number.");
      return;
    }

    if (!form.password) {
      setError("Please create a password.");
      return;
    }

    if (form.password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Verify Captcha
    if (!userCaptcha.trim()) {
      setError("Please enter the security verification captcha.");
      return;
    }

    if (userCaptcha.trim() !== captchaCode) {
      setError("Invalid Captcha code. Please enter the exact characters shown.");
      refreshCaptcha();
      return;
    }

    if (!form.terms) {
      setError("Please accept the terms and conditions to proceed.");
      return;
    }

    try {
      setLoading(true);

      // Register via AuthContext
      await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        role: form.role.toLowerCase(), // strictly student or instructor
        department: form.role.toLowerCase() === "instructor" ? form.department : "",
      });

      const roleDisplay = form.role.charAt(0).toUpperCase() + form.role.slice(1);
      setSuccessMsg(
        `${roleDisplay} account created successfully! Redirecting to login...`
      );

      setTimeout(() => {
        navigate("/login");
      }, 1300);
    } catch (err) {
      setError(err.message || "Failed to complete registration.");
      refreshCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-card">
        {/* Header */}
        <div className="register-header">
          <h1>Create Your Account</h1>
          <p>Join EduSphere with your designated role</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="reg-error-box">
            <FiAlertCircle />
            <span>{error}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMsg && (
          <div
            className="reg-error-box"
            style={{
              background: "#ecfdf5",
              borderColor: "#a7f3d0",
              color: "#059669",
            }}
          >
            <FiCheckCircle />
            <span>{successMsg}</span>
          </div>
        )}

        <form className="register-form" onSubmit={handleSubmit} noValidate>
          {/* Role Selection Toggle */}
          <div className="role-selector-block">
            <span className="role-selector-label">Choose Account Role (Required)</span>
            <div className="role-cards-grid">
              {/* Student Option */}
              <button
                type="button"
                className={`role-card-option ${form.role.toLowerCase() === "student" ? "selected" : ""
                  }`}
                onClick={() => setForm({ ...form, role: "student" })}
              >
                <div className="role-icon-box">
                  <FiUser />
                </div>
                <div className="role-text-box">
                  <strong>Student</strong>
                  <span>Learn &amp; explore</span>
                </div>
              </button>

              {/* Instructor Option */}
              <button
                type="button"
                className={`role-card-option ${form.role.toLowerCase() === "instructor" ? "selected" : ""
                  }`}
                onClick={() => setForm({ ...form, role: "instructor" })}
              >
                <div className="role-icon-box">
                  <FiAward />
                </div>
                <div className="role-text-box">
                  <strong>Instructor</strong>
                  <span>Create &amp; teach</span>
                </div>
              </button>
            </div>
          </div>

          {/* Full Name */}
          <div className="reg-form-group">
            <label htmlFor="reg-name">
              {form.role === "instructor"
                ? "Instructor Full Name *"
                : "Student Full Name *"}
            </label>
            <div className="reg-input-wrapper">
              <span className="reg-input-icon">
                <FiUser />
              </span>
              <input
                id="reg-name"
                type="text"
                value={form.name}
                onChange={(e) =>
                  setForm({ ...form, name: e.target.value })
                }
                placeholder={
                  form.role === "instructor"
                    ? "e.g. Dr. Rajesh Khanna"
                    : "e.g. Rahul Sharma"
                }
                required
              />
            </div>
          </div>

          {/* Email & Phone Row */}
          <div className="reg-form-row">
            <div className="reg-form-group">
              <label htmlFor="reg-email">Email Address *</label>
              <div className="reg-input-wrapper">
                <span className="reg-input-icon">
                  <FiMail />
                </span>
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  placeholder="name@domain.com"
                  required
                />
              </div>
            </div>

            <div className="reg-form-group">
              <label htmlFor="reg-phone">Phone Number *</label>
              <div className="reg-input-wrapper">
                <span className="reg-input-icon">
                  <FiPhone />
                </span>
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
            </div>
          </div>

          {/* Instructor Department (shown only when Instructor is selected) */}
          {form.role === "instructor" && (
            <div className="reg-form-group">
              <label htmlFor="reg-dept">Teaching Specialty / Department *</label>
              <div className="reg-input-wrapper">
                <span className="reg-input-icon">
                  <FiBook />
                </span>
                <select
                  id="reg-dept"
                  value={form.department}
                  onChange={(e) =>
                    setForm({ ...form, department: e.target.value })
                  }
                >
                  <option value="Web & Software Development">
                    Web &amp; Software Development
                  </option>
                  <option value="Programming & Algorithms">
                    Programming &amp; Algorithms
                  </option>
                  <option value="Data Science & Machine Learning">
                    Data Science &amp; Machine Learning
                  </option>
                  <option value="Cybersecurity & Cloud">
                    Cybersecurity &amp; Cloud
                  </option>
                  <option value="UI/UX & Graphic Design">
                    UI/UX &amp; Graphic Design
                  </option>
                </select>
              </div>
            </div>
          )}

          {/* Password & Confirm Password Row */}
          <div className="reg-form-row">
            <div className="reg-form-group">
              <label htmlFor="reg-pass">Create Password *</label>
              <div className="reg-input-wrapper">
                <span className="reg-input-icon">
                  <FiLock />
                </span>
                <input
                  id="reg-pass"
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={(e) =>
                    setForm({ ...form, password: e.target.value })
                  }
                  placeholder="Min. 6 characters"
                  required
                />

              </div>
            </div>

            <div className="reg-form-group">
              <label htmlFor="reg-cpass">Confirm Password *</label>
              <div className="reg-input-wrapper">
                <span className="reg-input-icon">
                  <FiLock />
                </span>
                <input
                  id="reg-cpass"
                  type={showConfirmPassword ? "text" : "password"}
                  value={form.confirmPassword}
                  onChange={(e) =>
                    setForm({ ...form, confirmPassword: e.target.value })
                  }
                  placeholder="Repeat your password"
                  required
                />
                <button
                  type="button"
                  className="reg-eye-btn"
                  onClick={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  aria-label="Toggle confirm password visibility"
                >
                  {showConfirmPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>
          </div>

          {/* Security Verification Captcha */}
          <div className="reg-captcha-group">
            <label htmlFor="reg-captcha-input">
              <FiShield style={{ color: "#4f46e5", verticalAlign: "middle", marginRight: 6 }} />
              Security Verification Captcha *
            </label>
            <div className="reg-captcha-row">
              <div className="captcha-display-badge" title="Security Captcha Code">
                <span className="captcha-text">{captchaCode}</span>
                <div className="captcha-overlay-lines" />
              </div>
              <button
                type="button"
                className="btn-refresh-captcha"
                onClick={refreshCaptcha}
                title="Generate new Captcha"
                aria-label="Refresh Captcha"
              >
                <FiRefreshCw />
              </button>
              <div className="reg-input-wrapper captcha-input-wrap">
                <input
                  id="reg-captcha-input"
                  type="text"
                  value={userCaptcha}
                  onChange={(e) => setUserCaptcha(e.target.value)}
                  placeholder="Enter characters"
                  maxLength={6}
                  autoComplete="off"
                  required
                />
              </div>
            </div>
          </div>

          {/* Terms & Conditions Checkbox */}
          <div className="reg-terms-group">
            <label className="reg-checkbox-label">
              <input
                type="checkbox"
                checked={form.terms}
                onChange={(e) =>
                  setForm({ ...form, terms: e.target.checked })
                }
              />
              <span className="reg-terms-text">
                I agree to the{" "}
                <Link to="/terms" target="_blank">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link to="/privacy" target="_blank">
                  Privacy Policy
                </Link>
              </span>
            </label>
          </div>

          {/* Submit Button */}
          <button
            className="reg-submit-btn"
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <span>Creating Account...</span>
            ) : (
              <>
                <span>
                  {form.role === "instructor"
                    ? "Join as EduSphere Instructor"
                    : "Create Student Account"}
                </span>
                <FiArrowRight />
              </>
            )}
          </button>

          {/* Footer Link */}
          <p className="reg-footer-link">
            Already registered?{" "}
            <Link to="/login">
              Sign In here &rarr;
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}

export default Register;