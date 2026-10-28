import React from "react";

const About = () =>{
  return (
    <section id="about" className="section about-page">
      <div className="section-title">
        <span>ABOUT EDUSPHERE</span>
        <h1>Learn. Grow. Succeed.</h1>
        <p>
          EduSphere is an e-learning platform designed to make quality
          education accessible to everyone.
        </p>
      </div>

      <div className="about-grid">
        <div>
          <h2>Our Mission</h2>
          <p>
            Our mission is to provide practical, affordable and accessible
            education that helps students develop career-ready skills.
          </p>
        </div>

        <div>
          <h2>Our Vision</h2>
          <p>
            We aim to create a learning environment where students can learn
            at their own pace and achieve their professional goals.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-box">
          <h2>128K+</h2>
          <p>Students</p>
        </div>

        <div className="stat-box">
          <h2>17+</h2>
          <p>Courses</p>
        </div>

        <div className="stat-box">
          <h2>6</h2>
          <p>Instructors</p>
        </div>

        <div className="stat-box">
          <h2>7</h2>
          <p>Categories</p>
        </div>
      </div>

      <div className="section-title">
        <span>OUR TEAM</span>
        <h2>Meet Our Instructors</h2>
      </div>

      <div className="team-grid">
        <div className="team-card">
          <div className="avatar">AS</div>
          <h3>Ananya Sharma</h3>
          <p>Full-Stack Developer</p>
        </div>

        <div className="team-card">
          <div className="avatar">KV</div>
          <h3>Karan Verma</h3>
          <p>Web Development Instructor</p>
        </div>

        <div className="team-card">
          <div className="avatar">RM</div>
          <h3>Rohan Mehta</h3>
          <p>Programming Instructor</p>
        </div>
      </div>
    </section>
  );
}

export default About;