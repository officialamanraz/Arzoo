import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaCheckCircle, FaThumbsUp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import ReviewModal from './ReviewModal';
import './Reviews.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProductReviewsWidget = ({ productId }) => {
    const navigate = useNavigate();
    
    // States for data and UI handling
    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const token = localStorage.getItem('token');

    // 🛡️ Robust Fetching with Error Handling
    const fetchSummary = async () => {
        if (!productId) return;
        
        setIsLoading(true);
        setError(null);
        
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}`);
            
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }
            
            const data = await res.json();
            
            if (data.success) {
                setStats(data.stats || { totalReviews: 0, avgRating: 0 });
                setReviews(Array.isArray(data.reviews) ? data.reviews.slice(0, 3) : []);
            } else {
                throw new Error(data.message || "Failed to load reviews");
            }
        } catch (err) {
            console.error("[Widget] Error fetching reviews:", err);
            // User-friendly error message, no developer jargon
            setError("We couldn't load the reviews at this moment. Please try again later.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [productId]);

    // 🛡️ Safe Voting Logic
    const handleHelpful = async (reviewId) => {
        if (!token) {
            toast.error("Please log in to vote on reviews.");
            return;
        }

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, { 
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            const data = await res.json();
            
            if (res.ok && data.success) {
                toast.success("Thank you for your feedback!");
                fetchSummary(); // Refresh counts to show the new vote
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

    // Extract all media safely
    const allMedia = Array.isArray(reviews) ? reviews.flatMap(r => r.media || []) : [];

    // UI STATES
    if (isLoading) {
        return (
            <div className="reviews-widget-container" style={{ padding: '40px 20px', textAlign: 'center', color: '#777' }}>
                Loading customer reviews...
            </div>
        );
    }

    if (error) {
        return (
            <div className="reviews-widget-container" style={{ padding: '40px 20px', textAlign: 'center', color: '#d32f2f' }}>
                {error}
            </div>
        );
    }

    if (!stats) return null;

    return (
        <div className="reviews-widget-container">
            <div className="reviews-header-flex">
                <h2>Ratings & Reviews</h2>
            </div>

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
                                // 🛡️ FIXED: Correctly accessing database columns (stars5, stars4, etc.)
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

                    {/* Customer Photos Horizontal Strip */}
                    {allMedia.length > 0 && (
                        <div className="customer-photos-strip">
                            {allMedia.map((m, idx) => (
                                <div key={idx} className="customer-photo-item">
                                    {m.type === 'video' ? (
                                        <><video src={`${API_BASE_URL}${m.url}`} /><div className="play-indicator">▶</div></>
                                    ) : (
                                        <img 
                                            src={`${API_BASE_URL}${m.url}`} 
                                            alt="Customer review" 
                                            onError={(e) => { e.currentTarget.style.display = 'none'; }} 
                                        />
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Top 3 Reviews */}
                    <div className="review-feed">
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
                                    <button 
                                        className="helpful-btn" 
                                        onClick={() => handleHelpful(rev.review_id)}
                                        title="Mark as helpful"
                                    >
                                        <FaThumbsUp size={12} /> {rev.helpful_votes > 0 && rev.helpful_votes}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {stats.totalReviews > 3 && (
                        <button className="view-all-reviews-btn" onClick={() => navigate(`/product/${productId}/reviews`)}>
                            Read all {stats.totalReviews} reviews ❯
                        </button>
                    )}
                </>
            ) : (
                <p style={{ color: '#777', padding: '10px 0' }}>No reviews yet. Be the first to rate this product!</p>
            )}

            {isModalOpen && (
                <ReviewModal 
                    productId={productId} 
                    onClose={() => setIsModalOpen(false)} 
                    onSuccess={() => { setIsModalOpen(false); fetchSummary(); }}
                />
            )}
        </div>
    );
};

export default ProductReviewsWidget;