const db = require('../DATABASE/mysql');

const getDealerReportDB = async () => {
    // 1. Fetch all dealers
    const [dealers] = await db.execute(`SELECT * FROM dealers ORDER BY created_at DESC`);

    const reportData = [];

    for (let dealer of dealers) {
        const dealerId = dealer.dealer_id;

        // 2. Fetch products for this dealer
        const [products] = await db.execute(
            `SELECT product_id, name, price, stock_quantity FROM products WHERE dealer_id = ?`,
            [dealerId]
        );

        // 3. Fetch orders containing this dealer's products
        const [orders] = await db.execute(
            `SELECT o.order_id, o.payment_status, o.status as order_status, o.created_at,
                    oi.product_id, oi.product_name, oi.quantity, oi.unit_price,
                    (oi.quantity * oi.unit_price) as total_item_price
             FROM orderitems oi
             INNER JOIN orders o ON oi.order_id = o.order_id
             INNER JOIN products p ON oi.product_id = p.product_id
             WHERE p.dealer_id = ?
             ORDER BY o.created_at DESC`,
            [dealerId]
        );

        // 4. Calculate Gross Revenue and Dealer Share (Only for PAID orders)
        let grossRevenue = 0;
        let uniqueOrders = new Set();

        orders.forEach(order => {
            uniqueOrders.add(order.order_id);
            if (order.payment_status === 'paid') {
                grossRevenue += Number(order.total_item_price);
            }
        });

        const totalOrdersCount = uniqueOrders.size;
        
        // Calculate shares
        const commissionPercent = Number(dealer.commission_percentage);
        const dealerShare = grossRevenue * ((100 - commissionPercent) / 100);

        // 5. Fetch actual amount transferred to this dealer via Razorpay Route
        const [transfers] = await db.execute(
            `SELECT COALESCE(SUM(amount), 0) as total_paid
             FROM dealer_transfers
             WHERE dealer_id = ? AND status = 'processed'`,
            [dealerId]
        );
        const actualTransferred = transfers.length > 0 ? Number(transfers[0].total_paid) : 0;

        // 6. Bundle everything
        reportData.push({
            dealer_info: dealer,
            stats: {
                total_products: products.length,
                total_orders: totalOrdersCount,
                gross_revenue: grossRevenue,
                dealer_share: dealerShare,
                actual_transferred: actualTransferred
            },
            products_list: products,
            orders_list: orders 
        });
    }

    return reportData;
};

module.exports = { getDealerReportDB };