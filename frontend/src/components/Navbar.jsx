import React, { useState, useEffect } from 'react';
import { indianLanguages } from '../languages';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function Navbar({
  isDark, toggleDark, currency, setCurrency, rates, ratesError,
  onSearch, onCategorySelect, onSubcategorySelect, language, setLanguage,
  minPrice, setMinPrice, maxPrice, setMaxPrice
}) {
  const [open, setOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyword, setKeyword] = useState("");

  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const [subcategories, setSubcategories] = useState([]);
  const [isLoadingSubcategories, setIsLoadingSubcategories] = useState(false);

  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const role = localStorage.getItem('role'); // Added to check for admin
  const navigate = useNavigate();

  // Fetch top-level categories once, on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await response.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('[Navbar] Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Fetch subcategories whenever the selected category changes.
  // Clears the subcategory list immediately if no category is selected.
  useEffect(() => {
    if (!selectedCategoryId) {
      setSubcategories([]);
      return;
    }

    const fetchSubcategories = async () => {
      setIsLoadingSubcategories(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/categories/get-subcategories/${selectedCategoryId}`);
        const data = await response.json();
        setSubcategories(data.success ? data.data : []);
      } catch (error) {
        console.error('[Navbar] Failed to fetch subcategories:', error);
        setSubcategories([]);
      } finally {
        setIsLoadingSubcategories(false);
      }
    };

    fetchSubcategories();
  }, [selectedCategoryId]);

  const openSidebar = () => setOpen(true);
  const closeSidebar = () => setOpen(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = () => {
    if (onSearch) {
      onSearch(keyword);
    } else {
      navigate(`/products?search=${keyword}`);
    }
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('role');
    closeSidebar();
    window.location.reload();
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const categoryName = e.target.options[e.target.selectedIndex]?.text || "";

    setSelectedCategoryId(categoryId);

    if (!categoryId) return;

    if (onCategorySelect) {
      onCategorySelect(categoryId, categoryName);
    } else {
      window.location.href = `/products?category=${categoryId}`;
    }
  };

  const handleSubcategoryChange = (e) => {
    const subcategoryId = e.target.value;
    const subcategoryName = e.target.options[e.target.selectedIndex]?.text || "";

    if (!subcategoryId) return;

    if (onSubcategorySelect) {
      onSubcategorySelect(subcategoryId, subcategoryName);
    } else {
      navigate(`/products?subcategory=${subcategoryId}`);
    }

    closeSidebar();
  };

  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Products', path: '/products' },
    { title: 'About Us', path: '/about' },
    { title: 'Contact Us', path: '/contact' }
  ];

  return (
    <>
      <nav className={`navbar ${isDark ? 'dark-theme' : ''}`}>

        {/* LEFT SIDE */}
        <div className="nav-left">
          <button className="menu-btn" onClick={openSidebar} aria-label="Open menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>

          <Link to="/" className="nav-logo">
            Arzoo Saree
          </Link>

          <div className="nav-links">
            {navLinks.map((link, index) => (
              <Link key={index} to={link.path} className="nav-link">
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        {/* CENTER SEARCH */}
        <div className="nav-center">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search beautiful sarees..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              className="search-input"
            />
            <button onClick={handleSearch} className="search-btn">
              Search
            </button>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="nav-right">
          <select
            className="lang-select"
            onChange={(e) => setLanguage && setLanguage(e.target.value)}
            value={language || 'en'}
            title="Select Language"
          >
            {indianLanguages && indianLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>

          <div className="currency-dropdown-container">
            <div className="currency-toggle" onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}>
              <strong>{currency}</strong>
              <span className="caret-icon">{isCurrencyOpen ? '▲' : '▼'}</span>
            </div>

            {isCurrencyOpen && (
              <div className="currency-menu">
                <input
                  type="text"
                  placeholder="Search currency..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="currency-search-input"
                />
               <div className="currency-list">
                  {ratesError ? (
                    <p className="currency-error">{ratesError}</p>
                  ) : rates && Object.keys(rates).length > 0 ? (
                    <>
                      {/* 🚨 FIX: Hardcoded INR always at the top */}
                      {"INR".toLowerCase().includes(searchQuery.toLowerCase()) && (
                        <div
                          className="currency-item"
                          onClick={() => {
                            setCurrency("INR");
                            setIsCurrencyOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <span className="currency-flag" style={{ fontSize: "1.2rem", marginRight: "8px" }}>🇮🇳</span>
                          <span className="currency-code">INR</span>
                        </div>
                      )}

                      {/* Your existing API currencies */}
                      {Object.entries(rates)
                        .filter(([code]) => code.toLowerCase().includes(searchQuery.toLowerCase()) && code !== "INR") // Added code !== "INR" to prevent duplicates
                        .map(([code, data]) => (
                          <div
                            key={code}
                            className="currency-item"
                            onClick={() => {
                              setCurrency(code);
                              setIsCurrencyOpen(false);
                              setSearchQuery("");
                            }}
                          >
                            <img src={data.flag} alt={`${code} flag`} className="currency-flag" />
                            <span className="currency-code">{code}</span>
                          </div>
                        ))}
                    </>
                  ) : (
                    <p className="currency-loading">Loading currencies...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" aria-label="Go to cart" className="cart-link">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="9" cy="21" r="1"></circle>
              <circle cx="20" cy="21" r="1"></circle>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
            </svg>
            <span className="cart-text">Cart</span>
          </Link>

          <button className="theme-toggle" onClick={toggleDark}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* SIDEBAR DRAWER */}
      <div className={`side-overlay ${open ? 'active' : ''}`} onClick={closeSidebar} />

      <div className={`side-sidebar ${open ? 'open' : ''} ${isDark ? 'dark-theme' : ''}`}>
        <div className="side-sidebar-header">
          <div className="sidebar-user-info">
            <div className="user-avatar">
              {token && user.profile_image ? (
                <img src={user.profile_image} alt="User" className="sidebar-profile-img" />
              ) : (
                <span className="user-icon">👤</span>
              )}
            </div>

            <div className="user-details">
              {token ? (
                <>
                  {/* Updated to show username if available, then name, then 'User' */}
                  <h3>Welcome, {user.username || user.name || 'User'}</h3>
                  <button onClick={handleLogout} className="signout-btn">Sign Out</button>
                </>
              ) : (
                <Link to="/signup" onClick={closeSidebar} className="signin-link">
                  <h3>Welcome, Guest</h3>
                  <span>Click here to register</span>
                </Link>
              )}
            </div>
          </div>
          <button onClick={closeSidebar} className="side-close-btn" aria-label="Close menu">✕</button>
        </div>

        <div className="side-sidebar-content">
          <div className="sidebar-section">
            <h4>Your Account</h4>
            <div className="sidebar-links">
              
              {/* Admin Panel is now conditionally rendered ONLY for admins */}
              {role === 'admin' && (
                <Link to="/admin" onClick={closeSidebar} className="sidebar-link">
                  <span className="link-icon">⚙️</span> Admin Panel
                </Link>
              )}
              
              {token ? (
                <>
                  {/* New Update Profile Link */}
                  <Link to="/profile" onClick={closeSidebar} className="sidebar-link">
                    <span className="link-icon">👤</span> Update Profile
                  </Link>
                  <Link to="/my-orders" onClick={closeSidebar} className="sidebar-link">
                    <span className="link-icon">📦</span> My Orders
                  </Link>
                </>
              ) : (
                <Link to="/login" onClick={closeSidebar} className="sidebar-link primary-text">
                  Login to your account
                </Link>
              )}
            </div>
          </div>

          <div className="side-divider"></div>

          <div className="sidebar-section">
            <h4>Shop By Category</h4>
            <select className="premium-select" onChange={handleCategoryChange} value={selectedCategoryId}>
              <option value="">Select a Category...</option>
              {categories.map((cat) => (
                <option key={cat.category_id} value={cat.category_id}>
                  {cat.name}
                </option>
              ))}
            </select>

            {/* Subcategory dropdown only appears once a category is selected */}
            {selectedCategoryId && (
              <select
                className="premium-select subcategory-select"
                onChange={handleSubcategoryChange}
                defaultValue=""
                disabled={isLoadingSubcategories}
              >
                <option value="">
                  {isLoadingSubcategories ? 'Loading subcategories...' : 'Select a Subcategory...'}
                </option>
                {subcategories.map((sub) => (
                  <option key={sub.subcategory_id} value={sub.subcategory_id}>
                    {sub.subcategory_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="side-divider"></div>

          <div className="sidebar-section">
            <h4>Filter by Price</h4>
            <input
              type="range"
              min="0"
              max="300000"
              step="1000"
              value={maxPrice || 300000}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPrice(val);
                if (val < minPrice) setMinPrice(0);
              }}
              className="price-slider"
            />

            <div className="price-inputs-container">
              <div className="price-input-group">
                <label>Min Price</label>
                <select value={minPrice || 0} onChange={(e) => setMinPrice(Number(e.target.value))} className="premium-select small-select">
                  <option value="0">₹0</option>
                  <option value="10000">₹10K</option>
                  <option value="25000">₹25K</option>
                  <option value="50000">₹50K</option>
                  <option value="75000">₹75K</option>
                  <option value="100000">₹100K</option>
                </select>
              </div>
              <span className="price-separator">-</span>
              <div className="price-input-group">
                <label>Max Price</label>
                <select value={maxPrice || 300000} onChange={(e) => setMaxPrice(Number(e.target.value))} className="premium-select small-select">
                  <option value="50000">₹50K</option>
                  <option value="100000">₹100K</option>
                  <option value="150000">₹150K</option>
                  <option value="200000">₹200K</option>
                  <option value="300000">₹300K+</option>
                </select>
              </div>
            </div>
          </div>
          <div className="side-divider"></div>
        </div>
      </div>
    </>
  );
}

export default Navbar;