import React, { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  FiCreditCard,
  FiPrinter,
  FiCheckCircle,
  FiSearch,
  FiDollarSign,
  FiFileText,
  FiArrowRight,
  FiShield,
  FiX,
  FiEye,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import "./StudentPayments.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function StudentPayments() {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [copiedId, setCopiedId] = useState("");

  const formatRupees = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "N/A";
    const d = new Date(dateStr);
    return isNaN(d.getTime())
      ? dateStr
      : d.toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        });
  };

  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(""), 2000);
  };

  useEffect(() => {
    loadStudentPayments();
  }, [user]);

  const loadStudentPayments = async () => {
    try {
      setLoading(true);

      const studentEmail = (user?.email || "").toLowerCase().trim();
      const studentId = user?.id || user?._id || "";

      let backendList = [];
      try {
        const queryParams = new URLSearchParams();
        if (studentEmail) queryParams.append("studentEmail", studentEmail);
        if (studentId) queryParams.append("studentId", studentId);

        const res = await fetch(`${API_BASE_URL}/api/payments?${queryParams.toString()}`);
        const data = await res.json();
        if (data.success && Array.isArray(data.payments)) {
          backendList = data.payments.map((p) => ({
            id: p.paymentId || p._id,
            name: p.studentName || user?.name || "Student",
            email: p.studentEmail || user?.email || "",
            phone: p.studentPhone || user?.phone || "+91 98765 43210",
            course: p.courseTitle || "Course",
            instructor: p.instructor || "EduSphere Faculty",
            amount: Number(p.amount) || 0,
            basePrice: p.basePrice || Math.round((Number(p.amount) || 0) / 1.18),
            gst: p.gst || Math.round((Number(p.amount) || 0) - (Number(p.amount) || 0) / 1.18),
            paymentId: p.paymentId || "N/A",
            orderId: p.orderId || "N/A",
            method: p.paymentMethod || "UPI / Online Payment",
            methodDetails: p.paymentMethodDetails || "Instant Payment Confirmation",
            date: p.enrolledAt || p.createdAt || new Date().toISOString(),
            paid: Boolean(p.paid ?? true),
            progress: p.progress || 0,
          }));
        }
      } catch (err) {
        console.warn("Could not reach backend payments endpoint:", err.message);
      }

      // Merge with localStorage enrollments for current student
      try {
        const localEnrollments = JSON.parse(
          localStorage.getItem("edusphere_enrollments") || "[]"
        );

        localEnrollments.forEach((e, idx) => {
          const matchesStudent =
            !studentEmail ||
            !e.studentEmail ||
            e.studentEmail.toLowerCase() === studentEmail;

          if (matchesStudent) {
            backendList.unshift({
              id: e.paymentId || `local-${idx}`,
              name: e.studentName || user?.name || "Student",
              email: e.studentEmail || user?.email || "",
              phone: e.studentPhone || user?.phone || "+91 98765 43210",
              course: e.courseTitle || "Course",
              instructor: e.instructor || "EduSphere Faculty",
              amount: Number(e.price) || 0,
              basePrice: Math.round((Number(e.price) || 0) / 1.18),
              gst: Math.round((Number(e.price) || 0) - (Number(e.price) || 0) / 1.18),
              paymentId: e.paymentId || `pay_DEMO${idx + 101}`,
              orderId: e.orderId || `order_DEMO${idx + 101}`,
              method: e.paymentMethod || "UPI QR Scanner",
              methodDetails: e.paymentMethodDetails || "Instant Payment Confirmation",
              date: e.enrolledAt || new Date().toISOString(),
              paid: Boolean(e.paid ?? true),
              progress: e.progress || 0,
            });
          }
        });
      } catch (_) {}

      // ── Deduplicate: Ensure strictly ONE payment entry per enrolled course (keep latest) ──
      const uniquePayments = [];
      const seenCourses = new Set();
      const seenPaymentIds = new Set();

      // Sort by date descending (latest first)
      backendList.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));

      for (const item of backendList) {
        const normalizedTitle = (item.course || "").trim().toLowerCase();
        const pId = item.paymentId ? item.paymentId.trim() : null;

        if (seenPaymentIds.has(pId)) continue;
        if (normalizedTitle && seenCourses.has(normalizedTitle)) continue;

        if (pId) seenPaymentIds.add(pId);
        if (normalizedTitle) seenCourses.add(normalizedTitle);
        uniquePayments.push(item);
      }

      setPayments(uniquePayments);
    } catch (error) {
      console.error("Error loading payment history:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = useMemo(() => {
    if (!searchTerm.trim()) return payments;
    const q = searchTerm.toLowerCase().trim();
    return payments.filter(
      (p) =>
        (p.course && p.course.toLowerCase().includes(q)) ||
        (p.paymentId && p.paymentId.toLowerCase().includes(q)) ||
        (p.method && p.method.toLowerCase().includes(q)) ||
        (p.instructor && p.instructor.toLowerCase().includes(q))
    );
  }, [payments, searchTerm]);

  const totalSpent = useMemo(() => {
    return payments.reduce((sum, p) => sum + (p.paid ? p.amount : 0), 0);
  }, [payments]);

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="dashboard-content student-payments-page">
        {/* Header */}
        <div className="payments-page-header">
          <div className="payments-header-info">
            <h1>
              <FiCreditCard /> Payment History &amp; Invoices
            </h1>
            <p>
              View, verify, and download official digital receipts for all your enrolled courses.
            </p>
          </div>

          <div className="payments-header-actions">
            <Link to="/courses" className="btn-explore-link">
              Browse More Courses <FiArrowRight />
            </Link>
          </div>
        </div>

        {/* Overview Stats */}
        <div className="payments-stats-grid">
          <div className="payment-stat-card">
            <div className="stat-card-icon revenue">
              <FiDollarSign />
            </div>
            <div>
              <p>Total Investment</p>
              <h2>{formatRupees(totalSpent)}</h2>
            </div>
          </div>

          <div className="payment-stat-card">
            <div className="stat-card-icon orders">
              <FiFileText />
            </div>
            <div>
              <p>Total Transactions</p>
              <h2>{payments.length}</h2>
            </div>
          </div>

          <div className="payment-stat-card">
            <div className="stat-card-icon status">
              <FiCheckCircle />
            </div>
            <div>
              <p>Payment Status</p>
              <h2>100% Verified</h2>
            </div>
          </div>
        </div>

        {/* Transactions Table Section */}
        <div className="dashboard-section payments-table-card">
          <div className="payments-table-toolbar">
            <div className="payments-search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search by course, payment ID, method..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={() => setSearchTerm("")}
                >
                  <FiX />
                </button>
              )}
            </div>

            <div className="payments-count-tag">
              Showing {filteredPayments.length} of {payments.length} payments
            </div>
          </div>

          {loading ? (
            <div className="dashboard-loading">
              <div className="dash-spinner" />
              <p>Loading your payment records...</p>
            </div>
          ) : filteredPayments.length === 0 ? (
            <div className="dash-empty-state">
              <FiCreditCard size={48} />
              <h3>No payment records found</h3>
              <p>
                {searchTerm
                  ? "No transactions match your search keyword. Try clearing the filter."
                  : "You haven't made any course purchases yet. Explore our course catalog to get started."}
              </p>
              <Link to="/courses" className="dash-explore-btn">
                Explore Courses
              </Link>
            </div>
          ) : (
            <div className="payments-table-responsive">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Course</th>
                    <th>Amount Paid</th>
                    <th>Payment Method</th>
                    <th>Transaction ID</th>
                    <th>Date &amp; Time</th>
                    <th>Status</th>
                    <th style={{ textAlign: "right" }}>Receipt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map((p, index) => {
                    const isUPI = (p.method || "").toLowerCase().includes("upi");
                    const isCard = (p.method || "").toLowerCase().includes("card");

                    return (
                      <tr key={p.id || index}>
                        <td>{index + 1}</td>
                        <td>
                          <strong className="course-name-text">{p.course}</strong>
                          <div className="instructor-subtext">Instructor: {p.instructor}</div>
                        </td>
                        <td>
                          <span className="payment-amount-text">
                            {formatRupees(p.amount)}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`payment-method-pill ${
                              isUPI ? "upi" : isCard ? "card" : ""
                            }`}
                          >
                            {isUPI ? "⚡" : isCard ? "💳" : "🏦"} {p.method}
                          </span>
                        </td>
                        <td>
                          <div className="txn-id-wrapper">
                            <span className="txn-id-code">
                              {p.paymentId}
                              <button
                                type="button"
                                className="copy-btn"
                                onClick={() => handleCopy(p.paymentId, `copy_${index}`)}
                                title="Copy Payment ID"
                              >
                                {copiedId === `copy_${index}` ? (
                                  <FiCheck className="text-success" />
                                ) : (
                                  <FiCopy />
                                )}
                              </button>
                            </span>
                            {p.orderId && p.orderId !== "N/A" && (
                              <span className="txn-order-code">{p.orderId}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="txn-date-text">{formatDateTime(p.date)}</span>
                        </td>
                        <td>
                          <span className="txn-status-badge success">
                            <FiCheckCircle /> Success
                          </span>
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            type="button"
                            className="btn-view-receipt-action"
                            onClick={() => setSelectedPayment(p)}
                            title="View / Print Tax Receipt"
                          >
                            <FiEye /> View Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Digital Payment Receipt Modal */}
        {selectedPayment && (
          <div className="modal-overlay" onClick={() => setSelectedPayment(null)}>
            <div
              className="modal-dialog student-receipt-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="receipt-modal-header">
                <div className="receipt-modal-header-top">
                  <div>
                    <h2>
                      <FiShield /> EduSphere Official Receipt
                    </h2>
                    <p>Verified Student Payment &amp; Enrollment Tax Invoice</p>
                  </div>
                  <button
                    className="modal-close-btn"
                    onClick={() => setSelectedPayment(null)}
                    title="Close Receipt"
                  >
                    <FiX />
                  </button>
                </div>
              </div>

              <div className="receipt-modal-body">
                <div className="receipt-success-banner">
                  <FiCheckCircle />
                  <div>
                    <strong>Payment Verified &amp; Completed</strong>
                    <span>
                      Course enrollment is active. Lifetime access and certification enabled.
                    </span>
                  </div>
                </div>

                <div className="receipt-details-grid">
                  <div className="receipt-field-box">
                    <span className="receipt-field-label">Student Name</span>
                    <span className="receipt-field-val">{selectedPayment.name}</span>
                  </div>

                  <div className="receipt-field-box">
                    <span className="receipt-field-label">Registered Email</span>
                    <span className="receipt-field-val">{selectedPayment.email}</span>
                  </div>

                  <div className="receipt-field-box">
                    <span className="receipt-field-label">Payment ID (UTR / RZP)</span>
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
                    <span className="receipt-field-val">
                      {formatDateTime(selectedPayment.date)}
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="receipt-price-summary">
                  <div className="receipt-price-row">
                    <span>Enrolled Course:</span>
                    <strong>{selectedPayment.course}</strong>
                  </div>
                  <div className="receipt-price-row">
                    <span>Base Course Price:</span>
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
                    className="btn-print-receipt"
                    onClick={() => window.print()}
                  >
                    <FiPrinter /> Print Receipt
                  </button>
                  <button
                    type="button"
                    className="btn-done-modal"
                    onClick={() => setSelectedPayment(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudentPayments;
