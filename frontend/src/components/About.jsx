import React from 'react';
import { Link } from 'react-router-dom';
import './About.css'; 

const About = () => {
  return (
    <div className="about-wrapper">
      <div className="about-container">

        {/* LEFT SIDE: Circular Image */}
        <div className="about-image-col">
          <div className="about-quote-mark-top">“</div>
          <div className="about-image-frame">
            <img
              src="/WhatsApp Image 2026-10-03 at 6.48.09 PM.jpeg"
              alt="Aman Raza"
            />
          </div>
        </div>

        {/* RIGHT SIDE: Text & Contact Button */}
        <div className="about-text-col">
          <div className="about-founder-row">
            <h3>
              Aman Raza, <span className="about-founder-role">Developer</span>
            </h3>
            <div className="about-founder-divider"></div>
          </div>

          <p className="about-quote-text">
            I am developing my first website by myself and learning software engineering. I believe in practical learning and authentic coding. I am continuously learning from challenges and striving towards enhancing my skills, bridging the gap between theoretical knowledge and real-world development.
          </p>

          <div className="about-quote-mark-bottom">
            <span>”</span>
          </div>

          <div className="about-cta-row">
            <Link to="/contact" className="about-cta-btn">
              Get in Touch
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;