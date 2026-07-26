import React from 'react';
import { Link } from 'react-router-dom';
import { uiTranslations } from '../languages';
import { getImageUrl } from '../getImageUrl'; // agar components/ folder se import kar rahe ho
import HeroBanner from './HeroBanner';
import './Home.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Home({ sarees, loading, error, currentPage, setCurrentPage, searchKeyword, keyword, categoryName, currency, rates, language }) {

  const getConvertedPrice = (basePrice) => {
    if (currency === 'INR' || !rates || !rates[currency]) return basePrice;
    return (basePrice * rates[currency].rate).toFixed(2);
  };

  const t = (key) => {
    const currentLang = language || 'en';
    return uiTranslations[currentLang]?.[key] || uiTranslations['en'][key];
  };

  const handlePageChange = (direction) => {
    const newPage = direction === 'next' ? currentPage + 1 : currentPage - 1;
    console.log(`[Home] Navigating to page ${newPage}`);
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="home-container">
      <HeroBanner />
      
      <div className="hero-text-overlay">
        {t('heroText')}
      </div>

      <section className="product-section" id="product">
        <h2 className="section-title">
          {categoryName
            ? categoryName
            : keyword
              ? `${t('searchResults')} "${keyword}"`
              : t('featured')}
        </h2>

        {error && <h3 className="error-message">⚠️ {error}</h3>}

        {loading ? (
          <div className="loader-container">
            <h3 className="pulse-text">{t('loading')}</h3>
          </div>
        ) : sarees?.length === 0 ? (
          <div className="empty-state">
            <h3>{t('noSarees')}</h3>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {sarees?.map((saree) => {
                const imageName = saree.image_url || saree.thumbnail || saree.image;
                const imagePath = imageName ? `${API_BASE_URL}/uploads/${encodeURIComponent(imageName)}` : "/saare_1.jpeg";
                const sareeId = saree.product_id || saree.id;

                return (
                  <Link to={`/product/${sareeId}`} className="product-card" key={sareeId}>
                    <img
                      src={getImageUrl(imagePath)}
                      alt={saree.name || saree.title}
                      className="product-img"
                      onError={(e) => { 
                        console.log(`[Home] Image failed to load for product ${sareeId}. Using fallback.`);
                        e.target.src = "/saare_1.jpeg"; 
                      }}
                    />
                    <div className="product-info">
                      <p className="product-name" title={saree.name || saree.title}>
                        {saree.name || saree.title}
                      </p>
                      <div className="price-row">
                        <span className="price-tag">
                          {currency} {saree.price ? getConvertedPrice(saree.price).toLocaleString('en-US') : '0'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination: shown for default listing AND category filter, hidden only for actual keyword search */}
            {!keyword && (
              <div className="pagination-container">
                <button
                  onClick={() => handlePageChange('prev')}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  {t('previous')}
                </button>

                <span className="pagination-page">
                  {t('page')} {currentPage}
                </span>

                <button
                  onClick={() => handlePageChange('next')}
                  disabled={!sarees || sarees.length < 12}
                  className="pagination-btn"
                >
                  {t('next')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}

export default Home;