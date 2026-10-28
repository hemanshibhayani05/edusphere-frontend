import React, { useEffect, useState, useMemo } from "react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../context/AuthContext";
import {
  FiDollarSign,
  FiCreditCard,
  FiCheckCircle,
  FiRefreshCw,
  FiDownload,
  FiSearch,
  FiFileText,
  FiCalendar,
  FiArrowUpRight,
  FiShield,
  FiMail,
  FiInfo,
  FiX,
  FiTrendingUp,
} from "react-icons/fi";
import { formatRupees } from "../../utils/adminStats";
import "./InstructorPayments.css";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function InstructorPayments() {
  const { user } = useAuth();
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedPayout, setSelectedPayout] = useState(null);
  const [stats, setStats] = useState({
    totalReceived: 0,
    grossSales: 0,
    platformFeesPaid: 0,
    payoutCount: 0,
  });

  const instructorEmail = user?.email || "";
  const instructorId = user?._id || user?.id || "";

  const fetchPayouts = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (instructorEmail) query.append("instructorEmail", instructorEmail);
      if (instructorId) query.append("instructorId", instructorId);

      const res = await fetch(`${API_BASE_URL}/api/payments/payouts?${query.toString()}`);
      const data = await res.json();

      let list = [];
      if (data.success && Array.isArray(data.payouts)) {
        list = data.payouts;
      }

      setPayouts(list);

      const totalReceived = list.reduce((sum, p) => sum + (Number(p.netPayoutAmount) || 0), 0);
      const grossSales = list.reduce((sum, p) => sum + (Number(p.totalCourseRevenue) || 0), 0);
      const platformFeesPaid = list.reduce((sum, p) => sum + (Number(p.adminCommissionAmount) || 0), 0);

      setStats({
        totalReceived,
        grossSales,
        platformFeesPaid,
        payoutCount: list.length,
      });
    } catch (err) {
      console.error("Error fetching instructor payouts:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayouts();
  }, [instructorEmail, instructorId]);

  const filteredPayouts = useMemo(() => {
    if (!search.trim()) return payouts;
    const q = search.toLowerCase().trim();
    return payouts.filter(
      (p) =>
        (p.payoutId && p.payoutId.toLowerCase().includes(q)) ||
        (p.transactionReference && p.transactionReference.toLowerCase().includes(q)) ||
        (p.paymentMethod && p.paymentMethod.toLowerCase().includes(q)) ||
        (p.notes && p.notes.toLowerCase().includes(q))
    );
  }, [payouts, search]);

  const handleExportCSV = () => {
    if (payouts.length === 0) {
      alert("No payout statements to export.");
      return;
    }

    const headers = [
      "Payout Reference ID",
      "Date",
      "Course Sales (INR)",
      "Admin 10% Fee (INR)",
      "Net Payout Received (INR)",
      "Payment Mode",
      "UTR / Transaction Ref",
      "Status",
    ];

    const rows = payouts.map((p) => [
      `"${p.payoutId || ""}"`,
      `"${p.createdAt ? new Date(p.createdAt).toLocaleDateString() : ""}"`,
      p.totalCourseRevenue,
      p.adminCommissionAmount,
      p.netPayoutAmount,
      `"${p.paymentMethod || "Bank Transfer"}"`,
      `"${p.transactionReference || ""}"`,
      `"${p.status || "Completed"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");

    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute(
      "download",
      `Faculty_Disbursements_${(user?.name || "Instructor").replace(/\s+/g, "_")}_${Date.now()}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="dashboard-layout">
      <Sidebar instructor />

      <div className="dashboard-content">
        {/* Page Header */}
        <div className="inst-payouts-header">
          <div>
            <h1>
              <FiDollarSign style={{ color: "#2563eb" }} /> Received Payments &amp; Disbursements
            </h1>
            <p>
              View all payouts received directly from Admin with 10% platform commission deductions &amp; bank settlement vouchers.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button className="btn-refresh-payouts" onClick={fetchPayouts} title="Refresh payout records">
              <FiRefreshCw className={loading ? "spin" : ""} /> Refresh
            </button>
            <button className="btn-export-payouts" onClick={handleExportCSV} title="Export CSV Statement">
              <FiDownload /> Export Statement
            </button>
          </div>
        </div>

        {/* Financial KPI Cards */}
        <div className="inst-payouts-kpi-grid">
          <div className="inst-kpi-card highlight">
            <div className="inst-kpi-icon net">
              <FiDollarSign />
            </div>
            <div className="inst-kpi-details">
              <span className="inst-kpi-label">Total Payouts Received (90%)</span>
              <strong className="inst-kpi-val" style={{ color: "#16a34a" }}>
                {formatRupees(stats.totalReceived)}
              </strong>
              <span className="inst-kpi-sub">Transferred directly by Admin</span>
            </div>
          </div>


          <div className="inst-kpi-card">
            <div className="inst-kpi-icon admin">
              <FiShield />
            </div>
            <div className="inst-kpi-details">
              <span className="inst-kpi-label">Admin Commission Kept (10%)</span>
              <strong className="inst-kpi-val" style={{ color: "#dc2626" }}>
                - {formatRupees(stats.platformFeesPaid)}
              </strong>
              <span className="inst-kpi-sub">EduSphere platform fee</span>
            </div>
          </div>

          <div className="inst-kpi-card">
            <div className="inst-kpi-icon count">
              <FiCheckCircle />
            </div>
            <div className="inst-kpi-details">
              <span className="inst-kpi-label">Settled Disbursements</span>
              <strong className="inst-kpi-val" style={{ color: "#2563eb" }}>
                {stats.payoutCount}
              </strong>
              <span className="inst-kpi-sub">Disbursement transactions</span>
            </div>
          </div>
        </div>

        {/* Commission Policy Banner */}
        <div className="payout-policy-banner">
          <FiInfo style={{ color: "#2563eb", fontSize: 20, flexShrink: 0 }} />
          <div>
            <strong>How Faculty Earnings Work:</strong> When a student enrolls in your courses, the entire course fee is received by Admin.
            Admin deducts a standard <strong>10% Platform Hosting Commission</strong>, and the remaining <strong>90% Net Payout</strong> is disbursed to your account via Bank Transfer/UPI with an automated email receipt.
          </div>
        </div>

        {/* Payouts Table Card */}
        <div className="table-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
            <div className="payouts-search-box">
              <FiSearch />
              <input
                type="text"
                placeholder="Search by Payout ID, UTR ref, payment mode..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <span style={{ fontSize: 13, color: "#64748b" }}>
              Showing {filteredPayouts.length} Disbursement{filteredPayouts.length !== 1 ? "s" : ""}
            </span>
          </div>

          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
              <FiRefreshCw className="spin" style={{ marginRight: 8 }} /> Loading disbursements...
            </div>
          ) : filteredPayouts.length === 0 ? (
            <div className="no-payouts-box">
              <div style={{ fontSize: 40, marginBottom: 10 }}>💳</div>
              <h3>No Disbursements Found</h3>
              <p>
                {search
                  ? "No payout records match your search criteria."
                  : "When Admin processes faculty payouts for your student enrollments, your payment vouchers and settlement details will appear here."}
              </p>
            </div>
          ) : (
            <table style={{ minWidth: 920 }}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Payout ID &amp; Date</th>
                  <th>Payment Method</th>
                  <th>UTR / Reference</th>
                  <th>Course Sales</th>
                  <th>Admin 10% Fee</th>
                  <th>Net Received (90%)</th>
                  <th>Status</th>
                  <th style={{ textAlign: "right" }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayouts.map((p, idx) => (
                  <tr key={p._id || p.payoutId || idx}>
                    <td>{idx + 1}</td>
                    <td>
                      <strong style={{ color: "#0f172a", fontFamily: "monospace", display: "block" }}>
                        {p.payoutId}
                      </strong>
                      <span style={{ fontSize: 12, color: "#64748b" }}>
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Recent"}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#334155", fontWeight: 500 }}>
                        <FiCreditCard style={{ color: "#2563eb" }} /> {p.paymentMethod || "Bank Transfer"}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: "monospace", color: "#475569", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4, fontSize: 12 }}>
                        {p.transactionReference || "UTR-COMPLETED"}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#0f172a", fontWeight: 600 }}>
                        {formatRupees(p.totalCourseRevenue)}
                      </span>
                    </td>
                    <td>
                      <span style={{ color: "#dc2626", fontWeight: 600 }}>
                        - {formatRupees(p.adminCommissionAmount)}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: "#16a34a", fontSize: 15 }}>
                        {formatRupees(p.netPayoutAmount)}
                      </strong>
                    </td>
                    <td>
                      <span className="payout-badge-completed">
                        <FiCheckCircle /> Transferred
                      </span>
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <button
                        className="btn-view-voucher"
                        onClick={() => setSelectedPayout(p)}
                        title="View Disbursement Voucher"
                      >
                        <FiFileText /> Voucher
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Settlement Voucher Modal */}
        {selectedPayout && (
          <div className="modal-overlay" onClick={() => setSelectedPayout(null)}>
            <div
              className="modal-dialog voucher-modal"
              style={{ maxWidth: 580, width: "95%", background: "#ffffff", borderRadius: 16, overflow: "hidden" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="voucher-header">
                <div>
                  <h2 style={{ margin: 0, fontSize: 18, color: "#ffffff" }}>
                    Faculty Disbursement Voucher
                  </h2>
                  <span style={{ fontSize: 12, color: "#cbd5e1" }}>
                    Official Payment Transfer Confirmation
                  </span>
                </div>
                <button
                  onClick={() => setSelectedPayout(null)}
                  style={{ border: "none", background: "transparent", fontSize: 22, color: "#ffffff", cursor: "pointer" }}
                >
                  &times;
                </button>
              </div>

              <div style={{ padding: "24px" }}>
                {/* Big Amount Card */}
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "20px", textAlign: "center", marginBottom: 20 }}>
                  <span style={{ fontSize: 12, color: "#15803d", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Net Amount Received from Admin (90%)
                  </span>
                  <div style={{ fontSize: 32, fontWeight: 800, color: "#15803d", marginTop: 4 }}>
                    {formatRupees(selectedPayout.netPayoutAmount)}
                  </div>
                  <span style={{ fontSize: 12, color: "#166534" }}>
                    ✓ Settled &amp; Deposited to Faculty
                  </span>
                </div>

                {/* Details List */}
                <div className="voucher-details-grid">
                  <div className="v-row">
                    <span>Payout Reference ID:</span>
                    <strong style={{ fontFamily: "monospace" }}>{selectedPayout.payoutId}</strong>
                  </div>
                  <div className="v-row">
                    <span>Settlement Date:</span>
                    <strong>{selectedPayout.createdAt ? new Date(selectedPayout.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "Recent"}</strong>
                  </div>
                  <div className="v-row">
                    <span>Payment Mode:</span>
                    <strong>{selectedPayout.paymentMethod}</strong>
                  </div>
                  <div className="v-row">
                    <span>Bank UTR / Transaction Ref:</span>
                    <strong style={{ fontFamily: "monospace", color: "#2563eb" }}>{selectedPayout.transactionReference || "UTR-VERIFIED"}</strong>
                  </div>
                  <div className="v-row">
                    <span>Total Student Course Sales:</span>
                    <strong>{formatRupees(selectedPayout.totalCourseRevenue)}</strong>
                  </div>
                  <div className="v-row" style={{ color: "#dc2626" }}>
                    <span>Admin 10% Platform Fee:</span>
                    <strong>- {formatRupees(selectedPayout.adminCommissionAmount)}</strong>
                  </div>
                  <div className="v-row total-row">
                    <span>Net Paid to Instructor (90%):</span>
                    <strong style={{ color: "#16a34a", fontSize: 16 }}>{formatRupees(selectedPayout.netPayoutAmount)}</strong>
                  </div>
                </div>

                {selectedPayout.notes && (
                  <div style={{ marginTop: 16, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#475569" }}>
                    <strong>Admin Memo:</strong> {selectedPayout.notes}
                  </div>
                )}
              </div>

              <div style={{ padding: "14px 24px", background: "#f8fafc", borderTop: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: 12, color: "#64748b" }}>
                  Status: <strong>Transferred &amp; Notified via Email</strong>
                </span>
                <button
                  type="button"
                  style={{ background: "#2563eb", color: "#ffffff", border: "none", padding: "8px 18px", borderRadius: 8, fontWeight: 600, cursor: "pointer" }}
                  onClick={() => setSelectedPayout(null)}
                >
                  Close Voucher
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default InstructorPayments;
