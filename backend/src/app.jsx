// import { useState, useEffect } from 'react';
// import './App.css';

// function App() {
//   const [sarees, setSarees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [minPrice, setMinPrice] = useState(10000);
//   const [maxPrice, setMaxPrice] = useState(300000);
//   const fetchSarees = async () => {
//     setLoading(true);
//     try {
//         // YAHAN DEKH: URL mein min aur max attach karke bhej rahe hain
//         const response = await fetch(`http://localhost:5000/api/products?min=${minPrice}&max=${maxPrice}`);
//         const result = await response.json();
        
//         if (result.success) {
//             setSarees(result.data); // Ab backend se wahi sarees aayengi jo filter ho chuki hain
//         }
//     } catch (error) {
//         console.error("Error fetching sarees:", error);
//     } finally {
//         setLoading(false);
//     }
// };

// // Jab bhi minPrice ya maxPrice change ho, dobara fetch karo
// useEffect(() => {
//     fetchSarees();
// }, [minPrice, maxPrice]);
//   useEffect(() => {
//     // 🛠️ Port 5000 kar diya hai
//     fetch('http://localhost:5000/api/products')
//       .then((response) => response.json())
//       .then((result) => {
//         // Backend ke response ke hisaab se data set kiya
//         const data = result.data || result.products || result;
//         setSarees(Array.isArray(data) ? data : []);
//         setLoading(false);
//       })
//       .catch((error) => {
//         console.error('Error fetching data:', error);
//         setLoading(false);
//       });
//   }, []);

//   if (loading) {
//     return (
//       <h2 style={{ textAlign: 'center', marginTop: '50px' }}>
//         Aman Saare collection load ho rahi hai... ⏳
//       </h2>
//     );
//   }

//   return (
//     <div className="container">
//       <header>
//         <h1>Aman Saare Collection</h1>
//         <p>Premium Kota Doria Sarees</p>
//       </header>

//       <div className="saree-grid">
//         {sarees.map((saree) => (
//           <div key={saree.product_id || saree.id} className="saree-card">
//             <div className="image-container">
//               {/* 🛠️ Image path theek kiya */}
//               <img
//                 src={`http://localhost:5000/uploads/${saree.thumbnail || saree.image_url}`}
//                 alt={saree.title || saree.name}
//                 className="saree-image"
//                 onError={(e) => (e.target.src = '/saare_1.jpeg')}
//               />
//             </div>

//             <div className="saree-info">
//               <h3>{saree.title || saree.name}</h3>
//               <p className="price">
//                 ₹{Number(saree.price).toLocaleString('en-IN')}
//               </p>

//               <div className="details">
//                 {/* Check kiya hai ki 'more-detail' hai ya nahi */}
//                 {saree['more-detail'] && (
//                   <>
//                     <p>
//                       <strong>Color:</strong>{' '}
//                       {saree['more-detail']['primary color']}
//                     </p>
//                     <p>
//                       <strong>Zari:</strong> {saree['more-detail']['zari type']}
//                     </p>
//                     <p className="origin">{saree['more-detail'].origin}</p>
//                   </>
//                 )}
//               </div>

//               <button className="buy-btn">Buy Now</button>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default App;
