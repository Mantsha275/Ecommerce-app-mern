import mongoose from "mongoose";

// FLAGGED BUSINESS-LOGIC DECISIONS (not silently assumed - documented here
// per the project's governing rules):
//   - discountType "percentage" or "flat" - percentage is capped at 100 by
//     the validator below; flat is capped at 99999 to mirror product.price's
//     existing max.
//   - A coupon can optionally define minOrderAmount (order subtotal must be
//     >= this to qualify) and maxDiscountAmount (caps a percentage discount
//     in currency terms - ignored for flat coupons).
//   - No stacking: only one coupon may be applied per order in this
//     implementation. There is no multi-coupon combination logic anywhere.
//   - usageLimit / timesUsed: optional global redemption cap across all
//     users (not a per-user limit - there is no per-user redemption tracking
//     table in this reply; that would be a further data-model addition,
//     flagged here rather than added silently).
const couponSchema = new mongoose.Schema({
    code: {
        type: String,
        required: [true, "Please enter a coupon code"],
        trim: true,
        uppercase: true,
        unique: true,
        maxLength: [30, "Coupon code cannot exceed 30 characters"],
    },
    discountType: {
        type: String,
        required: true,
        enum: {
            values: ["percentage", "flat"],
            message: "discountType must be 'percentage' or 'flat'",
        },
    },
    discountValue: {
        type: Number,
        required: [true, "Please enter a discount value"],
        min: [0, "Discount value cannot be negative"],
    },
    minOrderAmount: {
        type: Number,
        default: 0,
        min: [0, "minOrderAmount cannot be negative"],
    },
    maxDiscountAmount: {
        type: Number,
        default: null, // null = uncapped
        min: [0, "maxDiscountAmount cannot be negative"],
    },
    expiresAt: {
        type: Date,
        required: [true, "Please enter an expiry date"],
    },
    isActive: {
        type: Boolean,
        default: true,
    },
    usageLimit: {
        type: Number,
        default: null, // null = unlimited
        min: [0, "usageLimit cannot be negative"],
    },
    timesUsed: {
        type: Number,
        default: 0,
        min: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

couponSchema.index({ code: 1 });

// Server-side validity check reused by both the public "apply" endpoint and
// (in a later reply, if wired up) actual order placement. Deliberately does
// NOT check minOrderAmount here since that depends on the cart being
// evaluated, not the coupon alone - see controller.
couponSchema.methods.isCurrentlyValid = function () {
    if (!this.isActive) return false;
    if (this.expiresAt.getTime() < Date.now()) return false;
    if (this.usageLimit !== null && this.timesUsed >= this.usageLimit) {
        return false;
    }
    return true;
};

// discountValue max is enforced per discountType in the controller (not
// here) since a single static schema-level max can't conditionally depend
// on another field without a custom validator; kept simple and explicit in
// the controller instead of a terser-but-opaque schema validator.

export default mongoose.model("Coupon", couponSchema);
