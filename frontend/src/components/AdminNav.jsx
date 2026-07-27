import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './AdminNav.css';

const adminLinks = [
  { path: '/admin', label: '🏠 Dashboard' },
  { path: '/admin/inventory', label: '🛍️ Product Inventory' },
  { path: '/admin/add-product', label: '➕ Add Product' },
  { path: '/admin/orders', label: '📦 Orders' },
  { path: '/admin/banners', label: '🖼️ Banners' }
];

function AdminNav() {
  const location = useLocation();

  return (
    <div className="admin-nav">
      {adminLinks.map((link) => {
        const isActive = location.pathname === link.path;
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
  );
}

export default AdminNav;