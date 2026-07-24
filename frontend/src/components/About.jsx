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
              // 🚨 APNI PHOTO YA LOGO YAHAN DAAL 🚨
              src="https://via.placeholder.com/400x400.png?text=Aman+Saare"
              alt="Ayan Kadri"
            />
          </div>
        </div>

        {/* RIGHT SIDE: Text & Contact Button */}
        <div className="about-text-col">
          <div className="about-founder-row">
            <h3>
              Ayan Kadri, <span className="about-founder-role">Founder - Aman Saare</span>
            </h3>
            <div className="about-founder-divider"></div>
          </div>

          <p className="about-quote-text">
            As a homegrown brand from Kaithoon, Kota, we direct our efforts towards preserving the rich heritage of Kota Doria while creating elegant, handcrafted sarees. We believe in authentic craftsmanship. We learn from our weavers' generations of experience and strive towards enhanced customer satisfaction, bridging the gap between traditional Indian artistry and modern digital commerce.
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