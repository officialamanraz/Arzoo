import React, { useState } from "react";

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
    if (!rating) return alert("Please select a rating!");

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
      if (data.success) {
        alert("Review added!");
        setRating("");
        setComment("");
        setImage(null);
        if (onReviewAdded) onReviewAdded();
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '40px auto', padding: '30px', backgroundColor: '#f9f9f9', borderRadius: '12px', border: '1px solid #eee' }}>
      <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '1.3em', color: '#333', textAlign: 'center' }}>Share Your Opinion</h3>
      
      {/* Rating Buttons */}
      <div style={{ marginBottom: '20px' }}>
        <p style={{ marginBottom: '10px', fontWeight: 'bold', color: '#555', textAlign: 'center' }}>How would you rate this product?</p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          {optionsToRender.map((optionId) => (
            <button
              key={optionId}
              type="button"
              onClick={() => setRating(optionId)}
              style={{
                padding: '10px 16px',
                border: rating === optionId ? '2px solid #d63031' : '1px solid #ddd',
                backgroundColor: rating === optionId ? '#ffe5e5' : '#fff',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: rating === optionId ? 'bold' : 'normal',
                color: rating === optionId ? '#d63031' : '#555',
                transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}
            >
              {optionId.replace(/_/g, " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Comment Input */}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Share your experience with this product..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '12px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              fontFamily: 'inherit',
              fontSize: '1em',
              resize: 'none',
              boxSizing: 'border-box'
            }}
          />
          <p style={{ margin: '5px 0 0 0', fontSize: '0.85em', color: '#999' }}>
            {comment.length}/500 characters
          </p>
        </div>

        {/* Image Upload */}
        <div style={{ marginBottom: '15px' }}>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#555' }}>
            📸 Upload Image (Optional - Verified Buyers Only)
          </label>
          <input
            type="file"
            onChange={(e) => setImage(e.target.files[0])}
            accept="image/*"
            style={{
              padding: '8px',
              border: '1px solid #ddd',
              borderRadius: '8px',
              width: '100%',
              boxSizing: 'border-box'
            }}
          />
          {image && <p style={{ margin: '5px 0 0 0', fontSize: '0.9em', color: '#28a745' }}>✅ {image.name}</p>}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          style={{
            width: '100%',
            padding: '12px',
            backgroundColor: '#d63031',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '1em',
            fontWeight: 'bold',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = '#c51f1f'}
          onMouseLeave={(e) => e.target.style.backgroundColor = '#d63031'}
        >
          Post Review
        </button>
      </form>
    </div>
  );
};

export default ReviewForm;