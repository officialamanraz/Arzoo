import React, { useEffect, useState } from "react";
import './ReviewSection.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Dynamic style definitions mapped to your backend rating fields
const OPTION_UI_CONFIG = {
  skip: { label: "Skip It", colorClass: "color-red" },
  timepass: { label: "Timepass", colorClass: "color-yellow" },
  go_for_it: { label: "Go For It", colorClass: "color-blue" },
  perfection: { label: "Perfection!", colorClass: "color-green" },
};

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = async () => {
    console.log(`[ReviewSection] Fetching reviews for product ID: ${productId}`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
      const data = await response.json();
      console.log('[ReviewSection] Received review data:', data);

      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
        setTotalReviews(data.totalReviews);
      }
    } catch (error) {
      console.error("[ReviewSection] Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  return (
    <div className="review-section-container">
      <h2 className="review-section-title">Customer Reviews</h2>
      <p className="total-reviews-text">Total Reviews: {totalReviews}</p>

      {/* ============================== */}
      {/* 1. DYNAMIC PROGRESS BARS       */}
      {/* ============================== */}
      <div className="stats-container">
        {Object.keys(stats || {}).map((optionId) => {
          const votes = stats[optionId] || 0;
          const percentage = totalReviews > 0 ? (votes / totalReviews) * 100 : 0;
          
          // Safe lookup matching config properties directly to your dataset keys
          const uiConfig = OPTION_UI_CONFIG[optionId] || { 
            label: optionId.replace(/_/g, " "), 
            colorClass: "color-gray" 
          };

          return (
            <div key={optionId} className="progress-row">
              <div className="progress-label-container">
                <span className="progress-label">{uiConfig.label}</span>
                <span className="progress-value">
                  {votes} vote(s) ({percentage.toFixed(0)}%)
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="progress-track">
                {/* Progress Bar Fill */}
                <div
                  className={`progress-fill ${uiConfig.colorClass}`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <div className="reviews-list">
        {reviews.length === 0 ? (
          <p className="no-reviews-text">No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => {
            // Resolves lookups on the fly using your schema values directly
            const uiConfig = OPTION_UI_CONFIG[review.rating_type] || {
              label: review.rating_type ? review.rating_type.replace(/_/g, " ") : "Rating",
              colorClass: "color-gray",
            };

            return (
              <div key={review.review_id} className="review-card">
                
                {/* Header (Name, Badge, Date) */}
                <div className="review-header">
                  <div className="reviewer-info">
                    <strong className="reviewer-name">{review.user_name}</strong>
                    
                    {(review.is_verified_buyer === 1 || review.is_verified_buyer === true) && (
                      <span className="verified-badge">
                        ✅ Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="review-date">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Rating Badge */}
                <span className={`rating-badge ${uiConfig.colorClass}`}>
                  {uiConfig.label}
                </span>

                {/* Comment */}
                <p className="review-comment">{review.comment}</p>

                {/* Image (If uploaded) */}
                {review.image_url && (
                  <img
                    src={`${API_BASE_URL}/uploads/${review.image_url}`}
                    alt="User Review"
                    className="review-image"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewSection;