import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaHeart, FaRegHeart, FaComment, FaWhatsapp } from 'react-icons/fa';

import Recommended from "../components/Recommended";
import ProductReviewsWidget from './ProductReviewsWidget'; // 🌟 Naya Review Widget Import kiya
import './ProductDetail.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;
const FALLBACK_IMAGE = "/saare_1.jpeg";

const SPEC_FIELDS = [
  { key: 'fabric', label: 'Fabric/Material' },
  { key: 'primary_color', label: 'Primary Color' },
  { key: 'other_color', label: 'Other Colors' },
  { key: 'pattern', label: 'Pattern' },
  { key: 'craft', label: 'Craft' },
  { key: 'weave', label: 'Weave' },
  { key: 'zari_type', label: 'Zari Type' },
  { key: 'border_type', label: 'Border Type' },
  { key: 'border_motifs', label: 'Border Motifs' },
  { key: 'blouse', label: 'Blouse' },
  { key: 'blouse_length', label: 'Blouse Length' },
  { key: 'khats', label: 'Khats' },
  { key: 'weight', label: 'Weight' }
];

const MFG_FIELDS = [
  { key: 'origin', label: 'Country of Origin' },
  { key: 'producer', label: 'Producer' },
  { key: 'maker', label: 'Maker' },
  { key: 'producer_address', label: 'Name and address of the Manufacturer', fullWidth: true },
  { key: 'packer_address', label: 'Name and address of the Packer', fullWidth: true }
];

/* =========================================================
   AMAZON-STYLE FULLSCREEN IMAGE VIEWER (touch devices)
   ========================================================= */
const MIN_SCALE = 1;
const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;
const ZOOMED_THRESHOLD = 0.01;
const SNAP_TO_FIT_SCALE = 1.05;
const DOUBLE_TAP_DELAY_MS = 300;
const DOUBLE_TAP_DISTANCE_PX = 40;
const TAP_MOVE_TOLERANCE_PX = 10;
const TAP_MAX_DURATION_MS = 250;
const AXIS_LOCK_PX = 8;
const SWIPE_DISTANCE_RATIO = 0.2;
const SWIPE_VELOCITY_PX_PER_MS = 0.5;
const EDGE_RESISTANCE = 0.35;
const CLOSE_DRAG_PX = 110;
const CLOSE_FADE_RANGE_RATIO = 0.6;
const MIN_BACKDROP_ALPHA = 0.35;
const SNAP_MS = 220;
const SLIDE_OUT_MS = 160;
const WHEEL_ZOOM_SPEED = 0.002;
const HINT_VISIBLE_MS = 3200;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

function MobileImageZoom({
  images = [],
  startIndex = 0,
  title = '',
  fallbackSrc = '',
  hintText = 'Double tap or pinch to zoom',
  onClose
}) {
  const lastIndex = Math.max(0, images.length - 1);
  const [index, setIndex] = useState(clamp(startIndex, 0, lastIndex));
  const [direction, setDirection] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [showHint, setShowHint] = useState(true);

  const overlayRef = useRef(null);
  const stageRef = useRef(null);
  const imgRef = useRef(null);
  const thumbsRef = useRef(null);

  const transform = useRef({ scale: MIN_SCALE, x: 0, y: 0 });
  const pointers = useRef(new Map());
  const gesture = useRef(null);
  const lastTap = useRef({ time: 0, x: 0, y: 0 });
  const isBusy = useRef(false);
  const timers = useRef([]);
  const indexRef = useRef(index);
  indexRef.current = index;

  const later = (fn, ms) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };

  const applyTransform = useCallback((animate = false) => {
    const img = imgRef.current;
    if (!img) return;
    const { scale, x, y } = transform.current;
    img.style.transition = animate ? `transform ${SNAP_MS}ms ease-out` : 'none';
    img.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
    const zoomed = scale > MIN_SCALE + ZOOMED_THRESHOLD;
    setIsZoomed((prev) => (prev === zoomed ? prev : zoomed));
  }, []);

  const setBackdrop = (alpha) => {
    if (overlayRef.current) overlayRef.current.style.setProperty('--mz-backdrop-alpha', String(alpha));
  };

  const clampPan = (scale, x, y) => {
    const stage = stageRef.current;
    const img = imgRef.current;
    if (!stage || !img) return { x, y };
    const maxX = Math.max(0, (img.offsetWidth * scale - stage.clientWidth) / 2);
    const maxY = Math.max(0, (img.offsetHeight * scale - stage.clientHeight) / 2);
    return { x: clamp(x, -maxX, maxX), y: clamp(y, -maxY, maxY) };
  };

  const toStagePoint = (clientX, clientY) => {
    const rect = stageRef.current.getBoundingClientRect();
    return { x: clientX - rect.left - rect.width / 2, y: clientY - rect.top - rect.height / 2 };
  };

  const resetTransform = useCallback((animate = false) => {
    transform.current = { scale: MIN_SCALE, x: 0, y: 0 };
    applyTransform(animate);
  }, [applyTransform]);

  const zoomAt = (p, nextScale, animate = false) => {
    const { scale, x, y } = transform.current;
    const target = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    const ratio = target / scale;
    const pan = clampPan(target, p.x - (p.x - x) * ratio, p.y - (p.y - y) * ratio);
    transform.current = { scale: target, x: pan.x, y: pan.y };
    applyTransform(animate);
  };

  const goTo = useCallback((next, dir) => {
    if (next < 0 || next > lastIndex || next === indexRef.current) return;
    setDirection(dir !== undefined ? dir : next > indexRef.current ? 1 : -1);
    setIndex(next);
  }, [lastIndex]);

  const slideOutThenGo = (dir) => {
    const stage = stageRef.current;
    isBusy.current = true;
    transform.current = { scale: MIN_SCALE, x: -dir * stage.clientWidth, y: 0 };
    imgRef.current.style.transition = `transform ${SLIDE_OUT_MS}ms ease-in`;
    imgRef.current.style.transform = `translate3d(${transform.current.x}px, 0, 0) scale(1)`;
    later(() => {
      isBusy.current = false;
      goTo(indexRef.current + dir, dir);
    }, SLIDE_OUT_MS);
  };

  const closeViewer = useCallback(() => {
    if (onClose) onClose(indexRef.current);
  }, [onClose]);

  const handlePointerDown = (e) => {
    if (isBusy.current) return;
    stageRef.current.setPointerCapture(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    setShowHint(false);

    if (pointers.current.size === 1) {
      gesture.current = {
        mode: 'pending',
        axis: null,
        startX: e.clientX,
        startY: e.clientY,
        startTime: performance.now(),
        baseX: transform.current.x,
        baseY: transform.current.y,
        prevX: e.clientX,
        prevTime: performance.now(),
        velocityX: 0,
        pinched: false
      };
    } else if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()];
      gesture.current = {
        ...gesture.current,
        mode: 'pinch',
        pinched: true,
        startDist: Math.hypot(a.x - b.x, a.y - b.y) || 1,
        startScale: transform.current.scale,
        prevMid: toStagePoint((a.x + b.x) / 2, (a.y + b.y) / 2)
      };
    }
  };

  const handlePinchMove = () => {
    const [a, b] = [...pointers.current.values()];
    const g = gesture.current;
    const mid = toStagePoint((a.x + b.x) / 2, (a.y + b.y) / 2);
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const { scale, x, y } = transform.current;
    const target = clamp(g.startScale * (dist / g.startDist), MIN_SCALE, MAX_SCALE);
    const ratio = target / scale;
    const pan = clampPan(target, mid.x - (g.prevMid.x - x) * ratio, mid.y - (g.prevMid.y - y) * ratio);
    transform.current = { scale: target, x: pan.x, y: pan.y };
    g.prevMid = mid;
    applyTransform(false);
  };

  const handlePointerMove = (e) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;

    if (pointers.current.size >= 2) {
      handlePinchMove();
      return;
    }

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const now = performance.now();
    if (now > g.prevTime) {
      g.velocityX = (e.clientX - g.prevX) / (now - g.prevTime);
      g.prevX = e.clientX;
      g.prevTime = now;
    }

    if (transform.current.scale > MIN_SCALE + ZOOMED_THRESHOLD) {
      g.mode = 'pan';
      const pan = clampPan(transform.current.scale, g.baseX + dx, g.baseY + dy);
      transform.current = { ...transform.current, x: pan.x, y: pan.y };
      applyTransform(false);
      return;
    }

    if (!g.axis && Math.hypot(dx, dy) > AXIS_LOCK_PX) {
      g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      g.mode = 'drag';
    }
    if (g.axis === 'x') {
      const atEdge = (indexRef.current === 0 && dx > 0) || (indexRef.current === lastIndex && dx < 0);
      transform.current = { scale: MIN_SCALE, x: atEdge ? dx * EDGE_RESISTANCE : dx, y: 0 };
      applyTransform(false);
    } else if (g.axis === 'y') {
      transform.current = { scale: MIN_SCALE, x: dx * EDGE_RESISTANCE, y: dy };
      applyTransform(false);
      const range = stageRef.current.clientHeight * CLOSE_FADE_RANGE_RATIO;
      setBackdrop(clamp(1 - Math.abs(dy) / range, MIN_BACKDROP_ALPHA, 1));
    }
  };

  const handleDoubleTap = (clientX, clientY) => {
    if (transform.current.scale > MIN_SCALE + ZOOMED_THRESHOLD) {
      resetTransform(true);
    } else {
      zoomAt(toStagePoint(clientX, clientY), DOUBLE_TAP_SCALE, true);
    }
  };

  const finishGesture = (e, cancelled) => {
    if (!pointers.current.has(e.pointerId)) return;
    pointers.current.delete(e.pointerId);
    const g = gesture.current;
    if (!g) return;

    if (pointers.current.size === 1) {
      const rest = [...pointers.current.values()][0];
      g.mode = 'pan';
      g.startX = rest.x;
      g.startY = rest.y;
      g.baseX = transform.current.x;
      g.baseY = transform.current.y;
      return;
    }
    if (pointers.current.size > 1) return;

    const dx = e.clientX - g.startX;
    const dy = e.clientY - g.startY;
    const duration = performance.now() - g.startTime;
    gesture.current = null;

    if (g.pinched) {
      if (transform.current.scale < SNAP_TO_FIT_SCALE) resetTransform(true);
      return;
    }

    if (cancelled) {
      resetTransform(true);
      setBackdrop(1);
      return;
    }

    const isTap = Math.hypot(dx, dy) < TAP_MOVE_TOLERANCE_PX && duration < TAP_MAX_DURATION_MS;
    if (isTap) {
      const now = performance.now();
      const prev = lastTap.current;
      const isDouble = now - prev.time < DOUBLE_TAP_DELAY_MS &&
        Math.hypot(e.clientX - prev.x, e.clientY - prev.y) < DOUBLE_TAP_DISTANCE_PX;
      if (isDouble) {
        lastTap.current = { time: 0, x: 0, y: 0 };
        handleDoubleTap(e.clientX, e.clientY);
      } else {
        lastTap.current = { time: now, x: e.clientX, y: e.clientY };
      }
      return;
    }

    if (transform.current.scale > MIN_SCALE + ZOOMED_THRESHOLD) return;

    if (g.axis === 'x') {
      const stageWidth = stageRef.current.clientWidth;
      const fastEnough = Math.abs(g.velocityX) > SWIPE_VELOCITY_PX_PER_MS;
      const farEnough = Math.abs(dx) > stageWidth * SWIPE_DISTANCE_RATIO;
      const dir = dx < 0 ? 1 : -1;
      const target = indexRef.current + dir;
      if ((fastEnough || farEnough) && target >= 0 && target <= lastIndex) {
        slideOutThenGo(dir);
      } else {
        resetTransform(true);
      }
    } else if (g.axis === 'y') {
      if (Math.abs(dy) > CLOSE_DRAG_PX) {
        closeViewer();
      } else {
        resetTransform(true);
        setBackdrop(1);
      }
    }
  };

  const handleWheel = (e) => {
    if (isBusy.current) return;
    const p = toStagePoint(e.clientX, e.clientY);
    zoomAt(p, transform.current.scale * Math.exp(-e.deltaY * WHEEL_ZOOM_SPEED), false);
    if (transform.current.scale < SNAP_TO_FIT_SCALE) resetTransform(false);
  };

  useEffect(() => {
    resetTransform(false);
    setBackdrop(1);
    const thumb = thumbsRef.current && thumbsRef.current.children[index];
    if (thumb && thumb.scrollIntoView) thumb.scrollIntoView({ block: 'nearest', inline: 'center' });
  }, [index, resetTransform]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') closeViewer();
      else if (e.key === 'ArrowRight') goTo(indexRef.current + 1, 1);
      else if (e.key === 'ArrowLeft') goTo(indexRef.current - 1, -1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeViewer, goTo]);

  useEffect(() => {
    const id = later(() => setShowHint(false), HINT_VISIBLE_MS);
    const pending = timers.current;
    return () => { clearTimeout(id); pending.forEach(clearTimeout); };
  }, []);

  const handleImageError = (e) => {
    if (fallbackSrc && !e.currentTarget.dataset.fallbackApplied) {
      e.currentTarget.dataset.fallbackApplied = 'true';
      e.currentTarget.src = fallbackSrc;
    }
  };

  const enterClass = direction > 0 ? 'mz-enter-next' : direction < 0 ? 'mz-enter-prev' : '';

  return (
    <div
      ref={overlayRef}
      className="mz-overlay"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Image viewer'}
    >
      <div className="mz-topbar">
        <span className="mz-counter">{images.length > 1 ? `${index + 1} / ${images.length}` : ''}</span>
        <span className="mz-title">{title}</span>
        <button type="button" className="mz-close" onClick={closeViewer} aria-label="Close image viewer">×</button>
      </div>

      <div
        ref={stageRef}
        className={`mz-stage ${isZoomed ? 'mz-stage-zoomed' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={(e) => finishGesture(e, false)}
        onPointerCancel={(e) => finishGesture(e, true)}
        onWheel={handleWheel}
      >
        <img
          ref={imgRef}
          key={index}
          src={images[index]}
          alt={title ? `${title} - ${index + 1}` : `Image ${index + 1}`}
          className={`mz-img ${enterClass}`}
          draggable="false"
          onError={handleImageError}
        />
        {showHint && !isZoomed && <div className="mz-hint">{hintText}</div>}
      </div>

      {images.length > 1 && (
        <div className="mz-thumbs" ref={thumbsRef}>
          {images.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={`Thumbnail ${i + 1}`}
              className={`mz-thumb ${i === index ? 'mz-thumb-active' : ''}`}
              draggable="false"
              onClick={() => goTo(i)}
              onError={handleImageError}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ProductDetail({ currency, rates, language }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [saree, setSaree] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  
  // Gallery States
  const [activeImageIdx, setActiveImageIdx] = useState(0);
  const [mobileActiveIdx, setMobileActiveIdx] = useState(0); 
  
  const [quantity, setQuantity] = useState(1);
  const [translatedName, setTranslatedName] = useState("");
  const [translatedDesc, setTranslatedDesc] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  
  // Social States
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showComments, setShowComments] = useState(false);

  // Zoom States
  const [isZoomHovered, setIsZoomHovered] = useState(false);
  const [zoomCoords, setZoomCoords] = useState({ x: 50, y: 50 });

  // Delivery & User Location States
  const [deliveryDateStr, setDeliveryDateStr] = useState("");
  const [userLocation, setUserLocation] = useState("");
 
  const [showAllDetails, setShowAllDetails] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState('specifications');
  
  // 📱 Mobile fullscreen zoom viewer (Amazon style)
  const [mobileZoomOpen, setMobileZoomOpen] = useState(false);
  const mobileTrackRef = useRef(null);

  const [assetVersion] = useState(() => Date.now());
  const token = localStorage.getItem('token');

  const handleZoomClose = (lastViewedIdx) => {
    setMobileZoomOpen(false);
    setMobileActiveIdx(lastViewedIdx);
    requestAnimationFrame(() => {
      const track = mobileTrackRef.current;
      if (track) track.scrollTo({ left: lastViewedIdx * track.offsetWidth, behavior: 'auto' });
    });
  };

  const handleImageMouseMove = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomCoords({ x, y });
  };

  const handleSliderScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.offsetWidth;
    const newIndex = Math.round(scrollLeft / width);
    if (newIndex !== mobileActiveIdx) {
      setMobileActiveIdx(newIndex);
      console.log(`[UI_EVENT] 📱 Mobile slider swiped to media index: ${newIndex}`);
    }
  };

  useEffect(() => {
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 3);
    const options = { day: 'numeric', month: 'short', weekday: 'short' };
    setDeliveryDateStr(deliveryDate.toLocaleDateString('en-IN', options));

    const fetchUserAddress = async () => {
      if (!token) {
        setUserLocation("Location not set");
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data && data.success && data.user) {
          const addr = data.user.address || data.user.city || data.user.pincode;
          setUserLocation(addr ? `Deliver to: ${addr}` : "Location not set");
        } else {
          setUserLocation("Location not set");
        }
      } catch (err) {
        setUserLocation("Location not set");
      }
    };

    fetchUserAddress();
  }, [token]);

  const resolveImage = (url) => {
    if (!url) return "";
    let finalUrl = url;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      finalUrl = `${API_BASE_URL}${url.startsWith("/") ? "" : "/"}${url}`;
    }
    return `${finalUrl}?v=${assetVersion}`;
  };

  useEffect(() => {
    const fetchProductData = async () => {
      try {
        setLoading(true);
        const prodRes = await fetch(`${API_BASE_URL}/api/products/product/${id}`);
        const prodResult = await prodRes.json();
        
        if (prodResult && prodResult.data) {
          setSaree(prodResult.data);
          setTranslatedName(prodResult.data.name);
          setTranslatedDesc(prodResult.data.description);
        }

        const likesRes = await fetch(`${API_BASE_URL}/api/likes/${id}/like`, {
          method: 'GET',
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        const likesData = await likesRes.json();
        if (likesData.success) {
          setIsLiked(likesData.isLiked);
          setLikesCount(likesData.totalLikes || 0);
        }

        const commentsRes = await fetch(`${API_BASE_URL}/api/comments/${id}/comments`);
        const commentsData = await commentsRes.json();
        if (commentsData.success) {
          setComments(commentsData.comments || []);
        }
      } catch (error) {
        console.error("[ProductDetail] Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchProductData();
  }, [id, token]);

  useEffect(() => {
    if (!saree || !language || language === 'en') return;
    const fetchTranslations = async () => {
      setIsTranslating(true);
      try {
        const [nameRes, descRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: saree.name, targetLanguage: language })
          }),
          fetch(`${API_BASE_URL}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: saree.description, targetLanguage: language })
          })
        ]);
        const nData = await nameRes.json();
        const dData = await descRes.json();
        setTranslatedName(nData.translatedText || saree.name);
        setTranslatedDesc(dData.translatedText || saree.description);
      } catch (err) {
        console.error("[ProductDetail] Translation error:", err);
      } finally {
        setIsTranslating(false);
      }
    };
    fetchTranslations();
  }, [language, saree]);

  const handleToggleLike = async () => {
    if (!token) { toast.error("Please login to like this product!"); return; }
    const wasLiked = isLiked;
    setIsLiked(!wasLiked);
    setLikesCount(prev => wasLiked ? prev - 1 : prev + 1);
    try {
      const response = await fetch(`${API_BASE_URL}/api/likes/${id}/like`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
      const data = await response.json();
      if (!data.success) throw new Error("Failed to toggle like");
    } catch (error) {
      setIsLiked(wasLiked);
      setLikesCount(prev => wasLiked ? prev + 1 : prev - 1);
    }
  };

  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!token) { toast.error("Please login to post a comment!"); return; }
    setIsSubmittingComment(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/comments/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ comment_text: newComment })
      });
      const data = await res.json();
      if (data.success) {
        setComments(prev => [data.comment, ...prev]);
        setNewComment('');
        toast.success("Comment posted successfully!");
      } else {
        toast.error(data.message || "Failed to post comment.");
      }
    } catch (error) {
      toast.error("Failed to post comment.");
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const stockQty = saree?.stock_qty ?? saree?.quantity ?? null;
  const isOutOfStock = stockQty !== null ? stockQty <= 0 : saree?.in_stock === false;
  
  const handleQtyChange = (type) => {
    if (type === 'inc' && (stockQty === null || quantity < stockQty)) setQuantity(prev => prev + 1);
    else if (type === 'dec' && quantity > 1) setQuantity(prev => prev - 1);
  };

  const handleAddToCart = async (sareeId) => {
    if (isOutOfStock) return;
    if (!token) { toast.error("Please login to add product to cart!"); return; }
    setIsAdding(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/cart/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ product_id: sareeId, quantity: quantity })
      });
      if (response.ok) {
          toast.success(`Added ${quantity} item(s) to cart!`);
      } else toast.error("Could not add item to cart.");
    } catch (error) {
      toast.error("Could not add item to cart.");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = () => {
    if (!saree || isOutOfStock) return;
    navigate('/add-address', {
      state: { buyNowProduct: { product_id: saree.product_id, name: saree.name, price: saree.price, quantity: quantity, image_url: saree.image_url } }
    });
  };

 const handleWhatsAppInquiry = () => {
    if (!saree) return;
    const pName = encodeURIComponent(saree.name);
    const pPrice = encodeURIComponent(`${currency} ${getConvertedPrice(saree.price)}`);
    const pImage = encodeURIComponent(resolveImage(saree.image_url));
    const extraDetails = encodeURIComponent(`Quantity: ${quantity}\nPage Link: ${window.location.href}`);

    const backendWhatsappUrl = `${API_BASE_URL}/api/whatsapp/redirect?product=${pName}&price=${pPrice}&image=${pImage}&text=${extraDetails}`;
    
    window.open(backendWhatsappUrl, "_blank", "noopener,noreferrer");
};

  const getConvertedPrice = (basePrice) => {
    if (currency === 'INR' || !rates || !rates[currency]) return basePrice;
    return (basePrice * rates[currency].rate).toFixed(2);
  };

 if (loading) {
  return (
    <div className="product-loading-screen">
      <h2>Loading product details...</h2>
    </div>
  );
}
if (!saree) {
  return (
    <div className="main-container product-not-found-screen">
      <div className="product-not-found-card">
        <div className="product-not-found-icon">✿</div>
        <h2>Product not found!</h2>
        <p>
          Sorry, we couldn't find the saree you're looking for.
        </p>
        <Link to="/" className="product-not-found-btn">
          Back to Collection
        </Link>
      </div>
    </div>
  );
}

  const baseImages = saree?.images && Array.isArray(saree.images) && saree.images.length > 0 
    ? saree.images.map(img => resolveImage(img)) 
    : [resolveImage(saree?.image_url) || FALLBACK_IMAGE];
    
  const mediaItems = baseImages.map(url => ({ type: 'image', url }));
  if (saree?.video_url) {
    mediaItems.push({ 
      type: 'video', 
      url: resolveImage(saree.video_url), 
      thumb: baseImages[0] 
    });
  }

  const currentMedia = mediaItems[activeImageIdx] || mediaItems[0];
  const hasDifferentColors = saree?.variants?.some(v => v.color_name && v.color_name !== (saree?.color_name || saree?.base_color));
  const variantLabelText = hasDifferentColors ? "Different Color" : "Different Design";

  return (
    <div className="product-detail-page">
      <div className="main-container">
        <div className="details-container">
          
          {/* LEFT: GALLERY, ZOOM & SOCIAL ACTIONS */}
          <div className="gallery-section">
            
            {/* 🖥️ DESKTOP VIEW: AMAZON STYLE */}
            <div className="desktop-gallery-layout">
              {mediaItems.length > 1 && (
                <div className="desktop-thumbnails">
                  {mediaItems.map((media, idx) => (
                    <div key={idx} style={{ position: 'relative', width: '60px', height: '70px', flexShrink: 0 }}>
                      <img
                        src={media.type === 'video' ? media.thumb : media.url} 
                        alt={`Media ${idx + 1}`} 
                        className={`thumbnail ${activeImageIdx === idx ? 'thumbnail-active' : ''}`}
                        onClick={() => { setActiveImageIdx(idx); }} 
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} draggable="false"
                      />
                      {media.type === 'video' && <div className="video-play-overlay-thumb">▶</div>}
                    </div>
                  ))}
                </div>
              )}
              
              <div 
                className="main-image-wrapper amazon-zoom-box desktop-main-image"
                onMouseEnter={() => { if(currentMedia.type === 'image') setIsZoomHovered(true) }}
                onMouseLeave={() => setIsZoomHovered(false)}
                onMouseMove={currentMedia.type === 'image' ? handleImageMouseMove : undefined}
              >
                {currentMedia.type === 'image' ? (
                  <img
                    src={currentMedia.url} 
                    alt={saree.name} 
                    className="main-image amazon-zoom-img"
                    style={isZoomHovered ? {
                      transformOrigin: `${zoomCoords.x}% ${zoomCoords.y}%`,
                      transform: 'scale(2.2)',
                      cursor: 'crosshair'
                    } : {
                      transform: 'scale(1)',
                      transformOrigin: 'center center'
                    }}
                    onError={(e) => { if (!e.currentTarget.src.includes(FALLBACK_IMAGE)) { e.currentTarget.src = FALLBACK_IMAGE; } }} 
                    draggable="false"
                  />
                ) : (
                  <video 
                    src={currentMedia.url} 
                    controls 
                    autoPlay
                    preload="metadata"
                    className="desktop-main-video"
                    poster={currentMedia.thumb}
                  />
                )}

                {isOutOfStock && <span className="sold-out-badge">Sold Out</span>}
                {currentMedia.type === 'image' && <div className="image-zoom-hint">{isZoomHovered ? "Zoomed" : "Hover to zoom"}</div>}
              </div>
            </div>

            {/* 📱 MOBILE VIEW: FLIPKART STYLE */}
            <div className="mobile-gallery-slider" style={{ position: 'relative' }}>
              {isOutOfStock && <span className="sold-out-badge">Sold Out</span>}
              <div className="mobile-slider-track" ref={mobileTrackRef} onScroll={handleSliderScroll}>
                {mediaItems.map((media, idx) => (
                  <div 
                    className="mobile-slide-item" 
                    key={idx}
                    onClick={() => {
                      if (media.type === 'image') {
                        setMobileActiveIdx(idx);
                        setMobileZoomOpen(true);
                      }
                    }}
                  >
                    {media.type === 'image' ? (
                      <img 
                        src={media.url} 
                        alt={`View ${idx + 1}`} 
                        onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }} 
                        draggable="false" 
                      />
                    ) : (
                      <video 
                        src={media.url} 
                        controls 
                        preload="metadata"
                        className="mobile-main-video"
                        poster={media.thumb}
                      />
                    )}
                  </div>
                ))}
              </div>

              <div 
                className="image-zoom-hint" 
                style={{ pointerEvents: 'none', bottom: mediaItems.length > 1 ? '34px' : '12px' }}
              >
                {mediaItems[mobileActiveIdx]?.type === 'image' ? "🔍 Tap image to zoom" : ""}
              </div>

              {mediaItems.length > 1 && (
                <div className="mobile-slider-dots">
                  {mediaItems.map((_, idx) => (
                    <span key={idx} className={`dot ${mobileActiveIdx === idx ? 'active' : ''}`}></span>
                  ))}
                </div>
              )}
            </div>

            {/* Social Action Bar */}
            <div className="social-action-bar">
              <div className="social-action-item">
                <button type="button" className={`social-btn ${isLiked ? 'liked' : ''}`} onClick={handleToggleLike} aria-label="Like product">
                  {isLiked ? <FaHeart color="#e53e3e" size={18} /> : <FaRegHeart size={18} />}
                </button>
                <span className="social-action-count">{likesCount} {likesCount === 1 ? 'like' : 'likes'}</span>
              </div>
              <div className="social-action-item">
                <button type="button" className="social-btn" onClick={() => setShowComments(prev => !prev)} aria-label="Comments">
                  <FaComment size={18} />
                </button>
                <span className="social-action-count">{comments.length} {comments.length === 1 ? 'comment' : 'comments'}</span>
              </div>
              <div className="social-action-item">
                <button type="button" className="social-btn whatsapp-btn" onClick={handleWhatsAppInquiry} aria-label="WhatsApp Inquiry">
                  <FaWhatsapp color="#25D366" size={20} />
                </button>
                <span className="social-action-count">Ask</span>
              </div>
            </div>

            {showComments && (
              <div className="inline-comments-section">
                <div className="inline-comments-list">
                  {comments.length === 0 ? (
                    <p className="no-comments-inline">No comments yet. Be the first!</p>
                  ) : (
                    comments.map(c => (
                      <div key={c.comment_id} className="inline-comment-item">
                        <strong>{c.user_name}</strong> {c.comment_text}
                      </div>
                    ))
                  )}
                </div>
                <form onSubmit={handleCommentSubmit} className="inline-comment-form">
                  <input type="text" placeholder="Add a comment..." value={newComment} onChange={(e) => setNewComment(e.target.value)} className="inline-comment-input" />
                  <button type="submit" disabled={isSubmittingComment || !newComment.trim()} className="inline-comment-post">
                    {isSubmittingComment ? "Posting..." : "Post"}
                  </button>
                </form>
              </div>
            )}
          </div>
          
          {/* RIGHT: INFO, PRICE, VARIANTS */}
          <div className="info-box">
            <h1 className="product-title">{isTranslating ? "Translating..." : translatedName}</h1>
            
            <div className="price-container">
              <h2 className="product-price">{currency} {getConvertedPrice(saree.price)}</h2>
              {saree.mrp && saree.mrp > saree.price && (
                <>
                  <span className="mrp-price">MRP {currency} {getConvertedPrice(saree.mrp)}</span>
                  {saree.discount_percentage !== undefined && (
                    <span className="discount-badge">{saree.discount_percentage}% OFF</span>
                  )}
                </>
              )}
            </div>

            {saree.variants && saree.variants.length > 0 && (
              <div className="amazon-variants-container">
                <div className="amazon-variant-label">
                  {variantLabelText}: <strong>{saree.color_name || saree.base_color || 'Default'}</strong>
                </div>
                <div className="amazon-swatch-grid">
                  {saree.variants.map((v) => {
                    const isActive = v.product_id === saree.product_id;
                    const isVariantSoldOut = (v.stock_qty !== undefined && v.stock_qty <= 0) || v.is_active === 0;

                    return (
                      <Link 
                        key={v.product_id} 
                        to={isVariantSoldOut ? '#' : `/product/${v.product_id}`} 
                        className={`amazon-swatch-item ${isActive ? 'active' : ''} ${isVariantSoldOut ? 'sold-out-variant' : ''}`}
                        title={v.color_name || 'Variant'}
                        onClick={(e) => {
                           if(isVariantSoldOut) e.preventDefault(); 
                        }}
                      >
                        <div className="amazon-swatch-img-wrap">
                          <img 
                            src={resolveImage(v.image_url || FALLBACK_IMAGE)} 
                            alt={v.color_name || 'variant'} 
                            className="amazon-swatch-img"
                            onError={(e) => { e.currentTarget.src = FALLBACK_IMAGE; }}
                          />
                          {isVariantSoldOut && (
                            <div className="variant-out-overlay">
                              <span className="variant-out-text">Out of stock</span>
                            </div>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="fk-delivery-widget">
              <h3 className="fk-delivery-title">Delivery details</h3>
              <div className="fk-delivery-row">
                <svg style={{ width: '20px', height: '20px', fill: '#2874f0', flexShrink: 0, marginTop: '2px', marginRight: '8px' }} viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                </svg>
                <div className="fk-delivery-text-block" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                  <span className="fk-loc-text">{userLocation}</span>
                  {userLocation === "Location not set" && (
                    <>
                      <span className="fk-loc-divider" style={{ margin: '0 8px', color: '#ccc' }}>|</span>
                      <button className="fk-loc-action" type="button" style={{ color: '#2874f0', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Select delivery location</button>
                    </>
                  )}
                </div>
              </div>

              <div className="fk-delivery-divider" style={{ borderBottom: '1px solid #f0f0f0', margin: '15px 0' }}></div>
              
              <div className="fk-delivery-row">
                <svg style={{ width: '20px', height: '20px', fill: '#2874f0', flexShrink: 0, marginTop: '2px', marginRight: '8px' }} viewBox="0 0 24 24">
                  <path d="M20 8h-3V4H3c-1.1 0-2 .9-2 2v11h2c0 1.66 1.34 3 3 3s3-1.34 3-3h6c0 1.66 1.34 3 3 3s3-1.34 3-3h2v-5l-3-4zM6 18.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm13.5-9l1.96 2.5H17V9.5h2.5zm-1.5 9c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/>
                </svg>
                <div className="fk-delivery-text-block" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="fk-date-text">Delivery by <span style={{ fontWeight: '600' }}>{deliveryDateStr}</span></span>
                </div>
              </div>
            </div>

            <div className="badges-row">
              <span className={`stock-badge ${isOutOfStock ? 'out-of-stock' : 'in-stock'}`}>
                {isOutOfStock ? 'Sold Out' : stockQty ? `In Stock (${stockQty} left)` : 'In Stock'}
              </span>
            </div>

            <div className="policy-note">
              <strong>Note:</strong> Not returnable. If you buy it by mistake, cancel in the time of pending.
            </div>

            <div className="quantity-selector-container">
              <span className="qty-label">Quantity:</span>
              <div className="quantity-controls">
                <button type="button" className="qty-btn" onClick={() => handleQtyChange('dec')}>-</button>
                <span className="qty-display">{quantity}</span>
                <button type="button" className="qty-btn" onClick={() => handleQtyChange('inc')} disabled={stockQty !== null && quantity >= stockQty}>+</button>
              </div>
            </div>

            <div className="action-buttons-row">
              <button onClick={() => handleAddToCart(saree.product_id)} disabled={isAdding || isOutOfStock} className="add-to-cart-btn">
                {isOutOfStock ? "Sold Out" : isAdding ? "Adding..." : "Add to Cart"}
              </button>
              <button onClick={handleBuyNow} disabled={isOutOfStock} className="buy-now-btn">
                {isOutOfStock ? "Sold Out" : "Buy Now"}
              </button>
            </div>

            {/* ALL DETAILS SECTION */}
            <div className="fk-all-details-container">
              <button 
                type="button"
                className="fk-details-toggle-btn" 
                onClick={() => { setShowAllDetails(!showAllDetails); }}
              >
                All details
                <span className="toggle-icon">{showAllDetails ? '▲' : '▼'}</span>
              </button>

              {showAllDetails && (
                <div className="fk-details-content">
                  <div className="fk-tabs-row">
                    <button type="button" className={`fk-tab-btn ${activeDetailTab === 'specifications' ? 'active' : ''}`} onClick={() => setActiveDetailTab('specifications')}>Specifications</button>
                    <button type="button" className={`fk-tab-btn ${activeDetailTab === 'description' ? 'active' : ''}`} onClick={() => setActiveDetailTab('description')}>Description</button>
                    <button type="button" className={`fk-tab-btn ${activeDetailTab === 'manufacturer' ? 'active' : ''}`} onClick={() => setActiveDetailTab('manufacturer')}>Manufacturer info</button>
                  </div>

                  <div className="fk-tab-pane">
                    {activeDetailTab === 'specifications' && (
                      <div className="fk-spec-group">
                        <h4 className="fk-group-title">General</h4>
                        <div className="fk-grid-2-col">
                          {SPEC_FIELDS.filter(f => saree[f.key] && saree[f.key] !== 'null').map((f, i) => (
                            <div key={i} className="fk-grid-item">
                              <span className="fk-label">{f.label}</span>
                              <span className="fk-value">{saree[f.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeDetailTab === 'description' && (
                      <div className="fk-spec-group">
                        <p className="product-desc" style={{ color: 'var(--text-dark)' }}>
                          {isTranslating ? "Translating details..." : (translatedDesc || "No description available.")}
                        </p>
                      </div>
                    )}

                    {activeDetailTab === 'manufacturer' && (
                      <div className="fk-spec-group">
                        <div className="fk-grid-2-col">
                          {MFG_FIELDS.filter(f => saree[f.key] && saree[f.key] !== 'null').map((f, i) => (
                            <div key={i} className={`fk-grid-item ${f.fullWidth ? 'fk-full-width' : ''}`}>
                              <span className="fk-label">{f.label}</span>
                              <span className="fk-value">{saree[f.key]}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 🌟 NAYA REVIEW WIDGET YAHAN JOD DIYA GAYA HAI */}
            <ProductReviewsWidget productId={saree.product_id} />

          </div>
        </div>
      </div>

      {/* RECOMMENDED SECTION */}
      <div className="full-width-review-section">
        <div className="review-inner-container">
          <div className="recommended-section-wrapper">
            <Recommended currentProductId={saree.product_id} categoryId={saree.category_id} subcategoryId={saree.subcategory_id} />
          </div>
        </div>
      </div>
      
      {mobileZoomOpen && (
        <MobileImageZoom
          images={baseImages}
          startIndex={mobileActiveIdx >= baseImages.length ? 0 : mobileActiveIdx}
          title={translatedName || saree.name}
          fallbackSrc={FALLBACK_IMAGE}
          onClose={handleZoomClose}
        />
      )}
    </div> 
  );
}

export default ProductDetail;