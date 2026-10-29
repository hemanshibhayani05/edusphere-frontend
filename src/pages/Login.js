import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FiEye, FiEyeOff, FiUser, FiAward, FiShield, FiCheckCircle } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login } = useAuth();

  // If user is already logged in, immediately redirect to their dashboard
  useEffect(() => {
    if (user) {
      const role = (user.role || "student").toLowerCase();
      if (role === "instructor") {
        navigate("/instructor/dashboard", { replace: true });
      } else if (role === "admin") {
        navigate("/admin/dashboard", { replace: true });
      } else {
        navigate("/student/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

  const [form, setForm] = useState({
    email: location.state?.email || "",
    password: "",
    role: "student",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const successMsg = location.state?.resetSuccess
    ? "Password reset successfully! Please sign in with your new password."
    : "";
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    try {
      setLoading(true);

      // Authenticate user credentials
      const user = await login(form.email, form.password, form.role);

      const userRole = (user?.role || form.role || "student").toLowerCase();

      if (userRole === "instructor") {
        console.log("Instructor Login Successful!");
        navigate("/instructor/dashboard");
      } else if (userRole === "admin") {
        console.log("Admin Login Successful!");
        navigate("/admin/dashboard");
      } else {
        // Navigate immediately without waiting so login is instant
        navigate("/student/dashboard");

        // Fire-and-forget login notification email in the background
        const targetEmail = (user?.email || form.email).trim();
        const targetName = user?.name || "Student";

        fetch(`${API_BASE_URL}/api/email/login-notification`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: targetEmail,
            name: targetName,
            role: "Student",
            loginTime: new Date().toLocaleString("en-IN", {
              dateStyle: "medium",
              timeStyle: "short",
            }),
          }),
        }).catch((err) => {
          console.warn("Background email notification skipped:", err.message);
        });
      }
    } catch (err) {
      setError(err.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Welcome Back</h1>
        <p>Sign in to your EduSphere account</p>

        {/* Success Alert (e.g. redirected from reset password) */}
        {successMsg && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "#ecfdf5",
              border: "1px solid #a7f3d0",
              color: "#065f46",
              padding: "12px 16px",
              borderRadius: "10px",
              fontSize: "13.5px",
              marginBottom: "18px",
            }}
          >
            <FiCheckCircle style={{ flexShrink: 0, fontSize: "18px", color: "#10b981" }} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error */}
        {error && <div className="error-message">{error}</div>}

        {/* Role Selector */}
        <div className="role-selector" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button
            type="button"
            className={`role-btn ${form.role === "student" ? "active" : ""}`}
            onClick={() => setForm({ ...form, role: "student" })}
          >
            <FiUser />
            <span>Student</span>
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === "instructor" ? "active" : ""}`}
            onClick={() => setForm({ ...form, role: "instructor" })}
          >
            <FiAward />
            <span>Instructor</span>
          </button>
          <button
            type="button"
            className={`role-btn ${form.role === "admin" ? "active" : ""}`}
            onClick={() => setForm({ ...form, role: "admin" })}
          >
            <FiShield />
            <span>Admin</span>
          </button>
        </div>

        {/* Email */}
        <label>Email Address</label>
        <input
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Enter your registered email"
          required
        />

        {/* Password */}
        <label>Password</label>
        <div className="password-box">
          <input
            type={showPassword ? "text" : "password"}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter your password"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label="Toggle password view"
          >
            {showPassword ? <FiEyeOff /> : <FiEye />}
          </button>
        </div>

        {/* Remember */}
        <div className="remember-row">
          <label>
            <input type="checkbox" />
            Remember me
          </label>
          <Link
            to={`/forgot-password?role=${form.role}${
              form.email ? `&email=${encodeURIComponent(form.email.trim())}` : ""
            }`}
            className="forgot-link"
          >
            Forgot password?
          </Link>
        </div>

        {/* Login Button */}
        <button className="btn full-btn" type="submit" disabled={loading}>
          {loading
            ? "Authenticating..."
            : form.role === "instructor"
              ? "Access Instructor Dashboard"
              : form.role === "admin"
                ? "Access Admin Dashboard"
                : "Login"}
        </button>

        {/* Register (hidden for admin) */}
        {form.role !== "admin" && (
          <p className="auth-footer">
            Don't have an account? <Link to="/register">Register</Link>
          </p>
        )}


      </form>
    </div>
  );
}

export default Login;