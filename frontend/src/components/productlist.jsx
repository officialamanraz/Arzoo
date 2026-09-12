import React, { useState, useEffect } from 'react';
import './ProductList.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProductList = () => {
  const [sarees, setSarees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSarees = async () => {
      console.log('[ProductList] Initiating fetch request for all products...');
      try {
        const response = await fetch(`${API_BASE_URL}/api/products/all?page=1&limit=10`);
        const result = await response.json();

        console.log('[ProductList] Successfully fetched data:', result);

        if (result.success) {
          setSarees(result.data); 
        } else {
          setError("Failed to load the collection.");
        }
      } catch (err) {
        console.error('[ProductList] Network or server error:', err);
        setError("Unable to connect to the backend server.");
      } finally {
        setLoading(false); 
      }
    };

    fetchSarees();
  }, []);

  if (loading) return <h2 className="loading-state">Loading Aman Saare collection... ⏳</h2>;
  if (error) return <h2 className="error-state">{error}</h2>;

  return (
    <div className="product-list-wrapper">
      <h1 className="product-list-header">Aman Saare - Latest Collection</h1>
      <div className="product-list-grid">
        {sarees.map((saree) => {
          // 🚨 FIX: Backend returns image_url, NOT image
          const finalImageUrl = saree.image_url || saree.thumbnail || '/saare_1.jpeg';

          return (
            <div key={saree.product_id || saree.id} className="product-card-simple">
              <img 
                src={finalImageUrl} // 👈 DIRECTLY using the backend's full URL
                alt={saree.name} 
                className="product-card-img"
                onError={(e) => {
                  console.log(`[ProductList] Failed to load image for product ID: ${saree.id}`);
                  e.target.src = '/saare_1.jpeg';
                }}
              />
              <h3 className="product-card-title">{saree.name}</h3>
              <p className="product-card-desc">{saree.description}</p>
              <h2 className="product-card-price">₹{saree.price}</h2>
              <button className="product-card-btn">Add to Cart</button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ProductList;