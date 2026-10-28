import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FiHome,
  FiBook,
  FiUser,
  FiAward,
  FiUsers,
  FiFileText,
  FiCreditCard,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiPlusCircle,
  FiShield,
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

function Sidebar({ admin = false, instructor = false }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const userRole = user?.role?.toLowerCase();
  const isInstructor = instructor || userRole === "instructor";
  const isAdmin = admin || userRole === "admin";

  const [pendingApprovals, setPendingApprovals] = React.useState(0);

  React.useEffect(() => {
    if (isAdmin) {
      const checkPending = () => {
        fetch(`${process.env.REACT_APP_API_URL || "http://localhost:5001"}/api/courses/admin/pending-count`)
          .then((r) => r.json())
          .then((d) => {
            if (d.success && typeof d.pendingCount === "number") {
              setPendingApprovals(d.pendingCount);
            }
          })
          .catch(() => {});
      };
      checkPending();
      const interval = setInterval(checkPending, 15000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getPanelTitle = () => {
    if (isInstructor) return "Instructor Panel";
    if (isAdmin) return "Admin Portal";
    return "Student Panel";
  };

  return (
    <aside className="sidebar">
      <h2>{getPanelTitle()}</h2>

      <div className="sidebar-links">
        {isInstructor ? (
          <>
            <NavLink to="/instructor/dashboard">
              <FiHome />  Dashboard
            </NavLink>

            <NavLink to="/instructor/courses">
              <FiBook />  My Courses
            </NavLink>

            <NavLink to="/instructor/students">
              <FiUsers />  Students &amp; Q&amp;A
            </NavLink>

            <NavLink to="/instructor/payments">
              <FiCreditCard />  Payments &amp; Payouts
            </NavLink>

            <NavLink to="/settings">
              <FiSettings />  Settings
            </NavLink>
          </>
        ) : isAdmin ? (
          <>
            <NavLink to="/admin/dashboard">
              <FiHome />  Dashboard
            </NavLink>

            <NavLink to="/admin/courses">
              <FiBook />  Courses
              {pendingApprovals > 0 && (
                <span
                  style={{
                    marginLeft: "auto",
                    background: "#f59e0b",
                    color: "#ffffff",
                    fontWeight: 700,
                    fontSize: 11,
                    padding: "2px 7px",
                    borderRadius: 10,
                  }}
                  title={`${pendingApprovals} course(s) awaiting approval`}
                >
                  {pendingApprovals} Pending
                </span>
              )}
            </NavLink>

            <NavLink to="/admin/users">
              <FiShield />  Users
            </NavLink>

            <NavLink to="/admin/students">
              <FiUsers />  Students
            </NavLink>

            <NavLink to="/admin/instructors">
              <FiUser />  Instructors
            </NavLink>

            <NavLink to="/admin/payments">
              <FiCreditCard />  Payments
            </NavLink>

            <NavLink to="/admin/reports">
              <FiBarChart2 />  Reports
            </NavLink>

            <NavLink to="/settings">
              <FiSettings />  Settings
            </NavLink>
          </>
        ) : (
          <>
            <NavLink to="/student/dashboard">
              <FiHome />  Dashboard
            </NavLink>

            <NavLink to="/student/courses">
              <FiBook />  My Courses
            </NavLink>

            <NavLink to="/student/certificates">
              <FiAward />  Certificates
            </NavLink>

            <NavLink to="/student/payments">
              <FiCreditCard />  Payment History
            </NavLink>

            <NavLink to="/settings">
              <FiSettings />  Settings
            </NavLink>
          </>
        )}

        {/* <button className="sidebar-logout-btn" onClick={handleLogout}>
          <FiLogOut />  Logout
        </button> */}
      </div>
    </aside>
  );
}

export default Sidebar;