import React from 'react';
import { Link } from 'react-router-dom';

const About = () => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '80px 20px', backgroundColor: '#fcfcfc', fontFamily: 'sans-serif' }}>
      <div style={{ maxWidth: '1100px', display: 'flex', alignItems: 'center', gap: '60px', flexWrap: 'wrap' }}>
        
        {/* LEFT SIDE: Circular Image */}
        <div style={{ flex: '1', minWidth: '300px', display: 'flex', justifyContent: 'center', position: 'relative' }}>
          <div style={{ position: 'absolute', top: '-20px', left: '-20px', fontSize: '150px', color: '#f0f0f0', fontFamily: 'serif', zIndex: 0 }}>
            “
          </div>
          <div style={{
            width: '350px', height: '350px', borderRadius: '50%', overflow: 'hidden', 
            boxShadow: '0 15px 35px rgba(0,0,0,0.15)', border: '8px solid white', position: 'relative', zIndex: 1
          }}>
            <img 
              // 🚨 APNI PHOTO YA LOGO YAHAN DAAL 🚨
              src="https://via.placeholder.com/400x400.png?text=Aman+Saare" 
              alt="Ayan Kadri" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          </div>
        </div>

        {/* RIGHT SIDE: Text & Contact Button */}
        <div style={{ flex: '1.5', minWidth: '300px', position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '25px' }}>
            <h3 style={{ margin: 0, fontSize: '22px', color: '#111' }}>
              Ayan Kadri, <span style={{ color: '#2874f0' }}>Founder - Aman Saare</span>
            </h3>
            <div style={{ height: '2px', backgroundColor: '#ddd', flex: '1' }}></div>
          </div>

          <p style={{ 
            fontSize: '26px', fontStyle: 'italic', fontWeight: '900', color: '#222', 
            lineHeight: '1.6', margin: 0, position: 'relative', zIndex: 1 
          }}>
            As a homegrown brand from Kaithoon, Kota, we direct our efforts towards preserving the rich heritage of Kota Doria while creating elegant, handcrafted sarees. We believe in authentic craftsmanship. We learn from our weavers' generations of experience and strive towards enhanced customer satisfaction, bridging the gap between traditional Indian artistry and modern digital commerce.
          </p>

          <div style={{ textAlign: 'right', marginTop: '-20px' }}>
            <span style={{ fontSize: '120px', color: '#2874f0', fontFamily: 'serif', lineHeight: '0' }}>”</span>
          </div>
          
          <div style={{ marginTop: '20px' }}>
            <Link 
              to="/contact"
              style={{
                display: 'inline-block', padding: '15px 35px', backgroundColor: '#ff5722', color: 'white',
                textDecoration: 'none', fontSize: '18px', fontWeight: 'bold', borderRadius: '30px',
                boxShadow: '0 5px 15px rgba(255, 87, 34, 0.4)', transition: 'all 0.3s ease'
              }}
            >
              Get in Touch
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default About;