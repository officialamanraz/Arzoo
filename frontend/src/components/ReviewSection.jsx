import React, { useEffect, useState } from "react";
import { REVIEW_OPTIONS } from "../config/reviewOptions";
// import ReviewForm from "./ReviewForm"; // Import your form here if you want them together!

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);

  // Fetch logic moved to its own function so it can be called again if needed
  const fetchReviews = async () => {
    try {
      const response = await fetch(
        `https://arzoo-saree.onrender.com/api/reviews/${productId}`
      );
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
        setStats(data.stats);
        setTotalReviews(data.totalReviews);
      }
    } catch (error) {
      console.error("Error fetching reviews:", error);
    }
  };

  useEffect(() => {
    if (productId) {
      fetchReviews();
    }
  }, [productId]);

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold mb-4">Customer Reviews</h2>
      <p className="mb-6 text-gray-600">Total Reviews: {totalReviews}</p>

      {/* ============================== */}
      {/* 1. DYNAMIC PROGRESS BARS       */}
      {/* ============================== */}
      <div className="mb-8 p-4 bg-gray-50 rounded-lg">
        {REVIEW_OPTIONS.map((option) => {
          const votes = stats[option.id] || 0;
          // Prevent NaN when totalReviews is 0
          const percentage =
            totalReviews > 0 ? (votes / totalReviews) * 100 : 0;

          return (
            <div key={option.id} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">{option.label}</span>
                <span>
                  {votes} vote(s) ({percentage.toFixed(0)}%)
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                {/* Progress Bar Fill */}
                <div
                  className={`h-full ${option.color}`}
                  style={{
                    width: `${percentage}%`,
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* ============================== */}
      {/* 2. REVIEWS LIST                */}
      {/* ============================== */}
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <p>No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => {
            // Find the dynamic configuration for this specific review's rating
            const rating = REVIEW_OPTIONS.find(
              (opt) => opt.id === review.rating_type
            );

            return (
              <div key={review.review_id} className="border p-4 rounded shadow-sm">
                
                {/* Header (Name, Badge, Date) */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-lg">{review.user_name}</strong>
                    
                    {/* Database usually returns 1/0 for booleans in MySQL */}
                    {(review.is_verified_buyer === 1 || review.is_verified_buyer === true) && (
                      <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-semibold">
                        ✅ Verified Buyer
                      </span>
                    )}
                  </div>
                  <span className="text-gray-500 text-sm">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Rating Badge */}
                {rating && (
                  <span
                    className={`${rating.color} text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-3`}
                  >
                    {rating.label}
                  </span>
                )}

                {/* Comment */}
                <p className="text-gray-700 mb-3">{review.comment}</p>

                {/* Image (If uploaded) */}
                {review.image_url && (
                  <img
                    src={`https://arzoo-saree.onrender.com/uploads/${review.image_url}`}
                    alt="Review"
                    className="w-32 h-32 object-cover rounded-md border"
                  />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ReviewSection;