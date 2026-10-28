import React, { useEffect, useMemo, useState } from "react";
import Sidebar from "../../components/Sidebar";
import { formatRupees } from "../../utils/adminStats";
import {
  FiDollarSign,
  FiCreditCard,
  FiTrendingUp,
  FiCheckCircle,
  FiSearch,
  FiDownload,
  FiRefreshCw,
  FiEye,
  FiX,
  FiCopy,
  FiCheck,
  FiPrinter,
  FiShield,
  FiUser,
  FiCalendar,
} from "react-icons/fi";
import "./Adminpayments.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

const formatDateTime = (iso) =>
  iso
    ? new Date(iso).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : "N/A";

function AdminPayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments`);
      const data = await res.json();

      let backendList = [];
      if (data.success && Array.isArray(data.payments)) {
        backendList = data.payments.map((p, i) => ({
          id: p._id || p.paymentId || `pay-${i}`,
          name: p.studentName || "Student",
          email: p.studentEmail || "student@example.com",
          phone: p.studentPhone || "+91 98765 43210",
          course: p.courseTitle || "Course",
          instructor: p.instructor || "EduSphere Faculty",
          amount: Number(p.amount) || 0,
          basePrice: Number(p.basePrice) || Math.round((Number(p.amount) || 0) / 1.18),
          gst: Number(p.gst) || Math.round((Number(p.amount) || 0) - (Number(p.amount) || 0) / 1.18),
          paymentId: p.paymentId || "N/A",
          orderId: p.orderId || "N/A",
          method: p.paymentMethod || "UPI QR Scanner",
          methodDetails: p.paymentMethodDetails || p.paymentMethod || "Instant Payment",
          date: p.enrolledAt || p.createdAt,
          paid: Boolean(p.paid ?? true),
          progress: p.progress || 0,
        }));
      }

      // Check localStorage for any recent local enrollments not yet synced
      try {
        const dummyTitles = [
          "Complete React.js Developer Course",
          "Full-Stack MERN Development",
          "Node.js & Express.js Backend Masterclass",
          "HTML, CSS & JavaScript Bootcamp",
          "Python Programming for Beginners",
        ];
        const localEnrollments = JSON.parse(
          localStorage.getItem("edusphere_enrollments") || "[]"
        );
        localEnrollments.forEach((e, idx) => {
          if (e.courseTitle && dummyTitles.includes(e.courseTitle)) return;
          if (!backendList.find((b) => b.paymentId === e.paymentId)) {
            backendList.unshift({
              id: e.paymentId || `local-${idx}`,
              name: e.studentName || "Student",
              email: e.studentEmail || "student@example.com",
              phone: e.studentPhone || "+91 98765 43210",
              course: e.courseTitle || "Course",
              instructor: e.instructor || "EduSphere Faculty",
              amount: Number(e.price) || 0,
              basePrice: Math.round((Number(e.price) || 0) / 1.18),
              gst: Math.round((Number(e.price) || 0) - (Number(e.price) || 0) / 1.18),
              paymentId: e.paymentId || "N/A",
              orderId: e.orderId || "N/A",
              method: e.paymentMethod || "UPI QR Scanner",
              methodDetails: e.paymentMethodDetails || "Instant Payment",
              date: e.enrolledAt || new Date().toISOString(),
              paid: Boolean(e.paid ?? true),
              progress: e.progress || 0,
            });
          }
        });
      } catch (_) {}

      setPayments(backendList);
    } catch (err) {
      console.warn("Backend payments load warning:", err.message);
      // Fallback to localStorage
      try {
        const local = JSON.parse(localStorage.getItem("edusphere_enrollments") || "[]");
        setPayments(
          local.map((e, idx) => ({
            id: e.paymentId || `local-${idx}`,
            name: e.studentName || "Student",
            email: e.studentEmail || "student@example.com",
            phone: e.studentPhone || "+91 98765 43210",
            course: e.courseTitle || "Course",
            instructor: e.instructor || "EduSphere Faculty",
            amount: Number(e.price) || 0,
            basePrice: Math.round((Number(e.price) || 0) / 1.18),
            gst: Math.round((Number(e.price) || 0) - (Number(e.price) || 0) / 1.18),
            paymentId: e.paymentId || "N/A",
            orderId: e.orderId || "N/A",
            method: e.paymentMethod || "UPI QR Scanner",
            methodDetails: e.paymentMethodDetails || "Instant Payment",
            date: e.enrolledAt || new Date().toISOString(),
            paid: Boolean(e.paid ?? true),
            progress: e.progress || 0,
          }))
        );
      } catch (_) {}
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  // Filtered Payments
  const filtered = useMemo(() => {
    return payments.filter((p) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        [p.name, p.email, p.phone, p.course, p.paymentId, p.orderId, p.method]
          .join(" ")
          .toLowerCase()
          .includes(q);

      const matchesMethod =
        selectedMethod === "all" ||
        (selectedMethod === "upi" && p.method.toLowerCase().includes("upi")) ||
        (selectedMethod === "card" && p.method.toLowerCase().includes("card")) ||
        (selectedMethod === "netbanking" && p.method.toLowerCase().includes("net")) ||
        (selectedMethod === "wallet" && p.method.toLowerCase().includes("wallet"));

      return matchesSearch && matchesMethod;
    });
  }, [payments, search, selectedMethod]);

  // Derived KPI Stats
  const stats = useMemo(() => {
    const totalRev = payments.reduce((sum, p) => sum + (p.paid ? p.amount : 0), 0);
    const totalCount = payments.length;
    const aov = totalCount > 0 ? Math.round(totalRev / totalCount) : 0;

    // Top method calculation
    const methodCounts = {};
    payments.forEach((p) => {
      const m = p.method || "UPI";
      methodCounts[m] = (methodCounts[m] || 0) + 1;
    });
    let topMethod = "UPI QR Scanner";
    let max = 0;
    Object.keys(methodCounts).forEach((m) => {
      if (methodCounts[m] > max) {
        max = methodCounts[m];
        topMethod = m;
      }
    });

    return { totalRev, totalCount, aov, topMethod };
  }, [payments]);

  // Export to CSV
  const handleExportCSV = () => {
    if (payments.length === 0) {
      alert("No payment transactions to export.");
      return;
    }

    const headers = [
      "Payment ID",
      "Order ID",
      "Student Name",
      "Student Email",
      "Phone",
      "Course Title",
      "Amount (INR)",
      "Payment Method",
      "Date",
      "Status",
    ];

    const rows = payments.map((p) => [
      `"${p.paymentId}"`,
      `"${p.orderId}"`,
      `"${p.name}"`,
      `"${p.email}"`,
      `"${p.phone}"`,
      `"${p.course}"`,
      p.amount,
      `"${p.method}"`,
      `"${formatDateTime(p.date)}"`,
      `"${p.paid ? "Paid" : "Pending"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `edusphere_payments_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar admin />

      <div className="dashboard-content">
        {/* Page Header */}
        <div className="payments-page-header">
          <div className="payments-header-info">
            <h1>
              <FiDollarSign style={{ color: "#059669" }} /> Platform Payment Transactions
            </h1>
            <p>
              Real-time audit log of student course purchases, transactions, order IDs, and payment methods.
            </p>
          </div>

          <div className="payments-header-actions">
            <button className="btn-export-csv" onClick={fetchPayments} title="Refresh payments from database">
              <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
            </button>
            <button className="btn-export-csv" onClick={handleExportCSV} title="Download transaction CSV">
              <FiDownload /> Export CSV
            </button>
          </div>
        </div>

        {/* KPI Stats Grid */}
        <div className="payments-stats-grid">
          <div className="payment-stat-card">
            <div className="stat-card-icon revenue">
              <FiDollarSign />
            </div>
            <div className="stat-card-details">
              <div className="stat-val">{formatRupees(stats.totalRev)}</div>
              <div className="stat-lbl">Total Revenue Collected</div>
            </div>
          </div>

          <div className="payment-stat-card">
            <div className="stat-card-icon orders">
              <FiCheckCircle />
            </div>
            <div className="stat-card-details">
              <div className="stat-val">{stats.totalCount}</div>
              <div className="stat-lbl">Paid Enrollments</div>
            </div>
          </div>

          <div className="payment-stat-card">
            <div className="stat-card-icon aov">
              <FiTrendingUp />
            </div>
            <div className="stat-card-details">
              <div className="stat-val">{formatRupees(stats.aov)}</div>
              <div className="stat-lbl">Avg. Transaction Value</div>
            </div>
          </div>

          <div className="payment-stat-card">
            <div className="stat-card-icon method">
              <FiCreditCard />
            </div>
            <div className="stat-card-details">
              <div className="stat-val" style={{ fontSize: 16 }}>{stats.topMethod}</div>
              <div className="stat-lbl">Primary Payment Channel</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="payments-toolbar">
          <div className="payments-search-box">
            <FiSearch style={{ color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search by student, email, course, payment ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="payments-filter-pills">
            <button
              className={`method-filter-pill ${selectedMethod === "all" ? "active" : ""}`}
              onClick={() => setSelectedMethod("all")}
            >
              All Methods ({payments.length})
            </button>
            <button
              className={`method-filter-pill ${selectedMethod === "upi" ? "active" : ""}`}
              onClick={() => setSelectedMethod("upi")}
            >
              UPI &amp; QR
            </button>
            <button
              className={`method-filter-pill ${selectedMethod === "card" ? "active" : ""}`}
              onClick={() => setSelectedMethod("card")}
            >
              Cards
            </button>
            <button
              className={`method-filter-pill ${selectedMethod === "netbanking" ? "active" : ""}`}
              onClick={() => setSelectedMethod("netbanking")}
            >
              Net Banking
            </button>
            <button
              className={`method-filter-pill ${selectedMethod === "wallet" ? "active" : ""}`}
              onClick={() => setSelectedMethod("wallet")}
            >
              Wallets
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="table-card">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> Loading transactions from database...
            </div>
          ) : filtered.length === 0 ? (
            <div className="no-students">
              <h3>No Transactions Found</h3>
              <p>No payment records match the current search or method filter.</p>
            </div>
          ) : (
            <table style={{ minWidth: 1050 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Student</th>
                  <th>Course Purchased</th>
                  <th>Amount</th>
                  <th>Payment Method</th>
                  <th>Transaction ID</th>
                  <th>Date &amp; Time</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p, i) => {
                  const isUPI = (p.method || "").toLowerCase().includes("upi");
                  const isCard = (p.method || "").toLowerCase().includes("card");

                  return (
                    <tr key={p.id || i}>
                      <td>{i + 1}</td>
                      <td>
                        <div className="student-avatar-cell">
                          <div className="student-avatar-chip">
                            {p.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <strong style={{ color: "#0f172a", fontSize: 14 }}>{p.name}</strong>
                            <div style={{ fontSize: 12, color: "#64748b" }}>{p.email}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <strong style={{ color: "#1e293b" }}>{p.course}</strong>
                        <div style={{ fontSize: 11, color: "#64748b" }}>Instructor: {p.instructor}</div>
                      </td>
                      <td>
                        <strong style={{ color: "#059669", fontSize: 15 }}>
                          {formatRupees(p.amount)}
                        </strong>
                      </td>
                      <td>
                        <span className={`method-badge-pill ${isUPI ? "upi" : isCard ? "card" : ""}`}>
                          {isUPI ? "⚡" : isCard ? "💳" : "🏦"} {p.method}
                        </span>
                      </td>
                      <td>
                        <div className="payment-id-cell">
                          <span className="payment-id-code">
                            {p.paymentId}
                            <button
                              type="button"
                              onClick={() => handleCopy(p.paymentId, `copy_${i}`)}
                              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#94a3b8" }}
                              title="Copy Payment ID"
                            >
                              {copiedId === `copy_${i}` ? <FiCheck style={{ color: "#16a34a" }} /> : <FiCopy />}
                            </button>
                          </span>
                          <span className="order-id-code">{p.orderId}</span>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: 13, color: "#475569" }}>
                          {formatDateTime(p.date)}
                        </span>
                      </td>
                      <td>
                        <span className="payment-status-badge">
                          <FiCheckCircle /> Paid
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="btn-view-receipt"
                          onClick={() => setSelectedPayment(p)}
                          title="View Official Receipt"
                        >
                          <FiEye /> View Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── DIGITAL PAYMENT RECEIPT MODAL ── */}
      {selectedPayment && (
        <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
          <div className="modal-dialog receipt-modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="receipt-modal-header">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h2>
                    <FiShield /> EduSphere Platform Receipt
                  </h2>
                  <p>Official Digital Payment Confirmation</p>
                </div>
                <button
                  className="modal-close-btn"
                  style={{ color: "#ffffff" }}
                  onClick={() => setSelectedPayment(null)}
                >
                  <FiX />
                </button>
              </div>
            </div>

            <div className="receipt-modal-body">
              <div className="receipt-success-banner">
                <FiCheckCircle />
                <div>
                  <strong>Payment Completed Successfully</strong>
                  <span>Transaction confirmed and course access unlocked.</span>
                </div>
              </div>

              <div className="receipt-details-grid">
                <div className="receipt-field-box">
                  <span className="receipt-field-label">Student Name</span>
                  <span className="receipt-field-val">{selectedPayment.name}</span>
                </div>

                <div className="receipt-field-box">
                  <span className="receipt-field-label">Student Email</span>
                  <span className="receipt-field-val">{selectedPayment.email}</span>
                </div>

                <div className="receipt-field-box">
                  <span className="receipt-field-label">Payment ID</span>
                  <span className="receipt-field-val">{selectedPayment.paymentId}</span>
                </div>

                <div className="receipt-field-box">
                  <span className="receipt-field-label">Order Reference</span>
                  <span className="receipt-field-val">{selectedPayment.orderId}</span>
                </div>

                <div className="receipt-field-box">
                  <span className="receipt-field-label">Payment Channel</span>
                  <span className="receipt-field-val">{selectedPayment.method}</span>
                </div>

                <div className="receipt-field-box">
                  <span className="receipt-field-label">Payment Timestamp</span>
                  <span className="receipt-field-val">{formatDateTime(selectedPayment.date)}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="receipt-price-summary">
                <div className="receipt-price-row">
                  <span>Enrolled Course:</span>
                  <strong>{selectedPayment.course}</strong>
                </div>
                <div className="receipt-price-row">
                  <span>Base Course Fee:</span>
                  <span>{formatRupees(selectedPayment.basePrice)}</span>
                </div>
                <div className="receipt-price-row">
                  <span>GST (18% Included):</span>
                  <span>{formatRupees(selectedPayment.gst)}</span>
                </div>
                <div className="receipt-price-row total">
                  <span>Total Amount Paid:</span>
                  <span>{formatRupees(selectedPayment.amount)}</span>
                </div>
              </div>

              <div className="receipt-modal-footer">
                <button
                  type="button"
                  className="btn-export-csv"
                  onClick={() => window.print()}
                >
                  <FiPrinter /> Print Receipt
                </button>
                <button
                  type="button"
                  className="btn-approve-action"
                  onClick={() => setSelectedPayment(null)}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminPayments;