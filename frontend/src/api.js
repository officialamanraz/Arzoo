// src/api.js
//
// Centralized API helper.
// - Base URL comes from environment variables → works on any machine,
//   any developer, any deployment (dev, staging, production) without
//   touching this file.
// - Auth token is read fresh from localStorage on EVERY request → works
//   correctly no matter WHICH user is currently logged in, automatically.
//
// Everywhere in the app, replace raw `fetch('https://arzoo-saree.onrender.com/...')`
// calls with `apiFetch('/api/...')` from this file.

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://arzoo-saree.onrender.com";

/**
 * Dynamic fetch wrapper.
 * @param {string} endpoint - e.g. "/api/products/all"
 * @param {object} options - same options you'd pass to fetch()
 */
export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem("token"); // always reads the CURRENT logged-in user's token

  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  // Attach Authorization header automatically, only if a token exists.
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    
  });

  // If the token is invalid/expired, auto-logout instead of failing silently.
 // If the token is invalid/expired, auto-logout instead of failing silently.
  // FIX: Bypass this auto-logout logic IF the request is for the login page
  if (!response.ok) {
     const errorData = await response.json().catch(() => ({})); // response read karo
     throw new Error(errorData.message || 'Something went wrong');
  }
  if (response.status === 401 && !endpoint.includes('/login')) {
    localStorage.removeItem("token");
    // window.location.href = "/login"; 
  }

  return response;
}

export default API_BASE_URL;