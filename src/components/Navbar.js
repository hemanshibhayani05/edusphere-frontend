import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiMenu,
  FiX,
  FiLogOut,
  FiUser,
  FiChevronDown,
  FiGrid,
  FiBookOpen,
  FiAward,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    setMenuOpen(false);
    logout();
    navigate("/");
  };

  const getDashboardPath = () => {
    const role = user?.role?.toLowerCase();
    if (role === "instructor") return "/instructor/dashboard";
    if (role === "admin") return "/admin/dashboard";
    return "/student/dashboard";
  };

  const getDashboardLabel = () => {
    const role = user?.role?.toLowerCase();
    if (role === "instructor") return "Instructor Dashboard";
    if (role === "admin") return "Admin Dashboard";
    return "Student Dashboard";
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="logo">
          Edu<span>Sphere</span>
        </Link>

        <div className={`nav-links ${menuOpen ? "active" : ""}`}>
        <Link to="/" onClick={() => setMenuOpen(false)}>
          Home
        </Link>

        <Link to="/courses" onClick={() => setMenuOpen(false)}>
          Courses
        </Link>

        <Link to="/about" onClick={() => setMenuOpen(false)}>
          About Us
        </Link>

        <Link to="/contact" onClick={() => setMenuOpen(false)}>
          Contact Us
        </Link>

        {!user ? (
          <>
            <Link
              to="/login"
              className="nav-login"
              onClick={() => setMenuOpen(false)}
            >
              Login
            </Link>
            <Link
              to="/register"
              className="nav-register"
              onClick={() => setMenuOpen(false)}
            >
              Register
            </Link>
          </>
        ) : (
          <div className="nav-user-container" ref={dropdownRef}>
            <button
              className={`user-profile-btn ${dropdownOpen ? "active" : ""}`}
              onClick={() => setDropdownOpen(!dropdownOpen)}
              aria-expanded={dropdownOpen}
            >
              <div className="user-avatar-circle">
                <FiUser />
              </div>
              <span className="user-name-text">{user.name}</span>
              <FiChevronDown
                className={`chevron-icon ${dropdownOpen ? "rotate" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="user-dropdown-menu">
                <div className="dropdown-user-info">
                  <p className="dropdown-user-name">{user.name}</p>
                  <p className="dropdown-user-email">
                    {user.email || user.role}
                  </p>
                  <span className="dropdown-user-role-badge">
                    {user.role ? (user.role.charAt(0).toUpperCase() + user.role.slice(1).toLowerCase()) : "Student"}
                  </span>
                </div>

                <div className="dropdown-divider" />

                <Link
                  to={getDashboardPath()}
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  <FiGrid className="dropdown-item-icon" />
                  <span>{getDashboardLabel()}</span>
                </Link>

                {user.role?.toLowerCase() === "instructor" && (
                  <Link
                    to="/instructor/courses"
                    className="dropdown-item"
                    onClick={() => {
                      setDropdownOpen(false);
                      setMenuOpen(false);
                    }}
                  >
                    <FiBookOpen className="dropdown-item-icon" />
                    <span>My Courses</span>
                  </Link>
                )}

                <Link
                  to="/settings"
                  className="dropdown-item"
                  onClick={() => {
                    setDropdownOpen(false);
                    setMenuOpen(false);
                  }}
                >
                  <FiUser className="dropdown-item-icon" />
                  <span>Profile &amp; Settings</span>
                </Link>

                <div className="dropdown-divider" />

                <button
                  className="dropdown-item dropdown-logout-btn"
                  onClick={handleLogout}
                >
                  <FiLogOut className="dropdown-item-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

        <button
          className="menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          {menuOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>
    </nav>
  );
}

export default Navbar;
