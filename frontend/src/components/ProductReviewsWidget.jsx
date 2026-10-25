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
    const [isModalOpen, setIsModalOpen] = useState(false);
    const token = localStorage.getItem('token');

    const fetchSummary = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}`);
            const data = await res.json();
            if (data.success) {
                setStats(data.stats);
                setReviews(data.reviews.slice(0, 3)); // Only take top 3 for widget
            }
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        }
    };

    useEffect(() => {
        if (productId) fetchSummary();
    }, [productId]);

    const handleHelpful = async (reviewId) => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, { method: 'PUT' });
            if (res.ok) {
                toast.success("Marked as helpful!");
                fetchSummary(); // Refresh counts
            }
        } catch (err) {
            toast.error("Something went wrong");
        }
    };

    const getBadgeClass = (rating) => {
        if (rating >= 4) return 'badge-green';
        if (rating === 3) return 'badge-orange';
        return 'badge-red';
    };

    // Extract all media from reviews for the horizontal strip
    const allMedia = reviews.flatMap(r => r.media || []);

    if (!stats) return <div className="reviews-widget-container">Loading reviews... (If stuck, check backend console for errors)</div>;

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
                                const count = stats.breakdown[star];
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
                                        <img src={`${API_BASE_URL}${m.url}`} alt="Customer review" />
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
                                
                                {rev.attributes && rev.attributes.length > 0 && (
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
                                        <span>• {new Date(rev.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <button className="helpful-btn" onClick={() => handleHelpful(rev.review_id)}>
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
                <p style={{ color: '#777' }}>No reviews yet. Be the first to rate this product!</p>
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