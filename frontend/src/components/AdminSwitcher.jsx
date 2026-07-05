import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AdminSwitcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // LocalStorage se role check karo
  const role = localStorage.getItem('role');

  // Agar login karne wala normal user hai, toh ye button usko DİKHEGA HI NAHI
  if (role !== 'admin') return null;

  // Check karo ki URL mein '/admin' hai ya nahi
  const isAdminPage = location.pathname.includes('/admin');

  return (
    <button 
      onClick={() => navigate(isAdminPage ? '/' : '/admin')}
      style={{
        position: 'fixed',
        bottom: '30px',
        right: '30px',
        zIndex: 9999, // Hamesha sabse upar dikhega
        backgroundColor: '#9b2c50', // Tera premium color
        color: '#ffffff',
        padding: '12px 24px',
        borderRadius: '30px',
        border: 'none',
        fontWeight: '700',
        cursor: 'pointer',
        boxShadow: '0 5px 15px rgba(0,0,0,0.3)',
        transition: 'transform 0.2s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px'
      }}
      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
    >
      {/* Agar Admin page par hai, toh 'Main Website' ka text dikhao, warna ulta */}
      {isAdminPage ? '🏪 Go to Main Website' : '⚙️ Go to Admin Panel'}
    </button>
  );
};

export default AdminSwitcher;