const db = require('../DATABASE/mysql');

// ---------------------------------------------------------
// Constants (no magic numbers / strings inside the logic)
// ---------------------------------------------------------
const UPLOADS_DIR = 'uploads';
const DEFAULT_PAGE_LIMIT = 10;
const MAX_PAGE_LIMIT = 50;
const MIN_RATING = 1;
const MAX_RATING = 5;
const MEDIA_TYPE_IMAGE = 'image';
const MEDIA_TYPE_VIDEO = 'video';
const HTTP_URL_PATTERN = /^https?:\/\//i;
const VIDEO_EXTENSION_PATTERN = /\.(mp4|mov|webm|mkv|m4v|3gp)$/i;

// ---------------------------------------------------------
// Small helpers
// ---------------------------------------------------------
const parseSafeJsonArray = (val, fallbackAsSingleItem = false) => {
    if (!val) return [];
    if (Array.isArray(val)) return val;
    if (Buffer.isBuffer(val)) val = val.toString('utf8');
    if (typeof val === 'string') {
        try {
            const parsed = JSON.parse(val);
            if (!parsed) return [];
            return Array.isArray(parsed) ? parsed.filter(Boolean) : [parsed];
        } catch (e) {
            return fallbackAsSingleItem ? [val] : [];
        }
    }
    return [];
};

// The "attributes" column is JSON text. Accept a string or an array/object from the controller.
const serializeAttributes = (attributes) => {
    if (attributes === undefined || attributes === null || attributes === '') return null;
    return typeof attributes === 'string' ? attributes : JSON.stringify(attributes);
};

const assertValidRating = (rating) => {
    const value = Number(rating);
    if (!Number.isInteger(value) || value < MIN_RATING || value > MAX_RATING) {
        throw new Error('INVALID_RATING');
    }
    return value;
};

// ---------------------------------------------------------
// Media handling
// The upload middleware can hand us very different file objects:
//   - ImageKit / cloud result:  { url: 'https://...' }
//   - multer disk storage:      { filename, path, mimetype }
//   - multer .fields():         { photos: [file, ...], videos: [file, ...] }
// All of them are turned into ONE stored string:
//   either a full https URL, or a relative "uploads/<name>" path.
// ---------------------------------------------------------
const normalizeMediaFiles = (mediaFiles) => {
    if (!mediaFiles) return [];
    if (Array.isArray(mediaFiles)) return mediaFiles.filter(Boolean);
    if (typeof mediaFiles === 'object') {
        const looksLikeSingleFile = ['url', 'location', 'path', 'filename'].some((key) => mediaFiles[key]);
        if (looksLikeSingleFile) return [mediaFiles];
        return Object.values(mediaFiles).flat().filter(Boolean);
    }
    return [];
};

const toStoredMediaUrl = (file) => {
    const slashFix = (value) => String(value).replace(/\\/g, '/').trim();
    const candidates = [file.url, file.location, file.fileUrl, file.secure_url, file.filename, file.path]
        .filter(Boolean)
        .map(slashFix);

    // 1) A real URL always wins (ImageKit, S3, ...)
    const absolute = candidates.find((value) => HTTP_URL_PATTERN.test(value));
    if (absolute) return absolute;

    // 2) Local disk upload: keep the part from "uploads/" onward
    if (file.path) {
        const diskPath = slashFix(file.path);
        const marker = diskPath.lastIndexOf(`${UPLOADS_DIR}/`);
        if (marker !== -1) return diskPath.slice(marker);
    }

    // 3) Only a file name is known
    if (file.filename) return `${UPLOADS_DIR}/${slashFix(file.filename).replace(/^\/+/, '')}`;

    return candidates[0] || '';
};

const detectMediaType = (file, storedUrl) => {
    const mime = String(file.mimetype || '');
    if (mime.startsWith('video/')) return MEDIA_TYPE_VIDEO;
    if (mime.startsWith('image/')) return MEDIA_TYPE_IMAGE;
    const cleanUrl = String(storedUrl).split('?')[0];
    return VIDEO_EXTENSION_PATTERN.test(cleanUrl) ? MEDIA_TYPE_VIDEO : MEDIA_TYPE_IMAGE;
};

// One INSERT for all files. db.execute() cannot expand "VALUES ?", so the placeholders are built here.
const insertReviewMedia = async (review_id, mediaFiles) => {
    const files = normalizeMediaFiles(mediaFiles);
    if (files.length === 0) return 0;

    const rows = [];
    for (const file of files) {
        const storedUrl = toStoredMediaUrl(file);
        if (!storedUrl) {
            console.warn('[REVIEW_SERVICE] Media file skipped, no usable URL. File keys:', Object.keys(file));
            continue;
        }
        rows.push([review_id, detectMediaType(file, storedUrl), storedUrl]);
    }
    if (rows.length === 0) return 0;

    const placeholders = rows.map(() => '(?, ?, ?)').join(', ');
    await db.execute(
        `INSERT INTO review_media (review_id, media_type, media_url) VALUES ${placeholders}`,
        rows.flat()
    );
    return rows.length;
};

// ---------------------------------------------------------
// Shared SQL + row mapper (used by both read functions)
// ---------------------------------------------------------
const REVIEW_COLUMNS_SQL = `
    pr.review_id, pr.rating, pr.title, pr.comment, pr.attributes_json,
    pr.is_verified_buyer, pr.helpful_votes, pr.created_at,
    u.name AS user_name,
    (
        SELECT COALESCE(JSON_ARRAYAGG(JSON_OBJECT('type', rm.media_type, 'url', rm.media_url)), '[]')
        FROM review_media rm WHERE rm.review_id = pr.review_id
    ) AS media
`;

const mapReviewRow = (rev) => ({
    ...rev,
    attributes: parseSafeJsonArray(rev.attributes_json, true),
    media: parseSafeJsonArray(rev.media, false).filter((m) => m && m.url)
});

// ---------------------------------------------------------
// Create
// ---------------------------------------------------------
const addReviewInDB = async (product_id, user_id, rating, title, comment, attributes, mediaFiles) => {
    console.log(`[REVIEW_SERVICE] Adding review for Product ID: ${product_id} by User ID: ${user_id}`);
    try {
        const safeRating = assertValidRating(rating);

        const verifyQuery = `
            SELECT o.order_id
            FROM orders o
            JOIN orderitems oi ON o.order_id = oi.order_id
            WHERE o.user_id = ? AND oi.product_id = ?
            LIMIT 1
        `;
        const [orderCheck] = await db.execute(verifyQuery, [user_id, product_id]);
        const is_verified_buyer = orderCheck.length > 0 ? 1 : 0;
        const order_id = orderCheck.length > 0 ? orderCheck[0].order_id : null;

        const insertQuery = `
            INSERT INTO product_reviews
            (product_id, user_id, order_id, rating, title, comment, attributes_json, is_verified_buyer)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const [reviewResult] = await db.execute(insertQuery, [
            product_id, user_id, order_id, safeRating,
            title || null, comment || null, serializeAttributes(attributes), is_verified_buyer
        ]);

        const review_id = reviewResult.insertId;

        try {
            const savedCount = await insertReviewMedia(review_id, mediaFiles);
            console.log(`[REVIEW_SERVICE] Media saved for review ${review_id}: ${savedCount}`);
        } catch (mediaErr) {
            // Do not leave a half-saved review (text saved, photos lost). Remove it so the user can retry cleanly.
            console.error('[REVIEW_SERVICE] Media insert failed, rolling back review:', mediaErr.message);
            await db.execute(`DELETE FROM product_reviews WHERE review_id = ?`, [review_id]);
            throw mediaErr;
        }

        console.log(`[REVIEW_SERVICE] Review added successfully with ID: ${review_id}`);
        return review_id;
    } catch (err) {
        console.error('[REVIEW_SERVICE] Error in addReviewInDB:', err.message);
        throw err;
    }
};

// ---------------------------------------------------------
// Read: summary for the product page widget
// ---------------------------------------------------------
const getReviewsFromDB = async (product_id) => {
    console.log(`[REVIEW_SERVICE] Fetching reviews for Product ID: ${product_id}`);
    try {
        const statsQuery = `
            SELECT
                COUNT(*) as totalReviews,
                ROUND(AVG(rating), 1) as avgRating,
                SUM(CASE WHEN rating = 5 THEN 1 ELSE 0 END) as stars5,
                SUM(CASE WHEN rating = 4 THEN 1 ELSE 0 END) as stars4,
                SUM(CASE WHEN rating = 3 THEN 1 ELSE 0 END) as stars3,
                SUM(CASE WHEN rating = 2 THEN 1 ELSE 0 END) as stars2,
                SUM(CASE WHEN rating = 1 THEN 1 ELSE 0 END) as stars1
            FROM product_reviews WHERE product_id = ?
        `;
        const [statsResult] = await db.execute(statsQuery, [product_id]);
        const rawStats = statsResult[0] || {};
        // SUM() comes back as a string from mysql2; make every counter a real number
        const stats = Object.fromEntries(
            Object.entries(rawStats).map(([key, value]) => [key, Number(value) || 0])
        );

        const reviewsQuery = `
            SELECT ${REVIEW_COLUMNS_SQL}
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.user_id
            WHERE pr.product_id = ?
            ORDER BY pr.created_at DESC
        `;
        const [reviews] = await db.execute(reviewsQuery, [product_id]);

        return { stats, reviews: reviews.map(mapReviewRow) };
    } catch (err) {
        console.error('[REVIEW_SERVICE] Error in getReviewsFromDB:', err.message);
        throw err;
    }
};

// ---------------------------------------------------------
// Helpful vote
// ---------------------------------------------------------
const incrementHelpfulCount = async (review_id) => {
    try {
        const updateQuery = `UPDATE product_reviews SET helpful_votes = helpful_votes + 1 WHERE review_id = ?`;
        const [result] = await db.execute(updateQuery, [review_id]);
        return result.affectedRows > 0;
    } catch (err) {
        throw err;
    }
};

// ---------------------------------------------------------
// Read: paginated list for the "All reviews" page
// ---------------------------------------------------------
const getPaginatedReviewsFromDB = async (product_id, page = 1, limit = DEFAULT_PAGE_LIMIT, sortBy = 'recent', filterRating = null, withMedia = false) => {
    try {
        const safePage = Math.max(1, parseInt(page, 10) || 1);
        const safeLimit = Math.min(MAX_PAGE_LIMIT, Math.max(1, parseInt(limit, 10) || DEFAULT_PAGE_LIMIT));
        const offset = (safePage - 1) * safeLimit;

        const queryParams = [product_id];
        let baseCondition = `WHERE pr.product_id = ?`;

        const ratingFilter = Number(filterRating);
        if (Number.isInteger(ratingFilter) && ratingFilter >= MIN_RATING && ratingFilter <= MAX_RATING) {
            baseCondition += ` AND pr.rating = ?`;
            queryParams.push(ratingFilter);
        }

        if (withMedia === 'true' || withMedia === true) {
            baseCondition += ` AND EXISTS (SELECT 1 FROM review_media rm WHERE rm.review_id = pr.review_id)`;
        }

        const countQuery = `SELECT COUNT(*) as total FROM product_reviews pr ${baseCondition}`;
        const [countResult] = await db.execute(countQuery, queryParams);
        const totalReviews = Number(countResult[0].total) || 0;

        let dataQuery = `
            SELECT ${REVIEW_COLUMNS_SQL}
            FROM product_reviews pr
            LEFT JOIN users u ON pr.user_id = u.user_id
            ${baseCondition}
        `;
        dataQuery += sortBy === 'helpful'
            ? ` ORDER BY pr.helpful_votes DESC, pr.created_at DESC`
            : ` ORDER BY pr.created_at DESC`;
        dataQuery += ` LIMIT ? OFFSET ?`;

        const [reviews] = await db.execute(dataQuery, [...queryParams, safeLimit, offset]);

        return {
            totalReviews,
            currentPage: safePage,
            totalPages: Math.ceil(totalReviews / safeLimit),
            reviews: reviews.map(mapReviewRow)
        };
    } catch (err) {
        throw err;
    }
};

// ---------------------------------------------------------
// Update (owner only). New photos are ADDED to the old ones.
// ---------------------------------------------------------
const updateReviewInDB = async (review_id, user_id, rating, title, comment, attributes, mediaFiles) => {
    try {
        const safeRating = assertValidRating(rating);

        const checkQuery = `SELECT review_id FROM product_reviews WHERE review_id = ? AND user_id = ?`;
        const [checkRes] = await db.execute(checkQuery, [review_id, user_id]);
        if (checkRes.length === 0) throw new Error('UNAUTHORIZED_OR_NOT_FOUND');

        const updateQuery = `
            UPDATE product_reviews
            SET rating = ?, title = ?, comment = ?, attributes_json = ?
            WHERE review_id = ?
        `;
        await db.execute(updateQuery, [safeRating, title || null, comment || null, serializeAttributes(attributes), review_id]);

        await insertReviewMedia(review_id, mediaFiles);
        return true;
    } catch (err) {
        throw err;
    }
};

// ---------------------------------------------------------
// Delete (owner only). Media rows are removed first so nothing is left orphaned.
// ---------------------------------------------------------
const deleteReviewFromDB = async (review_id, user_id) => {
    try {
        const checkQuery = `SELECT review_id FROM product_reviews WHERE review_id = ? AND user_id = ?`;
        const [checkRes] = await db.execute(checkQuery, [review_id, user_id]);
        if (checkRes.length === 0) throw new Error('UNAUTHORIZED_OR_NOT_FOUND');

        await db.execute(`DELETE FROM review_media WHERE review_id = ?`, [review_id]);
        await db.execute(`DELETE FROM product_reviews WHERE review_id = ?`, [review_id]);
        return true;
    } catch (err) {
        throw err;
    }
};

module.exports = {
    addReviewInDB,
    getReviewsFromDB,
    incrementHelpfulCount,
    getPaginatedReviewsFromDB,
    updateReviewInDB,
    deleteReviewFromDB
};