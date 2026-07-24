import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Checkout.css'; // Importing the separate CSS file

const API_BASE_URL = import.meta.env.VITE_API_URL;

const Checkout = () => {
    const navigate = useNavigate();
    
    // Step Management: 1 = Address, 2 = Summary, 3 = Payment
    const [currentStep, setCurrentStep] = useState(1);
    
    // Data States
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchAddresses = async () => {
            console.log('[CHECKOUT] Component mounted. Fetching addresses...');
            const token = localStorage.getItem('token');
            try {
                const res = await fetch(`${API_BASE_URL}/api/addresses`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                
                console.log('[CHECKOUT] Addresses fetched successfully:', data);
                if (data.success) {
                    setAddresses(data.addresses);
                    if (data.addresses.length > 0) {
                        setSelectedAddress(data.addresses[0]); // Select first by default
                        console.log('[CHECKOUT] Default address set:', data.addresses[0]);
                    }
                }
            } catch (error) {
                console.error("[CHECKOUT] Failed to load addresses", error);
            }
        };
        fetchAddresses();
    }, []);

  const handlePlaceOrder = async () => {
    console.log('[CHECKOUT] Place order clicked -- address_id:', selectedAddress?.address_id);

    if (!selectedAddress || !selectedAddress.address_id) {
        alert('Please select a delivery address before placing the order.');
        console.warn('[CHECKOUT] Blocked -- no address selected');
        return;
    }

    const token = localStorage.getItem('token'); 

    if (!token) {
        alert('Please log in again to place your order.');
        console.warn('[CHECKOUT] Blocked -- no auth token found');
        navigate('/login');
        return;
    }

    setLoading(true);

    try {
        const res = await fetch(`${API_BASE_URL}/api/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                addressId: selectedAddress.address_id
            })
        });

        const data = await res.json();
        console.log('[CHECKOUT] Server Response:', data);

        if (data.success) {
            alert(`Order Placed Successfully! Order ID: ${data.orderId}`);
            navigate('/order-success');
        } else {
            console.warn('[CHECKOUT] Checkout failed:', data.message);
            alert(`Checkout failed: ${data.message}`);
        }
    } catch (error) {
        console.error('[CHECKOUT] Order error:', error);
        alert('Something went wrong while placing the order.');
    } finally {
        setLoading(false);
    }
};

    return (
        <div className="checkout-page">
            <div className="checkout-container">
                
                {/* STEP 1: ADDRESS */}
                <div className={`checkout-step ${currentStep === 1 ? 'step-active' : 'step-inactive'}`}>
                    <h2 className="step-title">1. Delivery Address</h2>
                    
                    {currentStep === 1 && (
                        <div className="step-content">
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
                    <h2 className="step-title">2. Order Summary</h2>
                    
                    {currentStep === 2 && (
                        <div className="step-content">
                            <p className="info-text">Your cart items will be fetched securely on the server.</p>
                            <div className="btn-group">
                                <button 
                                    onClick={() => {
                                      console.log('[CHECKOUT] Moving to Step 3');
                                      setCurrentStep(3);
                                    }} 
                                    className="btn-primary"
                                >
                                    Continue
                                </button>
                                <button onClick={() => setCurrentStep(1)} className="btn-text">Back</button>
                            </div>
                        </div>
                    )}
                </div>

                {/* STEP 3: PAYMENT */}
                <div className={`checkout-step ${currentStep === 3 ? 'step-active' : 'step-inactive'}`}>
                    <h2 className="step-title">3. Payment Options</h2>
                    
                    {currentStep === 3 && (
                        <div className="step-content">
                            <div className="payment-method-card">
                                <label className="payment-label">
                                    <input type="radio" checked readOnly className="payment-radio" />
                                    <span className="payment-name">Cash on Delivery (COD)</span>
                                </label>
                                <p className="payment-desc">Pay with cash when your order arrives.</p>
                            </div>

                            <div className="btn-group">
                                <button 
                                    onClick={handlePlaceOrder} 
                                    disabled={loading}
                                    className="btn-primary btn-large"
                                >
                                    {loading ? 'Placing Order...' : 'Place Order'}
                                </button>
                                <button onClick={() => setCurrentStep(2)} className="btn-text">Back</button>
                            </div>
                        </div>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Checkout;