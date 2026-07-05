import React from 'react';
import { Navigate } from 'react-router-dom';

const AdminRoute = ({ children }) => {
  // 1. LocalStorage se token aur role nikaalo
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  // 2. Agar token nahi hai, toh seedha Login page par feko
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // 3. Agar token hai par role 'admin' nahi hai, toh Home page par feko
  if (role !== 'admin') {
    return <Navigate to="/" replace />; // "Bhaag yahan se, tu admin nahi hai!"
  }

  // 4. Agar sab theek hai (Admin hi hai), toh andar aane do
  return children;
};

export default AdminRoute;