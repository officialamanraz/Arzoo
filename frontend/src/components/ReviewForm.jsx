import React, { useState } from "react";
import './ReviewForm.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ReviewForm = ({ productId, onReviewAdded, availableOptions = [] }) => {
  const [rating, setRating] = useState("");
  const [comment, setComment] = useState("");
  const [image, setImage] = useState(null);

  // FALLBACK: If availableOptions is empty (e.g., 0 reviews or loading), use default schema keys
  const optionsToRender = availableOptions.length > 0 
    ? availableOptions 
    : ["skip", "timepass", "go_for_it", "perfection"];

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('[ReviewForm] Submitting review...');
    
    if (!rating) {
      console.warn('[ReviewForm] Rating is missing.');
      return alert("Please select a rating!");
    }

    const formData = new FormData();
    formData.append("product_id", productId);
    formData.append("rating_type", rating);
    formData.append("comment", comment);
    if (image) formData.append("image", image);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/api/reviews/add`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      console.log('[ReviewForm] Response from server:', data);

      if (data.success) {
        alert("Review added successfully!");
        setRating("");
        setComment("");
        setImage(null);
        if (onReviewAdded) onReviewAdded();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("[ReviewForm] Network error during submission:", error);
    }
  };

  return (
    <div className="review-form-wrapper">
      <h3 className="review-form-title">Share Your Opinion</h3>
      
      {/* Rating Buttons */}
      <div className="rating-section">
        <p className="rating-label">How would you rate this product?</p>
        <div className="rating-buttons-container">
          {optionsToRender.map((optionId) => (
            <button
              key={optionId}
              type="button"
              onClick={() => {
                console.log(`[ReviewForm] Selected rating: ${optionId}`);
                setRating(optionId);
              }}
              className={`rating-btn ${rating === optionId ? 'rating-btn-active' : ''}`}
            >
              {optionId.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit}>
        <div className="input-group">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            className="review-textarea"
            maxLength={500}
          />
          <p className="char-counter">
            {comment.length}/500 characters
          </p>
        </div>

        {/* Image Upload */}
        <div className="input-group">
          <label className="upload-label">
            📸 Upload Image (Optional - Verified Buyers Only)
          </label>
          <input
            type="file"
            onChange={(e) => {
              console.log('[ReviewForm] Image selected:', e.target.files[0]?.name);
              setImage(e.target.files[0]);
            }}
            accept="image/*"
            className="file-input"
          />
          {image && <p className="file-success-msg">✅ {image.name}</p>}
        </div>

        {/* Submit Button */}
        <button type="submit" className="review-submit-btn">
          Post Review
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;