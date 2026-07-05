// const db = require('./src/DATABASE/mysql.js');
// const db = require('./mysql.js');
// const sareesData = require('./saares_detailed.js'); // Agar ye file bhi isi DATABASE folder mein hai

// console.log('Database check ho raha hai...');

// // 1. Pehle hum yahan table create/check karenge (Taaki Saree rakhne ke liye Rack hamesha ready ho)
// const createTableQuery = `
//     CREATE TABLE IF NOT EXISTS sarees_detailed (
//         id INT PRIMARY KEY,
//         title VARCHAR(255),
//         price INT,
//         thumbnail VARCHAR(255),
//         primary_color VARCHAR(100),
//         other_color VARCHAR(100),
//         border_type VARCHAR(100),
//         pattern VARCHAR(100),
//         craft VARCHAR(100),
//         weave VARCHAR(100),
//         zari_type VARCHAR(100),
//         blouse VARCHAR(100),
//         border_motifs VARCHAR(100),
//         origin VARCHAR(100),
//         fabric_material VARCHAR(100),
//         khats VARCHAR(100),
//         product_weight VARCHAR(50),
//         blouse_length VARCHAR(50),
//         saree_length VARCHAR(50),
//         saree_width VARCHAR(50)
//     )
// `;

// // Pehle ye query chalegi...
// db.query(createTableQuery, (err) => {
//   if (err) {
//     console.error('Table check/create karte waqt error:', err.message);
//     return;
//   }

//   console.log('✅ Table bilkul ready hai! Ab data insert ho raha hai...');

//   // 2. JAB table ban jaye, TABHI ye loop chalega (Issue 3 Fixed!)
//   sareesData.forEach((saree) => {
//     const detail = saree['more-detail'];
//     const measurement = saree.measurement;

//     const sqlQuery = `INSERT INTO sarees_detailed 
//         (id, title, price, thumbnail, primary_color, other_color, border_type, pattern, craft, weave, zari_type, blouse, border_motifs, origin, fabric_material, khats, product_weight, blouse_length, saree_length, saree_width) 
//         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

//     const values = [
//       saree.id,
//       saree.title,
//       saree.price,
//       saree.thumbnail,
//       detail?.['primary color'] || 'none',
//       detail?.['other color'] || 'none',
//       detail?.['border type'] || 'none',
//       detail?.pattern || 'none',
//       detail?.Craft || 'none',
//       detail?.weave || 'none',
//       detail?.['zari type'] || 'none',
//       detail?.blouse || 'none',
//       detail?.['border motifs'] || 'none',
//       detail?.origin || 'none',
//       detail?.['fabric/material'] || 'none',
//       detail?.khats || 'none',
//       measurement?.['product weight'] || 'none',
//       measurement?.['blouse length'] || 'none',
//       measurement?.['saree length'] || 'none',
//       measurement?.['saree width'] || 'none',
//     ];

//     db.query(sqlQuery, values, (err, result) => {
//       if (err) {
//         console.error(`❌ Error in ID ${saree.id}:`, err.message);
//       } else {
//         console.log(`✅ Saree ID ${saree.id} successfully inserted!`);
//       }
//     });
//   });
// });
