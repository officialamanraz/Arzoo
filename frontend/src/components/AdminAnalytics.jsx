import React, { useState, useEffect, useCallback } from 'react';
import './AdminAnalytics.css';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const Icons = {
  User: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  Layout: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>,
  Star: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  Clock: () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Refresh: ({ spinning, onClick }) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className={spinning ? 'spinning' : ''} onClick={onClick} style={{ cursor: 'pointer' }}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21h5v-5"/></svg>,
  Monitor: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>,
  Mobile: () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>,
  TrendingUp: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  TrendingDown: () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/></svg>
};

const Sparkline = ({ color }) => (
  <svg viewBox="0 0 100 28" className="kpi-sparkline" preserveAspectRatio="none">
    <path d="M0 24 Q 25 5, 50 16 T 100 8" fill="none" stroke={color} strokeWidth="2.5" opacity="0.6"/>
  </svg>
);

const AdminAnalytics = ({ isDark: propIsDark }) => {
  // Default to today's date in YYYY-MM-DD (local time)
  const getTodayISO = () => {
    const now = new Date();
    const offset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - offset).toISOString().split('T')[0];
  };

  const [selectedDate, setSelectedDate] = useState(getTodayISO);
  const [range, setRange] = useState('day'); // 'day', '7d', '30d'
  const [data, setData] = useState({
    activeNowCount: 0,
    activeVisitors: [],
    todaySummary: { total_sessions_today: 0, unique_visitors_today: 0, avg_duration_sec: 0 },
    yesterdaySummary: { total_sessions_yesterday: 0, unique_visitors_yesterday: 0, avg_duration_yesterday: 0 },
    topPages: [],
    sessionLogs: [],
    trendData: [],
    totalLifetimeOrders: 0
  });
  const [loading, setLoading] = useState(true);

  const detectTheme = useCallback(() => {
    if (typeof propIsDark === 'boolean') return propIsDark;
    return document.body.classList.contains('dark') || localStorage.getItem('theme') === 'dark';
  }, [propIsDark]);

  const [themeDark, setThemeDark] = useState(detectTheme);

  useEffect(() => {
    setThemeDark(detectTheme());
    const observer = new MutationObserver(() => setThemeDark(detectTheme()));
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    return () => observer.disconnect();
  }, [detectTheme]);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const query = `?date=${encodeURIComponent(selectedDate)}&range=${encodeURIComponent(range)}`;
      const response = await fetch(`${API_BASE_URL}/api/analytics/admin/live${query}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success && result.data) {
        setData({
          activeNowCount: result.data.activeNowCount ?? 0,
          activeVisitors: result.data.activeVisitors || [],
          todaySummary: result.data.todaySummary || {},
          yesterdaySummary: result.data.yesterdaySummary || {},
          topPages: result.data.topPages || [],
          sessionLogs: result.data.sessionLogs || [],
          trendData: result.data.trendData || [],
          totalLifetimeOrders: result.data.totalLifetimeOrders || 0
        });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate, range]);

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 30000);
    return () => clearInterval(interval);
  }, [fetchAnalytics]);

  const formatTime = (seconds) => {
    const s = Number(seconds) || 0;
    const hrs = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const rem = s % 60;
    if (hrs > 0) return `${hrs}h ${m}m ${rem}s`;
    return `${m}m ${rem < 10 ? '0' : ''}${rem}s`;
  };

  const formatDateTime = (ts) => {
    if (!ts) return '-';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
  };

  const calcGrowth = (today, yesterday) => {
    const t = Number(today) || 0;
    const y = Number(yesterday) || 0;
    if (y === 0) return { percent: t > 0 ? 100 : 0, isUp: true };
    const diff = t - y;
    const percent = Math.round((Math.abs(diff) / y) * 100);
    return { percent: isFinite(percent) ? percent : 0, isUp: diff >= 0 };
  };

  const sessions = data.todaySummary.total_sessions_today || 0;
  const sessionsTrend = calcGrowth(sessions, data.yesterdaySummary.total_sessions_yesterday);

  const visitors = data.todaySummary.unique_visitors_today || 0;
  const visitorsTrend = calcGrowth(visitors, data.yesterdaySummary.unique_visitors_yesterday);

  const duration = data.todaySummary.avg_duration_sec || 0;
  const durationTrend = calcGrowth(duration, data.yesterdaySummary.avg_duration_yesterday);

  const generateChartPath = (dataArray, key) => {
    if (!dataArray || dataArray.length === 0) return "M 0 140 L 700 140";
    const maxVal = Math.max(...dataArray.map(d => Math.max(d.visitors || 0, d.pageViews || 0)), 10);
    const stepX = 700 / (dataArray.length - 1 || 1);
    
    let path = `M 0 ${140 - ((dataArray[0][key] || 0) / maxVal) * 100}`;
    for (let i = 1; i < dataArray.length; i++) {
      const x = i * stepX;
      const y = 140 - ((dataArray[i][key] || 0) / maxVal) * 100;
      const prevX = (i - 1) * stepX;
      const prevY = 140 - ((dataArray[i - 1][key] || 0) / maxVal) * 100;
      const cp1x = prevX + (x - prevX) / 2;
      path += ` C ${cp1x} ${prevY}, ${cp1x} ${y}, ${x} ${y}`;
    }
    return path;
  };
  
  const visitorPath = generateChartPath(data.trendData, 'visitors');
  const pageViewsPath = generateChartPath(data.trendData, 'pageViews');

  return (
    <div className={`analytics-dashboard ${themeDark ? 'dark-theme' : 'light-theme'}`}>
      
      {/* 1. TOP HEADER WITH INTERACTIVE DATE & RANGE PICKER */}
      <div className="analytics-header">
        <div className="header-title">
          <h2>Analytics Dashboard</h2>
          <p>Live insights, visitor sessions &amp; date-wise time tracking</p>
        </div>
        <div className="header-actions">
          <input
            type="date"
            className="date-picker-input"
            value={selectedDate}
            max={getTodayISO()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
          <select
            className="range-select-input"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="day">Selected Date</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
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
            <span className="kpi-label">Total Sessions ({range === 'day' ? selectedDate : range})</span>
            <div className="kpi-val-row">
              <h3>{sessions.toLocaleString()}</h3>
              <span className={`kpi-tag ${sessionsTrend.isUp ? 'purple-tag' : 'red-down'}`}>
                {sessionsTrend.isUp ? <Icons.TrendingUp /> : <Icons.TrendingDown />} {sessionsTrend.percent}%
              </span>
            </div>
          </div>
          <Sparkline color="#8b5cf6" />
        </div>

        <div className="kpi-card unique-visitors">
          <div className="kpi-icon"><Icons.Star /></div>
          <div className="kpi-content">
            <span className="kpi-label">Unique Visitors</span>
            <div className="kpi-val-row">
              <h3>{visitors.toLocaleString()}</h3>
              <span className={`kpi-tag ${visitorsTrend.isUp ? 'gold-tag' : 'red-down'}`}>
                {visitorsTrend.isUp ? <Icons.TrendingUp /> : <Icons.TrendingDown />} {visitorsTrend.percent}%
              </span>
            </div>
          </div>
          <Sparkline color="#f59e0b" />
        </div>

        <div className="kpi-card avg-duration">
          <div className="kpi-icon"><Icons.Clock /></div>
          <div className="kpi-content">
            <span className="kpi-label">Avg. Session Duration</span>
            <div className="kpi-val-row">
              <h3>{formatTime(duration)}</h3>
              <span className={`kpi-tag ${durationTrend.isUp ? 'pink-tag' : 'red-down'}`}>
                {durationTrend.isUp ? <Icons.TrendingUp /> : <Icons.TrendingDown />} {durationTrend.percent}%
              </span>
            </div>
          </div>
          <Sparkline color="#ec4899" />
        </div>
      </div>

      {/* 3. TABLES GRID (Live Traffic & Top Pages) */}
      <div className="tables-grid">
        <div className="dashboard-card">
          <div className="card-header">
            <h3><span className="pulse-dot red-dot"></span> Live Active Visitors (Right Now)</h3>
            <span className="auto-refresh">Auto Refresh: 30s <Icons.Refresh spinning={loading} onClick={fetchAnalytics}/></span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>User Name</th>
                  <th>Current Page</th>
                  <th>Device</th>
                  <th>Started At</th>
                  <th>Time Active</th>
                </tr>
              </thead>
              <tbody>
                {data.activeVisitors.length > 0 ? (
                  data.activeVisitors.slice(0, 6).map((v, idx) => (
                    <tr key={v.session_id || idx}>
                      <td>
                        <div className="user-cell">
                          <div className="avatar-circle">{(v.user_name || 'G').charAt(0).toUpperCase()}</div>
                          <span className="user-text-name">{v.user_name || 'Guest Visitor'}</span>
                        </div>
                      </td>
                      <td><span className="page-pill">{v.current_page || v.landing_page || '/'}</span></td>
                      <td className="device-td">{v.device_type === 'mobile' ? <Icons.Mobile /> : <Icons.Monitor />}</td>
                      <td className="time-mono">{formatDateTime(v.started_at)}</td>
                      <td className="time-mono bold-stat">{formatTime(v.total_duration_sec)}</td>
                    </tr>
                  ))
                ) : (
                  <tr><td colSpan="5"><div className="user-cell" style={{ padding: '8px 0' }}><div className="avatar-circle">G</div><span className="user-text-name">Waiting for live traffic...</span></div></td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="card-header">
            <h3><span className="gold-star">★</span> Top Viewed Products &amp; Pages</h3>
            <span className="filter-pill">{range === 'day' ? selectedDate : `Last ${range}`}</span>
          </div>
          <div className="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Page / Route Name</th>
                  <th>Views</th>
                  <th>Avg. Time</th>
                  <th>Total Time</th>
                </tr>
              </thead>
              <tbody>
                {data.topPages.length > 0 ? data.topPages.map((p, idx) => (
                  <tr key={idx}>
                    <td>
                      <div className="saree-cell">
                        <div className="saree-placeholder">🥻</div>
                        <span className="saree-title">{p.page_path.replace('/products/', '').replace('/', '') || 'Home Page'}</span>
                      </div>
                    </td>
                    <td className="bold-stat">{Number(p.total_views || 0).toLocaleString()}</td>
                    <td className="time-mono">{formatTime(p.avg_time_spent)}</td>
                    <td className="time-mono">{formatTime(p.total_time_spent)}</td>
                  </tr>
                )) : (
                  <tr><td colSpan="4" style={{textAlign: 'center', color:'var(--text-secondary)'}}>No views recorded for this date.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 4. NEW SECTION: DATE & TIME WISE USER SESSION HISTORY */}
      <div className="dashboard-card" style={{ marginBottom: '24px' }}>
        <div className="card-header">
          <h3>🕒 Visitor Session History (Date, Time &amp; Duration Breakdown)</h3>
          <span className="filter-pill">Showing last {data.sessionLogs.length} sessions</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th>Visitor / User</th>
                <th>Device &amp; Browser</th>
                <th>Entry Page</th>
                <th>Last Page</th>
                <th>Pages Tapped</th>
                <th>Session Start (Date &amp; Time)</th>
                <th>Last Active Time</th>
                <th>Total Time Spent</th>
              </tr>
            </thead>
            <tbody>
              {data.sessionLogs.length > 0 ? (
                data.sessionLogs.map((log, i) => (
                  <tr key={log.session_id || i}>
                    <td>
                      <div className="user-cell">
                        <div className="avatar-circle">{(log.user_name || 'G').charAt(0).toUpperCase()}</div>
                        <div>
                          <div className="user-text-name">{log.user_name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>#{log.visitor_uuid?.slice(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="device-td">{log.device_type} ({log.browser})</td>
                    <td><span className="page-pill">{log.landing_page || '/'}</span></td>
                    <td><span className="page-pill">{log.last_page || log.landing_page || '/'}</span></td>
                    <td className="bold-stat">{log.pages_visited || 1}</td>
                    <td className="time-mono">{formatDateTime(log.started_at)}</td>
                    <td className="time-mono">{formatDateTime(log.last_active_at)}</td>
                    <td className="time-mono bold-stat" style={{ color: '#10b981' }}>{formatTime(log.total_duration_sec)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No visitor sessions found for {selectedDate}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. BOTTOM SECTION: SVG TREND CHART & DYNAMIC ORDER PROMO */}
      <div className="bottom-grid">
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <h3>📈 Hourly Website Activity ({selectedDate})</h3>
            <div className="chart-legend">
              <span className="legend-item"><span className="legend-dot pink"></span> Visitors</span>
              <span className="legend-item"><span className="legend-dot gold"></span> Page Views</span>
            </div>
          </div>
          <div className="chart-area-box">
            <svg viewBox="0 0 700 160" className="activity-svg" preserveAspectRatio="none">
              <defs>
                <linearGradient id="glowPink" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#e84393" stopOpacity="0.4" /><stop offset="100%" stopColor="#e84393" stopOpacity="0.0" /></linearGradient>
                <linearGradient id="glowGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#f59e0b" stopOpacity="0.35" /><stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" /></linearGradient>
              </defs>
              <line x1="0" y1="40" x2="700" y2="40" stroke="var(--border)" strokeDasharray="3 3"/>
              <line x1="0" y1="90" x2="700" y2="90" stroke="var(--border)" strokeDasharray="3 3"/>
              <line x1="0" y1="140" x2="700" y2="140" stroke="var(--border)"/>

              <path d={`${pageViewsPath} L 700 140 L 0 140 Z`} fill="url(#glowGold)"/>
              <path d={pageViewsPath} fill="none" stroke="#f59e0b" strokeWidth="2.5"/>

              <path d={`${visitorPath} L 700 140 L 0 140 Z`} fill="url(#glowPink)"/>
              <path d={visitorPath} fill="none" stroke="#e84393" strokeWidth="3"/>
            </svg>
            <div className="chart-x-labels">
              {data.trendData.length > 0 
                ? data.trendData.map((d, i) => <span key={i}>{d.time}</span>) 
                : <span>No hourly activity recorded on {selectedDate}</span>}
            </div>
          </div>
        </div>

        <div className="dashboard-card promo-banner-card">
          <div className="promo-inner">
            <h2 className="promo-brand">Arzoo</h2>
            <p className="promo-sub">Growing Together...</p>
            <div className="promo-total-orders">
              <span className="order-label">Lifetime Success:</span>
              <div className="order-number-row">
                <span className="order-number">{data.totalLifetimeOrders.toLocaleString()}</span>
                <span className="order-text">Orders Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminAnalytics;