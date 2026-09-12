import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminNav.css';

const adminLinks = [
  { path: '/admin', label: '🏠 Dashboard' },
  { path: '/admin/inventory', label: '🛍️ Product Inventory' },
  { path: '/admin/add-product', label: '➕ Add Product' },
  { path: '/admin/orders', label: '📦 Orders' },
  { path: '/admin/dealers', label: '🤝 Dealers' },
  { path: '/admin/banners', label: '🖼️ Banners' },
  { path: '/admin/add-dealer', label: '➕ Add Dealer' }, // 👈 NEW LINK
];

function AdminNav() {
  const location = useLocation();

  return (
    <div className="admin-nav-wrapper">
      <div className="admin-nav">
        {adminLinks.map((link) => {
          // Smart active check: Exact match for dashboard/others, startsWith for sub-routes
          const isActive = link.path === '/admin' 
            ? location.pathname === '/admin' 
            : location.pathname.startsWith(link.path);

          return (
            <Link
              key={link.path}
              to={link.path}
              className={`admin-nav-link${isActive ? ' active' : ''}`}
            >
              {link.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default AdminNav;