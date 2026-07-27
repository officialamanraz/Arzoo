import React, { useState, useEffect } from 'react';
import { indianLanguages } from '../languages';
import { Link } from 'react-router-dom';
import './Navbar.css'; // Extracted CSS

const API_BASE_URL = import.meta.env.VITE_API_URL;

function Navbar({
  isDark, toggleDark, currency, setCurrency, rates, ratesError,
  onSearch, onCategorySelect, language, setLanguage,
  minPrice, setMinPrice, maxPrice, setMaxPrice
}) {

  const [open, setOpen] = useState(false);
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [keyword, setKeyword] = useState("");

  const token = localStorage.getItem('token');

  const openSidebar = () => {
    console.log('[Navbar] Sidebar opened');
    setOpen(true);
  };
  
  const closeSidebar = () => {
    console.log('[Navbar] Sidebar closed');
    setOpen(false);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSearch = () => {
    console.log(`[Navbar] Search triggered -- keyword: "${keyword}"`);
    if (onSearch) onSearch(keyword);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleLogout = () => {
    console.log('[Navbar] Logout -- clearing token and reloading');
    localStorage.removeItem('token');
    closeSidebar();
    window.location.reload();
  };

  const handleSignout = async () => {
    console.log('[Navbar] Signout -- clearing token, redirecting to /login');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const handleCategoryChange = (e) => {
    const categoryId = e.target.value;
    const categoryName = e.target.options[e.target.selectedIndex]?.text || "";

    if (!categoryId) return;
    console.log(`[Navbar] Category selected -- id: ${categoryId}, name: "${categoryName}"`);

    if (onCategorySelect) {
      onCategorySelect(categoryId, categoryName);
    } else {
      console.warn('[Navbar] onCategorySelect prop missing -- falling back to URL redirect');
      window.location.href = `/products?subcategory=${categoryId}`;
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
      <nav className="navbar">
        
        {/* 1. LEFT SIDE */}
        <div className="nav-left">
          <button className="menu-btn" onClick={openSidebar} aria-label="Open menu">
            ☰
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

        {/* 2. CENTER */}
        <div className="nav-center">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search saree..."
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

        {/* 3. RIGHT SIDE */}
        <div className="nav-right">
          
          {/* Language selector */}
          <select
            className="lang-select"
            onChange={(e) => {
              console.log(`[Navbar] Language changed to: ${e.target.value}`);
              if (setLanguage) setLanguage(e.target.value);
            }}
            value={language || 'en'}
            title="Select Language"
          >
            {indianLanguages && indianLanguages.map((lang) => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>

          {/* Currency selector */}
          <div className="currency-dropdown-container">
            <div
              className="currency-toggle"
              onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
              title="Change Currency"
            >
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
                    Object.entries(rates)
                      .filter(([code]) => code.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(([code, data]) => (
                        <div
                          key={code}
                          className="currency-item"
                          onClick={() => {
                            console.log(`[Navbar] Currency changed to: ${code}`);
                            setCurrency(code);
                            setIsCurrencyOpen(false);
                            setSearchQuery("");
                          }}
                        >
                          <img src={data.flag} alt={`${code} flag`} className="currency-flag" />
                          <span className="currency-code">{code}</span>
                        </div>
                      ))
                  ) : (
                    <p className="currency-loading">Loading currencies...</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <Link to="/cart" aria-label="Go to cart" className="cart-link">
            🛒 <span className="cart-text">Cart</span>
          </Link>

          <button className="theme-toggle" onClick={toggleDark} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}>
            {isDark ? '☀️' : '🌙'}
          </button>
        </div>
      </nav>

      {/* ==========================================
          SIDEBAR OVERLAY & DRAWER
          ========================================== */}
      <div className={`side-overlay ${open ? 'active' : ''}`} onClick={closeSidebar} />

      <div className={`side-sidebar ${open ? 'open' : ''}`}>
        <div className="side-sidebar-header">
          <div className="sidebar-user-info">
            <span className="user-icon">👤</span>
            <div className="user-details">
              {token ? (
                <>
                  <h3>Hello, Welcome</h3>
                  <button onClick={handleSignout} className="signout-btn">
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/signup" onClick={closeSidebar} className="signin-link">
                  <h3>Hello, Sign In</h3>
                  <span>Click here to register</span>
                </Link>
              )}
            </div>
          </div>
          <button onClick={closeSidebar} className="side-close-btn" aria-label="Close menu">✕</button>
        </div>

        <div className="side-sidebar-content">
          
          {/* Account Section */}
          <div className="sidebar-section">
            <h4>Your Account</h4>
            <div className="sidebar-links">
              <Link to="/admin" onClick={closeSidebar} className="sidebar-link">Admin Panel</Link>
              {token ? (
                <>
                  <Link to="/orders" onClick={closeSidebar} className="sidebar-link">Your Orders</Link>
                  <button onClick={handleLogout} className="sidebar-logout-btn">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={closeSidebar} className="sidebar-link primary-text">Login Here</Link>
              )}
            </div>
          </div>

          <div className="side-divider"></div>

          {/* Categories Section */}
          <div className="sidebar-section">
            <h4>Shop By Categories</h4>
            <select
              className="premium-select"
              onChange={handleCategoryChange}
              defaultValue=""
            >
              <option value="">Select Category...</option>
              <option value="1">Bridal Wear</option>
              <option value="2">Casual Wear</option>
              <option value="3">Party Wear</option>
              <option value="4">Festival Outfit</option>
              <option value="5">Office Wear</option>
            </select>
          </div>

          <div className="side-divider"></div>
          
          <Link to="/my-orders" className="sidebar-direct-link" onClick={closeSidebar}>
            📦 My Orders
          </Link>
          
          <div className="side-divider"></div>

          {/* Price Filter Section */}
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
                <select
                  value={minPrice || 0}
                  onChange={(e) => setMinPrice(Number(e.target.value))}
                  className="premium-select small-select"
                >
                  <option value="10000">Min</option>
                  <option value="25000">25000</option>
                  <option value="50000">50000</option>
                  <option value="75000">75000</option>
                  <option value="100000">100000</option>
                </select>
              </div>

              <span className="price-separator">to</span>

              <div className="price-input-group">
                <label>Max Price</label>
                <select
                  value={maxPrice || 300000}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="premium-select small-select"
                >
                  <option value="120000">120000</option>
                  <option value="150000">150000</option>
                  <option value="175000">175000</option>
                  <option value="200000">200000</option>
                  <option value="250000">250000</option>
                  <option value="275000">275000</option>
                  <option value="300000">300000</option>
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