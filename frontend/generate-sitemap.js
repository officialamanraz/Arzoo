// Builds public/sitemap.xml: the fixed pages + one URL for every product in the database.
// Run from the frontend folder:   node generate-sitemap.js
// Optional:                       node generate-sitemap.js <api-url> <output-file>
// Add  "prebuild": "node generate-sitemap.js"  to package.json scripts to refresh it on every deploy.

const fs = require('fs');
const path = require('path');

const SITE_URL = 'https://royal-heritage.in';
const API_URL = (process.argv[2] || 'https://arzoo-3.onrender.com').replace(/\/+$/, '');
const OUTPUT_FILE = process.argv[3] || path.join('public', 'sitemap.xml');

const STATIC_PAGES = ['/', '/products', '/about', '/contact'];
const PRODUCT_PATH = '/product/';

const PAGE_SIZE = 100;
const MAX_PAGES = 500;
const MAX_URLS = 50000;          // sitemap protocol limit per file
const REQUEST_TIMEOUT_MS = 90000; // free hosting can take ~50s to wake up
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 3000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const escapeXml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
};

const fetchJson = async (url) => {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        try {
            const response = await fetch(url, { signal: controller.signal });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            return await response.json();
        } catch (error) {
            lastError = error;
            console.warn(`[SITEMAP] Attempt ${attempt}/${MAX_ATTEMPTS} failed for ${url}: ${error.message}`);
            if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS);
        } finally {
            clearTimeout(timer);
        }
    }
    throw lastError;
};

const fetchAllProducts = async () => {
    const products = new Map(); // product id -> lastmod (dedupes automatically)

    for (let page = 1; page <= MAX_PAGES; page += 1) {
        const result = await fetchJson(`${API_URL}/api/products/all?page=${page}&limit=${PAGE_SIZE}`);
        const rows = Array.isArray(result) ? result : (result.data || result.products || []);
        if (!Array.isArray(rows) || rows.length === 0) break;

        const before = products.size;
        rows.forEach((row) => {
            const id = row.product_id ?? row.id;
            if (id === undefined || id === null || String(id).trim() === '') return;
            products.set(String(id).trim(), toDate(row.updated_at || row.created_at));
        });

        // The API ignored the page number and sent the same rows again, or this was the last page
        if (products.size === before || rows.length < PAGE_SIZE) break;
    }
    return products;
};

const buildXml = (entries) => {
    const body = entries.map(({ loc, lastmod }) =>
        `  <url>\n    <loc>${escapeXml(loc)}</loc>${lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : ''}\n  </url>`
    ).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
};

const main = async () => {
    const today = new Date().toISOString().slice(0, 10);
    const entries = STATIC_PAGES.map((pagePath) => ({ loc: `${SITE_URL}${pagePath}`, lastmod: today }));

    try {
        const products = await fetchAllProducts();
        [...products.entries()]
            .sort((a, b) => Number(a[0]) - Number(b[0]))
            .forEach(([id, lastmod]) => entries.push({ loc: `${SITE_URL}${PRODUCT_PATH}${encodeURIComponent(id)}`, lastmod }));
        console.log(`[SITEMAP] ${products.size} product page(s) added.`);
    } catch (error) {
        // Never break the deploy: write the fixed pages only and say so clearly
        console.error(`[SITEMAP] Could not load products (${error.message}). Writing the fixed pages only.`);
    }

    if (entries.length > MAX_URLS) {
        console.warn(`[SITEMAP] ${entries.length} URLs found; keeping the first ${MAX_URLS} (protocol limit).`);
        entries.length = MAX_URLS;
    }

    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, buildXml(entries), 'utf8');
    console.log(`[SITEMAP] ${entries.length} URL(s) written to ${OUTPUT_FILE}`);
};

main().catch((error) => {
    console.error('[SITEMAP] Unexpected error:', error);
    process.exit(1);
});
