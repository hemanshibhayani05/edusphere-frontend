import React, { useEffect, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import Sidebar from "../../components/Sidebar";
import { formatRupees } from "../../utils/adminStats";
import {
  FiBarChart2,
  FiTrendingUp,
  FiDollarSign,
  FiUsers,
  FiCheckCircle,
  FiDownload,
  FiRefreshCw,
  FiCreditCard,
  FiBookOpen,
} from "react-icons/fi";
import "./Adminreports.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function AdminReports() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalEnrollments: 0,
    completedCount: 0,
    avgProgress: 0,
    avgOrderValue: 0,
    coursesCount: 0,
  });
  const [monthly, setMonthly] = useState([]);
  const [courseRows, setCourseRows] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [trainerReports, setTrainerReports] = useState([]);
  const [selectedTrainer, setSelectedTrainer] = useState(null);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/reports/analytics`);
      const data = await res.json();

      if (data.success) {
        setSummary(data.summary || {});
        setMonthly(data.monthly || []);
        setCourseRows(data.courseRows || []);
        setPaymentMethods(data.paymentMethods || []);
        setTrainerReports(data.trainerReports || []);
      }
    } catch (err) {
      console.warn("Analytics fetch warning:", err.message);
      // Fallback calculation from localStorage
      try {
        const enrollments = JSON.parse(
          localStorage.getItem("edusphere_enrollments") || "[]"
        );
        const totalRev = enrollments
          .filter((e) => e.paid)
          .reduce((sum, e) => sum + (Number(e.price) || 0), 0);
        setSummary({
          totalRevenue: totalRev,
          totalEnrollments: enrollments.length,
          completedCount: enrollments.filter((e) => (e.progress || 0) >= 100).length,
          avgProgress: enrollments.length > 0 ? 70 : 0,
          avgOrderValue: enrollments.length > 0 ? Math.round(totalRev / enrollments.length) : 0,
          coursesCount: enrollments.length,
        });
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Export Course Performance Report to CSV
  const handleExportCSV = () => {
    if (courseRows.length === 0) {
      alert("No report data available to export.");
      return;
    }

    const headers = [
      "Course Title",
      "Instructor",
      "Total Students",
      "Revenue (INR)",
      "Average Progress (%)",
      "Completed Students",
    ];

    const rows = courseRows.map((r) => [
      `"${r.course}"`,
      `"${r.instructor}"`,
      r.students,
      r.revenue,
      `${Math.round(r.progressSum / r.students)}%`,
      r.completed,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edusphere_course_performance_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        {/* Page Header */}
        <div className="reports-page-header">
          <div className="reports-header-info">
            <h1>
              <FiBarChart2 style={{ color: "#4f46e5" }} /> Analytics &amp; Revenue Reports
            </h1>
            <p>
              Comprehensive analytics on student enrollments, course revenue trends, and completion metrics.
            </p>
          </div>

          <div className="reports-header-actions">
            <button className="btn-export-csv" onClick={fetchReports} title="Refresh analytics data">
              <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
            </button>
            <button className="btn-export-csv" onClick={handleExportCSV} title="Export Course Report to CSV">
              <FiDownload /> Export Summary
            </button>
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="reports-kpi-grid">
          <div className="kpi-report-card">
            <div className="kpi-card-icon rev">
              <FiDollarSign />
            </div>
            <div className="kpi-card-details">
              <div className="kpi-num">{formatRupees(summary.totalRevenue)}</div>
              <div className="kpi-sub">Total Platform Revenue</div>
            </div>
          </div>

          <div className="kpi-report-card">
            <div className="kpi-card-icon enroll">
              <FiUsers />
            </div>
            <div className="kpi-card-details">
              <div className="kpi-num">{summary.totalEnrollments}</div>
              <div className="kpi-sub">Total Enrollments</div>
            </div>
          </div>

          <div className="kpi-report-card">
            <div className="kpi-card-icon complete">
              <FiCheckCircle />
            </div>
            <div className="kpi-card-details">
              <div className="kpi-num">{summary.completedCount}</div>
              <div className="kpi-sub">Certifications Issued</div>
            </div>
          </div>

          <div className="kpi-report-card">
            <div className="kpi-card-icon progress">
              <FiTrendingUp />
            </div>
            <div className="kpi-card-details">
              <div className="kpi-num">{summary.avgProgress}%</div>
              <div className="kpi-sub">Avg Student Completion</div>
            </div>
          </div>
        </div>

        {/* Dual Visual Analytics Charts Grid */}
        <div className="reports-charts-grid">
          {/* Chart 1: Monthly Revenue Trend */}
          <div className="report-chart-box">
            <h2>
              <FiDollarSign style={{ color: "#4f46e5" }} /> Monthly Revenue Trend
            </h2>
            <p>Total revenue generated per calendar month across all course sales.</p>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis
                  allowDecimals={false}
                  stroke="#64748b"
                  fontSize={12}
                  tickFormatter={(val) => `₹${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                />
                <Tooltip
                  formatter={(v) => [formatRupees(v), "Revenue"]}
                  contentStyle={{
                    background: "#0f172a",
                    border: "none",
                    borderRadius: 8,
                    color: "#ffffff",
                    fontSize: 13,
                  }}
                />
                <Bar
                  dataKey="revenue"
                  name="Revenue"
                  fill="#4f46e5"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Monthly Enrollments Growth */}
          <div className="report-chart-box">
            <h2>
              <FiUsers style={{ color: "#059669" }} /> Monthly Student Enrollments
            </h2>
            <p>New active student course enrollments per month.</p>
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
                <YAxis allowDecimals={false} stroke="#64748b" fontSize={12} />
                <Tooltip
                  formatter={(v) => [`${v} Students`, "Enrollments"]}
                  contentStyle={{
                    background: "#0f172a",
                    border: "none",
                    borderRadius: 8,
                    color: "#ffffff",
                    fontSize: 13,
                  }}
                />
                <Bar
                  dataKey="enrollments"
                  name="Enrollments"
                  fill="#10b981"
                  radius={[6, 6, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Channels Breakdown */}
        {paymentMethods.length > 0 && (
          <div className="methods-breakdown-card">
            <h3>
              <FiCreditCard style={{ color: "#4f46e5" }} /> Payment Channels &amp; Checkout Conversion Distribution
            </h3>
            <div className="methods-progress-grid">
              {paymentMethods.map((m) => (
                <div key={m.name} className="method-prog-box">
                  <div className="method-prog-header">
                    <span className="method-prog-name">{m.name}</span>
                    <span className="method-prog-pct">{m.percentage}%</span>
                  </div>
                  <div className="method-prog-bar-bg">
                    <div
                      className="method-prog-bar-fill"
                      style={{ width: `${Math.max(5, m.percentage)}%` }}
                    />
                  </div>
                  <div className="method-prog-count">
                    {m.count} successful transaction{m.count !== 1 ? "s" : ""}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Performance Table */}
        <div className="table-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h2 style={{ fontSize: 16, color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: 8 }}>
              <FiBookOpen style={{ color: "#4f46e5" }} /> Course-wise Financial &amp; Learning Performance
            </h2>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              {courseRows.length} Active Courses Monitored
            </span>
          </div>

          {courseRows.length === 0 ? (
            <div className="no-students">
              <h3>No Course Performance Data Yet</h3>
              <p>Reports will update continuously as students enroll and complete coursework.</p>
            </div>
          ) : (
            <table style={{ minWidth: 900 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Course Title</th>
                  <th>Instructor</th>
                  <th>Total Enrolled</th>
                  <th>Revenue Generated</th>
                  <th>Avg. Student Progress</th>
                  <th>Completions</th>
                </tr>
              </thead>
              <tbody>
                {courseRows.map((r, i) => {
                  const pct = r.students > 0 ? Math.round(r.progressSum / r.students) : 0;
                  return (
                    <tr key={r.course || i}>
                      <td>{i + 1}</td>
                      <td>
                        <strong style={{ color: "#0f172a" }}>{r.course}</strong>
                      </td>
                      <td style={{ color: "#475569" }}>{r.instructor}</td>
                      <td>
                        <strong style={{ color: "#2563eb" }}>{r.students} Students</strong>
                      </td>
                      <td>
                        <strong style={{ color: "#059669", fontSize: 14 }}>
                          {formatRupees(r.revenue)}
                        </strong>
                      </td>
                      <td>
                        <div className="progress-bar-cell">
                          <div className="progress-track">
                            <div
                              className="progress-fill"
                              style={{ width: `${Math.min(100, Math.max(5, pct))}%` }}
                            />
                          </div>
                          <span className="progress-label">{pct}%</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 700, color: r.completed > 0 ? "#15803d" : "#64748b" }}>
                          {r.completed}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Trainer-Wise Revenue & 10% Commission Report ── */}
        <div className="table-card" style={{ marginTop: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 17, color: "#0f172a", margin: "0 0 4px", display: "flex", alignItems: "center", gap: 8 }}>
                <FiUsers style={{ color: "#2563eb" }} /> Trainer-Wise Financial &amp; Payout Reports
              </h2>
              <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                Total student enrollment collections with Admin 10% Platform Commission deducted and 90% Net Instructor Disbursement calculated.
              </p>
            </div>
            {summary.totalAdminCommission !== undefined && (
              <div style={{ display: "flex", gap: 12 }}>
                <span style={{ background: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  Admin Cut: {formatRupees(summary.totalAdminCommission)}
                </span>
                <span style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}>
                  Trainer Payout: {formatRupees(summary.totalTrainerPayout)}
                </span>
              </div>
            )}
          </div>

          {trainerReports.length === 0 ? (
            <div className="no-students">
              <h3>No Trainer Financial Data Available</h3>
              <p>Trainer financial summaries will appear here as students make course enrollments.</p>
            </div>
          ) : (
            <table style={{ minWidth: 960 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Trainer / Instructor</th>
                  <th>Department</th>
                  <th>Courses</th>
                  <th>Enrollments</th>
                  <th>Total Revenue</th>
                  <th>Admin 10% Cut</th>
                  <th>Trainer 90% Payout</th>
                  <th style={{ textAlign: "right" }}>Report Action</th>
                </tr>
              </thead>
              <tbody>
                {trainerReports.map((t, idx) => (
                  <tr key={t.instructorId || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong style={{ color: "#0f172a", display: "block" }}>{t.name}</strong>
                      <span style={{ fontSize: 12, color: "#64748b" }}>{t.email}</span>
                    </td>
                    <td>
                      <span style={{ background: "#f1f5f9", padding: "3px 8px", borderRadius: 6, fontSize: 12, color: "#334155" }}>
                        {t.department}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 600, color: "#1e293b" }}>{t.coursesCount}</span>
                    </td>
                    <td>
                      <strong style={{ color: "#2563eb" }}>{t.totalEnrollments}</strong>
                    </td>
                    <td>
                      <strong style={{ color: "#0f172a", fontSize: 14 }}>
                        {formatRupees(t.totalRevenue)}
                      </strong>
                    </td>
                    <td>
                      <strong style={{ color: "#059669", fontSize: 14 }}>
                        {formatRupees(t.adminCommission)}
                      </strong>
                      <div style={{ fontSize: 11, color: "#059669", fontWeight: 600 }}>10% Platform Fee</div>
                    </td>
                    <td>
                      <strong style={{ color: "#2563eb", fontSize: 14 }}>
                        {formatRupees(t.instructorPayout)}
                      </strong>
                      <div style={{ fontSize: 11, color: "#2563eb", fontWeight: 600 }}>90% Net Payable</div>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-export-csv"
                        style={{ padding: "6px 12px", fontSize: 12, background: "#2563eb", color: "#ffffff", border: "none" }}
                        onClick={() => setSelectedTrainer(t)}
                      >
                        View Report &amp; Payout
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Selected Trainer Detailed Report Modal */}
        {selectedTrainer && (
          <div className="modal-overlay" onClick={() => setSelectedTrainer(null)}>
            <div
              className="modal-dialog report-modal-dialog"
              style={{ maxWidth: 840, width: "95%", background: "#ffffff", borderRadius: 16, overflow: "hidden" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "18px 24px", borderBottom: "1px solid #e2e8f0" }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>
                    Trainer Financial Statement — {selectedTrainer.name}
                  </h2>
                  <span style={{ fontSize: 13, color: "#64748b" }}>
                    Department: {selectedTrainer.department} | {selectedTrainer.email}
                  </span>
                </div>
                <button
                  onClick={() => setSelectedTrainer(null)}
                  style={{ border: "none", background: "transparent", fontSize: 22, cursor: "pointer", color: "#64748b" }}
                >
                  &times;
                </button>
              </div>

              <div style={{ padding: "20px 24px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14, marginBottom: 20 }}>
                  <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 10, padding: 14 }}>
                    <span style={{ fontSize: 12, color: "#64748b", fontWeight: 600, textTransform: "uppercase" }}>Total Collected Revenue</span>
                    <strong style={{ display: "block", fontSize: 20, color: "#0f172a", marginTop: 4 }}>
                      {formatRupees(selectedTrainer.totalRevenue)}
                    </strong>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Direct student course payments</span>
                  </div>

                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 10, padding: 14 }}>
                    <span style={{ fontSize: 12, color: "#166534", fontWeight: 600, textTransform: "uppercase" }}>Admin Commission (10%)</span>
                    <strong style={{ display: "block", fontSize: 20, color: "#15803d", marginTop: 4 }}>
                      + {formatRupees(selectedTrainer.adminCommission)}
                    </strong>
                    <span style={{ fontSize: 11, color: "#166534" }}>Kept by Admin as platform fee</span>
                  </div>

                  <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 10, padding: 14 }}>
                    <span style={{ fontSize: 12, color: "#1e40af", fontWeight: 600, textTransform: "uppercase" }}>Net Trainer Payout (90%)</span>
                    <strong style={{ display: "block", fontSize: 20, color: "#2563eb", marginTop: 4 }}>
                      {formatRupees(selectedTrainer.instructorPayout)}
                    </strong>
                    <span style={{ fontSize: 11, color: "#1e40af" }}>Total amount payable to instructor</span>
                  </div>
                </div>

                <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0", textAlign: "left" }}>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Date</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Student</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Course</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Amount Paid</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Admin (10%)</th>
                        <th style={{ padding: "10px 14px", color: "#475569" }}>Trainer (90%)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(!selectedTrainer.transactions || selectedTrainer.transactions.length === 0) ? (
                        <tr>
                          <td colSpan={6} style={{ padding: 24, textAlign: "center", color: "#64748b" }}>
                            No student enrollments recorded yet for this trainer.
                          </td>
                        </tr>
                      ) : (
                        selectedTrainer.transactions.map((tx, k) => (
                          <tr key={tx.paymentId || k} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "10px 14px", color: "#64748b", whiteSpace: "nowrap" }}>
                              {tx.date ? new Date(tx.date).toLocaleDateString() : "Recent"}
                            </td>
                            <td style={{ padding: "10px 14px" }}>
                              <strong>{tx.studentName || "Student"}</strong>
                              <div style={{ fontSize: 11, color: "#64748b" }}>{tx.studentEmail}</div>
                            </td>
                            <td style={{ padding: "10px 14px", color: "#1e293b", maxWidth: 200 }}>{tx.courseTitle}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#0f172a" }}>{formatRupees(tx.amount)}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 600, color: "#059669" }}>{formatRupees(tx.adminShare)}</td>
                            <td style={{ padding: "10px 14px", fontWeight: 700, color: "#2563eb" }}>{formatRupees(tx.trainerShare)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div style={{ padding: "14px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 13, color: "#64748b" }}>
                  Commission Rate: <strong>10% Platform | 90% Trainer</strong>
                </span>
                <button
                  type="button"
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 16px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                  onClick={() => setSelectedTrainer(null)}
                >
                  Close Statement
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminReports;