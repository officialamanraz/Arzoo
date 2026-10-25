import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaStar, FaCheckCircle, FaThumbsUp } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { getImageUrl } from '../getImageUrl';
import './Reviews.css'; // Make sure this CSS file is linked!

const API_BASE_URL = import.meta.env.VITE_API_URL;

const AllReviewsPage = () => {
    const params = useParams();
    const productId = params.id || params.productId;
    const navigate = useNavigate();

    const [reviews, setReviews] = useState([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);

    // Flipkart-style Filters
    const [sortBy, setSortBy] = useState('recent');
    const [filterRating, setFilterRating] = useState('');
    const [withMedia, setWithMedia] = useState(false);

    // 🛡️ Foolproof Media URL Resolver (Prevents 404 image crashes)
    const resolveMediaUrl = (url) => {
        if (!url) return '';
        const clean = String(url).replace(/\\/g, '/').trim();
        if (clean.startsWith('http://') || clean.startsWith('https://')) return clean;
        if (clean.startsWith('/uploads/') || clean.startsWith('uploads/')) {
            return `${API_BASE_URL}/${clean.replace(/^\/+/, '')}`;
        }
        try {
            const resolved = getImageUrl(clean);
            if (resolved) return resolved;
        } catch (e) {}
        return `${API_BASE_URL}/uploads/${clean.replace(/^\/+/, '')}`;
    };

    const fetchPaginatedReviews = async (currentPage) => {
        if (!productId) return;
        setLoading(true);
        try {
            const query = new URLSearchParams({
                page: currentPage,
                limit: 10,
                sortBy,
                ...(filterRating && { filterRating }),
                ...(withMedia && { withMedia: true })
            }).toString();

            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}/all?${query}`);
            const data = await res.json();

            if (data.success) {
                const incoming = Array.isArray(data.reviews) ? data.reviews : [];
                if (currentPage === 1) {
                    setReviews(incoming); // Replace on filter change
                } else {
                    setReviews(prev => [...prev, ...incoming]); // Append on "Load More"
                }
                setTotalPages(data.totalPages || 1);
            }
        } catch (error) {
            console.error("Error fetching all reviews:", error);
            toast.error("Failed to load reviews.");
        } finally {
            setLoading(false);
        }
    };

    // Refetch when filters change
    useEffect(() => {
        setPage(1);
        fetchPaginatedReviews(1);
    }, [productId, sortBy, filterRating, withMedia]);

    const handleHelpful = async (reviewId) => {
        const token = localStorage.getItem('token');
        if (!token) return toast.error("Please log in to vote.");
        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/${reviewId}/helpful`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                toast.success("Marked as helpful!");
                setReviews(prev => prev.map(r => r.review_id === reviewId ? { ...r, helpful_votes: (r.helpful_votes || 0) + 1 } : r));
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

    return (
        <div className="all-reviews-page">
            {/* Navigation Back */}
            <button
                onClick={() => navigate(`/product/${productId}`)}
                style={{ background: 'none', border: 'none', color: '#2874f0', cursor: 'pointer', marginBottom: '16px', fontWeight: '600', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '5px' }}
            >
                ❮ Back to Product
            </button>

            <h2 style={{ marginBottom: '20px', fontSize: '22px', fontWeight: '600' }}>All Customer Reviews</h2>

            {/* 🌟 FLIPKART STYLE FILTERS */}
            <div className="filters-row">
                <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                    <option value="recent">Most Recent</option>
                    <option value="helpful">Most Helpful</option>
                </select>

                <select className="filter-select" value={filterRating} onChange={(e) => setFilterRating(e.target.value)}>
                    <option value="">All Ratings</option>
                    <option value="5">5 ★ (Excellent)</option>
                    <option value="4">4 ★ (Very Good)</option>
                    <option value="3">3 ★ (Good)</option>
                    <option value="2">2 ★ (Poor)</option>
                    <option value="1">1 ★ (Very Poor)</option>
                </select>

                <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                    <input type="checkbox" checked={withMedia} onChange={(e) => setWithMedia(e.target.checked)} style={{ accentColor: '#2874f0', width: '16px', height: '16px' }} />
                    With Photos/Videos
                </label>
            </div>

            {/* 🌟 REVIEWS FEED */}
            {loading && page === 1 ? (
                <p style={{ color: '#777', padding: '20px 0', textAlign: 'center' }}>Loading reviews...</p>
            ) : reviews.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', background: '#f9f9f9', borderRadius: '8px' }}>
                    <h3 style={{ color: '#555' }}>No reviews found</h3>
                    <p style={{ color: '#777', fontSize: '14px' }}>Try changing your filters to see more reviews.</p>
                </div>
            ) : (
                <div className="review-feed">
                    {reviews.map(rev => (
                        <div key={rev.review_id} className="review-card">
                            
                            {/* Rating Badge & Title */}
                            <div className="review-badge-row">
                                <span className={`fk-rating-badge ${getBadgeClass(rev.rating)}`}>
                                    {rev.rating} <FaStar size={10} />
                                </span>
                                <h4 className="review-title">{rev.title || 'Verified Purchase'}</h4>
                            </div>

                            {/* Comment Text */}
                            <p className="review-comment">{rev.comment}</p>

                            {/* Attribute Chips (Features Loved) */}
                            {Array.isArray(rev.attributes) && rev.attributes.length > 0 && (
                                <div className="review-attributes">
                                    {rev.attributes.map((attr, i) => (
                                        <span key={i} className="attr-chip">{attr}</span>
                                    ))}
                                </div>
                            )}

                            {/* Customer Photos Strip */}
                            {Array.isArray(rev.media) && rev.media.length > 0 && (
                                <div className="customer-photos-strip">
                                    {rev.media.map((m, idx) => (
                                        <div key={idx} className="customer-photo-item">
                                            {m.type === 'video' ? (
                                                <video src={resolveMediaUrl(m.url)} controls preload="metadata" />
                                            ) : (
                                                <img
                                                    src={resolveMediaUrl(m.url)}
                                                    alt="Review attachment"
                                                    onError={(e) => { e.currentTarget.parentElement.style.display = 'none'; }}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Footer: User Info & Helpful Vote */}
                            <div className="review-footer">
                                <div className="reviewer-info">
                                    <span>{rev.user_name || 'Customer'}</span>
                                    {rev.is_verified_buyer === 1 && (
                                        <span className="fk-mini-verified">
                                            <FaCheckCircle className="verified-icon" size={12} /> Certified Buyer
                                        </span>
                                    )}
                                    <span>• {new Date(rev.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</span>
                                </div>
                                
                                <button className="helpful-btn" onClick={() => handleHelpful(rev.review_id)}>
                                    <FaThumbsUp size={12} color={rev.helpful_votes > 0 ? '#2874f0' : '#878787'} /> 
                                    <span style={{ color: rev.helpful_votes > 0 ? '#2874f0' : '#878787' }}>{rev.helpful_votes || 0}</span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* 🌟 LOAD MORE BUTTON */}
            {page < totalPages && (
                <button
                    className="fk-standalone-reviews-btn"
                    style={{ 
                        border: '1px solid #e0e0e0', 
                        borderRadius: '4px', 
                        marginTop: '24px', 
                        justifyContent: 'center',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.05)' 
                    }}
                    onClick={() => {
                        const next = page + 1;
                        setPage(next);
                        fetchPaginatedReviews(next);
                    }}
                >
                    {loading ? 'Loading...' : 'Load More Reviews'}
                </button>
            )}
        </div>
    );
};

export default AllReviewsPage;