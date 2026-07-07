import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for redirection

const API_BASE_URL = `https://arzoo-3.onrender.com';

function RecommendedProducts({ currentProductId, categoryId, subcategoryId }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate(); // Initialize the navigation hook

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        // Build query parameters safely
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

        if (data.success) {
          setProducts(data.data || []);
        }
      } catch (error) {
        console.error("Error fetching recommendations:", error);
      } finally {
        setLoading(false);
      }
    };

    if (currentProductId && categoryId) {
      fetchRecommendations();
    }
  }, [currentProductId, categoryId, subcategoryId]);

  if (loading) {
    return <p style={{ textAlign: 'center', color: '#666' }}>Loading recommendations...</p>;
  }

  if (products.length === 0) {
    return null; // Hide the component if there are no recommendations available
  }

  return (
    <div style={{ marginTop: '60px', paddingTop: '40px', borderTop: '2px solid #eee' }}>
      <h2 style={{ marginBottom: '20px', fontSize: '1.5em', color: '#333' }}>You Might Also Like</h2>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
        gap: '20px'
      }}>
        {products.map((product) => (
          <div
            key={product.product_id}
            onClick={() => navigate(`/product/${product.product_id}`)} // Redirect to product detail page on click
            style={{
              border: '1px solid #eee',
              borderRadius: '12px',
              padding: '15px',
              textAlign: 'center',
              transition: 'transform 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <img
              src={`https://arzoo-3.onrender.com/uploads/${product.image_url || 'saare_1.jpeg'}`} alt="Saree"
              alt={product.name}
              style={{
                width: '100%',
                height: '150px',
                objectFit: 'cover',
                borderRadius: '8px',
                marginBottom: '10px'
              }}
              onError={(e) => e.target.src = '/saare_1.jpeg'}
            />
            <h4 style={{ margin: '10px 0', color: '#333' }}>{product.name}</h4>
            <p style={{ color: '#d63031', fontWeight: 'bold', margin: 0 }}>
              ₹{Number(product.price).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default RecommendedProducts;