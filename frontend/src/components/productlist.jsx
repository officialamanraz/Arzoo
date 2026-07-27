import React, { useState, useEffect } from 'react';
import { getImageUrl } from '../getImageUrl'; // agar components/ folder se import kar rahe ho
import './ProductList.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ProductList = () => {
  // State to store sarees data (initially empty array)
  const [sarees, setSarees] = useState([]);
  
  // Loading and Error states
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch data immediately when the page loads
  useEffect(() => {
    const fetchSarees = async () => {
      console.log('[ProductList] Initiating fetch request for all products...');
      try {
        // Fetching from the backend URL
        const response = await fetch(`${API_BASE_URL}/api/products/all?page=1&limit=10`);
        const result = await response.json();


        console.log('[ProductList] Successfully fetched data:', result);

        if (result.success) {
          // Save the fetched array into state
          setSarees(result.data); 
        } else {
          console.warn('[ProductList] Backend returned failure status:', result);
          setError("Failed to load the collection.");
        }
      } catch (err) {
        console.error('[ProductList] Network or server error:', err);
        setError("Unable to connect to the backend server.");
      } finally {
        // Stop loading once data is fetched or an error occurs
        setLoading(false); 
      }
    };

    fetchSarees();
  }, []); // Empty array ensures this only runs once on mount

  // Show loading state while data is being fetched
  if (loading) {
    return <h2 className="loading-state">Loading Aman Saare collection... ⏳</h2>;
  }
  
  // Show error if server is down or request fails
  if (error) {
    return <h2 className="error-state">{error}</h2>;
  }

  // Render the data in React
  return (
    <div className="product-list-wrapper">
      <h1 className="product-list-header">Aman Saare - Latest Collection</h1>
      
      {/* Product Grid */}
      <div className="product-list-grid">
        
        {/* Use .map() to loop through the sarees array */}
        {sarees.map((saree) => (
          <div key={saree.id} className="product-card-simple">
            
            {/* Image URL from the backend's static folder */}
            <img 
            src={getImageUrl(saree.image)}
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
            
            <button 
              className="product-card-btn"
              onClick={() => console.log(`[ProductList] Add to Cart clicked for ID: ${saree.id}`)}
            >
              Add to Cart
            </button>
          </div>
        ))}

      </div>
    </div>
  );
};

export default ProductList;