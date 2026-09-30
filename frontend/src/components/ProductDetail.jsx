import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaHeart, FaRegHeart, FaComment, FaWhatsapp } from 'react-icons/fa';
import Zoom from 'react-medium-image-zoom';
import 'react-medium-image-zoom/dist/styles.css';

import Recommended from "../components/Recommended";
import './ProductDetail.css';
import reviews from "../components/ReviewsPage"
const API_BASE_URL = import.meta.env.VITE_API_URL;

// 🌟 Field Definitions for Tabs
const SPEC_FIELDS = [
  { key: 'fabric', label: 'Fabric/Material' },
  { key: 'primary_color', label: 'Primary Color' },
  { key: 'other_color', label: 'Other Colors' },
  { key: 'pattern', label: 'Pattern' },
  { key: 'craft', label: 'Craft' },
  { key: 'weave', label: 'Weave' },
  { key: 'zari_type', label: 'Zari Type' },
  { key: 'border_type', label: 'Border Type' },
  { key: 'border_motifs', label: 'Border Motifs' },
  { key: 'blouse', label: 'Blouse' },
  { key: 'blouse_length', label: 'Blouse Length' },
  { key: 'khats', label: 'Khats' },
  { key: 'weight', label: 'Weight' }
];

const MFG_FIELDS = [
  { key: 'origin', label: 'Country of Origin' },
  { key: 'producer', label: 'Producer' },
  { key: 'maker', label: 'Maker' },
  { key: 'producer_address', label: 'Name and address of the Manufacturer', fullWidth: true },
  { key: 'packer_address', label: 'Name and address of the Packer', fullWidth: true }
];

function ProductDetail({ currency, rates, language }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saree, setSaree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [translatedName, setTranslatedName] = useState("");
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [refreshReviews, setRefreshReviews] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isZoomHovered, setIsZoomHovered] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });
  const handleImageMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x, y });
  };
  const [showReviewsToggle, setShowReviewsToggle] = useState(false);
  const [reviewStats, setReviewStats] = useState({});
  const [totalReviewsCount, setTotalReviewsCount] = useState(0);
  const [previewReviews, setPreviewReviews] = useState([]);
 
  // 🌟 New States for Flipkart Style Details Section
  const [showAllDetails, setShowAllDetails] = useState(false); // Toggle Open/Close
  const [activeDetailTab, setActiveDetailTab] = useState('specifications'); // Pill Tabs

  const token = localStorage.getItem('token');
  // Relative Time Helper (e.g., "2 days ago")
  const timeAgo = (dateStr) => {
    if (!dateStr) return "";
    const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
    let interval = seconds / 31536000;
    if (interval > 1) return Math.floor(interval) + " years ago";
    interval = seconds / 2592000;
    if (interval > 1) return Math.floor(interval) + " months ago";
    interval = seconds / 86400;
    if (interval > 1) return Math.floor(interval) + " days ago";
    interval = seconds / 3600;
    if (interval > 1) return Math.floor(interval) + " hours ago";
    interval = seconds / 60;
    if (interval > 1) return Math.floor(interval) + " minutes ago";
    return Math.floor(seconds) + " seconds ago";
  };
useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/${id}`);
        const data = await res.json();
        if (data?.success) {
          setReviewStats(data.stats || {});
          setTotalReviewsCount(data.totalReviews || (data.reviews ? data.reviews.length : 0));
          setPreviewReviews(data.reviews || []);
        }
      } catch (err) {
        console.error("Error fetching review stats:", err);
      }
    };
    if (id) fetchStats();
  }, [id, refreshReviews]);

  // Dynamic Helpers for Reviews Toggle
  const formatLabel = (str) => {
    if (!str) return "Rating";
    return str.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  };

  const getColorForOption = (key) => {
    const map = {
      skip: "#ef4444",
      timepass: "#f59e0b",
      go_for_it: "#3b82f6",
      perfection: "#22c55e",
    };
    return map[key?.toLowerCase()] || "#3b82f6";
  };

  const resolveImage = (url) => {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const customerImages = previewReviews.filter((r) => r.image_url).map((r) => r.image_url);
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const prodRes = await fetch(`${API_BASE_URL}/api/products/product/${id}`);
        const prodResult = await prodRes.json();
        
        if (prodResult && prodResult.data) {
          setSaree(prodResult.data);
          setTranslatedName(prodResult.data.name);
          setTranslatedDesc(prodResult.data.description);
        }

        const likesRes = await fetch(`${API_BASE_URL}/api/likes/${id}/like`, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const likesData = await likesRes.json();
        if (likesData.success) {
          setIsLiked(likesData.isLiked);
          setLikesCount(likesData.totalLikes || 0);
        }

        const commentsRes = await fetch(`${API_BASE_URL}/api/comments/${id}/comments`);
        const commentsData = await commentsRes.json();
        if (commentsData.success) {
          setComments(commentsData.comments || []);
        }
      } catch (error) {
        console.error("[ProductDetail] Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProductData();
  }, [id, token]);

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

  const handleToggleLike = async () => {
    if (!token) {
      toast.error("Please login to like this product!");
      return;
    }
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/${id}/like`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (!data.success) throw new Error("Failed to toggle like");
    } catch (error) {
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!token) {
      toast.error("Please login to post a comment!");
      return;
    }
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment_text: newComment })
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        toast.success("Comment posted successfully!");
      } else {
        toast.error(data.message || "Failed to post comment.");
      }
    } catch (error) {
      toast.error("Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const stockQty = saree?.stock_qty ?? saree?.quantity ?? null;
  const isOutOfStock = stockQty !== null ? stockQty <= 0 : saree?.in_stock === false;
  
  const handleQtyChange = (type) => {
    if (type === 'inc' && (stockQty === null || quantity < stockQty)) setQuantity(prev => prev + 1);
    else if (type === 'dec' && quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToCart = async (sareeId) => {
    if (isOutOfStock) return;
    if (!token) {
      toast.error("Please login to add product to cart!");
      return;
    }
    setIsAdding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: sareeId, quantity: quantity })
      });
      if (response.ok) {
        toast.success(`Added ${quantity} item(s) to cart!`);
      } else {
        toast.error("Could not add item to cart.");
      }
    } catch (error) {
      toast.error("Could not add item to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (!saree || isOutOfStock) return;
    navigate('/add-address', {
      state: { buyNowProduct: { product_id: saree.product_id, name: saree.name, price: saree.price, quantity: quantity, image_url: saree.image_url } }
    });
  };

  const handleWhatsAppInquiry = () => {
    if (!saree) return;
    const message = `Hello! I am interested in VIP Booking.\n\n*Product:* ${saree.name}\n*Quantity:* ${quantity}\n*Price:* ${currency} ${getConvertedPrice(saree.price)}\n*Link:* ${window.location.href}`;
    window.open(`${API_BASE_URL}/api/whatsapp/redirect?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
  };

  const getConvertedPrice = (basePrice) => {
    if (currency === 'INR' || !rates || !rates[currency]) return basePrice;
    return (basePrice * rates[currency].rate).toFixed(2);
  };

  if (loading) return <div className="main-container"><h2>Loading product details...</h2></div>;
  if (!saree) return <div className="main-container"><h2>Product not found!</h2></div>;

  const sliderImages = saree?.images && Array.isArray(saree.images) && saree.images.length > 0 ? saree.images : [saree?.image_url || "/saare_1.jpeg"];
  const currentImageUrl = sliderImages[activeImageIdx] || "/saare_1.jpeg";
return (
    <div className="product-detail-page">
      <div className="main-container">
        <div className="details-container">
          
          {/* LEFT: GALLERY & AMAZON HOVER ZOOM */}
          <div className="gallery-section">
            <div 
              className="main-image-wrapper amazon-zoom-box"
              onMouseEnter={() => setIsZoomHovered(true)}
              onMouseLeave={() => setIsZoomHovered(false)}
              onMouseMove={handleImageMouseMove}
            >
              <img
                src={currentImageUrl} 
                alt={saree.name} 
                className="main-image amazon-zoom-img"
                style={isZoomHovered ? {
                  transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                  transform: 'scale(2.2)',
                  cursor: 'crosshair'
                } : {
                  transform: 'scale(1)',
                  transformOrigin: 'center center'
                }}
                onError={(e) => { if (!e.currentTarget.src.includes("/saare_1.jpeg")) { e.currentTarget.src = "/saare_1.jpeg"; } }} 
                draggable="false"
              />
              {isOutOfStock && <span className="sold-out-badge">Sold Out</span>}
              <div className="image-zoom-hint">{isZoomHovered ? "Zoomed" : "Hover to zoom"}</div>
            </div>

            {/* Slider / Thumbnails */}
            {sliderImages.length > 1 && (
              <div className="thumbnail-row">
                {sliderImages.map((img, idx) => (
                  <img
                    key={idx} src={img} alt={`Thumbnail ${idx + 1}`} className={`thumbnail ${activeImageIdx === idx ? 'thumbnail-active' : ''}`}
                    onClick={() => setActiveImageIdx(idx)} onError={(e) => { e.currentTarget.src = "/saare_1.jpeg"; }} draggable="false"
                  />
                ))}
              </div>
            )}

            {/* Variant Navigation Helper */}
            {saree.variants && saree.variants.length > 0 && (
              <div className="product-variants-section">
                <span className="variant-label">Select Color / Pattern:</span>
                <div className="variant-chips">
                  {saree.variants.map((v) => (
                    <Link key={v.product_id} to={`/product/${v.product_id}`} className={`variant-chip ${v.product_id === saree.product_id ? 'active' : ''}`}>
                      {v.color_name || 'Variant'}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="social-action-bar">
              <div className="social-action-item">
                <button type="button" className={`social-btn ${isLiked ? 'liked' : ''}`} onClick={handleToggleLike} aria-label="Like product">
                  {isLiked ? <FaHeart color="#e53e3e" size={18} /> : <FaRegHeart size={18} />}
                </button>
                <span className="social-action-count">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
              </div>
              <div className="social-action-item">
                <button type="button" className="social-btn" onClick={() => setShowComments(prev => !prev)} aria-label="Comments">
                  <FaComment size={18} />
                </button>
                <span className="social-action-count">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
              </div>
              <div className="social-action-item">
                <button type="button" className="social-btn whatsapp-btn" onClick={handleWhatsAppInquiry} aria-label="WhatsApp Inquiry">
                  <FaWhatsapp color="#25D366" size={20} />
                </button>
                <span className="social-action-count">Ask</span>
              </div>
            </div>

            {showComments && (
              <div className="inline-comments-section">
                <div className="inline-comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments-inline">No comments yet. Be the first!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.comment_id} className="inline-comment-item">
                        <strong>{c.user_name}</strong> {c.comment_text}
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleCommentSubmit} className="inline-comment-form">
                  <input type="text" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="inline-comment-input" />
                  <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="inline-comment-post">
                    {isSubmittingComment ? "Posting..." : "Post"}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* RIGHT: INFO, PRICE, CONTROLS */}
          <div className="info-box">
            <h1 className="product-title">{isTranslating ? "Translating..." : translatedName}</h1>
            
            <div className="price-container">
              <h2 className="product-price">{currency} {getConvertedPrice(saree.price)}</h2>
              {saree.mrp && saree.mrp > saree.price && (
                <>
                  <span className="mrp-price">MRP {currency} {getConvertedPrice(saree.mrp)}</span>
                  {saree.discount_percentage !== undefined && (
                    <span className="discount-badge">{saree.discount_percentage}% OFF</span>
                  )}
                </>
              )}
            </div>

            <div className="badges-row">
              <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                {isOutOfStock ? 'Sold Out' : stockQty ? `In Stock (${stockQty} left)` : 'In Stock'}
              </span>
            </div>

            <div className="policy-note">
              <strong>Note:</strong> Not returnable. If you buy it by mistake, cancel in the time of pending.
            </div>

            <div className="quantity-selector-container">
              <span className="qty-label">Quantity:</span>
              <div className="quantity-controls">
                <button type="button" className="qty-btn" onClick={() => handleQtyChange('dec')}>-</button>
                <span className="qty-display">{quantity}</span>
                <button type="button" className="qty-btn" onClick={() => handleQtyChange('inc')} disabled={stockQty !== null && quantity >= stockQty}>+</button>
              </div>
            </div>

            <div className="action-buttons-row">
              <button onClick={() => handleAddToCart(saree.product_id)} disabled={isAdding || isOutOfStock} className="add-to-cart-btn">
                {isOutOfStock ? "Sold Out" : isAdding ? "Adding..." : "Add to Cart"}
              </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock} className="buy-now-btn">
                {isOutOfStock ? "Sold Out" : "Buy Now"}
              </button>
            </div>

            {/* 🌟 FLIPKART STYLE 'ALL DETAILS' SECTION */}
            <div className="fk-all-details-container">
              <button 
                type="button"
                className="fk-details-toggle-btn" 
                onClick={() => setShowAllDetails(!showAllDetails)}
              >
                All details
                <span className="toggle-icon">{showAllDetails ? '▲' : '▼'}</span>
              </button>

              {showAllDetails && (
                <div className="fk-details-content">
                  <div className="fk-tabs-row">
                    <button 
                      type="button"
                      className={`fk-tab-btn ${activeDetailTab === 'specifications' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('specifications')}
                    >Specifications</button>
                    <button 
                      type="button"
                      className={`fk-tab-btn ${activeDetailTab === 'description' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('description')}
                    >Description</button>
                    <button 
                      type="button"
                      className={`fk-tab-btn ${activeDetailTab === 'manufacturer' ? 'active' : ''}`}
                      onClick={() => setActiveDetailTab('manufacturer')}
                    >Manufacturer info</button>
                  </div>

                  <div className="fk-tab-pane">
                    {activeDetailTab === 'specifications' && (
                      <div className="fk-spec-group">
                        <h4 className="fk-group-title">General</h4>
                        <div className="fk-grid-2-col">
                          {SPEC_FIELDS.filter(f => saree[f.key] && saree[f.key] !== 'null').map((f, i) => (
                            <div key={i} className="fk-grid-item">
                              <span className="fk-label">{f.label}</span>
                              <span className="fk-value">{saree[f.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeDetailTab === 'description' && (
                      <div className="fk-spec-group">
                        <p className="product-desc" style={{ color: 'var(--text-dark)' }}>
                          {isTranslating ? "Translating details..." : (translatedDesc || "No description available.")}
                        </p>
                      </div>
                    )}

                    {activeDetailTab === 'manufacturer' && (
                      <div className="fk-spec-group">
                        <div className="fk-grid-2-col">
                          {MFG_FIELDS.filter(f => saree[f.key] && saree[f.key] !== 'null').map((f, i) => (
                            <div key={i} className={`fk-grid-item ${f.fullWidth ? 'fk-full-width' : ''}`}>
                              <span className="fk-label">{f.label}</span>
                              <span className="fk-value">{saree[f.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

{/* =========================================================
    RATINGS & REVIEWS TOGGLE
========================================================= */}
<div
  className="fk-all-details-container reviews-toggle-container"
  style={{ marginTop: "15px" }}
>
  <button
    type="button"
    className="fk-details-toggle-btn"
    onClick={() =>
      setShowReviewsToggle((prev) => !prev)
    }
    aria-expanded={showReviewsToggle}
  >
    <span>Ratings and reviews</span>

    <span className="toggle-icon">
      {showReviewsToggle ? "▲" : "▼"}
    </span>
  </button>

  {showReviewsToggle && (
    <div className="fk-details-content fk-reviews-content">

      {/* Review summary */}
      <div className="fk-rev-summary-sub">
        {totalReviewsCount > 0
          ? `Based on ${totalReviewsCount} ${
              totalReviewsCount === 1
                ? "rating"
                : "ratings"
            }`
          : "No customer reviews yet"}
      </div>

      {/* Customer Photos */}
      {customerImages.length > 0 && (
        <div className="fk-buyer-photos-section">

          <h4 className="fk-review-subtitle">
            Customer Photos
          </h4>

          <div className="fk-buyer-photos-row">
            {customerImages.map((imgUrl, idx) => (
              <div
                key={`${imgUrl}-${idx}`}
                className="fk-buyer-photo-item"
              >
                <img
                  src={resolveImage(imgUrl)}
                  alt={`Customer review ${idx + 1}`}
                  className="fk-buyer-thumb-img"
                  loading="lazy"
                  onError={(e) => {
                    e.currentTarget.style.display =
                      "none";
                  }}
                />
              </div>
            ))}
          </div>

        </div>
      )}

      {/* Compact Reviews */}
      <div className="fk-compact-reviews-section">

        <h4 className="fk-review-subtitle">
          Customer Reviews
        </h4>

        {previewReviews.length > 0 ? (
          <div className="fk-compact-cards-grid">

            {previewReviews.slice(0, 4).map((rev, idx) => (
              <div
                key={rev.review_id || idx}
                className="fk-compact-review-card"
              >

                <div className="fk-card-badge-row">
                  <span
                    className="fk-card-opinion-tag"
                    style={{
                      backgroundColor:
                        getColorForOption(
                          rev.rating_type
                        ),
                    }}
                  >
                    {formatLabel(
                      rev.rating_type
                    )}
                  </span>

                  <span className="fk-card-relative-time">
                    {timeAgo(rev.created_at)}
                  </span>
                </div>

                <p className="fk-card-short-comment">
                  {rev.comment
                    ? rev.comment.length > 80
                      ? `${rev.comment.slice(
                          0,
                          80
                        )}...`
                      : rev.comment
                    : "No written review."}
                </p>

                <div className="fk-card-author-footer">

                  <span className="fk-card-author-name">
                    {rev.user_name ||
                      "Customer"}
                  </span>

                  {(rev.is_verified_buyer === 1 ||
                    rev.is_verified_buyer === true ||
                    rev.is_verified_buyer === "1") && (
                    <span className="fk-card-verified-tag">
                      <FaCheckCircle
                        size={11}
                      />
                      Verified Buyer
                    </span>
                  )}

                </div>

              </div>
            ))}

          </div>
        ) : (
          <p className="fk-no-reviews-note">
            No customer reviews yet.
          </p>
        )}

      </div>
    </div>
  )}
</div>

{/* Show all reviews */}
{totalReviewsCount > 0 && (
  <Link
    to={`/product-reviews/${saree.product_id}`}
    className="fk-standalone-reviews-btn"
  >
    Show all reviews <span>›</span>
  </Link>
)}

          </div> {/* Closes info-box */}
        </div> {/* Closes details-container */}
      </div> {/* Closes main-container */}

      {/* RECOMMENDED SECTION (Mobile Friendly Swiper) */}
      <div className="full-width-review-section">
        <div className="review-inner-container">
          <div className="recommended-section-wrapper">
            <Recommended 
              currentProductId={saree.product_id} 
              categoryId={saree.category_id} 
              subcategoryId={saree.subcategory_id} 
            />
          </div>
        </div>
      </div>
    </div> 
  );
}

export default ProductDetail;