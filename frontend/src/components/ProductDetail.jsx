import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  const [quantity, setQuantity] = useState(1);

  const [translatedName, setTranslatedName] = useState("");
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [zoomStyle, setZoomStyle] = useState({
    transformOrigin: 'center center',
    transform: 'scale(1)'
  });

  const [refreshReviews, setRefreshReviews] = useState(0);

  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const [showComments, setShowComments] = useState(false);

  const token = localStorage.getItem('token');

  // =========================================================
  // FETCH PRODUCT + LIKE + COMMENTS
  // =========================================================
  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);

        // Product details
        const prodRes = await fetch(
          `${API_BASE_URL}/api/products/product/${id}`
        );

        const prodResult = await prodRes.json();

        if (prodResult && prodResult.data) {
          setSaree(prodResult.data);
          setTranslatedName(prodResult.data.name);
          setTranslatedDesc(prodResult.data.description);
        }

        // =====================================================
        // LIKE API
        // Removed "products" from URL
        // OLD:
        // /api/products/${id}/like
        //
        // NEW:
        // /api/${id}/like
        // =====================================================
        const likesRes = await fetch(
          `${API_BASE_URL}/api/likes`,
          {
            method: 'POST',
            headers: token
              ? { Authorization: `Bearer ${token}` }
              : {}
          }
        );

        const likesData = await likesRes.json();

        if (likesData.success) {
          setIsLiked(likesData.isLiked);
          setLikesCount(likesData.totalLikes || 0);
        }

        // =====================================================
        // COMMENTS API
        // Removed "products" from URL
        // OLD:
        // /api/products/${id}/comments
        //
        // NEW:
        // /api/${id}/comments
        // =====================================================
        const commentsRes = await fetch(
          `${API_BASE_URL}/api/comments`
        );

        const commentsData = await commentsRes.json();

        if (commentsData.success) {
          setComments(commentsData.comments || []);
        }

      } catch (error) {
        console.error(
          "[ProductDetail] Error fetching data:",
          error
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductData();
    }
  }, [id, token]);

  // =========================================================
  // TRANSLATION
  // =========================================================
  useEffect(() => {
    if (!saree || !language || language === 'en') return;

    const fetchTranslations = async () => {
      setIsTranslating(true);

      try {
        const [nameRes, descRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: saree.name,
              targetLanguage: language
            })
          }),

          fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              text: saree.description,
              targetLanguage: language
            })
          })
        ]);

        const nData = await nameRes.json();
        const dData = await descRes.json();

        setTranslatedName(
          nData.translatedText || saree.name
        );

        setTranslatedDesc(
          dData.translatedText || saree.description
        );

      } catch (err) {
        console.error(
          "[ProductDetail] Translation error:",
          err
        );
      } finally {
        setIsTranslating(false);
      }
    };

    fetchTranslations();
  }, [language, saree]);

  // =========================================================
  // LIKE
  // =========================================================
  const handleToggleLike = async () => {
    if (!token) {
      return alert("Please login to like this product!");
    }

    const wasLiked = isLiked;

    // Optimistic UI
    setIsLiked(!wasLiked);

    setLikesCount(prev =>
      wasLiked ? prev - 1 : prev + 1
    );

    try {
      // IMPORTANT:
      // "products" removed from API URL
      const response = await fetch(
        `${API_BASE_URL}/api/${id}/like`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!data.success) {
        throw new Error("Failed to toggle like");
      }

    } catch (error) {
      console.error(
        "[ProductDetail] Like error:",
        error
      );

      // Rollback optimistic update
      setIsLiked(wasLiked);

      setLikesCount(prev =>
        wasLiked ? prev + 1 : prev - 1
      );
    }
  };

  // =========================================================
  // COMMENT SUBMIT
  // =========================================================
  const handleCommentSubmit = async (e) => {
    e.preventDefault();

    if (!newComment.trim()) return;

    if (!token) {
      return alert("Please login to post a comment!");
    }

    setIsSubmittingComment(true);

    try {
      // IMPORTANT:
      // "products" removed from API URL
      const res = await fetch(
        `${API_BASE_URL}/api/${id}/comments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            comment_text: newComment
          })
        }
      );

      const data = await res.json();

      if (data.success) {
        setComments(prev => [
          data.comment,
          ...prev
        ]);

        setNewComment('');

      } else {
        alert(data.message);
      }

    } catch (error) {
      console.error(
        "[ProductDetail] Comment error:",
        error
      );

      alert("Failed to post comment.");

    } finally {
      setIsSubmittingComment(false);
    }
  };

  // =========================================================
  // IMAGE ZOOM
  // =========================================================
  const handleMouseMove = (e) => {
    const image = e.currentTarget;

    const {
      left,
      top,
      width,
      height
    } = image.getBoundingClientRect();

    const x =
      ((e.clientX - left) / width) * 100;

    const y =
      ((e.clientY - top) / height) * 100;

    setZoomStyle({
      transformOrigin: `${x}% ${y}%`,
      transform: 'scale(2)'
    });
  };

  const handleMouseLeave = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  // =========================================================
  // OPEN LIGHTBOX
  // =========================================================
  const handleOpenLightbox = () => {
    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });

    setIsLightboxOpen(true);
  };

  // =========================================================
  // CLOSE LIGHTBOX
  // =========================================================
  const handleCloseLightbox = () => {
    setIsLightboxOpen(false);

    setZoomStyle({
      transformOrigin: 'center center',
      transform: 'scale(1)'
    });
  };

  // =========================================================
  // CLOSE LIGHTBOX WITH ESC
  // =========================================================
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        handleCloseLightbox();
      }
    };

    if (isLightboxOpen) {
      document.addEventListener(
        'keydown',
        handleEscape
      );

      // Prevent background page scrolling
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener(
        'keydown',
        handleEscape
      );

      document.body.style.overflow = '';
    };
  }, [isLightboxOpen]);

  // =========================================================
  // STOCK
  // =========================================================
  const stockQty =
    saree?.stock_qty ??
    saree?.quantity ??
    null;

  const isOutOfStock =
    stockQty !== null
      ? stockQty <= 0
      : saree?.in_stock === false;

  // =========================================================
  // QUANTITY
  // =========================================================
  const handleQtyChange = (type) => {
    if (type === 'inc') {
      if (
        stockQty !== null &&
        quantity >= stockQty
      ) {
        return;
      }

      setQuantity(prev => prev + 1);

    } else if (type === 'dec') {
      if (quantity > 1) {
        setQuantity(prev => prev - 1);
      }
    }
  };

  // =========================================================
  // ADD TO CART
  // =========================================================
  const handleAddToCart = async (sareeId) => {
    if (isOutOfStock) return;

    if (!token) {
      return alert("Please login to add product to cart!");
    }

    setIsAdding(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/cart/add`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            product_id: sareeId,
            quantity: quantity
          })
        }
      );

      if (response.ok) {
        alert(
          `Added ${quantity} item(s) to cart!`
        );
      } else {
        alert("Could not add item to cart.");
      }

    } catch (error) {
      console.error(
        "[ProductDetail] Cart error:",
        error
      );

      alert("Could not add item to cart.");

    } finally {
      setIsAdding(false);
    }
  };

  // =========================================================
  // BUY NOW
  // =========================================================
  const handleBuyNow = () => {
    if (!saree || isOutOfStock) return;

    navigate('/add-address', {
      state: {
        buyNowProduct: {
          product_id: saree.product_id,
          name: saree.name,
          price: saree.price,
          quantity: quantity,
          image_url: saree.image_url
        }
      }
    });
  };

  // =========================================================
  // WHATSAPP
  // =========================================================
  const handleWhatsAppInquiry = () => {
    if (!saree) return;

    const message =
      `Hello! I am interested in VIP Booking.\n\n` +
      `*Product:* ${saree.name}\n` +
      `*Quantity:* ${quantity}\n` +
      `*Price:* ${currency} ${getConvertedPrice(saree.price)}\n` +
      `*Link:* ${window.location.href}`;

    const encodedMessage =
      encodeURIComponent(message);

    window.open(
      `${API_BASE_URL}/api/whatsapp/redirect?text=${encodedMessage}`,
      "_blank",
      "noopener,noreferrer"
    );
  };

  // =========================================================
  // PRICE CONVERSION
  // =========================================================
  const getConvertedPrice = (basePrice) => {
    if (
      currency === 'INR' ||
      !rates ||
      !rates[currency]
    ) {
      return basePrice;
    }

    return (
      basePrice * rates[currency].rate
    ).toFixed(2);
  };

  // =========================================================
  // IMAGES
  // =========================================================
  const sliderImages =
    saree?.images &&
    Array.isArray(saree.images) &&
    saree.images.length > 0
      ? saree.images
      : [
          saree?.image_url ||
          "/saare_1.jpeg"
        ];

  // =========================================================
  // LOADING
  // =========================================================
  if (loading) {
    return (
      <div className="main-container">
        <h2>
          Loading product details...
        </h2>
      </div>
    );
  }

  // =========================================================
  // PRODUCT NOT FOUND
  // =========================================================
  if (!saree) {
    return (
      <div className="main-container">
        <h2>
          Product not found!
        </h2>
      </div>
    );
  }

  // =========================================================
  // FINER DETAILS
  // =========================================================
  const finerDetails = Object.entries(
    DETAIL_FIELD_LABELS
  )
    .filter(
      ([field]) =>
        saree[field] !== null &&
        saree[field] !== undefined &&
        saree[field] !== '' &&
        saree[field] !== 'null'
    )
    .map(
      ([field, label]) => ({
        label,
        value: saree[field]
      })
    );

  // =========================================================
  // CURRENT IMAGE URL
  // =========================================================
  const currentImageUrl = getImageUrl(
    sliderImages[activeImageIdx]
  );

  return (
    <div className="product-detail-page">

      <div className="main-container">

        <div className="details-container">

          {/* =================================================
              LEFT COLUMN
          ================================================= */}
          <div className="gallery-section">

            {/* MAIN IMAGE */}
            <div
              className="main-image-wrapper"
              onClick={handleOpenLightbox}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (
                  e.key === 'Enter' ||
                  e.key === ' '
                ) {
                  e.preventDefault();
                  handleOpenLightbox();
                }
              }}
              aria-label="Open product image"
            >

              <img
                src={currentImageUrl}
                alt={saree.name}
                className="main-image zoomable-image"
                style={zoomStyle}

                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}

                onError={(e) => {
                  if (
                    e.currentTarget.src.includes(
                      "/saare_1.jpeg"
                    )
                  ) {
                    return;
                  }

                  e.currentTarget.src =
                    "/saare_1.jpeg";
                }}

                draggable="false"
              />

              {isOutOfStock && (
                <span className="sold-out-badge">
                  Sold Out
                </span>
              )}

              {/* Image click hint */}
              <div className="image-zoom-hint">
                Click to view
              </div>

            </div>

            {/* =================================================
                SOCIAL ACTION BAR
            ================================================= */}
            <div className="social-action-bar">

              {/* LIKE */}
              <button
                type="button"
                className={`social-btn ${
                  isLiked ? 'liked' : ''
                }`}
                onClick={handleToggleLike}
                aria-label={
                  isLiked
                    ? "Unlike product"
                    : "Like product"
                }
              >
                {isLiked ? '❤️' : '🤍'}
              </button>

              {/* COMMENTS */}
              <button
                type="button"
                className="social-btn"
                onClick={() =>
                  setShowComments(
                    prev => !prev
                  )
                }
                aria-label="Comments"
              >
                💬
              </button>

              {/* WHATSAPP */}
              <button
                type="button"
                className="social-btn whatsapp-btn"
                onClick={
                  handleWhatsAppInquiry
                }
                aria-label="Contact on WhatsApp"
                title="Contact on WhatsApp"
              >

                {/* WhatsApp SVG */}
                <svg
                  className="whatsapp-icon"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    d="M20.52 3.48A11.84 11.84 0 0 0 12.08 0C5.53 0 .2 5.33.2 11.88c0 2.09.55 4.13 1.59 5.93L.1 24l6.33-1.66a11.88 11.88 0 0 0 5.65 1.43h.01c6.55 0 11.88-5.33 11.88-11.88 0-3.18-1.24-6.16-3.45-8.41ZM12.09 21.8h-.01a9.86 9.86 0 0 1-5.03-1.38l-.36-.21-3.75.98 1-3.65-.23-.38a9.83 9.83 0 0 1-1.51-5.28C2.2 6.45 6.63 2.02 12.08 2.02c2.64 0 5.12 1.03 6.98 2.9a9.8 9.8 0 0 1 2.89 6.98c0 5.45-4.43 9.9-9.86 9.9Zm5.42-7.42c-.3-.15-1.78-.88-2.05-.98-.27-.1-.47-.15-.67.15-.2.3-.77.98-.94 1.18-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.47-.89-.79-1.49-1.76-1.66-2.06-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.49 0 1.47 1.07 2.89 1.22 3.09.15.2 2.1 3.2 5.09 4.49.71.31 1.26.5 1.69.64.71.23 1.36.2 1.87.12.57-.08 1.78-.73 2.03-1.43.25-.7.25-1.3.17-1.43-.08-.13-.27-.2-.57-.35Z"
                  />
                </svg>

              </button>

            </div>

            {/* LIKES */}
            <div className="likes-count">
              <strong>
                {likesCount}{' '}
                {likesCount === 1
                  ? 'like'
                  : 'likes'}
              </strong>
            </div>

            {/* =================================================
                INLINE COMMENTS
            ================================================= */}
            {showComments && (
              <div className="inline-comments-section">

                <div className="inline-comments-list">

                  {comments.length === 0 ? (
                    <p className="no-comments-inline">
                      No comments yet. Be the first!
                    </p>
                  ) : (
                    comments.map(c => (
                      <div
                        key={c.comment_id}
                        className="inline-comment-item"
                      >
                        <strong>
                          {c.user_name}
                        </strong>{' '}
                        {c.comment_text}
                      </div>
                    ))
                  )}

                </div>

                <form
                  onSubmit={
                    handleCommentSubmit
                  }
                  className="inline-comment-form"
                >

                  <input
                    type="text"
                    placeholder="Add a comment..."
                    value={newComment}
                    onChange={(e) =>
                      setNewComment(
                        e.target.value
                      )
                    }
                    className="inline-comment-input"
                  />

                  <button
                    type="submit"
                    disabled={
                      isSubmittingComment ||
                      !newComment.trim()
                    }
                    className="inline-comment-post"
                  >
                    {isSubmittingComment
                      ? "Posting..."
                      : "Post"}
                  </button>

                </form>

              </div>
            )}

            {/* =================================================
                THUMBNAILS
            ================================================= */}
            {sliderImages.length > 1 && (
              <div className="thumbnail-row">

                {sliderImages.map(
                  (img, idx) => (
                    <img
                      key={idx}
                      src={getImageUrl(img)}
                      alt={`Thumbnail ${idx + 1}`}
                      className={`thumbnail ${
                        activeImageIdx === idx
                          ? 'thumbnail-active'
                          : ''
                      }`}
                      onClick={() =>
                        setActiveImageIdx(idx)
                      }
                      onError={(e) => {
                        e.currentTarget.src =
                          "/saare_1.jpeg";
                      }}
                      draggable="false"
                    />
                  )
                )}

              </div>
            )}

          </div>

          {/* =================================================
              RIGHT COLUMN
          ================================================= */}
          <div className="info-box">

            <h1 className="product-title">
              {isTranslating
                ? "Translating..."
                : translatedName}
            </h1>

            <h2 className="product-price">
              {currency}{' '}
              {getConvertedPrice(
                saree.price
              )}
            </h2>

            <span
              className={`stock-badge ${
                isOutOfStock
                  ? 'out-of-stock'
                  : 'in-stock'
              }`}
            >
              {isOutOfStock
                ? 'Sold Out'
                : stockQty
                  ? `In Stock (${stockQty} left)`
                  : 'In Stock'}
            </span>

            {translatedDesc && (
              <p className="product-desc">
                {isTranslating
                  ? "Translating details..."
                  : translatedDesc}
              </p>
            )}

            {/* QUANTITY */}
            <div className="quantity-selector-container">

              <span className="qty-label">
                Quantity:
              </span>

              <div className="quantity-controls">

                <button
                  type="button"
                  className="qty-btn"
                  onClick={() =>
                    handleQtyChange('dec')
                  }
                >
                  -
                </button>

                <span className="qty-display">
                  {quantity}
                </span>

                <button
                  type="button"
                  className="qty-btn"
                  onClick={() =>
                    handleQtyChange('inc')
                  }
                  disabled={
                    stockQty !== null &&
                    quantity >= stockQty
                  }
                >
                  +
                </button>

              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="action-buttons-row">

              <button
                onClick={() =>
                  handleAddToCart(
                    saree.product_id
                  )
                }
                disabled={
                  isAdding ||
                  isOutOfStock
                }
                className="add-to-cart-btn"
              >
                {isOutOfStock
                  ? "Sold Out"
                  : isAdding
                    ? "Adding..."
                    : "Add to Cart"}
              </button>

              <button
                onClick={handleBuyNow}
                disabled={isOutOfStock}
                className="buy-now-btn"
              >
                {isOutOfStock
                  ? "Sold Out"
                  : "Buy Now"}
              </button>

            </div>

            {/* FINER DETAILS */}
            {finerDetails.length > 0 && (
              <div className="finer-details">

                <h3 className="finer-details-title">
                  The Finer Details
                </h3>

                <ul className="finer-details-list">

                  {finerDetails.map(
                    (row, index) => (
                      <li key={index}>

                        <span className="finer-label">
                          {row.label}:
                        </span>

                        <span className="finer-value">
                          {row.value}
                        </span>

                      </li>
                    )
                  )}

                </ul>

              </div>
            )}

          </div>

        </div>

      </div>

      {/* =====================================================
          REVIEWS
      ===================================================== */}
      <div className="full-width-review-section">

        <div className="review-inner-container">

          <div className="review-form-container">

            <ReviewForm
              productId={
                saree.product_id
              }
              onReviewAdded={() =>
                setRefreshReviews(
                  prev => prev + 1
                )
              }
            />

          </div>

          <ReviewSection
            productId={
              saree.product_id
            }
            key={refreshReviews}
          />

          <Recommended
            currentProductId={
              saree.product_id
            }
            categoryId={
              saree.category_id
            }
            subcategoryId={
              saree.subcategory_id
            }
          />

        </div>

      </div>

      {/* =====================================================
          LIGHTBOX
      ===================================================== */}
      {isLightboxOpen && (
        <div
          className="lightbox-overlay"
          onClick={handleCloseLightbox}
          role="dialog"
          aria-modal="true"
          aria-label="Product image preview"
        >

          <button
            type="button"
            className="lightbox-close-btn"
            onClick={handleCloseLightbox}
            aria-label="Close image"
          >
            ✕
          </button>

          <img
            src={currentImageUrl}
            alt={saree.name}
            className="lightbox-image"
            onClick={(e) =>
              e.stopPropagation()
            }
            onError={(e) => {
              if (
                !e.currentTarget.src.includes(
                  "/saare_1.jpeg"
                )
              ) {
                e.currentTarget.src =
                  "/saare_1.jpeg";
              }
            }}
            draggable="false"
          />

        </div>
      )}

    </div>
  );
}

export default ProductDetail;