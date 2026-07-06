import React, { useState, useEffect } from "react";
import { Routes, Route,Navigate } from "react-router-dom";
import "./App.css";
import "./theme.css";
import AdminSwitcher from './components/AdminSwitcher';

// Components
import AddressForm from './components/Addressform';
import OrderSummary from './components/ordersummary';
import PaymentPage from './components/PaymentePage';
import OrderTracking from './components/OrderTracking';
import UserOrders from './components/UserOrders'; // Or './pages/UserOrders'
import AdminOrders from './components/AdminOrders';
import Navbar from "./components/Navbar";
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

// Centralized API base URL — change this in Render's Environment tab (VITE_API_URL),
// never hardcode it anywhere else in this file.
const API_BASE_URL = import.meta.env.VITE_API_URL || "https://arzoo-saree.onrender.com";

function App() {
  const [sarees, setSarees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDark, setIsDark] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState("");
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

  // Fetch currency exchange rates (with proper cleanup to avoid race conditions)
  useEffect(() => {
    // 1. Ek flag banayenge (AbortController ki jagah)
    let isMounted = true;

    const fetchCurrencyData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/Currency/Rate-change`);

        if (!response.ok) {
          throw new Error("Failed to fetch currency rates.");
        }

        const data = await response.json();

        // 3. Data set karne se pehle check karenge ki component zinda hai ya nahi
        if (isMounted) {
          setRates(data);
          setRatesError(null);
        }
      } catch (err) {
        if (isMounted) {
          console.error("Currency fetch error:", err);
          setRatesError("Could not load currency rates. Showing prices in INR.");
        }
      }
    };

    fetchCurrencyData();

    // 4. Silent Cleanup: Request cancel karne ki jagah, bas flag ko false kar do
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    let isMounted = true; // Silent cleanup ke liye
    setLoading(true);
    setError(null);

    // 1. DEFAULT URL (Normal + Pagination)
    let url = `${API_BASE_URL}/api/products/all?page=${currentPage}&limit=12`;

    // 2. SEARCH URL (Agar search kiya hai)
    if (searchKeyword) {
      url = `${API_BASE_URL}/api/products/search?keyword=${encodeURIComponent(searchKeyword)}&page=${currentPage}&limit=12`;
    }
    // 3. BUDGET FILTER URL (Agar min/max price lagaya hai)
    else if (minprice && maxprice) {
      url = `${API_BASE_URL}/api/products/all?page=${currentPage}&limit=12&min=${minprice}&max=${maxprice}`;
    }

    // Ab bas API hit karni hai
    fetch(url)
      .then((res) => {
        if (!res.ok) {
          throw new Error("Backend API not found.");
        }
        return res.json();
      })
      .then((result) => {
        if (isMounted) {
          // Data format check (Dynamic)
          let finalData = result.data || result.products || result || [];
          setSarees(finalData);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error("Error fetching sarees:", err);
          setError("Sarees load nahi ho payi. Backend check kar.");
          setLoading(false);
        }
      });

    // Cleanup function taaki memory leak na ho
    return () => {
      isMounted = false;
    };

  // 🚨 YAHAN DHYAN DE: dependency array mein minprice aur maxprice zaroor likhna!
  }, [currentPage, searchKeyword, minprice, maxprice]);

  const handleUserSearch = (keywordFromNav) => {
    setSearchKeyword(keywordFromNav);
    setCurrentPage(1);
  };
  const toggleDark = () => setIsDark(!isDark);

  // App.jsx (ya Navbar ke upar wale parent component) mein:
  const handleSearch = (keyword) => {
    console.log("Dynamically Filtering for:", keyword);

    // 1. Search ya Category ko state mein set karo
    setSearchKeyword(keyword);

    // 2. IMPORTANT: Jab bhi naya category chuno, toh Page wapas 1 par le aao
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
      console.error("Translation failed:", error);
      return text; // Return original if translation fails
    }
  };

  // App.jsx (fetchSarees function)
  const fetchSarees = async () => {
    setLoading(true);
    try {
      // Naya route: /filter use karo
      const response = await fetch(`${API_BASE_URL}/api/products/filter?min=${minprice}&max=${maxprice}`);
      const result = await response.json();

      if (result.success) {
        setSarees(result.data);
      }
    } catch (error) {
      console.error("Error fetching sarees:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar
        isDark={isDark}
        toggleDark={() => setIsDark(!isDark)}
        onSearch={handleSearch} /* Ek hi onSearch rakha hai error avoid karne ke liye */
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

      {/* 👇 TERA VIP MASTER SWITCH YAHAN LAGA DIYA 👇 */}
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
              currency={currency}
              rates={rates}
              language={language}
            />
          }
        />
        {/* 🚨 ADD THESE NEW ROUTES HERE 🚨 */}
        <Route path="/orders" element={<UserOrders />} />
        <Route path="/admin/orders" element={<AdminOrders />} />
        {/* CORRECT/NEW CODE */}
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
              <AdminPage />  {/* Tera admin dashboard yahan aayega */}
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

        {/* <Route
          path="/track-order/:orderId"
          element={
            <ProtectedRoute>
              <ordertarcking />
            </ProtectedRoute>
          }
        /> */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />

        {/* Other routes */}
        <Route
          path="/add-address"
          element={
            <ProtectedRoute>
              <AddressForm />
            </ProtectedRoute>
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