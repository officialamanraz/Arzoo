const db = require('../DATABASE/mysql');
const { getFullImageUrl } = require('../utils/imageUtils');

/**
 * ============================================================================
 * SERVICE 1: FETCH MASTER DEALER REPORTS (ALL DEALERS)
 * ============================================================================
 */
const getBasicDealerListDB = async () => {
    console.log('[DEALER_SERVICE] 📋 [START] Fetching basic dealer list...');
    try {
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
    } catch (err) {
        console.error('[DEALER_SERVICE] ❌ Error in getBasicDealerListDB:', err.message);
        throw err;
    }
};

/**
 * ============================================================================
 * SERVICE 2: FETCH ADMIN DEALER DETAILS (SPECIFIC DEALER INVENTORY & SOLD SUMMARY)
 * ============================================================================
 */
const fetchAdminDealerDetailService = async (dealerId) => {
    console.log(`[DEALER_SERVICE_DETAIL] 🔍 [START] Fetching profile & inventory for Dealer ID: ${dealerId}...`);
    try {
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

        const formattedProducts = products.map((prod) => {
            const stockQty = Number(prod.stock_qty || 0);
            const sellingPrice = Number(prod.price || 0);
            const packing = Number(prod.packaging_cost || 0);
            
            // 1. Dealer Base sidha database wale column se lenge
            const effectiveDealerBase = Number(prod.dealer_base_price || 0);
            
            // 2. Admin profit sidha margin hoga (Selling Price - Base Price). Packaging ignore kar diya hai profit deduction se.
            const effectiveAdminProfit = sellingPrice - effectiveDealerBase;

            if (stockQty > 0) {
                // Total Inventory mein ab 'Selling Price' jodenge taaki total hisaab match ho
                total_inventory_mrp += (sellingPrice * stockQty); 
                total_dealer_base_value += (effectiveDealerBase * stockQty);
                total_potential_admin_profit += (effectiveAdminProfit * stockQty);
            }

            return {
                ...prod,
                dealer_base_price: effectiveDealerBase,
                admin_profit: effectiveAdminProfit,  // Pass to frontend for product card display
                packaging_cost: packing,             // Passing just for display info
                image_url: getFullImageUrl(prod.image_url) 
            };
        });

        // D. Calculate Sold Items Accountability Summary
        console.log(`[DEALER_SERVICE_DETAIL] 🧮 Calculating Sold Items Accountability Summary...`);
        
        const [soldItemsResult] = await db.execute(
            `SELECT 
                SUM(oi.quantity) as total_products_sold,
                SUM(oi.unit_price * oi.quantity) as total_revenue_sold,
                SUM(p.dealer_base_price * oi.quantity) as total_sold_dealer_payout
             FROM orderitems oi
             INNER JOIN products p ON oi.product_id = p.product_id
             INNER JOIN orders o ON oi.order_id = o.order_id
             WHERE p.dealer_id = ? AND o.status NOT IN ('cancelled', 'refunded')`,
            [dealerId]
        );

        const soldData = soldItemsResult[0] || {};
        const total_products_sold = Number(soldData.total_products_sold || 0);
        const total_revenue_sold = Number(soldData.total_revenue_sold || 0);
        const total_sold_dealer_payout = Number(soldData.total_sold_dealer_payout || 0);
        
        // 🌟 NEW REQUIREMENT: Calculate Razorpay Gateway Fee Cut (2% + 18% GST = 2.36%) based on total selling price.
        const total_gateway_fees_cut = (total_revenue_sold * 0.02) * 1.18;

        // Note: As requested, the gateway fee is NOT deducted from the profit variable here.
        const total_net_profit_sold = total_revenue_sold - total_sold_dealer_payout;

        console.log(`[DEALER_SERVICE_DETAIL] ✅ Sold Summary -> Sold Qty: ${total_products_sold}, Revenue: ₹${total_revenue_sold}, Payout: ₹${total_sold_dealer_payout}, Razorpay Cut: ₹${total_gateway_fees_cut}, Gross Profit: ₹${total_net_profit_sold}`);

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
                total_net_profit_sold,
                total_gateway_fees_cut // Passed to frontend to display
            }
        };
    } catch (err) {
        console.error(`[DEALER_SERVICE_DETAIL] ❌ Error processing details for dealer ${dealerId}:`, err.message);
        throw err;
    }
};

/**
 * ============================================================================
 * SERVICE 3: ADD NEW DEALER (ADMIN FUNCTION)
 * ============================================================================
 */
const addDealerDB = async (dealerData) => {
    console.log(`[DEALER_SERVICE] ➕ Adding new dealer: ${dealerData.email}`);
    try {
        const { name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url } = dealerData;
        const [existingDealer] = await db.execute(`SELECT email FROM dealers WHERE email = ?`, [email]);
        
        if (existingDealer.length > 0) {
            console.warn(`[DEALER_SERVICE] ⚠️ Dealer with email ${email} already exists.`);
            throw new Error('A dealer with this email already exists in the system.');
        }

        const [result] = await db.execute(
            `INSERT INTO dealers (name, email, phone, razorpay_linked_account_id, commission_percentage, status, image_url) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [name, email, phone || null, razorpay_linked_account_id || null, commission_percentage || 0, status || 'active', image_url || null]
        );
        console.log(`[DEALER_SERVICE] ✅ Dealer successfully added. ID: ${result.insertId}`);
        return result.insertId;
    } catch (err) {
        console.error('[DEALER_SERVICE] ❌ Error in addDealerDB:', err.message);
        throw err;
    }
};

/**
 * ============================================================================
 * SERVICE 4: UPDATE DEALER (ADMIN FUNCTION)
 * ============================================================================
 */
const updateDealerDB = async (dealerId, dealerData) => {
    console.log(`[DEALER_SERVICE] 🔄 Updating dealer ID: ${dealerId}`);
    try {
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
        console.log(`[DEALER_SERVICE] ✅ Dealer ID: ${dealerId} successfully updated.`);
        return true;
    } catch (err) {
        console.error(`[DEALER_SERVICE] ❌ Error in updateDealerDB for ID ${dealerId}:`, err.message);
        throw err;
    }
};

module.exports = {
    getBasicDealerListDB,
    fetchAdminDealerDetailService,
    addDealerDB,
    updateDealerDB
};