import React from 'react';
import { Link } from 'react-router-dom';
import './About.css'; 

const About = () => {
  return (
    <div className="about-wrapper">
      
      {/* =========================================
          PROFILE 1: AMAN RAZA (DEVELOPER)
          ========================================= */}
      <div className="about-container">
        <div className="about-image-col">
          <div className="about-quote-mark-top">“</div>
          <div className="about-image-frame">
            <img
              src="/WhatsApp Image 2026-10-03 at 6.48.09 PM.jpeg"
              alt="Aman Raza"
            />
          </div>
        </div>

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

      {/* =========================================
          PROFILE 2: AMIR ALI (PRODUCER & BUSINESS PARTNER)
          ========================================= */}
      <div 
        className="about-container" 
        style={{ 
          marginTop: '80px', 
          flexDirection: 'column', 
          alignItems: 'center', 
          textAlign: 'center',
          gap: '20px'
        }}
      >
        <div className="about-image-col" style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
          <div className="about-image-frame">
            {/* 🌟 Change this src to the actual image file name in your public folder */}
            <img
              src="/partner-image.jpeg" 
              alt="Amir Ali"
            />
          </div>
        </div>

        <div className="about-text-col" style={{ width: '100%', padding: '0 15px', marginTop: '15px' }}>
          <div className="about-founder-row" style={{ justifyContent: 'center' }}>
            <h3>
              Amir Ali, <span className="about-founder-role">Producer & Business Partner</span>
            </h3>
          </div>
          
          <div className="about-founder-divider" style={{ margin: '15px auto 25px auto' }}></div>

          <p className="about-quote-text" style={{ maxWidth: '850px', margin: '0 auto', fontSize: '1.1rem', lineHeight: '1.8' }}>
            "I am a producer and business partner of this website. We are masters of handloom, and we teach our knowledge of handloom to new workers to craft the finest products, so our lovely customers never have to complain about the product. We are trustworthy."
          </p>

          <div className="about-cta-row" style={{ justifyContent: 'center', marginTop: '35px' }}>
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