import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNav from './AdminNav';
import './AdminDealers.css';

// Safe API Base URL Fallback
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || '';

function AdminDealers() {
  const navigate = useNavigate();
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    console.log('[ADMIN_DEALERS] 🔄 Component mounted. Fetching all registered dealers...');
    fetchDealers();
  }, []);

  const fetchDealers = async () => {
    try {
      const token = localStorage.getItem('token');
      const targetUrl = `${API_BASE_URL}/api/dealer/admin/all`;
      console.log(`[ADMIN_DEALERS] 🌐 Fetching from: ${targetUrl}`);
      
      const response = await fetch(targetUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const res = await response.json();
      console.log('[ADMIN_DEALERS] 📦 API Response:', res);

      if (res && res.success) {
        const dataArray = Array.isArray(res.dealers) ? res.dealers : [];
        setDealers(dataArray);
      } else {
        console.warn('[ADMIN_DEALERS] ⚠️ Failed to fetch dealers:', res?.message);
        setErrorMsg(res?.message || 'Failed to fetch dealers list');
      }
    } catch (err) {
      console.error('[ADMIN_DEALERS] ❌ Error fetching dealers:', err);
      setErrorMsg('Network error while connecting to server. Is backend running?');
    } finally {
      setLoading(false);
      console.log('[ADMIN_DEALERS] 🏁 Loading finished.');
    }
  };

  const handleDealerClick = (dealerId) => {
    if (!dealerId) return;
    console.log(`[ADMIN_DEALERS] 🖱️ Navigating to dealer profile for ID: ${dealerId}`);
    navigate(`/admin/dealer/${dealerId}`);
  };

  if (loading) {
    return (
      <div className="admin-wrapper" style={{ padding: '60px', textAlign: 'center' }}>
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
        <div className="dealers-top-bar" style={{ marginBottom: '20px', color: '#555' }}>
          <p>Manage all registered vendors, view their assigned inventory value, and monitor payouts.</p>
        </div>

        {errorMsg && (
          <div style={{ background: '#fee2e2', color: '#b91c1c', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #fecaca' }}>
            <strong>Error: </strong> {errorMsg}
          </div>
        )}

        {dealers.length === 0 && !errorMsg ? (
          <div className="no-dealers-box" style={{ textAlign: 'center', padding: '50px 20px', background: '#fff', border: '1px solid #eee', borderRadius: '12px', color: '#777' }}>
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
                  {/* 🖼️ Dealer Profile Image & Header Flex */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
                    <div style={{ width: '55px', height: '55px', borderRadius: '50%', overflow: 'hidden', background: '#f1f5f9', flexShrink: 0, border: '2px solid #e2e8f0' }}>
                      <img 
                        src={dealer.image_url || 'https://via.placeholder.com/150?text=No+Img'} 
                        alt={dealer.name} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </div>
                    <div style={{ flexGrow: 1, overflow: 'hidden' }}>
                      <span style={{ fontSize: '10px', background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', color: '#64748b', fontWeight: 'bold' }}>
                        ID: #{dealerId}
                      </span>
                      <h3 style={{ margin: '4px 0 0 0', fontSize: '16px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {dealer.name || 'Unnamed Dealer'}
                      </h3>
                    </div>
                    <span className={`dealer-status-badge ${dealer.status || 'active'}`}>
                      {dealer.status || 'Active'}
                    </span>
                  </div>
                  
                  <p className="dealer-card-email">📧 {dealer.email || 'No Email'}</p>
                  <p className="dealer-card-phone">📞 {dealer.phone || 'No Phone'}</p>
                  
                  <div className="dealer-card-footer">
                    <span 
                      className="view-details-link" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        navigate(`/admin/dealer/edit/${dealerId}`); 
                      }} 
                      style={{ color: '#2563eb', cursor: 'pointer' }}
                    >
                      ✏️ Edit Profile
                    </span>
                    <span className="view-details-link" style={{ color: '#A8325E', fontWeight: 'bold' }}>
                      View Inventory &rarr;
                    </span>
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