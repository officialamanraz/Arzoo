import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaCheckCircle, FaThumbsUp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal';
import './Reviews.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProductReviewsWidget = ({ productId }) => {
    const navigate = useNavigate();
    
    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    // 🌟 Toggle State for Flipkart Style Accordion
    const [isExpanded, setIsExpanded] = useState(false);
    
    const token = localStorage.getItem('token');

    const fetchSummary = async () => {
        if (!productId) return;
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}`);
            if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
            
            const data = await res.json();
            if (data.success) {
                setStats(data.stats || { totalReviews: 0, avgRating: 0 });
                setReviews(Array.isArray(data.reviews) ? data.reviews.slice(0, 3) : []);
            } else {
                throw new Error(data.message || "Failed to load reviews");
            }
        } catch (err) {
            setError("We couldn't load the reviews at this moment. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [productId]);

    const handleHelpful = async (reviewId) => {
        if (!token) {
            toast.error("Please log in to vote on reviews.");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, { 
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Thank you for your feedback!");
                fetchSummary(); 
            } else {
                toast.error(data.message || "Could not submit your vote.");
            }
        } catch (err) {
            toast.error("Network error. Please try again.");
        }
    };

    const getBadgeClass = (rating) => {
        if (rating >= 4) return 'badge-green';
        if (rating === 3) return 'badge-orange';
        return 'badge-red';
    };

    const allMedia = Array.isArray(reviews) ? reviews.flatMap(r => r.media || []) : [];

    if (isLoading) return <div className="reviews-widget-container" style={{ padding: '20px', textAlign: 'center', color: '#777' }}>Loading customer reviews...</div>;
    if (error) return <div className="reviews-widget-container" style={{ padding: '20px', textAlign: 'center', color: '#d32f2f' }}>{error}</div>;
    if (!stats) return null;

    return (
        <div className="fk-all-details-container reviews-toggle-container" style={{ marginTop: "15px" }}>
            {/* 🌟 FLIPKART STYLE TOGGLE BUTTON */}
            <button
                type="button"
                className="fk-details-toggle-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', padding: '15px', background: '#fff', border: '1px solid #f0f0f0', cursor: 'pointer', fontWeight: 'bold', fontSize: '16px' }}
            >
                <span>Ratings and reviews</span>
                <span className="toggle-icon">{isExpanded ? "▲" : "▼"}</span>
            </button>

            {/* 🌟 TOGGLE CONTENT (Stats, Photos, Reviews) */}
            {isExpanded && (
                <div className="fk-details-content fk-reviews-content" style={{ padding: '15px', background: '#fff', border: '1px solid #f0f0f0', borderTop: 'none' }}>
                    {stats.totalReviews > 0 ? (
                        <>
                            <div className="stats-overview-row">
                                <div className="big-rating-box">
                                    <div className="big-rating-number">
                                        {stats.avgRating} <span className="big-rating-star">★</span>
                                    </div>
                                    <div className="rating-count-text">
                                        {stats.totalReviews} Ratings
                                    </div>
                                </div>

                                <div className="rating-bars-container">
                                    {[5, 4, 3, 2, 1].map(star => {
                                        const count = stats[`stars${star}`] || 0;
                                        const percent = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
                                        
                                        return (
                                            <div key={star} className="rating-bar-row">
                                                <span>{star} ★</span>
                                                <div className="progress-track">
                                                    <div 
                                                        className={`progress-fill ${getBadgeClass(star).replace('badge-', 'fill-')}`} 
                                                        style={{ width: `${percent}%` }}
                                                    ></div>
                                                </div>
                                                <span>{count}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {allMedia.length > 0 && (
                                <div className="customer-photos-strip" style={{ marginTop: '15px' }}>
                                    {allMedia.map((m, idx) => (
                                        <div key={idx} className="customer-photo-item">
                                            {m.type === 'video' ? (
                                                <><video src={`${API_BASE_URL}${m.url}`} /><div className="play-indicator">▶</div></>
                                            ) : (
                                                <img src={`${API_BASE_URL}${m.url}`} alt="Customer review" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="review-feed" style={{ marginTop: '15px' }}>
                                {reviews.map(rev => (
                                    <div key={rev.review_id} className="review-card">
                                        <div className="review-badge-row">
                                            <span className={`fk-rating-badge ${getBadgeClass(rev.rating)}`}>
                                                {rev.rating} <FaStar size={10} style={{marginLeft: '2px'}}/>
                                            </span>
                                            <h4 className="review-title">{rev.title}</h4>
                                        </div>
                                        
                                        <p className="review-comment">{rev.comment}</p>
                                        
                                        {rev.attributes && Array.isArray(rev.attributes) && rev.attributes.length > 0 && (
                                            <div className="review-attributes">
                                                {rev.attributes.map((attr, i) => (
                                                    <span key={i} className="attr-chip">{attr}</span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="review-footer">
                                            <div className="reviewer-info">
                                                <span>{rev.user_name || 'Customer'}</span>
                                                {rev.is_verified_buyer === 1 && (
                                                    <span className="verified-buyer">
                                                        <FaCheckCircle className="verified-icon" size={12}/> Certified Buyer
                                                    </span>
                                                )}
                                                <span>• {new Date(rev.created_at).toLocaleDateString('en-IN')}</span>
                                            </div>
                                            <button className="helpful-btn" onClick={() => handleHelpful(rev.review_id)} title="Mark as helpful">
                                                <FaThumbsUp size={12} /> {rev.helpful_votes > 0 && rev.helpful_votes}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <p style={{ color: '#777', padding: '10px 0' }}>No reviews yet. Be the first to rate this product!</p>
                    )}
                </div>
            )}

            {/* 🌟 STANDALONE SHOW ALL REVIEWS BUTTON (Placed outside the toggle content) */}
            {stats.totalReviews > 0 && (
                <button 
                    className="fk-standalone-reviews-btn" 
                    onClick={() => navigate(`/product/${productId}/reviews`)}
                    style={{ width: '100%', padding: '15px', background: '#fff', border: '1px solid #f0f0f0', borderTop: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '15px', color: '#2874f0' }}
                >
                    Show all reviews <span>›</span>
                </button>
            )}

            {isModalOpen && (
                <ReviewModal productId={productId} onClose={() => setIsModalOpen(false)} onSuccess={() => { setIsModalOpen(false); fetchSummary(); }} />
            )}
        </div>
    );
};

export default ProductReviewsWidget;