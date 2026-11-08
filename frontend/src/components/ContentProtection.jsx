import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// JWT token decode helper (bina kisi external package ke)
const checkIsAdminFromToken = () => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return false;

    const base64Url = token.split('.')[1];
    if (!base64Url) return false;

    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const decoded = JSON.parse(jsonPayload);

    return (
      decoded.role === 'admin' ||
      decoded.is_admin === 1 ||
      decoded.is_admin === true ||
      decoded.isAdmin === true
    );
  } catch {
    return false;
  }
};

export default function ContentProtection() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(() => checkIsAdminFromToken());

  // 1. Verify Admin Status (via Token & Profile)
  useEffect(() => {
    // Agar user seedha /admin routes par hai
    if (location.pathname.startsWith('/admin')) {
      setIsAdmin(true);
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      setIsAdmin(false);
      return;
    }

    // Fast check from decoded token
    if (checkIsAdminFromToken()) {
      setIsAdmin(true);
      return;
    }

    // Secondary verification from API profile
    fetch(`${API_BASE_URL}/api/auth/profile`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.user) {
          const role = data.user.role;
          const adminFlag = data.user.is_admin;
          const isUserAdmin = role === 'admin' || adminFlag === 1 || adminFlag === true;
          setIsAdmin(isUserAdmin);
        } else {
          setIsAdmin(false);
        }
      })
      .catch(() => setIsAdmin(false));
  }, [location.pathname]);

  // 2. Toggle CSS Class on Body for Text Selection & Dragging
  useEffect(() => {
    if (isAdmin) {
      document.body.classList.remove('protected-mode');
    } else {
      document.body.classList.add('protected-mode');
    }

    return () => {
      document.body.classList.remove('protected-mode');
    };
  }, [isAdmin]);

  // 3. Event Listeners for Inspect & Right Click
  useEffect(() => {
    // 🔓 Admin ke liye saare restrictions unlock rahenge
    if (isAdmin) return;

    // A. Disable Right-Click Context Menu for Non-Admins
    const handleContextMenu = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      e.preventDefault();
    };

    // B. Disable Copy / Cut outside inputs for Non-Admins
    const handleCopyCut = (e) => {
      if (['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
      e.preventDefault();
    };

    // C. Disable F12, Inspect Shortcuts & View Source for Non-Admins
    const handleKeyDown = (e) => {
      const isInput = ['INPUT', 'TEXTAREA'].includes(e.target.tagName);
      const ctrlOrMeta = e.ctrlKey || e.metaKey;

      // F12 (Inspect DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+Shift+I / J / C (DevTools & Element Picker)
      if (
        ctrlOrMeta &&
        e.shiftKey &&
        ['I', 'i', 'J', 'j', 'C', 'c'].includes(e.key)
      ) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+U (View Source) & Ctrl+S (Save Page HTML)
      if (ctrlOrMeta && ['u', 'U', 's', 'S'].includes(e.key)) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }

      // Ctrl+C / Ctrl+X outside inputs
      if (ctrlOrMeta && ['c', 'C', 'x', 'X'].includes(e.key) && !isInput) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyCut);
    window.addEventListener('cut', handleCopyCut);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyCut);
      window.removeEventListener('cut', handleCopyCut);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAdmin]);

  return null;
}