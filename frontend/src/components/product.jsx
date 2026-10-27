import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './CategoryCards.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function CategoryCards({ onCategorySelect, isDark = false }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/products`);
        const result = await response.json();

        if (isMounted && result.success && Array.isArray(result.data)) {
          setCategories(result.data);
        }
      } catch (err) {
        console.error('[CATEGORY_CARDS] Error fetching category cards:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchCategories();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleCardClick = (catId, catName) => {
    if (onCategorySelect) {
      onCategorySelect(String(catId), catName);
    } else {
      navigate(`/?category=${catId}&categoryName=${encodeURIComponent(catName)}#product`);
    }
  };

  if (!loading && categories.length === 0) {
    return null;
  }

  return (
    <section className={`category-showcase-section ${isDark ? 'dark-theme' : ''}`}>
      <div className="category-header-wrap">
        <div>
          <h2 className="category-header-title">Curated Collections</h2>
          <span className="category-header-subtitle">Select a fabric to explore traditional designs</span>
        </div>
      </div>

      <div className="category-strip-track">
        {loading
          ? Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="cat-card-item">
                <div className="cat-skeleton" />
                <div className="cat-text-skeleton" />
              </div>
            ))
          : categories.map((cat) => (
              <button
                type="button"
                key={cat.category_id}
                className="cat-card-item"
                onClick={() => handleCardClick(cat.category_id, cat.name)}
                title={`Explore ${cat.name}`}
              >
                <div className="cat-img-box">
                  <div className="cat-inner-circle">
                    <img
                      src={cat.category_image || '/saare_1.jpeg'}
                      alt={cat.name}
                      className="cat-thumb-img"
                      onError={(e) => {
                        e.target.src = '/saare_1.jpeg';
                      }}
                    />
                  </div>
                </div>
                <span className="cat-name-label">{cat.name}</span>
              </button>
            ))}
      </div>
    </section>
  );
}

export default CategoryCards;