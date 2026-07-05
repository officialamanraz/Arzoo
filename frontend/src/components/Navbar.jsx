import React, { useState, useEffect } from 'react';
import { indianLanguages } from '../languages'; 
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://arzoo-saree.onrender.com";

// NOTICE: I have added 'language' and 'setLanguage' to the props here
function Navbar({ isDark, toggleDark, currency, setCurrency, rates, ratesError, onSearch, language, setLanguage ,minPrice, setMinPrice, maxPrice, setMaxPrice}) {

  // Sidebar State
  const [open, setOpen] = useState(false);

  // Currency Dropdown State
  const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSettings, setShowSettings] = useState(false);

  // Search bar keyword state
  const [keyword, setKeyword] = useState("");

  // State for token to handle dynamic UI updates
  const token = localStorage.getItem('token');

  // Sidebar Controls
  const openSidebar = () => setOpen(true);
  const closeSidebar = () => setOpen(false);

  // Escape key logic
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') closeSidebar();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Search Logic
  const handleSearch = () => {
    if (onSearch) onSearch(keyword);
  };
  const handleSearchKeyDown = (e) => { if (e.key === 'Enter') handleSearch(); };

  const handleLogout = () => {
    localStorage.removeItem('token'); 
    closeSidebar(); 
    window.location.reload(); 
  };

  const handleSignup = async (e, formData) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (res.ok) {
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        alert("Account created successfully! Welcome to Aman Saare.");
        window.location.href = '/'; 
      } else {
        alert("Signup Failed! Email might already exist.");
      }
    } catch (err) {
      console.error("Signup error:", err);
    }
  };

  const handleSignout = async () => {
    localStorage.removeItem('token'); 
  
  // 2. Apni React state ko khali kar do
  setToken(null); 
  
  // 3. User ko Home page ya Login page par bhej do
  window.location.href = '/login';
  }


 // Add this dynamic array right above your return statement
  const navLinks = [
    { title: 'Home', path: '/' },
    { title: 'Products', path: '/products' },
    { title: 'About Us', path: '/about' },
    { title: 'Contact Us', path: '/contact' }
  ];

  return (
    <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 5%', background: 'var(--glass-bg)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 1000, width: '100%', border: 'none', outline: 'none' }}>

      {/* 1. LEFT SIDE (Menu + Logo + Dynamic Links) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '25px', border: 'none', outline: 'none' }}>
        <button onClick={openSidebar} aria-label="Open menu" style={{ background: 'none', border: 'none', outline: 'none', fontSize: '26px', cursor: 'pointer', color: 'var(--primary)' }}>
          ☰
        </button>
        <Link to="/" style={{ fontSize: '26px', fontWeight: 'bold', textDecoration: 'none', color: 'var(--primary)', letterSpacing: '1px', border: 'none', outline: 'none' }}>
          Arzoo Saree
        </Link>
        
        {/* Dynamic Top Navigation */}
        {navLinks.map((link, index) => (
          <Link key={index} to={link.path} style={{ textDecoration: 'none', color: 'var(--text-dark)', fontWeight: '600', fontSize: '16px', border: 'none', outline: 'none' }}>
            {link.title}
          </Link>
        ))}
      </div>

      {/* 2. MIDDLE (Search Box) */}
      <div style={{ display: 'flex', flex: 1, maxWidth: '400px', background: 'var(--bg-light)', borderRadius: '50px', overflow: 'hidden', border: 'none', outline: 'none' }}>
        <input
          type="text"
          placeholder="Search saare..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={handleSearchKeyDown}
          style={{ flex: 1, padding: '12px 20px', border: 'none', outline: 'none', background: 'transparent', color: 'var(--text-dark)', fontSize: '15px' }}
        />
        <button onClick={handleSearch} style={{ background: 'var(--primary)', color: 'white', border: 'none', outline: 'none', padding: '0 25px', cursor: 'pointer', fontWeight: 'bold', fontSize: '15px' }}>
          Search
        </button>
      </div>

      {/* 3. RIGHT SIDE (Language + Currency + Cart + Dark Mode) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', border: 'none', outline: 'none' }}>
        
        {/* ==============================
            A. LANGUAGE SELECTOR (ALAG)
            ============================== */}
        <select 
          onChange={(e) => { if (setLanguage) setLanguage(e.target.value); }} 
          value={language || 'en'}
          style={{ padding: '6px 10px', borderRadius: '5px', border: '1px solid var(--border)', background: 'var(--bg-light)', color: 'var(--text-dark)', cursor: 'pointer', outline: 'none', fontSize: '14px', fontWeight: '500' }}
          title="Select Language"
        >
          {indianLanguages && indianLanguages.map((lang) => (
            <option key={lang.code} value={lang.code}>{lang.name}</option>
          ))}
        </select>

        {/* ==============================
            B. CURRENCY SELECTOR (ALAG)
            ============================== */}
        <div style={{ position: 'relative' }}>
          <div
            onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
            style={{ padding: '6px 10px', borderRadius: '5px', border: '1px solid var(--border)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--bg-light)', color: 'var(--text-dark)', fontSize: '14px' }}
            title="Change Currency"
          >
            <strong>{currency}</strong>
            <span style={{ fontSize: '10px' }}>{isCurrencyOpen ? '▲' : '▼'}</span>
          </div>

          {/* Currency Dropdown List Box */}
          {isCurrencyOpen && (
            <div style={{ position: 'absolute', top: '150%', right: '0', width: '220px', background: 'var(--bg-light)', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', zIndex: 1001, overflow: 'hidden' }}>
              <input
                type="text"
                placeholder="Search currency..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '10px', borderBottom: '1px solid var(--border)', outline: 'none', background: 'transparent', color: 'var(--text-dark)' }}
              />
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {ratesError ? (
                  <p style={{ fontSize: '13px', color: 'var(--danger, #c0392b)', padding: '10px' }}>{ratesError}</p>
                ) : rates && Object.keys(rates).length > 0 ? (
                  Object.entries(rates)
                    .filter(([code]) => code.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map(([code, data]) => (
                      <div
                        key={code}
                        onClick={() => {
                          setCurrency(code);
                          setIsCurrencyOpen(false);
                          setSearchQuery("");
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', cursor: 'pointer', borderBottom: '1px solid var(--border)' }}
                      >
                        <img src={data.flag} alt={`${code} flag`} style={{ width: '24px', height: '16px', objectFit: 'cover', borderRadius: '2px', border: '1px solid #ddd' }} />
                        <span style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--text-dark)' }}>{code}</span>
                      </div>
                    ))
                ) : (
                  <p style={{ fontSize: '13px', color: 'var(--text-light)', padding: '10px' }}>Loading currencies...</p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* C. CART BUTTON */}
        <Link to="/cart" aria-label="Go to cart" style={{ textDecoration: 'none', color: 'var(--text-dark)', fontWeight: 'bold', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '5px' }}>
          🛒 Cart
        </Link>
        
        {/* D. DARK MODE TOGGLE */}
        <button onClick={toggleDark} aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"} style={{ background: 'none', border: 'none', outline: 'none', fontSize: '22px', cursor: 'pointer' }}>
          {isDark ? '☀️' : '🌙'}
        </button>

      </div>

      {/* ==========================================
          SIDEBAR OVERLAY & DRAWER
          ========================================== */}
      <div className={`side-overlay ${open ? 'active' : ''}`} onClick={closeSidebar} />

      <div className={`side-sidebar ${open ? 'open' : ''}`}>
        {/* Header (SMART SIGN IN/OUT) */}
        <div className="side-sidebar-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
            <span className="user-icon">👤</span>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {token ? (
                <>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Hello, Welcome</h3>
                  <button
                    onClick={handleSignout}
                    style={{ background: 'none', border: 'none', color: '#ffdac1', cursor: 'pointer', padding: '4px 0 0 0', textAlign: 'left', fontSize: '14px', fontWeight: 'bold', textDecoration: 'underline' }}
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link to="/signup" onClick={closeSidebar} style={{ textDecoration: 'none' }}>
                  <h3 style={{ margin: 0, color: '#fff', fontSize: '18px' }}>Hello, Sign In</h3>
                  <span style={{ fontSize: '12px', color: '#ffdac1', marginTop: '2px', display: 'block' }}>Click here to register</span>
                </Link>
              )}
            </div>
          </div>
          <button onClick={closeSidebar} className="side-close-btn" aria-label="Close menu">✕</button>
        </div>

        {/* Sidebar Content Area */}
        <div className="side-sidebar-content">
          
          {/* Quick Links (Dynamic Menu for Sidebar) */}
          <div style={{ padding: '0 20px', marginTop: '10px' }}>
            <h4 style={{ color: 'var(--text-light)', marginBottom: '15px' }}>Menu</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              {navLinks.map((link, index) => (
                <Link key={index} to={link.path} onClick={closeSidebar} className="admin-link">
                  {link.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="side-divider"></div>

          {/* Account Links */}
          <div style={{ padding: '0 20px', marginTop: '20px' }}>
            <h4 style={{ color: 'var(--text-light)', marginBottom: '15px' }}>Your Account</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <Link to="/admin" onClick={closeSidebar} className="admin-link">Admin Panel</Link>
              {token ? (
                <>
                  <Link to="/orders" onClick={closeSidebar} className="admin-link">Your Orders</Link>
                  <button onClick={handleLogout} className="logout-btn">Logout</button>
                </>
              ) : (
                <Link to="/login" onClick={closeSidebar} className="admin-link" style={{ color: 'var(--primary)' }}>Login Here</Link>
              )}
            </div>
          </div>

          <div className="side-divider"></div>

          {/* Categories SELECT */}
          <div style={{ padding: '0 20px', marginTop: '20px' }}>
            <h4 style={{ color: 'var(--text-light)', marginBottom: '15px' }}>Shop By Categories</h4>
            <select
              className="premium-select"
              onChange={(e) => {
                if (e.target.value && onSearch) {
                  onSearch(e.target.value);
                  closeSidebar();
                }
              }}
            >
              <option value="">Select Category...</option>
              <option value="party wear">Party Wear</option>
              <option value="casual wear">Casual Wear</option>
              <option value="wedding wear">Wedding Wear</option>
              <option value="festival outfit">Festival Outfit</option>
              <option value="office wear">Office Wear</option>
            </select>
          </div>

          <div className="side-divider"></div>
          {/* Sidebar mein ye add kar */}
   <Link to="/my-orders">📦 My Orders</Link>
          {/* PRICE BUDGET FILTER */}
          <div style={{ padding: '0 20px', marginTop: '20px' }}>
            <h4 style={{ color: 'var(--text-light)', marginBottom: '15px' }}>Filter by Price</h4>
            
            <input 
              type="range" 
              min="0" 
              max="300000" 
              step="1000"
              value={maxPrice || 300000} 
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxPrice(val);
                if(val < minPrice) setMinPrice(0);
              }}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--primary)', marginBottom: '15px' }}
            />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: '45%' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '5px' }}>Min Price</label>
                <select 
                  value={minPrice || 0} 
                  onChange={(e) => setMinPrice(Number(e.target.value))} 
                  className="premium-select"
                  style={{ width: '100%', padding: '8px', fontSize: '14px' }}
                >
                  <option value="10000">Min</option>
                  <option value="25000">25000</option>
                  <option value="50000">50000</option>
                  <option value="75000">75000</option>
                  <option value="100000">100000</option>
                </select>
              </div>
              
              <span style={{ color: 'var(--text-light)', fontSize: '14px', marginTop: '20px' }}>to</span>
              
              <div style={{ width: '45%' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-light)', display: 'block', marginBottom: '5px' }}>Max Price</label>
                <select 
                  value={maxPrice || 300000} 
                  onChange={(e) => setMaxPrice(Number(e.target.value))} 
                  className="premium-select"
                  style={{ width: '100%', padding: '8px', fontSize: '14px' }}
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
    </nav>
  );
}

export default Navbar;