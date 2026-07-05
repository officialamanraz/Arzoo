import React from 'react';
import { Navigate } from 'react-router-dom';

// ==========================================
// PROTECTED ROUTE (Security Guard)
// ==========================================
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    alert("please login first!");
    return <Navigate to="/login" />;
  }
  return children;
};

export default ProtectedRoute;