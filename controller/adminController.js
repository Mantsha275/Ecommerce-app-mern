import Order from "../models/order.js";
import Product from "../models/product.js";
import User from "../models/user.js";
import AuditLog from "../models/auditLog.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";

// Mirrors the frontend's LOW_STOCK_THRESHOLD constant (currently hardcoded
// separately in Product.js / SingleProduct.js / ProductsList.js - see Reply
// 4B/4C notes). FLAGGED (carried forward, not new): this value now lives in
// FOUR places (three frontend files + here) with no single source of
// truth. Not fixed in this reply since making it configurable was already
// flagged in 4B/4C as needing a product-model field - fixing it here alone
// would just add a fifth inconsistent copy. Kept numerically identical to
// avoid the dashboard and the shop UI disagreeing about what "low stock"
// means.
const LOW_STOCK_THRESHOLD = 5;

// NEW ENDPOINT (flagged per Reply 5 plan: "flag any new backend endpoint
// needed"). The existing admin endpoints (allOrders, getAdminProducts,
// allUsers) each return full unpaginated document arrays for their own
// list-view UIs - reusing them here would mean pulling every order/product/
// user document over the wire just to compute a few counts/sums. Instead
// this does small server-side aggregations directly, admin-only.
//   =>   GET /api/v1/admin/dashboard/stats
export const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
    const [
        totalOrders,
        totalUsers,
        totalProducts,
        revenueAgg,
        lowStockCount,
        outOfStockCount,
        recentOrders,
    ] = await Promise.all([
        Order.countDocuments(),
        User.countDocuments(),
        Product.countDocuments(),
        // Revenue = sum of totalPrice across all orders that were actually
        // paid/placed. Every order in this schema is created post-payment
        // (see newOrder in orderController.js - there's no "cart"/"pending"
        // order status), so no orderStatus filter is applied here. FLAGGED:
        // if a "cancelled" or "refunded" order status is ever introduced,
        // this aggregation should exclude it - not done here since that
        // status doesn't exist yet in models/order.js.
        Order.aggregate([
            { $group: { _id: null, total: { $sum: "$totalPrice" } } },
        ]),
        Product.countDocuments({
            stock: { $gt: 0, $lte: LOW_STOCK_THRESHOLD },
        }),
        Product.countDocuments({ stock: 0 }),
        Order.find()
            .sort({ createdAt: -1 })
            .limit(5)
            .select("orderStatus totalPrice createdAt user")
            .populate("user", "name email"),
    ]);

    const totalRevenue = revenueAgg[0]?.total || 0;

    res.status(200).json({
        success: true,
        stats: {
            totalOrders,
            totalUsers,
            totalProducts,
            totalRevenue,
            lowStockCount,
            outOfStockCount,
            lowStockThreshold: LOW_STOCK_THRESHOLD,
        },
        recentOrders,
    });
});

// NEW ENDPOINT - paginated audit log listing (admin only).
// Bespoke pagination rather than reusing utils/apiFeatures.js: that class's
// filter()/search() are hard-coded to product-shaped fields (price,
// ratings, category, stock, a "name" text search) and would need to be
// generalized or duplicated to fit AuditLog's fields - simple manual
// page/limit here avoids either coupling this to product filtering or
// forking the shared utility for one endpoint. FLAGGED as a deliberate
// choice, not an oversight.
//   =>   GET /api/v1/admin/audit-logs?page=1&limit=20
const MAX_LIMIT = 100;

export const getAuditLogs = catchAsyncErrors(async (req, res, next) => {
    let page = Number(req.query.page) || 1;
    if (page < 1) page = 1;

    let limit = Number(req.query.limit) || 20;
    if (limit < 1) limit = 20;
    if (limit > MAX_LIMIT) limit = MAX_LIMIT;

    const skip = limit * (page - 1);

    const [logs, totalCount] = await Promise.all([
        AuditLog.find().sort({ createdAt: -1 }).skip(skip).limit(limit),
        AuditLog.countDocuments(),
    ]);

    res.status(200).json({
        success: true,
        logs,
        totalCount,
        page,
        limit,
    });
});
