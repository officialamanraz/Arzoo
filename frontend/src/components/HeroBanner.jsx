import React, { useState, useEffect, useCallback } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_URL;

function HeroBanner() {
  const [banners, setBanners] = useState([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('[BANNER] Fetching banners from:', `${API_BASE_URL}/api/banners`);
    fetch(`${API_BASE_URL}/api/banners`)
      .then((res) => res.json())
      .then((result) => {
        console.log('[BANNER] API response:', result);
        if (result.success) {
          console.log(`[BANNER] Loaded ${result.data.length} banner(s)`);
          setBanners(result.data);
        } else {
          console.warn('[BANNER] API returned success:false');
        }
      })
      .catch((err) => console.error('[BANNER] fetch error:', err))
      .finally(() => setLoading(false));
  }, []);

  const nextSlide = useCallback(() => {
    setCurrent((prev) => {
      const next = (prev + 1) % banners.length;
      console.log('[BANNER] nextSlide ->', next);
      return next;
    });
  }, [banners.length]);

  const prevSlide = useCallback(() => {
    setCurrent((prev) => {
      const back = (prev - 1 + banners.length) % banners.length;
      console.log('[BANNER] prevSlide ->', back);
      return back;
    });
  }, [banners.length]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(nextSlide, 4000);
    return () => clearInterval(timer);
  }, [banners.length, nextSlide]);

  if (loading) return null;

  if (banners.length === 0) {
    return (
      <div className="banner">
        <style>{heroBannerCSS}</style>
        <img src="/saare_1.jpeg" alt="Banner" style={{ filter: 'brightness(1)' }} />
      </div>
    );
  }

  const banner = banners[current];
  const imageUrl = `${API_BASE_URL}/uploads/${banner.image_url}`;

  return (
    <div className="banner hero-banner">
      <style>{heroBannerCSS}</style>

      <img
        src={imageUrl}
        alt={banner.title || 'Banner'}
        style={{ filter: 'brightness(1)' }}
        onError={(e) => {
          console.error('[BANNER] Image failed to load:', imageUrl);
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
                  console.log('[BANNER] dot clicked ->', idx);
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

const heroBannerCSS = `
.banner {
  line-height: 0;
  margin: 0;
  padding: 0;
}

.hero-banner {
  position: relative;
  width: 100%;
  overflow: hidden;
}

.banner img {
  display: block;
  width: 100%;
  height: 65vh;
  min-height: 380px;
  max-height: 640px;
  object-fit: cover;
  object-position: center;
}

.hero-banner::after {
  content: '';
  position: absolute;
  inset: 0;
  background:
    linear-gradient(90deg, rgba(20,16,20,0.92) 0%, rgba(20,16,20,0.55) 45%, rgba(20,16,20,0.05) 75%),
    linear-gradient(0deg, rgba(20,16,20,0.75) 0%, rgba(20,16,20,0) 35%);
  pointer-events: none;
}

.hero-banner-content {
  position: absolute;
  left: 5%;
  bottom: 12%;
  z-index: 2;
  max-width: 640px;
  color: #fff;
}

.hero-banner-content h1 {
  font-family: 'Fraunces', serif;
  font-size: clamp(1.8rem, 4vw, 3rem);
  font-weight: 600;
  margin: 0 0 10px;
  line-height: 1.15;
  text-shadow: 0 2px 12px rgba(0,0,0,0.5);
}

.hero-banner-content p {
  font-family: 'Manrope', sans-serif;
  font-size: clamp(0.9rem, 1.3vw, 1.05rem);
  font-weight: 400;
  color: rgba(255,255,255,0.88);
  margin: 0 0 20px;
  line-height: 1.5;
  max-width: 520px;
}

.hero-banner-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 28px;
  background: linear-gradient(135deg, #E23E7A, #C9296A);
  color: #fff;
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  font-size: 0.95rem;
  letter-spacing: 0.3px;
  text-decoration: none;
  border-radius: 999px;
  box-shadow: 0 6px 18px rgba(226,62,122,0.35);
  transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.hero-banner-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(226,62,122,0.45);
  background: linear-gradient(135deg, #EF4E8B, #D6357A);
}

.hero-banner-btn::before {
  content: '🛍';
  font-size: 0.95rem;
}

.hero-banner-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 3;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.35);
  color: #fff;
  border: none;
  border-radius: 50%;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: background 0.2s ease, transform 0.2s ease;
}

.hero-banner-arrow:hover {
  background: rgba(226,62,122,0.85);
  transform: translateY(-50%) scale(1.08);
}

.hero-banner-arrow.left { left: 18px; }
.hero-banner-arrow.right { right: 18px; }

.hero-banner-dots {
  position: absolute;
  bottom: 5%;
  right: 5%;
  z-index: 3;
  display: flex;
  gap: 8px;
}

.hero-banner-dots .dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255,255,255,0.4);
  cursor: pointer;
  transition: all 0.25s ease;
}

.hero-banner-dots .dot.active {
  width: 24px;
  border-radius: 4px;
  background: #E23E7A;
}

@media (max-width: 768px) {
  .banner img { height: 48vh; min-height: 300px; }
  .hero-banner-content { left: 6%; right: 6%; bottom: 14%; max-width: none; }
  .hero-banner-arrow { width: 36px; height: 36px; }
  .hero-banner-dots { bottom: 4%; right: 6%; }
}
`;

export default HeroBanner;