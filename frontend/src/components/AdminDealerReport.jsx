import React, { useState, useEffect } from 'react';
import './AdminDealerReport.css'; // 👈 CSS file import

const AdminDealerReport = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [expandedDealerId, setExpandedDealerId] = useState(null);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        const response = await fetch('/api/admin/dealers/report'); 
        const data = await response.json();
        
        if (data.success) {
          setReports(data.data);
        } else {
          setError(data.message || 'Failed to fetch data');
        }
      } catch (err) {
        setError('Server network error. Check backend connection.');
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, []);

  const toggleExpand = (id) => {
    setExpandedDealerId(expandedDealerId === id ? null : id);
  };

  if (loading) return <div className="dealer-report-container">Loading Dealer Reports...</div>;
  if (error) return <div className="dealer-report-container" style={{ color: 'red' }}>Error: {error}</div>;

  return (
    <div className="dealer-report-container">
      <h2>Admin: Dealer Performance & Payout Report</h2>
      
      <table className="dealer-table">
        <thead>
          <tr>
            <th>Dealer Name</th>
            <th>Commission</th>
            <th>Total Orders</th>
            <th>Gross Revenue</th>
            <th>Dealer's Share</th>
            <th>Actually Paid</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <React.Fragment key={report.dealer_info.dealer_id}>
              {/* Main Dealer Row */}
              <tr>
                <td>
                  <strong>{report.dealer_info.name}</strong><br/>
                  <small>{report.dealer_info.email}</small>
                </td>
                <td>{report.dealer_info.commission_percentage}%</td>
                <td>{report.stats.total_orders}</td>
                <td className="text-blue">₹{Number(report.stats.gross_revenue).toFixed(2)}</td>
                <td className="text-green">₹{Number(report.stats.dealer_share).toFixed(2)}</td>
                <td>₹{Number(report.stats.actual_transferred).toFixed(2)}</td>
                <td>
                  <button 
                    onClick={() => toggleExpand(report.dealer_info.dealer_id)}
                    className="btn-toggle"
                  >
                    {expandedDealerId === report.dealer_info.dealer_id ? 'Hide Details' : 'View Details'}
                  </button>
                </td>
              </tr>

              {/* Expanded Details Row (Products & Orders) */}
              {expandedDealerId === report.dealer_info.dealer_id && (
                <tr>
                  <td colSpan="7" className="expanded-details-cell">
                    <div className="details-flex-container">
                      
                      {/* Left Side: Products List */}
                      <div className="details-column">
                        <h4 className="details-heading">Listed Products ({report.stats.total_products})</h4>
                        {report.products_list.length === 0 ? <p>No products yet.</p> : (
                          <ul className="details-list">
                            {report.products_list.map(p => (
                              <li key={p.product_id} className="details-list-item">
                                {p.name} - <strong>₹{p.price}</strong> <br/>
                                <small>Stock: {p.stock_quantity}</small>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                      {/* Right Side: Orders List */}
                      <div className="details-column">
                        <h4 className="details-heading">Order History</h4>
                        {report.orders_list.length === 0 ? <p>No orders yet.</p> : (
                          <ul className="details-list">
                            {report.orders_list.map((o, idx) => (
                              <li key={idx} className="details-list-item">
                                Order #{o.order_id} - {o.product_name} (Qty: {o.quantity}) <br/>
                                Status: <strong className={o.payment_status === 'paid' ? 'status-paid' : 'status-unpaid'}>
                                  {o.payment_status.toUpperCase()}
                                </strong>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>

                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDealerReport;