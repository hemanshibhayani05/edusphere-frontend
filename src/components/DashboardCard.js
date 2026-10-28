import React from "react";

function DashboardCard({ title, value, icon }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card-icon">{icon}</div>

      <div>
        <p>{title}</p>
        <h2>{value}</h2>
      </div>
    </div>
  );
}

export default DashboardCard;