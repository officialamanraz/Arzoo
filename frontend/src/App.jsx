import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";

// 🚨 FIX 1: Imported pure Vanilla Lenis instead of the broken React wrapper
import Lenis from 'lenis';
import 'lenis/dist/lenis.css'; // Automatically applies required smooth scroll CSS

import "./App.css";
import "./theme.css";

// Components
import OrderDetail from './components/OrderDetail';
import AdminSwitcher from './components/AdminSwitcher';
import Checkout from './components/checkoutpage';
import AdminInventory from "./components/AdminInventory";
import AdminAddProduct from "./components/AdminAddProduct";
import AdminBanners from "./components/AdminBanners";
import AddressForm from './components/Addressform';
import OrderSummary from './components/ordersummary';
import OrderTracking from './components/OrderTracking';
import UserOrders from './components/UserOrders';
import AdminOrders from './components/AdminOrders';
import Navbar from "./components/Navbar";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Home from "./components/Home";
import ProductDetail from "./components/ProductDetail";
import AdminPage from "./components/AdminPage";
import Login from "./components/Login";
import Signup from "./components/signup";
import ProtectedRoute from "./components/ProtectedRoute";
import CartPage from "./components/Cartpage";
import About from './components/About';
import Contact from './components/contact';
import AdminRoute from "./components/AdminRoute";
import Profile from './components/Profile';

// 🤝 NEW: Dealer Management & Portal Components
import AdminDealers from "./components/AdminDealers";
import AdminDealerDetail from "./components/AdminDealerDetail";
import AdminAddDealer from "./components/AdminAddDealer";

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const [sarees, setSarees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubcategory, setSelectedSubcategory] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState("INR");
  const [rates, setRates] = useState({});
  const [ratesError, setRatesError] = useState(null);
  const [minprice, setMinprice] = useState(0);
  const [maxprice, setMaxprice] = useState(300000);
  const [selectedSubcategoryName, setSelectedSubcategoryName] = useState("");
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    return savedTheme === "dark";
  });

  // 🚀 Component Lifecycle Log
  useEffect(() => {
    console.log("[APP] 🚀 Root App component successfully mounted with Dealer & Admin routes.");
  }, []);

  // 🚨 FIX 2: Vanilla Lenis Implementation (Zero React Conflicts!)
  useEffect(() => {
    console.log("[APP] 🌀 Initializing Vanilla Lenis Smooth Scroll...");
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      console.log("[APP] 🌀 Destroying Lenis instance on unmount.");
      lenis.destroy();
    };
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const trackingRef = urlParams.get('ref');

    if (trackingRef) {
      sessionStorage.setItem('tracking_ref', trackingRef);
      console.log("[APP] 📌 Tracking ID saved:", trackingRef);
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);

  useEffect(() => {
    console.log(`[APP] 🌓 Dark mode toggled -- isDark: ${isDark}`);
    const root = document.documentElement;

    if (isDark) {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  useEffect(() => {
    let isMounted = true;

    const fetchCurrencyData = async () => {
      console.log(`[APP] 💱 Fetching currency rates from ${API_BASE_URL}/api/Currency/Rate-change`);
      try {
        const response = await fetch(`${API_BASE_URL}/api/Currency/Rate-change`);
        if (!response.ok) throw new Error("Failed to fetch currency rates.");
        const data = await response.json();

        if (!data['INR']) {
          data['INR'] = { rate: 1 }; 
        }

        if (isMounted) {
          setRates(data);
          setRatesError(null);
          console.log(`[APP] ✅ Currency rates loaded -- ${Object.keys(data).length} currencies`);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[APP] ❌ Currency fetch error:", err);
          setRatesError("Could not load currency rates. Showing prices in INR.");
        }
      }
    };

    fetchCurrencyData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Main Product Fetching Logic
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    let url = `${API_BASE_URL}/api/products/all?page=${currentPage}&limit=12`;
    let fetchMode = "default-listing";

    if (searchKeyword) {
      url = `${API_BASE_URL}/api/products/search?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}&limit=12`;
      fetchMode = "keyword-search";
    }
    else if (selectedSubcategory) { 
      url = `${API_BASE_URL}/api/categories/subcategory-products/${selectedSubcategory}`;
      fetchMode = "subcategory-filter";
    }
    else if (selectedCategory) {
      url = `${API_BASE_URL}/api/categories/subcategory-products/${selectedCategory}`;
      fetchMode = "category-filter";
    }
    else if (minprice && maxprice) {
      url = `${API_BASE_URL}/api/products/all?page=${currentPage}&limit=12&min=${minprice}&max=${maxprice}`;
      fetchMode = "price-range";
    }

    console.log(`[APP] 🛍️ Fetching products -- mode: ${fetchMode}, page: ${currentPage}, url: ${url}`);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend API not found (status ${res.status}).`);
        return res.json();
      })
      .then(async (result) => {
        if (!isMounted) return;

        let finalData = result.data || result.products || result || [];

        if (language !== 'en' && finalData.length > 0) {
          try {
            console.log(`[APP] 🌐 Translating ${finalData.length} products to ${language}...`);
            finalData = await Promise.all(finalData.map(async (item) => {
              const originalName = item.name || item.title;
              const translatedName = await translateText(originalName, language);
              return { ...item, name: translatedName, title: translatedName };
            }));
          } catch (err) {
            console.error("[APP] ⚠️ Translation API failed for this batch:", err);
          }
        }

        if (isMounted) {
          setSarees(finalData);

          if (result.totalPages) {
            setTotalPages(result.totalPages);
          } else if (result.total) {
            setTotalPages(Math.ceil(result.total / 12));
          } else if (finalData.length === 12) {
            setTotalPages(currentPage + 1); 
          } else if (finalData.length > 12) {
            setTotalPages(Math.ceil(finalData.length / 12));
          } else {
            setTotalPages(currentPage); 
          }

          setLoading(false);
          console.log(`[APP] ✅ Successfully loaded ${finalData.length} products.`);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`[APP] ❌ Error fetching sarees -- mode: ${fetchMode}:`, err);
          setError("Failed to load products. Please check the backend connection.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchKeyword, selectedCategory, selectedSubcategory, minprice, maxprice, language]);

  const handleSearch = (keyword) => {
    console.log(`[APP] 🔍 Search triggered for keyword: "${keyword}"`);
    setSearchKeyword(keyword);
    setSelectedCategory("");
    setSelectedSubcategory("");
    setSelectedCategoryName("");
    setSelectedSubcategoryName("");
    setCurrentPage(1);
  };

  const handleCategorySelect = (categoryId, categoryName = "") => {
    console.log(`[APP] 📂 Category selected: ID ${categoryId} (${categoryName})`);
    setSelectedCategory(categoryId);
    setSelectedSubcategory(""); 
    setSelectedCategoryName(categoryName);
    setSelectedSubcategoryName("");
    setSearchKeyword("");
    setCurrentPage(1);
  };

  const handleSubcategorySelect = (subcategoryId, subcategoryName) => {
    console.log(`[APP] 📂 Subcategory selected: ID ${subcategoryId} (${subcategoryName})`);
    setSelectedSubcategory(subcategoryId);
    setSelectedSubcategoryName(subcategoryName);
    setSearchKeyword("");
    setCurrentPage(1);
  };

  return (
    <>
      <Navbar
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        onSearch={handleSearch}
        onCategorySelect={handleCategorySelect}
        onSubcategorySelect={handleSubcategorySelect}
        currency={currency}
        setCurrency={setCurrency}
        rates={rates}
        ratesError={ratesError}
        language={language}
        setLanguage={setLanguage}
        minPrice={minprice}
        setMinPrice={setMinprice}
        maxPrice={maxprice}
        setMaxPrice={setMaxprice}
      />

      <AdminSwitcher />

      <Routes>
        {/* =========================================
           PUBLIC / CUSTOMER ROUTES
           ========================================= */}
        <Route
          path="/"
          element={
            <Home
              sarees={sarees}
              loading={loading}
              error={error}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              keyword={searchKeyword}
              categoryName={selectedCategoryName}
              subcategoryName={selectedSubcategoryName}
              currency={currency}
              rates={rates}
              language={language}
              totalPages={totalPages}
            />
          }
        />

        <Route path="/product/:id" element={<ProductDetail sarees={sarees} currency={currency} rates={rates} language={language} />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* =========================================
           AUTHENTICATION & USER PROFILE ROUTES
           ========================================= */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/my-orders" element={<ProtectedRoute><UserOrders /></ProtectedRoute>} />
        <Route path="/add-address" element={<ProtectedRoute><AddressForm /></ProtectedRoute>} />
        <Route path="/order-summary" element={<ProtectedRoute><OrderSummary /></ProtectedRoute>} />
        <Route path="/payment" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
        <Route path="/track-order/:orderId" element={<OrderTracking />} />

        {/* =========================================
           ADMIN PANEL ROUTES
           ========================================= */}
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
        <Route path="/admin/add-product" element={<AdminRoute><AdminAddProduct /></AdminRoute>} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />
        <Route path="/admin/orders/:id" element={<OrderDetail />} />
<Route path="/admin/dealer/edit/:id" element={<AdminRoute><AdminAddDealer /></AdminRoute>} />
        {/* 🤝 NEW ADMIN DEALER MANAGEMENT ROUTES */}
<Route path="/admin/dealers" element={<AdminRoute><AdminDealers /></AdminRoute>} />
<Route path="/admin/dealer/:id" element={<AdminRoute><AdminDealerDetail /></AdminRoute>} />
<Route path="/admin/add-dealer" element={<AdminRoute><AdminAddDealer /></AdminRoute>} /> {/* 👈 NAYA ROUTE */}
        {/* =========================================
           DEALER PORTAL ROUTES
           ========================================= */}
        {/* Protected view for individual dealers to inspect earnings and masked payouts */}
      </Routes>
    </>
  );
}

export default App;