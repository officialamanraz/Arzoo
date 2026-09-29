import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getImageUrl } from "../getImageUrl";
import { FaArrowLeft } from "react-icons/fa";
import "./ReviewsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const OPINION_OPTIONS = [
  { id: "skip", label: "Skip", colorClass: "color-red", hex: "#ef4444" },
  { id: "timepass", label: "Timepass", colorClass: "color-yellow", hex: "#f59e0b" },
  { id: "go_for_it", label: "Go For It", colorClass: "color-blue", hex: "#3b82f6" },
  { id: "perfection", label: "Perfection", colorClass: "color-green", hex: "#22c55e" }
];

const formatLabel = (str) => {
  if (!str) return "Rating";
  return str.split("_").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
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

const ProductReviewsPage = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);

  // Form states
  const [ratingType, setRatingType] = useState("go_for_it");
  const [comment, setComment] = useState("");
  const [reviewImage, setReviewImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem("token");

  // Fetch Product Details
  const fetchProduct = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/products/product/${productId}`);
      const data = await res.json();
      if (data?.data) setProduct(data.data);
    } catch (err) {
      console.error("[ProductReviewsPage] Error fetching product:", err);
    }
  };

  // Fetch Reviews & Stats (Aapka exact logic)
  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
      const data = await response.json();
      if (data.success) {
        setReviews(data.reviews || []);
        setStats(data.stats || {});
        setTotalReviews(data.totalReviews || 0);
      }
    } catch (error) {
      console.error("[ProductReviewsPage] Error fetching reviews:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchProduct();
      fetchReviews();
    }
  }, [productId]);

  // Submit Review Handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please login to write a review!");
      return;
    }
    if (!comment.trim()) {
      alert("Please write your comment.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("rating_type", ratingType);
      formData.append("comment", comment);
      if (reviewImage) formData.append("image", reviewImage);

      const response = await fetch(`${API_BASE_URL}/api/reviews/${productId}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        alert("Review posted successfully!");
        setComment("");
        setReviewImage(null);
        fetchReviews(); // Refresh stats & list
      } else {
        alert(data.message || "Failed to post review");
      }
    } catch (err) {
      console.error("Submit error:", err);
      alert("Something went wrong while submitting.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete Review Handler (Aapka exact logic)
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
        fetchReviews();
      } else {
        alert(data.message || "Failed to delete");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // Gauge Meter Calculations
  const getPct = (key) => (totalReviews > 0 ? Math.round(((stats[key] || 0) / totalReviews) * 100) : 0);
  const highestVotes = Math.max(
    stats.skip || 0,
    stats.timepass || 0,
    stats.go_for_it || 0,
    stats.perfection || 0
  );
  const dominantPercent = totalReviews > 0 ? Math.round((highestVotes / totalReviews) * 100) : 0;

  if (loading) return <div className="page-loader">Loading reviews...</div>;

  return (
    <div className="all-reviews-page">
      <div className="all-reviews-wrapper">
        
        {/* Back Button */}
        <button className="back-link-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Product
        </button>

        {product && <h1 className="reviews-product-name">{product.name}</h1>}

        {/* 🌟 1. MOCTALE STYLE SEMI-CIRCULAR METER 🌟 */}
        <div className="meter-card-container">
          <h2 className="meter-heading">Reviews Meter</h2>

          <div className="semi-gauge-box">
            <svg viewBox="0 0 200 115" className="semi-gauge-svg">
              {/* Background Track */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* Active Progress Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#3b82f6"
                strokeWidth="14"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * dominantPercent) / 100}
                style={{ transition: "stroke-dashoffset 0.8s ease" }}
              />
            </svg>
            <div className="semi-gauge-text">
              <span className="gauge-pct">{dominantPercent}%</span>
              <span className="gauge-sub">{highestVotes}/{totalReviews} Votes</span>
            </div>
          </div>

          {/* Meter Breakdown Dots */}
          <div className="meter-pills-row">
            {OPINION_OPTIONS.map((item) => (
              <div key={item.id} className="meter-dot-item">
                <span className="meter-dot" style={{ backgroundColor: item.hex }} />
                <span className="meter-dot-label">{item.label}</span>
                <span className="meter-dot-val">{getPct(item.id)}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 2. WRITE A REVIEW SECTION (4 Buttons) 🌟 */}
        <div className="write-review-panel">
          <h3 className="write-review-title">Write a Review</h3>

          <form onSubmit={handleSubmitReview} className="write-review-form">
            {/* 4 Interactive Choice Buttons */}
            <div className="choice-buttons-group">
              {OPINION_OPTIONS.map((item) => {
                const isSelected = ratingType === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRatingType(item.id)}
                    className={`opinion-pill-btn ${isSelected ? "selected" : ""}`}
                    style={{
                      borderColor: item.hex,
                      backgroundColor: isSelected ? item.hex : "#ffffff",
                      color: isSelected ? "#ffffff" : "#333333",
                    }}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Comment Text Area */}
            <textarea
              className="review-input-textarea"
              rows="3"
              placeholder="Share your thoughts about this product..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              required
            />

            {/* Optional Customer Image Upload */}
            <div className="review-file-upload">
              <label htmlFor="rev-img-input" className="file-upload-label">
                📷 Add Photo (Optional)
              </label>
              <input
                id="rev-img-input"
                type="file"
                accept="image/*"
                onChange={(e) => setReviewImage(e.target.files[0])}
                style={{ display: "none" }}
              />
              {reviewImage && <span className="selected-filename">{reviewImage.name}</span>}
            </div>

            <button type="submit" disabled={isSubmitting} className="submit-opinion-btn">
              {isSubmitting ? "Submitting..." : "Post Review"}
            </button>
          </form>
        </div>

        {/* 🌟 3. AAPKI PURANI REVIEWS LIST (Exact Classes Ke Sath) 🌟 */}
        <div className="review-section-container">
          <h2 className="review-section-title">Customer Reviews</h2>
          <p className="total-reviews-text">Total Reviews: {totalReviews}</p>

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

                    <div className="review-body-left">
                      <span className={`rating-badge ${colorClass}`}>{label}</span>
                      <p className="review-comment">{review.comment}</p>

                      {review.image_url && (
                        <div className="review-image-wrapper">
                          <img src={getImageUrl(review.image_url)} alt="User Review" className="review-image" loading="lazy" />
                        </div>
                      )}
                    </div>

                    <div className="review-footer-actions">
                      <button onClick={() => handleDelete(review.review_id)} className="delete-review-btn">
                        🗑️ Delete Review
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProductReviewsPage;