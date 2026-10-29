import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  FiMail,
  FiArrowLeft,
  FiCheckCircle,
  FiAlertCircle,
  FiUser,
  FiAward,
  FiSend,
} from "react-icons/fi";
import "./ForgotPassword.css";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://edusphere-backend-1b4s.onrender.com"
    : "http://localhost:5001");

function ForgotPassword() {
  const [searchParams] = useSearchParams();

  // Read initial role and email from query params if passed
  const initialRole = searchParams.get("role") || "student";
  const initialEmail = searchParams.get("email") || "";

  const [role, setRole] = useState(
    initialRole.toLowerCase() === "instructor" ? "instructor" : "student"
  );
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Sending Reset Link...");
  const [error, setError] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [successEmail, setSuccessEmail] = useState("");

  useEffect(() => {
    if (initialEmail) {
      setEmail(initialEmail);
    }
  }, [initialEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your registered email address.");
      return;
    }

    try {
      setLoading(true);
      setLoadingMsg("Sending Reset Link...");

      // Show warm-up message after 5 seconds if still waiting
      const slowTimer = setTimeout(() => {
        setLoadingMsg("Waking up server, please wait...");
      }, 5000);

      // AbortController for a 60-second timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const response = await fetch(`${API_BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          role,
        }),
      });

      let data = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        await response.text();
        throw new Error("Unable to connect to password reset service. Please try again shortly.");
      }

      clearTimeout(slowTimer);
      clearTimeout(timeoutId);

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to send reset email. Please try again.");
      }

      setSuccessEmail(email.trim().toLowerCase());
      setIsSubmitted(true);
    } catch (err) {
      if (err.name === "AbortError") {
        setError(
          "Request timed out. The server may be waking up — please wait 30 seconds and try again."
        );
      } else {
        setError(err.message || "An error occurred while sending the reset email.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    setIsSubmitted(false);
    setError("");
  };

  return (
    <div className="auth-page forgot-password-page">
      <div className="auth-card forgot-card">
        {/* Back button */}
        <div className="forgot-back-nav">
          <Link to="/login" className="back-link">
            <FiArrowLeft /> <span>Back to Login</span>
          </Link>
        </div>

        {!isSubmitted ? (
          <>
            <div className="forgot-icon-header">
              <div className="icon-badge">
                <FiMail />
              </div>
            </div>

            <h1>Forgot Password?</h1>
            <p className="forgot-subtitle">
              Don't worry! Enter your registered email address and we'll send you a link to reset your password.
            </p>

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <FiAlertCircle className="msg-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* Account Role Selector */}
              <label>Select Account Type</label>
              <div
                className="role-selector"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <button
                  type="button"
                  className={`role-btn ${role === "student" ? "active" : ""}`}
                  onClick={() => {
                    setRole("student");
                    setError("");
                  }}
                >
                  <FiUser />
                  <span>Student</span>
                </button>
                <button
                  type="button"
                  className={`role-btn ${role === "instructor" ? "active" : ""}`}
                  onClick={() => {
                    setRole("instructor");
                    setError("");
                  }}
                >
                  <FiAward />
                  <span>Instructor</span>
                </button>
              </div>

              {/* Email Input */}
              <label htmlFor="forgot-email">Registered Email Address</label>
              <div className="input-with-icon">
                <FiMail className="input-icon" />
                <input
                  id="forgot-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder=" name@example.com"
                  required
                  autoFocus
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn full-btn forgot-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <span>{loadingMsg}</span>
                ) : (
                  <>
                    <FiSend style={{ marginRight: 8 }} />
                    <span>Send Reset Link</span>
                  </>
                )}
              </button>
            </form>

            <div className="forgot-footer">
              <span>Remember your password? </span>
              <Link to="/login" className="link-highlight">
                Log In
              </Link>
            </div>
          </>
        ) : (
          /* Success confirmation screen */
          <div className="forgot-success-state">
            <div className="success-icon-badge">
              <FiCheckCircle />
            </div>

            <h2>Check Your Email</h2>
            <p className="success-instruction">
              We've dispatched a password reset link to:
            </p>

            <div className="email-chip">
              <FiMail className="chip-icon" />
              <strong>{successEmail}</strong>
            </div>

            <div className="info-box">
              <p>
                📬 Please check your inbox and click the reset link. If you don't see it within a couple of minutes, please check your <strong>Spam / Junk folder</strong>.
              </p>
              <p style={{ marginTop: 8, fontSize: "12.5px", color: "#64748b" }}>
                ⏳ The reset link will remain valid for <strong>60 minutes</strong>.
              </p>
            </div>

            <div className="success-actions">
              <Link to="/login" className="btn full-btn">
                Return to Login
              </Link>

              <button
                type="button"
                className="resend-btn"
                onClick={handleResend}
              >
                Didn't receive the email? Try again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ForgotPassword;

