import Coupon from "../models/coupon.js";
import ErrorHandler from "../utils/errorHandler.js";
import catchAsyncErrors from "../middleware/catchAsyncErrors.js";
import { logAdminAction } from "../utils/auditLog.js";

const PERCENTAGE_MAX = 100;
const FLAT_MAX = 99999; // mirrors product.price's existing max

// ---- Admin CRUD ----

// Create a coupon   =>   POST /api/v1/admin/coupon/new
export const createCoupon = catchAsyncErrors(async (req, res, next) => {
    const { discountType, discountValue } = req.body;

    if (discountType === "percentage" && discountValue > PERCENTAGE_MAX) {
        return next(
            new ErrorHandler(
                `Percentage discount cannot exceed ${PERCENTAGE_MAX}`,
                400
            )
        );
    }

    if (discountType === "flat" && discountValue > FLAT_MAX) {
        return next(
            new ErrorHandler(`Flat discount cannot exceed ${FLAT_MAX}`, 400)
        );
    }

    const coupon = await Coupon.create(req.body);

    await logAdminAction({
        admin: req.user,
        action: "coupon.create",
        targetType: "Coupon",
        targetId: coupon._id,
        details: { code: coupon.code },
    });

    res.status(201).json({ success: true, coupon });
});

// List all coupons (admin)   =>   GET /api/v1/admin/coupons
export const getAllCoupons = catchAsyncErrors(async (req, res, next) => {
    const coupons = await Coupon.find();
    res.status(200).json({ success: true, coupons });
});

// Get single coupon (admin)   =>   GET /api/v1/admin/coupon/:id
export const getSingleCoupon = catchAsyncErrors(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
        return next(new ErrorHandler("Coupon not found", 404));
    }
    res.status(200).json({ success: true, coupon });
});

// Update a coupon (admin)   =>   PUT /api/v1/admin/coupon/:id
export const updateCoupon = catchAsyncErrors(async (req, res, next) => {
    let coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
        return next(new ErrorHandler("Coupon not found", 404));
    }

    const discountType = req.body.discountType || coupon.discountType;
    const discountValue =
        req.body.discountValue !== undefined
            ? req.body.discountValue
            : coupon.discountValue;

    if (discountType === "percentage" && discountValue > PERCENTAGE_MAX) {
        return next(
            new ErrorHandler(
                `Percentage discount cannot exceed ${PERCENTAGE_MAX}`,
                400
            )
        );
    }

    if (discountType === "flat" && discountValue > FLAT_MAX) {
        return next(
            new ErrorHandler(`Flat discount cannot exceed ${FLAT_MAX}`, 400)
        );
    }

    coupon = await Coupon.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
    });

    await logAdminAction({
        admin: req.user,
        action: "coupon.update",
        targetType: "Coupon",
        targetId: coupon._id,
        details: { updatedFields: Object.keys(req.body) },
    });

    res.status(200).json({ success: true, coupon });
});

// Delete a coupon (admin)   =>   DELETE /api/v1/admin/coupon/:id
export const deleteCoupon = catchAsyncErrors(async (req, res, next) => {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) {
        return next(new ErrorHandler("Coupon not found", 404));
    }

    await coupon.deleteOne();

    await logAdminAction({
        admin: req.user,
        action: "coupon.delete",
        targetType: "Coupon",
        targetId: req.params.id,
        details: { code: coupon.code },
    });

    res.status(200).json({ success: true, message: "Coupon deleted" });
});

// ---- Public: validate + apply a coupon ----

// Validates a coupon code against a client-supplied cart subtotal and
// returns the SERVER-COMPUTED discount amount + resulting total. The
// frontend must treat this response's discountAmount/newTotal as the source
// of truth - it must never compute or submit its own discount amount at
// order-creation time (consistent with newOrder's existing
// never-trust-frontend-pricing rule from checkpoint2). This endpoint itself
// does not create an order or mark the coupon as used - it is a
// dry-run/preview. Actual redemption (incrementing timesUsed) should happen
// at order-creation time in a future reply once coupon fields are wired
// into the order flow, to avoid incrementing usage for previews that never
// convert to a real order.
//   =>   POST /api/v1/coupon/apply
export const applyCoupon = catchAsyncErrors(async (req, res, next) => {
    const { code, cartTotal } = req.body;

    if (!code || typeof code !== "string") {
        return next(new ErrorHandler("Please provide a coupon code", 400));
    }

    const numericCartTotal = Number(cartTotal);
    if (!Number.isFinite(numericCartTotal) || numericCartTotal < 0) {
        return next(new ErrorHandler("Invalid cart total", 400));
    }

    const coupon = await Coupon.findOne({ code: code.trim().toUpperCase() });

    if (!coupon) {
        return next(new ErrorHandler("Invalid coupon code", 404));
    }

    if (!coupon.isCurrentlyValid()) {
        return next(
            new ErrorHandler("This coupon is expired or no longer active", 400)
        );
    }

    if (numericCartTotal < coupon.minOrderAmount) {
        return next(
            new ErrorHandler(
                `This coupon requires a minimum order amount of ${coupon.minOrderAmount}`,
                400
            )
        );
    }

    let discountAmount;
    if (coupon.discountType === "percentage") {
        discountAmount = (numericCartTotal * coupon.discountValue) / 100;
        if (coupon.maxDiscountAmount !== null) {
            discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
        }
    } else {
        discountAmount = coupon.discountValue;
    }

    // Never let a discount exceed the cart total (no negative totals).
    discountAmount = Math.min(discountAmount, numericCartTotal);
    discountAmount = Math.round(discountAmount * 100) / 100;

    const newTotal = Math.round((numericCartTotal - discountAmount) * 100) / 100;

    res.status(200).json({
        success: true,
        code: coupon.code,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        discountAmount,
        newTotal,
    });
});
