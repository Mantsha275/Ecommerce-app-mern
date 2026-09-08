import Order from "../models/order.js";
import Product from "../models/product.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import { logAdminAction } from "../utils/auditLog.js";

// Business rules mirrored from the frontend's confirmOrder calculation
// (kept identical on purpose - see Phase 30: don't silently change existing
// business logic, only make it server-authoritative).
const SHIPPING_THRESHOLD = 200;
const SHIPPING_COST = 25;
const TAX_RATE = 0.05;

// Create a new order   =>  /api/v1/order/new
// SECURITY FIX (Phase 10): the original implementation trusted
// itemsPrice/taxPrice/shippingPrice/totalPrice and even orderItems[].price
// straight from req.body, which a malicious client could edit freely before
// submitting. The server now re-derives every price from the database.
export const newOrder = catchAsyncErrors(async (req, res, next) => {
    const { orderItems, shippingInfo, paymentInfo } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
        return next(new ErrorHandler("No order items provided", 400));
    }

    let itemsPrice = 0;
    const verifiedOrderItems = [];

    for (const item of orderItems) {
        const product = await Product.findById(item.product);

        if (!product) {
            return next(
                new ErrorHandler(`Product not found: ${item.product}`, 404)
            );
        }

        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity < 1) {
            return next(
                new ErrorHandler(
                    `Invalid quantity for product: ${product.name}`,
                    400
                )
            );
        }

        if (product.stock < quantity) {
            return next(
                new ErrorHandler(
                    `${product.name} does not have enough stock (available: ${product.stock})`,
                    400
                )
            );
        }

        // Price/name/image come from the DB, never from the client.
        itemsPrice += product.price * quantity;

        verifiedOrderItems.push({
            name: product.name,
            quantity,
            image: product.images[0]?.url || "",
            price: product.price,
            product: product._id,
        });
    }

    const shippingPrice = itemsPrice > SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
    const taxPrice = Number((TAX_RATE * itemsPrice).toFixed(2));
    const totalPrice = Number(
        (itemsPrice + shippingPrice + taxPrice).toFixed(2)
    );

    const order = await Order.create({
        orderItems: verifiedOrderItems,
        shippingInfo,
        itemsPrice: Number(itemsPrice.toFixed(2)),
        taxPrice,
        shippingPrice,
        totalPrice,
        paymentInfo,
        paidAt: Date.now(),
        user: req.user._id,
    });

    // Decrement stock now that the order is confirmed. Using a for...of loop
    // (not forEach) so each await is actually respected in sequence, and an
    // atomic update so we never let stock go negative under concurrent orders.
    for (const item of verifiedOrderItems) {
        await Product.updateOne(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } }
        );
    }

    res.status(200).json({
        success: true,
        order,
    });
});

// Get logged in user orders   =>   /api/v1/orders/me
export const myOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find({ user: req.user.id });

    res.status(200).json({
        success: true,
        orders,
    });
});

// Get single order   =>   /api/v1/order/:id
// SECURITY FIX (Phase 9 - IDOR): the original code fetched any order by ID
// with no ownership check, so a logged-in user could read any other user's
// order just by guessing/incrementing the ID. Now a non-admin may only view
// their own order.
export const getSingleOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id).populate(
        "user",
        "name email"
    );

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }

    const isOwner = order.user._id.toString() === req.user.id.toString();
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
        return next(
            new ErrorHandler("You are not authorized to view this order", 403)
        );
    }

    res.status(200).json({
        success: true,
        order,
    });
});

// ---- Admin ----

// Get all orders - ADMIN  =>   /api/v1/admin/orders/
export const allOrders = catchAsyncErrors(async (req, res, next) => {
    const orders = await Order.find();

    let totalAmount = 0;
    orders.forEach((order) => {
        totalAmount += order.totalPrice;
    });

    res.status(200).json({
        success: true,
        totalAmount,
        orders,
    });
});

// Update / Process order - ADMIN  =>   /api/v1/admin/order/:id
// BUG FIX: the original stock-update loop used `order.orderItems.forEach(async ...)`,
// which does NOT wait for the async callbacks to finish - `order.save()` could
// run before stock was actually updated, and any error inside the loop was
// silently swallowed. Also added a valid orderStatus check and a guard
// against decrementing stock twice if an order is processed more than once
// before reaching "Delivered".
export const updateOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }

    if (order.orderStatus === "Delivered") {
        return next(
            new ErrorHandler("You have already delivered this order", 400)
        );
    }

    const { status } = req.body;
    const validStatuses = ["Processing", "Shipped", "Delivered"];

    if (!validStatuses.includes(status)) {
        return next(new ErrorHandler("Please provide a valid order status", 400));
    }

    const previousStatus = order.orderStatus;
    order.orderStatus = status;

    if (status === "Delivered") {
        order.deliveredAt = Date.now();
    }

    await order.save();

    // AUDIT LOG (Reply 5): fire-and-awaited but never blocks/fails the
    // actual status update above - see utils/auditLog.js.
    await logAdminAction({
        admin: req.user,
        action: "order.updateStatus",
        targetType: "Order",
        targetId: order._id,
        details: { from: previousStatus, to: status },
    });

    res.status(200).json({
        success: true,
    });
});

// Delete order   =>   /api/v1/admin/order/:id
export const deleteOrder = catchAsyncErrors(async (req, res, next) => {
    const order = await Order.findById(req.params.id);

    if (!order) {
        return next(new ErrorHandler("No Order found with this ID", 404));
    }

    // BUG FIX: `.remove()` was deprecated and removed in Mongoose 6+.
    await order.deleteOne();

    await logAdminAction({
        admin: req.user,
        action: "order.delete",
        targetType: "Order",
        targetId: req.params.id,
        details: { totalPrice: order.totalPrice, orderStatus: order.orderStatus },
    });

    res.status(200).json({
        success: true,
    });
});
