const mysql = require('mysql2/promise');

async function runMigration() {
  // 1. Connect to your database (Update with your actual credentials)
  const db = await mysql.createConnection({
    host: '127.0.0.1',
    user: 'root',
    password: '123456', // your password
    database: 'shoping_website_database' // your database name
  });

  console.log("Connected to database. Starting migration...");

  try {
    // 2. Fetch all products that have data in the description column
    const [products] = await db.execute('SELECT product_id, description FROM products WHERE description IS NOT NULL');

    let successCount = 0;

    for (const product of products) {
      let details = {};
      const desc = product.description;

      // 3. Try to parse it as JSON first
      try {
        const parsedJson = JSON.parse(desc);
        if (parsedJson.more_detail) {
          details = {
            primary_color: parsedJson.more_detail['primary color'] || parsedJson.more_detail['primary_color'],
            other_color: parsedJson.more_detail['other color'] || parsedJson.more_detail['other_colors'],
            border_type: parsedJson.more_detail['border type'] || parsedJson.more_detail['border_type'],
            pattern: parsedJson.more_detail['pattern'],
            craft: parsedJson.more_detail['Craft'] || parsedJson.more_detail['craft'],
            weave: parsedJson.more_detail['weave'],
            zari_type: parsedJson.more_detail['zari type'] || parsedJson.more_detail['zari_type'],
            blouse: parsedJson.more_detail['blouse'],
            border_motifs: parsedJson.more_detail['border_motifs'],
            origin: parsedJson.more_detail['Origin'] || parsedJson.more_detail['origin'],
            fabric: parsedJson.more_detail['Fabric'] || parsedJson.more_detail['fabric'],
            khats: parsedJson.more_detail['Khats'] || parsedJson.more_detail['khats'],
            weight: parsedJson.more_detail['Product Weight'] || parsedJson.more_detail['weight'],
            blouse_length: parsedJson.more_detail['Blouse Length'] || parsedJson.more_detail['blouse_length'],
          };
        }
      } catch (e) {
        // 4. If it's NOT JSON, it must be the plain text format. We extract using Regex.
        const extractMatch = (key) => {
          const regex = new RegExp(`${key}:\\s*(.*?)(?=\\s*,\\s*[A-Z][a-z]+|$)`, 'i');
          const match = desc.match(regex);
          return match ? match[1].trim() : null;
        };

        details = {
          primary_color: extractMatch('Primary Color'),
          other_color: extractMatch('Other Color'),
          border_type: extractMatch('Border Type'),
          pattern: extractMatch('Pattern'),
          craft: extractMatch('Craft'),
          weave: extractMatch('Weave'),
          zari_type: extractMatch('Zari Type'),
          blouse: extractMatch('Blouse'),
          border_motifs: extractMatch('Border Motifs'),
          origin: extractMatch('Origin'),
          fabric: extractMatch('Fabric'),
          khats: extractMatch('Khats'),
          weight: extractMatch('Product Weight'),
          blouse_length: extractMatch('Blouse Length'),
        };
      }

      // 5. Convert 'khats' into a pure Integer (e.g., "120 khats" becomes 120)
      let khatsInt = null;
      if (details.khats) {
        const numbersOnly = details.khats.toString().replace(/\D/g, ''); // Strips out text
        if (numbersOnly) khatsInt = parseInt(numbersOnly, 10);
      }

      // 6. Update the row with the cleanly extracted data
      await db.execute(
        `UPDATE products SET 
          primary_color = ?, other_color = ?, border_type = ?, pattern = ?, craft = ?, 
          weave = ?, zari_type = ?, blouse = ?, border_motifs = ?, origin = ?, 
          fabric = ?, khats = ?, weight = ?, blouse_length = ? 
        WHERE product_id = ?`,
        [
          details.primary_color || null,
          details.other_color || null,
          details.border_type || null,
          details.pattern || null,
          details.craft || null,
          details.weave || null,
          details.zari_type || null,
          details.blouse || null,
          details.border_motifs || null,
          details.origin || null,
          details.fabric || null,
          khatsInt, // Inserted as a pure integer
          details.weight || null,
          details.blouse_length || null,
          product.product_id
        ]
      );

      successCount++;
    }

    console.log(`✅ Migration complete! Successfully updated ${successCount} products.`);
    
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    await db.end();
  }
}

runMigration();