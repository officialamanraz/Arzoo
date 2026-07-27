import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminSwitcher.css';

const AdminSwitcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Check role from LocalStorage
  const role = localStorage.getItem('role');

  // If the logged-in user is a normal user, this button will NOT BE VISIBLE
  if (role !== 'admin') {
    return null;
  }

  // Check if the URL contains '/admin'
  const isAdminPage = location.pathname.includes('/admin');

  const handleSwitch = () => {
    console.log(`[AdminSwitcher] Switching view. Currently on admin: ${isAdminPage}`);
    navigate(isAdminPage ? '/' : '/admin');
  };

  return (
    <button 
      onClick={handleSwitch}
      className="admin-switcher-btn"
    >
      {/* If on the Admin page, show 'Main Website' text, otherwise show the opposite */}
      {isAdminPage ? '🏪 Go to Main Website' : '⚙️ Go to Admin Panel'}
    </button>
  );
};

export default AdminSwitcher;