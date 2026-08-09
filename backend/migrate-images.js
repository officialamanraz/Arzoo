// backend/migrateImages.js
// ONE-TIME SCRIPT: uploads old local images to ImageKit and updates DB image_url column
// Run with: node migrateImages.js

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('./src/DATABASE/mysql');       // adjust path if your db export is elsewhere
const imagekit = require('./config/imagekit');     // adjust path if needed

const UPLOADS_DIR = path.join(__dirname, 'uploads');

async function run() {
  const filesInFolder = fs.readdirSync(UPLOADS_DIR);
  console.log(`Found ${filesInFolder.length} files in uploads folder`);

  const [rows] = await db.execute('SELECT product_id, image_url FROM products');
  console.log(`Found ${rows.length} products in DB`);

  const unmatched = [];
  let successCount = 0;
  let skippedCount = 0;

  for (const row of rows) {
    const dbFileName = row.image_url;

    // already a full ImageKit URL or empty -> skip
    if (!dbFileName || dbFileName.startsWith('http')) {
      skippedCount++;
      continue;
    }

    // 1. exact match
    let matchedFile = filesInFolder.find(f => f === dbFileName);

    // 2. case-insensitive match
    if (!matchedFile) {
      matchedFile = filesInFolder.find(
        f => f.toLowerCase() === dbFileName.toLowerCase()
      );
    }

    // 3. match ignoring extension (jpeg vs jpg vs png etc.)
    if (!matchedFile) {
      const dbNameNoExt = path.parse(dbFileName).name.toLowerCase();
      matchedFile = filesInFolder.find(
        f => path.parse(f).name.toLowerCase() === dbNameNoExt
      );
    }

    if (!matchedFile) {
      unmatched.push({ product_id: row.product_id, expected: dbFileName });
      continue;
    }

    try {
      const filePath = path.join(UPLOADS_DIR, matchedFile);
      const fileBuffer = fs.readFileSync(filePath);

      const uploadResponse = await imagekit.upload({
        file: fileBuffer,
        fileName: matchedFile,
        folder: '/arzoo-saree/products'
      });

      await db.execute(
        'UPDATE products SET image_url = ? WHERE product_id = ?',
        [uploadResponse.url, row.product_id]
      );

      console.log(`OK  product_id ${row.product_id}: ${matchedFile} -> ${uploadResponse.url}`);
      successCount++;
    } catch (err) {
      console.error(`FAIL product_id ${row.product_id}:`, err.message);
      unmatched.push({ product_id: row.product_id, expected: dbFileName, error: err.message });
    }
  }

  console.log(`\n--- Summary ---`);
  console.log(`Uploaded & updated: ${successCount}`);
  console.log(`Already migrated / skipped: ${skippedCount}`);
  console.log(`Unmatched (need manual review): ${unmatched.length}`);
  if (unmatched.length) {
    fs.writeFileSync('unmatched.json', JSON.stringify(unmatched, null, 2));
    console.log('-> unmatched list saved to unmatched.json');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('Script failed:', err);
  process.exit(1);
});