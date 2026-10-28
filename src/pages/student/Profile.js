import React from "react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";

function Profile() {
  const { user } = useAuth();

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content">
        <div className="dashboard-heading">
          <h1>My Profile</h1>
        </div>

        <div className="profile-card">
          <div className="profile-avatar">
            {user?.name?.charAt(0)}
          </div>

          <h2>{user?.name}</h2>

          <p>Email: {user?.email}</p>

          <p>Role: {user?.role}</p>

          <button className="btn">Edit Profile</button>
        </div>
      </div>
    </div>
  );
}

export default Profile;