import React, { useEffect, useState } from "react";
import {
  FiUsers,
  FiBookOpen,
  FiUserCheck,
  FiDollarSign,
} from "react-icons/fi";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import Sidebar from "../../components/Sidebar";
import DashboardCard from "../../components/DashboardCard";
import { getAdminStats, formatRupees } from "../../utils/adminStats";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const AdminDashboard = () => {
  const [stats, setStats] = useState(() => getAdminStats());

  useEffect(() => {
    let isMounted = true;
    const fetchLiveStats = async () => {
      try {
        const [analyticsRes, coursesRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/reports/analytics`).then((r) => r.json()).catch(() => null),
          fetch(`${API_BASE_URL}/api/courses?all=true`).then((r) => r.json()).catch(() => null),
        ]);

        if (isMounted && analyticsRes && analyticsRes.success) {
          const summary = analyticsRes.summary || {};
          const monthly = analyticsRes.monthly || [];
          const dbCoursesCount = coursesRes?.courses?.length ?? summary.coursesCount;

          // Convert monthly analytics to student growth / dynamic chart data
          const growthData = monthly.map((m) => ({
            month: m.label,
            students: m.enrollments,
          }));

          setStats((prev) => ({
            ...prev,
            totalStudents: summary.totalEnrollments || summary.totalStudents || prev?.totalStudents || 0,
            totalCourses: dbCoursesCount ?? (summary.coursesCount || prev?.totalCourses || 0),
            totalInstructors: summary.totalInstructors || prev?.totalInstructors || 0,
            revenue: summary.totalRevenue ?? prev?.revenue ?? 0,
            growth: growthData.length > 0 ? growthData : (prev?.growth || []),
          }));
        }
      } catch (err) {
        console.warn("Could not load live analytics on dashboard:", err);
      }
    };

    fetchLiveStats();
    return () => {
      isMounted = false;
    };
  }, []);

  if (!stats) return null;

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        <div className="dashboard-heading">
          <h1>Admin Dashboard</h1>
          <p>Manage your EduSphere platform.</p>
        </div>

        <div className="dashboard-grid">
          <DashboardCard
            title="Total Enrollement"
            value={stats.totalStudents}
            icon={<FiUsers />}
          />

          <DashboardCard
            title="Total Courses"
            value={stats.totalCourses}
            icon={<FiBookOpen />}
          />

          <DashboardCard
            title="Instructors"
            value={stats.totalInstructors}
            icon={<FiUserCheck />}
          />
          <DashboardCard
            title="Revenue"
            value={formatRupees(stats.revenue)}
            icon={<FiDollarSign />}
          />
        </div>

        <div className="chart-card">
          <h2>Student Growth</h2>

          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={stats.growth}>
              <XAxis dataKey="month" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="students" fill="#6366f1" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;