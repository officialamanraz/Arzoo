const mysql = require('mysql2/promise');

async function generateDescriptions() {
  const db = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456', // 🚨 Put your actual DB password here
    database: 'shoping_website_database' 
  });
  console.log("Connected! Generating unique descriptions for all sarees...");

  try {
    // 1. Fetch all products with their new dynamic details
    const [products] = await db.execute('SELECT * FROM products');
    let successCount = 0;

    for (const product of products) {
      
      // 2. We set fallback words just in case a column is empty for a specific saree
      const color = product.primary_color || 'beautiful';
      const border = product.border_type || 'classic border';
      const pattern = product.pattern || 'traditional motifs';
      const craft = product.craft || 'highly skilled artisan weaving';
      const zari = product.zari_type || 'premium threads';

      // 3. Build a beautiful, dynamic marketing paragraph!
      const beautifulDescription = `Elevate your ethnic wardrobe with this stunning ${color} authentic Kota Doria saree. Woven with care in the traditional looms of Kaithoon, this saree features ${pattern}, beautifully complemented by a ${border}. Crafted using ${craft} and detailed with ${zari}, it offers the signature sheer, lightweight, and breathable texture that authentic Kota fabric is famous for. Graceful, easy to drape, and timeless—this saree is a perfect choice for summer festivities, elegant daytime events, or sophisticated office wear.`;

      // 4. Update the description column with this new paragraph
      await db.execute(
        'UPDATE products SET description = ? WHERE product_id = ?',
        [beautifulDescription, product.product_id]
      );

      successCount++;
    }

    console.log(`✅ Success! Generated beautiful, unique descriptions for ${successCount} products.`);

  } catch (err) {
    console.error("Error generating descriptions:", err);
  } finally {
    await db.end();
  }
}

generateDescriptions();