import React, { useEffect, useState } from "react";
import { getImageUrl } from '../getImageUrl';
import './ReviewSection.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const formatLabel = (str) => {
  if (!str) return "Rating";
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const getBadgeStyle = (ratingType, index) => {
  const predefined = {
    skip: "color-red",
    timepass: "color-yellow",
    go_for_it: "color-blue",
    perfection: "color-green",
  };
  if (predefined[ratingType]) return predefined[ratingType];
  const fallbackColors = ["color-purple", "color-teal", "color-orange", "color-pink"];
  return fallbackColors[index % fallbackColors.length] || "color-gray";
};

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);

  // Current logged-in user ki ID nikalne ke liye (JWT token se decode ya localStorage se agar saved hai)
  // Hum backend se aane wale review.user_id ko comparison ke liye use kar sakte hain agar token me ID hai.
  const token = localStorage.getItem("token");

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
        setTotalReviews(data.totalReviews);
      }
    } catch (error) {
      console.error("[ReviewSection] Error fetching reviews:", error);
    }
  };

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
        fetchReviews(); // Refresh list
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  useEffect(() => {
    if (productId) fetchReviews();
  }, [productId]);

  return (
    <div className="review-section-container">
      <h2 className="review-section-title">Customer Reviews</h2>
      <p className="total-reviews-text">Total Reviews: {totalReviews}</p>

      {/* Stats Progress Bars */}
      <div className="stats-container">
        {Object.keys(stats || {}).map((optionId, index) => {
          const votes = stats[optionId] || 0;
          const percentage = totalReviews > 0 ? (votes / totalReviews) * 100 : 0;
          const colorClass = getBadgeStyle(optionId, index);
          const label = formatLabel(optionId);

          return (
            <div key={optionId} className="progress-row">
              <div className="progress-label-container">
                <span className="progress-label">{label}</span>
                <span className="progress-value">{votes} vote(s) ({percentage.toFixed(0)}%)</span>
              </div>
              <div className="progress-track">
                <div className={`progress-fill ${colorClass}`} style={{ width: `${percentage}%` }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews-text">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review, index) => {
            const colorClass = getBadgeStyle(review.rating_type, index);
            const label = formatLabel(review.rating_type);

            return (
              <div key={review.review_id} className="review-card">
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong className="reviewer-name">{review.user_name}</strong>
                    {(review.is_verified_buyer === 1 || review.is_verified_buyer === true) && (
                      <span className="verified-badge">✅ Verified Buyer</span>
                    )}
                  </div>
                  <span className="review-date">{new Date(review.created_at).toLocaleDateString()}</span>
                </div>

                {/* 🚨 LEFT ALIGNED BADGE, COMMENT & IMAGE CONTAINER */}
                <div className="review-body-left">
                  <span className={`rating-badge ${colorClass}`}>{label}</span>
                  <p className="review-comment">{review.comment}</p>

                  {review.image_url && (
                    <div className="review-image-wrapper">
                      <img src={getImageUrl(review.image_url)} alt="User Review" className="review-image" loading="lazy" />
                    </div>
                  )}
                </div>

                {/* Delete Button */}
                <div className="review-footer-actions">
                  <button 
                    onClick={() => handleDelete(review.review_id)} 
                    className="delete-review-btn"
                  >
                    🗑️ Delete Review
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewSection;