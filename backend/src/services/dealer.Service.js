const db = require('../DATABASE/mysql');

// 🚀 Aapka Image Helper Import karein
const { getFullImageUrl } = require('../utils/imageUtils');

/**
 * ============================================================================
 * SERVICE 1: FETCH MASTER DEALER REPORTS (ALL DEALERS)
 * ============================================================================
 */
const getBasicDealerListDB = async () => {
    console.log('[DEALER_SERVICE] 📋 [START] Fetching basic dealer list...');
    
    const [dealers] = await db.execute(
        `SELECT dealer_id, name, email, phone, status, commission_percentage, image_url FROM dealers ORDER BY name ASC`
    );
    
    console.log(`[DEALER_SERVICE] 🔄 Formatting image URLs for ${dealers.length} dealers...`);
    
    const formattedDealers = dealers.map(dealer => ({
        ...dealer,
        image_url: getFullImageUrl(dealer.image_url)
    }));

    console.log(`[DEALER_SERVICE] ✅ [END] Successfully fetched and formatted ${formattedDealers.length} dealer(s).`);
    return formattedDealers;
};

/**
 * ============================================================================
 * SERVICE 2: FETCH ADMIN DEALER DETAILS (SPECIFIC DEALER INVENTORY & SOLD SUMMARY)
 * ============================================================================
 */
const fetchAdminDealerDetailService = async (dealerId) => {
    console.log(`[DEALER_SERVICE_DETAIL] 🔍 [START] Fetching profile & inventory for Dealer ID: ${dealerId}...`);

    // A. Fetch dealer details from database
    const [dealers] = await db.execute(
        `SELECT dealer_id, name, email, phone, razorpay_linked_account_id, commission_percentage, status, created_at, image_url 
         FROM dealers WHERE dealer_id = ?`,
        [dealerId]
    );

    if (dealers.length === 0) {
        console.warn(`[DEALER_SERVICE_DETAIL] ⚠️ Dealer not found with ID: ${dealerId}. Aborting service.`);
        return null;
    }

    const dealer = dealers[0];
    dealer.image_url = getFullImageUrl(dealer.image_url);

    // B. Fetch products + Order ID & Subcategory
    const [products] = await db.execute(
        `SELECT p.product_id, p.name, p.price, p.dealer_base_price, p.packaging_cost, p.stock_qty, p.image_url, 
                p.mrp, p.discount_percentage, p.is_returnable, 
                MAX(c.name) as category_name, 
                MAX(sc.subcategory_name) as subcategory_name, 
                MAX(oi.order_id) as order_id
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.category_id
         LEFT JOIN subcategories sc ON p.subcategory_id = sc.subcategory_id
         LEFT JOIN orderitems oi ON p.product_id = oi.product_id
         WHERE p.dealer_id = ?
         GROUP BY p.product_id, p.name, p.price, p.dealer_base_price, p.packaging_cost, p.stock_qty, p.image_url, 
                  p.mrp, p.discount_percentage, p.is_returnable`,
        [dealerId]
    );

    // C. Calculate Unsold Inventory Summary (Based on Stock)
    let total_inventory_mrp = 0;
    let total_dealer_base_value = 0;
    let total_potential_admin_profit = 0;

    const dealerCommission = Number(dealer.commission_percentage || 0);

    const formattedProducts = products.map((prod) => {
        const stockQty = Number(prod.stock_qty || 0);
        const mrpToUse = (prod.mrp && Number(prod.mrp) > 0) ? Number(prod.mrp) : Number(prod.price || 0);
        const sellingPrice = Number(prod.price || 0);
        const packing = Number(prod.packaging_cost || 0);
        
        // 🌟 Strictly calculate based on Dealer's Default Commission Percentage
        let effectiveDealerBase = 0;
        if (sellingPrice > 0) {
            effectiveDealerBase = sellingPrice * (100 - dealerCommission) / 100;
        }
        const effectiveAdminProfit = sellingPrice - effectiveDealerBase - packing;

        if (stockQty > 0) {
            total_inventory_mrp += (mrpToUse * stockQty);
            total_dealer_base_value += (effectiveDealerBase * stockQty);
            total_potential_admin_profit += (effectiveAdminProfit * stockQty);
        }

        return {
            ...prod,
            dealer_base_price: effectiveDealerBase,
            image_url: getFullImageUrl(prod.image_url) 
        };
    });

    // D. 🌟 NEW: Calculate Sold Items Accountability Summary (Total Sold Items & Actual Profit/Payout)
    console.log(`[DEALER_SERVICE_DETAIL] 🧮 Calculating Sold Items Accountability Summary...`);
    const [soldItemsResult] = await db.execute(
        `SELECT 
            SUM(oi.quantity) as total_products_sold,
            SUM(oi.unit_price * oi.quantity) as total_revenue_sold,
            SUM(oi.locked_dealer_payout) as total_sold_dealer_payout
         FROM orderitems oi
         INNER JOIN products p ON oi.product_id = p.product_id
         WHERE p.dealer_id = ?`,
        [dealerId]
    );

    const soldData = soldItemsResult[0] || {};
    const total_products_sold = Number(soldData.total_products_sold || 0);
    const total_revenue_sold = Number(soldData.total_revenue_sold || 0);
    const total_sold_dealer_payout = Number(soldData.total_sold_dealer_payout || 0);
    
    // Net Profit from Sold Items = Revenue - Dealer Payout - (Total Packaging Cost for sold items if applicable)
    // Here we estimate packaging cost or pull directly. Let's calculate safely:
    const [soldPackagingResult] = await db.execute(
        `SELECT SUM(COALESCE(p.packaging_cost, 0) * oi.quantity) as total_pkg
         FROM orderitems oi
         INNER JOIN products p ON oi.product_id = p.product_id
         WHERE p.dealer_id = ?`,
        [dealerId]
    );
    const total_sold_packaging = Number(soldPackagingResult[0]?.total_pkg || 0);
    const total_net_profit_sold = total_revenue_sold - total_sold_dealer_payout - total_sold_packaging;

    console.log(`[DEALER_SERVICE_DETAIL] ✅ Sold Summary -> Sold Qty: ${total_products_sold}, Revenue: ₹${total_revenue_sold}, Payout: ₹${total_sold_dealer_payout}, Profit: ₹${total_net_profit_sold}`);

    return {
        dealer,
        products: formattedProducts,
        financial_summary: {
            total_inventory_mrp,
            total_dealer_base_value,
            total_potential_admin_profit
        },
        sold_financial_summary: {
            total_products_sold,
            total_revenue_sold,
            total_sold_dealer_payout,
            total_net_profit_sold
        }
    };
};

/**
 * ============================================================================
 * SERVICE 3: ADD NEW DEALER (ADMIN FUNCTION)
 * ============================================================================
 */
const addDealerDB = async (dealerData) => {
    const { name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url } = dealerData;
    const [existingDealer] = await db.execute(`SELECT email FROM dealers WHERE email = ?`, [email]);
    
    if (existingDealer.length > 0) {
        throw new Error('A dealer with this email already exists in the system.');
    }

    const [result] = await db.execute(
        `INSERT INTO dealers (name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [name, email, phone || null, razorpay_linked_account_id || null, commission_percentage || 0, status || 'active', image_url || null]
    );
    return result.insertId;
};

/**
 * ============================================================================
 * SERVICE 4: UPDATE DEALER (ADMIN FUNCTION)
 * ============================================================================
 */
const updateDealerDB = async (dealerId, dealerData) => {
    const { name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url } = dealerData;
    const [existing] = await db.execute(`SELECT dealer_id FROM dealers WHERE dealer_id = ?`, [dealerId]);
    if (existing.length === 0) {
        throw new Error('Dealer not found in the system.');
    }

    if (image_url) {
        await db.execute(
            `UPDATE dealers SET name = ?, email = ?, phone = ?, razorpay_linked_account_id = ?, commission_percentage = ?, status = ?, image_url = ? WHERE dealer_id = ?`,
            [name, email, phone || null, razorpay_linked_account_id || null, commission_percentage || 0, status || 'active', image_url, dealerId]
        );
    } else {
        await db.execute(
        `UPDATE dealers 
         SET name = ?, email = ?, phone = ?, razorpay_linked_account_id = ?, commission_percentage = ?, status = ? 
         WHERE dealer_id = ?`,
        [name, email, phone || null, razorpay_linked_account_id || null, commission_percentage || 0, status || 'active', dealerId]
    );
    }
    return true;
};

module.exports = {
    getBasicDealerListDB,
    fetchAdminDealerDetailService,
    addDealerDB,
    updateDealerDB
};