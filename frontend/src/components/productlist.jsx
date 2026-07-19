import React, { useState, useEffect } from 'react';
const API_BASE_URL = import.meta.env.VITE_API_URL;
const ProductList = () => {
    // 1. Sarees ka data rakhne ke liye state (Shuru me khali array [])
    const [sarees, setSarees] = useState([]);
    
    // Loading aur Error dikhane ke liye state
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // 2. Page load hote hi data mangwana
    useEffect(() => {
        // Backend ka wahi Postman wala URL
        const fetchSarees = async () => {
            try {
       const response = await fetch(`${API_BASE_URL}/api/products/all?page=1&limit=10`);
                const result = await response.json();

                if (result.success) {
                    setSarees(result.data); // Saree array ko state me save kar liya
                } else {
                    setError("Sarees load nahi ho payi.");
                }
            } catch (err) {
                setError("Backend server se connect nahi ho pa raha hai.");
            } finally {
                setLoading(false); // Data aa gaya toh loading band kar do
            }
        };

        fetchSarees();
    }, []); // Khali array [] ka matlab hai ye code sirf page khulne par ek baar chalega

    // Agar data aa raha hai, toh Loading dikhao
    if (loading) return <h2>Aman Saare ka collection load ho raha hai... ⏳</h2>;
    
    // Agar server band hai ya error hai
    if (error) return <h2 style={{ color: 'red' }}>{error}</h2>;

    // 3. React me Data Dikhana (HTML render karna)
    return (
        <div style={{ padding: '20px' }}>
            <h1>Aman Saare - Latest Collection</h1>
            
            {/* Sarees ka Grid */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px' }}>
                
                {/* React me loop lagane ke liye .map() use karte hain */}
                {sarees.map((saree) => (
                    <div key={saree.id} style={cardStyle}>
                        
                      {/* Image URL backend ke static folder se */}
                        <img 
                            src={`${API_BASE_URL}/uploads/${saree.image}`} 
                            alt={saree.name} 
                            style={{ width: '100%', height: '250px', objectFit: 'cover', borderRadius: '5px' }}
                        />
                        
                        <h3>{saree.name}</h3>
                        <p style={{ color: 'gray' }}>{saree.description}</p>
                        <h2 style={{ color: 'green' }}>₹{saree.price}</h2>
                        
                        <button style={buttonStyle}>Add to Cart</button>
                    </div>
                ))}

            </div>
        </div>
    );
};

// Thoda sa inline CSS taaki card sundar dikhe
const cardStyle = {
    border: '1px solid #ddd',
    padding: '15px',
    borderRadius: '10px',
    width: '300px',
    boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
    backgroundColor: '#fff'
};

const buttonStyle = {
    backgroundColor: '#ff5722',
    color: 'white',
    padding: '10px',
    width: '100%',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    fontSize: '16px'
};

export default ProductList;