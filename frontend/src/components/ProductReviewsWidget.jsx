import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaStar, FaCheckCircle, FaThumbsUp, FaChevronRight, FaChevronLeft } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getImageUrl } from '../getImageUrl';
import './Reviews.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProductReviewsWidget = ({ productId }) => {
    const navigate = useNavigate();
    const sliderRef = useRef(null);

    const [stats, setStats] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isExpanded, setIsExpanded] = useState(true); // Default open like Flipkart
    const [previewMedia, setPreviewMedia] = useState(null); // Lightbox when clicking a review photo

    const token = localStorage.getItem('token');

    // 🛡️ Smart URL resolver so review images NEVER fail to load
    const resolveMediaUrl = (url) => {
        if (!url) return '';
        const clean = String(url).replace(/\\/g, '/').trim();
        if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
        if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
            return `${API_BASE_URL}/${clean.replace(/^\/+/, '')}`;
        }
        // Try project's getImageUrl helper first, or fallback to /uploads/
        try {
            const resolved = getImageUrl(clean);
            if (resolved) return resolved;
        } catch (e) {}
        return `${API_BASE_URL}/uploads/${clean.replace(/^\/+/, '')}`;
    };

    const timeAgo = (dateStr) => {
        if (!dateStr) return '';
        const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
        if (diff < 60) return 'Just now';
        const mins = Math.floor(diff / 60);
        if (mins < 60) return `${mins}m ago`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 30) return `${days} days ago`;
        const months = Math.floor(days / 30);
        if (months < 12) return `${months} months ago`;
        return `${Math.floor(months / 12)} years ago`;
    };

    const fetchSummary = async () => {
        if (!productId) return;
        setIsLoading(true);
        setError(null);

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}`);
            if (!res.ok) throw new Error(`HTTP error: ${res.status}`);

            const data = await res.json();
            if (data.success) {
                setStats(data.stats || { totalReviews: 0, avgRating: 0 });
                setReviews(Array.isArray(data.reviews) ? data.reviews : []);
            } else {
                throw new Error(data.message || 'Failed to load reviews');
            }
        } catch (err) {
            setError("Unable to load customer reviews right now.");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchSummary();
    }, [productId]);

    const handleHelpful = async (reviewId) => {
        if (!token) {
            toast.error("Please log in to mark a review as helpful.");
            return;
        }
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (res.ok && data.success) {
                toast.success("Thanks for your feedback!");
                setReviews(prev =>
                    prev.map(r => r.review_id === reviewId ? { ...r, helpful_votes: (r.helpful_votes || 0) + 1 } : r)
                );
            }
        } catch (err) {
            toast.error("Could not update vote. Please try again.");
        }
    };

    const scrollSlider = (dir) => {
        if (!sliderRef.current) return;
        const scrollAmount = 280;
        sliderRef.current.scrollBy({ left: dir === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    };

    const getBadgeClass = (rating) => {
        if (rating >= 4) return 'badge-green';
        if (rating === 3) return 'badge-orange';
        return 'badge-red';
    };

    // Collect all valid media from all reviews
    const allMedia = Array.isArray(reviews)
        ? reviews.flatMap(r => (Array.isArray(r.media) ? r.media : [])).filter(m => m && m.url)
        : [];

    // Collect unique feature chips loved by customers
    const lovedFeatures = Array.from(
        new Set(
            reviews.flatMap(r => (Array.isArray(r.attributes) ? r.attributes : [])).filter(Boolean)
        )
    );

    if (isLoading) {
        return <div className="fk-all-details-container" style={{ padding: '18px', textAlign: 'center', color: '#777' }}>Loading reviews...</div>;
    }
    if (error) {
        return <div className="fk-all-details-container" style={{ padding: '18px', textAlign: 'center', color: '#d32f2f' }}>{error}</div>;
    }
    if (!stats) return null;

    return (
        <div className="fk-all-details-container reviews-toggle-container">
            {/* 🌟 1. FLIPKART TOGGLE HEADER */}
            <button
                type="button"
                className="fk-details-toggle-btn"
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
            >
                <span>Ratings and reviews</span>
                <span className="fk-chevron-box">{isExpanded ? "▲" : "▼"}</span>
            </button>

            {/* 🌟 2. TOGGLE BODY */}
            {isExpanded && (
                <div className="fk-details-content fk-reviews-content">
                    {reviews.length > 0 ? (
                        <>
                            {/* 🖼️ SECTION A: CUSTOMER IMAGES GRID (Shown First) */}
                            {allMedia.length > 0 && (
                                <div className="fk-customer-media-section">
                                    <div className={`fk-bento-media-grid count-${Math.min(allMedia.length, 5)}`}>
                                        {allMedia.slice(0, 5).map((m, idx) => {
                                            const mediaSrc = resolveMediaUrl(m.url);
                                            const extraCount = allMedia.length - 5;
                                            const showOverlay = idx === 4 && extraCount > 0;

                                            return (
                                                <div
                                                    key={idx}
                                                    className={`fk-bento-item item-${idx}`}
                                                    onClick={() => {
                                                        if (showOverlay) {
                                                            navigate(`/product-reviews/${productId}`);
                                                        } else {
                                                            setPreviewMedia({ type: m.type, src: mediaSrc });
                                                        }
                                                    }}
                                                >
                                                    {m.type === 'video' ? (
                                                        <>
                                                            <video src={mediaSrc} muted preload="metadata" />
                                                            <div className="play-indicator">▶</div>
                                                        </>
                                                    ) : (
                                                        <img
                                                            src={mediaSrc}
                                                            alt={`Customer photo ${idx + 1}`}
                                                            loading="lazy"
                                                            onError={(e) => {
                                                                // Fallback attempt before hiding
                                                                if (!e.currentTarget.dataset.retried) {
                                                                    e.currentTarget.dataset.retried = 'true';
                                                                    e.currentTarget.src = `${API_BASE_URL}/${String(m.url).replace(/^\/+/, '')}`;
                                                                } else {
                                                                    e.currentTarget.parentElement.style.display = 'none';
                                                                }
                                                            }}
                                                        />
                                                    )}
                                                    {showOverlay && (
                                                        <div className="fk-more-photos-overlay">
                                                            +{extraCount}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* 🏷️ SECTION B: FEATURES CUSTOMERS LOVED */}
                            {lovedFeatures.length > 0 && (
                                <div className="fk-loved-features-block">
                                    <h4 className="fk-Subheading-label">Features customers loved</h4>
                                    <div className="fk-loved-chips-row">
                                        {lovedFeatures.map((feat, i) => (
                                            <span key={i} className="fk-loved-chip">{feat}</span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/*  horizontally sliding small review cards */}
                            <div className="fk-horizontal-reviews-wrapper">
                                {reviews.length > 1 && (
                                    <button
                                        type="button"
                                        className="fk-slider-nav-btn prev"
                                        onClick={() => scrollSlider('prev')}
                                        aria-label="Previous reviews"
                                    >
                                        <FaChevronLeft size={13} />
                                    </button>
                                )}

                                <div className="fk-horizontal-reviews-track" ref={sliderRef}>
                                    {reviews.slice(0, 8).map((rev) => (
                                        <div key={rev.review_id} className="fk-mini-review-card">
                                            <div className="fk-mini-card-top">
                                                <div className="fk-mini-badge-title">
                                                    <span className={`fk-rating-badge ${getBadgeClass(rev.rating)}`}>
                                                        {rev.rating} <FaStar size={9} />
                                                    </span>
                                                    <span className="fk-mini-title">
                                                        {rev.title || 'Verified Review'}
                                                    </span>
                                                </div>
                                                <span className="fk-mini-time">{timeAgo(rev.created_at)}</span>
                                            </div>

                                            <p className="fk-mini-comment">
                                                {rev.comment || 'Good product.'}
                                            </p>

                                            <div className="fk-mini-card-footer">
                                                <div className="fk-mini-author-box">
                                                    <span className="fk-mini-author-name">{rev.user_name || 'Customer'}</span>
                                                    {rev.is_verified_buyer === 1 && (
                                                        <span className="fk-mini-verified">
                                                            <FaCheckCircle size={11} className="verified-icon" /> Verified Buyer
                                                        </span>
                                                    )}
                                                </div>

                                                <button
                                                    type="button"
                                                    className="fk-mini-helpful-btn"
                                                    onClick={() => handleHelpful(rev.review_id)}
                                                >
                                                    <FaThumbsUp size={11} />
                                                    <span>{rev.helpful_votes || 0}</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {reviews.length > 1 && (
                                    <button
                                        type="button"
                                        className="fk-slider-nav-btn next"
                                        onClick={() => scrollSlider('next')}
                                        aria-label="Next reviews"
                                    >
                                        <FaChevronRight size={13} />
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <p className="fk-no-reviews-msg">No customer reviews yet.</p>
                    )}
                </div>
            )}

            {/* 🌟 3. STANDALONE SHOW ALL REVIEWS BUTTON */}
            {reviews.length > 0 && (
                <button
                    type="button"
                    className="fk-standalone-reviews-btn"
                    onClick={() => navigate(`/product-reviews/${productId}`)}
                >
                    <span>Show all reviews</span>
                    <span>›</span>
                </button>
            )}

            {/* 🔍 LIGHTBOX MODAL WHEN CLICKING CUSTOMER PHOTO */}
            {previewMedia && (
                <div className="modal-overlay" onClick={() => setPreviewMedia(null)}>
                    <div className="fk-media-lightbox" onClick={(e) => e.stopPropagation()}>
                        <button className="fk-lightbox-close" onClick={() => setPreviewMedia(null)}>×</button>
                        {previewMedia.type === 'video' ? (
                            <video src={previewMedia.src} controls autoPlay style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px' }} />
                        ) : (
                            <img src={previewMedia.src} alt="Review Fullscreen" style={{ maxWidth: '100%', maxHeight: '80vh', borderRadius: '8px', objectFit: 'contain' }} />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductReviewsWidget;