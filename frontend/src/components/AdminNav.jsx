import React from 'react';
import { Link, useLocation } from 'react-router-dom';

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
    <div style={{ display: 'flex', gap: '12px', margin: '16px 0', flexWrap: 'wrap' }}>
      {adminLinks.map((link) => {
        const isActive = location.pathname === link.path;
        return (
          <Link
            key={link.path}
            to={link.path}
            style={{
              padding: '10px 20px',
              backgroundColor: isActive ? '#b3244c' : '#f0f0f0',
              color: isActive ? '#fff' : '#333',
              borderRadius: '8px',
              fontWeight: 'bold',
              textDecoration: 'none',
              transition: 'all 0.2s'
            }}
          >
            {link.label}
          </Link>
        );
      })}
    </div>
  );
}

export default AdminNav;