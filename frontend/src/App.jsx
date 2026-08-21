import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./theme.css";

// Components
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

const API_BASE_URL = import.meta.env.VITE_API_URL;

function App() {
  const [sarees, setSarees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedCategoryName, setSelectedCategoryName] = useState("");
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState("INR");
  const [rates, setRates] = useState({});
  const [ratesError, setRatesError] = useState(null);
  const [minprice, setMinprice] = useState(0);
  const [maxprice, setMaxprice] = useState(300000);
  
  // 1. Initial load par localStorage check karega
  const [isDark, setIsDark] = useState(() => {
    const savedTheme = localStorage.getItem("theme");
    // Agar localStorage mein 'dark' save hai, toh true dega, warna false
    return savedTheme === "dark"; 
  });

  useEffect(() => {
    // 1. Current URL se parameters nikalo
    const urlParams = new URLSearchParams(window.location.search);
    const trackingRef = urlParams.get('ref');

    // 2. Agar 'ref' milta hai, toh sessionStorage mein save karo
    if (trackingRef) {
      sessionStorage.setItem('tracking_ref', trackingRef);
      console.log("Tracking ID saved:", trackingRef);

      // 3. URL se '?ref=ABC' hata do taaki URL clean ho jaye
      const cleanUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
      window.history.replaceState({ path: cleanUrl }, '', cleanUrl);
    }
  }, []);
  
  // Dark mode toggle
  useEffect(() => {
    console.log(`[APP] Dark mode toggled -- isDark: ${isDark}`);
    
    // documentElement ka matlab hai <html> tag, jo body se zyada safe hai
    const root = document.documentElement; 

    if (isDark) {
        root.classList.add("dark");
        // User ki choice browser mein save kar do taaki refresh par na hate
        localStorage.setItem("theme", "dark"); 
    } else {
        root.classList.remove("dark");
        localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  // Fetch currency exchange rates
  useEffect(() => {
    let isMounted = true;

    const fetchCurrencyData = async () => {
      console.log(`[APP] Fetching currency rates from ${API_BASE_URL}/api/Currency/Rate-change`);
      try {
        const response = await fetch(`${API_BASE_URL}/api/Currency/Rate-change`);
        if (!response.ok) throw new Error("Failed to fetch currency rates.");
        const data = await response.json();

        if (isMounted) {
          setRates(data);
          setRatesError(null);
          console.log(`[APP] Currency rates loaded -- ${Object.keys(data).length} currencies`);
        }
      } catch (err) {
        if (isMounted) {
          console.error("[APP] Currency fetch error:", err);
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
    else if (selectedCategory) {
      url = `${API_BASE_URL}/api/categories/subcategory-products/${selectedCategory}`;
      fetchMode = "category-filter";
    }
    else if (minprice && maxprice) {
      url = `${API_BASE_URL}/api/products/all?page=${currentPage}&limit=12&min=${minprice}&max=${maxprice}`;
      fetchMode = "price-range";
    }

    console.log(`[APP] Fetching products -- mode: ${fetchMode}, page: ${currentPage}, url: ${url}`);

    fetch(url)
      .then((res) => {
        console.log(`[APP] Product fetch response -- status: ${res.status}, ok: ${res.ok}`);
        if (!res.ok) throw new Error(`Backend API not found (status ${res.status}).`);
        return res.json();
      })
      .then((result) => {
        if (isMounted) {
          let finalData = result.data || result.products || result || [];
          console.log(`[APP] Products loaded -- mode: ${fetchMode}, count: ${finalData.length}`);
          setSarees(finalData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error(`[APP] Error fetching sarees -- mode: ${fetchMode}:`, err);
          setError("Failed to load products. Please check the backend connection.");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [currentPage, searchKeyword, selectedCategory, minprice, maxprice]);

  // Text Search Handler
  const handleSearch = (keyword) => {
    console.log(`[APP] handleSearch -- keyword: "${keyword}"`);
    setSearchKeyword(keyword);
    setSelectedCategory("");     
    setSelectedCategoryName("");
    setCurrentPage(1);
  };

  // Category Select Handler
  const handleCategorySelect = (categoryId, categoryName = "") => {
    console.log(`[APP] handleCategorySelect -- categoryId: ${categoryId}, categoryName: "${categoryName}"`);
    setSelectedCategory(categoryId);
    setSelectedCategoryName(categoryName);
    setSearchKeyword("");        // FIXED TYPO HERE
    setCurrentPage(1);
  };

  const translateText = async (text, targetLang) => {
    console.log(`[APP] translateText -- targetLang: ${targetLang}, text: "${text}"`);
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: targetLang })
      });
      const data = await response.json();
      console.log(`[APP] translateText success -- result: "${data.translatedText}"`);
      return data.translatedText;
    } catch (error) {
      console.error("[APP] Translation failed:", error);
      return text;
    }
  };

  return (
    <>
      <Navbar
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        onSearch={handleSearch}
        onCategorySelect={handleCategorySelect}
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
              currency={currency}
              rates={rates}
              language={language}
            />
          }
        />

        <Route path="/orders" element={<UserOrders />} />
        <Route path="/admin/orders" element={<AdminRoute><AdminOrders /></AdminRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
        <Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
        <Route path="/admin/add-product" element={<AdminRoute><AdminAddProduct /></AdminRoute>} />

        <Route
          path="/product/:id"
          element={
            <ProductDetail
              sarees={sarees}
              currency={currency}
              rates={rates}
              language={language}
            />
          }
        />

        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute>
              <UserOrders />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        <Route
          path="/add-address"
          element={
            <ProtectedRoute>
              <AddressForm />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin/banners"
          element={
            <AdminRoute>
              <AdminBanners />
            </AdminRoute>
          }
        />

        <Route
          path="/order-summary"
          element={
            <ProtectedRoute>
              <OrderSummary />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        
        <Route path="/track-order/:orderId" element={<OrderTracking />} />
        
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
} 

export default App;