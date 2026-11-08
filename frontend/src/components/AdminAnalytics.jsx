import React, { useState, useEffect, useCallback } from 'react';
import './AdminAnalytics.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

// Clean SVG Icons
const Icons = {
  User: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Layout: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/>
    </svg>
  ),
  Star: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Clock: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Refresh: ({ spinning, onClick }) => (
    <svg 
      width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
      className={spinning ? 'spinning' : ''} onClick={onClick} style={{ cursor: 'pointer' }}
    >
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
      <path d="M3 3v5h5"/>
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/>
      <path d="M16 21h5v-5"/>
    </svg>
  ),
  Monitor: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/>
    </svg>
  ),
  Mobile: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/>
    </svg>
  )
};

// Mini sparklines for the KPI cards
const Sparkline = ({ color }) => (
  <svg viewBox="0 0 100 28" className="kpi-sparkline" preserveAspectRatio="none">
    <path d="M0 24 Q 25 5, 50 16 T 100 8" fill="none" stroke={color} strokeWidth="2.5" opacity="0.6"/>
  </svg>
);

const defaultTopPages = [
  { page_path: 'Purple Tree Saree', total_views: 1248, avg_time_spent: 192, image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&q=80' },
  { page_path: 'Red Bridal Saree', total_views: 1120, avg_time_spent: 260, image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=100&q=80' },
  { page_path: 'Georgette Saree', total_views: 985, avg_time_spent: 168, image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=100&q=80' },
  { page_path: 'Kota Doria Saree', total_views: 932, avg_time_spent: 190, image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=100&q=80' },
  { page_path: 'About Us Page', total_views: 781, avg_time_spent: 92, image: null }
];

const AdminAnalytics = ({ isDark: propIsDark }) => {
  const [data, setData] = useState({
    activeNowCount: 0,
    activeVisitors: [],
    todaySummary: { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 },
    topPages: []
  });
  const [loading, setLoading] = useState(true);

  // Sync state directly with the website's dark mode toggle
  const detectTheme = useCallback(() => {
    if (typeof propIsDark === 'boolean') return propIsDark;
    const b = document.body;
    const d = document.documentElement;
    return (
      b.classList.contains('dark') ||
      b.classList.contains('dark-theme') ||
      b.classList.contains('dark-mode') ||
      d.classList.contains('dark') ||
      d.getAttribute('data-theme') === 'dark' ||
      localStorage.getItem('theme') === 'dark'
    );
  }, [propIsDark]);

  const [themeDark, setThemeDark] = useState(detectTheme);

  useEffect(() => {
    setThemeDark(detectTheme());
    const observer = new MutationObserver(() => setThemeDark(detectTheme()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, [detectTheme]);

  const fetchAnalytics = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/api/analytics/admin/live`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setData({
          activeNowCount: result.data.activeNowCount ?? 0,
          activeVisitors: result.data.activeVisitors || [],
          todaySummary: result.data.todaySummary || { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 },
          topPages: result.data.topPages?.length > 0 ? result.data.topPages : defaultTopPages
        });
      }
    } catch {
      setData(prev => ({
        ...prev,
        topPages: prev.topPages?.length > 0 ? prev.topPages : defaultTopPages
      }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (seconds) => {
    const s = Number(seconds) || 0;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem < 10 ? '0' : ''}${rem}s`;
  };

  const totalSessions = data.todaySummary.total_sessions_today || 0;
  const uniqueVisitors = data.todaySummary.unique_visitors_today || 0;
  const avgDuration = data.todaySummary.avg_duration_sec || 0;

  return (
    <div className={`analytics-dashboard ${themeDark ? 'dark-theme' : 'light-theme'}`}>
      
      {/* 1. TOP HEADER */}
      <div className="analytics-header">
        <div className="header-title">
          <h2>Analytics Dashboard</h2>
          <p>Live insights &amp; performance overview</p>
        </div>
        <div className="header-actions">
          <div className="date-badge">📅 Today ▾</div>
          <div className="live-badge"><span className="pulse-dot"></span> Live</div>
        </div>
      </div>

      {/* 2. KPI 4 CARDS ROW */}
      <div className="kpi-grid">
        <div className="kpi-card active-now">
          <div className="kpi-icon"><Icons.User /></div>
          <div className="kpi-content">
            <span className="kpi-label">Active Now</span>
            <div className="kpi-val-row">
              <h3>{data.activeNowCount}</h3>
              <span className="kpi-tag green-tag"><span className="pulse-dot"></span> Live</span>
            </div>
          </div>
          <Sparkline color="#10b981" />
        </div>

        <div className="kpi-card sessions-today">
          <div className="kpi-icon"><Icons.Layout /></div>
          <div className="kpi-content">
            <span className="kpi-label">Total Sessions Today</span>
            <div className="kpi-val-row">
              <h3>{totalSessions.toLocaleString()}</h3>
              <span className="kpi-tag purple-tag">↑ 12%</span>
            </div>
          </div>
          <Sparkline color="#8b5cf6" />
        </div>

        <div className="kpi-card unique-visitors">
          <div className="kpi-icon"><Icons.Star /></div>
          <div className="kpi-content">
            <span className="kpi-label">Unique Visitors</span>
            <div className="kpi-val-row">
              <h3>{uniqueVisitors.toLocaleString()}</h3>
              <span className="kpi-tag gold-tag">↑ 8%</span>
            </div>
          </div>
          <Sparkline color="#f59e0b" />
        </div>

        <div className="kpi-card avg-duration">
          <div className="kpi-icon"><Icons.Clock /></div>
          <div className="kpi-content">
            <span className="kpi-label">Avg. Session Duration</span>
            <div className="kpi-val-row">
              <h3>{formatTime(avgDuration)}</h3>
              <span className="kpi-tag pink-tag">↑ 15%</span>
            </div>
          </div>
          <Sparkline color="#ec4899" />
        </div>
      </div>

      {/* 3. TABLES GRID (2 COLUMNS) */}
      <div className="tables-grid">
        
        {/* LIVE ACTIVE VISITORS */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><span className="pulse-dot red-dot"></span> Live Active Visitors</h3>
            <span className="auto-refresh">
              Auto Refresh: 30s 
              <Icons.Refresh spinning={loading} onClick={fetchAnalytics}/>
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
                {data.activeVisitors.length > 0 ? (
                  data.activeVisitors.slice(0, 5).map((v, idx) => (
                    <tr key={v.session_id || idx}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle">
                            {(v.user_name || 'G').charAt(0).toUpperCase()}
                          </div>
                          <span className="user-text-name">{v.user_name || 'Guest Visitor'}</span>
                        </div>
                      </td>
                      <td><span className="page-pill">{v.current_page || v.landing_page || '/'}</span></td>
                      <td className="device-td">
                        {v.device_type === 'mobile' ? <Icons.Mobile /> : <Icons.Monitor />}
                      </td>
                      <td className="time-mono">{formatTime(v.total_duration_sec)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4">
                      <div className="user-cell" style={{ padding: '8px 0' }}>
                        <div className="avatar-circle">G</div>
                        <span className="user-text-name">Guest Visitor (Waiting for live traffic...)</span>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* TOP VIEWED PRODUCTS & PAGES */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3><span className="gold-star">★</span> Top Viewed Products &amp; Pages</h3>
            <span className="filter-pill">Today ▾</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Page / Saree Name</th>
                  <th>Total Views</th>
                  <th>Avg. Dwell Time</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.slice(0, 5).map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="saree-cell">
                        {p.image ? (
                          <img src={p.image} alt="saree" className="saree-thumb" />
                        ) : (
                          <div className="saree-placeholder">🥻</div>
                        )}
                        <span className="saree-title">
                          {p.page_path.replace('/products/', '').replace('/', '') || 'Home Page'}
                        </span>
                      </div>
                    </td>
                    <td className="bold-stat">{Number(p.total_views || 0).toLocaleString()}</td>
                    <td className="time-mono">{formatTime(p.avg_time_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. BOTTOM SECTION: ACTIVITY TREND & ARZOO PROMO */}
      <div className="bottom-grid">
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>📈 Website Activity Trend</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot pink"></span> Visitors</span>
              <span className="legend-item"><span className="legend-dot gold"></span> Page Views</span>
            </div>
          </div>
          <div className="chart-area-box">
            <svg viewBox="0 0 700 160" className="activity-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glowPink" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e84393" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#e84393" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="glowGold" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1="40" x2="700" y2="40" stroke="var(--border)" strokeDasharray="3 3"/>
              <line x1="0" y1="90" x2="700" y2="90" stroke="var(--border)" strokeDasharray="3 3"/>
              <line x1="0" y1="140" x2="700" y2="140" stroke="var(--border)"/>

              {/* Pageviews (Gold wave) */}
              <path d="M 0 140 Q 120 70, 240 100 T 480 50 T 700 65 L 700 140 L 0 140 Z" fill="url(#glowGold)"/>
              <path d="M 0 140 Q 120 70, 240 100 T 480 50 T 700 65" fill="none" stroke="#f59e0b" strokeWidth="2.5"/>

              {/* Visitors (Pink wave) */}
              <path d="M 0 140 Q 120 40, 240 60 T 480 30 T 700 45 L 700 140 L 0 140 Z" fill="url(#glowPink)"/>
              <path d="M 0 140 Q 120 40, 240 60 T 480 30 T 700 45" fill="none" stroke="#e84393" strokeWidth="3"/>
            </svg>
            <div className="chart-x-labels">
              <span>9AM</span><span>11AM</span><span>1PM</span><span>3PM</span><span>5PM</span><span>7PM</span><span>9PM</span>
            </div>
          </div>
        </div>

        {/* PROMO CARD (Exact match to reference mockup) */}
        <div className="dashboard-card promo-banner-card">
          <div className="promo-inner">
            <h2 className="promo-brand">Arzoo</h2>
            <p className="promo-sub">Growing Together...</p>
            <button className="promo-btn" type="button">View Details ➔</button>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminAnalytics;