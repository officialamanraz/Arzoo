import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './RecommendedProducts.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

function RecommendedProducts({ currentProductId, categoryId, subcategoryId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchRecommendations = async () => {
      console.log(`[RecommendedProducts] Fetching recommendations for Product ID: ${currentProductId}, Category ID: ${categoryId}`);
      
      try {
        const params = new URLSearchParams({
          product_id: currentProductId,
          category_id: categoryId
        });

        if (subcategoryId) {
          params.append('subcategory_id', subcategoryId);
        }

        const response = await fetch(
          `${API_BASE_URL}/api/products/recommendations?${params}`
        );
        const data = await response.json();

        console.log('[RecommendedProducts] Response received:', data);

        if (data.success) {
          setProducts(data.data || []);
        } else {
          console.warn('[RecommendedProducts] Failed to load recommendations:', data.message);
        }
      } catch (error) {
        console.error("[RecommendedProducts] Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId && categoryId) {
      fetchRecommendations();
    } else {
      setLoading(false);
    }
  }, [currentProductId, categoryId, subcategoryId]);

  if (loading) {
    return <p className="recommended-loading">Loading recommendations...</p>;
  }

  if (products.length === 0) {
    return null;
  }

  return (
    <div className="recommended-container">
      <h2 className="recommended-title">You Might Also Like</h2>
      
      <div className="recommended-grid">
        {products.map((product) => (
          <div
            key={product.product_id}
            className="recommended-card"
            onClick={() => {
              console.log(`[RecommendedProducts] Navigating to recommended product ID: ${product.product_id}`);
              navigate(`/product/${product.product_id}`);
              // Ensure the page scrolls to top when a new product is selected
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            <img
              src={`${API_BASE_URL}/uploads/${product.image_url || 'saare_1.jpeg'}`}
              alt={product.name || 'Saree'}
              className="recommended-img"
              onError={(e) => { 
                console.log(`[RecommendedProducts] Image failed to load for product ${product.product_id}. Using fallback.`);
                e.target.src = '/saare_1.jpeg'; 
              }}
            />
            <h4 className="recommended-name">{product.name}</h4>
            <p className="recommended-price">
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedProducts;