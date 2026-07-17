import React, { useEffect, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Dynamic style definitions mapped to your backend rating fields
const OPTION_UI_CONFIG = {
  skip: { label: "Skip It", color: "bg-red-500" },
  timepass: { label: "Timepass", color: "bg-yellow-500" },
  go_for_it: { label: "Go For It", color: "bg-blue-500" },
  perfection: { label: "Perfection!", color: "bg-green-500" },
};

const ReviewSection = ({ productId }) => {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({});
  const [totalReviews, setTotalReviews] = useState(0);

  const fetchReviews = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reviews/${productId}`);
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
        {Object.keys(stats || {}).map((optionId) => {
          const votes = stats[optionId] || 0;
          const percentage = totalReviews > 0 ? (votes / totalReviews) * 100 : 0;
          
          // Safe lookup matching config properties directly to your dataset keys
          const uiConfig = OPTION_UI_CONFIG[optionId] || { 
            label: optionId.replace(/_/g, " "), 
            color: "bg-gray-500" 
          };

          return (
            <div key={optionId} className="mb-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold capitalize">{uiConfig.label}</span>
                <span>
                  {votes} vote(s) ({percentage.toFixed(0)}%)
                </span>
              </div>

              {/* Progress Bar Track */}
              <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                {/* Progress Bar Fill */}
                <div
                  className={`h-full ${uiConfig.color}`}
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
      <div className="flex flex-col gap-4">
        {reviews.length === 0 ? (
          <p>No reviews yet. Be the first to review!</p>
        ) : (
          reviews.map((review) => {
            // Resolves lookups on the fly using your schema values directly
            const uiConfig = OPTION_UI_CONFIG[review.rating_type] || {
              label: review.rating_type ? review.rating_type.replace(/_/g, " ") : "Rating",
              color: "bg-gray-500",
            };

            return (
              <div key={review.review_id} className="border p-4 rounded shadow-sm">
                
                {/* Header (Name, Badge, Date) */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <strong className="text-lg">{review.user_name}</strong>
                    
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
                <span
                  className={`${uiConfig.color} text-white px-3 py-1 rounded-full text-xs font-bold inline-block mb-3 capitalize`}
                >
                  {uiConfig.label}
                </span>

                {/* Comment */}
                <p className="text-gray-700 mb-3">{review.comment}</p>

                {/* Image (If uploaded) */}
                {review.image_url && (
                  <img
                    src={`${API_BASE_URL}/uploads/${review.image_url}`}
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