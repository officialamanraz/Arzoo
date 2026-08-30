import React, { useState } from "react";
import './ReviewForm.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Helper to format dynamic options (e.g., "go_for_it" -> "Go For It")
const formatLabel = (str) => {
  if (!str) return "";
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const ReviewForm = ({ productId, onReviewAdded, availableOptions = [] }) => {
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false); // 🚨 Added loading state

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!rating) {
      return alert("Please select a rating before submitting!");
    }

    setIsSubmitting(true);
    const formData = new FormData();
    formData.append("product_id", productId);
    formData.append("rating_type", rating);
    formData.append("comment", comment);
    if (image) formData.append("image", image);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/reviews/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` }, // Token is critical for user_id
        body: formData,
      });

      const data = await response.json();

      if (data.success) {
        alert("Review added successfully!");
        setRating("");
        setComment("");
        setImage(null);
        // Reset file input visually
        document.getElementById('review-image-upload').value = '';
        if (onReviewAdded) onReviewAdded(); // Refresh parent component
      } else {
        alert(data.message || "Failed to add review.");
      }
    } catch (error) {
      console.error("[ReviewForm] Network error during submission:", error);
      alert("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🚨 Dynamic Check: Wait for backend options to load
  if (!availableOptions || availableOptions.length === 0) {
    return (
      <div className="review-form-wrapper loading-wrapper">
        <p>Loading review options...</p>
      </div>
    );
  }

  return (
    <div className="review-form-wrapper">
      <h3 className="review-form-title">Share Your Opinion</h3>
      
      <form onSubmit={handleSubmit} className="review-form">
        {/* Dynamic Rating Buttons */}
        <div className="rating-section">
          <p className="rating-label">How would you rate this product?</p>
          <div className="rating-buttons-container">
            {availableOptions.map((optionId) => (
              <button
                key={optionId}
                type="button"
                onClick={() => setRating(optionId)}
                className={`rating-btn ${rating === optionId ? 'rating-btn-active' : ''}`}
              >
                {formatLabel(optionId)}
              </button>
            ))}
          </div>
        </div>

        {/* Comment Input */}
        <div className="input-group">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="review-textarea"
            maxLength={500}
            required
          />
          <p className="char-counter">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Image Upload */}
        <div className="input-group file-upload-group">
          <label htmlFor="review-image-upload" className="upload-label">
            📸 Upload Image <span className="optional-text">(Optional - Verified Buyers Only)</span>
          </label>
          <input
            id="review-image-upload"
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            accept="image/*"
            className="file-input"
          />
          {image && <p className="file-success-msg">✅ {image.name} selected</p>}
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          className="review-submit-btn" 
          disabled={isSubmitting}
        >
          {isSubmitting ? "Posting Review..." : "Post Review"}
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;