import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl';
import './HeroBanner.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const AUTO_SLIDE_INTERVAL_MS = 4000;

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
    const timer = setInterval(nextSlide, AUTO_SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  // 🌟 CLICK TO NAVIGATE FUNCTION
  const handleBannerClick = (banner) => {
    if (banner && banner.link && banner.link.trim() !== '') {
      navigate(banner.link); // Product detail page par bhej dega
    } else {
      console.warn("Please add a product link to this banner in the Admin Panel.");
    }
  };

  if (loading) return null;

  if (banners.length === 0) {
    return (
      <div className="hero-banner-wrapper">
        <div className="hero-banner-slide">
          <img src="/saare_1.jpeg" alt="Featured" className="hero-banner-img" />
        </div>
      </div>
    );
  }

  const activeBanner = banners[current];
  const imageUrl = getImageUrl(activeBanner.image_url);

  return (
    <div className="hero-banner-wrapper">
      <div
        className="hero-banner-slide"
        onClick={() => handleBannerClick(activeBanner)}
        style={{ cursor: 'pointer' }}
        title="Click to view product"
      >
        <img
          src={imageUrl}
          alt="Banner"
          className="hero-banner-img"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/saare_1.jpeg';
          }}
        />
      </div>

      {banners.length > 1 && (
        <>
          <button 
            className="hero-banner-arrow left" 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
            aria-label="Previous banner"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <button 
            className="hero-banner-arrow right" 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
            aria-label="Next banner"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="hero-banner-dots">
            {banners.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === current ? 'active' : ''}`}
                onClick={(e) => { e.stopPropagation(); setCurrent(idx); }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HeroBanner;