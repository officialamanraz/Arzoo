// backend/migrate-images-v3.js
const fs = require('fs');
const path = require('path');
const db = require('./src/DATABASE/mysql');
const imagekit = require('./config/imagekit');

const IMAGES_FOLDER = path.join(__dirname, 'uploads');

// Try to find the real file even if DB filename doesn't exactly match
const findRealFile = (dbFileName) => {
  const directPath = path.join(IMAGES_FOLDER, dbFileName);
  if (fs.existsSync(directPath)) return dbFileName;

  // Try converting "saare_291_2.png" -> "saare_291 (2).png"
  const converted = dbFileName.replace(/_(\d+)\.(\w+)$/, ' ($1).$2');
  if (fs.existsSync(path.join(IMAGES_FOLDER, converted))) return converted;

  // Try swapping extension (.png <-> .jpeg <-> .jpg)
  const nameNoExt = dbFileName.replace(/\.\w+$/, '');
  const altExts = ['.png', '.jpeg', '.jpg'];
  for (const ext of altExts) {
    const altPath = path.join(IMAGES_FOLDER, nameNoExt + ext);
    if (fs.existsSync(altPath)) return nameNoExt + ext;
  }

  return null;
};

const migrate = async () => {
  const [products] = await db.execute(
    `SELECT product_id, image_url FROM products WHERE image_url IS NOT NULL AND image_url NOT LIKE 'https://ik.imagekit.io%'`
  );
  console.log(`[MIGRATE-V3] ${products.length} product(s) to process`);

  for (const p of products) {
    const realFile = findRealFile(p.image_url);
    if (!realFile) {
      console.warn(`[MIGRATE-V3] STILL MISSING -- product_id ${p.product_id}: ${p.image_url}`);
      continue;
    }

    try {
      const fileBuffer = fs.readFileSync(path.join(IMAGES_FOLDER, realFile));
      const uploaded = await imagekit.upload({
        file: fileBuffer,
        fileName: `${Date.now()}-${realFile}`,
        folder: '/arzoo-saree/products',
      });
      await db.execute(`UPDATE products SET image_url = ? WHERE product_id = ?`, [uploaded.url, p.product_id]);
      console.log(`[MIGRATE-V3] product_id ${p.product_id} (${p.image_url} -> found as ${realFile}) -> ${uploaded.url}`);
    } catch (err) {
      console.error(`[MIGRATE-V3] Error on product_id ${p.product_id}:`, err.message);
    }
  }

  console.log('[MIGRATE-V3] DONE');
  process.exit(0);
};

migrate();