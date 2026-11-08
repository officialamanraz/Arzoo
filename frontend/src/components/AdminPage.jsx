import React from 'react';
import AdminNav from './AdminNav';
import AdminAnalytics from './AdminAnalytics'; // 👈 Import new analytics component

function AdminPage({ isDark }) {
  // Auto-detect dark mode if isDark is not passed from App.jsx
  const isDarkMode = isDark ?? (
    document.body.classList.contains('dark') ||
    document.body.classList.contains('dark-theme') ||
    localStorage.getItem('theme') === 'dark' ||
    document.documentElement.getAttribute('data-theme') === 'dark'
  );

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Admin Dashboard</h2>
      </div>

      {/* ADMIN NAVIGATION BAR */}
      <AdminNav />

      {/* 🚀 LIVE ANALYTICS & VISITOR METRICS */}
      <div className="admin-content-body" style={{ marginTop: '24px' }}>
        <AdminAnalytics isDark={isDarkMode} />
      </div>
    </div>
  );
}

export default AdminPage;