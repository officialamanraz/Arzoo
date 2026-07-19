import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./App.css";
import "./theme.css";
import AdminSwitcher from './components/AdminSwitcher';

// Components
import AdminInventory from "./components/AdminInventory";
import AdminAddProduct from "./components/AdminAddProduct";
import AdminBanners from "./components/AdminBanners";
import AdminBanners from "./components/AdminBanners";
import AddressForm from './components/Addressform';
import OrderSummary from './components/ordersummary';
import PaymentPage from './components/PaymentePage';
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

// FIX: added fallback so a missing/typo'd VITE_API_URL env var on Render
// doesn't silently turn every fetch into "undefined/api/...".
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://arzoo-3.onrender.com';

function App() {
  const [sarees, setSarees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [language, setLanguage] = useState('en');
  const [currency, setCurrency] = useState("INR");
  const [rates, setRates] = useState({});
  const [ratesError, setRatesError] = useState(null);
  const [minprice, setMinprice] = useState(0);
  const [maxprice, setMaxprice] = useState(300000);

  // Dark mode toggle
  useEffect(() => {
    if (isDark) {
      document.body.classList.add("dark");
    } else {
      document.body.classList.remove("dark");
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

    if (searchKeyword) {
      url = `${API_BASE_URL}/api/products/search?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}&limit=12`;
    }
    else if (selectedCategory) {
      // FIX: was '/api/category/...' (singular) -- router is mounted at
      // '/api/categories' (plural) in server.js, so this 404'd every time
      // a category filter was selected.
      url = `${API_BASE_URL}/api/categories/subcategory-products/${selectedCategory}`;
    }
    else if (minprice && maxprice) {
      url = `${API_BASE_URL}/api/products/all?page=${currentPage}&limit=12&min=${minprice}&max=${maxprice}`;
    }

    console.log(`[APP] Fetching products -- ${url}`);

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Backend API not found (status ${res.status}).`);
        return res.json();
      })
      .then((result) => {
        if (isMounted) {
          let finalData = result.data || result.products || result || [];
          console.log(`[APP] Products loaded -- ${finalData.length} item(s)`);
          setSarees(finalData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("[APP] Error fetching sarees:", err);
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
    setSearchKeyword(keyword);
    setSelectedCategory(""); // Clear category when typing a text search
    setCurrentPage(1);
  };

  // New Category Select Handler
  const handleCategorySelect = (categoryId) => {
    setSelectedCategory(categoryId);
    setSearchKeyword(""); // Clear text search when selecting a category dropdown
    setCurrentPage(1);
  };

  const translateText = async (text, targetLang) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/translate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: targetLang })
      });
      const data = await response.json();
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
              keyword={searchKeyword || (selectedCategory ? "Category Filter Applied" : "")}
              currency={currency}
              rates={rates}
              language={language}
            />
          }
        />

        <Route path="/orders" element={<UserOrders />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        <Route path="/admin" element={<AdminRoute><AdminPage /></AdminRoute>} />
<Route path="/admin/inventory" element={<AdminRoute><AdminInventory /></AdminRoute>} />
<Route path="/admin/add-product" element={<AdminRoute><AdminAddProduct /></AdminRoute>} />
<Route path="/admin/banners" element={<AdminRoute><AdminBanners /></AdminRoute>} />

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
          path="/admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
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
              <PaymentPage />
            </ProtectedRoute>
          }
        />
        <Route path="/track-order/:orderId" element={<OrderTracking />} />
        <Route
          path="/checkout"
          element={
            <ProtectedRoute>
              <div
                style={{
                  padding: "50px",
                  textAlign: "center",
                  marginTop: "100px",
                }}
              >
                <h2>Checkout Page</h2>
                <p>The final "Place Order" button will appear here.</p>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </>
  );
}

export default App;