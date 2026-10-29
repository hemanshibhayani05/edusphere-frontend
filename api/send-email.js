const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER || "hemanshibhayani05@gmail.com",
    pass: process.env.EMAIL_PASSWORD || "ascmikpovratqyjm",
  },
});

module.exports = async function handler(req, res) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { to, subject, html, text } = req.body;

    if (!to || (!html && !text)) {
      return res.status(400).json({ success: false, message: "Recipient and content required." });
    }

    const info = await transporter.sendMail({
      from: `"EduSphere Learning" <${process.env.EMAIL_USER || "hemanshibhayani05@gmail.com"}>`,
      to,
      subject: subject || "EduSphere Notification",
      html,
      text,
    });

    console.log("✅ Email sent via Vercel serverless to:", to);
    return res.status(200).json({
      success: true,
      message: "Email sent successfully",
      messageId: info.messageId,
    });
  } catch (error) {
    console.error("❌ Vercel serverless email error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to send email via Vercel",
    });
  }
};

