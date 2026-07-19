import React from 'react';
import AdminNav from './AdminNav';

function AdminPage() {
  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Admin Dashboard</h2>
      </div>

      <AdminNav />

      <p style={{ marginTop: '20px', color: '#666' }}>
        Upar diye gaye buttons se apna admin section chuno — Product Inventory, Add Product, Orders, ya Banners.
      </p>
    </div>
  );
}

export default AdminPage;