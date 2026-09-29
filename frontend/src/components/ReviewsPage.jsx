import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaArrowLeft, FaCheckCircle } from 'react-icons/fa';
import './ReviewsPage.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const OPINIONS = [
  { id: 'skip', label: 'Skip', color: '#ff4d6d' },
  { id: 'timepass', label: 'Timepass', color: '#ffb703' },
  { id: 'go_for_it', label: 'Go for it', color: '#06d6a0' },
  { id: 'perfection', label: 'Perfection', color: '#9d4edd' }
];

function ProductReviewsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedOpinion, setSelectedOpinion] = useState('go_for_it');
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchPageData = async () => {
      try {
        setLoading(true);
        // Product fetch
        const prodRes = await fetch(`${API_BASE_URL}/api/products/product/${id}`);
        const prodData = await prodRes.json();
        if (prodData && prodData.data) setProduct(prodData.data);

        // Reviews / Comments fetch
        const revRes = await fetch(`${API_BASE_URL}/api/comments/${id}/comments`);
        const revData = await revRes.json();
        if (revData && revData.comments) {
          setReviews(revData.comments);
        }
      } catch (err) {
        console.error("Error fetching review data:", err);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchPageData();
  }, [id]);

  // Meter Calculation Logic
  const totalVotes = reviews.length;
  const counts = {
    skip: reviews.filter(r => r.opinion === 'skip').length,
    timepass: reviews.filter(r => r.opinion === 'timepass').length,
    go_for_it: reviews.filter(r => r.opinion === 'go_for_it' || (!r.opinion && r.rating >= 4)).length,
    perfection: reviews.filter(r => r.opinion === 'perfection').length,
  };

  const getPercentage = (count) => (totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0);

  // Dominant sentiment for center gauge meter
  const dominantPercent = totalVotes > 0 
    ? Math.max(getPercentage(counts.skip), getPercentage(counts.timepass), getPercentage(counts.go_for_it), getPercentage(counts.perfection))
    : 0;

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error("Please login to write a review!");
      return;
    }
    if (!reviewComment.trim()) {
      toast.error("Please write your review!");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          comment_text: reviewComment,
          opinion: selectedOpinion
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Review posted successfully!");
        setReviews([data.comment || {
          comment_id: Date.now(),
          user_name: 'You',
          comment_text: reviewComment,
          opinion: selectedOpinion,
          created_at: new Date().toISOString()
        }, ...reviews]);
        setReviewComment('');
      } else {
        toast.error(data.message || "Failed to post review");
      }
    } catch (err) {
      toast.error("Failed to post review");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="rpm-loading">Loading reviews meter...</div>;

  return (
    <div className="rpm-page-container">
      <div className="rpm-content-box">
        
        {/* Back navigation */}
        <button className="rpm-back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back to Product
        </button>

        {product && <h2 className="rpm-product-heading">{product.name}</h2>}

        {/* 🌟 1. METER & STATS SECTION (Moctale Style) 🌟 */}
        <div className="rpm-meter-card">
          <h3 className="rpm-section-title">Review Meter</h3>

          <div className="rpm-gauge-wrapper">
            <svg viewBox="0 0 200 115" className="rpm-gauge-svg">
              {/* Background Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#2a2a2a"
                strokeWidth="16"
                strokeLinecap="round"
              />
              {/* Active Highlight Arc */}
              <path
                d="M 20 100 A 80 80 0 0 1 180 100"
                fill="none"
                stroke="#06d6a0"
                strokeWidth="16"
                strokeLinecap="round"
                strokeDasharray="251.2"
                strokeDashoffset={251.2 - (251.2 * (dominantPercent || 0)) / 100}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            
            {/* Center Text */}
            <div className="rpm-gauge-center-text">
              <span className="rpm-gauge-percentage">{dominantPercent}%</span>
              <span className="rpm-gauge-votes">{totalVotes} Total Votes</span>
            </div>
          </div>

          {/* Stats Legend Breakdown */}
          <div className="rpm-stats-legend">
            {OPINIONS.map((op) => (
              <div key={op.id} className="rpm-stat-pill">
                <span className="rpm-pill-dot" style={{ backgroundColor: op.color }}></span>
                <span className="rpm-pill-label">{op.label}</span>
                <span className="rpm-pill-pct">{getPercentage(counts[op.id])}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* 🌟 2. WRITE A REVIEW SECTION 🌟 */}
        <div className="rpm-write-card">
          <h3 className="rpm-section-title">Write a Review</h3>

          <form onSubmit={handleSubmitReview} className="rpm-write-form">
            {/* 4 Interactive Buttons */}
            <div className="rpm-opinion-selector">
              {OPINIONS.map((op) => {
                const isSelected = selectedOpinion === op.id;
                return (
                  <button
                    key={op.id}
                    type="button"
                    onClick={() => setSelectedOpinion(op.id)}
                    className={`rpm-choice-btn ${isSelected ? 'active' : ''}`}
                    style={{
                      borderColor: op.color,
                      backgroundColor: isSelected ? op.color : 'transparent',
                      color: isSelected ? '#121212' : '#ffffff'
                    }}
                  >
                    {op.label}
                  </button>
                );
              })}
            </div>

            {/* Review Comment Box */}
            <textarea
              className="rpm-textarea"
              rows="3"
              placeholder="Write your honest opinion about this saree..."
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              required
            ></textarea>

            <button type="submit" disabled={isSubmitting} className="rpm-submit-btn">
              {isSubmitting ? "Posting..." : "Post Review"}
            </button>
          </form>
        </div>

        {/* 🌟 3. USER REVIEWS STREAM 🌟 */}
        <div className="rpm-reviews-list-card">
          <h3 className="rpm-section-title">Customer Opinions ({reviews.length})</h3>

          {reviews.length === 0 ? (
            <p className="rpm-no-reviews">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="rpm-reviews-stream">
              {reviews.map((rev, index) => {
                const matchedOp = OPINIONS.find(o => o.id === rev.opinion) || OPINIONS[2];
                return (
                  <div key={rev.comment_id || index} className="rpm-review-item">
                    <div className="rpm-review-top">
                      <span className="rpm-user-name">@{rev.user_name || 'Customer'}</span>
                      <span 
                        className="rpm-review-badge"
                        style={{ backgroundColor: matchedOp.color }}
                      >
                        {matchedOp.label}
                      </span>
                    </div>

                    <p className="rpm-review-text">{rev.comment_text}</p>

                    <div className="rpm-review-footer">
                      <span className="rpm-review-date">
                        {rev.created_at ? new Date(rev.created_at).toLocaleDateString() : 'Recent'}
                      </span>
                      <span className="rpm-verified-tag">
                        <FaCheckCircle size={11} color="#06d6a0" /> Verified Buyer
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default ProductReviewsPage;