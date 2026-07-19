import React from 'react';
import { Link } from 'react-router-dom';
import { uiTranslations } from '../languages';
import HeroBanner from './HeroBanner'; 
const API_BASE_URL = import.meta.env.VITE_API_URL;
function Home({ sarees, loading, error, currentPage, setCurrentPage, searchKeyword, keyword, currency, rates, language }) {
  
  // Currency Converter Logic
  const getConvertedPrice = (basePrice) => {
    if (currency === 'INR' || !rates || !rates[currency]) return basePrice;
    return (basePrice * rates[currency].rate).toFixed(2);
  };

  // Translation Helper
  const t = (key) => {
    const currentLang = language || 'en';
    return uiTranslations[currentLang]?.[key] || uiTranslations['en'][key];
  };

  return (
    <>
      <HeroBanner />

      <section className="product-section" id="product">
        <h2 className="section-title">
          {keyword ? `${t('searchResults')} "${keyword}"` : t('featured')}
        </h2>

        {error && <h3 style={{ textAlign: 'center', color: '#f44336' }}>⚠️ {error}</h3>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <h3 style={{ color: '#ff5722', animation: 'pulse 1.5s infinite' }}>{t('loading')}</h3>
          </div>
        ) : sarees?.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px', color: '#ff9800', background: '#fff3e0', borderRadius: '10px' }}>
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
                  <Link to={`/product/${sareeId}`} className="product-card" key={sareeId} style={{ transition: 'transform 0.3s', borderRadius: '10px', overflow: 'hidden' }}>
                    <img
                      src={imagePath}
                      alt={saree.name || saree.title}
                      style={{ width: '100%', height: '280px', objectFit: 'cover' }}
                      onError={(e) => { e.target.src = "/saare_1.jpeg"; }}
                    />

                    <div className="product-info" style={{ padding: '15px' }}>
                      <p className="product-name" style={{ fontWeight: 'bold', fontSize: '1.1rem', color: '#333', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {saree.name || saree.title}
                      </p>
                      <div className="price-row" style={{ marginTop: '10px' }}>
                        <span className="price" style={{ color: '#4CAF50', fontSize: '1.2rem', fontWeight: 'bold' }}>
                           {currency} {saree.price ? getConvertedPrice(saree.price).toLocaleString('en-US') : '0'}
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Pagination Controls */}
            {!searchKeyword && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', margin: '40px 0' }}>
                
                <button
                  onClick={() => { 
                    setCurrentPage(prev => prev - 1); 
                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                  }}
                  disabled={currentPage === 1}
                  style={{
                    padding: '12px 30px', 
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    background: currentPage === 1 ? '#e0e0e0' : 'linear-gradient(45deg, #ff5722, #ff9800)',
                    color: currentPage === 1 ? '#9e9e9e' : 'white', 
                    border: 'none', 
                    borderRadius: '25px', 
                    fontWeight: 'bold'
                  }}
                >
                  {t('previous')}
                </button>

                <span style={{ fontSize: '18px', fontWeight: 'bold', alignSelf: 'center', color: '#555', background: '#f5f5f5', padding: '5px 15px', borderRadius: '15px' }}>
                  {t('page')} {currentPage}
                </span>

                <button
                  onClick={() => { 
                    setCurrentPage(prev => prev + 1); 
                    window.scrollTo({ top: 0, behavior: 'smooth' }); 
                  }}
                  disabled={!sarees || sarees.length < 12} 
                  style={{
                    padding: '12px 30px', 
                    cursor: (!sarees || sarees.length < 12) ? 'not-allowed' : 'pointer',
                    background: (!sarees || sarees.length < 12) ? '#e0e0e0' : 'linear-gradient(45deg, #ff5722, #ff9800)',
                    color: (!sarees || sarees.length < 12) ? '#9e9e9e' : 'white', 
                    border: 'none', 
                    borderRadius: '25px', 
                    fontWeight: 'bold'
                  }}
                >
                  {t('next')}
                </button>
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
}

export default Home;