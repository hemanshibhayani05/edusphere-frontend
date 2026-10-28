import React from "react";
import { Link } from "react-router-dom";

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-grid">
        <div>
          <h2>EduSphere</h2>
          <p>
            Learn new skills, build your future and grow your career with
            quality online education.
          </p>
        </div>

        <div>
          <h3>Quick Links</h3>
          <Link to="/">Home</Link>
          <Link to="/courses">Courses</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact Us</Link>
          <Link to="/login">Login</Link>
        </div>

        <div>
          <h3>Categories</h3>
          <p>Web Development</p>
          <p>Programming</p>
          <p>Data Science</p>
          <p>Machine Learning</p>
        </div>

        <div>
          <h3>Contact</h3>
          <p>Email: info@edusphere.com</p>
          <p>Phone: +91 98765 43210</p>
          <p>India</p>
        </div>
      </div>

      <div className="footer-bottom">
        © 2026 EduSphere E-Learning Platform. All Rights Reserved.
      </div>
    </footer>
  );
}

export default Footer;