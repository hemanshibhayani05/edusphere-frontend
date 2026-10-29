import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  FiLock,
  FiEye,
  FiEyeOff,
  FiCheckCircle,
  FiAlertCircle,
  FiArrowRight,
  FiCheck,
} from "react-icons/fi";
import "./ResetPassword.css";

const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (typeof window !== "undefined" && window.location.hostname !== "localhost"
    ? "https://edusphere-backend-1b4s.onrender.com"
    : "http://localhost:5001");

function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [verifying, setVerifying] = useState(true);
  const [tokenValid, setTokenValid] = useState(false);
  const [userInfo, setUserInfo] = useState({ email: "", name: "", role: "" });

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [redirectCountdown, setRedirectCountdown] = useState(5);

  // 1. Verify token on page load
  useEffect(() => {
    let isMounted = true;

    const verifyToken = async () => {
      try {
        setVerifying(true);
        const res = await fetch(`${API_BASE_URL}/api/auth/verify-reset-token/${token}`);
        let data = {};
        const contentType = res.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          data = await res.json();
        } else {
          await res.text();
          data = { success: false, message: "Backend is updating. Please try again in a moment." };
        }

        if (isMounted) {
          if (res.ok && data.success) {
            setTokenValid(true);
            setUserInfo({
              email: data.email || "",
              name: data.name || "",
              role: data.role || "",
            });
          } else {
            setTokenValid(false);
            setError(data.message || "This password reset link is invalid or has expired.");
          }
        }
      } catch (err) {
        if (isMounted) {
          setTokenValid(false);
          setError("Network error: Unable to verify reset link. Please check your connection.");
        }
      } finally {
        if (isMounted) setVerifying(false);
      }
    };

    if (token) {
      verifyToken();
    } else {
      setVerifying(false);
      setTokenValid(false);
      setError("No reset token provided in URL.");
    }

    return () => {
      isMounted = false;
    };
  }, [token]);

  // 2. Auto-redirect timer when password reset is successful
  useEffect(() => {
    if (!isSuccess) return;

    if (redirectCountdown <= 0) {
      navigate("/login", {
        replace: true,
        state: { resetSuccess: true, email: userInfo.email },
      });
      return;
    }

    const timer = setInterval(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isSuccess, redirectCountdown, navigate, userInfo.email]);

  // 3. Handle password form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!password) {
      setError("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please verify.");
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${API_BASE_URL}/api/auth/reset-password/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      let data = {};
      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        data = await response.json();
      } else {
        await response.text();
        throw new Error("Unable to reset password. Please verify the reset link or try again.");
      }

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to reset password. Please try again.");
      }

      setIsSuccess(true);
    } catch (err) {
      setError(err.message || "Failed to reset password. The link might have expired.");
    } finally {
      setLoading(false);
    }
  };

  // Password requirement checks
  const hasMinLength = password.length >= 6;
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  return (
    <div className="auth-page reset-password-page">
      <div className="auth-card reset-card">
        {verifying ? (
          <div className="reset-loading-state">
            <div className="loading-spinner"></div>
            <h3>Verifying Reset Link</h3>
            <p>Please wait a moment while we validate your security link...</p>
          </div>
        ) : !tokenValid ? (
          <div className="reset-invalid-state">
            <div className="invalid-icon-badge">
              <FiAlertCircle />
            </div>
            <h2>Invalid or Expired Link</h2>
            <p className="invalid-description">
              {error || "This password reset link has either expired after 60 minutes or has already been used."}
            </p>
            <div className="invalid-actions">
              <Link to="/forgot-password" className="btn full-btn">
                Request a New Reset Link
              </Link>
              <Link to="/login" className="reset-secondary-link">
                Return to Login
              </Link>
            </div>
          </div>
        ) : isSuccess ? (
          <div className="reset-success-state">
            <div className="success-icon-badge">
              <FiCheckCircle />
            </div>
            <h2>Password Reset Complete!</h2>
            <p className="success-description">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>

            <div className="countdown-pill">
              Redirecting to login in <strong>{redirectCountdown}</strong> seconds...
            </div>

            <Link
              to="/login"
              state={{ resetSuccess: true, email: userInfo.email }}
              className="btn full-btn"
              style={{ marginTop: 16 }}
            >
              <span>Go to Login Immediately</span>
              <FiArrowRight style={{ marginLeft: 8 }} />
            </Link>
          </div>
        ) : (
          <>
            <div className="reset-icon-header">
              <div className="icon-badge">
                <FiLock />
              </div>
            </div>

            <h1>Create New Password</h1>
            <p className="reset-subtitle">
              Choose a strong, new password for your EduSphere account.
            </p>

            {/* Target Account Badge */}
            {userInfo.email && (
              <div className="account-target-badge">
                <span className="role-tag">
                  {userInfo.role ? userInfo.role.toUpperCase() : "ACCOUNT"}
                </span>
                <span className="email-text">{userInfo.email}</span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="error-message">
                <FiAlertCircle className="msg-icon" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit}>
              {/* New Password */}
              <label htmlFor="new-password">New Password</label>
              <div className="password-box">
                <input
                  id="new-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="At least 6 characters"
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >

                </button>
              </div>

              {/* Confirm Password */}
              <label htmlFor="confirm-password">Confirm New Password</label>
              <div className="password-box">
                <input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (error) setError("");
                  }}
                  placeholder="Re-enter your new password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >

                </button>
              </div>

              {/* Requirements validation indicator */}
              <div className="password-checklist">
                <div className={`check-item ${hasMinLength ? "met" : ""}`}>
                  <span className="check-bullet">{hasMinLength ? <FiCheck /> : "•"}</span>
                  <span>At least 6 characters</span>
                </div>
                <div className={`check-item ${passwordsMatch ? "met" : ""}`}>
                  <span className="check-bullet">{passwordsMatch ? <FiCheck /> : "•"}</span>
                  <span>Passwords match</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="btn full-btn"
                disabled={loading || !hasMinLength || !passwordsMatch}
                style={{ marginTop: 12 }}
              >
                {loading ? "Updating Password..." : "Reset Password"}
              </button>
            </form>

            <div className="reset-footer">
              <Link to="/login" className="reset-secondary-link">
                &larr; Back to Login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default ResetPassword;

