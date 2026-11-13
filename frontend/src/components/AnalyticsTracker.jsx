import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'anon-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
};

export default function AnalyticsTracker() {
  const location = useLocation();
  const activeViewIdRef = useRef(null);
  const lastSyncTimeRef = useRef(Date.now());
  const sessionInitializedRef = useRef(false);

  // Check if current route is an Admin page (skip tracking admin activity)
  const isAdminRoute = location.pathname.startsWith('/admin');

  const getVisitorDetails = () => {
    let visitorUuid = localStorage.getItem('arzoo_visitor_uuid');
    if (!visitorUuid) {
      visitorUuid = generateUUID();
      localStorage.setItem('arzoo_visitor_uuid', visitorUuid);
    }

    let sessionId = sessionStorage.getItem('arzoo_session_id');
    if (!sessionId) {
      sessionId = 'sess-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9);
      sessionStorage.setItem('arzoo_session_id', sessionId);
    }

    return { visitorUuid, sessionId };
  };

  // Helper: Flush unsaved seconds spent on the current page before switching pages or closing tab
  const flushRemainingPageTime = (isExitingSite = false) => {
    const { sessionId, visitorUuid } = getVisitorDetails();
    const elapsedSec = Math.round((Date.now() - lastSyncTimeRef.current) / 1000);
    lastSyncTimeRef.current = Date.now();

    // Ignore noise under 1 second unless exiting the site
    if (elapsedSec <= 0 && !isExitingSite) return;
    const boundedSec = Math.min(Math.max(elapsedSec, 0), 30); // Cap between 0-30s since last heartbeat

    if (isExitingSite) {
      const payload = JSON.stringify({
        sessionId,
        viewId: activeViewIdRef.current,
        finalPageTimeSec: boundedSec
      });

      if (navigator.sendBeacon) {
        const blob = new Blob([payload], { type: 'application/json' });
        navigator.sendBeacon(`${API_BASE_URL}/api/analytics/exit`, blob);
      } else {
        fetch(`${API_BASE_URL}/api/analytics/exit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: payload,
          keepalive: true
        }).catch(() => {});
      }
    } else if (activeViewIdRef.current && boundedSec > 0) {
      // User clicked to another page before 25s heartbeat — save the exact seconds spent on previous page
      const token = localStorage.getItem('token');
      fetch(`${API_BASE_URL}/api/analytics/heartbeat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sessionId,
          visitorUuid,
          viewId: activeViewIdRef.current,
          incrementSec: boundedSec
        }),
        keepalive: true
      }).catch(() => {});
    }
  };

  // 1. Session Start & Route Change Tracking
  useEffect(() => {
    if (isAdminRoute) return;

    const { visitorUuid, sessionId } = getVisitorDetails();
    const token = localStorage.getItem('token');

    // First, flush time spent on the previous page before starting the new page view
    if (sessionInitializedRef.current && activeViewIdRef.current) {
      flushRemainingPageTime(false);
    }

    // Initialize/refresh session
    const sessionPayload = {
      sessionId,
      visitorUuid,
      landingPage: location.pathname,
      referrer: document.referrer || 'Direct'
    };

    fetch(`${API_BASE_URL}/api/analytics/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify(sessionPayload)
    })
      .then((res) => res.json())
      .then(() => {
        sessionInitializedRef.current = true;
      })
      .catch((err) => console.error('Analytics Session Error:', err));

    // Record the new Page View
    lastSyncTimeRef.current = Date.now();
    const pathParts = location.pathname.split('/');
    const isProduct = pathParts[1] === 'products' && pathParts[2] && !isNaN(pathParts[2]);
    const productId = isProduct ? Number(pathParts[2]) : null;

    fetch(`${API_BASE_URL}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        pagePath: location.pathname,
        pageTitle: document.title || 'Arzoo',
        productId
      })
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.viewId) {
          activeViewIdRef.current = data.viewId;
        }
      })
      .catch(() => {});
  }, [location.pathname, isAdminRoute]);

  // 2. Heartbeat (Every 25 seconds) & Tab Exit Listener
  useEffect(() => {
    if (isAdminRoute) return;

    const { sessionId, visitorUuid } = getVisitorDetails();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        const token = localStorage.getItem('token');
        lastSyncTimeRef.current = Date.now(); // Reset sync timer on heartbeat

        fetch(`${API_BASE_URL}/api/analytics/heartbeat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({
            sessionId,
            visitorUuid,
            viewId: activeViewIdRef.current,
            incrementSec: 25
          })
        }).catch(() => {});
      }
    }, 25000);

    const handleUnload = () => {
      flushRemainingPageTime(true);
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, [isAdminRoute]);

  return null;
}