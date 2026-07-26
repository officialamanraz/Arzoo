const fs = require('fs');
const path = require('path');
const db = require('./src/DATABASE/mysql');
const imagekit = require('./config/imagekit');

const IMAGES_FOLDER = path.join(__dirname, 'uploads'); // existing uploads folder use karenge

const migrateImages = async () => {
  const files = fs.readdirSync(IMAGES_FOLDER);
  console.log(`[MIGRATE] Found ${files.length} file(s) in uploads folder`);

  let successCount = 0;
  let notFoundCount = 0;
  let errorCount = 0;

  for (const fileName of files) {
    try {
      const filePath = path.join(IMAGES_FOLDER, fileName);
      
      const stat = fs.statSync(filePath);
      if (!stat.isFile()) continue; // skip subfolders if any

      const fileBuffer = fs.readFileSync(filePath);


      const uploaded = await imagekit.upload({
        file: fileBuffer,
        fileName: `${Date.now()}-${fileName}`,
        folder: '/arzoo-saree/products',
      });

      console.log(`[MIGRATE] Uploaded ${fileName} -> ${uploaded.url}`);

      // Update main products table (only rows still pointing to this filename)
      const [productResult] = await db.execute(
        `UPDATE products SET image_url = ? WHERE image_url LIKE ?`,
        [uploaded.url, `%${fileName}%`]
      );

      // Update product_images table (extra images)
      const [extraResult] = await db.execute(
        `UPDATE product_images SET image_url = ? WHERE image_url LIKE ?`,
        [uploaded.url, `%${fileName}%`]
      );

      const totalUpdated = productResult.affectedRows + extraResult.affectedRows;

      if (totalUpdated === 0) {
        console.warn(`[MIGRATE] Uploaded but no DB record found for: ${fileName}`);
        notFoundCount++;
      } else {
        console.log(`[MIGRATE] DB updated for ${fileName} -- ${totalUpdated} row(s)`);
        successCount++;
      }
    } catch (err) {
      console.error(`[MIGRATE] Error processing ${fileName}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n[MIGRATE] DONE -- Success: ${successCount}, Not found in DB: ${notFoundCount}, Errors: ${errorCount}`);
  process.exit(0);
};

migrateImages();