import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/banners`)
      .then((res) => res.json())
      .then((result) => {
        if (result.success) setBanners(result.data);
      })
      .catch((err) => console.error('[BANNER] fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  // Koi banner DB mein nahi mila toh purana static fallback dikha do --
  // taaki homepage kabhi khaali na dikhe
  if (loading) return null;

  if (banners.length === 0) {
    return (
      <div className="banner">
        <img src="/saare_1.jpeg" alt="Banner" style={{ filter: 'brightness(1)' }} />
      </div>
    );
  }

  const banner = banners[current];

  return (
    <div className="banner hero-banner">
      <img
        src={`${API_BASE_URL}/uploads/${banner.image_url}`}
        alt={banner.title || 'Banner'}
        style={{ filter: 'brightness(1)' }}
      />

      {(banner.title || banner.subtitle || banner.button_text) && (
        <div className="hero-banner-content">
          {banner.title && <h1>{banner.title}</h1>}
          {banner.subtitle && <p>{banner.subtitle}</p>}
          {banner.button_text && banner.button_link && (
            <a href={banner.button_link} className="hero-banner-btn">
              {banner.button_text}
            </a>
          )}
        </div>
      )}

      {banners.length > 1 && (
        <div className="hero-banner-dots">
          {banners.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === current ? 'active' : ''}`}
              onClick={() => setCurrent(idx)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default HeroBanner;