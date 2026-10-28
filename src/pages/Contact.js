import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  FiMail,
  FiPhone,
  FiMapPin,
  FiClock,
  FiSend,
  FiCheckCircle,
  FiChevronDown,
  FiMessageSquare,
  FiHelpCircle,
  FiExternalLink
} from "react-icons/fi";
import "./Contact.css";

const FAQ_ITEMS = [
  {
    id: 1,
    question: "How long will it take to get a response?",
    answer:
      "Our support and academic advisory team typically replies within 2 to 4 business hours. For urgent billing or account access issues, we prioritize inquiries for even faster resolution."
  },
  {
    id: 2,
    question: "Can I get a refund if I'm not satisfied with a course?",
    answer:
      "Yes! EduSphere offers a 14-day money-back guarantee for all self-paced and verified track courses if you have completed less than 25% of the curriculum."
  },
  {
    id: 3,
    question: "How can I apply to become an instructor or partner?",
    answer:
      "Select 'Instructor Partnership' in the contact form dropdown above or reach out directly to instructors@edusphere.com. Our curriculum team will schedule an initial review call."
  },
  {
    id: 4,
    question: "Do EduSphere course certificates include verification links?",
    answer:
      "Absolutely. Every certificate issued upon course completion features a unique verification ID and shareable link compatible with LinkedIn, resumes, and portfolios."
  }
];

function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    category: "General Inquiry",
    message: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  const toggleFaq = (id) => {
    setActiveFaq((prev) => (prev === id ? null : id));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = "Please enter your name.";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters.";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Please enter your email address.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      newErrors.email = "Please provide a valid email address.";
    }

    if (!formData.subject.trim()) {
      newErrors.subject = "Please enter a subject.";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Please enter your message.";
    } else if (formData.message.trim().length < 10) {
      newErrors.message = "Message must be at least 10 characters.";
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const validationErrors = validate();

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);

    // Simulate network submission
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitted(true);
    }, 700);
  };

  const handleReset = () => {
    setFormData({
      name: "",
      email: "",
      subject: "",
      category: "General Inquiry",
      message: ""
    });
    setErrors({});
    setSubmitted(false);
  };

  return (
    <div className="contact-page">
      {/* Hero Header */}
      <section className="contact-hero">
        <span className="contact-badge">
          <FiHelpCircle style={{ marginRight: 6, verticalAlign: "middle" }} />
          Get In Touch
        </span>
        <h1>We'd Love to Hear From You</h1>
        <p>
          Have questions about our online courses, enrollment, mentorship, or
          partnership opportunities? Our team is always here to help you move forward.
        </p>
      </section>

      {/* Main Grid */}
      <div className="contact-container">
        <div className="contact-main-grid">
          {/* Info Side */}
          <div className="contact-info-column">
            <div className="info-card-highlight">
              <h2>Contact Information</h2>
              <p>
                Reach out to our student support and academic advisors through
                any of the channels below.
              </p>

              <div className="contact-items-list">
                <div className="contact-item">
                  <div className="contact-icon-box email">
                    <FiMail />
                  </div>
                  <div className="contact-item-text">
                    <span>Email Support</span>
                    <a href="mailto:support@edusphere.com">support@edusphere.com</a>
                    <small>Admissions: admissions@edusphere.com</small>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-box phone">
                    <FiPhone />
                  </div>
                  <div className="contact-item-text">
                    <span>Call Us Directly</span>
                    <a href="tel:+919876543210">+91 98765 43210</a>
                    <small>Toll Free: 1800-123-4567</small>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-box location">
                    <FiMapPin />
                  </div>
                  <div className="contact-item-text">
                    <span>Headquarters & Campus</span>
                    <p>Innovation Tech Park, Sector 62</p>
                    <small>Bengaluru & Noida Hub, India</small>
                  </div>
                </div>

                <div className="contact-item">
                  <div className="contact-icon-box clock">
                    <FiClock />
                  </div>
                  <div className="contact-item-text">
                    <span>Operating Hours</span>
                    <p>Monday – Saturday</p>
                    <small>9:00 AM – 7:00 PM IST (Online 24/7)</small>
                  </div>
                </div>
              </div>
            </div>

            <div className="quick-promise-card">
              <FiMessageSquare className="promise-icon" />
              <div>
                <h3>Rapid Response Guaranteed</h3>
                <p>
                  Most student inquiries receive an answer in under 2 hours
                  during business hours.
                </p>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="contact-form-card">
            {submitted ? (
              <div className="success-banner">
                <div className="success-icon-wrap">
                  <FiCheckCircle />
                </div>
                <h3>Message Sent Successfully!</h3>
                <p>
                  Thank you, <strong>{formData.name}</strong>. We have received
                  your message regarding <em>"{formData.subject}"</em>. A support
                  representative will follow up at <strong>{formData.email}</strong>{" "}
                  shortly.
                </p>
                <button
                  type="button"
                  className="reset-btn"
                  onClick={handleReset}
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <>
                <h2>Send Us a Message</h2>
                <p>
                  Fill out the form below and an EduSphere advisor will get in
                  touch with you promptly.
                </p>

                <form className="contact-form" onSubmit={handleSubmit} noValidate>
                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="name">Full Name *</label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Rahul Sharma"
                      />
                      {errors.name && (
                        <span className="field-error">{errors.name}</span>
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email Address *</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="name@example.com"
                      />
                      {errors.email && (
                        <span className="field-error">{errors.email}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="category">Inquiry Topic</label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                      >
                        <option value="General Inquiry">General Inquiry</option>
                        <option value="Course Assistance">Course Assistance & Admissions</option>
                        <option value="Technical Support">Technical & Platform Support</option>
                        <option value="Instructor Partnership">Instructor Partnership</option>
                        <option value="Billing & Refunds">Billing & Payment Query</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label htmlFor="subject">Subject *</label>
                      <input
                        type="text"
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="e.g. Question about React course"
                      />
                      {errors.subject && (
                        <span className="field-error">{errors.subject}</span>
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="message">Your Message *</label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      value={formData.message}
                      onChange={handleChange}
                      placeholder="Write your question, feedback, or inquiry in detail..."
                    />
                    {errors.message && (
                      <span className="field-error">{errors.message}</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="submit-btn"
                    disabled={isSubmitting}
                  >
                    <FiSend />
                    {isSubmitting ? "Sending Message..." : "Send Message"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Campus & Location Banner */}
        <div className="campus-banner">
          <div className="campus-content">
            <h3>Explore EduSphere Learning Hubs</h3>
            <p>
              Looking to join hands-on offline bootcamps, workshops, or meet our
              mentors in person? Visit our state-of-the-art tech innovation
              centers in Bengaluru and Noida.
            </p>
          </div>
          <div className="campus-action">
            <Link to="/courses" className="btn">
              Browse Courses <FiExternalLink />
            </Link>
          </div>
        </div>

        {/* FAQ Accordion Section */}
        <div className="contact-faq-section">
          <div className="faq-header">
            <span>FREQUENTLY ASKED QUESTIONS</span>
            <h2>Quick Answers to Common Inquiries</h2>
          </div>

          <div className="faq-list">
            {FAQ_ITEMS.map((faq) => {
              const isOpen = activeFaq === faq.id;
              return (
                <div
                  key={faq.id}
                  className={`faq-item ${isOpen ? "open" : ""}`}
                >
                  <button
                    type="button"
                    className="faq-question"
                    onClick={() => toggleFaq(faq.id)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.question}</span>
                    <FiChevronDown className="faq-icon" />
                  </button>
                  {isOpen && (
                    <div className="faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Contact;
