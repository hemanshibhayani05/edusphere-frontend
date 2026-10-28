import React, { useState, useEffect } from "react";
import {
  FiUser,
  FiLock,
  FiBell,
  FiMoon,
  FiSave,
  FiRefreshCw,
  FiCheckCircle,
  FiShield,
  FiMail,
  FiPhone,
  FiBook,
} from "react-icons/fi";

import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import "./Settings.css";

function Settings() {
  const { user, updateUser } = useAuth();

  const userRole = (user?.role || "student").toLowerCase();
  const isInstructor = userRole === "instructor";
  const isAdmin = userRole === "admin";

  const [profile, setProfile] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    department: user?.department || (isInstructor ? "Technology & Programming" : ""),
    bio: user?.bio || "",
  });

  const [password, setPassword] = useState({
    current: "",
    newPassword: "",
    confirm: "",
  });

  const [notifications, setNotifications] = useState({
    courseUpdates: true,
    assignmentUpdates: true,
    emailNotifications: true,
  });

  const [darkMode, setDarkMode] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Sync state if user loads asynchronously
  useEffect(() => {
    if (user) {
      setProfile({
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        department: user?.department || (user?.role === "instructor" ? "Technology & Programming" : ""),
        bio: user?.bio || "",
      });
    }

    try {
      const savedNotifs = localStorage.getItem("edusphere_notifications");
      if (savedNotifs) setNotifications(JSON.parse(savedNotifs));
      const savedDark = localStorage.getItem("edusphere_darkmode");
      if (savedDark) setDarkMode(JSON.parse(savedDark));
    } catch (_) {}
  }, [user]);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordChange = (e) => {
    setPassword({
      ...password,
      [e.target.name]: e.target.value,
    });
  };

  const handleNotificationChange = (e) => {
    setNotifications({
      ...notifications,
      [e.target.name]: e.target.checked,
    });
  };

  const handleSave = () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (password.newPassword || password.confirm) {
      if (password.newPassword !== password.confirm) {
        setErrorMsg("New password and confirm password do not match.");
        return;
      }
      if (password.newPassword.length < 6) {
        setErrorMsg("New password must be at least 6 characters long.");
        return;
      }
    }

    // Update current user in context & localStorage
    const updatedUser = {
      ...(user || {}),
      name: profile.name,
      phone: profile.phone,
      department: profile.department,
      bio: profile.bio,
    };

    if (updateUser) {
      updateUser(updatedUser);
    }

    localStorage.setItem("edusphere_profile", JSON.stringify(profile));
    localStorage.setItem("edusphere_notifications", JSON.stringify(notifications));
    localStorage.setItem("edusphere_darkmode", JSON.stringify(darkMode));

    setSuccessMsg("Profile and account settings saved successfully!");
    setTimeout(() => setSuccessMsg(""), 4000);

    setPassword({
      current: "",
      newPassword: "",
      confirm: "",
    });
  };

  const handleReset = () => {
    setProfile({
      name: user?.name || "",
      email: user?.email || "",
      phone: user?.phone || "",
      department: user?.department || (isInstructor ? "Technology & Programming" : ""),
      bio: user?.bio || "",
    });

    setPassword({
      current: "",
      newPassword: "",
      confirm: "",
    });

    setNotifications({
      courseUpdates: true,
      assignmentUpdates: true,
      emailNotifications: true,
    });

    setDarkMode(false);
    setErrorMsg("");
    setSuccessMsg("");
  };

  // Get User Initials
  const getInitials = (name) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar admin={isAdmin} instructor={isInstructor} />

      <div className="dashboard-content settings-page">
        {/* Page Heading */}
        <div className="dashboard-heading">
          <h1>Account &amp; Profile Settings</h1>
          <p>Manage your personal profile, credentials, and platform preferences.</p>
        </div>

        {successMsg && (
          <div className="settings-alert-toast success">
            <FiCheckCircle /> {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="settings-alert-toast error">
            <FiShield /> {errorMsg}
          </div>
        )}

        {/* Profile Card Summary Banner */}
        <div className="profile-banner-card">
          <div className="profile-banner-avatar">
            {getInitials(profile.name || user?.name)}
          </div>
          <div className="profile-banner-details">
            <div className="profile-banner-title-row">
              <h2>{profile.name || user?.name || "EduSphere User"}</h2>
              <span className={`profile-role-tag ${userRole}`}>
                {userRole.toUpperCase()}
              </span>
            </div>
            <p className="profile-banner-email">
              <FiMail /> {profile.email || user?.email}
            </p>
            {isInstructor && profile.department && (
              <p className="profile-banner-dept">
                <FiBook /> Faculty of {profile.department}
              </p>
            )}
          </div>
        </div>

        {/* Profile Settings */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiUser />
            </div>

            <div>
              <h2>Personal Information</h2>
              <p>Update your public identity and contact information.</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label>Full Name</label>
              <input
                type="text"
                name="name"
                value={profile.name}
                onChange={handleProfileChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label>Email Address (Account ID)</label>
              <input
                type="email"
                name="email"
                value={profile.email}
                disabled
                title="Email is your account identifier and cannot be changed directly."
                style={{ backgroundColor: "#f1f5f9", cursor: "not-allowed" }}
              />
            </div>

            <div className="form-group">
              <label>Phone Number</label>
              <input
                type="text"
                name="phone"
                value={profile.phone}
                onChange={handleProfileChange}
                placeholder="e.g., +91 98765 43210"
              />
            </div>

            {isInstructor && (
              <div className="form-group">
                <label>Academic Department</label>
                <input
                  type="text"
                  name="department"
                  value={profile.department}
                  onChange={handleProfileChange}
                  placeholder="e.g. Computer Science & AI"
                />
              </div>
            )}

            <div className="form-group full-width">
              <label>Professional Bio / About Me</label>
              <textarea
                name="bio"
                rows={3}
                value={profile.bio}
                onChange={handleProfileChange}
                placeholder="Share a short bio with your learners and peers..."
                className="bio-textarea"
              />
            </div>
          </div>
        </div>

        {/* Password */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiLock />
            </div>

            <div>
              <h2>Change Password</h2>
              <p>Keep your account secure with a strong password.</p>
            </div>
          </div>

          <div className="settings-form">
            <div className="form-group">
              <label>Current Password</label>
              <input
                type="password"
                name="current"
                value={password.current}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
              />
            </div>

            <div className="form-group">
              <label>New Password</label>
              <input
                type="password"
                name="newPassword"
                value={password.newPassword}
                onChange={handlePasswordChange}
                placeholder="Minimum 6 characters"
              />
            </div>

            <div className="form-group">
              <label>Confirm New Password</label>
              <input
                type="password"
                name="confirm"
                value={password.confirm}
                onChange={handlePasswordChange}
                placeholder="Repeat new password"
              />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiBell />
            </div>

            <div>
              <h2>Notifications &amp; Alerts</h2>
              <p>Choose which notifications you want to receive.</p>
            </div>
          </div>

          <div className="settings-options">
            <label className="setting-option">
              <div>
                <strong>Course Updates &amp; Announcements</strong>
                <span>Get notified about course changes and new lesson releases.</span>
              </div>

              <input
                type="checkbox"
                name="courseUpdates"
                checked={notifications.courseUpdates}
                onChange={handleNotificationChange}
              />
            </label>

            <label className="setting-option">
              <div>
                <strong>Student Q&amp;A &amp; Assignment Activity</strong>
                <span>Receive instant alerts when questions or reviews are posted.</span>
              </div>

              <input
                type="checkbox"
                name="assignmentUpdates"
                checked={notifications.assignmentUpdates}
                onChange={handleNotificationChange}
              />
            </label>

            <label className="setting-option">
              <div>
                <strong>Email Digests</strong>
                <span>Receive weekly progress and summary updates via email.</span>
              </div>

              <input
                type="checkbox"
                name="emailNotifications"
                checked={notifications.emailNotifications}
                onChange={handleNotificationChange}
              />
            </label>
          </div>
        </div>

        {/* Appearance */}
        <div className="settings-card">
          <div className="settings-card-header">
            <div className="settings-icon">
              <FiMoon />
            </div>

            <div>
              <h2>Appearance &amp; Theme</h2>
              <p>Customize how your dashboard looks.</p>
            </div>
          </div>

          <label className="setting-option">
            <div>
              <strong>Dark Mode (Beta)</strong>
              <span>Use high-contrast sleek dark theme across the dashboard.</span>
            </div>

            <input
              type="checkbox"
              checked={darkMode}
              onChange={(e) => setDarkMode(e.target.checked)}
            />
          </label>
        </div>

        {/* Buttons */}
        <div className="settings-actions">
          <button className="reset-btn" onClick={handleReset}>
            <FiRefreshCw /> Reset
          </button>

          <button className="save-btn" onClick={handleSave}>
            <FiSave /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

export default Settings;