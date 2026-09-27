import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Swiper Default Premium CSS
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import './HeroBanner.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

function HeroBanner() {
  const navigate = useNavigate();
  const [banners, setBanners] = useState([]);
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

  const handleBannerClick = (banner) => {
    const link = banner.button_link || banner.link; 
    if (link && link.trim() !== '') {
      navigate(link);
    }
  };

  if (loading || banners.length === 0) return null;

  return (
    <div className="hero-banner-wrapper">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        loop={banners.length > 1}
        navigation={banners.length > 1}
        pagination={{ clickable: true, dynamicBullets: true }}
        autoplay={{ delay: 4000, disableOnInteraction: false }}
        className="hero-swiper"
      >
        {banners.map((banner, idx) => {
          const desktopImageUrl = getImageUrl(banner.image_url);
          const mobileImageUrl = banner.mobile_image_url 
            ? getImageUrl(banner.mobile_image_url) 
            : desktopImageUrl;

          return (
            <SwiperSlide 
              key={idx} 
              onClick={() => handleBannerClick(banner)}
              style={{ cursor: 'pointer' }}
            >
              <picture>
                {banner.mobile_image_url && (
                  <source media="(max-width: 768px)" srcSet={mobileImageUrl} />
                )}
                <img
                  src={desktopImageUrl}
                  alt={banner.title || "Arzoo Saree Banner"}
                  className="hero-banner-img"
                   style={{
    width: '100%',
    height: 'auto',
    display: 'block',
    objectFit: 'contain'
  }}
                />
              </picture>
            </SwiperSlide>
          );
        })}
      </Swiper>
    </div>
  );
}

export default HeroBanner;