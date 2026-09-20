import React from 'react';
import { Link } from 'react-router-dom';
import { uiTranslations } from '../languages';
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
    const total = actualTotalPages;
    const pages = [];

    if (total <= 4) {
      for (let i = 1; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (currentPage <= 2) {
      pages.push(1, 2, 3);
    } 
    else if (currentPage >= total - 1) {
      pages.push(total - 2, total - 1, total);
    } 
    else {
      pages.push(currentPage - 1, currentPage, currentPage + 1);
    }

    if (!pages.includes(total)) {
      pages.push(total);
    }

    return pages;
  };

  return (
    <div className="home-container">
      <HeroBanner />
      
      <div className="hero-subtitle-wrapper">
        <div className="hero-text-overlay">
          {t('heroText')}
        </div>
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
                const finalImageUrl = saree.image_url || saree.thumbnail || '/saare_1.jpeg';
                const sareeId = saree.product_id || saree.id;

                // Smart Discount Logic: Checks backend first, calculates via math if missing
                let displayDiscount = saree.discount_percentage || 0;
                if (!displayDiscount && saree.mrp && saree.price && saree.mrp > saree.price) {
                  displayDiscount = Math.round(((saree.mrp - saree.price) / saree.mrp) * 100);
                }

                return (
                  <Link to={`/product/${sareeId}`} className="product-card" key={sareeId}>
                    
                    <div className="product-image-container">
                      <img
                        src={finalImageUrl}
                        alt={saree.name || saree.title}
                        className="product-img"
                        onError={(e) => { 
                          e.target.src = "/saare_1.jpeg"; 
                        }}
                      />
                      {/* Uses the smart calculated discount */}
                      {displayDiscount > 0 && (
                        <span className="flipkart-discount-badge">
                          ↓{displayDiscount}%
                        </span>
                      )}
                    </div>

                    <div className="product-info">
                      <p className="product-name" title={saree.name || saree.title}>
                        {saree.name || saree.title}
                      </p>
                      
                      <div className="price-row">
                        <span className="price-tag">
                          {currency} {saree.price ? getConvertedPrice(saree.price).toLocaleString('en-US') : '0'}
                        </span>
                        {saree.mrp && saree.mrp > saree.price && (
                          <span className="original-mrp">
                            {currency} {getConvertedPrice(saree.mrp).toLocaleString('en-US')}
                          </span>
                        )}
                      </div>
                    </div>
                    
                  </Link>
                );
              })}
            </div>

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