import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function ProtectedRoute({ children, role }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (role) {
    const userRole = (user.role || "").toString().trim().toLowerCase();
    const requiredRole = role.toString().trim().toLowerCase();

    if (userRole !== requiredRole) {
      console.warn(
        `[ProtectedRoute] Access denied: User role "${user.role}" does not match required role "${role}". Redirecting to home.`
      );
      return <Navigate to="/" replace />;
    }
  }

  return children;
}

export default ProtectedRoute;