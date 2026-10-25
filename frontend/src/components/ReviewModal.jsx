import React, { useState } from 'react';
import toast from 'react-hot-toast';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const ReviewModal = ({ productId, onClose, onSuccess }) => {
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    
    // Arzoo specific attributes
    const [selectedAttrs, setSelectedAttrs] = useState([]);
    const presetAttributes = ["Lightweight", "Perfect for Weddings", "Exact Color", "Authentic Fabric", "Value for Money"];

    const toggleAttr = (attr) => {
        setSelectedAttrs(prev => prev.includes(attr) ? prev.filter(a => a !== attr) : [...prev, attr]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const token = localStorage.getItem('token');

        const formData = new FormData();
        formData.append('rating', rating);
        formData.append('title', title);
        formData.append('comment', comment);
        formData.append('attributes', JSON.stringify(selectedAttrs));
        
        files.forEach(f => formData.append('review_media', f));

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Review posted successfully!");
                onSuccess();
            } else {
                toast.error(data.message || "Failed to post review");
            }
        } catch (err) {
            toast.error("Network error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="review-modal-content">
                <div className="modal-header">
                    <h3>Write a Review</h3>
                    <button onClick={onClose} style={{border:'none', background:'none', fontSize:'1.5rem', cursor:'pointer'}}>×</button>
                </div>
                
                <form onSubmit={handleSubmit}>
                    <div className="star-selector">
                        {[1, 2, 3, 4, 5].map(star => (
                            <span 
                                key={star} 
                                onClick={() => setRating(star)}
                                className={star <= rating ? 'active' : ''}
                            >
                                ★
                            </span>
                        ))}
                    </div>

                    <input type="text" placeholder="Review Title (e.g., Beautiful Saree!)" 
                        value={title} onChange={e => setTitle(e.target.value)} className="review-input" required />
                    
                    <textarea placeholder="Write your detailed review here..." 
                        value={comment} onChange={e => setComment(e.target.value)} className="review-input" rows="4" required />

                    <div style={{marginBottom: '15px'}}>
                        <p style={{fontSize: '0.85rem', marginBottom:'8px'}}>Quick Tags:</p>
                        <div className="review-attributes">
                            {presetAttributes.map(attr => (
                                <span 
                                    key={attr} 
                                    onClick={() => toggleAttr(attr)}
                                    className="attr-chip"
                                    style={{ cursor: 'pointer', background: selectedAttrs.includes(attr) ? '#f6dfb3' : '#f5f5f5', border: selectedAttrs.includes(attr) ? '1px solid #b88943' : '1px solid #e0e0e0' }}
                                >
                                    {attr}
                                </span>
                            ))}
                        </div>
                    </div>

                    <input type="file" multiple accept="image/*,video/*" 
                        onChange={e => setFiles(Array.from(e.target.files))} className="review-input" />
                    <small style={{display:'block', marginBottom:'15px', color:'#777'}}>You can upload up to 5 photos or videos.</small>

                    <button type="submit" className="rate-product-btn" style={{width: '100%'}} disabled={loading}>
                        {loading ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;