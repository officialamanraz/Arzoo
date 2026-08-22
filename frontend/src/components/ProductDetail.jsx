import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import { getImageUrl } from '../getImageUrl'; 
import ReviewForm from '../components/ReviewForm';
import ReviewSection from '../components/ReviewSection';
import Recommended from "../components/Recommended";
import './ProductDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const DETAIL_FIELD_LABELS = {
  primary_color: 'Primary Color',
  other_color: 'Other Colors',
  border_type: 'Border Type',
  pattern: 'Pattern',
  craft: 'Craft',
  weave: 'Weave',
  zari_type: 'Zari Type',
  blouse: 'Blouse',
  blouse_length: 'Blouse Length',
  border_motifs: 'Border Motifs',
  fabric: 'Fabric/Material',
  khats: 'Khats',
  weight: 'Product Weight',
  origin: 'Origin',
  producer: 'Producer',
  maker: 'Maker'
};

function ProductDetail({ currency, rates, language }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [saree, setSaree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [translatedName, setTranslatedName] = useState("");
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [isLiked, setIsLiked] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  const handleReviewAdded = () => {
    setRefreshReviews(prev => prev + 1);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/products/product/${id}`);
        const result = await response.json();

        if (result && result.data) {
          setSaree(result.data);
          setTranslatedName(result.data.name);
          setTranslatedDesc(result.data.description);
        }
      } catch (error) {
        console.error("[ProductDetail] Error fetching product:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  const handleBuyNow = () => {
    if (!saree) return;
    navigate('/add-address', {
      state: {
        buyNowProduct: {
          product_id: saree.product_id,
          name: saree.name,
          price: saree.price,
          quantity: 1,
          image_url: saree.image_url
        }
      }
    });
  };

  useEffect(() => {
    if (!saree || !language || language === 'en') return;

    const fetchTranslations = async () => {
      setIsTranslating(true);
      try {
        const [nameRes, descRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: saree.name, targetLanguage: language })
          }),
          fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: saree.description, targetLanguage: language })
          })
        ]);
        const nData = await nameRes.json();
        const dData = await descRes.json();
        setTranslatedName(nData.translatedText || saree.name);
        setTranslatedDesc(dData.translatedText || saree.description);
      } catch (err) {
        console.error("[ProductDetail] Translation error:", err);
      } finally {
        setIsTranslating(false);
      }
    };
    fetchTranslations();
  }, [language, saree]);

  useEffect(() => {
    if (!id) return;
    const likedList = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    setIsLiked(likedList.includes(id));
  }, [id]);

  useEffect(() => {
    if (!isLightboxOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') showNextImage();
      if (e.key === 'ArrowLeft') showPrevImage();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeImageIdx]);

  const sliderImages = saree?.images && Array.isArray(saree.images) ? saree.images : [saree?.image_url || "/saare_1.jpeg"];

  const showNextImage = () => setActiveImageIdx((prev) => (prev + 1) % sliderImages.length);
  const showPrevImage = () => setActiveImageIdx((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);

  const getConvertedPrice = (basePrice) => {
    if (currency === 'INR' || !rates || !rates[currency]) return basePrice;
    return (basePrice * rates[currency].rate).toFixed(2);
  };

  const stockQty = saree?.stock_qty ?? saree?.quantity ?? null;
  const isOutOfStock = stockQty !== null ? stockQty <= 0 : saree?.in_stock === false;

  const handleAddToCart = async (sareeId) => {
    if (isOutOfStock) return;
    setIsAdding(true);
    const token = localStorage.getItem('token');
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: sareeId, quantity: 1 }),
      });
      if (response.ok) alert("Item added to cart successfully!");
      else alert("Could not add item to cart.");
    } catch (error) {
      console.error("[ProductDetail] Error:", error);
    } finally {
      setIsAdding(false);
    }
  };

  const handleToggleLike = () => {
    const likedList = JSON.parse(localStorage.getItem('likedProducts') || '[]');
    let updated;
    if (likedList.includes(id)) {
      updated = likedList.filter((pid) => pid !== id);
      setIsLiked(false);
    } else {
      updated = [...likedList, id];
      setIsLiked(true);
    }
    localStorage.setItem('likedProducts', JSON.stringify(updated));
  };

  // CORRECTED WHATSAPP FUNCTION
  const handleWhatsAppInquiry = () => {
    if (!saree) return;
    const message = `Hello! I am interested in VIP Booking.\n\n*Product:* ${saree.name}\n*Price:* ${currency} ${getConvertedPrice(saree.price)}\n*Link:* ${window.location.href}`;
    const encodedMessage = encodeURIComponent(message);
    const secureRedirectUrl = `${API_BASE_URL}/api/whatsapp/redirect?text=${encodedMessage}`;
    window.open(secureRedirectUrl, "_blank", "noopener,noreferrer");
  };

  if (loading) return <div className="main-container"><h2>Loading product details...</h2></div>;
  if (!saree) return <div className="main-container"><h2>Product not found!</h2></div>;

  const finerDetails = Object.entries(DETAIL_FIELD_LABELS)
    .filter(([field]) => saree[field] !== null && saree[field] !== undefined && saree[field] !== '' && saree[field] !== 'null')
    .map(([field, label]) => ({ label, value: saree[field] }));

  return (
    <div className="product-detail-page">
      <div className="main-container">
        <Link to="/" className="back-link">← Back to Collection</Link>

        <div className="details-container">
          <div className="gallery-section">
            <div className="main-image-wrapper" onClick={() => setIsLightboxOpen(true)}>
              <img
                src={getImageUrl(sliderImages[activeImageIdx])}
                alt={saree.name}
                className="main-image"
                onError={(e) => { e.target.src = "/saare_1.jpeg"; }}
              />
              {isOutOfStock && <span className="sold-out-badge">Sold Out</span>}
              <span className="zoom-hint">Tap to view full image</span>
            </div>

            {sliderImages.length > 1 && (
              <div className="thumbnail-row">
                {sliderImages.map((img, idx) => (
                  <img
                    key={idx}
                    src={getImageUrl(img)}
                    alt={`Thumbnail ${idx}`}
                    className={`thumbnail ${activeImageIdx === idx ? 'thumbnail-active' : ''}`}
                    onClick={() => setActiveImageIdx(idx)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="info-box">
            <div className="title-row">
              <h1 className="product-title">{isTranslating ? "Translating..." : translatedName}</h1>
              <button
                className={`like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleToggleLike}
              >
                {isLiked ? '❤️' : '🤍'}
              </button>
            </div>

            <h2 className="product-price">{currency} {getConvertedPrice(saree.price)}</h2>

            <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
              {isOutOfStock ? 'Sold Out' : 'In Stock'}
            </span>

            {translatedDesc && (
              <p className="product-desc">{isTranslating ? "Translating details..." : translatedDesc}</p>
            )}

            <div className="action-buttons-row">
              <button onClick={() => handleAddToCart(saree.product_id)} disabled={isAdding || isOutOfStock} className="add-to-cart-btn">
                {isOutOfStock ? "Sold Out" : isAdding ? "Adding..." : "Add to Cart"}
              </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock} className="buy-now-btn">
                {isOutOfStock ? "Sold Out" : "Buy Now"}
              </button>
            </div>

            {/* VIP WhatsApp Secure Button */}
            <button 
                onClick={handleWhatsAppInquiry} 
                style={{ 
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    width: '100%', padding: '12px 20px', marginTop: '15px',
                    backgroundColor: '#25D366', color: '#ffffff', fontWeight: 'bold', fontSize: '16px',
                    border: 'none', borderRadius: '8px', cursor: 'pointer',
                    boxShadow: '0 4px 6px rgba(37, 211, 102, 0.3)', transition: 'transform 0.2s ease'
                }}
                onMouseOver={(e) => e.target.style.transform = 'scale(1.02)'}
                onMouseOut={(e) => e.target.style.transform = 'scale(1)'}
            >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.933 7.933 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                </svg>
                Inquire on WhatsApp
            </button>

            {finerDetails.length > 0 && (
              <div className="finer-details">
                <h3 className="finer-details-title">The Finer Details</h3>
                <ul className="finer-details-list">
                  {finerDetails.map((row, index) => (
                    <li key={index}>
                      <span className="finer-label">{row.label}:</span>
                      <span className="finer-value">{row.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Edge-to-edge review section */}
      <div className="full-width-review-section">
        <div className="review-inner-container">
          <div className="review-form-container">
            <ReviewForm productId={saree.product_id} onReviewAdded={handleReviewAdded} />
          </div>
          <ReviewSection productId={saree.product_id} key={refreshReviews} />
          <Recommended
            currentProductId={saree.product_id}
            categoryId={saree.category_id}
            subcategoryId={saree.subcategory_id}
          />
        </div>
      </div>
      
      {/* Lightbox / image slider modal */}
      {isLightboxOpen && (
        <div className="lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <button className="lightbox-close-btn" onClick={() => setIsLightboxOpen(false)}>✕</button>
          {sliderImages.length > 1 && (
            <button className="lightbox-nav-btn lightbox-prev-btn" onClick={(e) => { e.stopPropagation(); showPrevImage(); }}>‹</button>
          )}
          <img
            src={getImageUrl(sliderImages[activeImageIdx])}
            alt={saree.name}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.target.src = "/saare_1.jpeg"; }}
          />
          {sliderImages.length > 1 && (
            <button className="lightbox-nav-btn lightbox-next-btn" onClick={(e) => { e.stopPropagation(); showNextImage(); }}>›</button>
          )}
          {sliderImages.length > 1 && (
            <div className="lightbox-counter">{activeImageIdx + 1} / {sliderImages.length}</div>
          )}
        </div>
      )}
    </div>
  );
}

export default ProductDetail;