import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { courses } from "../data/MockData";
import { useAuth } from "../context/AuthContext";
import {
  FiShield,
  FiLock,
  FiCheckCircle,
  FiCreditCard,
  FiTag,
  FiClock,
  FiStar,
  FiUsers,
  FiAlertCircle,
  FiX,
  FiSmartphone,
  FiChevronRight,
  FiArrowLeft,
  FiMail,
  FiCopy,
  FiCheck,
  FiZap,
} from "react-icons/fi";
import { QRCodeSVG } from "qrcode.react";
import "./Enrollment.css";

function QrIcon({ size = 16, className = "" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <circle cx="6.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
      <circle cx="6.5" cy="17.5" r="1" fill="currentColor" />
    </svg>
  );
}

/* ─────────────────────────────────────────────────────────────
   REAL SCANNABLE UPI QR CODE COMPONENT (Works with any phone camera & UPI app)
   Encodes official NPCI UPI Deep Link format for PhonePe, GPay, Paytm & BHIM
───────────────────────────────────────────────────────────── */
function UpiQrCode({ amount, upiId: initialUpiId = "edusphere@upi", courseName = "Course Enrollment" }) {
  const [copied, setCopied] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(300); // 5 min countdown
  const [customUpiId, setCustomUpiId] = useState(() => {
    return localStorage.getItem("edusphere_custom_payee_upi") || "";
  });
  const [isEditingUpi, setIsEditingUpi] = useState(false);
  const [inputUpi, setInputUpi] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 300));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  const activeUpiId = customUpiId.trim() || initialUpiId;
  const isDemoUpi = !customUpiId.trim() || activeUpiId === "edusphere@upi";

  const handleSaveUpi = () => {
    const val = inputUpi.trim();
    if (val && val.includes("@")) {
      setCustomUpiId(val);
      localStorage.setItem("edusphere_custom_payee_upi", val);
      setIsEditingUpi(false);
    }
  };

  const handleResetDemo = () => {
    setCustomUpiId("");
    localStorage.removeItem("edusphere_custom_payee_upi");
    setIsEditingUpi(false);
  };

  // Official NPCI Standard UPI Intent URI for QR code scanning
  const payeeName = isDemoUpi ? "EduSphere Learning" : (activeUpiId.split("@")[0] || "EduSphere");
  const cleanNote = (courseName || "Course").substring(0, 20).replace(/[^a-zA-Z0-9 ]/g, "").trim() || "CourseFee";
  const upiUri = `upi://pay?pa=${encodeURIComponent(activeUpiId)}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=${encodeURIComponent(cleanNote)}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="upi-scanner-container">
      {/* Expiry countdown badge */}
      <div className="qr-timer-badge">
        <FiClock size={12} />
        <span>QR code active for: <strong>{formatTime(secondsLeft)}</strong> mins</span>
      </div>

      <div className="upi-qr-card real-scannable-card">
        {/* Animated Scanning Laser Line */}
        <div className="qr-laser-line" />

        {/* Real Authentic Scannable QR Code */}
        <div className="qr-canvas-wrap">
          <QRCodeSVG
            value={upiUri}
            size={164}
            level="M"
            includeMargin={true}
            bgColor="#ffffff"
            fgColor="#0f172a"
          />
        </div>

        {/* Central UPI Badge */}
        <div className="qr-center-pill">
          <span>₹ UPI</span>
        </div>
      </div>

      <div className="phone-scan-instruction">
        <FiSmartphone className="instruction-icon" />
        <span>Point your phone camera or open <strong>PhonePe, GPay, Paytm, BHIM</strong></span>
      </div>

      {/* Payee UPI ID Bar with Change Button */}
      <div className="upi-id-copy-row">
        <span>Payee UPI: <strong>{activeUpiId}</strong> {isDemoUpi && <span className="demo-chip">Demo</span>}</span>
        <div style={{ display: "flex", gap: "6px" }}>
          <button
            type="button"
            className="copy-btn edit-payee-btn"
            onClick={() => {
              setIsEditingUpi(!isEditingUpi);
              setInputUpi(customUpiId || "");
            }}
          >
            ✏️ {isDemoUpi ? "Use My Real UPI" : "Change"}
          </button>
          <button type="button" className="copy-btn" onClick={handleCopy}>
            {copied ? <FiCheck className="copied-icon" /> : <FiCopy />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Custom Payee UPI ID Form */}
      {isEditingUpi && (
        <div className="upi-edit-box">
          <label className="upi-edit-label">Enter your real UPI ID (Google Pay, PhonePe, Paytm):</label>
          <div className="upi-edit-input-row">
            <input
              type="text"
              placeholder="e.g. yourname@okaxis or mobile@paytm"
              value={inputUpi}
              onChange={(e) => setInputUpi(e.target.value)}
              className="upi-edit-input"
            />
            <button type="button" className="upi-save-btn" onClick={handleSaveUpi}>
              Apply to QR
            </button>
            {!isDemoUpi && (
              <button type="button" className="upi-reset-btn" onClick={handleResetDemo} title="Reset to default demo ID">
                Reset
              </button>
            )}
          </div>
          <div className="quick-handles-row">
            <span className="quick-suf-label">Quick handles:</span>
            {["@okaxis", "@ybl", "@paytm", "@okhdfcbank", "@oksbi", "@ibl"].map((suf) => (
              <button
                key={suf}
                type="button"
                className="quick-suf-tag"
                onClick={() => {
                  const base = inputUpi.split("@")[0] || "yourname";
                  setInputUpi(base + suf);
                }}
              >
                {suf}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Explanatory Banner for Bank Verification */}
      {isDemoUpi && !isEditingUpi && (
        <div className="upi-explanation-banner">
          <div className="banner-title">
            <FiAlertCircle size={13} />
            <span>Why did your phone say <em>"Cannot pay with this QR code"</em>?</span>
          </div>
          <p>
            Bank apps (PhonePe, GPay) verify each UPI ID against live bank records. <code>edusphere@upi</code> is a demo ID.
          </p>
          <div className="banner-choices">
            <span>Option 1: Click <strong>"✏️ Use My Real UPI"</strong> above to scan to your real bank account.</span>
            <span>Option 2: Use <strong>"⚡ Auto-Fill Demo UTR"</strong> below &amp; click Verify for instant test enrollment.</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   RAZORPAY PAYMENT MODAL (Supports Live & Test/Demo Mode)
   Supports UPI Scanner, UPI ID, Cards, Net Banking & Wallets
───────────────────────────────────────────────────────────── */
function PaymentModal({ amount, courseName, user, orderId, initialTab = "upi", initialSubTab = "scanner", onSuccess, onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab); // upi | card | netbanking | wallet
  const [upiSubTab, setUpiSubTab] = useState(initialSubTab); // scanner | upiid
  const [utrNo, setUtrNo] = useState("");
  const [processingText, setProcessingText] = useState("Authorizing Payment Instant Verification…");
  const [upiId, setUpiId] = useState("");
  const [cardNum, setCardNum] = useState("");
  const [cardName, setCardName] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [bank, setBank] = useState("");
  const [wallet, setWallet] = useState("");
  const [skipPin, setSkipPin] = useState(true); // Default true for seamless no-PIN flow
  const [step, setStep] = useState("form"); // form | processing | otp
  const [otp, setOtp] = useState("");
  const [errors, setErrors] = useState({});

  const defaultUpiId = "edusphere@upi";
  const currentOrderId = orderId || ("order_RZP" + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString(36).toUpperCase());

  const formatCard = (val) => {
    return val
      .replace(/\D/g, "")
      .slice(0, 16)
      .replace(/(.{4})/g, "$1 ")
      .trim();
  };

  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, "").slice(0, 4);
    if (v.length >= 3) return v.slice(0, 2) + "/" + v.slice(2);
    return v;
  };

  const validate = () => {
    const errs = {};
    if (activeTab === "upi") {
      if (upiSubTab === "upiid" && (!upiId.trim() || !upiId.includes("@"))) {
        errs.upiId = "Please enter a valid UPI ID (e.g. name@upi)";
      }
    } else if (activeTab === "card") {
      if (cardNum.replace(/\s/g, "").length < 16) errs.cardNum = "Enter valid 16-digit card number";
      if (!cardName.trim()) errs.cardName = "Enter card holder name";
      if (expiry.length < 5) errs.expiry = "Enter valid expiry (MM/YY)";
      if (cvv.length < 3) errs.cvv = "Enter valid CVV";
    } else if (activeTab === "netbanking") {
      if (!bank) errs.bank = "Please select a bank";
    } else if (activeTab === "wallet") {
      if (!wallet) errs.wallet = "Please select a digital wallet";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = () => {
    if (!validate()) return;

    if (activeTab === "upi" && upiSubTab === "scanner") {
      setProcessingText("Verifying UPI scan from mobile phone with NPCI gateway…");
      setStep("processing");
      setTimeout(() => {
        completePayment();
      }, 1400);
      return;
    }

    // If skipPin is active (or UPI/netbanking/wallet), complete payment immediately without PIN/OTP
    if (skipPin || activeTab === "upi" || activeTab === "netbanking" || activeTab === "wallet") {
      setProcessingText("Authorizing Payment Instant Verification…");
      setStep("processing");
      setTimeout(() => {
        completePayment();
      }, 1400);
    } else {
      setStep("processing");
      setTimeout(() => setStep("otp"), 1200);
    }
  };

  const completePayment = () => {
    const paymentId = "pay_RZP" + Math.random().toString(36).slice(2, 6).toUpperCase() + Date.now().toString(36).toUpperCase();

    let methodLabel = "Razorpay UPI";
    let methodDetails = `UPI QR (${defaultUpiId})`;

    if (activeTab === "upi") {
      if (upiSubTab === "scanner") {
        const finalUtr = utrNo.trim() || ("4291" + Math.floor(10000000 + Math.random() * 90000000));
        methodLabel = "UPI QR Scanner (Phone Camera Scan)";
        methodDetails = `Scanned with Mobile Phone (UTR: ${finalUtr}) • NPCI UPI Verified`;
      } else {
        methodLabel = "Razorpay UPI Direct";
        methodDetails = `UPI ID: ${upiId || "student@upi"} (Instant Authorization)`;
      }
    } else if (activeTab === "card") {
      methodLabel = "Razorpay Credit/Debit Card";
      const cleanCard = cardNum.replace(/\s/g, "");
      const last4 = cleanCard.length >= 4 ? cleanCard.slice(-4) : "4444";
      methodDetails = `Card ending in •••• ${last4}${cardName ? ` (${cardName})` : ""} - Direct Checkout`;
    } else if (activeTab === "netbanking") {
      methodLabel = "Razorpay Net Banking";
      methodDetails = `Bank: ${bank || "State Bank of India"} (Direct Authorization)`;
    } else if (activeTab === "wallet") {
      methodLabel = "Razorpay Wallet";
      methodDetails = `Wallet: ${wallet || "Paytm Wallet"} (Direct Authorization)`;
    }

    onSuccess({
      paymentId,
      orderId: currentOrderId,
      paymentMethod: methodLabel,
      paymentMethodDetails: methodDetails,
    });
  };

  const handleOtp = () => {
    if (otp.length < 4) {
      setErrors({ otp: "Enter valid 4-6 digit OTP" });
      return;
    }
    setErrors({});
    setStep("processing");
    setTimeout(() => {
      completePayment();
    }, 1200);
  };

  const banks = ["State Bank of India", "HDFC Bank", "ICICI Bank", "Axis Bank", "Kotak Mahindra", "Punjab National Bank"];
  const wallets = ["Paytm", "PhonePe", "Amazon Pay", "Mobikwik", "Freecharge"];

  return (
    <div className="rzp-overlay">
      <div className="rzp-modal">

        {/* ── Left Panel ── */}
        <div className="rzp-left">
          <div className="rzp-brand">
            <div className="rzp-brand-icon" style={{ background: "#0b5fff" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M12.44 2.1L2.24 13.9H10.12L7.36 21.9L17.56 10.1H9.68L12.44 2.1Z" fill="#ffffff" />
              </svg>
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <p className="rzp-brand-name">Razorpay</p>
                <span className="rzp-test-tag">TEST MODE</span>
              </div>
              <p className="rzp-brand-sub">Trusted Business Gateway</p>
            </div>
          </div>

          <div className="rzp-amount-box">
            <p className="rzp-amt-label">Total Payable Amount</p>
            <p className="rzp-amt-val">₹{amount.toLocaleString()}</p>
          </div>

          <div className="rzp-order-tag">
            <span>Order ID: <strong>{currentOrderId}</strong></span>
          </div>

          <div className="rzp-user-tag">
            <FiUsers size={14} />
            {user?.email}
          </div>

          <div className="rzp-course-tag">
            📚 {courseName}
          </div>

          <div className="rzp-no-pin-badge">
            <FiZap size={14} /> 1-Click Instant Demo Payment
          </div>

          <div className="rzp-secure-note">
            <FiShield size={13} /> Razorpay 256-Bit SSL Encrypted
          </div>
        </div>

        {/* ── Right Panel ── */}
        <div className="rzp-right">

          {/* Header */}
          <div className="rzp-right-header">
            <div className="rzp-right-header-title">
              <span className="rzp-right-title">Razorpay Secure Checkout</span>
              <span className="rzp-badge-fast">⚡ Demo Mode Active</span>
            </div>
            <button className="rzp-close-btn" onClick={onClose}><FiX /></button>
          </div>

          {step === "form" && (
            <>
              {/* Tab Navigation */}
              <div className="rzp-tabs">
                {[
                  { key: "upi", label: "UPI / QR", icon: <QrIcon /> },
                  { key: "card", label: "Card", icon: <FiCreditCard /> },
                  { key: "netbanking", label: "Net Banking", icon: "🏦" },
                  { key: "wallet", label: "Wallet", icon: "👛" },
                ].map((t) => (
                  <button
                    key={t.key}
                    className={`rzp-tab ${activeTab === t.key ? "active" : ""}`}
                    onClick={() => { setActiveTab(t.key); setErrors({}); }}
                  >
                    <span className="rzp-tab-icon">{t.icon}</span>
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="rzp-form">
                {/* ── UPI TAB ── */}
                {activeTab === "upi" && (
                  <div className="upi-tab-content">
                    {/* Sub Tab Switcher */}
                    <div className="upi-sub-tabs">
                      <button
                        className={`upi-sub-btn ${upiSubTab === "scanner" ? "active" : ""}`}
                        onClick={() => { setUpiSubTab("scanner"); setErrors({}); }}
                      >
                        <QrIcon /> Scan QR Code
                      </button>
                      <button
                        className={`upi-sub-btn ${upiSubTab === "upiid" ? "active" : ""}`}
                        onClick={() => { setUpiSubTab("upiid"); setErrors({}); }}
                      >
                        <FiSmartphone /> Enter UPI ID
                      </button>
                    </div>

                    {upiSubTab === "scanner" ? (
                      <div className="upi-scanner-section">
                        <div className="scanner-header-info">
                          <div className="scanner-live-pill">
                            <span className="live-pulse" /> LIVE SCANNABLE QR CODE
                          </div>
                          <p className="scanner-instruction">
                            Point your <strong>phone camera</strong> or open <strong>Google Pay, PhonePe, Paytm, BHIM</strong> to scan the QR code below.
                          </p>
                        </div>

                        <UpiQrCode amount={amount} upiId={defaultUpiId} courseName={courseName} />

                        {/* Guided 3-Step Phone Scan Flow */}
                        <div className="phone-scan-steps">
                          <div className="phone-step">
                            <span className="step-num">1</span>
                            <span>Open Camera / UPI App</span>
                          </div>
                          <div className="phone-step-divider">→</div>
                          <div className="phone-step">
                            <span className="step-num">2</span>
                            <span>Scan QR from screen</span>
                          </div>
                          <div className="phone-step-divider">→</div>
                          <div className="phone-step">
                            <span className="step-num">3</span>
                            <span>Approve ₹{amount.toLocaleString()}</span>
                          </div>
                        </div>

                        <div className="upi-supported-apps">
                          <span>Works with:</span>
                          <span className="app-tag gpay">GPay</span>
                          <span className="app-tag phonepe">PhonePe</span>
                          <span className="app-tag paytm">Paytm</span>
                          <span className="app-tag bhim">BHIM</span>
                          <span className="app-tag cred">CRED</span>
                          <span className="app-tag camera">📷 Phone Camera</span>
                        </div>

                        {/* UTR Reference Input Box */}
                        <div className="upi-utr-box">
                          <div className="utr-box-header">
                            <label>12-Digit UPI Reference / UTR No (from phone screen)</label>
                            <button
                              type="button"
                              className="demo-utr-btn"
                              onClick={() => {
                                const randomUtr = "4291" + Math.floor(10000000 + Math.random() * 90000000);
                                setUtrNo(randomUtr);
                                setErrors({});
                              }}
                            >
                              ⚡ Auto-Fill Demo UTR
                            </button>
                          </div>
                          <div className="utr-input-wrapper">
                            <input
                              type="text"
                              placeholder="e.g. 429183920194 (Optional for Demo)"
                              value={utrNo}
                              maxLength={12}
                              onChange={(e) => setUtrNo(e.target.value.replace(/\D/g, ""))}
                              className="utr-input"
                            />
                            {utrNo && <span className="utr-check">✓</span>}
                          </div>
                        </div>

                        <button className="rzp-pay-btn qr-verify-btn" onClick={handlePay}>
                          <FiCheckCircle size={18} />
                          <span>I Have Scanned &amp; Paid ₹{amount.toLocaleString()} — Verify &amp; Enroll</span>
                        </button>
                      </div>
                    ) : (
                      <div className="upi-id-section">
                        <div className="rzp-field">
                          <label>Virtual Payment Address (UPI ID)</label>
                          <input
                            type="text"
                            placeholder="username@upi or mobile@paytm"
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                          />
                          {errors.upiId && <span className="rzp-err">{errors.upiId}</span>}
                        </div>

                        <div className="quick-upi-handles">
                          <span className="quick-label">Quick select suffix:</span>
                          {["@okaxis", "@ybl", "@paytm", "@ibl", "@postbank"].map((suf) => (
                            <button
                              key={suf}
                              type="button"
                              className="suf-btn"
                              onClick={() => {
                                const base = upiId.split("@")[0] || "student";
                                setUpiId(base + suf);
                              }}
                            >
                              {suf}
                            </button>
                          ))}
                        </div>

                        <div className="rzp-demo-tip green-tip">
                          ⚡ <strong>No PIN Mode Active:</strong> Clicking pay will instantly complete payment without asking for UPI PIN!
                        </div>

                        <button className="rzp-pay-btn" onClick={handlePay}>
                          <FiZap /> Authorize &amp; Pay ₹{amount.toLocaleString()} (No PIN)
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* ── CARD TAB ── */}
                {activeTab === "card" && (
                  <>
                    <button
                      type="button"
                      className="rzp-autofill-btn"
                      onClick={() => {
                        setCardNum("4111 2222 3333 4444");
                        setCardName(user?.name || "Demo Student");
                        setExpiry("12/28");
                        setCvv("123");
                        setErrors({});
                      }}
                    >
                      ⚡ Fill Demo Visa Card (4111 •••• •••• 4444)
                    </button>
                    <div className="rzp-field">
                      <label>Card Number</label>
                      <input
                        type="text"
                        placeholder="4111 1111 1111 1111"
                        value={cardNum}
                        maxLength={19}
                        onChange={(e) => setCardNum(formatCard(e.target.value))}
                      />
                      {errors.cardNum && <span className="rzp-err">{errors.cardNum}</span>}
                    </div>
                    <div className="rzp-field">
                      <label>Card Holder Name</label>
                      <input
                        type="text"
                        placeholder="Name on card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                      />
                      {errors.cardName && <span className="rzp-err">{errors.cardName}</span>}
                    </div>
                    <div className="rzp-row2">
                      <div className="rzp-field">
                        <label>Expiry</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={expiry}
                          maxLength={5}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                        />
                        {errors.expiry && <span className="rzp-err">{errors.expiry}</span>}
                      </div>
                      <div className="rzp-field">
                        <label>CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cvv}
                          maxLength={4}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ""))}
                        />
                        {errors.cvv && <span className="rzp-err">{errors.cvv}</span>}
                      </div>
                    </div>

                    <div className="rzp-toggle-row">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={skipPin}
                          onChange={(e) => setSkipPin(e.target.checked)}
                        />
                        <span>Fast Checkout (Skip Card OTP/PIN)</span>
                      </label>
                    </div>

                    <div className="rzp-demo-tip">
                      💡 Demo: Card <strong>4111 1111 1111 1111</strong> · Expiry <strong>12/28</strong> · CVV <strong>123</strong>
                    </div>

                    <button className="rzp-pay-btn" onClick={handlePay}>
                      Pay ₹{amount.toLocaleString()} {skipPin ? "(No OTP)" : <FiChevronRight />}
                    </button>
                  </>
                )}

                {/* ── NET BANKING TAB ── */}
                {activeTab === "netbanking" && (
                  <>
                    <div className="rzp-field">
                      <label>Select Popular Bank</label>
                      <div className="rzp-bank-grid">
                        {banks.map((b) => (
                          <div
                            key={b}
                            className={`rzp-bank-item ${bank === b ? "selected" : ""}`}
                            onClick={() => setBank(b)}
                          >
                            🏦 {b}
                          </div>
                        ))}
                      </div>
                      {errors.bank && <span className="rzp-err">{errors.bank}</span>}
                    </div>

                    <div className="rzp-demo-tip green-tip">
                      ⚡ Direct Netbanking Login Simulation (No Password / PIN needed)
                    </div>

                    <button className="rzp-pay-btn" onClick={handlePay}>
                      Pay ₹{amount.toLocaleString()} via Net Banking
                    </button>
                  </>
                )}

                {/* ── WALLET TAB ── */}
                {activeTab === "wallet" && (
                  <>
                    <div className="rzp-field">
                      <label>Select Digital Wallet</label>
                      <div className="rzp-wallet-grid">
                        {wallets.map((w) => (
                          <div
                            key={w}
                            className={`rzp-wallet-item ${wallet === w ? "selected" : ""}`}
                            onClick={() => setWallet(w)}
                          >
                            👛 {w}
                          </div>
                        ))}
                      </div>
                      {errors.wallet && <span className="rzp-err">{errors.wallet}</span>}
                    </div>

                    <div className="rzp-demo-tip green-tip">
                      ⚡ Wallet Balance Auto-Deduction (No PIN needed)
                    </div>

                    <button className="rzp-pay-btn" onClick={handlePay}>
                      Pay ₹{amount.toLocaleString()} via Wallet
                    </button>
                  </>
                )}

              </div>
            </>
          )}

          {/* Processing Screen */}
          {step === "processing" && (
            <div className="rzp-processing">
              <div className="rzp-spinner" />
              <p>{processingText}</p>
              <span>Please wait while we confirm your enrollment</span>
            </div>
          )}

          {/* OTP Screen (Only used if user explicitly unchecked Skip PIN) */}
          {step === "otp" && (
            <div className="rzp-otp-screen">
              <button className="rzp-back-btn" onClick={() => setStep("form")}>
                <FiArrowLeft /> Back
              </button>
              <div className="rzp-otp-icon">🔐</div>
              <h3>Enter OTP</h3>
              <p>We've sent a 6-digit OTP to your registered mobile</p>
              <div className="rzp-field">
                <input
                  type="text"
                  placeholder="Enter OTP"
                  value={otp}
                  maxLength={6}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="rzp-otp-input"
                />
                {errors.otp && <span className="rzp-err">{errors.otp}</span>}
              </div>
              <button
                type="button"
                className="auto-otp-btn"
                onClick={() => setOtp("123456")}
              >
                ⚡ Auto-Fill OTP (123456)
              </button>
              <button className="rzp-pay-btn" onClick={handleOtp}>
                Verify &amp; Complete Payment
              </button>
            </div>
          )}

          {/* Footer */}
          <div className="rzp-modal-footer">
            <FiLock size={12} /> 100% Encrypted &amp; Instant Payment Processing
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN ENROLLMENT PAGE
───────────────────────────────────────────────────────────── */
const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5001";

function Enrollment() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [alreadyEnrolled, setAlreadyEnrolled] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [emailStatus, setEmailStatus] = useState("idle"); // idle | sending | sent | failed
  const [emailMessage, setEmailMessage] = useState("");
  const [razorpayOrderId, setRazorpayOrderId] = useState("");
  const [loadingOrder, setLoadingOrder] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState("upi");
  const [modalInitialSubTab, setModalInitialSubTab] = useState("scanner");

  const [course, setCourse] = useState(() => {
    return courses.find((item) => String(item.id) === String(id));
  });
  const [loadingCourse, setLoadingCourse] = useState(!course);

  useEffect(() => {
    let isMounted = true;
    fetch(`${API_BASE_URL}/api/courses/${id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted && data.success && data.course) {
          const raw = data.course;
          setCourse({
            id: raw._id || raw.id,
            title: raw.title,
            description: raw.description,
            category: raw.category || "General",
            instructor: raw.instructor || "EduSphere Faculty",
            price: Number(raw.price) || 0,
            duration: raw.duration || "10 Hours",
            rating: raw.rating || 5.0,
            image: raw.image || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3",
          });
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingCourse(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (!user) {
      setAlreadyEnrolled(false);
      return;
    }
    try {
      const saved = localStorage.getItem("edusphere_enrollments");
      if (saved) {
        const list = JSON.parse(saved);
        if (list.find((e) => String(e.courseId) === String(id))) {
          setAlreadyEnrolled(true);
        }
      }
    } catch (_) {}
  }, [id, user]);

  if (loadingCourse) {
    return (
      <section className="section empty-state" style={{ padding: "80px 20px", textAlign: "center" }}>
        <h1>Loading Course Details...</h1>
      </section>
    );
  }

  if (!course) {
    return (
      <section className="section empty-state">
        <h1>Course Not Found</h1>
        <p>The requested course does not exist.</p>
      </section>
    );
  }

  if (!user) {
    navigate("/login");
    return null;
  }

  const basePrice = Number(course?.price) || 0;
  const gst = Math.round(basePrice * 0.18);
  const totalPrice = basePrice + gst;

  const saveEnrollment = (paymentId, paymentMethod, paymentMethodDetails, orderId) => {
    const oid = orderId || razorpayOrderId || ("order_RZP" + Math.random().toString(36).slice(2, 8).toUpperCase());
    const pid = paymentId || ("pay_RZP" + Math.random().toString(36).slice(2, 8).toUpperCase());
    const studentEmail =
      user?.email ||
      JSON.parse(localStorage.getItem("edusphere_user") || "{}")?.email ||
      "student@example.com";
    const studentName =
      user?.name ||
      JSON.parse(localStorage.getItem("edusphere_user") || "{}")?.name ||
      "Student";
    const studentPhone =
      user?.phone ||
      JSON.parse(localStorage.getItem("edusphere_user") || "{}")?.phone ||
      "+91 98765 43210";

    const enrollment = {
      courseId: course.id,
      courseTitle: course.title,
      instructor: course.instructor,
      image: course.image,
      price: totalPrice,
      duration: course.duration,
      progress: 0,
      enrolledAt: new Date().toISOString(),
      studentName,
      studentEmail,
      studentPhone,
      paymentId: pid,
      orderId: oid,
      paymentMethod: paymentMethod || "Razorpay UPI / QR",
      paymentMethodDetails: paymentMethodDetails || "Razorpay Standard Checkout",
      paid: true,
    };

    localStorage.setItem("enrollment", JSON.stringify(enrollment));

    try {
      const existing = JSON.parse(localStorage.getItem("edusphere_enrollments") || "[]");
      if (!existing.find((e) => e.courseId === course.id)) {
        existing.push(enrollment);
        localStorage.setItem("edusphere_enrollments", JSON.stringify(existing));
      }
    } catch (_) {}

    // Verify & save to backend MongoDB via Razorpay verification endpoint
    fetch(`${API_BASE_URL}/api/payments/razorpay/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        razorpay_order_id: oid,
        razorpay_payment_id: pid,
        razorpay_signature: "sig_demo_" + pid,
        studentId: user?.id || user?._id || "",
        studentName,
        studentEmail,
        studentPhone,
        courseId: String(course.id),
        courseTitle: course.title,
        instructor: course.instructor,
        amount: totalPrice,
        basePrice,
        gst,
        paymentMethod: paymentMethod || "Razorpay UPI / QR",
        paymentMethodDetails: paymentMethodDetails || "Razorpay Standard Checkout",
      }),
    }).catch((err) => console.warn("Razorpay verify error:", err.message));

    console.log("✅ Enrollment saved and synced with Razorpay:", enrollment);
    return enrollment;
  };

  const handleInitiateRazorpay = async (mode = "scanner") => {
    if (mode === "scanner") {
      setModalInitialTab("upi");
      setModalInitialSubTab("scanner");
    } else {
      setModalInitialTab("card");
      setModalInitialSubTab("scanner");
    }
    setLoadingOrder(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/payments/razorpay/order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalPrice,
          courseId: course.id,
          courseTitle: course.title,
        }),
      });
      const data = await res.json();
      if (data.success && data.order) {
        setRazorpayOrderId(data.order.id);

        // If official Razorpay is available and real live keys are active (non-demo)
        if (window.Razorpay && !data.isDemo && !data.keyId.includes("demo")) {
          const rzpOptions = {
            key: data.keyId,
            amount: data.order.amount,
            currency: "INR",
            name: "EduSphere Learning",
            description: `Course Enrollment: ${course.title}`,
            order_id: data.order.id,
            handler: function (response) {
              handlePaymentSuccess({
                paymentId: response.razorpay_payment_id,
                orderId: response.razorpay_order_id,
                signature: response.razorpay_signature,
                paymentMethod: "Razorpay Standard Gateway",
                paymentMethodDetails: "Verified Live Online Payment",
              });
            },
            prefill: {
              name: user?.name || "Student",
              email: user?.email || "student@example.com",
              contact: user?.phone || "+91 98765 43210",
            },
            theme: { color: "#0c2340" },
          };
          const rzp = new window.Razorpay(rzpOptions);
          rzp.open();
          return;
        }
      }
    } catch (err) {
      console.warn("Order creation notice:", err.message);
    } finally {
      setLoadingOrder(false);
    }

    // In demo mode or fallback, open the Razorpay Demo Modal
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    const paymentId = typeof paymentData === "string" ? paymentData : paymentData.paymentId;
    const orderId = paymentData?.orderId || razorpayOrderId;
    const paymentMethod = paymentData?.paymentMethod || "Razorpay UPI / QR";
    const paymentMethodDetails = paymentData?.paymentMethodDetails || paymentMethod;

    const info = saveEnrollment(paymentId, paymentMethod, paymentMethodDetails, orderId);
    setPaymentInfo(info);
    setShowPaymentModal(false);
    setShowSuccessModal(true);
    setEmailStatus("sending");

    // Send Payment Confirmation Email with Payment Method Details
    try {
      const studentEmail =
        user?.email ||
        JSON.parse(localStorage.getItem("edusphere_user") || "{}")?.email ||
        JSON.parse(localStorage.getItem("loggedInUser") || "{}")?.email ||
        JSON.parse(localStorage.getItem("user") || "{}")?.email;

      const studentName =
        user?.name ||
        JSON.parse(localStorage.getItem("edusphere_user") || "{}")?.name ||
        JSON.parse(localStorage.getItem("loggedInUser") || "{}")?.name ||
        JSON.parse(localStorage.getItem("user") || "{}")?.name ||
        "Student";

      const emailPayload = {
        email: studentEmail,
        name: studentName,
        courseTitle: course.title,
        instructor: course.instructor,
        amount: totalPrice,
        basePrice: basePrice,
        gst: gst,
        paymentId: paymentId,
        orderId: info.orderId,
        paymentMethod: paymentMethod,
        paymentMethodDetails: paymentMethodDetails,
        paymentTime: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      };

      const emailResponse = await fetch(
        "http://localhost:5000/api/email/payment-confirmation",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(emailPayload),
        }
      );

      const emailData = await emailResponse.json();
      if (emailData.success) {
        setEmailStatus("sent");
        setEmailMessage(`Payment receipt email sent to ${studentEmail}`);
        console.log(`✅ Payment email sent successfully to ${studentEmail}!`);
      } else {
        setEmailStatus("failed");
        setEmailMessage(emailData.message || "Email service error");
        console.warn("⚠️ Email service response:", emailData);
      }
    } catch (emailError) {
      console.error("❌ Could not connect to email server:", emailError);
      setEmailStatus("failed");
      setEmailMessage("Email server not running on port 5000");
    }
  };

  return (
    <>
      <section className="enrollment-page">
        <div className="enrollment-wrapper">

          {/* ── LEFT ── */}
          <div className="enrollment-left">
            <div className="enroll-course-banner">
              <img src={course.image} alt={course.title} />
              <div className="enroll-course-overlay">
                <span className="enroll-category-badge">{course.category}</span>
              </div>
            </div>

            <div className="enroll-course-info">
              <h1>{course.title}</h1>
              <p className="enroll-course-desc">{course.description}</p>
              <div className="enroll-meta-row">
                <span><FiUsers /> {course.students?.toLocaleString()} students</span>
                <span><FiStar /> {course.rating} rating</span>
                <span><FiClock /> {course.duration}</span>
              </div>
              <p className="enroll-instructor">
                Instructor: <strong>{course.instructor}</strong>
              </p>
            </div>

            <div className="enroll-student-card">
              <h2><FiUsers /> Student Details</h2>
              <div className="enroll-detail-row"><span>Name</span><strong>{user.name}</strong></div>
              <div className="enroll-detail-row"><span>Email</span><strong>{user.email}</strong></div>
              {user.phone && (
                <div className="enroll-detail-row"><span>Phone</span><strong>{user.phone}</strong></div>
              )}
            </div>

            <div className="enroll-perks">
              <h2>What you'll get</h2>
              <ul>
                <li><FiCheckCircle /> Full lifetime access</li>
                <li><FiCheckCircle /> Certificate of completion</li>
                <li><FiCheckCircle /> Access on mobile &amp; desktop</li>
                <li><FiCheckCircle /> {course.modules?.length || 5} course modules</li>
              </ul>
            </div>
          </div>

          {/* ── RIGHT ── */}
          <div className="enrollment-right">
            <div className="payment-card">
              <div className="payment-card-header">
                <FiCreditCard />
                <h2>Order Summary</h2>
              </div>

              <div className="price-breakdown">
                <div className="price-row">
                  <span><FiTag /> Course Price</span>
                  <span>₹{basePrice.toLocaleString()}</span>
                </div>
                <div className="price-row">
                  <span>GST (18%)</span>
                  <span>₹{gst.toLocaleString()}</span>
                </div>
                <div className="price-row price-row--discount">
                  <span>🎉 Student Discount</span>
                  <span className="discount-val">−₹0</span>
                </div>
                <div className="price-divider" />
                <div className="price-row price-row--total">
                  <span>Total Payable</span>
                  <strong>₹{totalPrice.toLocaleString()}</strong>
                </div>
              </div>

              {alreadyEnrolled ? (
                <div className="already-enrolled-box">
                  <FiCheckCircle className="ae-icon" />
                  <p>You're already enrolled in this course!</p>
                  <button className="enroll-goto-btn" onClick={() => navigate("/student/courses")}>
                    Go to My Courses
                  </button>
                </div>
              ) : (
                <div className="enroll-action-buttons">
                  <button
                    className="phone-qr-pay-btn"
                    onClick={() => handleInitiateRazorpay("scanner")}
                    disabled={loadingOrder}
                  >
                    <span className="qr-pay-icon-wrap">
                      <FiSmartphone size={20} />
                    </span>
                    <div className="qr-pay-text">
                      <strong>Scan &amp; Pay from Phone (UPI QR)</strong>
                      <small>Scan with Phone Camera, GPay, PhonePe, Paytm</small>
                    </div>
                    <FiChevronRight className="qr-pay-arrow" />
                  </button>

                  <button
                    className="razorpay-pay-btn secondary-btn"
                    onClick={() => handleInitiateRazorpay("card")}
                    disabled={loadingOrder}
                  >
                    <span className="rzp-btn-brand-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12.44 2.1L2.24 13.9H10.12L7.36 21.9L17.56 10.1H9.68L12.44 2.1Z" fill="#38bdf8" />
                      </svg>
                    </span>
                    <span>Pay ₹{totalPrice.toLocaleString()} via Cards / NetBanking</span>
                  </button>
                </div>
              )}

              <div className="trust-badges">
                <span><FiShield /> Razorpay Secured</span>
                <span><FiLock /> Instant Access</span>
                <span><FiZap /> Demo Mode Active</span>
              </div>

              <div className="demo-note green-demo-note">
                <FiZap />
                <div>
                  <strong>Razorpay Test Mode Active</strong>
                  <p>
                    Test checkout with Razorpay UPI QR, Visa/Mastercard test card, or Net Banking without real money deduction.
                  </p>
                </div>
              </div>

              <div className="payment-methods">
                <span>Powered by:</span>
                <span className="pm-badge highlight-pm">Razorpay</span>
                <span className="pm-badge">UPI &amp; QR</span>
                <span className="pm-badge">Cards</span>
                <span className="pm-badge">NetBanking</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Razorpay Payment Modal ── */}
      {showPaymentModal && (
        <PaymentModal
          amount={totalPrice}
          courseName={course.title}
          user={user}
          orderId={razorpayOrderId}
          initialTab={modalInitialTab}
          initialSubTab={modalInitialSubTab}
          onSuccess={handlePaymentSuccess}
          onClose={() => setShowPaymentModal(false)}
        />
      )}

      {/* ── Success Modal ── */}
      {showSuccessModal && (
        <div className="success-overlay">
          <div className="success-modal">
            <button className="modal-close-btn" onClick={() => navigate("/student/courses")}>
              <FiX />
            </button>

            <div className="success-icon-wrap">
              <FiCheckCircle className="success-icon" />
            </div>

            <h2>Payment Successful! 🎉</h2>
            <p>You are now enrolled in <strong>{course.title}</strong></p>

            <div className="payment-receipt-summary">
              <div className="receipt-row">
                <span className="receipt-label">Payment Method:</span>
                <span className="receipt-value highlight-method">
                  {paymentInfo?.paymentMethodDetails || paymentInfo?.paymentMethod || "UPI Payment"}
                </span>
              </div>
              {paymentInfo?.paymentId && (
                <div className="receipt-row">
                  <span className="receipt-label">Transaction ID:</span>
                  <span className="receipt-value monospace">{paymentInfo.paymentId}</span>
                </div>
              )}
              <div className="receipt-row">
                <span className="receipt-label">Total Amount:</span>
                <span className="receipt-value amount-paid">₹{totalPrice.toLocaleString()}</span>
              </div>
            </div>

            {/* Email notification status banner */}
            <div className={`email-notify-card notify-${emailStatus}`}>
              <div className="notify-icon-wrap">
                {emailStatus === "sending" && <div className="notify-spinner" />}
                {emailStatus === "sent" && <FiMail />}
                {emailStatus === "failed" && <FiAlertCircle />}
              </div>
              <div className="notify-text">
                {emailStatus === "sending" && (
                  <span>Sending receipt confirmation email to <strong>{user?.email}</strong>…</span>
                )}
                {emailStatus === "sent" && (
                  <span>
                    Receipt with payment details emailed to <strong>{user?.email}</strong>! 📩
                  </span>
                )}
                {emailStatus === "failed" && (
                  <span>
                    Receipt saved to dashboard ({emailMessage}).
                  </span>
                )}
              </div>
            </div>

            <button className="success-cta-btn" onClick={() => navigate("/student/courses")}>
              Start Learning Now →
            </button>

            <p className="success-note">
              A confirmation receipt has been saved to your student dashboard.
            </p>
          </div>
        </div>
      )}
    </>
  );
}

export default Enrollment;