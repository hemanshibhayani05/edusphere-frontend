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
  const [directResetUrl, setDirectResetUrl] = useState("");

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

      if (data.resetUrl) {
        setDirectResetUrl(data.resetUrl);

        // Also trigger Vercel Serverless Function to guarantee immediate email delivery via Gmail
        if (typeof window !== "undefined" && window.location.hostname !== "localhost") {
          fetch("/api/send-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              to: email.trim().toLowerCase(),
              subject: `🔑 Reset Your EduSphere Password (${role.toUpperCase()})`,
              html: `
                <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 580px; margin: 0 auto; padding: 28px; background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0;">
                  <div style="background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 24px; border-radius: 10px; text-align: center; color: #ffffff; margin-bottom: 24px;">
                    <h2 style="margin: 0; font-size: 22px;">🔑 Password Reset Request</h2>
                    <p style="margin: 4px 0 0; color: #e0e7ff; font-size: 13px;">EduSphere Learning Platform</p>
                  </div>
                  <p style="font-size: 15px; color: #1e293b;">Hello,</p>
                  <p style="font-size: 14px; color: #475569; line-height: 1.6;">
                    We received a request to reset your password for your <strong>${role.toUpperCase()}</strong> account (<strong>${email}</strong>).
                  </p>
                  <p style="margin: 28px 0; text-align: center;">
                    <a href="${data.resetUrl}" target="_blank" style="display: inline-block; background: #4f46e5; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 12px rgba(79, 70, 229, 0.3);">
                      Reset My Password &rarr;
                    </a>
                  </p>
                  <p style="font-size: 12.5px; color: #64748b; line-height: 1.5;">
                    If the button does not work, copy and paste this link in your browser:<br>
                    <a href="${data.resetUrl}" style="color: #4f46e5; word-break: break-all;">${data.resetUrl}</a>
                  </p>
                  <hr style="border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;">
                  <p style="font-size: 11.5px; color: #94a3b8; text-align: center; margin: 0;">
                    © ${new Date().getFullYear()} EduSphere Learning. This link expires in 60 minutes.
                  </p>
                </div>
              `,
            }),
          }).catch((e) => console.warn("Vercel email dispatch fallback warning:", e.message));
        }
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
              <Link to="/login" className="btn full-btn" style={{ background: "#4f46e5" }}>
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

