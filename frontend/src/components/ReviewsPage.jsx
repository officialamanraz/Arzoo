import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import "./ReviewsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

// Fail-safe image resolver
const resolveImage = (url) => {
  if (!url) return "";
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

// Dynamic label formatting from database keys (e.g. go_for_it -> Go For It)
const formatLabel = (str) => {
  if (!str) return "Rating";
  return str.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

// Dynamic color assignment with fallback palette
const FALLBACK_PALETTE = ["#ef4444", "#f59e0b", "#3b82f6", "#22c55e", "#8b5cf6", "#14b8a6", "#f97316", "#ec4899"];

const getColorForOption = (optionKey, index = 0) => {
  const map = {
    skip: "#ef4444",
    timepass: "#f59e0b",
    go_for_it: "#3b82f6",
    perfection: "#22c55e"
  };
  return map[optionKey?.toLowerCase()] || FALLBACK_PALETTE[index % FALLBACK_PALETTE.length];
};

// Individual review card with dynamic height & "See More" logic
const ReviewCardItem = ({ review, index, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const commentText = review.comment || "";
  const isLong = commentText.length > 180;
  const color = getColorForOption(review.rating_type, index);

  return (
    <div className="review-card-item">
      <div className="review-card-header">
        <div className="reviewer-meta">
          <strong className="reviewer-name">{review.user_name || "Customer"}</strong>
          {(review.is_verified_buyer === 1 || review.is_verified_buyer === true) && (
            <span className="verified-buyer-badge">✅ Verified Buyer</span>
          )}
        </div>
        <span className="review-post-date">
          {review.created_at ? new Date(review.created_at).toLocaleDateString() : ""}
        </span>
      </div>

      <div className="review-card-body">
        {review.rating_type && (
          <span className="review-opinion-badge" style={{ backgroundColor: color }}>
            {formatLabel(review.rating_type)}
          </span>
        )}

        <p className="review-text-content">
          {isLong && !isExpanded ? `${commentText.slice(0, 180)}...` : commentText}
          {isLong && (
            <button
              type="button"
              className="see-more-toggle-btn"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "See more"}
            </button>
          )}
        </p>

        {review.image_url && (
          <div className="review-img-box">
            <img
              src={resolveImage(review.image_url)}
              alt="User Review Saree"
              className="review-user-image"
              loading="lazy"
            />
          </div>
        )}
      </div>

      <div className="review-card-actions">
        <button type="button" onClick={() => onDelete(review.review_id)} className="delete-btn">
          🗑️ Delete Review
        </button>
      </div>
    </div>
  );
};

const ProductReviewsPage = () => {
  const params = useParams();
  const productId = params.id || params.productId;
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");

  const fetchData = async () => {
    if (!productId) return;
    try {
      setLoading(true);

      // 1. Fetch Product Data
      try {
        const prodRes = await fetch(`${API_BASE_URL}/api/products/product/${productId}`);
        const prodData = await prodRes.json();
        if (prodData?.data) setProduct(prodData.data);
      } catch (err) {
        console.warn("[ReviewsPage] Product fetch failed:", err);
      }

      // 2. Fetch Reviews and DB Stats
      const revRes = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
      const revData = await revRes.json();
      if (revData && revData.success) {
        setReviews(revData.reviews || []);
        setStats(revData.stats || {});
        setTotalReviews(revData.totalReviews || (revData.reviews ? revData.reviews.length : 0));
      }
    } catch (err) {
      console.error("[ReviewsPage] Error loading data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [productId]);

  const handleDelete = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) return;
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (data.success) {
        alert("Review deleted!");
        fetchData();
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Dynamically extract options straight from backend database stats
  const dynamicOptionKeys = Object.keys(stats || {});

  // Find dominant percentage & dominant option dynamically
  let dominantPercent = 0;
  let dominantVotes = 0;
  let dominantColor = "#3b82f6";

  if (totalReviews > 0 && dynamicOptionKeys.length > 0) {
    dynamicOptionKeys.forEach((key, idx) => {
      const votes = stats[key] || 0;
      if (votes >= dominantVotes) {
        dominantVotes = votes;
        dominantPercent = Math.round((votes / totalReviews) * 100);
        dominantColor = getColorForOption(key, idx);
      }
    });
  }

  if (loading) {
    return (
      <div className="all-reviews-page">
        <div className="reviews-page-loader">Loading customer reviews...</div>
      </div>
    );
  }

  return (
    <div className="all-reviews-page">
      <div className="all-reviews-wrapper">
        
        {/* Top Back Navigation */}
        <button type="button" className="back-link-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Product
        </button>

        <h1 className="reviews-page-heading">{product?.name || "Product Reviews"}</h1>

        {/* 🌟 1. DYNAMIC REVIEWS METER (Data directly from DB stats) 🌟 */}
        <div className="dynamic-meter-box">
          <h2 className="meter-title">Reviews Meter</h2>

          <div className="gauge-circle-container">
            <svg viewBox="0 0 200 115" className="gauge-svg">
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="14"
                strokeLinecap="round"
              />
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke={dominantColor}
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * dominantPercent) / 100}
                style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s ease" }}
              />
            </svg>
            <div className="gauge-value-block">
              <span className="gauge-pct-text">{dominantPercent}%</span>
              <span className="gauge-total-votes">{dominantVotes}/{totalReviews} Votes</span>
            </div>
          </div>

          {/* Dynamic DB Stats Legend */}
          <div className="dynamic-legend-row">
            {dynamicOptionKeys.map((key, idx) => {
              const votes = stats[key] || 0;
              const pct = totalReviews > 0 ? Math.round((votes / totalReviews) * 100) : 0;
              const color = getColorForOption(key, idx);

              return (
                <div key={key} className="legend-chip">
                  <span className="legend-chip-dot" style={{ backgroundColor: color }} />
                  <span className="legend-chip-label">{formatLabel(key)}</span>
                  <span className="legend-chip-pct">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🌟 2. LEFT-ALIGNED DYNAMIC REVIEW CARDS STREAM 🌟 */}
        <div className="reviews-stream-section">
          <h2 className="stream-section-title">Customer Reviews</h2>
          <p className="stream-total-subtext">Total Reviews: {totalReviews}</p>

          <div className="reviews-cards-stack">
            {reviews.length === 0 ? (
              <p className="no-reviews-note">No reviews yet for this product.</p>
            ) : (
              reviews.map((rev, index) => (
                <ReviewCardItem
                  key={rev.review_id || index}
                  review={rev}
                  index={index}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductReviewsPage;