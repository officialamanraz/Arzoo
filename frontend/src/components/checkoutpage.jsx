import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Checkout.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // 👉 Grab data passed from your Order Summary page
const { buyNowProduct, addressId: passedAddressId, customerEmail } = location.state || {};
    const [paymentMethod, setPaymentMethod] = useState('cod'); 
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [fallbackAddressId, setFallbackAddressId] = useState(null);
    

    // 👉 Safety Net: If the previous page didn't pass the addressId, fetch the most recently saved one
    useEffect(() => {
        if (!passedAddressId) {
            const fetchLatestAddress = async () => {
                const token = localStorage.getItem('token');
                if (!token) return;
                try {
                    const res = await fetch(`${API_BASE_URL}/api/addresses`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const data = await res.json();
                    // Your DB sorts by created_at DESC, so index 0 is always the newest address!
                    if (data.success && data.addresses.length > 0) {
                        setFallbackAddressId(data.addresses[0].address_id);
                    }
                } catch (err) {
                    console.error("Failed to load fallback address", err);
                }
            };
            fetchLatestAddress();
        }
    }, [passedAddressId]);

    const handlePlaceOrder = async () => {
        const finalAddressId = passedAddressId || fallbackAddressId;

        if (!finalAddressId) {
            alert('Error: Delivery address missing. Please go back and select an address.');
            return;
        }

        const token = localStorage.getItem('token');
        if (!token) {
            alert('Please log in again to place your order.');
            navigate('/login');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const storedTrackingRef = sessionStorage.getItem('tracking_ref') || null;

            const payload = {
                addressId: finalAddressId,
                paymentMethod: paymentMethod,
                ...(buyNowProduct && { buyNowProduct }),
                tracking_ref: storedTrackingRef,
                customerEmail: customerEmail
            };

            const res = await fetch(`${API_BASE_URL}/api/orders/checkout`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.message || data.error || 'Checkout failed.');
                setLoading(false);
                return;
            }

            if (paymentMethod === 'cod') {
                sessionStorage.removeItem('tracking_ref');
                alert(`Order Placed Successfully! Order ID: ${data.orderId}`);
                navigate('/');
                setLoading(false);
            } else {
                await startRazorpayPayment(data.order_id, data.orderId, token);
            }

        } catch (err) {
            console.error('[CHECKOUT] Order error:', err);
            setError('Something went wrong while placing the order.');
            setLoading(false);
        }
    };

    const startRazorpayPayment = async (internalOrderId, displayOrderId, token) => {
        try {
            if (!window.Razorpay) {
                alert('Razorpay SDK failed to load. Please check your internet connection.');
                setLoading(false);
                return;
            }

            const razorpayRes = await fetch(`${API_BASE_URL}/api/orders/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ order_id: internalOrderId })
            });

            const razorpayData = await razorpayRes.json();

            if (!razorpayData.success) {
                alert('Failed to start payment: ' + razorpayData.message);
                setLoading(false);
                return;
            }

            const options = {
                key: import.meta.env.VITE_RAZORPAY_KEY_ID,
                amount: razorpayData.amount,
                currency: razorpayData.currency,
                name: "Arzoo Saree",
                description: "Purchase Checkout",
                order_id: razorpayData.razorpay_order_id,

                handler: async function (response) {
                    try {
                        const verifyRes = await fetch(`${API_BASE_URL}/api/payment/verify`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            sessionStorage.removeItem('tracking_ref');
                            alert(`Payment Successful! Order ID: ${displayOrderId}`);
                           navigate('/');
                        } else {
                            alert('Payment verification failed. Please contact support.');
                        }
                    } finally {
                        setLoading(false);
                    }
                },
                modal: {
                    ondismiss: function () {
                        setLoading(false);
                    }
                },
                theme: { color: "#ad3764" }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', function () {
                alert('Payment failed. Please try again.');
                setLoading(false);
            });
            rzp.open();

        } catch (err) {
            console.error('[CHECKOUT] Razorpay error:', err);
            alert('Something went wrong starting the payment.');
            setLoading(false);
        }
    };

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                
                <div className="payment-header">
                    <h2>Select Payment Method</h2>
                </div>

                {error && <p className="payment-error-message">{error}</p>}

                <div className="checkout-step step-active">
                    <div className="step-content">
                        
                        <div className={`payment-method-card ${paymentMethod === 'cod' ? 'payment-selected' : ''}`}>
                            <label className="payment-label">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    checked={paymentMethod === 'cod'}
                                    onChange={() => setPaymentMethod('cod')}
                                    disabled={loading}
                                    className="payment-radio"
                                />
                                <span className="payment-name">💵 Cash on Delivery (COD)</span>
                            </label>
                            <p className="payment-desc">Pay the delivery agent in cash when your order arrives.</p>
                        </div>

                        <div className={`payment-method-card ${paymentMethod === 'online' ? 'payment-selected' : ''}`}>
                            <label className="payment-label">
                                <input
                                    type="radio"
                                    name="paymentMethod"
                                    checked={paymentMethod === 'online'}
                                    onChange={() => setPaymentMethod('online')}
                                    disabled={loading}
                                    className="payment-radio"
                                />
                                <span className="payment-name">💳 Pay Online (Razorpay)</span>
                            </label>
                            <p className="payment-desc">Pay securely via UPI, Cards, or Netbanking.</p>
                        </div>

                        <div className="btn-group">
                            <button
                                onClick={handlePlaceOrder}
                                disabled={loading}
                                className="btn-primary btn-large"
                            >
                                {loading ? 'Processing...' : (paymentMethod === 'cod' ? 'Place Order (COD)' : 'Proceed to Pay')}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default Checkout;