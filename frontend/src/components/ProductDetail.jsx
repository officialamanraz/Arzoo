import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import ReviewForm from '../components/ReviewForm';
import ReviewSection from '../components/ReviewSection';
import Recommended from "../components/Recommended";
import './ProductDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;
// Maps DB column name -> display label. Add/remove entries here only --
// the list below renders itself dynamically, nothing is hardcoded in JSX.
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
        console.error("Error fetching product:", error);
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
        console.error("Translation error:", err);
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

  // Close lightbox on Escape, navigate images with arrow keys
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsLightboxOpen(false);
      if (e.key === 'ArrowRight') showNextImage();
      if (e.key === 'ArrowLeft') showPrevImage();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLightboxOpen, activeImageIdx]);

  const sliderImages = saree?.images && Array.isArray(saree.images) ? saree.images : [saree?.image_url || "/saare_1.jpeg"];

  const showNextImage = () => {
    setActiveImageIdx((prev) => (prev + 1) % sliderImages.length);
  };

  const showPrevImage = () => {
    setActiveImageIdx((prev) => (prev - 1 + sliderImages.length) % sliderImages.length);
  };

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
      console.error("Connection error:", error);
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
                src={`${API_BASE_URL}/uploads/${sliderImages[activeImageIdx]}`}
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
                    src={`${API_BASE_URL}/uploads/${img}`}
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
                aria-label="Like this product"
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
              <button
                onClick={() => handleAddToCart(saree.product_id)}
                disabled={isAdding || isOutOfStock}
                className="add-to-cart-btn"
              >
                {isOutOfStock ? "Sold Out" : isAdding ? "Adding..." : "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="buy-now-btn"
              >
                {isOutOfStock ? "Sold Out" : "Buy Now"}
              </button>
            </div>

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

      {/* Edge-to-edge review section -- breaks out of the max-width container on purpose */}
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
          <button className="lightbox-close-btn" onClick={() => setIsLightboxOpen(false)} aria-label="Close">
            ✕
          </button>

          {sliderImages.length > 1 && (
            <button
              className="lightbox-nav-btn lightbox-prev-btn"
              onClick={(e) => { e.stopPropagation(); showPrevImage(); }}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}

          <img
            src={`${API_BASE_URL}/uploads/${sliderImages[activeImageIdx]}`}
            alt={saree.name}
            className="lightbox-image"
            onClick={(e) => e.stopPropagation()}
            onError={(e) => { e.target.src = "/saare_1.jpeg"; }}
          />

          {sliderImages.length > 1 && (
            <button
              className="lightbox-nav-btn lightbox-next-btn"
              onClick={(e) => { e.stopPropagation(); showNextImage(); }}
              aria-label="Next image"
            >
              ›
            </button>
          )}

          {sliderImages.length > 1 && (
            <div className="lightbox-counter">{activeImageIdx + 1} / {sliderImages.length}</div>
          )}
          <ReviewForm 
        productId={productId} 
        onReviewAdded={fetchReviews} 
        availableOptions={Object.keys(stats || {})} 
      />

      {/* 3. Review Section: Isme ab direct state data pass kar sakte hain */}
      <ReviewSection 
        productId={productId}
        reviews={reviews}
        stats={stats}
        totalReviews={totalReviews}
      />
    </div>
      )}
    </div>
  );
}

export default ProductDetail;