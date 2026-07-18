import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
const API_BASE_URL = import.meta.env.VITE_API_URL;
const Checkout = () => {
    const navigate = useNavigate();
    
    // Step Management: 1 = Address, 2 = Summary, 3 = Payment
    const [currentStep, setCurrentStep] = useState(1);
    
    // Data States
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [loading, setLoading] = useState(false);

    // Fetch addresses when the component loads
    useEffect(() => {
        const fetchAddresses = async () => {
            const token = localStorage.getItem('token');
            try {
                // Calling the backend route you just perfected!
                const res = await fetch('${API_BASE_URL}/api/addresses', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.success) {
                    setAddresses(data.addresses);
                    if (data.addresses.length > 0) {
                        setSelectedAddress(data.addresses[0]); // Select first by default
                    }
                }
            } catch (error) {
                console.error("Failed to load addresses", error);
            }
        };
        fetchAddresses();
    }, []);

    // Function to handle the final checkout call
  const handlePlaceOrder = async () => {
    console.log('[CHECKOUT-UI] Place order clicked -- address_id:', selectedAddress?.address_id);

    if (!selectedAddress || !selectedAddress.address_id) {
        alert('Please select a delivery address before placing the order.');
        console.warn('[CHECKOUT-UI] Blocked -- no address selected');
        return;
    }

    const token = localStorage.getItem('token'); // CONFIRM: same key name Login.jsx uses to save it

    if (!token) {
        alert('Please log in again to place your order.');
        console.warn('[CHECKOUT-UI] Blocked -- no auth token found');
        navigate('/login');
        return;
    }

    setLoading(true);

    try {
        // FIX: backticks, not single quotes -- was a plain string before,
        // so API_BASE_URL never actually got interpolated into the URL.
        const res = await fetch(`${API_BASE_URL}/api/checkout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                addressId: selectedAddress.address_id
                // buyNowProduct: { product_id, quantity } -- add this only for the Buy Now flow
            })
        });

        const data = await res.json();
        console.log('[CHECKOUT-UI] Response:', data);

        if (data.success) {
            alert(`Order Placed Successfully! Order ID: ${data.orderId}`);
            navigate('/order-success');
        } else {
            console.warn('[CHECKOUT-UI] Checkout failed:', data.message);
            alert(`Checkout failed: ${data.message}`);
        }
    } catch (error) {
        console.error('[CHECKOUT-UI] Order error:', error);
        alert('Something went wrong while placing the order.');
    } finally {
        setLoading(false);
    }
};
    return (
        <div className="max-w-4xl mx-auto p-4 bg-gray-50 min-h-screen">
            
            {/* STEP 1: ADDRESS */}
            <div className={`bg-white p-6 rounded shadow mb-4 ${currentStep === 1 ? 'border-l-4 border-blue-500' : 'opacity-70'}`}>
                <h2 className="text-xl font-bold mb-4 text-blue-600">1. Delivery Address</h2>
                
                {currentStep === 1 && (
                    <div>
                        {addresses.length === 0 ? (
                            <p>No addresses found. Please add a new address.</p>
                        ) : (
                            addresses.map((addr) => (
                                <div key={addr.address_id} className="border p-4 mb-3 rounded flex items-start gap-3">
                                    <input 
                                        type="radio" 
                                        name="address" 
                                        checked={selectedAddress?.address_id === addr.address_id}
                                        onChange={() => setSelectedAddress(addr)}
                                        className="mt-1"
                                    />
                                    <div>
                                        <p className="font-semibold">{addr.full_name} <span className="text-sm font-normal text-gray-500">{addr.phone}</span></p>
                                        <p className="text-sm text-gray-700">{addr.house_no}, {addr.road_area}, {addr.city}, {addr.state} - {addr.pincode}</p>
                                    </div>
                                </div>
                            ))
                        )}
                        <button 
                            onClick={() => setCurrentStep(2)} 
                            disabled={!selectedAddress}
                            className="bg-orange-500 text-white px-6 py-2 rounded mt-4 hover:bg-orange-600 disabled:bg-gray-400"
                        >
                            Deliver Here
                        </button>
                    </div>
                )}
            </div>

            {/* STEP 2: ORDER SUMMARY */}
            <div className={`bg-white p-6 rounded shadow mb-4 ${currentStep === 2 ? 'border-l-4 border-blue-500' : 'opacity-70'}`}>
                <h2 className="text-xl font-bold mb-4 text-blue-600">2. Order Summary</h2>
                
                {currentStep === 2 && (
                    <div>
                        <p className="text-gray-600 mb-4">Your cart items will be fetched securely on the server.</p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setCurrentStep(3)} 
                                className="bg-orange-500 text-white px-6 py-2 rounded hover:bg-orange-600"
                            >
                                Continue
                            </button>
                            <button onClick={() => setCurrentStep(1)} className="text-blue-500">Back</button>
                        </div>
                    </div>
                )}
            </div>

            {/* STEP 3: PAYMENT */}
            <div className={`bg-white p-6 rounded shadow ${currentStep === 3 ? 'border-l-4 border-blue-500' : 'opacity-70'}`}>
                <h2 className="text-xl font-bold mb-4 text-blue-600">3. Payment Options</h2>
                
                {currentStep === 3 && (
                    <div>
                        <div className="border border-green-500 bg-green-50 p-4 rounded mb-6">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="radio" checked readOnly className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-lg">Cash on Delivery (COD)</span>
                            </label>
                            <p className="text-sm text-gray-600 ml-8 mt-1">Pay with cash when your order arrives.</p>
                        </div>

                        <div className="flex gap-4">
                            <button 
                                onClick={handlePlaceOrder} 
                                disabled={loading}
                                className="bg-orange-500 text-white px-8 py-3 rounded font-bold text-lg hover:bg-orange-600 disabled:bg-gray-400"
                            >
                                {loading ? 'Placing Order...' : 'Place Order'}
                            </button>
                            <button onClick={() => setCurrentStep(2)} className="text-blue-500">Back</button>
                        </div>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Checkout;