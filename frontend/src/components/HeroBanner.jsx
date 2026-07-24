import React, { useState, useEffect, useCallback } from 'react';
import './HeroBanner.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[HeroBanner] Fetching banners from:', `${API_BASE_URL}/api/banners`);
    
    fetch(`${API_BASE_URL}/api/banners`)
      .then((res) => res.json())
      .then((result) => {
        console.log('[HeroBanner] API response:', result);
        if (result.success) {
          console.log(`[HeroBanner] Loaded ${result.data.length} banner(s)`);
          setBanners(result.data);
        } else {
          console.warn('[HeroBanner] API returned success:false');
        }
      })
      .catch((err) => console.error('[HeroBanner] Fetch error:', err))
      .finally(() => {
        setLoading(false);
        console.log('[HeroBanner] Loading finished.');
      });
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => {
      const next = (prev + 1) % banners.length;
      console.log(`[HeroBanner] Auto/Next slide -> Transitioning to index: ${next}`);
      return next;
    });
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => {
      const back = (prev - 1 + banners.length) % banners.length;
      console.log(`[HeroBanner] Prev slide -> Transitioning to index: ${back}`);
      return back;
    });
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    console.log('[HeroBanner] Initializing auto-slide timer (4000ms)');
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  if (loading) return null;

  if (banners.length === 0) {
    console.log('[HeroBanner] No banners found, rendering fallback image.');
    return (
      <div className="banner hero-banner">
        <img src="/saare_1.jpeg" alt="Fallback Banner" className="hero-banner-img" />
      </div>
    );
  }

  const banner = banners[current];
  const imageUrl = `${API_BASE_URL}/uploads/${banner.image_url}`;

  return (
    <div className="banner hero-banner">
      <img
        src={imageUrl}
        alt={banner.title || 'Banner'}
        className="hero-banner-img"
        onError={(e) => {
          console.error('[HeroBanner] Image failed to load:', imageUrl);
          e.target.onerror = null;
          e.target.src = '/saare_1.jpeg';
        }}
      />

      {(banner.title || banner.subtitle || banner.button_link) && (
        <div className="hero-banner-content">
          {banner.title && <h1>{banner.title}</h1>}
          {banner.subtitle && <p>{banner.subtitle}</p>}
          {banner.button_link && (
            <a href={banner.button_link} className="hero-banner-btn">
              Shop Now
            </a>
          )}
        </div>
      )}

      {banners.length > 1 && (
        <>
          <button className="hero-banner-arrow left" onClick={prevSlide} aria-label="Previous banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          
          <button className="hero-banner-arrow right" onClick={nextSlide} aria-label="Next banner">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>

          <div className="hero-banner-dots">
            {banners.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === current ? 'active' : ''}`}
                onClick={() => {
                  console.log(`[HeroBanner] Dot clicked -> Jumping to index: ${idx}`);
                  setCurrent(idx);
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default HeroBanner;