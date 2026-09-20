import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from './AdminNav';
import './AdminDealers.css';

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

function AdminDealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const token = localStorage.getItem('token');
      const targetUrl = `${API_BASE_URL}/api/dealer/admin/all`;
      
      const response = await fetch(targetUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const res = await response.json();

      if (res && res.success) {
        const dataArray = Array.isArray(res.dealers) ? res.dealers : [];
        setDealers(dataArray);
      } else {
        setErrorMsg(res?.message || 'Failed to fetch dealers list');
      }
    } catch (err) {
      console.error('[ADMIN_DEALERS] ❌ Error fetching dealers:', err);
      setErrorMsg('Network error while connecting to server. Is backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDealerClick = (dealerId) => {
    if (!dealerId) return;
    navigate(`/admin/dealer/${dealerId}`);
  };

  if (loading) {
    return (
      <div className="admin-wrapper admin-loading-wrapper">
        <div className="spinner"></div>
        <p>Loading Dealers Directory...</p>
      </div>
    );
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>🤝 Dealer Management Directory</h2>
      </div>

      <AdminNav />

      <div className="admin-dealer-container">
        <div className="dealers-top-bar">
          <p>Manage all registered vendors, view their assigned inventory value, and monitor payouts.</p>
        </div>

        {errorMsg && (
          <div className="dealer-error-msg">
            <strong>Error: </strong> {errorMsg}
          </div>
        )}

        {dealers.length === 0 && !errorMsg ? (
          <div className="no-dealers-box">
            <p>No dealers are currently registered in the system.</p>
          </div>
        ) : (
          <div className="dealers-grid">
            {dealers.map((dealer, index) => {
              const dealerId = dealer.dealer_id;

              return (
                <div 
                  key={dealerId || index} 
                  className="dealer-card-item"
                  onClick={() => handleDealerClick(dealerId)}
                >
                  {/* 🖼️ Full-Width Product-Style Image */}
                  <div className="dealer-card-image">
                    <img 
                      src={dealer.image_url || 'https://via.placeholder.com/400x250?text=No+Image'} 
                      alt={dealer.name} 
                    />
                    <span className={`dealer-status-badge ${dealer.status || 'active'}`}>
                      {dealer.status || 'Active'}
                    </span>
                  </div>
                  
                  {/* 📝 Aligned Content Section */}
                  <div className="dealer-card-content">
                    <div className="dealer-card-header">
                      <span className="dealer-id-tag">ID: #{dealerId}</span>
                      <h3>{dealer.name || 'Unnamed Dealer'}</h3>
                    </div>
                    
                    <div className="dealer-contact-info">
                      <p className="dealer-card-email">📧 {dealer.email || 'No Email'}</p>
                      <p className="dealer-card-phone">📞 {dealer.phone || 'No Phone'}</p>
                    </div>
                    
                    <div className="dealer-card-footer">
                      <span 
                        className="view-details-link edit-link" 
                        onClick={(e) => { 
                          e.stopPropagation(); 
                          navigate(`/admin/dealer/edit/${dealerId}`); 
                        }} 
                      >
                        ✏️ Edit Profile
                      </span>
                      <span className="view-details-link view-inventory">
                        View Inventory &rarr;
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminDealers;