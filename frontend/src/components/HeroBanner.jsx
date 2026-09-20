import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl'; 
import './HeroBanner.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function HeroBanner() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/banners`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setBanners(result.data);
        }
      })
      .catch((err) => console.error('[HeroBanner] Fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  if (loading) return null;

  if (banners.length === 0) {
    return (
      <div 
        className="hero-banner-wrapper"
        onClick={() => navigate('/products')}
      >
        <img src="/saare_1.jpeg" alt="Fallback Banner" className="hero-banner-img" />
      </div>
    );
  }

  const banner = banners[current];

  return (
    <div className="hero-banner-wrapper">
      {/* 🌟 The entire image is the clickable link */}
      <div 
        className="hero-banner-slide"
        onClick={() => navigate(banner.link || '/products')}
      >
        <img
          src={getImageUrl(banner.image_url)}
          alt="Banner"
          className="hero-banner-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/saare_1.jpeg';
          }}
        />
      </div>

      {/* Navigation Arrows & Dots */}
      {banners.length > 1 && (
        <>
          <button className="hero-banner-arrow left" onClick={prevSlide} aria-label="Previous">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <button className="hero-banner-arrow right" onClick={nextSlide} aria-label="Next">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="hero-banner-dots">
            {banners.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === current ? 'active' : ''}`}
                onClick={() => setCurrent(idx)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HeroBanner;