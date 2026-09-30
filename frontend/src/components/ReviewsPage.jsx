import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaThumbsUp, FaThumbsDown } from "react-icons/fa";
import "./ReviewsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

const resolveImage = (url) => {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatLabel = (str) => {
  if (!str) return "Rating";
  return str.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
};

const OPINIONS = [
  { id: "perfection", label: "Perfection", color: "#388e3c" },
  { id: "go_for_it", label: "Go For It", color: "#2874f0" },
  { id: "timepass", label: "Timepass", color: "#f5a623" },
  { id: "skip", label: "Skip", color: "#ff6161" }
];

const timeAgo = (dateStr) => {
  if (!dateStr) return "";
  const seconds = Math.floor((new Date() - new Date(dateStr)) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  return "Recently";
};

const ProductReviewsPage = () => {
  const params = useParams();
  const productId = params.id || params.productId;
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState("Latest");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const prodRes = await fetch(`${API_BASE_URL}/api/products/product/${productId}`);
        const prodData = await prodRes.json();
        if (prodData?.data) setProduct(prodData.data);

        const revRes = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
        const revData = await revRes.json();
        if (revData?.success) {
          setAllReviews(revData.reviews || []);
          setStats(revData.stats || {});
          setTotalReviews(revData.totalReviews || (revData.reviews ? revData.reviews.length : 0));
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    if (productId) fetchData();
  }, [productId]);

  const customerImages = allReviews.filter((r) => r.image_url).map((r) => r.image_url);

  // Apply Filters
  let displayedReviews = [...allReviews];
  if (activeFilter === "With Photos") {
    displayedReviews = displayedReviews.filter(r => r.image_url);
  } else if (activeFilter === "Positive First") {
    displayedReviews = displayedReviews.filter(r => r.rating_type === "perfection" || r.rating_type === "go_for_it");
  } else if (activeFilter === "Negative First") {
    displayedReviews = displayedReviews.filter(r => r.rating_type === "skip" || r.rating_type === "timepass");
  } else if (activeFilter === "Certified Buyer") {
    displayedReviews = displayedReviews.filter(r => r.is_verified_buyer);
  }

  // Calculate Positive Percentage
  const positiveVotes = (stats.perfection || 0) + (stats.go_for_it || 0);
  const positivePct = totalReviews > 0 ? Math.round((positiveVotes / totalReviews) * 100) : 0;

  if (loading) return <div className="page-loader">Loading full reviews...</div>;

  return (
    <div className="fk-all-rev-page">
      <div className="fk-all-rev-wrapper">
        
        <div className="fk-all-rev-header">
          <button className="back-link-btn" onClick={() => navigate(-1)}>
            <FaArrowLeft /> Back
          </button>
          <h1 className="fk-all-rev-title">Reviews for {product?.name || "Product"}</h1>
        </div>

        {/* 🌟 1. RATINGS BREAKDOWN METER (Flipkart Style Layout) 🌟 */}
        <div className="fk-meter-container">
          <div className="fk-meter-left">
            <div className="fk-big-score">{positivePct}%</div>
            <div className="fk-big-score-sub">Positive Feedback</div>
            <div className="fk-total-ratings-count">{totalReviews} Ratings & Reviews</div>
          </div>
          
          <div className="fk-meter-right">
            {OPINIONS.map((op) => {
              const count = stats[op.id] || 0;
              const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
              return (
                <div key={op.id} className="fk-meter-bar-row">
                  <span className="fk-bar-label">{op.label}</span>
                  <div className="fk-bar-track">
                    <div className="fk-bar-fill" style={{ width: `${pct}%`, backgroundColor: op.color }}></div>
                  </div>
                  <span className="fk-bar-count">{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 🌟 2. FULL CUSTOMER PHOTOS GALLERY 🌟 */}
        {customerImages.length > 0 && (
          <div className="fk-full-gallery-section">
            <h3 className="fk-section-heading">Customer Photos ({customerImages.length})</h3>
            <div className="fk-gallery-grid">
              {customerImages.map((imgUrl, idx) => (
                <div key={idx} className="fk-gallery-img-wrapper">
                  <img src={resolveImage(imgUrl)} alt="Customer" className="fk-gallery-img" loading="lazy" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 🌟 3. FILTER & SORT PILLS 🌟 */}
        <div className="fk-filters-row">
          {["Latest", "Certified Buyer", "With Photos", "Positive First", "Negative First"].map(flt => (
            <button 
              key={flt}
              className={`fk-filter-pill ${activeFilter === flt ? 'active' : ''}`}
              onClick={() => setActiveFilter(flt)}
            >
              {flt}
            </button>
          ))}
        </div>

        {/* 🌟 4. FULL REVIEW FEED 🌟 */}
        <div className="fk-full-feed-container">
          {displayedReviews.length === 0 ? (
            <p className="fk-no-feed-msg">No reviews match your filter.</p>
          ) : (
            displayedReviews.map((rev) => {
              const opMatch = OPINIONS.find(o => o.id === rev.rating_type) || OPINIONS[1];
              return (
                <div key={rev.review_id} className="fk-feed-card">
                  
                  <div className="fk-feed-header">
                    <span className="fk-feed-badge" style={{ backgroundColor: opMatch.color }}>
                      {opMatch.label}
                    </span>
                    <span className="fk-feed-time">{timeAgo(rev.created_at)}</span>
                  </div>

                  <p className="fk-feed-comment">{rev.comment}</p>

                  {rev.image_url && (
                    <div className="fk-feed-attached-img">
                      <img src={resolveImage(rev.image_url)} alt="Review Attachment" />
                    </div>
                  )}

                  <div className="fk-feed-footer">
                    <div className="fk-feed-author-info">
                      <span className="fk-feed-author-name">{rev.user_name || "Customer"}</span>
                      {(rev.is_verified_buyer === 1 || rev.is_verified_buyer === true) && (
                        <span className="fk-feed-verified-badge">
                          <FaCheckCircle size={11} color="#878787" /> Certified Buyer
                        </span>
                      )}
                      <span className="fk-feed-location">, India</span>
                    </div>

                    <div className="fk-feed-voting">
                      <button className="fk-vote-btn"><FaThumbsUp /> 0</button>
                      <button className="fk-vote-btn"><FaThumbsDown /> 0</button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
};

export default ProductReviewsPage;