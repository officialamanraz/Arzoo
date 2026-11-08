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
  const pageStartTimeRef = useRef(Date.now());

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

  // 1. Session start & route change tracking
  useEffect(() => {
    const { visitorUuid, sessionId } = getVisitorDetails();
    const token = localStorage.getItem('token');

    fetch(`${API_BASE_URL}/api/analytics/session`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        sessionId,
        visitorUuid,
        landingPage: location.pathname,
        referrer: document.referrer || 'Direct'
      })
    }).catch(() => {});
  }, [location.pathname]);

  // 2. Track page views
  useEffect(() => {
    const { sessionId } = getVisitorDetails();
    pageStartTimeRef.current = Date.now();

    const pathParts = location.pathname.split('/');
    const isProduct = pathParts[1] === 'products' && pathParts[2] && !isNaN(pathParts[2]);
    const productId = isProduct ? Number(pathParts[2]) : null;

    fetch(`${API_BASE_URL}/api/analytics/pageview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        pagePath: location.pathname,
        pageTitle: document.title,
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
  }, [location.pathname]);

  // 3. Heartbeat (Every 25 seconds) & Tab Exit
  useEffect(() => {
    const { sessionId, visitorUuid } = getVisitorDetails();

    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
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
            incrementSec: 25
          })
        }).catch(() => {});
      }
    }, 25000);

    const handleUnload = () => {
      const finalSec = Math.round((Date.now() - pageStartTimeRef.current) / 1000);
      const payload = JSON.stringify({
        sessionId,
        viewId: activeViewIdRef.current,
        finalPageTimeSec: finalSec
      });

      if (navigator.sendBeacon) {
        navigator.sendBeacon(`${API_BASE_URL}/api/analytics/exit`, payload);
      }
    };

    window.addEventListener('beforeunload', handleUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener('beforeunload', handleUnload);
    };
  }, []);

  return null;
}