import React from 'react';
import { Link } from 'react-router-dom';
import { uiTranslations } from '../languages';
import { getImageUrl } from '../getImageUrl';
import HeroBanner from './HeroBanner';
import './Home.css';

function Home({ 
  sarees, loading, error, currentPage, setCurrentPage, 
  keyword, categoryName, subcategoryName, 
  currency, rates, language, totalPages = 1 
}) {

  const getConvertedPrice = (basePrice) => {
    if (currency === 'INR' || !rates || !rates[currency]) return basePrice;
    return (basePrice * rates[currency].rate).toFixed(2);
  };

  const t = (key) => {
    const currentLang = language || 'en';
    return uiTranslations[currentLang]?.[key] || uiTranslations['en'][key];
  };

  const ITEMS_PER_PAGE = 12;
  
  const displayedSarees = sarees && sarees.length > ITEMS_PER_PAGE 
    ? sarees.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)
    : sarees;

  const actualTotalPages = sarees && sarees.length > ITEMS_PER_PAGE 
    ? Math.ceil(sarees.length / ITEMS_PER_PAGE)
    : Math.max(1, totalPages);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= actualTotalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const getPageTitle = () => {
    if (keyword) return `${t('searchResults')} "${keyword}"`;
    if (subcategoryName) return subcategoryName; 
    if (categoryName) return categoryName;
    return t('featured');
  };

  const getPageNumbers = () => {
    let startPage = Math.max(1, currentPage - 1);
    let endPage = Math.min(actualTotalPages, currentPage + 1);

    if (currentPage === 1) {
      endPage = Math.min(actualTotalPages, 3);
    } else if (currentPage === actualTotalPages) {
      startPage = Math.max(1, actualTotalPages - 2);
    }

    const pages = [];
    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className="home-container">
      <HeroBanner />
      
      <div className="hero-text-overlay">
        {t('heroText')}
      </div>

      <section className="product-section" id="product">
        <h2 className="section-title">
          {getPageTitle().toUpperCase()}
        </h2>

        {error && <h3 className="error-message">⚠️ {error}</h3>}

        {loading ? (
          <div className="loader-container">
            <h3 className="pulse-text">{t('loading')}</h3>
          </div>
        ) : !displayedSarees || displayedSarees.length === 0 ? (
          <div className="empty-state">
            <h3>{t('noSarees')}</h3>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {displayedSarees.map((saree) => {
                const imageName = saree.image_url || saree.thumbnail || saree.image;
                const imagePath = getImageUrl(imageName);
                const sareeId = saree.product_id || saree.id;

                return (
                  <Link to={`/product/${sareeId}`} className="product-card" key={sareeId}>
                    <img
                      src={getImageUrl(imagePath)}
                      alt={saree.name || saree.title}
                      className="product-img"
                      onError={(e) => { 
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

            {/* 🚨 FIX: Restored your exact original fallback! Forces display if 12 items exist */}
            {(actualTotalPages > 1 || (sarees && sarees.length === ITEMS_PER_PAGE)) && (
              <div className="pagination-container">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="pagination-btn"
                >
                  {t('previous')}
                </button>

                <div className="pagination-numbers">
                  {getPageNumbers().map(num => (
                    <button 
                      key={num}
                      onClick={() => handlePageChange(num)}
                      className={`page-num-btn ${currentPage === num ? 'active' : ''}`}
                    >
                      {num}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === actualTotalPages && sarees.length < ITEMS_PER_PAGE}
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