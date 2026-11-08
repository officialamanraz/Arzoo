import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Monitor, Smartphone, Tablet, RefreshCw, Calendar, User, LayoutTemplate, TrendingUp, AlertCircle } from 'lucide-react';
import './AdminAnalytics.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const AdminAnalytics = ({ isDark }) => {
  const [data, setData] = useState({
    activeNowCount: 0,
    activeVisitors: [],
    todaySummary: { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 },
    topPages: [],
    activityTrend: [] // The backend will populate this, or it falls back to empty
  });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastRefreshed, setLastRefreshed] = useState(new Date());

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analytics/admin/live`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const result = await response.json();
      
      if (result.success) {
        setData({
          activeNowCount: result.data.activeNowCount || 0,
          activeVisitors: result.data.activeVisitors || [],
          todaySummary: result.data.todaySummary || { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 },
          topPages: result.data.topPages || [],
          activityTrend: result.data.activityTrend || generateEmptyTrend()
        });
        setError(null);
        setLastRefreshed(new Date());
      } else {
        setError(result.message || "Failed to load data");
      }
    } catch (err) {
      setError("Network error while fetching analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000); // 30s Auto Refresh
    return () => clearInterval(interval);
  }, []);

  // --- Utility Functions ---
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0m 0s';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
  };

  const getDeviceIcon = (deviceType) => {
    const type = deviceType?.toLowerCase() || 'desktop';
    if (type === 'mobile') return <Smartphone size={18} />;
    if (type === 'tablet') return <Tablet size={18} />;
    return <Monitor size={18} />;
  };

  const getInitials = (name) => {
    if (!name || name.toLowerCase().includes('guest')) return 'G';
    return name.charAt(0).toUpperCase();
  };

  const generateEmptyTrend = () => {
    const hours = ['9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM'];
    return hours.map(time => ({ time, visitors: 0, pageViews: 0 }));
  };

  // Safe variables for dynamic rendering
  const totalSessions = data.todaySummary.total_sessions_today || 0;
  const uniqueVisitors = data.todaySummary.unique_visitors_today || 0;
  const avgDuration = data.todaySummary.avg_duration_sec || 0;

  if (error) {
    return (
      <div className="analytics-error">
        <AlertCircle size={40} />
        <h3>Data Unavailable</h3>
        <p>{error}</p>
        <button onClick={fetchAnalytics} className="retry-btn">Retry Connection</button>
      </div>
    );
  }

  return (
    <div className={`analytics-dashboard ${isDark ? 'dark-theme' : ''}`}>
      
      {/* HEADER */}
      <div className="analytics-header">
        <div className="header-title">
          <h2>Analytics Dashboard</h2>
          <p>Live insights & performance overview</p>
        </div>
        <div className="header-actions">
          <div className="date-badge"><Calendar size={14}/> Today</div>
          <div className="live-badge"><span className="pulse-dot"></span> Live</div>
        </div>
      </div>

      {/* DYNAMIC KPI CARDS */}
      <div className="kpi-grid">
        <div className="kpi-card active-now">
          <div className="kpi-icon"><User size={24} /></div>
          <div className="kpi-content">
            <p>Active Now</p>
            <h3>{loading ? '-' : data.activeNowCount}</h3>
            <span className="kpi-trend live-trend"><span className="pulse-dot"></span> Real-time</span>
          </div>
        </div>

        <div className="kpi-card sessions-today">
          <div className="kpi-icon"><LayoutTemplate size={24} /></div>
          <div className="kpi-content">
            <p>Total Sessions Today</p>
            <h3>{loading ? '-' : totalSessions.toLocaleString()}</h3>
            {totalSessions > 0 && <span className="kpi-trend positive"><TrendingUp size={12}/> Active</span>}
          </div>
        </div>

        <div className="kpi-card unique-visitors">
          <div className="kpi-icon"><User size={24} /></div>
          <div className="kpi-content">
            <p>Unique Visitors</p>
            <h3>{loading ? '-' : uniqueVisitors.toLocaleString()}</h3>
            {uniqueVisitors > 0 && <span className="kpi-trend positive"><TrendingUp size={12}/> Tracking</span>}
          </div>
        </div>

        <div className="kpi-card avg-duration">
          <div className="kpi-icon"><RefreshCw size={24} /></div>
          <div className="kpi-content">
            <p>Avg. Session Duration</p>
            <h3>{loading ? '-' : formatTime(avgDuration)}</h3>
          </div>
        </div>
      </div>

      {/* DYNAMIC DATA TABLES */}
      <div className="tables-grid">
        
        {/* LIVE VISITORS TABLE */}
        <div className="dashboard-card live-visitors-table">
          <div className="card-header">
            <h3><span className="pulse-dot"></span> Live Active Visitors</h3>
            <span className="auto-refresh">
              Auto Refresh: 30s 
              <RefreshCw size={14} className={loading ? 'spinning' : ''} onClick={fetchAnalytics}/>
            </span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Current Page</th>
                  <th>Device</th>
                  <th>Time Active</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="4" className="empty-state">Fetching live traffic...</td></tr>
                ) : data.activeVisitors.length > 0 ? (
                  data.activeVisitors.slice(0, 6).map((visitor, idx) => (
                    <tr key={visitor.session_id || idx}>
                      <td className="user-cell">
                        <div className={`avatar ${visitor.user_name?.toLowerCase().includes('guest') ? 'guest' : 'registered'}`}>
                          {getInitials(visitor.user_name)}
                        </div>
                        <div className="user-info">
                          <span className="u-name">{visitor.user_name || 'Guest Visitor'}</span>
                          {visitor.user_email && <span className="u-email">{visitor.user_email}</span>}
                        </div>
                      </td>
                      <td className="page-cell" title={visitor.current_page || visitor.landing_page}>
                        {visitor.current_page || visitor.landing_page || '/'}
                      </td>
                      <td className="device-cell">
                        {getDeviceIcon(visitor.device_type)}
                        <span className="device-tooltip">{visitor.os}</span>
                      </td>
                      <td className="time-cell">{formatTime(visitor.total_duration_sec)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="4" className="empty-state">No active visitors right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP VIEWED PAGES TABLE */}
        <div className="dashboard-card top-pages-table">
          <div className="card-header">
            <h3>⭐ Top Viewed Products & Pages</h3>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Page / Route</th>
                  <th>Total Views</th>
                  <th>Avg. Dwell Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="3" className="empty-state">Analyzing page views...</td></tr>
                ) : data.topPages.length > 0 ? (
                  data.topPages.map((page, idx) => (
                    <tr key={idx}>
                      <td className="page-name-cell">
                        <div className="page-icon">📄</div>
                        <span className="route-name" title={page.page_path}>
                          {page.page_path === '/' ? 'Home Page' : page.page_path.replace('/products/', 'Product: ').replace('/', '')}
                        </span>
                      </td>
                      <td className="views-cell">{page.total_views.toLocaleString()}</td>
                      <td className="time-cell">{formatTime(page.avg_time_spent)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="3" className="empty-state">Not enough pageview data for today yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* DYNAMIC CHART SECTION */}
      <div className="bottom-grid">
        <div className="dashboard-card chart-container">
          <div className="card-header">
            <h3>📈 Website Activity Trend (Today)</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="dot visitors"></span> Visitors</span>
              <span className="legend-item"><span className="dot pageviews"></span> Page Views</span>
            </div>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={data.activityTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVisitors" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#e84393" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#e84393" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#fdcb6e" stopOpacity={0.6}/>
                    <stop offset="95%" stopColor="#fdcb6e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border-color)', borderRadius: '8px', color: 'var(--text-main)' }} 
                  itemStyle={{ color: 'var(--text-main)' }}
                />
                <Area type="monotone" dataKey="visitors" stroke="#e84393" strokeWidth={3} fillOpacity={1} fill="url(#colorVisitors)" />
                <Area type="monotone" dataKey="pageViews" stroke="#fdcb6e" strokeWidth={3} fillOpacity={1} fill="url(#colorPageViews)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* PROMO / BRANDING CARD */}
        <div className="dashboard-card promo-card">
          <div className="promo-overlay"></div>
          <div className="promo-content">
            <h2 className="brand-title">Arzoo</h2>
            <p className="brand-tagline">Tradition in Every Thread...</p>
            <div className="promo-stats">
              <div className="p-stat">
                <span>Total Reach</span>
                <strong>{totalSessions.toLocaleString()}</strong>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;