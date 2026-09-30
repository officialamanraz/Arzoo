import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaCheckCircle,
  FaThumbsUp,
  FaThumbsDown,
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import "./ReviewsPage.css";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/* =========================================================
   HELPERS
========================================================= */

const resolveImage = (url) => {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:")
  ) {
    return url;
  }

  return `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
};

const formatLabel = (value) => {
  if (!value) return "Rating";
  return String(value)
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join(" ");
};
const timeAgo = (dateStr) => {
  if (!dateStr) return "Recently";

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    return "Recently";
  }
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 30) {
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  }

  const months = Math.floor(days / 30);
  if (months < 12) {
    return `${months} ${months === 1 ? "month" : "months"} ago`;
  }

  const years = Math.floor(days / 365);
  return `${years} ${years === 1 ? "year" : "years"} ago`;
};

const getRatingColor = (ratingType) => {
  const colors = {
    skip: "#dc2626",
    timepass: "#f59e0b",
    go_for_it: "#2563eb",
    perfection: "#16a34a",
  };

  return colors[String(ratingType || "").toLowerCase()] || "#64748b";
};

const getReviewComment = (review) => {
  return (
    review?.comment ||
    review?.comment_text ||
    review?.review_text ||
    review?.review ||
    ""
  );
};

const isVerifiedBuyer = (review) => {
  return (
    review?.is_verified_buyer === 1 ||
    review?.is_verified_buyer === true ||
    review?.is_verified_buyer === "1"
  );
};

const getReviewImages = (review) => {
  let images = [];

  if (Array.isArray(review?.images)) {
    images = review.images;
  } else if (Array.isArray(review?.image_urls)) {
    images = review.image_urls;
  } else if (typeof review?.images === "string") {
    try {
      const parsed = JSON.parse(review.images);
      if (Array.isArray(parsed)) {
        images = parsed;
      }
    } catch {
      // Ignore invalid JSON
    }
  } else if (typeof review?.image_urls === "string") {
    try {
      const parsed = JSON.parse(review.image_urls);
      if (Array.isArray(parsed)) {
        images = parsed;
      }
    } catch {
      // Ignore invalid JSON
    }
  }

  if (review?.image_url) {
    images.push(review.image_url);
  }

  return [...new Set(images.filter(Boolean))];
};

const getUserName = (review) => {
  return (
    review?.user_name ||
    review?.username ||
    review?.name ||
    review?.customer_name ||
    "Customer"
  );
};

const getLocation = (review) => {
  return (
    review?.location ||
    review?.city ||
    review?.user_location ||
    ""
  );
};

/* =========================================================
   REVIEW TYPES
========================================================= */

const OPINIONS = [
  {
    id: "perfection",
    label: "Perfection",
    color: "#16a34a",
  },
  {
    id: "go_for_it",
    label: "Go For It",
    color: "#2563eb",
  },
  {
    id: "timepass",
    label: "Timepass",
    color: "#f59e0b",
  },
  {
    id: "skip",
    label: "Skip",
    color: "#dc2626",
  },
];

/* =========================================================
   MAIN COMPONENT
========================================================= */

const ProductReviewsPage = () => {
  const { id: productId } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [allReviews, setAllReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [activeFilter, setActiveFilter] = useState("Latest");

  /* Image gallery modal */
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  /* Helpful / not helpful local interaction */
  const [helpfulVotes, setHelpfulVotes] = useState({});

  /* =========================================================
     FETCH DATA
  ========================================================= */

  useEffect(() => {
    if (!productId) {
      setError("Product ID is missing.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      setLoading(true);
      setError("");

      let productResult = null;
      let reviewResult = null;

      try {
        /* -----------------------------------------
           PRODUCT API
        ----------------------------------------- */

        try {
          const productResponse = await fetch(
            `${API_BASE_URL}/api/products/product/${productId}`
          );

          if (productResponse.ok) {
            productResult = await productResponse.json();

            if (productResult?.data) {
              setProduct(productResult.data);
            }
          }
        } catch (productError) {
          console.error(
            "[ProductReviewsPage] Product API error:",
            productError
          );
        }

        /* -----------------------------------------
           REVIEWS API
        ----------------------------------------- */

        try {
          const reviewResponse = await fetch(
            `${API_BASE_URL}/api/reviews/${productId}`
          );

          if (!reviewResponse.ok) {
            throw new Error(
              `Reviews API returned ${reviewResponse.status}`
            );
          }

          reviewResult = await reviewResponse.json();

          if (reviewResult?.success) {
            const reviews = Array.isArray(reviewResult.reviews)
              ? reviewResult.reviews
              : [];

            setAllReviews(reviews);

            setStats(reviewResult.stats || {});

            setTotalReviews(
              Number(
                reviewResult.totalReviews ??
                  reviewResult.total_reviews ??
                  reviews.length
              )
            );
          } else {
            setAllReviews([]);
            setStats({});
            setTotalReviews(0);
          }
        } catch (reviewError) {
          console.error(
            "[ProductReviewsPage] Reviews API error:",
            reviewError
          );

          throw reviewError;
        }
      } catch (err) {
        console.error("[ProductReviewsPage] Fetch Error:", err);

        setError(
          "Unable to load reviews right now. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [productId]);

  /* =========================================================
     ALL CUSTOMER IMAGES
  ========================================================= */

  const customerImages = useMemo(() => {
    const images = allReviews.flatMap((review) =>
      getReviewImages(review)
    );

    return [...new Set(images)];
  }, [allReviews]);

  /* =========================================================
     REVIEW FILTERING + SORTING
  ========================================================= */

  const displayedReviews = useMemo(() => {
    let result = [...allReviews];

    switch (activeFilter) {
      case "Certified Buyer":
        result = result.filter((review) =>
          isVerifiedBuyer(review)
        );
        break;

      case "With Photos":
        result = result.filter(
          (review) => getReviewImages(review).length > 0
        );
        break;

      case "Positive First":
        result.sort((a, b) => {
          const positive = ["perfection", "go_for_it"];

          const aPositive = positive.includes(
            String(a?.rating_type || "").toLowerCase()
          );

          const bPositive = positive.includes(
            String(b?.rating_type || "").toLowerCase()
          );

          if (aPositive !== bPositive) {
            return Number(bPositive) - Number(aPositive);
          }

          return (
            new Date(b?.created_at || 0) -
            new Date(a?.created_at || 0)
          );
        });
        break;

      case "Negative First":
        result.sort((a, b) => {
          const negative = ["skip", "timepass"];

          const aNegative = negative.includes(
            String(a?.rating_type || "").toLowerCase()
          );

          const bNegative = negative.includes(
            String(b?.rating_type || "").toLowerCase()
          );

          if (aNegative !== bNegative) {
            return Number(bNegative) - Number(aNegative);
          }

          return (
            new Date(b?.created_at || 0) -
            new Date(a?.created_at || 0)
          );
        });
        break;

      case "Latest":
      default:
        result.sort(
          (a, b) =>
            new Date(b?.created_at || 0) -
            new Date(a?.created_at || 0)
        );
        break;
    }

    return result;
  }, [allReviews, activeFilter]);

  /* =========================================================
     STATS
  ========================================================= */

  const opinionStats = useMemo(() => {
    return OPINIONS.map((opinion) => {
      const count = Number(stats?.[opinion.id] || 0);

      const percentage =
        totalReviews > 0
          ? Math.round((count / totalReviews) * 100)
          : 0;

      return {
        ...opinion,
        count,
        percentage,
      };
    });
  }, [stats, totalReviews]);

  const positiveCount =
    Number(stats?.perfection || 0) +
    Number(stats?.go_for_it || 0);

  const positivePercentage =
    totalReviews > 0
      ? Math.round((positiveCount / totalReviews) * 100)
      : 0;

  /* =========================================================
     IMAGE MODAL
  ========================================================= */

  const openImage = (imageUrl, index = 0) => {
    setSelectedImage(imageUrl);
    setSelectedImageIndex(index);
  };

  const closeImage = () => {
    setSelectedImage(null);
  };

  const showPreviousImage = () => {
    if (!customerImages.length) return;

    const previousIndex =
      (selectedImageIndex - 1 + customerImages.length) %
      customerImages.length;

    setSelectedImageIndex(previousIndex);
    setSelectedImage(
      customerImages[previousIndex]
    );
  };

  const showNextImage = () => {
    if (!customerImages.length) return;

    const nextIndex =
      (selectedImageIndex + 1) %
      customerImages.length;

    setSelectedImageIndex(nextIndex);
    setSelectedImage(customerImages[nextIndex]);
  };

  /* =========================================================
     HELPFUL VOTING
     
     This is UI-side for now because your current API code
     does not provide a review-helpfulness endpoint.
  ========================================================= */

  const handleHelpfulVote = (reviewId, type) => {
    setHelpfulVotes((previous) => {
      const current = previous[reviewId] || {
        helpful: 0,
        notHelpful: 0,
        selected: null,
      };

      if (current.selected === type) {
        return {
          ...previous,
          [reviewId]: {
            ...current,
            selected: null,
            [type]: Math.max(0, current[type] - 1),
          },
        };
      }

      let updated = {
        ...current,
        selected: type,
      };

      if (current.selected) {
        updated[current.selected] = Math.max(
          0,
          updated[current.selected] - 1
        );
      }

      updated[type] = updated[type] + 1;

      return {
        ...previous,
        [reviewId]: updated,
      };
    });
  };

  /* =========================================================
     LOADING
  ========================================================= */

  if (loading) {
    return (
      <div className="reviews-page-state">
        <div className="reviews-loading-spinner" />
        <h2>Loading reviews...</h2>
        <p>Please wait while customer feedback is loaded.</p>
      </div>
    );
  }

  /* =========================================================
     ERROR
  ========================================================= */

  if (error) {
    return (
      <div className="reviews-page-state reviews-error-state">
        <div className="reviews-error-box">
          <h2>Unable to load reviews</h2>

          <p>{error}</p>

          <button
            type="button"
            className="reviews-back-btn"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  /* =========================================================
     MAIN RENDER
  ========================================================= */

  return (
    <div className="reviews-page">
      <div className="reviews-page-wrapper">

        {/* =====================================================
            HEADER
        ===================================================== */}

        <header className="reviews-page-header">
          <button
            type="button"
            className="reviews-back-button"
            onClick={() => navigate(-1)}
          >
            <FaArrowLeft />
            <span>Back</span>
          </button>

          <div className="reviews-header-title-area">
            <h1>Ratings and Reviews</h1>

            {product?.name && (
              <p>{product.name}</p>
            )}
          </div>
        </header>

        {/* =====================================================
            RATING SUMMARY
        ===================================================== */}

        <section className="reviews-summary-card">

          <div className="reviews-summary-left">

            <div className="reviews-score">
              {positivePercentage}%
            </div>

            <div className="reviews-score-label">
              Positive Feedback
            </div>

            <div className="reviews-total-count">
              {totalReviews}{" "}
              {totalReviews === 1
                ? "rating & review"
                : "ratings & reviews"}
            </div>

          </div>

          <div className="reviews-summary-divider" />

          <div className="reviews-summary-right">

            <div className="reviews-breakdown-heading">
              Feedback Breakdown
            </div>

            {opinionStats.map((item) => (
              <div
                key={item.id}
                className="reviews-breakdown-row"
              >
                <div className="reviews-breakdown-label">
                  {item.label}
                </div>

                <div className="reviews-breakdown-track">
                  <div
                    className="reviews-breakdown-fill"
                    style={{
                      width: `${item.percentage}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>

                <div className="reviews-breakdown-number">
                  {item.count}
                </div>

                <div className="reviews-breakdown-percent">
                  {item.percentage}%
                </div>
              </div>
            ))}

          </div>
        </section>

        {/* =====================================================
            CUSTOMER PHOTO GALLERY
        ===================================================== */}

        {customerImages.length > 0 && (
          <section className="customer-gallery-section">

            <div className="section-heading-row">
              <div>
                <h2>Customer Photos</h2>

                <p>
                  Photos shared by customers with their reviews
                </p>
              </div>

              <span className="photo-count">
                {customerImages.length}{" "}
                {customerImages.length === 1
                  ? "photo"
                  : "photos"}
              </span>
            </div>

            <div className="customer-gallery">

              {customerImages.map((image, index) => (
                <button
                  type="button"
                  key={`${image}-${index}`}
                  className="customer-gallery-item"
                  onClick={() =>
                    openImage(image, index)
                  }
                  aria-label={`Open customer photo ${
                    index + 1
                  }`}
                >
                  <img
                    src={resolveImage(image)}
                    alt={`Customer ${
                      index + 1
                    }`}
                    loading="lazy"
                    onError={(event) => {
                      event.currentTarget.style.display =
                        "none";
                    }}
                  />
                </button>
              ))}

            </div>
          </section>
        )}

        {/* =====================================================
            FILTERS
        ===================================================== */}

        <section className="reviews-filter-section">

          <div className="reviews-filter-heading">
            <h2>Customer Reviews</h2>

            <span>
              {displayedReviews.length} shown
            </span>
          </div>

          <div className="reviews-filter-scroll">

            {[
              "Latest",
              "Certified Buyer",
              "With Photos",
              "Positive First",
              "Negative First",
            ].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`reviews-filter-pill ${
                  activeFilter === filter
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  setActiveFilter(filter)
                }
              >
                {filter}
              </button>
            ))}

          </div>
        </section>

        {/* =====================================================
            FULL REVIEW FEED
        ===================================================== */}

        <section className="reviews-feed-section">

          {displayedReviews.length === 0 ? (
            <div className="reviews-empty-state">

              <div className="empty-review-icon">
                ☆
              </div>

              <h3>No reviews found</h3>

              <p>
                There are no reviews matching the selected
                filter.
              </p>

              {activeFilter !== "Latest" && (
                <button
                  type="button"
                  onClick={() =>
                    setActiveFilter("Latest")
                  }
                  className="clear-filter-btn"
                >
                  Show all reviews
                </button>
              )}

            </div>
          ) : (
            displayedReviews.map((review, index) => {

              const reviewId =
                review?.review_id ||
                review?.id ||
                `review-${index}`;

              const images =
                getReviewImages(review);

              const ratingType =
                String(
                  review?.rating_type || ""
                ).toLowerCase();

              const ratingLabel =
                formatLabel(ratingType);

              const ratingColor =
                getRatingColor(ratingType);

              const vote =
                helpfulVotes[reviewId] || {
                  helpful: 0,
                  notHelpful: 0,
                  selected: null,
                };

              return (
                <article
                  key={reviewId}
                  className="full-review-card"
                >

                  {/* -------------------------------
                      REVIEW HEADER
                  -------------------------------- */}

                  <div className="full-review-top">

                    <div className="review-rating-area">

                      <span
                        className="review-type-badge"
                        style={{
                          backgroundColor:
                            ratingColor,
                        }}
                      >
                        {ratingLabel}
                      </span>

                    </div>

                    <span className="review-time">
                      {timeAgo(
                        review?.created_at
                      )}
                    </span>

                  </div>

                  {/* -------------------------------
                      CUSTOMER INFO
                  -------------------------------- */}

                  <div className="review-customer-line">

                    <span className="review-customer-name">
                      {getUserName(review)}
                    </span>

                    {isVerifiedBuyer(review) && (
                      <span className="review-verified-badge">
                        <FaCheckCircle />
                        Verified Buyer
                      </span>
                    )}

                    {getLocation(review) && (
                      <span className="review-location">
                        {getLocation(review)}
                      </span>
                    )}

                  </div>

                  {/* -------------------------------
                      PURCHASE BADGE
                  -------------------------------- */}

                  {isVerifiedBuyer(review) && (
                    <div className="review-purchase-badge">
                      <FaCheckCircle />
                      Purchased product
                    </div>
                  )}

                  {/* -------------------------------
                      COMMENT
                  -------------------------------- */}

                  <div className="full-review-comment">
                    {getReviewComment(review) ? (
                      <p>
                        {getReviewComment(review)}
                      </p>
                    ) : (
                      <p className="no-comment-text">
                        Customer shared a rating without
                        a written comment.
                      </p>
                    )}
                  </div>

                  {/* -------------------------------
                      REVIEW PHOTOS
                  -------------------------------- */}

                  {images.length > 0 && (
                    <div className="review-attached-gallery">

                      {images.map(
                        (image, imageIndex) => (
                          <button
                            type="button"
                            key={`${image}-${imageIndex}`}
                            className="review-attached-image"
                            onClick={() => {
                              const globalIndex =
                                customerImages.indexOf(
                                  image
                                );

                              openImage(
                                image,
                                globalIndex >= 0
                                  ? globalIndex
                                  : 0
                              );
                            }}
                          >
                            <img
                              src={resolveImage(image)}
                              alt="Customer review"
                              loading="lazy"
                            />
                          </button>
                        )
                      )}

                    </div>
                  )}

                  {/* -------------------------------
                      REVIEW FOOTER
                  -------------------------------- */}

                  <div className="full-review-footer">

                    <div className="review-footer-left">

                      {isVerifiedBuyer(review) && (
                        <span className="footer-verified-text">
                          <FaCheckCircle />
                          Verified purchase
                        </span>
                      )}

                    </div>

                    <div className="review-voting">

                      <span className="helpful-label">
                        Was this review helpful?
                      </span>

                      <button
                        type="button"
                        className={`helpful-button ${
                          vote.selected ===
                          "helpful"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleHelpfulVote(
                            reviewId,
                            "helpful"
                          )
                        }
                      >
                        <FaThumbsUp />

                        <span>Helpful</span>

                        <strong>
                          {vote.helpful}
                        </strong>
                      </button>

                      <button
                        type="button"
                        className={`helpful-button ${
                          vote.selected ===
                          "notHelpful"
                            ? "selected"
                            : ""
                        }`}
                        onClick={() =>
                          handleHelpfulVote(
                            reviewId,
                            "notHelpful"
                          )
                        }
                      >
                        <FaThumbsDown />

                        <span>Not helpful</span>

                        <strong>
                          {vote.notHelpful}
                        </strong>
                      </button>

                    </div>

                  </div>

                </article>
              );
            })
          )}

        </section>

      </div>

      {/* =======================================================
          IMAGE MODAL
      ======================================================= */}

      {selectedImage && (
        <div
          className="review-image-modal"
          onClick={closeImage}
        >

          <button
            type="button"
            className="review-modal-close"
            onClick={closeImage}
            aria-label="Close image"
          >
            <FaTimes />
          </button>

          {customerImages.length > 1 && (
            <>
              <button
                type="button"
                className="review-modal-nav review-modal-prev"
                onClick={(event) => {
                  event.stopPropagation();
                  showPreviousImage();
                }}
                aria-label="Previous image"
              >
                <FaChevronLeft />
              </button>

              <button
                type="button"
                className="review-modal-nav review-modal-next"
                onClick={(event) => {
                  event.stopPropagation();
                  showNextImage();
                }}
                aria-label="Next image"
              >
                <FaChevronRight />
              </button>
            </>
          )}

          <div
            className="review-modal-content"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <img
              src={resolveImage(selectedImage)}
              alt="Customer enlarged"
            />

            <div className="review-modal-counter">
              {selectedImageIndex + 1} /{" "}
              {customerImages.length}
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default ProductReviewsPage;