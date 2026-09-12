import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminNav from './AdminNav';
import './AdminDealerDetail.css';
import { getImageUrl } from '../getImageUrl'; 

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) || 'http://localhost:8000';

function AdminDealerDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [dealerData, setDealerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  // 📝 Commission Edit States
  const [isEditingCommission, setIsEditingCommission] = useState(false);
  const [newCommission, setNewCommission] = useState(0);
  const [updatingCommission, setUpdatingCommission] = useState(false);

  // 🔍 Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedSubcategory, setSelectedSubcategory] = useState('All'); 

  // 📄 Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const productsPerPage = 15;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, selectedSubcategory]);

  useEffect(() => {
    if (!id) {
      setErrorMessage('Invalid or missing Dealer ID in URL.');
      setLoading(false);
      return;
    }
    fetchDealerDetails();
  }, [id]);

  const fetchDealerDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const targetUrl = `${API_BASE_URL}/api/dealer/admin/dealer/${id}`;
      const response = await fetch(targetUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const res = await response.json();
      if (res && res.success) {
        setDealerData(res.data);
        setNewCommission(res.data?.dealer?.commission_percentage || 0);
      } else {
        setErrorMessage(res?.message || 'Failed to fetch dealer profile from server.');
      }
    } catch (err) {
      console.error('[ADMIN_DEALER_DETAIL] ❌ Error:', err);
      setErrorMessage('Network connection error. Please check your backend server.');
    } finally {
      setLoading(false);
    }
  };

  // 🚀 Handle Commission Update API Call
  const handleUpdateCommission = async () => {
    try {
      setUpdatingCommission(true);
      const token = localStorage.getItem('token');
      const targetUrl = `${API_BASE_URL}/api/dealer/admin/update/${id}`;
      
      const response = await fetch(targetUrl, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          ...dealerData.dealer,
          commission_percentage: newCommission
        })
      });

      const res = await response.json();
      if (res && res.success) {
        setIsEditingCommission(false);
        fetchDealerDetails(); // Refresh live calculations
      } else {
        alert(res?.message || 'Failed to update commission.');
      }
    } catch (err) {
      console.error('[UPDATE_COMMISSION] ❌ Error:', err);
      alert('Failed to update commission due to network error.');
    } finally {
      setUpdatingCommission(false);
    }
  };

  const handleProductClick = (product) => {
    if (!product) return;
    const isSold = product.order_id && product.order_id !== null && String(product.order_id).toLowerCase() !== 'null';
    if (isSold) {
      navigate(`/admin/orders/${product.order_id}`);
    } else {
      navigate(`/product/${product.product_id}`);
    }
  };

  if (loading) {
    return (
      <div className="admin-wrapper dealer-loading-wrapper">
        <div className="spinner"></div>
        <p className="dealer-loading-text">Loading Dealer Profile & Inventory...</p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="admin-wrapper dealer-error-wrapper">
        <AdminNav />
        <div className="dealer-error-box">
          <h3>⚠️ Unable to Load Dealer Details</h3>
          <p>{errorMessage}</p>
          <button className="dealer-error-back-btn" onClick={() => navigate('/admin/dealers')}>
            ← Back to Dealers List
          </button>
        </div>
      </div>
    );
  }

  const dealer = dealerData?.dealer || {};
  const products = Array.isArray(dealerData?.products) ? dealerData.products : [];
  const financial_summary = dealerData?.financial_summary || {};
  const sold_summary = dealerData?.sold_financial_summary || {};

  const uniqueCategories = ['All', ...new Set(products.map(p => p.category_name).filter(Boolean))];
  const uniqueSubcategories = ['All', ...new Set(products.map(p => p.subcategory_name).filter(Boolean))];

  const filteredProducts = products.filter(prod => {
    const searchLower = (searchTerm || '').trim().toLowerCase();
    const productName = (prod?.name || '').toLowerCase();
    const productId = String(prod?.product_id || '');
    const matchesSearch = searchLower === '' || productName.includes(searchLower) || productId === searchLower;
    const matchesCategory = selectedCategory === 'All' || prod?.category_name === selectedCategory;
    const matchesSubcategory = selectedSubcategory === 'All' || prod?.subcategory_name === selectedSubcategory;
    return matchesSearch && matchesCategory && matchesSubcategory;
  });

  const indexOfLastProduct = currentPage * productsPerPage;
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
  const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
  const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 450, behavior: 'smooth' });
    }
  };

  const pageNumbers = [];
  for (let i = 1; i <= totalPages; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="admin-wrapper">
      <div className="admin-header-stats">
        <h2>🤝 Dealer Profile & Products</h2>
      </div>
      <AdminNav />
      <div className="admin-dealer-container">
        <button className="dealer-back-btn" onClick={() => navigate('/admin/dealers')}>
          ← Back to Dealers List
        </button>

        {/* Dealer Info Card */}
        <div className="dealer-profile-card">
          <div className="dealer-info-grid">
            <div>
              <h1 className="dealer-name">{dealer.name || 'Unnamed Dealer'}</h1>
              <p className="dealer-meta">📧 {dealer.email || 'N/A'} &bull; 📞 {dealer.phone || 'N/A'}</p>
              <p className="dealer-meta dealer-meta-id">
                Razorpay Account ID: <code>{dealer.razorpay_linked_account_id || 'Not Linked ❌'}</code>
              </p>
            </div>
            
            <div className="dealer-status-container">
              <span className={`dealer-status-badge ${dealer.status || 'pending'}`}>{dealer.status || 'unknown'}</span>
              
              {/* 🌟 Editable Default Commission Tag */}
              <div className="dealer-commission-edit-wrapper">
                <span className="dealer-commission-tag">Default Commission:</span>
                {isEditingCommission ? (
                  <div className="commission-edit-box">
                    <input 
                      type="number" 
                      value={newCommission} 
                      onChange={(e) => setNewCommission(e.target.value)}
                      className="commission-input"
                      step="0.01"
                    />
                    <button 
                      onClick={handleUpdateCommission} 
                      disabled={updatingCommission}
                      className="commission-save-btn"
                    >
                      {updatingCommission ? '...' : 'Save'}
                    </button>
                    <button 
                      onClick={() => { setIsEditingCommission(false); setNewCommission(dealer.commission_percentage || 0); }} 
                      className="commission-cancel-btn"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span 
                    onClick={() => { setNewCommission(dealer.commission_percentage || 0); setIsEditingCommission(true); }}
                    className="dealer-commission-value-clickable"
                    title="Click to edit commission percentage"
                  >
                    {dealer.commission_percentage || 0}% ✏️
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Current Inventory Summary Cards */}
        <h3 className="section-title">📦 Unsold Inventory Summary</h3>
        <div className="dealer-stats-grid">
          <div className="stat-card">
            <p className="stat-label">TOTAL PRODUCTS SOURCED</p>
            <h3 className="stat-val blue">{products.length}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">TOTAL INVENTORY (MRP)</p>
            <h3 className="stat-val dark">₹{Number(financial_summary.total_inventory_mrp || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">TOTAL DEALER PAYOUT</p>
            <h3 className="stat-val orange">₹{Number(financial_summary.total_dealer_base_value || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="stat-card stat-card-green">
            <p className="stat-label green-text">POTENTIAL ADMIN MARGIN</p>
            <h3 className="stat-val green">+ ₹{Number(financial_summary.total_potential_admin_profit || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Sold Items Accountability Summary */}
        <h3 className="section-title section-title-spacing">📈 Sold Items Accountability (Lifetime)</h3>
        <div className="dealer-stats-grid">
          <div className="stat-card">
            <p className="stat-label">TOTAL PRODUCTS SOLD</p>
            <h3 className="stat-val purple">{sold_summary.total_products_sold || 0} Items</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">TOTAL REVENUE (SOLD)</p>
            <h3 className="stat-val dark">₹{Number(sold_summary.total_revenue_sold || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="stat-card">
            <p className="stat-label">TOTAL SOLD DEALER PAYOUT</p>
            <h3 className="stat-val orange">₹{Number(sold_summary.total_sold_dealer_payout || 0).toLocaleString('en-IN')}</h3>
          </div>
          <div className="stat-card stat-card-green">
            <p className="stat-label green-text">TOTAL NET PROFIT (SOLD)</p>
            <h3 className="stat-val green">+ ₹{Number(sold_summary.total_net_profit_sold || 0).toLocaleString('en-IN')}</h3>
          </div>
        </div>

        {/* Products Section with Filters */}
        <div className="dealer-products-section">
          <div className="dealer-filter-header">
            <h2 className="section-title margin-reset">
              <span>📦</span> Inventory ({filteredProducts.length})
            </h2>
            <div className="dealer-filter-controls">
              <input 
                type="text" 
                placeholder="Search by Name or ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="dealer-search-input"
              />
              <select 
                value={selectedCategory} 
                onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubcategory('All'); }}
                className="dealer-select-box"
              >
                {uniqueCategories.map((cat, index) => (
                  <option key={`cat-${index}`} value={cat}>{cat}</option>
                ))}
              </select>
              <select 
                value={selectedSubcategory} 
                onChange={(e) => setSelectedSubcategory(e.target.value)}
                className="dealer-select-box"
              >
                {uniqueSubcategories.map((subcat, index) => (
                  <option key={`sub-${index}`} value={subcat}>
                    {subcat === 'All' ? 'All Subcategories' : subcat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {filteredProducts.length === 0 ? (
            <div className="dealer-no-products">
              <span className="no-prod-emoji">🕵️‍♂️</span>
              <p className="no-prod-text">No products found matching your search or filter.</p>
            </div>
          ) : (
            <>
              <div className="dealer-product-grid">
                {currentProducts.map((prod, idx) => {
                  const price = Number(prod?.price || 0);
                  const dealerBase = Number(prod?.dealer_base_price || 0);
                  const packagingCost = Number(prod?.packaging_cost || 0);
                  const estAdminProfit = price - dealerBase - packagingCost;
                  const isSold = prod.order_id && prod.order_id !== null && String(prod.order_id).toLowerCase() !== 'null';
                  const stockQty = Number(prod?.stock_qty || 0);

                  return (
                    <div 
                      key={prod?.product_id || idx} 
                      className="dealer-prod-card"
                      onClick={() => handleProductClick(prod)}
                      title={isSold ? "Click to view Order Details" : "Click to view Product Details"}
                    >
                      <div className="dealer-prod-img-wrapper">
                        <img 
                          src={getImageUrl(prod?.image_url) || 'https://via.placeholder.com/150?text=No+Img'} 
                          alt={prod?.name || 'Product'} 
                          className="dealer-prod-img" 
                          onError={(e) => { e.target.src = 'https://via.placeholder.com/150?text=Error'; }}
                        />
                        <span className="prod-id-tag">ID: #{prod?.product_id || 'N/A'}</span>
                        {isSold ? (
                          <div className="prod-badge sold-badge">
                            Sold (Ord #{prod.order_id})
                          </div>
                        ) : (
                          <div className={`prod-badge ${stockQty > 0 ? 'stock-badge' : 'nostock-badge'}`}>
                            Stock: {stockQty}
                          </div>
                        )}
                      </div>
                      
                      <div className="dealer-prod-body">
                        <div>
                          <h3 className="dealer-prod-title">{prod?.name || 'Unnamed Product'}</h3>
                          <p className="prod-category">
                            {prod?.category_name || 'Category'} {prod?.subcategory_name && ` > ${prod.subcategory_name}`} 
                          </p>
                        </div>
                        <div className="prod-financial-breakdown">
                          <div className="p-row">
                            <span>Selling Price:</span>
                            <strong className="text-dark">₹{price.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="p-row dealer-cost">
                            <span>Dealer Base:</span>
                            <strong className="text-orange">₹{dealerBase.toLocaleString('en-IN')}</strong>
                          </div>
                          <div className="p-row admin-margin">
                            <span>Admin Profit:</span>
                            <strong className="text-green">+ ₹{estAdminProfit.toLocaleString('en-IN')}</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div className="dealer-pagination">
                  <button onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} className={`page-btn ${currentPage === 1 ? 'disabled' : ''}`}>
                    ← Prev
                  </button>
                  {pageNumbers.map(number => (
                    <button key={number} onClick={() => handlePageChange(number)} className={`page-num-btn ${currentPage === number ? 'active' : ''}`}>
                      {number}
                    </button>
                  ))}
                  <button onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} className={`page-btn ${currentPage === totalPages ? 'disabled' : ''}`}>
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDealerDetail;