import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Checkout.css';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract buyNowProduct and any initial state passed via router
    const { buyNowProduct } = location.state || {};

    // Step Management: 1 = Address, 2 = Summary, 3 = Payment
    const [currentStep, setCurrentStep] = useState(1);
    const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' or 'online'

    // Data States
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Fetch addresses on mount
    useEffect(() => {
        const fetchAddresses = async () => {
            console.log('[CHECKOUT] Component mounted. Fetching addresses...');
            const token = localStorage.getItem('token');
            if (!token) {
                alert('Please log in again to continue.');
                navigate('/login');
                return;
            }

            try {
                const res = await fetch(`${API_BASE_URL}/api/addresses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();

                console.log('[CHECKOUT] Addresses fetched successfully:', data);
                if (data.success) {
                    setAddresses(data.addresses);
                    if (data.addresses.length > 0) {
                        setSelectedAddress(data.addresses[0]);
                        console.log('[CHECKOUT] Default address set:', data.addresses[0]);
                    }
                }
            } catch (err) {
                console.error("[CHECKOUT] Failed to load addresses", err);
                setError('Failed to load delivery addresses.');
            }
        };
        fetchAddresses();
    }, [navigate]);

    const handlePlaceOrder = async () => {
        console.log('[CHECKOUT] Place order clicked -- address_id:', selectedAddress?.address_id, 'method:', paymentMethod);

        if (!selectedAddress || !selectedAddress.address_id) {
            alert('Please select a delivery address before placing the order.');
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
            const payload = {
                addressId: selectedAddress.address_id,
                paymentMethod: paymentMethod,
                ...(buyNowProduct && { buyNowProduct })
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
            console.log('[CHECKOUT] Server Response:', data);

            if (!data.success) {
                setError(data.message || data.error || 'Checkout failed.');
                setLoading(false);
                return;
            }

            if (paymentMethod === 'cod') {
                alert(`Order Placed Successfully! Order ID: ${data.orderId}`);
                navigate(`/track-order/${data.orderId}`);
                setLoading(false);
            } else {
                // Trigger Razorpay online flow
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

            const razorpayRes = await fetch(`${API_BASE_URL}/api/payment/create-order`, {
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
                name: "Arzoo",
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
                            alert(`Payment Successful! Order ID: ${displayOrderId}`);
                            navigate(`/track-order/${displayOrderId}`);
                        } else {
                            alert('Payment verification failed. Please contact support.');
                        }
                    } finally {
                        setLoading(false);
                    }
                },

                modal: {
                    ondismiss: function () {
                        console.log('[CHECKOUT] Razorpay modal dismissed by user');
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

                {/* Header Stepper Indicator */}
                <div className="payment-header">
                    <h2>Checkout</h2>
                    <div className="stepper-container">
                        <Step number={1} label="Address" active={currentStep === 1} completed={currentStep > 1} />
                        <StepLine completed={currentStep > 1} />
                        <Step number={2} label="Order Summary" active={currentStep === 2} completed={currentStep > 2} />
                        <StepLine completed={currentStep > 2} />
                        <Step number={3} label="Payment" active={currentStep === 3} />
                    </div>
                </div>

                {/* ERROR BANNER */}
                {error && <p className="payment-error-message">{error}</p>}

                {/* STEP 1: ADDRESS */}
                <div className={`checkout-step ${currentStep === 1 ? 'step-active' : 'step-inactive'}`}>
                    {currentStep === 1 && (
                        <div className="step-content">
                            <h3 className="section-title">1. Delivery Address</h3>
                            {addresses.length === 0 ? (
                                <p className="no-data-text">No addresses found. Please add a new address.</p>
                            ) : (
                                addresses.map((addr) => (
                                    <div key={addr.address_id} className="address-card">
                                        <input
                                            type="radio"
                                            name="address"
                                            checked={selectedAddress?.address_id === addr.address_id}
                                            onChange={() => {
                                                console.log('[CHECKOUT] Address selected:', addr);
                                                setSelectedAddress(addr);
                                            }}
                                            className="address-radio"
                                        />
                                        <div className="address-details">
                                            <p className="address-name">
                                                {addr.full_name} <span className="address-phone">{addr.phone}</span>
                                            </p>
                                            <p className="address-text">
                                                {addr.house_no}, {addr.road_area}, {addr.city}, {addr.state} - {addr.pincode}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            )}
                            <button
                                onClick={() => {
                                    console.log('[CHECKOUT] Moving to Step 2');
                                    setCurrentStep(2);
                                }}
                                disabled={!selectedAddress}
                                className="btn-primary"
                            >
                                Deliver Here
                            </button>
                        </div>
                    )}
                </div>

                {/* STEP 2: ORDER SUMMARY */}
                <div className={`checkout-step ${currentStep === 2 ? 'step-active' : 'step-inactive'}`}>
                    {currentStep === 2 && (
                        <div className="step-content">
                            <h3 className="section-title">2. Order Summary</h3>
                            <p className="info-text">Review your selection before proceeding to payment.</p>
                            <div className="btn-group">
                                <button
                                    onClick={() => {
                                        console.log('[CHECKOUT] Moving to Step 3');
                                        setCurrentStep(3);
                                    }}
                                    className="btn-primary"
                                >
                                    Continue to Payment
                                </button>
                                <button onClick={() => setCurrentStep(1)} className="btn-text">Back</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* STEP 3: PAYMENT */}
                <div className={`checkout-step ${currentStep === 3 ? 'step-active' : 'step-inactive'}`}>
                    {currentStep === 3 && (
                        <div className="step-content">
                            <h3 className="section-title">3. Payment Options</h3>
                            
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
                                <button onClick={() => setCurrentStep(2)} className="btn-text" disabled={loading}>Back</button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

// Subcomponents
function Step({ number, label, active, completed }) {
    return (
        <div className="step-wrapper">
            <div className={`step-circle ${active || completed ? 'active' : ''}`}>
                {completed ? '✓' : number}
            </div>
            <span className={`step-label ${active || completed ? 'active-text' : ''} ${active ? 'bold-text' : ''}`}>
                {label}
            </span>
        </div>
    );
}

function StepLine({ completed }) {
    return <div className={`step-line ${completed ? 'completed-line' : ''}`} />;
}

export default Checkout;