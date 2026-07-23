import React from 'react';
import AdminNav from './AdminNav';

function AdminPage() {
  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>Admin Dashboard</h2>
      </div>

      <AdminNav />
    </div>
  );
}

export default AdminPage;