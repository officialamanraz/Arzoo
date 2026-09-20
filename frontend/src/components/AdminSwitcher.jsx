import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './AdminSwitcher.css';

const AdminSwitcher = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const role = localStorage.getItem('role');

  // State to track button position on screen
  const [position, setPosition] = useState({ x: window.innerWidth - 220, y: window.innerHeight - 100 });
  const isDragging = useRef(false);
  const dragOffset = useRef({ x: 0, y: 0 });

  if (role !== 'admin') {
    return null;
  }

  const isAdminPage = location.pathname.includes('/admin');

  // Start dragging (Mouse & Touch)
  const handleDragStart = (clientX, clientY) => {
    isDragging.current = true;
    dragOffset.current = {
      x: clientX - position.x,
      y: clientY - position.y
    };
  };

  // Move button (Mouse & Touch)
  const handleDragMove = (clientX, clientY) => {
    if (!isDragging.current) return;
    
    let newX = clientX - dragOffset.current.x;
    let newY = clientY - dragOffset.current.y;

    // Keep the button within screen bounds so it doesn't get lost off-screen
    const maxX = window.innerWidth - 150;
    const maxY = window.innerHeight - 60;
    
    newX = Math.max(10, Math.min(newX, maxX));
    newY = Math.max(10, Math.min(newY, maxY));

    setPosition({ x: newX, y: newY });
  };

  // Stop dragging
  const handleDragEnd = () => {
    isDragging.current = false;
  };

  // Click handler (prevents accidental click when dragging)
  const handleClick = (e) => {
    // If it was a drag motion, don't trigger the page switch
    if (Math.abs(e.clientX - (position.x + dragOffset.current.x)) > 5) return;
    navigate(isAdminPage ? '/' : '/admin');
  };

  return (
    <button 
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      
      onTouchStart={(e) => handleDragStart(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchMove={(e) => handleDragMove(e.touches[0].clientX, e.touches[0].clientY)}
      onTouchEnd={handleDragEnd}
      
      onClick={handleClick}
      className="admin-switcher-btn"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        bottom: 'auto',
        right: 'auto',
        zIndex: 2147483647,
        touchAction: 'none' // Prevents mobile scrolling while dragging the button
      }}
    >
      {isAdminPage ? '🏪 Go to Main Website' : '⚙️ Go to Admin Panel'}
    </button>
  );
};

export default AdminSwitcher;